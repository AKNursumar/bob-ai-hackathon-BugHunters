"""
PortPulse Backend — Optimization Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from app.models.schemas import OptimizationRequest, OptimizationResult
from app.database.connection import get_db
from app.models.database_models import OptimizationRun
from app.services.port_service import PortService
from app.services.optimization_engine import (
    OptimizationRequest as OptRequest,
    VesselData,
    BerthData,
    CraneData,
    optimize,
    compute_baseline
)
from app.core.logging_config import get_logger

logger = get_logger("api.optimization")
router = APIRouter()


@router.post("/optimization/run", response_model=Dict[str, Any])
@router.post("/optimization/compare", response_model=Dict[str, Any])
@router.post("/optimization/optimize", response_model=Dict[str, Any])
def run_optimization(
    request: OptimizationRequest,
    db: Session = Depends(get_db)
):
    """
    Run optimization to generate optimized vessel assignments.
    
    Returns both baseline (current schedule) and optimized plan,
    allowing comparison of improvements.
    """
    port_service = PortService(db)
    
    # Verify port exists
    port = port_service.get_port(request.port_id)
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {request.port_id} not found")
    
    logger.info(f"Starting optimization for port {request.port_id}")
    
    try:
        # Get vessel schedules
        from_time = datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC for SQLite
        to_time = from_time + timedelta(hours=request.planning_horizon_hours)
        
        vessel_schedules = port_service.get_vessel_schedules(
            request.port_id,
            from_time=from_time,
            to_time=to_time
        )
        
        if not vessel_schedules:
            raise HTTPException(
                status_code=400,
                detail="No vessels scheduled in the planning horizon"
            )
        
        # Get berths and cranes
        berths = port_service.list_berths(request.port_id)
        cranes = port_service.list_cranes(request.port_id)
        
        if not berths:
            raise HTTPException(
                status_code=400,
                detail="No berths configured for this port"
            )
        
        if not cranes:
            raise HTTPException(
                status_code=400,
                detail="No cranes configured for this port"
            )
        
        # Build optimization data structures
        vessels = []
        for schedule in vessel_schedules:
            vessel = schedule.vessel
            vessels.append(VesselData(
                vessel_id=schedule.vessel_id,
                vessel_name=vessel.vessel_name if vessel else schedule.vessel_id,
                eta=schedule.eta,
                service_duration_hours=schedule.expected_service_duration_hours,
                priority=schedule.priority,
                vessel_type=vessel.vessel_type if vessel else "GENERAL",
                length_m=vessel.length_m if vessel else None,
                beam_m=vessel.beam_m if vessel else None,
            ))
        
        berth_data = [
            BerthData(berth.id, berth.name, berth.capacity_teu, berth.usable_length_m, berth.usable_width_m, bool(berth.supports_parallel_berthing), berth.safety_clearance_m)
            for berth in berths
        ]
        
        crane_data = [
            CraneData(crane.id, crane.name, crane.capacity_teu_per_hour)
            for crane in cranes
        ]
        
        # Create optimization request
        opt_request = OptRequest(
            port_id=request.port_id,
            vessels=vessels,
            berths=berth_data,
            cranes=crane_data,
            planning_horizon_hours=request.planning_horizon_hours,
            horizon_start=from_time
        )
        
        # Compute baseline
        logger.info("Computing baseline schedule...")
        baseline = compute_baseline(opt_request)
        baseline_waiting_total = baseline["total_waiting_time_hours"]
        
        # Run optimization
        logger.info("Running optimization...")
        optimized = optimize(opt_request)
        
        # Store optimization run in database
        opt_run = OptimizationRun(
            port_id=request.port_id,
            planning_horizon_hours=request.planning_horizon_hours,
            status=optimized["status"],
            objective_value=optimized.get("objective_value"),
            baseline_metric=baseline_waiting_total,
            optimized_metric=optimized.get("total_waiting_time_hours"),
            solve_time_seconds=optimized.get("solve_time_seconds"),
            num_assignments=optimized.get("num_assignments", 0),
        )
        
        # Calculate improvement
        if (baseline_waiting_total > 0 and 
            optimized.get("total_waiting_time_hours") is not None):
            improvement_pct = (
                (baseline_waiting_total - optimized["total_waiting_time_hours"]) /
                baseline_waiting_total * 100
            )
            opt_run.improvement_percent = improvement_pct
        
        db.add(opt_run)
        db.commit()
        
        logger.info(
            f"Optimization completed: "
            f"baseline={baseline_waiting_total:.1f}h, "
            f"optimized={optimized.get('total_waiting_time_hours', 0):.1f}h"
        )
        
        # Build response
        return {
            "optimization_run_id": opt_run.id,
            "status": optimized["status"],
            "baseline_plan": baseline.get("assignments", []),
            "optimized_plan": optimized.get("assignments", []),
            "improvement_metrics": {
                "baseline_total_waiting_hours": baseline_waiting_total,
                "optimized_total_waiting_hours": optimized.get("total_waiting_time_hours", 0),
                "improvement_percent": opt_run.improvement_percent,
                "solve_time_seconds": optimized.get("solve_time_seconds", 0),
                "is_optimal": optimized.get("is_optimal", False),
            },
            "recommendations": [
                f"Optimize vessel sequencing to reduce waiting time",
                f"Consider crane allocation adjustments",
            ] if opt_run.improvement_percent and opt_run.improvement_percent > 0 else []
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Optimization failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimization/{run_id}")
def get_optimization_result(
    run_id: int,
    db: Session = Depends(get_db)
):
    """Get results of a past optimization run."""
    opt_run = db.query(OptimizationRun).filter(
        OptimizationRun.id == run_id
    ).first()
    
    if not opt_run:
        raise HTTPException(status_code=404, detail=f"Optimization run {run_id} not found")
    
    return {
        "id": opt_run.id,
        "port_id": opt_run.port_id,
        "planning_horizon_hours": opt_run.planning_horizon_hours,
        "status": opt_run.status,
        "baseline_metric": opt_run.baseline_metric,
        "optimized_metric": opt_run.optimized_metric,
        "improvement_percent": opt_run.improvement_percent,
        "num_assignments": opt_run.num_assignments,
        "solve_time_seconds": opt_run.solve_time_seconds,
        "created_at": opt_run.created_at.isoformat(),
    }
