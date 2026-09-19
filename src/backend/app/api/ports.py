"""
PortPulse Backend — Ports Endpoint
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.schemas import PortResponse, PortStatusResponse
from app.database.connection import get_db
from app.services.port_service import PortService
from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger("api.ports")
router = APIRouter()

settings = get_settings()


@router.get("/ports", response_model=List[PortResponse])
def list_ports(db: Session = Depends(get_db)):
    """List all configured ports."""
    service = PortService(db)
    ports = service.list_ports()
    
    if not ports:
        # Initialize ports if not already in database
        logger.info("Initializing ports in database...")
        port_info = {
            "port776": ("JNPA / Nhava Sheva", "INNSA"),
            "port777": ("Mundra", "INMUN"),
            "port235": ("Chennai", "INMAA"),
            "port540": ("Kandla", "INIXY"),
            "port1367": ("Visakhapatnam", "INVTZ"),
        }
        
        for port_id in settings.port_list:
            if port_id not in port_info:
                port_info[port_id] = (settings.get_port_name(port_id), None)
        
        for port_id, (name, code) in port_info.items():
            service.create_port(port_id, name, code=code)
        
        ports = service.list_ports()
    
    return ports


@router.get("/ports/{port_id}", response_model=PortResponse)
def get_port(port_id: str, db: Session = Depends(get_db)):
    """Get port details."""
    service = PortService(db)
    port = service.get_port(port_id)
    
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {port_id} not found")
    
    return port


@router.get("/ports/{port_id}/status", response_model=PortStatusResponse)
def get_port_status(port_id: str, db: Session = Depends(get_db)):
    """Get current port operational status."""
    service = PortService(db)
    status = service.get_port_status(port_id)
    
    if status is None:
        raise HTTPException(status_code=404, detail=f"Port {port_id} not found")
    
    return status


# ============================================================================
# Crane Electrical, Mechanical, and Technical Diagnostics
# ============================================================================

@router.get("/ports/{port_id}/cranes/diagnostics")
def get_crane_diagnostics_endpoint(port_id: str):
    """Retrieve full mechanical, electrical, and technical telemetry for all cranes."""
    from app.services.crane_diagnostic_service import get_crane_diagnostics
    return {"cranes": get_crane_diagnostics(port_id)}


@router.post("/ports/{port_id}/cranes/diagnostics/inject")
def inject_crane_fault_endpoint(port_id: str, payload: dict):
    """Inject a mechanical, electrical, or technical fault into a crane."""
    from app.services.crane_diagnostic_service import inject_crane_fault
    crane_id = payload.get("crane_id", f"{port_id}-CR-02")
    fault_type = payload.get("fault_type", "ELECTRICAL")
    updated = inject_crane_fault(port_id, crane_id, fault_type)
    return {"crane": updated}


@router.post("/ports/{port_id}/cranes/diagnostics/reset")
def reset_crane_endpoint(port_id: str, payload: dict):
    """Reset a crane to healthy operational state."""
    from app.services.crane_diagnostic_service import reset_crane_health
    crane_id = payload.get("crane_id", f"{port_id}-CR-02")
    return {"crane": reset_crane_health(port_id, crane_id)}


@router.post("/ports/{port_id}/cranes/diagnostics/mitigate")
def auto_mitigate_endpoint(port_id: str):
    """Execute autonomous mitigation for all detected crane faults."""
    from app.services.crane_diagnostic_service import execute_auto_mitigation
    return execute_auto_mitigation(port_id)

