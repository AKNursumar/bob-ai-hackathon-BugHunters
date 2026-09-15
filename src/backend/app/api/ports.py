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
            "lalb": ("Los Angeles-Long Beach", "USLAX"),
            "port235": ("Chennai", "INMAA1"),
            "port777": ("Mundra", "INMUN1"),
            "port776": ("JNPT / Mumbai", "INMUN2"),
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
