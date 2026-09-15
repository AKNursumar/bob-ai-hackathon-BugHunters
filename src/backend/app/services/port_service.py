"""
PortPulse Backend — Port Service

Manages port data and operations.
"""

from datetime import datetime, timedelta, timezone
from typing import Generator, List, Optional, Dict, Any
from sqlalchemy.orm import Session
import logging

from app.models.database_models import (
    Port, Vessel, VesselSchedule, Berth, Crane,
    CongestionPrediction, OperationsPlan
)
from app.models.schemas import PortStatusResponse
from app.core.logging_config import get_logger
from app.services.prediction_service import predict_port

logger = get_logger("port_service")

_UTC = timezone.utc


def _now_utc() -> datetime:
    return datetime.now(_UTC)


class PortService:
    """Service for port-related operations."""

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # Port Management
    # ========================================================================

    def get_port(self, port_id: str) -> Optional[Port]:
        """Get port by ID."""
        return self.db.query(Port).filter(Port.id == port_id).first()

    def list_ports(self) -> List[Port]:
        """List all ports."""
        return self.db.query(Port).all()

    def create_port(
        self,
        port_id: str,
        name: str,
        code: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Port:
        """Create a new port."""
        port = Port(
            id=port_id,
            name=name,
            code=code,
            latitude=latitude,
            longitude=longitude,
        )
        self.db.add(port)
        self.db.commit()
        logger.info(f"Created port: {port_id}")
        return port

    # ========================================================================
    # Vessel Management
    # ========================================================================

    def get_vessel(self, vessel_id: str) -> Optional[Vessel]:
        """Get vessel by ID."""
        return self.db.query(Vessel).filter(Vessel.id == vessel_id).first()

    def list_vessels(self) -> List[Vessel]:
        """List all vessels."""
        return self.db.query(Vessel).all()

    def create_vessel(
        self,
        vessel_id: str,
        vessel_name: str,
        vessel_type: str,
        port_id: Optional[str] = None,
        capacity: Optional[float] = None,
        length_m: Optional[float] = None,
        beam_m: Optional[float] = None,
        draft_m: Optional[float] = None
    ) -> Vessel:
        """Create a new vessel."""
        vessel = Vessel(
            id=vessel_id,
            vessel_name=vessel_name,
            vessel_type=vessel_type,
            port_id=port_id,
            capacity=capacity,
            length_m=length_m,
            beam_m=beam_m,
            draft_m=draft_m,
        )
        self.db.add(vessel)
        self.db.commit()
        logger.info(f"Created vessel: {vessel_id}")
        return vessel

    # ========================================================================
    # Vessel Schedule
    # ========================================================================

    def add_vessel_schedule(
        self,
        vessel_id: str,
        port_id: str,
        eta: datetime,
        expected_service_duration_hours: float,
        etd: Optional[datetime] = None,
        priority: int = 0,
        status: str = "SCHEDULED"
    ) -> VesselSchedule:
        """Add vessel schedule entry."""
        schedule = VesselSchedule(
            vessel_id=vessel_id,
            port_id=port_id,
            eta=eta,
            etd=etd,
            expected_service_duration_hours=expected_service_duration_hours,
            priority=priority,
            status=status,
        )
        self.db.add(schedule)
        self.db.commit()
        logger.info(f"Added schedule for {vessel_id} at {port_id}: ETA={eta}")
        return schedule

    def get_vessel_schedules(
        self,
        port_id: str,
        from_time: Optional[datetime] = None,
        to_time: Optional[datetime] = None
    ) -> List[VesselSchedule]:
        """Get vessel schedules for a port in a time window.

        Both from_time/to_time and stored ETAs are normalised to UTC-aware so
        comparisons work regardless of whether the DB contains naive timestamps.
        """
        query = self.db.query(VesselSchedule).filter(
            VesselSchedule.port_id == port_id
        )

        if from_time:
            # Normalise to naive UTC for SQLite (which stores naive datetimes)
            ft = from_time.replace(tzinfo=None) if from_time.tzinfo else from_time
            query = query.filter(VesselSchedule.eta >= ft)
        if to_time:
            tt = to_time.replace(tzinfo=None) if to_time.tzinfo else to_time
            query = query.filter(VesselSchedule.eta <= tt)

        return query.order_by(VesselSchedule.eta).all()

    # ========================================================================
    # Berth Management
    # ========================================================================

    def create_berth(
        self,
        berth_id: str,
        port_id: str,
        name: str,
        capacity_teu: Optional[float] = None,
        capacity_tonnage: Optional[float] = None,
        status: str = "AVAILABLE"
    ) -> Berth:
        """Create a new berth."""
        berth = Berth(
            id=berth_id,
            port_id=port_id,
            name=name,
            capacity_teu=capacity_teu,
            capacity_tonnage=capacity_tonnage,
            status=status,
        )
        self.db.add(berth)
        self.db.commit()
        logger.info(f"Created berth: {berth_id} at {port_id}")
        return berth

    def list_berths(self, port_id: str) -> List[Berth]:
        """List berths for a port."""
        return self.db.query(Berth).filter(Berth.port_id == port_id).all()

    def get_berth(self, berth_id: str) -> Optional[Berth]:
        """Get berth by ID."""
        return self.db.query(Berth).filter(Berth.id == berth_id).first()

    # ========================================================================
    # Crane Management
    # ========================================================================

    def create_crane(
        self,
        crane_id: str,
        port_id: str,
        name: str,
        berth_id: Optional[str] = None,
        capacity_teu_per_hour: Optional[float] = None,
        status: str = "AVAILABLE"
    ) -> Crane:
        """Create a new crane."""
        crane = Crane(
            id=crane_id,
            port_id=port_id,
            berth_id=berth_id,
            name=name,
            capacity_teu_per_hour=capacity_teu_per_hour,
            status=status,
        )
        self.db.add(crane)
        self.db.commit()
        logger.info(f"Created crane: {crane_id} at {port_id}")
        return crane

    def list_cranes(self, port_id: str) -> List[Crane]:
        """List cranes for a port."""
        return self.db.query(Crane).filter(Crane.port_id == port_id).all()

    def get_crane(self, crane_id: str) -> Optional[Crane]:
        """Get crane by ID."""
        return self.db.query(Crane).filter(Crane.id == crane_id).first()

    # ========================================================================
    # Port Status
    # ========================================================================

    def get_port_status(self, port_id: str) -> Optional[Dict[str, Any]]:
        """Get current operational status of a port."""
        port = self.get_port(port_id)
        if not port:
            return None

        now = _now_utc()
        window_start = now - timedelta(hours=24)
        window_end = now + timedelta(hours=72)

        schedules = self.get_vessel_schedules(port_id, window_start, window_end)

        # Normalise schedule ETAs for comparison (may be naive in DB)
        def _eta_aware(s: VesselSchedule) -> datetime:
            eta = s.eta
            return eta.replace(tzinfo=_UTC) if eta.tzinfo is None else eta

        in_port = [
            s for s in schedules
            if _eta_aware(s) <= now and (s.etd is None or _eta_aware(s) > now)
        ]
        waiting = [s for s in schedules if _eta_aware(s) > now]

        berths = self.list_berths(port_id)
        berths_occupied = [b for b in berths if b.status == "OCCUPIED"]
        berth_utilization = len(berths_occupied) / len(berths) * 100 if berths else 0.0

        cranes = self.list_cranes(port_id)
        cranes_in_use = [c for c in cranes if c.status == "IN_USE"]
        crane_utilization = len(cranes_in_use) / len(cranes) * 100 if cranes else 0.0

        latest_pred = (
            self.db.query(CongestionPrediction)
            .filter(
                CongestionPrediction.port_id == port_id,
                CongestionPrediction.horizon_hours == 24,
            )
            .order_by(CongestionPrediction.timestamp.desc())
            .first()
        )
        congestion_status = latest_pred.congestion_level if latest_pred else "UNKNOWN"

        return {
            "port_id": port_id,
            "port_name": port.name,
            "timestamp": now.isoformat(),
            "current_vessel_count": len(in_port),
            "current_berth_utilization": round(berth_utilization, 1),
            "current_crane_utilization": round(crane_utilization, 1),
            "waiting_vessels": len(waiting),
            "average_waiting_time": 0.0,
            "congestion_status": congestion_status,
        }

    # ========================================================================
    # Congestion Predictions
    # ========================================================================

    def get_latest_predictions(self, port_id: str) -> Dict[int, CongestionPrediction]:
        """Get latest prediction for each horizon (24h, 48h, 72h)."""
        predictions: Dict[int, CongestionPrediction] = {}
        for horizon in (24, 48, 72):
            pred = (
                self.db.query(CongestionPrediction)
                .filter(
                    CongestionPrediction.port_id == port_id,
                    CongestionPrediction.horizon_hours == horizon,
                )
                .order_by(CongestionPrediction.timestamp.desc())
                .first()
            )
            if pred:
                predictions[horizon] = pred
        return predictions

    def store_prediction(
        self,
        port_id: str,
        horizon_hours: int,
        congestion_probability: float,
        congestion_level: str,
        confidence: float,
        drivers: Optional[List[str]] = None,
        feature_importance: Optional[Dict] = None,
        expected_waiting_time_hours: Optional[float] = None
    ) -> CongestionPrediction:
        """Store a congestion prediction."""
        pred = CongestionPrediction(
            port_id=port_id,
            # SQLite stores datetimes without timezone info; use naive UTC here
            # so ORDER BY timestamp comparisons work correctly.
            timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
            horizon_hours=horizon_hours,
            congestion_probability=congestion_probability,
            congestion_level=congestion_level,
            confidence=confidence,
            drivers=drivers or [],
            feature_importance=feature_importance or {},
            expected_waiting_time_hours=expected_waiting_time_hours,
        )
        self.db.add(pred)
        self.db.commit()
        logger.info(
            f"Stored prediction for {port_id} ({horizon_hours}h): "
            f"{congestion_level} ({congestion_probability:.2f})"
        )
        return pred

    # ========================================================================
    # Operations Plans
    # ========================================================================

    def get_operations_plan(self, plan_id: int) -> Optional[OperationsPlan]:
        """Get operations plan by ID."""
        return self.db.query(OperationsPlan).filter(
            OperationsPlan.id == plan_id
        ).first()

    def list_operations_plans(
        self,
        port_id: str,
        limit: int = 10
    ) -> List[OperationsPlan]:
        """List recent operations plans for a port."""
        return (
            self.db.query(OperationsPlan)
            .filter(OperationsPlan.port_id == port_id)
            .order_by(OperationsPlan.generated_at.desc())
            .limit(limit)
            .all()
        )

    def create_operations_plan(
        self,
        port_id: str,
        start_time: datetime,
        end_time: datetime,
        planning_horizon_hours: int,
        plan_data: Dict[str, Any],
        metrics: Optional[Dict[str, Any]] = None,
        status: str = "DRAFT"
    ) -> OperationsPlan:
        """Create a new operations plan."""
        plan = OperationsPlan(
            port_id=port_id,
            start_time=start_time,
            end_time=end_time,
            planning_horizon_hours=planning_horizon_hours,
            status=status,
            plan_data=plan_data,
            metrics=metrics or {},
        )
        self.db.add(plan)
        self.db.commit()
        logger.info(f"Created operations plan {plan.id} for {port_id}")
        return plan
