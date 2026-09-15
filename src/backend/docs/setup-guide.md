# PortPulse Backend — Setup Guide

## Prerequisites

- Python 3.9+
- Person 1's ML pipeline executed (`../AI/ML/run.py all`)
- Optional: PostgreSQL (SQLite used for local development)

## Installation

### 1. Clone Repository

```bash
cd src/backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Activate
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy example configuration
cp .env.example .env

# Edit .env if needed (for production/custom paths)
# For local development, defaults usually work
```

### 5. Ensure ML Models Exist

Person 1's ML pipeline must have been run:

```bash
# From ML directory:
cd ../AI/ML
python run.py all

# This creates:
# - models/*.json (trained XGBoost models)
# - data/processed/*.parquet (engineered features)
```

If models don't exist, backend will fail on first prediction call.

### 6. Initialize Database

```bash
# Database is auto-initialized on first startup
# If you want to manually init:
python -c "from app.database.connection import init_db; init_db()"
```

### 7. Run Backend

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Or use the shorthand:

```bash
# If you prefer direct execution
python app/main.py
```

### 8. Verify Installation

Open browser and go to:

```
http://localhost:8001/docs
```

You should see the interactive API documentation (Swagger UI).

Test the health endpoint:

```bash
curl http://localhost:8001/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-09-13T12:00:00.000Z",
  "version": "1.0.0",
  "database": "ok",
  "ml_service": "ok"
}
```

## Quick Start Demo

### 1. Check Ports

```bash
curl http://localhost:8001/api/v1/ports
```

### 2. Get Port Status

```bash
curl http://localhost:8001/api/v1/ports/port235/status
```

### 3. Get Congestion Forecast

```bash
curl http://localhost:8001/api/v1/congestion/forecast/port235
```

### 4. Run Optimization

```bash
curl -X POST http://localhost:8001/api/v1/optimization/run \
  -H "Content-Type: application/json" \
  -d '{
    "port_id": "port235",
    "planning_horizon_hours": 72
  }'
```

### 5. Generate 72-Hour Plan

```bash
curl -X POST http://localhost:8001/api/v1/plans/72-hours/generate \
  -H "Content-Type: application/json" \
  -d '{
    "port_id": "port235",
    "horizon_hours": 72
  }'
```

## Configuration

### Database Selection

#### Development (SQLite - Default)

No configuration needed. Uses `./portpulse.db`

```
DATABASE_URL=sqlite:///./portpulse.db
```

#### Production (PostgreSQL)

Edit `.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/portpulse
```

Create database:

```bash
psql -c "CREATE DATABASE portpulse;"
```

### Optimization Parameters

In `.env`:

```bash
# Solver timeout in seconds
OPTIMIZATION_TIMEOUT_SECONDS=30

# Enable solver logging
OPTIMIZATION_LOG_SEARCH=false
```

### ML Model Paths

In `.env` (usually don't need to change):

```bash
ML_MODEL_PATH=../AI/ML/models
ML_DATA_PATH=../AI/ML/data/processed
```

### API Configuration

In `.env`:

```bash
API_HOST=0.0.0.0      # Listen on all interfaces
API_PORT=8001          # HTTP port
API_DEBUG=false         # Disable debug mode for production
```

### Operational Constraints (Assumptions)

In `.env`:

```bash
# These are configurable assumptions, not actual data
BERTH_COUNT_DEFAULT=5
CRANE_COUNT_DEFAULT=10
SERVICE_TIME_DEFAULT_HOURS=24
VESSEL_BERTH_COMPATIBILITY_STRICT=false
```

## Testing

### Run Test Suite

```bash
pytest tests/ -v
```

### Run Specific Test

```bash
pytest tests/test_api.py::test_health_check -v
```

### With Coverage Report

```bash
pytest tests/ --cov=app --cov-report=html
```

Open `htmlcov/index.html` to view coverage.

## Troubleshooting

### Issue: "FileNotFoundError: Model not found"

**Cause:** Person 1's ML models haven't been generated

**Solution:**
```bash
cd ../AI/ML
python run.py all
```

### Issue: "database is locked"

**Cause:** SQLite doesn't handle concurrent writes well

**Solution:** Use PostgreSQL for production/concurrent use

### Issue: Optimization times out

**Cause:** Complex problem or tight timeout

**Solution:** Increase `OPTIMIZATION_TIMEOUT_SECONDS` in `.env`

### Issue: "No vessels scheduled in planning horizon"

**Cause:** No vessel schedules exist in database for next 72 hours

**Solution:** Need to add vessel schedules. For demo, they're auto-created or use manual seeding script (see below)

### Issue: ML service shows "degraded" in health check

**Cause:** Model loading issue

**Check logs** for specific error message. Verify:
1. Model files exist in `ML_MODEL_PATH`
2. Feature files exist in `ML_DATA_PATH`
3. Person 1's pipeline completed successfully

## Demo Data Setup

For demonstration purposes, you can seed the database with sample data:

```bash
python -c "from app.database.seed import seed_demo_data; seed_demo_data()"
```

This creates:
- Sample ports, berths, cranes
- Sample vessels
- Sample vessel schedules for next 72 hours

## API Documentation

### Interactive Docs (Swagger UI)

```
http://localhost:8001/docs
```

- Try out endpoints interactively
- See request/response schemas
- Copy curl commands

### ReDoc

```
http://localhost:8001/redoc
```

Alternative API documentation in RedOc format

### OpenAPI JSON

```
http://localhost:8001/openapi.json
```

Raw OpenAPI 3.0 schema

## Environment Checklist

Before going to production:

- [ ] Python 3.9+ installed and confirmed
- [ ] Virtual environment activated
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` configured for your environment
- [ ] Database configured (PostgreSQL recommended)
- [ ] ML models present and accessible
- [ ] `API_DEBUG=false` set in `.env`
- [ ] CORS properly configured (not `*`)
- [ ] Database credentials secured
- [ ] Backup strategy planned
- [ ] Monitoring/logging configured
- [ ] Rate limiting enabled
- [ ] HTTPS/TLS configured

## Directory Structure After Installation

```
src/backend/
├── venv/                    # Python virtual environment
├── app/                     # Application source
│   ├── main.py
│   ├── core/
│   ├── database/
│   ├── models/
│   ├── services/
│   └── api/
├── tests/
├── docs/
├── portpulse.db            # SQLite database (local dev)
├── .env                    # Your configuration
├── .env.example
├── requirements.txt
└── README.md
```

## Database Migration (Future)

When schema changes are needed:

```bash
# (When Alembic migrations are set up)
alembic upgrade head
```

For now, the schema is created automatically on first startup.

## Logs

### Console Output

Logs to stdout with format:
```
2025-09-13 12:00:00 - portpulse.app - INFO - PortPulse Backend starting...
```

### Log Levels

Default: INFO

To enable DEBUG:

```bash
# Set in code or environment
API_DEBUG=true
```

## Performance Tips

### Optimize OR-Tools Solver

For faster optimization on simple problems:

```
# In .env
OPTIMIZATION_TIMEOUT_SECONDS=10  # Reduce timeout for fast feedback
OPTIMIZATION_LOG_SEARCH=false     # Disable verbose logging
```

### Database Optimization

```sql
-- Create indexes (after first run)
CREATE INDEX idx_vessel_schedule_eta ON vessel_schedules(eta);
CREATE INDEX idx_congestion_pred_port ON congestion_predictions(port_id, timestamp);
CREATE INDEX idx_optimization_run_port ON optimization_runs(port_id);
```

### Caching

For production, add Redis caching layer (not yet implemented):

```python
# Future enhancement
redis_client.get("forecast:port235:24h")
```

## Backup Strategy

### Database Backup (SQLite)

```bash
# Simple copy
cp portpulse.db portpulse.db.backup.$(date +%Y%m%d)
```

### PostgreSQL Backup

```bash
pg_dump portpulse > portpulse_backup.sql
```

## Support & Documentation

- **Architecture:** See `docs/architecture.md`
- **API Contract:** See `docs/api-contract.md`
- **ML Integration:** See `../AI/ML/README.md`

## Next Steps

1. **Explore API:** Use `/docs` to test all endpoints
2. **Test Optimization:** Run POST /optimization/run
3. **Generate Plans:** Use POST /plans/72-hours/generate
4. **Try Scenarios:** Test POST /scenarios/what-if
5. **Connect Bob:** Use MCP tools at /api/v1/mcp/
6. **Customize:** Modify operational constraints in `.env`
7. **Deploy:** See deployment section in architecture.md

## Questions?

Refer to the hackathon specification and this guide's troubleshooting section.
