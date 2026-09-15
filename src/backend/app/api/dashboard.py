"""Dashboard and monitoring endpoints for the current international dataset."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.schemas import DashboardSummaryResponse, MonitoringDataResponse
from app.services.international_data_service import (
    congestion_probability,
    latest_snapshot,
    trend,
)
from app.database.connection import get_db

router = APIRouter()


# Thresholds must stay in sync with prediction_service.RISK_THRESHOLDS
def _risk(probability: float) -> str:
    if probability >= 0.80:
        return "critical"
    if probability >= 0.60:
        return "high"
    if probability >= 0.40:
        return "moderate"
    return "low"


def _snapshot_or_404(port_id: str = "port777"):
    try:
        from app.services.prediction_service import predict_port
        # Fetch the latest prediction from our Indian ML models instead of the old international data
        prediction = predict_port(port_id)
        
        try:
            from app.services.ais_service import get_live_vessels
            live_vessels = get_live_vessels(port_id)
            active = len(live_vessels)
            waiting = sum(1 for v in live_vessels if v["status"] == "AT_ANCHOR")
        except Exception:
            active = 0
            waiting = 0

        # Build a pseudo-snapshot to satisfy the dashboard UI using real Indian ML signals
        snapshot = {
            "port_id": port_id,
            "port_name": prediction.get("display_name", "Unknown Port"),
            "date": datetime.now(timezone.utc),
            "vessel_arrivals": active,
            "waiting_time_hours": 0.0,
            "dwell_time_hours": 0.0,
            "service_time_hours": 0.0,
            "anchor_hours": 0.0,
            "berth_hours": 0.0,
            "waiting_vessels": waiting,
            "berth_utilisation": 0.0,
            "congestion_index": prediction.get("congestion_index", 50.0),
            "historical_wait_mean": 0.0,
            "data_as_of": prediction.get("data_as_of", datetime.now(timezone.utc).isoformat())
        }
        
        prob_24h = prediction.get("forecast", {}).get("forecast_24h", {}).get("probability", 0.0)
        return snapshot, prob_24h
    except (FileNotFoundError, KeyError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(port_id: str = "port777", db: Session = Depends(get_db)):
    snapshot, probability = _snapshot_or_404(port_id)
    risk = _risk(probability)
    now = datetime.now(timezone.utc).isoformat()

    # Build berth utilisation rows from live DB data
    berth_utilisations = []
    try:
        from app.services.port_service import PortService
        berths = PortService(db).list_berths(port_id)
        total = len(berths)
        for b in berths:
            is_occupied = b.status not in ("AVAILABLE",)
            utilisation_pct = round(snapshot["berth_utilisation"] if is_occupied else snapshot["berth_utilisation"] * 0.6, 1)
            berth_utilisations.append({
                "berthId": b.id,
                "berthName": b.name,
                "utilisationPercent": utilisation_pct,
                "status": b.status,
                "capacity": b.capacity_teu,
            })
    except Exception:
        pass  # Keep empty list on error ?" frontend handles gracefully

    return {
        "lastUpdated": now,
        "portName": snapshot["port_name"],
        "systemStatus": "live",
        "kpis": {
            "activeVessels": {"label": "Monthly Vessel Arrivals", "value": snapshot["vessel_arrivals"]},
            "waitingVessels": {"label": "Vessels at Anchor", "value": snapshot["waiting_vessels"]},
            "berthUtilisation": {
                "label": "Berth Hours Share",
                "value": f'{snapshot["berth_utilisation"]:.0f}%',
                "unit": "%",
                "severity": "low",
            },
            "congestionRisk": {
                "label": "Congestion Risk",
                "value": risk.upper(),
                "change": f"{probability:.0%} model signal",
                "severity": risk,
            },
        },
        "congestionTrend": [], # Removed hardcoded trend for port776
        "berthUtilisations": berth_utilisations,
        "activeRisks": (
            [{
                "id": "ml-congestion",
                "location": snapshot["port_name"],
                "severity": risk,
                "description": "Congestion risk elevated by machine learning model.",
                "metricLabel": "Risk Score",
                "metricValue": f"{probability:.0%}",
            }]
            if risk in {"moderate", "high", "critical"}
            else []
        ),
        "aiRecommendation": {
            "id": "indian-ml-recommendation",
            "title": "Review the next 72-hour operating window",
            "detail": "The ML model forecasts risk based on daily IMF PortWatch activity.",
            "severity": risk,
            "generatedAt": now,
        },
        "operationsSummary": {
            "arrivalsNext24h": snapshot["vessel_arrivals"],
            "departuresNext24h": 0,
            "expectedWaitHours": round(snapshot["waiting_time_hours"], 1),
            "capacityPct": snapshot["berth_utilisation"],
            "forecastWindowStart": snapshot["data_as_of"],
        },
    }


@router.get("/monitoring", response_model=MonitoringDataResponse)
def get_monitoring_data(port_id: str = "port777", db: Session = Depends(get_db)):
    snapshot, _ = _snapshot_or_404(port_id)
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        from app.services.ais_service import get_live_vessels
        live_vessels = get_live_vessels(port_id)
        waiting_vessels_count = sum(1 for v in live_vessels if v["status"] == "AT_ANCHOR")
        active_vessels_count = len(live_vessels)
    except Exception:
        live_vessels = []
        waiting_vessels_count = 0
        active_vessels_count = 0

    # Fetch real berths
    try:
        from app.services.port_service import PortService
        port_service = PortService(db)
        port_info = port_service.get_port(port_id)
        plat = port_info.latitude if port_info else 0
        plon = port_info.longitude if port_info else 0
        
        berths_db = port_service.list_berths(port_id)
        berths = []
        for i, b in enumerate(berths_db):
            is_occupied = b.status not in ("AVAILABLE",)
            utilisation_pct = round(snapshot["berth_utilisation"] if is_occupied else snapshot["berth_utilisation"] * 0.6, 1)
            berths.append({
                "id": b.id,
                "name": b.name,
                "latitude": plat + (i * 0.001),
                "longitude": plon + (i * 0.001),
                "status": b.status,
                "utilisation": utilisation_pct,
                "currentVesselId": None,
                "lastUpdated": now,
            })
    except Exception:
        berths = []

    return {
        "summary": {
            "activeVessels": active_vessels_count,
            "arrivals": active_vessels_count,
            "departures": 0,
            "waitingVessels": waiting_vessels_count,
            "berthUtilisation": snapshot["berth_utilisation"],
            "lastUpdated": now,
        },
        "vessels": live_vessels,
        "berths": berths,
        "activityHistory": [],
    }
