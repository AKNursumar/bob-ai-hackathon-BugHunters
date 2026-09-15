# PortPulse Backend

> Port Operations Optimization Engine with ML-Based Congestion Prediction

**Part of:** IBM Bob AI Innovation Hackathon | BugHunters100  
**Team Role:** Backend Architecture & Integration  
**Component:** Person 2 (Backend Specialist)

## Overview

PortPulse Backend is a production-ready service that:

1. **Predicts port congestion** using ML models (Person 1's XGBoost)
2. **Optimizes vessel scheduling** with constraint programming (OR-Tools)
3. **Generates 72-hour plans** for port supervisors
4. **Supports scenario analysis** (what-if simulations)
5. **Exposes tools to IBM Bob** via Model Context Protocol (MCP)

All predictions and recommendations are grounded in real data sources (IMF PortWatch) with clearly documented assumptions.

## Key Features

### ✅ ML Integration
- Wraps Person 1's trained XGBoost models
- 24h, 48h, 72h congestion forecasts
- Real IMF PortWatch vessel activity data
- Feature importance & driver explanation

### ✅ Optimization Engine
- Google OR-Tools constraint solver
- Minimizes vessel waiting time
- Respects berth/crane availability
- Produces baseline + optimized plans
- Quantifies improvements

### ✅ Operations Planning
- 72-hour schedule generation
- Hotspot identification
- Risk assessment per vessel/time window
- Conflict detection

### ✅ Scenario Simulation
- Vessel delay scenarios
- Crane/berth unavailability
- Isolated (non-destructive) simulations
- Impact quantification

### ✅ IBM Bob Integration
- 10 MCP tools
- Clean HTTP API
- Stateless tool calls
- Real-time decision support

## Quick Start

### Installation (5 minutes)

```bash
cd src/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Configure (optional - defaults work for local dev)
cp .env.example .env

# Verify ML models exist
# (Person 1's run.py all should have created ../AI/ML/models/*.json)

# Start backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Test Installation

```bash
# Health check
curl http://localhost:8001/api/v1/health

# Interactive docs
open http://localhost:8001/docs
```

## Architecture

```
IBM Bob
  ↓ (MCP Calls)
FastAPI REST API
  ├─ /api/v1/ports            (Port information)
  ├─ /api/v1/congestion       (Forecasts & hotspots)
  ├─ /api/v1/optimization     (Solver results)
  ├─ /api/v1/plans            (72-hour planning)
  └─ /api/v1/mcp              (MCP tool access)
  ↓
Services Layer
  ├─ PredictionService        (ML integration)
  ├─ OptimizationEngine       (OR-Tools)
  ├─ PortService              (Business logic)
  └─ MCPServer                (Tool implementations)
  ↓
Database Layer (SQLAlchemy)
  ├─ SQLite (dev)
  └─ PostgreSQL (prod)
```

See [docs/architecture.md](docs/architecture.md) for detailed architecture.

## API Endpoints

### Health
- `GET /api/v1/health` - Service status

### Ports
- `GET /api/v1/ports` - List ports
- `GET /api/v1/ports/{port_id}` - Port details
- `GET /api/v1/ports/{port_id}/status` - Operational status

### Congestion
- `GET /api/v1/congestion/forecast/{port_id}` - 24/48/72h forecasts
- `GET /api/v1/congestion/hotspots/{port_id}` - High-risk areas
- `GET /api/v1/congestion/current/{port_id}` - Current status

### Optimization
- `POST /api/v1/optimization/run` - Run optimization
- `GET /api/v1/optimization/{run_id}` - Get past results

### Planning
- `POST /api/v1/plans/72-hours/generate` - Generate plan
- `GET /api/v1/plans/{plan_id}` - Get plan
- `POST /api/v1/scenarios/what-if` - Run scenario

### MCP
- `GET /api/v1/mcp/tools` - List tools for Bob
- `POST /api/v1/mcp/tools/{tool_name}` - Call tool
- `GET /api/v1/mcp/status` - MCP status

See [docs/api-contract.md](docs/api-contract.md) for complete API specification.

## MCP Tools for IBM Bob

```
1. get_port_status           - Current port operational state
2. get_vessel_schedule       - Scheduled vessels
3. get_congestion_forecast   - 24/48/72h forecasts
4. get_congestion_hotspots   - High-risk areas & times
5. get_berth_status          - Berth availability
6. get_crane_status          - Crane availability
7. optimise_schedule         - Run vessel scheduling optimization
8. run_what_if               - Scenario simulation
9. generate_72_hour_plan     - Create 72-hour plan
10. explain_congestion       - Forecast explanation
```

Bob can ask:
```
"What is the status of JNPT?"
→ get_port_status

"Will congestion increase in 48 hours?"
→ get_congestion_forecast

"Which berths are at highest risk?"
→ get_congestion_hotspots

"Optimize the next 72 hours."
→ generate_72_hour_plan

"What if vessel V104 is delayed 6 hours?"
→ run_what_if

"Explain why congestion is predicted."
→ explain_congestion
```

## Data Flow Example

### Congestion Forecast Workflow

```
User/Bob: "Get forecast for port235"
  ↓
Backend:
  1. Load XGBoost model for port235_1d
  2. Load latest feature data (parquet file)
  3. Run inference → probability score
  4. Classify risk (LOW/MODERATE/HIGH/CRITICAL)
  5. Store in database
  6. Return {probability, risk_level, confidence, drivers}
```

### Optimization Workflow

```
User: "Optimize next 72 hours"
  ↓
Backend:
  1. Get scheduled vessels for 72h window
  2. Get berths and cranes
  3. Compute baseline (FIFO scheduling)
  4. Run OR-Tools solver (30s timeout)
  5. Store OptimizationRun record
  6. Return {baseline_plan, optimized_plan, improvement_%}
```

## Database Schema

Core tables:

- `ports` - Port entities
- `vessels` - Vessel registry
- `vessel_schedules` - ETAs and schedules
- `berths` - Dock/berth infrastructure
- `cranes` - Loading equipment
- `congestion_predictions` - ML forecast results
- `optimization_runs` - Solver execution records
- `assignments` - Vessel-to-berth assignments
- `operations_plans` - 72-hour plans
- `scenarios` - What-if results

## Configuration

### Environment Variables

See `.env.example` for complete list:

```bash
# Database
DATABASE_URL=sqlite:///./portpulse.db

# API
API_HOST=0.0.0.0
API_PORT=8001
API_DEBUG=false

# ML models
ML_MODEL_PATH=../AI/ML/models
ML_DATA_PATH=../AI/ML/data/processed

# Optimization
OPTIMIZATION_TIMEOUT_SECONDS=30

# Operational constraints (configurable assumptions)
BERTH_COUNT_DEFAULT=5
CRANE_COUNT_DEFAULT=10
SERVICE_TIME_DEFAULT_HOURS=24
```

## Testing

```bash
# Run full test suite
pytest tests/ -v

# Specific test
pytest tests/test_api.py::test_optimization_basic -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

## Deployment

### Local Development

```bash
# Terminal 1: Backend
python -m uvicorn app.main:app --reload --port 8001

# Terminal 2: Frontend (separate project)
npm start

# Terminal 3: Test with curl
curl http://localhost:8001/api/v1/health
```

### Docker

```bash
docker-compose up -d
```

See `Dockerfile` and `docker-compose.yml` for configuration.

### Production Checklist

- [ ] PostgreSQL database (not SQLite)
- [ ] `API_DEBUG=false`
- [ ] Secure database credentials
- [ ] CORS properly configured
- [ ] HTTPS/TLS enabled
- [ ] Rate limiting enabled
- [ ] Monitoring and logging configured
- [ ] Resource limits on solver
- [ ] Regular backups scheduled
- [ ] Security scanning in CI/CD

## Integration with Person 1's ML

The backend wraps Person 1's trained XGBoost models without modification.

### Expected Files

Person 1's pipeline must produce:

```
src/AI/ML/
├── models/
│   ├── port235_1d_model.json      # 24h Chennai
│   ├── port235_2d_model.json      # 48h Chennai
│   ├── port235_3d_model.json      # 72h Chennai
│   ├── port776_1d_model.json      # 24h JNPT
│   ├── port776_2d_model.json      # 48h JNPT
│   ├── port776_3d_model.json      # 72h JNPT
│   ├── port777_1d_model.json      # 24h Mundra
│   ├── port777_2d_model.json      # 48h Mundra
│   ├── port777_3d_model.json      # 72h Mundra
│   └── *_metadata.json            # Feature lists, etc.
└── data/processed/
    ├── port235_features.parquet
    ├── port776_features.parquet
    └── port777_features.parquet
```

Run Person 1's pipeline:

```bash
cd ../AI/ML
python run.py all
```

### Data Contract

Model inputs (features):
- `portcalls` - Daily vessel calls
- `portcalls_container/dry_bulk/tanker` - By type
- `import/export` volumes
- Rolling means (3d, 7d, 14d, 30d)
- Trend features (deltas, percentage change)

Model output:
- Probability of congestion (0-1)
- Risk classification (LOW/MODERATE/HIGH/CRITICAL)
- Feature importance scores

### Integration Code

```python
from app.services.prediction_service import predict_port

# Get forecast
result = predict_port("port235", horizons=[1, 2, 3])

# Access results
print(result["forecast"]["forecast_24h"]["probability"])   # 0.65
print(result["forecast"]["forecast_24h"]["risk"])          # "HIGH"
print(result["feature_importance"])                         # {feature: importance, ...}
```

## Optimization Engine

### OR-Tools Model

**Decision Variables:**
- Vessel start/end times (integer, in seconds)
- Berth assignments (discrete: 0 to num_berths-1)
- Crane allocations (count: 1 to max_cranes)

**Objective:**
```
Minimize: Σ(waiting_time[v] * priority_weight[v])
```

**Constraints:**
1. No overlapping intervals on same berth
2. Vessel ETA ≤ start time
3. End time = start time + service duration
4. Resource availability respected

### Solver Configuration

```python
solver_params = {
    "max_time_in_seconds": 30,      # Timeout
    "log_search_progress": False    # Disable verbosity
}
```

Adjustable via `OPTIMIZATION_TIMEOUT_SECONDS` in `.env`

## Documentation

- [Architecture](docs/architecture.md) - System design & components
- [API Contract](docs/api-contract.md) - Complete API specification
- [Setup Guide](docs/setup-guide.md) - Installation & configuration

## Ports

- **port235** - Chennai (Madras), East Coast
- **port776** - JNPT / Mumbai, West Coast (Nhava Sheva area)
- **port777** - Mundra, West Coast (largest private port)

Data source: [IMF PortWatch](https://services9.arcgis.com/weJ1QsnbMYJlCHdG/)

## Known Limitations

### Data
- Congestion is a **proxy** (portcalls / rolling_mean), not direct wait time
- No actual crane assignments in public data
- No berth capacity from public data (using assumptions)

### Predictions
- ML models trained on Jan 2019 - Sep 2026
- Precision/Recall: 0.19-0.33 (difficult problem)
- ROC-AUC: 0.58-0.64 (better than baseline)

### Optimization
- Simplified model (no detailed cargo/vessel type constraints)
- No inter-port coordination
- No service time optimization
- Single-objective (can be extended)

### MCP
- No automatic Bob prompt detection
- Tools are read-only + analysis (no production writes)
- Standalone MCP process not yet implemented

## Future Enhancements

1. Real-time port APIs (actual wait times)
2. Berth-level prediction models
3. Multi-port optimization
4. Advanced SHAP explanations
5. Kafka event streaming
6. Redis caching
7. Standalone MCP server
8. Custom constraint support
9. Sensitivity analysis
10. Historical trend analysis

## Support

**Setup Issues:**
1. Check [setup-guide.md](docs/setup-guide.md) troubleshooting
2. Verify ML models exist in `../AI/ML/models/`
3. Check logs for specific errors
4. Ensure Python 3.9+

**Architecture Questions:**
1. See [architecture.md](docs/architecture.md)
2. Review database schema diagram
3. Trace data flow in example scenarios

**API Usage:**
1. Use `/docs` (Swagger UI) for interactive testing
2. Review [api-contract.md](docs/api-contract.md) for endpoint details
3. Check example curl commands in setup guide

## Files Created

```
src/backend/
├── app/main.py                          [✓ FastAPI application]
├── app/core/config.py                   [✓ Configuration]
├── app/core/logging_config.py           [✓ Logging]
├── app/database/connection.py           [✓ Database setup]
├── app/models/database_models.py        [✓ ORM models]
├── app/models/schemas.py                [✓ Pydantic schemas]
├── app/services/prediction_service.py   [✓ ML integration]
├── app/services/optimization_engine.py  [✓ OR-Tools solver]
├── app/services/port_service.py         [✓ Business logic]
├── app/services/mcp_server.py           [✓ MCP tools]
├── app/api/health.py                    [✓ Health endpoint]
├── app/api/ports.py                     [✓ Port endpoints]
├── app/api/congestion.py                [✓ Congestion endpoints]
├── app/api/optimization.py              [✓ Optimization endpoints]
├── app/api/planning.py                  [✓ Planning endpoints]
├── app/api/mcp.py                       [✓ MCP HTTP wrapper]
├── tests/test_api.py                    [✓ Test suite]
├── docs/architecture.md                 [✓ Architecture guide]
├── docs/api-contract.md                 [✓ API specification]
├── docs/setup-guide.md                  [✓ Setup instructions]
├── requirements.txt                     [✓ Dependencies]
├── .env.example                         [✓ Configuration template]
└── README.md                            [✓ This file]
```

## Version

v1.0.0 - Initial release for hackathon

## License

Part of IBM Bob AI Innovation Hackathon project
