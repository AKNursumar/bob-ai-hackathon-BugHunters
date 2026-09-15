# Solution Overview

## What We Built

Harborline is an AI-powered port operations intelligence platform for India's five major ports: JNPA/Nhava Sheva, Mundra, Chennai, Kandla, and Visakhapatnam. It combines live AIS vessel tracking, machine-learning congestion forecasting, constraint-solver schedule optimisation, and an IBM Bob operations assistant into a single integrated dashboard — giving port operators the ability to see, understand, and act on congestion risk before it becomes a crisis.

## How It Works

1. **Data Ingestion:** Live vessel positions and movements are streamed in real time from AISStream.io via WebSocket, filtered to bounding boxes around each Indian port. Historical port activity data (daily vessel arrivals, berth hours, anchor hours, dwell times) is sourced from IMF PortWatch.
2. **ML Forecasting:** An XGBoost time-series model trained on IMF PortWatch Indian port data generates 24h, 48h, and 72h congestion probability scores for each port. Feature importance reports identify the top drivers (e.g., rolling mean portcalls, lagged arrivals) behind each forecast.
3. **Backend API:** A FastAPI service exposes all predictions, live vessel data, berth status, and operational data via a versioned REST API (`/api/v1/`). A health endpoint (`/api/v1/health`) validates database and ML artifact availability on every request.
4. **Schedule Optimisation:** The operator submits a planning request; Google OR-Tools CP-SAT assigns vessels to available berths and cranes over a configurable horizon (24–72h), minimising total waiting time subject to berth capacity, crane availability, and vessel ETAs. A greedy fallback runs if OR-Tools is unavailable.
5. **IBM Bob via MCP:** IBM Bob connects to the backend through Model Context Protocol (MCP) tools. The operator can query port status, request congestion explanations, trigger optimisation, run what-if scenarios, and generate complete 72-hour operating plans using natural language.
6. **React Dashboard:** The frontend presents all data — KPIs, risk banners, congestion trend charts, berth status, vessel maps, predictions, and plans — through a clean operational dashboard. All KPIs and visualisations are driven by real backend API data.

## Architecture Diagram

> See [`architecture.md`](architecture.md) for the detailed diagram.

```
[AISStream.io WebSocket] ──→ [AIS Service (background thread)]
                                         │
[IMF PortWatch Data] → [XGBoost Model] → [Prediction Service]
                                         │
                          ┌──────────────┴──────────────┐
                          │     FastAPI Backend          │
                          │  /api/v1/{health,ports,      │
                          │   congestion,optimization,   │
                          │   planning,dashboard,mcp}    │
                          └──────────┬──────────────────┘
                                     │ REST
                          ┌──────────▼──────────┐
                          │  React + Vite        │
                          │  (Vercel)            │
                          └─────────────────────┘
                                     ▲
                          [IBM Bob] ─┘ (MCP over HTTP)
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| XGBoost over LSTM/deep learning | IMF PortWatch provides daily-resolution data — gradient-boosted trees outperform sequence models on tabular time-series at this granularity and are far cheaper to train and serve |
| Pre-computed contracts (`indian_ports_forecast.json`) | Decouples ML pipeline from the API runtime — the backend serves forecasts immediately without loading model weights on every request; the pipeline regenerates contracts when new data is available |
| OR-Tools CP-SAT with greedy fallback | Provides provably optimal scheduling when available; the greedy fallback ensures the optimisation endpoint never fails even in constrained environments |
| MCP for IBM Bob integration | Model Context Protocol lets IBM Bob call structured backend tools (get_port_status, get_congestion_forecast, optimise_schedule, generate_72_hour_plan) with typed parameters and responses — more reliable than raw LLM tool calls |
| SQLite default with PostgreSQL path | Allows zero-config local development and Render hackathon deploy; the `DATABASE_URL` env var switches to PostgreSQL for persistent production storage |

## IBM Technologies Used

- **IBM Bob (via MCP):** IBM Bob is connected to the Harborline backend through a Model Context Protocol server embedded in the FastAPI application. Bob can invoke 10 registered tools — including `get_port_status`, `get_congestion_forecast`, `get_congestion_hotspots`, `optimise_schedule`, `run_what_if`, and `generate_72_hour_plan` — to answer operator queries, explain risk, and produce executable operating plans in natural language.
- **watsonx.ai:** Used as the inference backbone for IBM Bob's language understanding and response generation when processing operator queries routed through the Bob Assistant interface.
