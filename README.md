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

> In 2–3 sentences: What problem does your project solve? Who experiences this problem?

Port operators and shift supervisors often react to congestion only after vessel queues and delays have already formed. Changing vessel arrivals, berth availability, and port capacity make it difficult to anticipate congestion, understand its causes, and make timely operational decisions.

---

## 💡 Solution

> In 2–3 sentences: What did you build? How does it solve the problem above?

PORTPULSE AI is an operational intelligence platform that combines historical port activity with live vessel intelligence to forecast congestion risk 24, 48, and 72 hours ahead. It explains the drivers behind the forecast, evaluates operational disruptions, optimises vessel and berth schedules, and generates an actionable 72-hour operating plan through IBM Bob.

---

## ✨ Key Features

- **Predictive Congestion Intelligence:** Forecasts port congestion risk 24, 48, and 72 hours ahead with risk scores, trajectories, and key risk drivers.
- **Real-Time Port Monitoring:** Tracks live vessel movements, arrivals, departures, inbound vessels, and current port conditions using AIS data.
- **Operational Optimisation:** Optimises vessel sequencing, berth allocation, and resource utilisation to reduce waiting time and operational conflicts.
- **What-If Simulation:** Simulates vessel delays, berth unavailability, and resource disruptions to evaluate their impact and recalculate operations.
- **IBM Bob Operations Assistant:** Enables natural-language queries, congestion explanations, what-if analysis, optimisation, and 72-hour plan generation.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, TypeScript, JavaScript |
| **Frameworks** | FastAPI, React, Vite |
| **IBM Technologies** | IBM Bob, watsonx.ai, IBM Cloud |
| **Database** | PostgreSQL |
| **ML & Optimisation** | XGBoost, scikit-learn, OR-Tools |
| **Data Sources** | AISStream, IMF PortWatch, Indian port/government datasets, weather/marine data |
| **Infrastructure** | REST APIs, MCP, Docker, GitHub |


## 📁 Repository Structure

```
├── src/                  # All source code
├── docs/                 # Written documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   └── demo-video-link.txt  # Link to demo video
├── presentation/         # Slide deck
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> **Copy these exact steps from your [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repo
git clone https://github.com/[your-repo].git
cd [your-repo]

# 2. Install dependencies
[your install command here]

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run the project
[your run command here]
```

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

> Be honest — judges appreciate transparency over overclaiming.

- [Limitation 1: e.g., "Authentication is mocked — not production-ready"]
- [Limitation 2: e.g., "Only tested on Chrome"]
- [Limitation 3: e.g., "Feature X is scaffolded but not fully implemented"]

---

## 🏅 What We're Most Proud Of

[Tell the judges what part of your submission is strongest and worth paying close attention to.]

---
