# PortPulse Backend — Quick Reference Card

## 🚀 Quick Start (5 minutes)

```bash
cd src/backend
python -m venv venv
source venv/bin/activate              # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Then open: **http://localhost:8001/docs**

## 📡 Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Service health |
| GET | `/ports` | List ports |
| GET | `/ports/{id}` | Port details |
| GET | `/ports/{id}/status` | Current status |
| GET | `/congestion/forecast/{id}` | 24/48/72h forecast |
| GET | `/congestion/hotspots/{id}` | Risk areas |
| POST | `/optimization/run` | Run solver |
| GET | `/optimization/{id}` | Results |
| POST | `/plans/72-hours/generate` | Plan generation |
| POST | `/scenarios/what-if` | Scenario test |
| GET | `/mcp/tools` | IBM Bob tools |

## 🧠 ML Integration (Person 1)

```python
# Location: app/services/prediction_service.py
# Loads from: ../AI/ML/models/*.json and ../AI/ML/data/processed/*.parquet

from app.services.prediction_service import predict_port
result = predict_port("port235", horizons=[1, 2, 3])

# Returns:
{
  "forecast": {
    "forecast_24h": {"probability": 0.65, "risk": "HIGH", ...},
    "forecast_48h": {...},
    "forecast_72h": {...}
  },
  "drivers": ["high_portcalls", "low_crane_capacity"],
  "feature_importance": {"portcalls": 0.42, ...}
}
```

## 🔧 Optimization Engine (OR-Tools)

```python
# Location: app/services/optimization_engine.py

# Automatically called by:
# - POST /optimization/run
# - POST /plans/72-hours/generate
# - POST /scenarios/what-if

# Returns: baseline plan + optimized plan + improvement metrics
```

## 🤖 IBM Bob MCP Tools

```
1. get_port_status           → Current port operational state
2. get_vessel_schedule       → Scheduled vessels
3. get_congestion_forecast   → 24/48/72h predictions
4. get_congestion_hotspots   → High-risk areas
5. get_berth_status          → Berth availability
6. get_crane_status          → Crane availability
7. optimise_schedule         → Run solver
8. run_what_if               → Scenario simulation
9. generate_72_hour_plan     → 72-hour plan
10. explain_congestion       → Forecast explanation
```

Access at: `GET /mcp/tools` or `POST /mcp/tools/{tool_name}`

## 📊 Database Models (11 Tables)

```
Port → Vessel → VesselSchedule
       ↓
       Berth → Crane
       ↓
       CongestionPrediction
       ↓
       OptimizationRun → Assignment → CraneAssignment
       ↓
       OperationsPlan
       ↓
       Scenario
```

## ⚙️ Configuration (.env)

```bash
# Database
DATABASE_URL=sqlite:///./portpulse.db      # or: postgresql://...

# API
API_HOST=0.0.0.0
API_PORT=8001
API_DEBUG=false                             # Always false in prod

# ML
ML_MODEL_PATH=../AI/ML/models
ML_DATA_PATH=../AI/ML/data/processed

# Optimization
OPTIMIZATION_TIMEOUT_SECONDS=30

# Assumptions (configurable)
BERTH_COUNT_DEFAULT=5
CRANE_COUNT_DEFAULT=10
SERVICE_TIME_DEFAULT_HOURS=24
```

## 🧪 Testing

```bash
pytest tests/ -v                    # Full suite
pytest tests/test_api.py -v         # API only
pytest tests/test_api.py::test_health_check -v    # Single test
pytest tests/ --cov=app             # With coverage
```

## 🔗 Integration Points

### Person 1 → Backend
- Models: `app/services/prediction_service.py`
- Loads: `../AI/ML/models/*.json` and `../AI/ML/data/processed/*.parquet`
- No modification of Person 1's code required

### Backend → Person 3 (Frontend)
- Documentation: `docs/api-contract.md`
- Base URL: `http://localhost:8001/api/v1`
- All responses are stable JSON with documented schemas

### Backend ↔ IBM Bob
- Tools: `app/services/mcp_server.py`
- HTTP wrapper: `app/api/mcp.py`
- Access: `GET /api/v1/mcp/tools` and `POST /api/v1/mcp/tools/{name}`

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Quick start + features |
| `docs/architecture.md` | System design, components, data flow |
| `docs/api-contract.md` | Complete API specification with examples |
| `docs/setup-guide.md` | Installation, configuration, troubleshooting |
| `IMPLEMENTATION_SUMMARY.md` | All 29 phases + deliverables |

## 🐛 Troubleshooting

**Q: "Model not found"**
```bash
cd ../AI/ML
python run.py all
```

**Q: "database is locked"**
- Use PostgreSQL for production (not SQLite)

**Q: "Port 8001 already in use"**
```bash
python -m uvicorn app.main:app --port 8002
```

**Q: Tests fail**
- Ensure ML models exist
- Check .env paths are correct
- Verify venv activated

## 📋 Ports & Horizons

**Ports:**
- `port235` - Chennai (East Coast)
- `port776` - JNPT / Mumbai (West Coast)
- `port777` - Mundra (West Coast)

**Horizons (for ML):**
- `1` - 24 hours
- `2` - 48 hours
- `3` - 72 hours

## 📈 Example Workflow

```bash
# 1. List ports
curl http://localhost:8001/api/v1/ports

# 2. Get current status
curl http://localhost:8001/api/v1/ports/port235/status

# 3. Get forecast
curl http://localhost:8001/api/v1/congestion/forecast/port235

# 4. Run optimization
curl -X POST http://localhost:8001/api/v1/optimization/run \
  -H "Content-Type: application/json" \
  -d '{"port_id": "port235", "planning_horizon_hours": 72}'

# 5. Generate 72-hour plan
curl -X POST http://localhost:8001/api/v1/plans/72-hours/generate \
  -H "Content-Type: application/json" \
  -d '{"port_id": "port235", "horizon_hours": 72}'

# 6. Test what-if scenario
curl -X POST http://localhost:8001/api/v1/scenarios/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "base_run_id": 1,
    "scenario_type": "VESSEL_DELAY",
    "parameters": {"vessel_id": 1, "delay_hours": 6}
  }'

# 7. List MCP tools
curl http://localhost:8001/api/v1/mcp/tools

# 8. Call MCP tool
curl -X POST http://localhost:8001/api/v1/mcp/tools/get_port_status \
  -H "Content-Type: application/json" \
  -d '{"port_id": "port235"}'
```

## 🚀 Deployment

### Local Development
- Database: SQLite (automatic)
- Server: `uvicorn` with `--reload`

### Production
- Database: PostgreSQL
- Server: `gunicorn` with `uvicorn` workers
- Add: HTTPS, authentication, rate limiting, monitoring

## 📞 Support

- **Setup Issues:** See `docs/setup-guide.md`
- **Architecture Questions:** See `docs/architecture.md`
- **API Usage:** See `docs/api-contract.md` or `/docs` (interactive)
- **Integration Issues:** Check `IMPLEMENTATION_SUMMARY.md`

## ✅ Verification Checklist

- [ ] Python 3.9+ installed
- [ ] Virtual environment activated
- [ ] `pip install -r requirements.txt` completed
- [ ] `.env` copied from `.env.example`
- [ ] ML models exist at `../AI/ML/models/`
- [ ] Feature data exists at `../AI/ML/data/processed/`
- [ ] Backend starts: `python -m uvicorn app.main:app --reload`
- [ ] Health check passes: `curl http://localhost:8001/api/v1/health`
- [ ] Docs accessible: `http://localhost:8001/docs`
- [ ] Tests pass: `pytest tests/ -v`

## 📦 Key Files at a Glance

```
src/backend/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── core/
│   │   └── config.py              # Settings
│   ├── database/
│   │   └── connection.py           # DB setup
│   ├── models/
│   │   ├── database_models.py     # ORM (11 tables)
│   │   └── schemas.py             # Pydantic schemas
│   ├── services/
│   │   ├── prediction_service.py  # ML wrapper
│   │   ├── optimization_engine.py # OR-Tools
│   │   ├── port_service.py        # Business logic
│   │   └── mcp_server.py          # IBM Bob
│   └── api/
│       ├── health.py
│       ├── ports.py
│       ├── congestion.py
│       ├── optimization.py
│       ├── planning.py
│       └── mcp.py
├── tests/
│   └── test_api.py                # Tests (16 cases)
├── docs/
│   ├── architecture.md
│   ├── api-contract.md
│   └── setup-guide.md
├── requirements.txt
├── .env.example
├── README.md
└── IMPLEMENTATION_SUMMARY.md
```

---

**Last Updated:** 2025-09-13  
**Status:** ✅ Complete & Ready  
**Version:** 1.0.0
