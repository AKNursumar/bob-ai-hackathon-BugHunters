# PortPulse Backend Architecture

## Overview

PortPulse Backend is a comprehensive port operations optimization system that:
1. Predicts congestion using ML models (Person 1's XGBoost)
2. Optimizes vessel-berth-crane assignments using OR-Tools
3. Generates 72-hour operational plans
4. Supports what-if scenario simulation
5. Exposes all capabilities via REST API and MCP tools for IBM Bob

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     IBM Bob (External)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │ MCP Calls via HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI REST API                              │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│ │ Health       │  │ Ports        │  │ Congestion             │ │
│ │ /health      │  │ /ports       │  │ /congestion/forecast   │ │
│ └──────────────┘  └──────────────┘  └────────────────────────┘ │
│ ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│ │ Optimization │  │ Planning     │  │ MCP Tools              │ │
│ │ /optimization│  │ /plans       │  │ /mcp/tools             │ │
│ └──────────────┘  └──────────────┘  └────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Prediction  │ │ Optimization │ │ Port Service │
    │ Service     │ │ Engine       │ │              │
    │ (wraps ML)  │ │ (OR-Tools)   │ │ (Business)   │
    └─────────────┘ └──────────────┘ └──────────────┘
          │              │                   │
          └──────────────┼───────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   SQLAlchemy ORM     │
              │   Database Layer     │
              └──────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
    │   SQLite    │ │ PostgreSQL   │ │   Models     │
    │ (dev/test)  │ │ (production) │ │              │
    └─────────────┘ └──────────────┘ └──────────────┘

External ML:
          ▼
    ┌──────────────────────────────┐
    │ Person 1's ML Pipeline       │
    │ - XGBoost models             │
    │ - 24h/48h/72h predictions    │
    │ - Feature importance         │
    └──────────────────────────────┘
```

## Directory Structure

```
src/backend/
├── app/
│   ├── main.py                  # FastAPI application entry point
│   ├── core/
│   │   ├── config.py           # Configuration from environment
│   │   └── logging_config.py   # Logging setup
│   ├── database/
│   │   └── connection.py       # SQLAlchemy setup
│   ├── models/
│   │   ├── database_models.py  # SQLAlchemy ORM models
│   │   └── schemas.py          # Pydantic request/response schemas
│   ├── services/
│   │   ├── prediction_service.py   # ML model integration
│   │   ├── port_service.py         # Port operations
│   │   ├── optimization_engine.py  # OR-Tools optimization
│   │   └── mcp_server.py          # MCP tool implementations
│   └── api/
│       ├── health.py          # Health checks
│       ├── ports.py           # Port endpoints
│       ├── congestion.py      # Congestion forecasts
│       ├── optimization.py    # Optimization endpoints
│       ├── planning.py        # 72-hour planning
│       └── mcp.py            # MCP HTTP wrapper
├── tests/
│   └── test_api.py           # Test suite
├── .env.example              # Environment template
├── requirements.txt          # Dependencies
└── README.md                # Documentation

../optimisation/              # (Future: separate optimization module)
../mcp/                      # (MCP standalone server if needed)
```

## Key Components

### 1. Prediction Service (`services/prediction_service.py`)

Wraps Person 1's ML model (XGBoost) for congestion forecasting.

**Features:**
- Loads pre-trained models from `../AI/ML/models/`
- Returns structured predictions (probability, risk level, confidence)
- Supports 24h, 48h, 72h horizons
- Caches models in-process

**Integration Point:**
```python
from app.services.prediction_service import predict_port

result = predict_port("port235", horizons=[1, 2, 3])
# Returns:
{
    "port": "port235",
    "display_name": "Chennai",
    "forecast": {
        "forecast_24h": {"probability": 0.65, "risk": "HIGH"},
        ...
    },
    "drivers": [...],
    "feature_importance": {...}
}
```

### 2. Optimization Engine (`services/optimization_engine.py`)

Implements vessel-berth-crane assignment optimization using Google OR-Tools.

**Model:**
- Decision variables:
  - Vessel start/end times
  - Berth assignments
  - Crane allocations
  
- Objective:
  - Minimize total waiting time
  - Weighted by vessel priority
  
- Constraints:
  - No overlapping intervals on same berth
  - Vessel cannot start before ETA
  - Service must fit within planning horizon
  - Resource availability respected

**Usage:**
```python
from app.services.optimization_engine import (
    OptimizationRequest, VesselData, BerthData, CraneData, optimize
)

req = OptimizationRequest(
    port_id="port235",
    vessels=[...],
    berths=[...],
    cranes=[...],
    planning_horizon_hours=72,
    horizon_start=datetime.utcnow()
)

result = optimize(req)
# Returns:
{
    "status": "COMPLETED",
    "is_optimal": True,
    "assignments": [...],
    "total_waiting_time_hours": 24.5,
    "average_waiting_time_hours": 1.2,
}
```

### 3. Port Service (`services/port_service.py`)

Central business logic for port operations.

**Responsibilities:**
- Port/vessel/berth/crane data management
- Vessel schedule queries
- Congestion prediction storage
- Operations plan management

### 4. REST API (`app/api/`)

FastAPI endpoints organized by domain:

| Module | Endpoints | Purpose |
|---|---|---|
| `health.py` | `/api/v1/health` | Service health |
| `ports.py` | `/api/v1/ports/*` | Port information |
| `congestion.py` | `/api/v1/congestion/*` | Forecasts, hotspots |
| `optimization.py` | `/api/v1/optimization/*` | Optimization runs |
| `planning.py` | `/api/v1/plans/*` | 72-hour plans, scenarios |
| `mcp.py` | `/api/v1/mcp/*` | MCP tool access |

### 5. MCP Server (`services/mcp_server.py`)

Exposes 10 tools to IBM Bob via HTTP:

1. `get_port_status` - Current port state
2. `get_vessel_schedule` - Scheduled vessels
3. `get_congestion_forecast` - Forecasts
4. `get_congestion_hotspots` - High-risk areas
5. `get_berth_status` - Berth availability
6. `get_crane_status` - Crane availability
7. `optimise_schedule` - Run optimization
8. `run_what_if` - Scenario simulation
9. `generate_72_hour_plan` - Plan generation
10. `explain_congestion` - Forecast explanation

### 6. Database Models (`models/database_models.py`)

SQLAlchemy ORM models for persistent storage:

- `Port` - Port entity
- `Vessel` - Vessel entity
- `VesselSchedule` - Arrival schedules
- `Berth` - Berth/dock
- `Crane` - Crane/equipment
- `CongestionPrediction` - ML predictions
- `OptimizationRun` - Optimization records
- `Assignment` - Vessel-to-berth assignments
- `CraneAssignment` - Crane allocations
- `Scenario` - What-if scenarios
- `OperationsPlan` - 72-hour plans

## Data Flow Examples

### Congestion Forecast Example

```
User/Bob: GET /api/v1/congestion/forecast/port235

Backend:
1. PredictionService.predict_port("port235")
   - Load XGBoost model for port235
   - Load latest feature data from parquet
   - Predict for 24h/48h/72h
   - Return {probability, risk_level, confidence}

2. PortService.store_prediction()
   - Save to CongestionPrediction table
   
3. API response
   {
     "port_id": "port235",
     "forecast_24h": {"probability": 0.65, "risk": "HIGH"},
     ...
   }
```

### Optimization Example

```
User: POST /api/v1/optimization/run
     {
       "port_id": "port235",
       "planning_horizon_hours": 72
     }

Backend:
1. PortService.get_vessel_schedules() - Get ETAs for next 72h
2. PortService.list_berths() - Get berths
3. PortService.list_cranes() - Get cranes
4. OptimizationEngine.compute_baseline() - FIFO schedule
5. OptimizationEngine.optimize() - OR-Tools solver
6. Store OptimizationRun & Assignment records
7. Return {baseline_plan, optimized_plan, improvement_metrics}
```

### 72-Hour Plan Example

```
User: POST /api/v1/plans/72-hours/generate
     {"port_id": "port235"}

Backend:
1. PortService.get_vessel_schedules() for 72h window
2. Fetch berths, cranes
3. Build OptimizationRequest
4. Run optimize()
5. Store OperationsPlan record
6. Return plan with assignments, metrics, conflicts
```

### What-If Scenario Example

```
User: POST /api/v1/scenarios/what-if
     {
       "port_id": "port235",
       "scenario_type": "VESSEL_DELAY",
       "parameters": {
         "vessel_id": "V104",
         "delay_hours": 6
       }
     }

Backend:
1. Fetch current 72-hour schedule
2. Clone, apply modification (delay vessel by 6h)
3. Run optimization on modified scenario
4. Compare baseline vs scenario metrics
5. Return differences & recommendations
```

## Data Assumptions & Configuration

The backend uses several **configurable assumptions** for operational parameters:

### File: `.env` or `.env.example`

```
# Operational Constraints (Configurable Assumptions)
BERTH_COUNT_DEFAULT=5
CRANE_COUNT_DEFAULT=10
SERVICE_TIME_DEFAULT_HOURS=24
VESSEL_BERTH_COMPATIBILITY_STRICT=false
```

These are clearly documented as assumptions, not historical observations.

### Database Schema Design

**Ports Table**: Stores port metadata
- JNPT/Mumbai is mapped to `port776` (PortWatch identifier)
- No artificial port creation beyond configured ports

**Vessel Schedule**: Stores real ETAs from:
- Can be ingested from real scheduling systems
- For demo: synthetic data from test scenarios

**Berths/Cranes**: Operational infrastructure
- In demo: configurable defaults
- In production: sync with real terminal systems

## Configuration

### Environment Variables

See `.env.example` for complete list. Key ones:

```bash
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL=sqlite:///./portpulse.db

# API
API_HOST=0.0.0.0
API_PORT=8001

# ML Model paths
ML_MODEL_PATH=../AI/ML/models
ML_DATA_PATH=../AI/ML/data/processed

# Optimization
OPTIMIZATION_TIMEOUT_SECONDS=30
```

### Settings Loader (`app/core/config.py`)

Pydantic-based settings that:
- Load from `.env` file
- Support environment variable overrides
- Provide type-safe configuration access
- Cache settings in singleton

## Running the Backend

### Prerequisites

```bash
# Install dependencies
pip install -r requirements.txt

# Person 1's ML pipeline must be run first
cd ../AI/ML
python run.py all  # Generates models and features
```

### Start Backend

```bash
# Development (with reload)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Access

- API: http://localhost:8001
- Docs: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc
- Health: http://localhost:8001/api/v1/health

## Testing

```bash
# Run all tests
pytest tests/ -v

# Specific test
pytest tests/test_api.py::test_health_check -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

## Deployment

### Docker

Uncomment and use provided Dockerfile/docker-compose.yml

```bash
docker-compose up -d
```

### Production Checklist

1. [ ] Use PostgreSQL (not SQLite)
2. [ ] Set `API_DEBUG=false`
3. [ ] Configure CORS properly (not `*`)
4. [ ] Use strong database credentials
5. [ ] Enable HTTPS
6. [ ] Configure logging
7. [ ] Set resource limits on optimization (timeout)
8. [ ] Monitor ML model availability
9. [ ] Implement rate limiting
10. [ ] Regular database backups

## Troubleshooting

### ML Models Not Found

**Error:** `FileNotFoundError: Model not found: .../models/port235_1d_model.json`

**Solution:** Run Person 1's pipeline first:
```bash
cd ../AI/ML
python run.py all
```

### Database Lock (SQLite)

**Issue:** "database is locked" in concurrent access

**Solution:** Use PostgreSQL in production, not SQLite

### Optimization Timeout

**Issue:** Solver takes too long or times out

**Solution:** Adjust `OPTIMIZATION_TIMEOUT_SECONDS` in .env (default 30s)

### Port Not Found

**Error:** `HTTPException 404: Port port235 not found`

**Solution:** Initialize ports: `GET /api/v1/ports` (creates ports on first call)

## Future Enhancements

1. **Real-time data integration**: Connect to actual PortWatch/terminal APIs
2. **Advanced hotspot detection**: Berth-level + time-window predictions
3. **Multi-port coordination**: Cross-port optimization
4. **Historical analysis**: Trend detection, seasonal patterns
5. **Explainable AI**: SHAP values for prediction explanation
6. **Sensitivity analysis**: Constraint relaxation studies
7. **Persistent MCP**: Standalone MCP server process
8. **Caching layer**: Redis for frequent queries
9. **Event streaming**: Kafka for real-time updates
10. **Advanced visualizations**: Gantt charts, capacity heatmaps

## Notes on Data Integrity

- **No fabricated data**: All data comes from real sources or clear assumptions
- **Congestion proxy**: `portcalls / 30d_rolling_mean` is a proxy, not direct wait time
- **Recommendations only**: Optimization produces recommendations, not automatic changes
- **Assumptions documented**: All configurable parameters clearly marked
