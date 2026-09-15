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


def _snapshot_or_404():
    try:
        snapshot = latest_snapshot()
        probability = congestion_probability()
    except (FileNotFoundError, KeyError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return snapshot, probability


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    snapshot, probability = _snapshot_or_404()
    risk = _risk(probability)
    now = datetime.now(timezone.utc).isoformat()

    # Build berth utilisation rows from live DB data
    berth_utilisations = []
    try:
        from app.services.port_service import PortService
        berths = PortService(db).list_berths("lalb")
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
        pass  # Keep empty list on error — frontend handles gracefully

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
                "severity": risk,
            },
            "congestionRisk": {
                "label": "Congestion Risk",
                "value": risk.upper(),
                "change": f"{probability:.0%} model signal",
                "severity": risk,
            },
        },
        "congestionTrend": trend(),
        "berthUtilisations": berth_utilisations,
        "activeRisks": (
            [{
                "id": "international-congestion",
                "location": snapshot["port_name"],
                "severity": risk,
                "description": "Waiting time is elevated against the historical baseline.",
                "metricLabel": "Waiting time",
                "metricValue": f'{snapshot["waiting_time_hours"]:.1f} hours',
            }]
            if risk in {"moderate", "high", "critical"}
            else []
        ),
        "aiRecommendation": {
            "id": "international-recommendation",
            "title": "Review the next monthly operating window",
            "detail": "The international model uses monthly operational data; validate berth and vessel plans before acting on this signal.",
            "severity": risk,
            "generatedAt": now,
        },
        "operationsSummary": {
            "arrivalsNext24h": snapshot["vessel_arrivals"],
            "departuresNext24h": 0,
            "expectedWaitHours": round(snapshot["waiting_time_hours"], 1),
            "capacityPct": snapshot["berth_utilisation"],
            "forecastWindowStart": snapshot["date"].isoformat(),
        },
    }


@router.get("/monitoring", response_model=MonitoringDataResponse)
def get_monitoring_data():
    snapshot, _ = _snapshot_or_404()
    now = datetime.now(timezone.utc).isoformat()
    return {
        "summary": {
            "activeVessels": snapshot["vessel_arrivals"],
            "arrivals": snapshot["vessel_arrivals"],
            "departures": 0,
            "waitingVessels": snapshot["waiting_vessels"],
            "berthUtilisation": snapshot["berth_utilisation"],
            "lastUpdated": now,
        },
        "vessels": [],
        "berths": [],
        "activityHistory": [],
    }
