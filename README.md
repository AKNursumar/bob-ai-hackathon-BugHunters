# 🚀 Harborline

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | BugHunters |
| **Track** | Logistics/Port |
| **Team Lead** | Aubaid Ahmed Saiyed — 24dit063@charusat.edu.in |
| **Members** | Abdulkadir Nursumar, Ansh Patel, Krish Shah |

---


## 🎯 Problem Statement

Port operators and shift supervisors at major Indian ports — JNPA/Nhava Sheva, Mundra, Chennai, Kandla, and Visakhapatnam — often react to congestion only after vessel queues and delays have already formed. Dynamic vessel arrivals, fluctuating berth availability, and limited real-time visibility make it difficult to anticipate congestion pressure, understand its root causes, and act before the situation deteriorates.

---

## 💡 Solution

Harborline is an AI-powered port operations intelligence platform that combines live AIS vessel tracking with XGBoost-based congestion forecasting to predict port pressure 24, 48, and 72 hours ahead across India's five major ports. It explains the drivers behind every forecast, optimises vessel-berth-crane schedules using Google OR-Tools, simulates operational disruptions, and generates actionable 72-hour operating plans through IBM Bob.

---

## ✨ Key Features

- **Predictive Congestion Intelligence:** XGBoost time-series model forecasts port congestion risk 24h, 48h, and 72h ahead with probability scores, risk levels, and top feature drivers — trained on IMF PortWatch Indian port activity data.
- **Real-Time Port Monitoring:** Live AIS vessel tracking via AISStream.io across bounding boxes for all five Indian ports — shows vessel count, anchor status, position, heading, and speed.
- **Berth & Crane Optimisation:** Google OR-Tools CP-SAT constraint solver assigns vessels to berths and cranes, minimising waiting time and eliminating scheduling conflicts.
- **What-If Simulation:** Simulates vessel delays and crane unavailability to evaluate operational impact and recalculate congestion pressure in real time.
- **IBM Bob Operations Assistant:** MCP-powered natural-language interface — query port status, get congestion explanations, trigger optimisation, and generate 72-hour operating plans.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, TypeScript, JavaScript |
| **Frameworks** | FastAPI, React, Vite |
| **IBM Technologies** | IBM Bob (MCP) |
| **Database** | SQLite (dev) / PostgreSQL (production) |
| **ML & Optimisation** | XGBoost, scikit-learn, joblib, Google OR-Tools CP-SAT |
| **Data Sources** | AISStream.io (live AIS), IMF PortWatch (port activity) |
| **Infrastructure** | REST API, MCP (Model Context Protocol), Render (backend), Vercel (frontend) |


## 📁 Repository Structure

```
├── src/                      # All source code
│   ├── backend/              # FastAPI backend
│   │   ├── app/              # Application package
│   │   │   ├── api/          # REST endpoints (health, ports, congestion, optimization, planning, dashboard, mcp)
│   │   │   ├── core/         # Config and logging
│   │   │   ├── database/     # DB connection, seed data
│   │   │   ├── models/       # SQLAlchemy models, Pydantic schemas
│   │   │   └── services/     # AIS, prediction, optimization, port, MCP services
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   └── render.yaml
│   ├── frontend/             # React + Vite frontend
│   │   ├── src/
│   │   │   ├── features/     # Page components (dashboard, monitoring, predictions, optimization, planner, simulation, bob)
│   │   │   ├── services/     # API client, hooks
│   │   │   └── components/   # Shared UI components
│   │   ├── .env.example
│   │   └── vercel.json
│   └── AI/                   # ML pipeline and model artifacts
│       ├── models/           # Trained .joblib model files
│       ├── contracts/        # Pre-computed JSON forecasts for Indian ports
│       ├── reports/          # Feature importance CSVs
│       └── data/             # Training data (gitignored large files)
├── docs/                     # Written documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                     # Demo artifacts
│   ├── screenshots/          # App screenshots
│   └── demo-video-link.txt   # Link to demo video
├── presentation/             # Slide deck
└── submission.yaml           # Structured submission metadata
```

---

## ⚡ How to Run

> Full instructions in [`docs/setup-guide.md`](docs/setup-guide.md)

```bash
# 1. Clone the repo
git clone https://github.com/AKNursumar/bob-ai-hackathon-BugHunters.git
cd bob-ai-hackathon-BugHunters

# 2. Backend — install and start
cd src/backend
pip install -r requirements.txt
cp .env.example .env
# Set AISSTREAM_API_KEY and CORS_ORIGINS in .env
uvicorn app.main:app --host 0.0.0.0 --port 8001

# 3. Frontend — install and start (separate terminal)
cd src/frontend
npm install
cp .env.example .env.local
# Leave VITE_API_URL empty for local dev (Vite proxy handles it)
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:8001`  
API Docs: `http://localhost:8001/docs`

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

---

## ⚠️ Known Limitations

> Transparent disclosure for judges.

- **Port-level forecasting:** The XGBoost model predicts congestion pressure at the port level. Berth-level forecasting is outside the current scope due to the lack of consistent, publicly available historical berth-level data across all five Indian ports.
- **API & external data availability:** Live vessel activity and certain operational indicators rely on external APIs and data sources. Their availability, update frequency, rate limits, and access requirements may vary, which can affect the freshness of real-time inputs. Forecasting, optimisation, and planning workflows continue to operate using available historical and operational data.
- **No persistent user authentication:** The platform is a single-tenant operations dashboard; multi-user authentication is not implemented.
- **OR-Tools optional:** The constraint-solver optimisation requires `ortools` installed separately. A greedy fallback algorithm runs automatically if OR-Tools is unavailable.

---

## 🏅 What We're Most Proud Of

Harborline does not stop at a congestion dashboard — it closes the loop from prediction to action. The ML model forecasts congestion pressure ahead of time using real IMF PortWatch data, the explanation layer surfaces which features are driving the risk, and that intelligence feeds directly into the OR-Tools schedule optimiser and IBM Bob MCP workflow. A port operator can go from seeing a HIGH-risk 48h forecast to generating a conflict-free 72-hour vessel-berth-crane plan entirely within one interface — through natural language if needed.
