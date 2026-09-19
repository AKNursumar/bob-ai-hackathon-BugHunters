"""Berth spatial occupancy and parallel berthing recommendations."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.database_models import Assignment
from app.models.schemas import SpaceOccupancyApplyRequest, SpaceOccupancyResponse
from app.services.space_occupancy_service import SpaceOccupancyAnalyzer

router = APIRouter()


@router.get("/space-occupancy/{port_id}", response_model=SpaceOccupancyResponse)
def analyze_space_occupancy(
    port_id: str,
    berth_id: str | None = Query(default=None),
    include_waiting_vessels: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    try:
        return SpaceOccupancyAnalyzer().analyze_port(db, port_id, berth_id, include_waiting_vessels)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/space-occupancy/apply", response_model=dict)
def apply_space_occupancy(request: SpaceOccupancyApplyRequest, db: Session = Depends(get_db)):
    analyzer = SpaceOccupancyAnalyzer()
    analysis = analyzer.analyze_port(db, request.port_id, request.berth_id, True)
    opportunity = next(
        (
            opportunity
            for berth in analysis["berths"]
            for opportunity in berth["opportunities"]
            if berth["berth_id"] == request.berth_id
            and opportunity["candidate_vessel_ids"] == request.candidate_vessel_ids
        ),
        None,
    )
    if not opportunity:
        raise HTTPException(status_code=409, detail="The proposed space occupancy opportunity is no longer feasible")

    from app.services.port_service import PortService
    from app.services.optimization_engine import OptimizationRequest, VesselData, BerthData, CraneData, optimize

    service = PortService(db)
    now = datetime.now(timezone.utc)
    schedules = service.get_vessel_schedules(request.port_id, from_time=now, to_time=now + timedelta(hours=72))
    berths = service.list_berths(request.port_id)
    cranes = service.list_cranes(request.port_id)
    vessels = [VesselData(
        vessel_id=s.vessel_id,
        vessel_name=s.vessel.vessel_name if s.vessel else s.vessel_id,
        eta=s.eta,
        service_duration_hours=s.expected_service_duration_hours,
        priority=s.priority,
        vessel_type=s.vessel.vessel_type if s.vessel else "GENERAL",
        length_m=s.vessel.length_m if s.vessel else None,
        beam_m=s.vessel.beam_m if s.vessel else None,
    ) for s in schedules]
    result = optimize(OptimizationRequest(
        port_id=request.port_id,
        vessels=vessels,
        berths=[BerthData(b.id, b.name, b.capacity_teu, b.usable_length_m, b.usable_width_m, bool(b.supports_parallel_berthing), b.safety_clearance_m) for b in berths],
        cranes=[CraneData(c.id, c.name, c.capacity_teu_per_hour) for c in cranes],
        planning_horizon_hours=72,
        horizon_start=now,
        preferred_berth_by_vessel={vessel_id: request.berth_id for vessel_id in request.candidate_vessel_ids},
    ))
    if result.get("status") != "COMPLETED":
        raise HTTPException(status_code=409, detail="The optimizer could not validate the proposed berth assignment")

    optimized_by_vessel = {item["vessel_id"]: item for item in result.get("assignments", [])}
    for vessel_id in request.candidate_vessel_ids:
        assignment = optimized_by_vessel.get(vessel_id)
        if not assignment:
            raise HTTPException(status_code=409, detail=f"The optimizer could not assign vessel {vessel_id}")
        existing = db.query(Assignment).filter(
            Assignment.vessel_id == vessel_id,
            Assignment.berth_id == request.berth_id,
        ).first()
        if existing:
            existing.planned_start = datetime.fromisoformat(assignment["planned_start"])
            existing.planned_end = datetime.fromisoformat(assignment["planned_end"])
            existing.waiting_time_hours = assignment["waiting_time_hours"]
        else:
            db.add(Assignment(
                vessel_id=vessel_id,
                berth_id=request.berth_id,
                planned_start=datetime.fromisoformat(assignment["planned_start"]),
                planned_end=datetime.fromisoformat(assignment["planned_end"]),
                waiting_time_hours=assignment["waiting_time_hours"],
            ))
    db.commit()
    return {"success": True, "opportunity": opportunity, "optimization": result}