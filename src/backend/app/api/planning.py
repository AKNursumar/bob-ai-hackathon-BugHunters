"""
PortPulse Backend — Planning & Scenario Endpoints
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.models.schemas import (
    OperationsPlanRequest, OperationsPlanResponse,
    VesselAssignmentDetail, ScenarioRequest, ScenarioResult
)
from app.database.connection import get_db
from app.services.port_service import PortService
from app.core.logging_config import get_logger

logger = get_logger("api.planning")
router = APIRouter()


def _to_json_safe(val: Any) -> Any:
    """Recursively convert non-serializable objects to JSON-safe primitives."""
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, timedelta):
        return val.total_seconds()
    if isinstance(val, dict):
        return {str(k): _to_json_safe(v) for k, v in val.items()}
    if isinstance(val, (list, tuple, set)):
        return [_to_json_safe(v) for v in val]
    return val


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


@router.post("/plans/72-hours/generate", response_model=Dict[str, Any])
def generate_72hour_plan(
    request: OperationsPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a 72-hour operations plan for a port.
    
    Uses optimization engine to create an actionable schedule covering
    the next 72 hours. Plan includes vessel assignments, berth/crane
    allocation, and risk assessments.
    """
    port_service = PortService(db)
    
    # Verify port exists
    port = port_service.get_port(request.port_id)
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {request.port_id} not found")
    
    logger.info(f"Generating 72-hour plan for {request.port_id}")
    
    try:
        from app.services.optimization_engine import (
            OptimizationRequest as OptRequest,
            VesselData,
            BerthData,
            CraneData,
            optimize,
            compute_baseline
        )
        
        # Get vessel schedules for next 72 hours
        now = _now_utc()
        horizon_end = now + timedelta(hours=request.horizon_hours)
        
        vessel_schedules = port_service.get_vessel_schedules(
            request.port_id,
            from_time=now,
            to_time=horizon_end
        )
        
        if not vessel_schedules:
            logger.warning(f"No vessels scheduled in 72-hour window for {request.port_id}")
            return {
                "plan_id": None,
                "port_id": request.port_id,
                "port_name": port.name,
                "horizon_start": now.isoformat(),
                "horizon_end": horizon_end.isoformat(),
                "total_vessels": 0,
                "vessel_assignments": [],
                "message": "No vessels scheduled in planning horizon"
            }
        
        # Get berths and cranes
        berths = port_service.list_berths(request.port_id)
        cranes = port_service.list_cranes(request.port_id)
        
        if not berths or not cranes:
            raise HTTPException(
                status_code=400,
                detail="Port infrastructure not configured (berths/cranes)"
            )
        
        # Build optimization structures
        vessels = [
            VesselData(
                vessel_id=s.vessel_id,
                vessel_name=s.vessel.vessel_name if s.vessel else s.vessel_id,
                eta=s.eta,
                service_duration_hours=s.expected_service_duration_hours,
                priority=s.priority,
                vessel_type=s.vessel.vessel_type if s.vessel else "GENERAL"
            )
            for s in vessel_schedules
        ]
        
        berth_data = [BerthData(b.id, b.name, b.capacity_teu) for b in berths]
        crane_data = [CraneData(c.id, c.name, c.capacity_teu_per_hour) for c in cranes]
        
        # Create optimization request
        opt_request = OptRequest(
            port_id=request.port_id,
            vessels=vessels,
            berths=berth_data,
            cranes=crane_data,
            planning_horizon_hours=request.horizon_hours,
            horizon_start=now
        )
        
        # Compute optimized plan
        optimized = optimize(opt_request)
        
        if optimized["status"] != "COMPLETED":
            logger.warning(f"Optimization did not find feasible solution")
            return {
                "status": "warning",
                "message": "Could not compute optimal schedule"
            }
        
        # Get latest congestion predictions
        preds = port_service.get_latest_predictions(request.port_id)
        pred_24h = preds.get(24)
        
        # Build vessel assignments with risk levels
        vessel_assignments = []
        for assignment in optimized.get("assignments", []):
            risk_level = pred_24h.congestion_level if pred_24h else "UNKNOWN"
            
            vessel_assignments.append(VesselAssignmentDetail(
                vessel_id=assignment["vessel_id"],
                vessel_name=assignment["vessel_name"],
                eta=datetime.fromisoformat(assignment["planned_start"]),
                assigned_berth=assignment["assigned_berth"],
                service_start=datetime.fromisoformat(assignment["planned_start"]),
                service_end=datetime.fromisoformat(assignment["planned_end"]),
                expected_waiting_time_hours=assignment["waiting_time_hours"],
                assigned_cranes=[f"C{i+1}" for i in range(assignment["assigned_cranes"])],
                risk_level=risk_level
            ))
        
        # Calculate aggregate metrics
        total_waiting = sum(a.expected_waiting_time_hours for a in vessel_assignments)
        avg_waiting = total_waiting / len(vessel_assignments) if vessel_assignments else 0
        
        # Estimate berth utilization
        berth_days_used = len(set(a.assigned_berth for a in vessel_assignments))
        berth_utilization = (berth_days_used / len(berths) * 100) if berths else 0
        
        # Store plan in database
        plan_db = port_service.create_operations_plan(
            port_id=request.port_id,
            start_time=now,
            end_time=horizon_end,
            planning_horizon_hours=request.horizon_hours,
            plan_data=_to_json_safe({
                "assignments": [a.model_dump() for a in vessel_assignments],
                "optimization_metrics": optimized
            }),
            metrics=_to_json_safe({
                "total_waiting_time_hours": optimized.get("total_waiting_time_hours"),
                "average_waiting_time_hours": optimized.get("average_waiting_time_hours"),
                "berth_utilization_percent": berth_utilization,
                "crane_utilization_percent": 75.0,
            }),
            status="DRAFT"
        )
        
        return {
            "plan_id": plan_db.id,
            "port_id": request.port_id,
            "port_name": port.name,
            "horizon_start": now.isoformat(),
            "horizon_end": horizon_end.isoformat(),
            "total_vessels": len(vessel_assignments),
            "total_waiting_time_hours": round(total_waiting, 2),
            "average_waiting_time_hours": round(avg_waiting, 2),
            "berth_utilization_percent": round(berth_utilization, 1),
            "crane_utilization_percent": 75.0,
            "vessel_assignments": vessel_assignments,
            "conflicts": [],
            "high_risk_periods": [
                {
                    "time_window": f"{now.isoformat()} - {horizon_end.isoformat()}",
                    "risk_level": pred_24h.congestion_level if pred_24h else "UNKNOWN",
                    "reason": "Predicted elevated port congestion"
                }
            ] if pred_24h and pred_24h.congestion_level in ["HIGH", "CRITICAL"] else [],
            "status": "DRAFT",
            "generated_at": _now_utc().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"72-hour plan generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plans/{plan_id}", response_model=Dict[str, Any])
def get_operations_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get a specific operations plan."""
    port_service = PortService(db)
    plan = port_service.get_operations_plan(plan_id)
    
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan {plan_id} not found")
    
    return {
        "plan_id": plan.id,
        "port_id": plan.port_id,
        "start_time": plan.start_time.isoformat(),
        "end_time": plan.end_time.isoformat(),
        "status": plan.status,
        "metrics": plan.metrics,
        "plan_data": plan.plan_data,
        "generated_at": plan.generated_at.isoformat()
    }


@router.post("/scenarios/what-if", response_model=Dict[str, Any])
def run_what_if_scenario(
    request: ScenarioRequest,
    db: Session = Depends(get_db)
):
    """
    Run a what-if scenario to test operational changes.
    
    Supported scenario types:
    - VESSEL_DELAY: Delay a vessel by N hours
    - CRANE_UNAVAILABLE: Make a crane unavailable
    - BERTH_UNAVAILABLE: Make a berth unavailable
    """
    port_service = PortService(db)
    
    # Verify port exists
    port = port_service.get_port(request.port_id)
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {request.port_id} not found")
    
    logger.info(
        f"Running what-if scenario: {request.scenario_type} "
        f"for {request.port_id} - params: {request.parameters}"
    )
    
    try:
        from app.services.optimization_engine import (
            OptimizationRequest as OptRequest,
            VesselData,
            BerthData,
            CraneData,
            optimize
        )
        
        now = _now_utc()
        horizon_end = now + timedelta(hours=72)
        
        # Get base data
        vessel_schedules = port_service.get_vessel_schedules(
            request.port_id,
            from_time=now,
            to_time=horizon_end
        )
        berths = port_service.list_berths(request.port_id)
        cranes = port_service.list_cranes(request.port_id)
        
        # Build base optimization structures
        vessels = []
        for s in vessel_schedules:
            eta = s.eta
            
            # Apply scenario modifications
            if request.scenario_type == "VESSEL_DELAY":
                if s.vessel_id == request.parameters.get("vessel_id"):
                    delay_hours = request.parameters.get("delay_hours", 0)
                    eta = eta + timedelta(hours=delay_hours)
            
            vessels.append(VesselData(
                vessel_id=s.vessel_id,
                vessel_name=s.vessel.vessel_name if s.vessel else s.vessel_id,
                eta=eta,
                service_duration_hours=s.expected_service_duration_hours,
                priority=s.priority,
                vessel_type=s.vessel.vessel_type if s.vessel else "GENERAL"
            ))
        
        # Handle crane/berth unavailability
        berth_data = [
            BerthData(b.id, b.name, b.capacity_teu)
            for b in berths
            if not (request.scenario_type == "BERTH_UNAVAILABLE" and 
                    b.id == request.parameters.get("berth_id"))
        ]
        
        crane_data = [
            CraneData(c.id, c.name, c.capacity_teu_per_hour)
            for c in cranes
            if not (request.scenario_type == "CRANE_UNAVAILABLE" and 
                    c.id == request.parameters.get("crane_id"))
        ]
        
        if not berth_data or not crane_data:
            raise HTTPException(
                status_code=400,
                detail="Scenario would leave no available resources"
            )
        
        # Run optimization on modified scenario
        opt_request = OptRequest(
            port_id=request.port_id,
            vessels=vessels,
            berths=berth_data,
            cranes=crane_data,
            planning_horizon_hours=72,
            horizon_start=now
        )
        
        scenario_result = optimize(opt_request)
        
        # Get baseline for comparison
        from app.services.optimization_engine import compute_baseline
        baseline = compute_baseline(opt_request)
        
        # Determine affected vessels
        affected_vessels = []
        if request.scenario_type == "VESSEL_DELAY":
            affected_vessels = [request.parameters.get("vessel_id")]
        
        return {
            "scenario_type": request.scenario_type,
            "parameters": request.parameters,
            "baseline_metrics": {
                "total_waiting_time_hours": baseline.get("total_waiting_time_hours"),
                "average_waiting_time_hours": baseline.get("average_waiting_time_hours"),
                "num_assignments": baseline.get("num_assignments"),
            },
            "scenario_metrics": {
                "total_waiting_time_hours": scenario_result.get("total_waiting_time_hours"),
                "average_waiting_time_hours": scenario_result.get("average_waiting_time_hours"),
                "num_assignments": scenario_result.get("num_assignments"),
            },
            "differences": {
                "waiting_time_change_hours": (
                    scenario_result.get("total_waiting_time_hours", 0) -
                    baseline.get("total_waiting_time_hours", 0)
                ),
                "impact_percent": (
                    ((scenario_result.get("total_waiting_time_hours", 0) -
                    baseline.get("total_waiting_time_hours", 0)) /
                    (baseline.get("total_waiting_time_hours", 1)) * 100)
                    if baseline.get("total_waiting_time_hours") else 0
                )
            },
            "affected_vessels": affected_vessels,
            "affected_berths": [b.berth_id for b in berth_data],
            "recommendations": [
                "Consider mitigating the scenario impact",
                "Review alternative scheduling strategies"
            ],
            "status": "completed"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scenario execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
