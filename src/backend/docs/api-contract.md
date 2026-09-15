# PortPulse Backend API Contract

## Base URL

```
http://localhost:8001/api/v1
```

## Overview

| Category | Purpose |
|---|---|
| Health | Service status and dependencies |
| Ports | Port management and status |
| Congestion | Forecasts and risk assessment |
| Optimization | Vessel scheduling optimization |
| Planning | 72-hour plan generation |
| MCP | IBM Bob tool access |

---

## Health Endpoints

### GET /health

Service health check with dependency status.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-09-13T12:00:00.000Z",
  "version": "1.0.0",
  "database": "ok",
  "ml_service": "ok"
}
```

**Status Values:**
- `ok` - All systems operational
- `degraded` - Some systems may have issues
- `error` - Critical systems down

**Dependency Status:**
- `database`: "ok" | "error"
- `ml_service`: "ok" | "degraded" | "error"

---

## Ports Endpoints

### GET /ports

List all configured ports.

**Response:** `200 OK`
```json
[
  {
    "id": "port235",
    "name": "Chennai",
    "code": "INMAA1",
    "latitude": 13.0,
    "longitude": 80.0,
    "created_at": "2025-09-13T12:00:00.000Z"
  },
  {
    "id": "port776",
    "name": "JNPT / Mumbai",
    "code": "INMUN2",
    "latitude": 19.0,
    "longitude": 72.8,
    "created_at": "2025-09-13T12:00:00.000Z"
  }
]
```

### GET /ports/{port_id}

Get specific port details.

**Path Parameters:**
- `port_id` (string, required): Port identifier (e.g., "port235")

**Response:** `200 OK`
```json
{
  "id": "port235",
  "name": "Chennai",
  "code": "INMAA1",
  "latitude": 13.0,
  "longitude": 80.0,
  "created_at": "2025-09-13T12:00:00.000Z"
}
```

**Errors:**
- `404 Not Found`: Port not found

### GET /ports/{port_id}/status

Get current operational status.

**Path Parameters:**
- `port_id` (string, required): Port identifier

**Response:** `200 OK`
```json
{
  "port_id": "port235",
  "port_name": "Chennai",
  "timestamp": "2025-09-13T12:00:00.000Z",
  "current_vessel_count": 3,
  "current_berth_utilization": 60.0,
  "current_crane_utilization": 75.0,
  "waiting_vessels": 2,
  "average_waiting_time": 2.5,
  "congestion_status": "HIGH"
}
```

---

## Congestion Endpoints

### GET /congestion/forecast/{port_id}

Get 24h/48h/72h congestion forecast.

**Path Parameters:**
- `port_id` (string, required): Port identifier

**Response:** `200 OK`
```json
{
  "port_id": "port235",
  "port_name": "Chennai",
  "timestamp": "2025-09-13T12:00:00.000Z",
  "current_activity": {
    "congestion_index": 1.15,
    "data_as_of": "2025-09-13T00:00:00.000Z"
  },
  "forecast_24h": {
    "probability": 0.65,
    "risk_level": "HIGH"
  },
  "forecast_48h": {
    "probability": 0.52,
    "risk_level": "MODERATE"
  },
  "forecast_72h": {
    "probability": 0.48,
    "risk_level": "MODERATE"
  },
  "hotspots": [
    {
      "location": "Port-level",
      "risk_level": "HIGH",
      "time_window_start": "2025-09-13T12:00:00.000Z",
      "time_window_end": "2025-09-14T12:00:00.000Z",
      "reason": "Predicted elevated port activity",
      "expected_impact": {
        "waiting_time_increase_percent": 25.0
      }
    }
  ],
  "data_freshness": "current"
}
```

**Risk Levels:**
- `CRITICAL` - Probability ≥ 0.80
- `HIGH` - Probability ≥ 0.60
- `MODERATE` - Probability ≥ 0.40
- `LOW` - Probability < 0.40

### GET /congestion/hotspots/{port_id}

Identify high-risk areas and time windows.

**Path Parameters:**
- `port_id` (string, required): Port identifier

**Query Parameters:**
- `horizon_hours` (integer, optional): 24, 48, or 72 (default: 24)

**Response:** `200 OK`
```json
{
  "port_id": "port235",
  "horizon_hours": 72,
  "timestamp": "2025-09-13T12:00:00.000Z",
  "hotspots": [
    {
      "location": "Port-level",
      "risk_level": "HIGH",
      "time_window_start": "2025-09-13T12:00:00.000Z",
      "time_window_end": "2025-09-14T12:00:00.000Z",
      "reason": "Predicted elevated port activity",
      "expected_impact": {
        "waiting_time_increase_percent": 25.0
      }
    }
  ]
}
```

### GET /congestion/current/{port_id}

Get current congestion status (latest 24h prediction).

**Path Parameters:**
- `port_id` (string, required): Port identifier

**Response:** `200 OK`
```json
{
  "port_id": "port235",
  "timestamp": "2025-09-13T12:00:00.000Z",
  "congestion_level": "HIGH",
  "congestion_probability": 0.65,
  "confidence": 0.82,
  "drivers": ["High vessel activity", "Reduced berth availability"]
}
```

---

## Optimization Endpoints

### POST /optimization/run

Run optimization to generate vessel schedule.

**Request Body:**
```json
{
  "port_id": "port235",
  "planning_horizon_hours": 72,
  "objective_weights": null,
  "constraints": null
}
```

**Response:** `200 OK`
```json
{
  "optimization_run_id": 42,
  "status": "COMPLETED",
  "baseline_plan": [
    {
      "vessel_id": "V001",
      "vessel_name": "MSC Gülsün",
      "assigned_berth": "B1",
      "planned_start": "2025-09-13T14:00:00.000Z",
      "planned_end": "2025-09-13T20:00:00.000Z",
      "waiting_time_hours": 2.0,
      "assigned_cranes": 2,
      "service_duration_hours": 6.0
    }
  ],
  "optimized_plan": [
    {
      "vessel_id": "V001",
      "vessel_name": "MSC Gülsün",
      "assigned_berth": "B2",
      "planned_start": "2025-09-13T13:00:00.000Z",
      "planned_end": "2025-09-13T19:00:00.000Z",
      "waiting_time_hours": 1.0,
      "assigned_cranes": 2,
      "service_duration_hours": 6.0
    }
  ],
  "improvement_metrics": {
    "baseline_total_waiting_hours": 12.5,
    "optimized_total_waiting_hours": 8.2,
    "improvement_percent": 34.4,
    "solve_time_seconds": 2.3,
    "is_optimal": true
  },
  "recommendations": [
    "Optimize vessel sequencing to reduce waiting time",
    "Consider crane allocation adjustments"
  ]
}
```

**Errors:**
- `404 Not Found`: Port not found
- `400 Bad Request`: No vessels or resources configured
- `500 Internal Server Error`: Optimization failed

### GET /optimization/{run_id}

Get results of past optimization run.

**Path Parameters:**
- `run_id` (integer, required): Optimization run ID

**Response:** `200 OK`
```json
{
  "id": 42,
  "port_id": "port235",
  "planning_horizon_hours": 72,
  "status": "COMPLETED",
  "baseline_metric": 12.5,
  "optimized_metric": 8.2,
  "improvement_percent": 34.4,
  "num_assignments": 5,
  "solve_time_seconds": 2.3,
  "created_at": "2025-09-13T12:00:00.000Z"
}
```

---

## Planning Endpoints

### POST /plans/72-hours/generate

Generate optimized 72-hour operations plan.

**Request Body:**
```json
{
  "port_id": "port235",
  "horizon_hours": 72
}
```

**Response:** `200 OK`
```json
{
  "plan_id": 15,
  "port_id": "port235",
  "port_name": "Chennai",
  "horizon_start": "2025-09-13T12:00:00.000Z",
  "horizon_end": "2025-09-16T12:00:00.000Z",
  "total_vessels": 8,
  "total_waiting_time_hours": 12.3,
  "average_waiting_time_hours": 1.54,
  "berth_utilization_percent": 75.0,
  "crane_utilization_percent": 80.0,
  "vessel_assignments": [
    {
      "vessel_id": "V001",
      "vessel_name": "MSC Gülsün",
      "eta": "2025-09-13T12:00:00.000Z",
      "assigned_berth": "B1",
      "service_start": "2025-09-13T13:00:00.000Z",
      "service_end": "2025-09-13T19:00:00.000Z",
      "expected_waiting_time_hours": 1.0,
      "assigned_cranes": ["C1", "C2"],
      "risk_level": "HIGH"
    }
  ],
  "conflicts": [],
  "high_risk_periods": [
    {
      "time_window": "2025-09-13T12:00:00.000Z - 2025-09-16T12:00:00.000Z",
      "risk_level": "HIGH",
      "reason": "Predicted elevated port congestion"
    }
  ],
  "status": "DRAFT",
  "generated_at": "2025-09-13T12:00:00.000Z"
}
```

### GET /plans/{plan_id}

Get specific operations plan.

**Path Parameters:**
- `plan_id` (integer, required): Plan ID

**Response:** `200 OK`
```json
{
  "plan_id": 15,
  "port_id": "port235",
  "start_time": "2025-09-13T12:00:00.000Z",
  "end_time": "2025-09-16T12:00:00.000Z",
  "status": "DRAFT",
  "metrics": {
    "total_waiting_time_hours": 12.3,
    "average_waiting_time_hours": 1.54,
    "berth_utilization_percent": 75.0,
    "crane_utilization_percent": 80.0
  },
  "plan_data": {
    "assignments": [...],
    "optimization_metrics": {...}
  },
  "generated_at": "2025-09-13T12:00:00.000Z"
}
```

### POST /scenarios/what-if

Run what-if scenario simulation.

**Request Body:**
```json
{
  "port_id": "port235",
  "scenario_type": "VESSEL_DELAY",
  "parameters": {
    "vessel_id": "V104",
    "delay_hours": 6
  }
}
```

**Scenario Types:**
- `VESSEL_DELAY` - Delay a vessel by N hours
- `CRANE_UNAVAILABLE` - Make a crane unavailable
- `BERTH_UNAVAILABLE` - Make a berth unavailable

**Response:** `200 OK`
```json
{
  "scenario_type": "VESSEL_DELAY",
  "parameters": {
    "vessel_id": "V104",
    "delay_hours": 6
  },
  "baseline_metrics": {
    "total_waiting_time_hours": 12.5,
    "average_waiting_time_hours": 1.56,
    "num_assignments": 8
  },
  "scenario_metrics": {
    "total_waiting_time_hours": 15.2,
    "average_waiting_time_hours": 1.90,
    "num_assignments": 8
  },
  "differences": {
    "waiting_time_change_hours": 2.7,
    "impact_percent": 21.6
  },
  "affected_vessels": ["V104"],
  "affected_berths": ["B1", "B2"],
  "recommendations": [
    "Consider mitigating the scenario impact",
    "Review alternative scheduling strategies"
  ],
  "status": "completed"
}
```

---

## MCP Endpoints

### GET /mcp/tools

List available MCP tools for IBM Bob.

**Response:** `200 OK`
```json
{
  "tools": [
    {
      "name": "get_port_status",
      "description": "Get current operational status of a port",
      "inputSchema": {
        "type": "object",
        "properties": {
          "port_id": {
            "type": "string",
            "description": "Port identifier (port235, port776, port777)"
          }
        },
        "required": ["port_id"]
      }
    },
    ...
  ]
}
```

### POST /mcp/tools/{tool_name}

Call an MCP tool.

**Path Parameters:**
- `tool_name` (string, required): Name of tool to call

**Request Body:**
```json
{
  "arguments": {
    "port_id": "port235"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "port_id": "port235",
    ...
  }
}
```

### GET /mcp/status

Get MCP server status.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "tools_available": 10,
  "version": "1.0.0"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing the issue"
}
```

**Common HTTP Status Codes:**

| Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (resource doesn't exist) |
| 422 | Unprocessable Entity (validation error) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (dependencies down) |

---

## Notes for Frontend

### Congestion Status Interpretation

- Display **forecast_24h** for current/immediate risk
- Show **forecast_48h** and **forecast_72h** for planning
- Highlight **HIGH** and **CRITICAL** levels in UI
- Use **hotspots** to identify specific problem areas/times

### Optimization Usage

1. Call `POST /optimization/run` to compute schedule
2. Return includes both baseline and optimized plans
3. Display **improvement_metrics** to show value
4. Present top **recommendations** to user

### 72-Hour Plan Usage

1. Display **vessel_assignments** as Gantt chart
2. Color-code by **risk_level**
3. Show **conflicts** prominently
4. Highlight **high_risk_periods** in timeline
5. Allow downloading as PDF/CSV

### Scenario Comparison

1. Show **baseline_metrics** and **scenario_metrics** side-by-side
2. Highlight **differences** in red if negative impact
3. Use **impact_percent** to quantify severity
4. List **affected_vessels** and **affected_berths**

---

## Rate Limiting

Currently: No rate limiting (configure in production)

Recommendation: 100 req/min per client IP

---

## Authentication

Currently: None (configure in production)

Recommendation: API key or OAuth2

---

## Versioning

Current: API v1

Future versions will be at `/api/v2`, `/api/v3`, etc.

Backward compatibility maintained within v1.
