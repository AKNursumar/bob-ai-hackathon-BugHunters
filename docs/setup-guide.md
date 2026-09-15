# Setup Guide

This guide runs the checked-in Harborline / PORTPULSE AI prototype locally. The default experience uses local SQLite, seeded LALB operational data, and the bundled ML artifacts. No IBM Cloud, watsonx.ai, or external data account is required for that path.

## Prerequisites

- Python 3.10 or newer (the project has been authored with modern FastAPI, Pydantic 2, and scikit-learn dependencies).
- Node.js 20 or newer with npm.
- Git.

Run all commands below from the repository root unless a command changes directory. PowerShell examples are shown for Windows.

## Backend setup

```powershell
cd src\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Optional: copy the supplied configuration template if you need to change defaults.

```powershell
Copy-Item .env.example .env
```

The backend works without `.env`; its defaults are SQLite at `src/backend/portpulse.db`, host `0.0.0.0`, and port `8001`.

Start the backend:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

At first startup it creates the SQLite schema and seeds the LALB demo configuration. Leave this terminal running.

## Frontend setup

Open a second terminal at the repository root:

```powershell
cd src\frontend
npm install
npm run dev
```

Vite starts on `http://localhost:5173` and proxies all `/api` calls to `http://127.0.0.1:8001`. Open `http://localhost:5173` in a browser.

## Verify the installation

With the backend running, these requests should succeed:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/api/v1/health
Invoke-RestMethod http://127.0.0.1:8001/api/v1/ports
Invoke-RestMethod http://127.0.0.1:8001/api/v1/mcp/status
```

Open the FastAPI interactive API at `http://127.0.0.1:8001/docs`. In the web application, confirm that the dashboard loads, then try **Predictions**, **Optimisation**, **72-Hour Planner**, or **Bob Assistant**. The intended demo port is `lalb` (Los Angeles-Long Beach).

## Run tests and a production frontend build

From an activated backend virtual environment:

```powershell
cd src\backend
pytest tests\ -v
```

From the frontend directory:

```powershell
npm run build
```

## Configuration reference

All settings are optional for a local run. The backend reads variables from its current directory and from `src/backend/.env`.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./portpulse.db` | SQLAlchemy database URL. PostgreSQL can be used by supplying an appropriate URL and driver. |
| `API_HOST` | `0.0.0.0` | Bind host for the FastAPI process. |
| `API_PORT` | `8001` | Backend listening port. |
| `API_DEBUG` | `false` | Enables debug-mode behavior when set to `true`. |
| `ML_MODEL_PATH` | `../AI/models` | Candidate path for model artifacts; the service also searches repository-relative locations. |
| `ML_DATA_PATH` | `../AI/data` | Candidate path for the model input data; repository-relative locations are also searched. |
| `INTERNATIONAL_DATA_PATH` | unset | Optional external international-data path. It is not needed for the checked-in demo. |
| `PORTS` | `LALB,port235,port776,port777` | Comma-separated configured port identifiers. The seeded runnable scenario is `lalb`. |
| `PORT_LALB_NAME` | `Los Angeles-Long Beach` | Display name for the demo port. |
| `OPTIMIZATION_TIMEOUT_SECONDS` | `30` | OR-Tools solve limit. |
| `OPTIMIZATION_LOG_SEARCH` | `false` | Enables solver search logging. |
| `MCP_ENABLED` | `true` | Enables the MCP configuration flag. The HTTP MCP routes are included by the application. |
| `MCP_HOST` / `MCP_PORT` | `0.0.0.0` / `3000` | Reserved MCP host and port settings. The current implementation exposes MCP through the FastAPI server on port 8001. |
| `BERTH_COUNT_DEFAULT` | `5` | Configurable planning assumption. |
| `CRANE_COUNT_DEFAULT` | `10` | Configurable planning assumption. |
| `SERVICE_TIME_DEFAULT_HOURS` | `24` | Configurable planning assumption. |
| `VESSEL_BERTH_COMPATIBILITY_STRICT` | `false` | Controls the strict-compatibility configuration flag. |

## Optional: retrain model artifacts

The repository includes serialized models under `src/AI/models/`, so retraining is not required to run the app. If the corresponding input dataset is available at `src/AI/data/daily_lalb_ais.csv`, run the pipeline from the repository root:

```powershell
python src\AI\pipeline.py
```

This rewrites the three joblib models, `metadata.json`, and the feature-importance reports. Review the resulting model metrics and validate the data split before using any retrained artifacts for decision-making.

## Troubleshooting

| Symptom | Resolution |
|---|---|
| PowerShell blocks virtual-environment activation | Run `Set-ExecutionPolicy -Scope Process Bypass`, then rerun `.\.venv\Scripts\Activate.ps1`. This change applies only to the current shell. |
| Frontend shows network errors or fallback content | Confirm the backend is running on port 8001, then visit `/api/v1/health`. Vite’s proxy only applies when the frontend is started with `npm run dev`. |
| `ModuleNotFoundError` or missing Python package | Activate `.venv` and rerun `pip install -r requirements.txt` from `src/backend`. |
| Forecast request fails after moving files | Restore the checked-in `src/AI/models/` artifacts and verify `src/AI/data/` is available. The prediction service searches several repo-relative paths, but an invalid custom `ML_*_PATH` can still cause confusion. |
| No scheduled vessels in a plan | Restart the backend so its startup seeder can refresh the LALB 72-hour demo schedule; also ensure the request uses `port_id: "lalb"`. |
| Port 5173 or 8001 is already in use | Stop the existing process, or select another port. If you change the backend port, update the Vite proxy in `src/frontend/vite.config.ts` to match. |
| `npm run build` fails | Use a current Node.js LTS release, delete only the generated `node_modules` directory if necessary, run `npm install`, and retry. |

## Important Prototype Limitations

- The local database is seeded operational data, not a live terminal system.
- The forecast is a port-level anchorage-pressure proxy; it is not a calibrated berth-level waiting-time forecast.
- The UI uses intentional mock or fallback content in several screens when the API does not provide detailed data.
- The app has no authentication, authorization, production deployment configuration, or live external-data ingestion in this repository.
