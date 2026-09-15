# Solution Overview

## What We Built

PORTPULSE AI (branded **Harborline** in the web interface) is a port-operations decision-support prototype. It gives an operator one place to inspect congestion risk, review vessel and berth activity, compare a first-come-first-served baseline with an optimized schedule, run a limited what-if scenario, and generate a 72-hour operations plan.

The interface is a React application. A FastAPI service provides the forecast, operational data, planning, optimization, and MCP-compatible tool endpoints. It starts with a local SQLite database and checked-in ML artifacts, so the core demo does not require cloud credentials.

## How It Works

1. The ML pipeline turns daily AIS aggregate activity into lag, rolling-window, and momentum features. It trains one XGBoost classifier per forecast horizon: 24, 48, and 72 hours.
2. The prediction service loads the corresponding serialized model and builds the latest feature row for `lalb`. It returns a probability, a risk band, confidence, and top feature drivers. If live inference inputs are not available, it can fall back to a checked-in contract value or a benchmark value so the API remains usable in the prototype.
3. On backend startup, the database is initialized and seeded with the LALB operational scenario: vessels, five berths, ten cranes, and a rolling schedule. Schedules are refreshed when too few future entries remain.
4. An operator can request a forecast, inspect operational status, or run the 72-hour planning flow. The optimizer computes a baseline, then uses OR-Tools CP-SAT to assign vessels to berths while minimizing priority-weighted waiting time under the modeled availability constraints.
5. The result is returned to the UI as assignments, waiting-time metrics, recommendations, and solver status. The same capabilities are exposed as HTTP MCP tool calls for IBM Bob integration.

## User Experience

The application includes routes for a dashboard, monitoring, predictions, hotspots, optimization, simulation, planner, analytics, alerts, reports, and a Bob assistant. The most substantive backend-connected flows are:

- **Dashboard and monitoring:** request `/api/v1/dashboard/summary` and `/api/v1/monitoring`; the UI intentionally supplies mock detail rows when the backend response does not have vessel/berth rows.
- **Predictions:** requests the 24/48/72-hour forecast and stored prediction endpoints for the selected port.
- **Optimization and planner:** submit `lalb` and a planning horizon to compare schedules or generate a plan.
- **Simulation:** posts a scenario to the what-if endpoint.
- **Bob assistant:** discovers the available MCP tools, resolves supported natural-language prompts to a tool call, and renders the structured response.

Some pages deliberately contain presentational sample data or client-side fallbacks. They are useful for demonstrating the product workflow but should not be interpreted as a live port-data feed.

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Separate prediction from optimization | A congestion signal estimates pressure; a constraint solver decides how to allocate vessels and resources. Keeping these concerns separate makes each layer easier to replace and validate. |
| Use three horizon-specific XGBoost models | A near-term operational response and a three-day planning response have different decision windows, so the project trains and serves 24h, 48h, and 72h forecasts separately. |
| Return drivers with risk | A `HIGH` or `CRITICAL` label alone is not operationally useful. The service returns top engineered features and human-readable driver labels. |
| Start from local, reproducible state | SQLite, checked-in model artifacts, and idempotent seed data allow the prototype to run without external services. |
| Expose capabilities through an MCP-shaped HTTP interface | IBM Bob can discover tool schemas and call port-status, forecast, planning, optimization, scenario, and explanation operations through the backend. |

## IBM Technology Integration

The repository implements an HTTP MCP wrapper intended for IBM Bob. It exposes discovery endpoints and ten operations tools:

`get_port_status`, `get_vessel_schedule`, `get_congestion_forecast`, `get_congestion_hotspots`, `get_berth_status`, `get_crane_status`, `optimise_schedule`, `run_what_if`, `generate_72_hour_plan`, and `explain_congestion`.

The React Bob Assistant page uses those endpoints directly for the demo. The repository does not contain a watsonx.ai SDK call or IBM Cloud deployment configuration; references to those services describe the intended integration context rather than a required local dependency.

## Further Reading

- [Architecture](architecture.md) explains the components, data flow, API surface, and boundaries.
- [Setup guide](setup-guide.md) provides the exact local commands and verification checks.
