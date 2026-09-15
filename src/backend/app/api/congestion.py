"""
PortPulse Backend — Congestion Prediction Endpoints
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.models.schemas import CongestionForecast, CongestionReport
from app.database.connection import get_db
from app.services.port_service import PortService
from app.services.prediction_service import predict_port, classify_risk
from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger("api.congestion")
router = APIRouter()

settings = get_settings()


@router.get("/congestion/forecast/{port_id}", response_model=CongestionReport)
def get_congestion_forecast(port_id: str, db: Session = Depends(get_db)):
    """
    Get congestion forecast for a port.

    Returns 24h, 48h, and 72h forecasts with probabilities and risk levels.
    """
    port_service = PortService(db)

    port = port_service.get_port(port_id)
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {port_id} not found")

    try:
        predictions = predict_port(port_id, horizons=[1, 2, 3])

        forecast = predictions.get("forecast", {})
        forecast_24h = forecast.get("forecast_24h", {})
        forecast_48h = forecast.get("forecast_48h", {})
        forecast_72h = forecast.get("forecast_72h", {})

        # Persist predictions to the database for status/hotspot endpoints
        for horizon, horizon_key in [(24, "forecast_24h"), (48, "forecast_48h"), (72, "forecast_72h")]:
            f = forecast.get(horizon_key, {})
            if "probability" in f and f["probability"] is not None:
                port_service.store_prediction(
                    port_id=port_id,
                    horizon_hours=horizon,
                    congestion_probability=f["probability"],
                    congestion_level=f["risk"],
                    confidence=f.get("confidence", 0.5),
                    drivers=predictions.get("drivers", []),
                    feature_importance=predictions.get("feature_importance", {}),
                )

        now = datetime.now(timezone.utc)
        return CongestionReport(
            port_id=port_id,
            port_name=port.name,
            timestamp=now,
            current_activity={
                "congestion_index": predictions.get("congestion_index"),
                "data_as_of": predictions.get("data_as_of"),
            },
            forecast_24h=CongestionForecast(
                probability=forecast_24h.get("probability", 0),
                risk_level=forecast_24h.get("risk", "UNKNOWN"),
            ),
            forecast_48h=CongestionForecast(
                probability=forecast_48h.get("probability", 0),
                risk_level=forecast_48h.get("risk", "UNKNOWN"),
            ),
            forecast_72h=CongestionForecast(
                probability=forecast_72h.get("probability", 0),
                risk_level=forecast_72h.get("risk", "UNKNOWN"),
            ),
            hotspots=[],
            data_freshness="current",
        )

    except Exception as e:
        logger.error(f"Failed to get forecast for {port_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/congestion/hotspots/{port_id}")
def get_congestion_hotspots(
    port_id: str,
    horizon_hours: int = Query(24, ge=24, le=72),
    db: Session = Depends(get_db),
):
    """
    Get congestion hotspots for a port.

    Identifies high-risk time windows based on predicted port-level congestion.
    """
    port_service = PortService(db)

    port = port_service.get_port(port_id)
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {port_id} not found")

    preds = port_service.get_latest_predictions(port_id)
    now = datetime.now(timezone.utc)
    hotspots = []

    horizon_days = horizon_hours // 24
    if horizon_days in (1, 2, 3):
        pred = preds.get(horizon_days * 24)
        if pred and pred.congestion_level in ("HIGH", "CRITICAL"):
            # pred.timestamp may be naive (legacy rows) — normalise to UTC-aware
            ts = pred.timestamp
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            hotspots.append({
                "location": "Port-level",
                "risk_level": pred.congestion_level,
                "time_window_start": ts.isoformat(),
                "time_window_end": (ts + timedelta(hours=horizon_hours)).isoformat(),
                "reason": "Predicted elevated port activity",
                "expected_impact": {
                    "waiting_time_increase_percent": min(
                        100, (pred.congestion_probability * 100 - 50) * 2
                    )
                },
            })

    return {
        "port_id": port_id,
        "horizon_hours": horizon_hours,
        "timestamp": now.isoformat(),
        "hotspots": hotspots,
    }


@router.get("/congestion/current/{port_id}")
def get_current_congestion(port_id: str, db: Session = Depends(get_db)):
    """Get current congestion status for a port."""
    port_service = PortService(db)

    port = port_service.get_port(port_id)
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {port_id} not found")

    preds = port_service.get_latest_predictions(port_id)

    if not preds:
        return {
            "port_id": port_id,
            "status": "unknown",
            "message": "No predictions available",
        }

    pred_24h = preds.get(24)
    if pred_24h:
        ts = pred_24h.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return {
            "port_id": port_id,
            "timestamp": ts.isoformat(),
            "congestion_level": pred_24h.congestion_level,
            "congestion_probability": pred_24h.congestion_probability,
            "confidence": pred_24h.confidence,
            "drivers": pred_24h.drivers,
        }

    return {"port_id": port_id, "status": "unavailable"}


@router.get("/congestion/predictions/{port_id}")
def get_all_congestion_predictions(port_id: str, db: Session = Depends(get_db)):
    """
    Get latest predictions for all horizons (24h, 48h, 72h).

    Convenience endpoint used by the monitoring dashboard.
    """
    port_service = PortService(db)

    port = port_service.get_port(port_id)
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {port_id} not found")

    preds = port_service.get_latest_predictions(port_id)
    now = datetime.now(timezone.utc)

    result = {}
    for horizon in (24, 48, 72):
        pred = preds.get(horizon)
        if pred:
            ts = pred.timestamp
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            result[f"{horizon}h"] = {
                "congestion_probability": pred.congestion_probability,
                "congestion_level": pred.congestion_level,
                "confidence": pred.confidence,
                "timestamp": ts.isoformat(),
            }

    return {
        "port_id": port_id,
        "generated_at": now.isoformat(),
        "predictions": result,
    }
