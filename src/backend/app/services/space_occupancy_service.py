"""Explainable berth space occupancy analysis."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from itertools import combinations
from typing import Any, Dict, Iterable, List, Optional


FEASIBLE = "FEASIBLE"
CONDITIONALLY_FEASIBLE = "CONDITIONALLY_FEASIBLE"
NOT_FEASIBLE = "NOT_FEASIBLE"


@dataclass
class VesselWindow:
    vessel_id: str
    vessel_name: str
    vessel_type: str
    length_m: Optional[float]
    beam_m: Optional[float]
    draft_m: Optional[float]
    eta: datetime
    duration_hours: float
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    priority: int = 0


class SpaceOccupancyAnalyzer:
    """Find safe ways to use unused physical berth length."""

    def _utc(self, value: datetime) -> datetime:
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value

    def _window(self, vessel: VesselWindow, berth: Any, start: datetime) -> Optional[tuple[datetime, datetime]]:
        candidate_start = max(self._utc(vessel.eta), self._utc(start))
        candidate_end = candidate_start + timedelta(hours=vessel.duration_hours)
        if vessel.start and vessel.end:
            candidate_start = max(candidate_start, self._utc(vessel.start))
            candidate_end = min(candidate_end, self._utc(vessel.end))
        if candidate_end <= candidate_start:
            return None
        return candidate_start, candidate_end

    def _effective_length(self, vessel: VesselWindow, berth: Any) -> Optional[float]:
        if vessel.length_m is None:
            return None
        return vessel.length_m + (berth.safety_clearance_m or 0.0)

    def check_vessel_compatibility(self, vessel: VesselWindow, berth: Any) -> tuple[bool, str]:
        if not berth.supports_parallel_berthing:
            return False, "Parallel berthing is disabled for this berth."
        if str(berth.status).upper() in {"CLOSED", "MAINTENANCE", "UNAVAILABLE"}:
            return False, f"Berth status is {berth.status}."
        if vessel.length_m is None or vessel.beam_m is None:
            return False, "Space analysis unavailable because vessel dimensions are missing."
        if berth.usable_width_m is not None and vessel.beam_m > berth.usable_width_m:
            return False, "Vessel beam exceeds the berth usable width."
        if vessel.vessel_type.lower() != "container":
            return False, "Only container vessels are compatible with this container berth."
        return True, "Compatible vessel type and dimensions."

    def calculate_berth_occupancy(self, berth: Any, existing: Iterable[VesselWindow]) -> Dict[str, Any]:
        lengths = [self._effective_length(vessel, berth) for vessel in existing]
        if any(length is None for length in lengths):
            return {"available": False, "reason": "Space analysis unavailable because existing vessel dimensions are missing."}
        occupied = sum(lengths)
        usable = berth.usable_length_m
        if usable is None:
            return {"available": False, "reason": "Berth spatial capacity is not configured."}
        available = max(0.0, usable - occupied)
        return {
            "available": True,
            "usable_length_m": usable,
            "occupied_length_m": occupied,
            "available_length_m": available,
            "occupancy_percentage": round(occupied / usable * 100, 2) if usable else 100.0,
            "available_percentage": round(max(0.0, 100 - occupied / usable * 100), 2) if usable else 0.0,
            "over_capacity": occupied > usable,
        }

    def find_parallel_opportunities(
        self,
        berth: Any,
        existing: List[VesselWindow],
        candidates: List[VesselWindow],
        cranes: Iterable[Any],
        window_start: datetime,
        window_end: datetime,
    ) -> List[Dict[str, Any]]:
        occupancy = self.calculate_berth_occupancy(berth, existing)
        if not occupancy.get("available") or occupancy.get("over_capacity"):
            return []
        available = occupancy["available_length_m"]
        compatible: List[tuple[VesselWindow, float, tuple[datetime, datetime]]] = []
        for candidate in candidates:
            valid, _ = self.check_vessel_compatibility(candidate, berth)
            candidate_window = self._window(candidate, berth, window_start)
            if valid and candidate_window and candidate_window[1] <= self._utc(window_end):
                length = self._effective_length(candidate, berth)
                if length is not None:
                    compatible.append((candidate, length, candidate_window))

        available_cranes = sum(1 for crane in cranes if str(crane.status).upper() == "AVAILABLE")
        opportunities: List[Dict[str, Any]] = []
        max_size = min(4, len(compatible))
        for size in range(1, max_size + 1):
            for selected in combinations(compatible, size):
                required = sum(item[1] for item in selected)
                if required > available:
                    continue
                windows = [item[2] for item in selected]
                start = max(item[0] for item in windows)
                end = max(item[1] for item in windows)
                if end > self._utc(window_end):
                    continue
                required_cranes = len(selected)
                resource_feasible = available_cranes >= required_cranes
                status = FEASIBLE if resource_feasible else CONDITIONALLY_FEASIBLE
                remaining = available - required
                names = ", ".join(item[0].vessel_id for item in selected)
                waiting_saved = sum(max(0.0, (item[2][0] - self._utc(item[0].eta)).total_seconds() / 3600) for item in selected)
                opportunities.append({
                    "berth_id": berth.id,
                    "existing_vessel_ids": [vessel.vessel_id for vessel in existing],
                    "candidate_vessel_ids": [item[0].vessel_id for item in selected],
                    "usable_length_m": round(occupancy["usable_length_m"], 2),
                    "occupied_length_m": round(occupancy["occupied_length_m"], 2),
                    "available_length_m": round(available, 2),
                    "required_length_m": round(required, 2),
                    "remaining_length_m": round(remaining, 2),
                    "occupancy_percentage": occupancy["occupancy_percentage"],
                    "fit_percentage": round(required / available * 100, 2) if available else 100.0,
                    "time_window_start": start.isoformat(),
                    "time_window_end": end.isoformat(),
                    "required_cranes": required_cranes,
                    "available_cranes": available_cranes,
                    "resource_feasible": resource_feasible,
                    "status": status,
                    "estimated_waiting_time_saved_hours": round(waiting_saved, 2),
                    "explanation": (
                        f"{berth.id} has {available:.0f}m of unused usable length. {names} require "
                        f"{required:.0f}m including safety clearance, leaving {remaining:.0f}m. "
                        f"The vessels pass compatibility and time-window checks; "
                        f"{available_cranes} of {required_cranes} required cranes are available."
                    ),
                })
        return sorted(
            opportunities,
            key=lambda item: (-item["estimated_waiting_time_saved_hours"], -len(item["candidate_vessel_ids"]), -item["fit_percentage"]),
        )

    def analyze_port(self, db: Any, port_id: str, berth_id: Optional[str] = None, include_waiting_vessels: bool = True) -> Dict[str, Any]:
        """Analyze persisted assignments and schedules for one port."""
        from app.models.database_models import Assignment
        from app.services.port_service import PortService

        service = PortService(db)
        port = service.get_port(port_id)
        if not port:
            raise ValueError(f"Port {port_id} not found")
        now = datetime.now(timezone.utc)
        horizon_end = now + timedelta(hours=72)
        berths = service.list_berths(port_id)
        if berth_id:
            berths = [berth for berth in berths if berth.id == berth_id]
        schedules = service.get_vessel_schedules(port_id, from_time=now, to_time=horizon_end)
        assignments = db.query(Assignment).join(Assignment.berth).filter(Assignment.berth.has(port_id=port_id)).all()
        assigned_ids = {assignment.vessel_id for assignment in assignments}
        cranes = service.list_cranes(port_id)

        def to_window(vessel: Any, schedule: Any = None, start: Any = None, end: Any = None) -> VesselWindow:
            eta = schedule.eta if schedule else start
            return VesselWindow(
                vessel_id=vessel.id,
                vessel_name=vessel.vessel_name,
                vessel_type=vessel.vessel_type or "GENERAL",
                length_m=vessel.length_m,
                beam_m=vessel.beam_m,
                draft_m=vessel.draft_m,
                eta=self._utc(eta),
                duration_hours=schedule.expected_service_duration_hours if schedule else max(0.1, (self._utc(end) - self._utc(start)).total_seconds() / 3600),
                start=start,
                end=end,
                priority=schedule.priority if schedule else 0,
            )

        result = []
        for berth in berths:
            berth_assignments = [assignment for assignment in assignments if assignment.berth_id == berth.id]
            existing = [to_window(assignment.vessel, start=assignment.planned_start, end=assignment.planned_end) for assignment in berth_assignments]
            candidates = [
                to_window(schedule.vessel, schedule=schedule)
                for schedule in schedules
                if include_waiting_vessels and schedule.vessel and schedule.vessel_id not in assigned_ids
            ]
            occupancy = self.calculate_berth_occupancy(berth, existing)
            opportunities = self.find_parallel_opportunities(berth, existing, candidates, cranes, now, horizon_end) if occupancy.get("available") else []
            result.append({
                "berth_id": berth.id,
                "berth_name": berth.name,
                "supports_parallel_berthing": bool(berth.supports_parallel_berthing),
                "usable_length_m": occupancy.get("usable_length_m"),
                "occupied_length_m": occupancy.get("occupied_length_m"),
                "available_length_m": occupancy.get("available_length_m"),
                "occupancy_percentage": occupancy.get("occupancy_percentage"),
                "available_percentage": occupancy.get("available_percentage"),
                "analysis_status": "READY" if occupancy.get("available") else occupancy.get("reason", "UNAVAILABLE"),
                "opportunities": opportunities,
            })
        return {"port_id": port_id, "generated_at": now, "berths": result}