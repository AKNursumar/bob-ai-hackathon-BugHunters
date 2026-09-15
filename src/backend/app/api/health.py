"""
Harborline Backend — Health Check Endpoint

Returns fast, reliable health status.
Does NOT run ML inference on every request (too slow for a health check).
AIS failure does not cause the backend to appear unhealthy.
"""

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.schemas import HealthResponse
from app.database.connection import get_db
from app.core.logging_config import get_logger

logger = get_logger("api.health")
router = APIRouter()


def _check_ml_artifacts() -> str:
    """
    Check that the required ML model files exist on disk.
    Uses a fast file-existence check — does NOT load or run the models.
    """
    required_files = [
        "models/india/congestion_24h.joblib",
        "models/india/congestion_48h.joblib",
        "models/india/congestion_72h.joblib",
        "contracts/indian_ports_forecast.json",
    ]
    try:
        from app.services.prediction_service import _find_ai_file
        missing = []
        for rel in required_files:
            found = _find_ai_file(rel)
            if not found:
                missing.append(rel)
        if missing:
            logger.warning(f"ML artifacts missing: {missing}")
            return "degraded"
        return "ok"
    except Exception as e:
        logger.warning(f"ML artifact check failed: {e}")
        return "degraded"


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.

    Checks:
    - Database connectivity (fast SELECT 1)
    - ML artifact existence (file-check only, no model loading)

    AIS connectivity is NOT checked here — AIS failure should not make
    the backend appear dead to Render's health check.
    """

    # Database check
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        logger.warning(f"Database check failed: {e}")
        db_status = "error"

    # ML artifact check (fast — file existence only)
    ml_status = _check_ml_artifacts()

    # AIS status (informational only — logged, not returned in schema)
    try:
        from app.services.ais_service import get_ais_status
        ais_info = get_ais_status()
        ais_connected = ais_info.get("connected", False)
        ais_enabled = ais_info.get("enabled", False)
        logger.info(
            f"AIS status: {'connected' if ais_connected else ('disabled' if not ais_enabled else 'disconnected')}, "
            f"vessels={ais_info.get('vessel_count', 0)}"
        )
    except Exception:
        pass

    # Overall status
    if db_status == "error":
        overall_status = "error"
    elif db_status == "degraded" or ml_status == "degraded":
        overall_status = "degraded"
    else:
        overall_status = "ok"

    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
        database=db_status,
        ml_service=ml_status,
    )
