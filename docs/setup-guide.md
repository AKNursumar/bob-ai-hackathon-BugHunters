# Setup Guide

> **This file is read by the automated evaluation pipeline. Be precise and complete.**

## Prerequisites

Before you begin, ensure you have the following installed:

- [x] Python 3.11+
- [x] Node.js 18+ and npm
- [x] Git
- [x] An AISStream.io account (free tier) — get API key at https://aisstream.io

## Environment Variables

### Backend

```bash
cd src/backend
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `AISSTREAM_API_KEY` | AISStream.io API key for live vessel tracking | No (AIS disabled if missing) |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | Yes (production) |
| `DATABASE_URL` | SQLite (default) or PostgreSQL connection string | No (defaults to SQLite) |
| `ML_MODEL_PATH` | Path to ML model directory relative to backend root | No (defaults to `../AI/models`) |
| `ML_DATA_PATH` | Path to AI data directory | No (defaults to `../AI/data`) |
| `API_PORT` | Port for the backend server | No (defaults to `8001`) |
| `API_DEBUG` | Enable debug/reload mode | No (defaults to `false`) |

### Frontend

```bash
cd src/frontend
cp .env.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Backend base URL for production | No (leave empty for local dev — Vite proxy handles it) |

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/AKNursumar/bob-ai-hackathon-BugHunters.git
cd bob-ai-hackathon-BugHunters

# 2. Install backend dependencies
cd src/backend
pip install -r requirements.txt

# 3. Configure backend environment
cp .env.example .env
# Open .env and set AISSTREAM_API_KEY (optional) and CORS_ORIGINS

# 4. Install frontend dependencies
cd ../frontend
npm install

# 5. Configure frontend environment
cp .env.example .env.local
# Leave VITE_API_URL empty for local development
```

> No database migration commands needed — the backend auto-initialises and seeds the SQLite database on first startup.

## Running the Application

```bash
# Terminal 1 — Start the backend (from src/backend/)
cd src/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Terminal 2 — Start the frontend (from src/frontend/)
cd src/frontend
npm run dev
```

The application will be available at:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8001`
- **API Docs (Swagger):** `http://localhost:8001/docs`
- **Health Check:** `http://localhost:8001/api/v1/health`

## Running Tests

```bash
# Backend tests (from src/backend/)
cd src/backend
pytest tests/ -v

# TypeScript type check (from src/frontend/)
cd src/frontend
node_modules/.bin/tsc --noEmit
```

## Quick Demo (Optional)

The application seeds all required berth, crane, and vessel data on first startup — no manual seeding needed. To verify the ML pipeline is working:

```bash
# Check health endpoint (backend must be running)
curl http://localhost:8001/api/v1/health

# Check congestion forecast for JNPA
curl http://localhost:8001/api/v1/congestion/forecast/port776

# Check all ports
curl http://localhost:8001/api/v1/congestion/forecast/all
```

## Troubleshooting

| Issue | Solution |
|---|---|
| `ModuleNotFoundError: websockets` | Run `pip install -r requirements.txt` — `websockets` was added for AIS support |
| Backend starts but shows `AISSTREAM_API_KEY not set` | This is expected if you haven't set the key — live AIS is disabled, forecasting still works |
| Frontend shows `Unable to load KPIs` | Ensure the backend is running on port `8001` and `VITE_API_URL` is empty in `.env.local` |
| `CORS error` in browser console | Ensure `CORS_ORIGINS=http://localhost:5173` is set in backend `.env` |
| `ortools` import error | OR-Tools is optional — the optimisation engine uses a greedy fallback automatically. Install with `pip install ortools` for the full CP-SAT solver |
| ML artifacts not found at startup | Ensure you are running `uvicorn` from within `src/backend/` — the model paths are relative to that directory |
