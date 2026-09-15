"""
PortPulse Backend — Health Check Endpoint
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.schemas import HealthResponse
from app.database.connection import get_db
from app.core.logging_config import get_logger

logger = get_logger("api.health")
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        logger.warning(f"Database check failed: {e}")
        db_status = "error"
    
    # Check ML service
    try:
        from app.services.prediction_service import predict_all_ports
        # Try to load at least one model
        result = predict_all_ports(horizons=[1])
        ml_status = "ok" if result else "error"
    except Exception as e:
        logger.warning(f"ML service check failed: {e}")
        ml_status = "degraded"
    
    # Determine overall status
    overall_status = "ok"
    if db_status == "error" or ml_status == "error":
        overall_status = "error"
    elif db_status == "degraded" or ml_status == "degraded":
        overall_status = "degraded"
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
        database=db_status,
        ml_service=ml_status
    )
