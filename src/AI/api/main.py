from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import json
import os
import joblib

app = FastAPI(title="PORTPULSE International Data API")

def load_json(filename):
    path = f"data/processed/contracts/{filename}"
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return {}

def load_csv(filename):
    path = f"data/processed/contracts/csv/{filename}"
    if os.path.exists(path):
        return pd.read_csv(path).to_dict(orient='records')
    return []

@app.get("/api/international/health")
def get_health():
    return {"status": "ok", "service": "International Data Layer"}

@app.get("/api/international/ports")
def get_ports():
    return [{"port_id": "LALB", "name": "Los Angeles - Long Beach", "country": "USA"}]

@app.get("/api/international/ports/{port_id}")
def get_port_overview(port_id: str):
    if port_id != "LALB": raise HTTPException(404, "Port not found")
    return load_json("frontend_data_contract.json")

@app.get("/api/international/ports/{port_id}/state")
def get_port_state(port_id: str):
    if port_id != "LALB": raise HTTPException(404, "Port not found")
    op = load_json("operational_data_contract.json")
    return op.get("state", {})

@app.get("/api/international/ports/{port_id}/vessels")
def get_vessels(port_id: str):
    if port_id != "LALB": raise HTTPException(404, "Port not found")
    return load_csv("vessels.csv")

@app.get("/api/international/ports/{port_id}/berths")
def get_berths(port_id: str):
    if port_id != "LALB": raise HTTPException(404, "Port not found")
    return load_csv("berths.csv")

@app.get("/api/international/ports/{port_id}/history")
def get_history(port_id: str):
    if port_id != "LALB": raise HTTPException(404, "Port not found")
    return load_csv("historical_congestion.csv")

@app.get("/api/international/ports/{port_id}/forecast")
def get_forecast(port_id: str):
    if port_id != "LALB": raise HTTPException(404, "Port not found")
    op = load_json("optimizer_input_contract.json")
    return op.get("forecast", {})

@app.get("/api/international/ports/{port_id}/congestion")
def get_congestion(port_id: str):
    if port_id != "LALB": raise HTTPException(404, "Port not found")
    op = load_json("frontend_data_contract.json")
    forecast = op.get("forecast", {})
    # Determine pressure trajectory
    try:
        f24 = forecast["24h"]["risk_score"]
        f72 = forecast["72h"]["risk_score"]
        if f72 > f24 + 0.1: state = "SURGING"
        elif f72 < f24 - 0.1: state = "RECOVERING"
        elif f24 > 0.5: state = "STABLE (HIGH)"
        else: state = "STABLE"
    except:
        state = "UNKNOWN"
        
    return {
        "forecast": forecast,
        "pressure_state": state,
        "risk_drivers": [{"feature": "waiting_vessels_change_1d", "direction": "up", "importance": 0.35}] # example
    }

@app.get("/api/international/ports/{port_id}/replay")
def get_replay(port_id: str, timestamp: str = None):
    if port_id != "LALB": raise HTTPException(404, "Port not found")
    # For now, return the compiled contract as the replay snapshot
    return load_json("optimizer_input_contract.json")

class WhatIfRequest(BaseModel):
    scenario: dict

@app.post("/api/international/what-if")
def post_what_if(req: WhatIfRequest):
    # Returns modified state for optimizer
    op = load_json("optimizer_input_contract.json")
    # Apply scenario (mock logic)
    delay = req.scenario.get("vessel_delay_hours", 0)
    for v in op.get("schedule", []):
        pass # add delay logic here in full implementation
    op["scenario_applied"] = req.scenario
    return op

@app.get("/api/international/data-quality")
def get_data_quality():
    return {
        "dataset": "Zenodo Record 21936231 (AIS)",
        "coverage": "Los Angeles - Long Beach",
        "date_range": "2021-2024",
        "row_count": 1460, # Daily aggregate rows
        "field_classification": {
            "vessels": "REAL",
            "berths": "CONFIGURED",
            "dwell_time": "MOCK",
            "waiting_count": "REAL"
        },
        "limitations": "Berth constraints are configured. Dwell time is mocked."
    }

if __name__ == "__main__":
    import uvicorn
    # uvicorn.run(app, host="0.0.0.0", port=8000)
