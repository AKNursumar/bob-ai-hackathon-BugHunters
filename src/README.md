# Source Code — Harborline

All Harborline source code lives in this folder, organised into three sub-packages:

## Structure

```
src/
  backend/        ← FastAPI REST API server
  frontend/       ← React + Vite dashboard UI
  AI/             ← ML pipeline, trained models, and data contracts
```

### `backend/`
FastAPI application serving the Harborline REST API.

```
backend/
  app/
    api/          ← Route handlers: health, ports, congestion, optimization, planning, dashboard, mcp
    core/         ← Settings (config.py), logging
    database/     ← SQLAlchemy engine, session, seed data
    models/       ← ORM models (database_models.py) and Pydantic schemas (schemas.py)
    services/     ← AIS stream, prediction, optimization engine, port service, MCP server
  requirements.txt
  .env.example    ← Copy to .env and fill in secrets
  render.yaml     ← Render.com deployment config
```

**Entrypoint:** `app/main.py` → `uvicorn app.main:app`

### `frontend/`
React 18 + Vite + TypeScript dashboard.

```
frontend/
  src/
    features/     ← Page-level components (dashboard, monitoring, predictions, optimization, planner, simulation, bob, analytics, homepage)
    services/     ← API client (client.ts), React Query hooks
    components/   ← Shared UI (KpiCard, PageHeader, LoadingSkeleton, etc.)
    contexts/     ← PortContext (selected port state)
    lib/          ← Utilities (format.ts, apiUrl.ts)
  public/         ← Static assets (hero.jpg)
  .env.example    ← Copy to .env.local; set VITE_API_URL for production
  vercel.json     ← Vercel SPA routing config
```

**Dev server:** `npm run dev` (port 5173, proxies `/api/*` to backend)

### `AI/`
ML pipeline, trained model artifacts, and data contracts.

```
AI/
  models/
    india/        ← Indian port models: congestion_24h.joblib, congestion_48h.joblib, congestion_72h.joblib
    metadata.json ← Model training metadata
  contracts/
    indian_ports_forecast.json  ← Pre-computed forecasts for all 5 ports (consumed by backend at runtime)
    optimizer_input.json        ← Sample optimization input contract
    port_monitoring_input.json  ← Sample monitoring input contract
  reports/
    feature_importance_24h.csv  ← Top XGBoost feature drivers (24h horizon)
    feature_importance_48h.csv
    feature_importance_72h.csv
  data/
    indian_ports_activity.csv   ← IMF PortWatch training data (gitignored — large file)
  pipeline.py                   ← ML training pipeline (offline use only — not run at server startup)
  india_pipeline.py             ← Indian ports-specific training pipeline
  indian_ports_metadata.csv     ← Port metadata (coordinates, names, IMF port IDs)
```

## Important Files

- `backend/requirements.txt` — Python dependency manifest
- `backend/.env.example` — All backend environment variables with descriptions
- `frontend/package.json` — Node dependency manifest
- `frontend/.env.example` — Frontend environment variables (`VITE_API_URL`)
- `AI/contracts/indian_ports_forecast.json` — **Required at runtime** — pre-computed ML output

## What NOT to Include in src/

- `.env` files with real secrets (in `.gitignore`)
- `node_modules/` or `venv/` / `.venv/` (in `.gitignore`)
- Build artifacts (`dist/`, `build/`, `__pycache__/`)
- Large training data files (`data/` directories are in `.gitignore`)
