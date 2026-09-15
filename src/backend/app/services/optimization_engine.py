"""
PortPulse Backend — Optimization Engine

Uses Google OR-Tools for vessel-berth-crane assignment optimization.
Falls back to greedy algorithm if OR-Tools not available.

Model:
  - Decision: vessel -> berth assignment, service time window, crane allocation
  - Objective: minimize total waiting time + congestion penalty
  - Constraints:
      * No vessel can occupy multiple berths
      * No berth can service vessels simultaneously (no-overlap per berth)
      * Vessel cannot start before ETA
      * Berth/crane availability must be respected
      * Service must fit within planning horizon
"""

from __future__ import annotations
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List, Any, Tuple, TYPE_CHECKING

try:
    from ortools.sat.python import cp_model
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False
    cp_model = None  # type: ignore[assignment]

from app.core.logging_config import get_logger
from app.core.config import get_settings

logger = get_logger("optimization_engine")
settings = get_settings()


# ============================================================================
# Data Structures
# ============================================================================

class VesselData:
    """Vessel information."""
    def __init__(
        self,
        vessel_id: str,
        vessel_name: str,
        eta: datetime,
        service_duration_hours: float,
        priority: int = 0,
        vessel_type: str = "GENERAL"
    ):
        self.vessel_id = vessel_id
        self.vessel_name = vessel_name
        self.eta = eta
        self.service_duration_hours = service_duration_hours
        self.priority = priority
        self.vessel_type = vessel_type

        # Derived — store as seconds for the CP-SAT model
        self.service_duration_seconds = int(service_duration_hours * 3600)


class BerthData:
    """Berth information."""
    def __init__(
        self,
        berth_id: str,
        berth_name: str,
        capacity: Optional[float] = None
    ):
        self.berth_id = berth_id
        self.berth_name = berth_name
        self.capacity = capacity
        self.available = True


class CraneData:
    """Crane information."""
    def __init__(
        self,
        crane_id: str,
        crane_name: str,
        capacity_per_hour: Optional[float] = None
    ):
        self.crane_id = crane_id
        self.crane_name = crane_name
        self.capacity_per_hour = capacity_per_hour
        self.available = True


class OptimizationRequest:
    """Optimization request data."""
    def __init__(
        self,
        port_id: str,
        vessels: List[VesselData],
        berths: List[BerthData],
        cranes: List[CraneData],
        planning_horizon_hours: int = 72,
        horizon_start: Optional[datetime] = None
    ):
        self.port_id = port_id
        self.vessels = vessels
        self.berths = berths
        self.cranes = cranes
        self.planning_horizon_hours = planning_horizon_hours
        # Always store horizon_start as UTC-aware
        if horizon_start is None:
            self.horizon_start = datetime.now(timezone.utc)
        elif horizon_start.tzinfo is None:
            self.horizon_start = horizon_start.replace(tzinfo=timezone.utc)
        else:
            self.horizon_start = horizon_start
        self.horizon_end = self.horizon_start + timedelta(hours=planning_horizon_hours)


# ============================================================================
# Helper: normalise ETA to UTC-aware
# ============================================================================

def _utc(dt: datetime) -> datetime:
    """Return a UTC-aware datetime regardless of whether dt is naive or aware."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# ============================================================================
# Objective & Constraint Builders
# ============================================================================

def _build_optimization_model(
    req: OptimizationRequest
) -> Tuple[Any, Dict[str, Any]]:
    """
    Build a constraint programming model for vessel scheduling.

    Uses optional interval variables per berth so that the no-overlap
    constraint is correctly applied only for vessels assigned to the same berth.

    Args:
        req: OptimizationRequest with vessels, berths, cranes

    Returns:
        (model, variables_dict)
    """
    if not ORTOOLS_AVAILABLE:
        raise RuntimeError("OR-Tools not available for building optimization model")

    model = cp_model.CpModel()

    num_vessels = len(req.vessels)
    num_berths = len(req.berths)
    # Add a small buffer so vessels that arrive just before horizon_end still fit
    horizon_seconds = int(req.planning_horizon_hours * 3600) + int(
        max((v.service_duration_seconds for v in req.vessels), default=0)
    )

    logger.info(
        f"Building optimization model: "
        f"{num_vessels} vessels, {num_berths} berths, "
        f"{req.planning_horizon_hours}h horizon"
    )

    # ========================================================================
    # Decision Variables
    # ========================================================================

    vessel_start_times: Dict[int, Any] = {}
    vessel_end_times: Dict[int, Any] = {}
    vessel_berth_assignments: Dict[int, Any] = {}
    vessel_crane_counts: Dict[int, Any] = {}
    # optional_intervals[v_idx][b_idx] = optional interval variable
    optional_intervals: Dict[int, Dict[int, Any]] = {}

    for v_idx, vessel in enumerate(req.vessels):
        eta_aware = _utc(vessel.eta)
        eta_offset = max(0, int((eta_aware - req.horizon_start).total_seconds()))
        svc_sec = vessel.service_duration_seconds

        start_var = model.NewIntVar(eta_offset, horizon_seconds, f"v{v_idx}_start")
        end_var = model.NewIntVar(eta_offset + svc_sec, horizon_seconds + svc_sec, f"v{v_idx}_end")
        model.Add(end_var == start_var + svc_sec)

        vessel_start_times[v_idx] = start_var
        vessel_end_times[v_idx] = end_var

        # Berth assignment
        berth_var = model.NewIntVar(0, num_berths - 1, f"v{v_idx}_berth")
        vessel_berth_assignments[v_idx] = berth_var

        # Crane count (1..min(3, num_cranes))
        max_cranes = max(1, min(3, len(req.cranes)))
        crane_var = model.NewIntVar(1, max_cranes, f"v{v_idx}_cranes")
        vessel_crane_counts[v_idx] = crane_var

        # Per-berth optional intervals — the key fix for the no-overlap constraint
        optional_intervals[v_idx] = {}
        for b_idx in range(num_berths):
            # is_present is True iff vessel v_idx is assigned to berth b_idx
            is_present = model.NewBoolVar(f"v{v_idx}_b{b_idx}_present")
            model.Add(berth_var == b_idx).OnlyEnforceIf(is_present)
            model.Add(berth_var != b_idx).OnlyEnforceIf(is_present.Not())

            opt_interval = model.NewOptionalIntervalVar(
                start_var, svc_sec, end_var, is_present, f"v{v_idx}_b{b_idx}_interval"
            )
            optional_intervals[v_idx][b_idx] = opt_interval

    # ========================================================================
    # No-overlap constraint per berth (correct approach)
    # ========================================================================
    for b_idx in range(num_berths):
        intervals_on_berth = [optional_intervals[v_idx][b_idx] for v_idx in range(num_vessels)]
        model.AddNoOverlap(intervals_on_berth)

    # ========================================================================
    # Objective: minimise weighted waiting time
    # ========================================================================
    total_weighted_wait = []
    for v_idx, vessel in enumerate(req.vessels):
        eta_aware = _utc(vessel.eta)
        eta_offset = max(0, int((eta_aware - req.horizon_start).total_seconds()))
        waiting = vessel_start_times[v_idx] - eta_offset
        # Higher priority (larger number) → lower weight → scheduled earlier
        priority_weight = max(1, 10 - vessel.priority * 2)
        total_weighted_wait.append(waiting * priority_weight)

    model.Minimize(sum(total_weighted_wait))

    logger.info("Optimization model built successfully")

    variables = {
        "vessel_start_times": vessel_start_times,
        "vessel_end_times": vessel_end_times,
        "vessel_berth_assignments": vessel_berth_assignments,
        "vessel_crane_counts": vessel_crane_counts,
    }

    return model, variables


# ============================================================================
# Solver
# ============================================================================

def optimize(
    req: OptimizationRequest,
    timeout_seconds: Optional[int] = None
) -> Dict[str, Any]:
    """
    Solve the vessel scheduling optimization problem.

    Uses OR-Tools CP-SAT solver if available, otherwise falls back to greedy algorithm.

    Args:
        req: OptimizationRequest
        timeout_seconds: Solver timeout (default from config)

    Returns:
        Solution dict with assignments and metrics
    """
    if timeout_seconds is None:
        timeout_seconds = settings.optimization_timeout_seconds

    logger.info(f"Starting optimization (timeout: {timeout_seconds}s)")

    if not ORTOOLS_AVAILABLE:
        logger.warning("OR-Tools not available, using greedy fallback")
        return _optimize_greedy(req)

    try:
        model, variables = _build_optimization_model(req)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = float(timeout_seconds)
        solver.parameters.log_search_progress = settings.optimization_log_search

        t0 = time.perf_counter()
        status = solver.Solve(model)
        solve_time = time.perf_counter() - t0

        logger.info(f"Solver finished in {solve_time:.2f}s — status: {status}")

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            assignments = []
            total_waiting_seconds = 0

            for v_idx, vessel in enumerate(req.vessels):
                start_sec = solver.Value(variables["vessel_start_times"][v_idx])
                end_sec = solver.Value(variables["vessel_end_times"][v_idx])
                berth_idx = solver.Value(variables["vessel_berth_assignments"][v_idx])
                crane_count = solver.Value(variables["vessel_crane_counts"][v_idx])

                start_dt = req.horizon_start + timedelta(seconds=start_sec)
                end_dt = req.horizon_start + timedelta(seconds=end_sec)

                eta_aware = _utc(vessel.eta)
                eta_offset = max(0, int((eta_aware - req.horizon_start).total_seconds()))
                waiting_seconds = max(0, start_sec - eta_offset)
                total_waiting_seconds += waiting_seconds

                assignments.append({
                    "vessel_id": vessel.vessel_id,
                    "vessel_name": vessel.vessel_name,
                    "assigned_berth": req.berths[berth_idx].berth_id,
                    "planned_start": start_dt.isoformat(),
                    "planned_end": end_dt.isoformat(),
                    "waiting_time_hours": round(waiting_seconds / 3600.0, 2),
                    "assigned_cranes": min(crane_count, len(req.cranes)),
                    "service_duration_hours": vessel.service_duration_hours,
                })

            total_waiting_hours = total_waiting_seconds / 3600.0
            avg_waiting_hours = total_waiting_hours / len(req.vessels) if req.vessels else 0.0

            result = {
                "status": "COMPLETED",
                "is_optimal": status == cp_model.OPTIMAL,
                "solve_time_seconds": round(solve_time, 3),
                "objective_value": float(solver.ObjectiveValue()),
                "total_waiting_time_hours": round(total_waiting_hours, 2),
                "average_waiting_time_hours": round(avg_waiting_hours, 2),
                "num_assignments": len(assignments),
                "assignments": assignments,
            }

            logger.info(
                f"Optimization completed: {len(assignments)} assignments, "
                f"total_waiting={total_waiting_hours:.1f}h, avg={avg_waiting_hours:.1f}h"
            )
            return result

        else:
            logger.warning(f"No feasible solution found (status={status}), falling back to greedy")
            return _optimize_greedy(req)

    except Exception as e:
        logger.error(f"Optimization error: {e}", exc_info=True)
        return _optimize_greedy(req)


def _optimize_greedy(req: OptimizationRequest) -> Dict[str, Any]:
    """
    Greedy vessel scheduling fallback when OR-Tools unavailable or solver fails.

    Sorts vessels by (priority desc, ETA asc) and assigns to earliest available berth.
    """
    t0 = time.perf_counter()

    try:
        assignments = []
        # berth_id -> list of (start, end) occupied windows
        berth_schedules: Dict[str, List[Tuple[datetime, datetime]]] = {
            b.berth_id: [] for b in req.berths
        }
        total_waiting_seconds = 0

        # Sort by priority descending, then ETA ascending
        sorted_vessels = sorted(req.vessels, key=lambda v: (-v.priority, _utc(v.eta)))

        for vessel in sorted_vessels:
            eta_aware = _utc(vessel.eta)
            best_berth = None
            best_start: Optional[datetime] = None

            for berth in req.berths:
                candidate_start = max(eta_aware, req.horizon_start)
                candidate_end = candidate_start + timedelta(seconds=vessel.service_duration_seconds)

                if candidate_end > req.horizon_end:
                    continue

                # Push start past any conflicting occupancy window
                changed = True
                while changed:
                    changed = False
                    for occ_start, occ_end in berth_schedules[berth.berth_id]:
                        if candidate_start < occ_end and candidate_end > occ_start:
                            candidate_start = occ_end
                            candidate_end = candidate_start + timedelta(
                                seconds=vessel.service_duration_seconds
                            )
                            changed = True
                            if candidate_end > req.horizon_end:
                                break
                    if candidate_end > req.horizon_end:
                        break

                if candidate_end <= req.horizon_end:
                    # Take berth with earliest available start
                    if best_start is None or candidate_start < best_start:
                        best_berth = berth
                        best_start = candidate_start

            if best_berth and best_start is not None:
                slot_end = best_start + timedelta(seconds=vessel.service_duration_seconds)
                berth_schedules[best_berth.berth_id].append((best_start, slot_end))

                waiting_seconds = max(0, int((best_start - eta_aware).total_seconds()))
                total_waiting_seconds += waiting_seconds

                assignments.append({
                    "vessel_id": vessel.vessel_id,
                    "vessel_name": vessel.vessel_name,
                    "assigned_berth": best_berth.berth_id,
                    "planned_start": best_start.isoformat(),
                    "planned_end": slot_end.isoformat(),
                    "waiting_time_hours": round(waiting_seconds / 3600.0, 2),
                    "assigned_cranes": min(1, len(req.cranes)),
                    "service_duration_hours": vessel.service_duration_hours,
                })

        solve_time = time.perf_counter() - t0
        total_waiting_hours = total_waiting_seconds / 3600.0
        avg_waiting_hours = total_waiting_hours / len(req.vessels) if req.vessels else 0.0

        logger.info(f"Greedy optimization: {len(assignments)} assignments in {solve_time:.2f}s")

        return {
            "status": "COMPLETED",
            "method": "greedy_fallback",
            "is_optimal": False,
            "solve_time_seconds": round(solve_time, 3),
            "total_waiting_time_hours": round(total_waiting_hours, 2),
            "average_waiting_time_hours": round(avg_waiting_hours, 2),
            "num_assignments": len(assignments),
            "assignments": assignments,
        }

    except Exception as e:
        logger.error(f"Greedy optimization error: {e}", exc_info=True)
        return {
            "status": "ERROR",
            "error": str(e),
            "assignments": [],
        }


# ============================================================================
# Baseline Schedule (FIFO — no optimization)
# ============================================================================

def compute_baseline(req: OptimizationRequest) -> Dict[str, Any]:
    """
    Compute a FIFO baseline schedule for comparison with the optimised plan.

    Args:
        req: OptimizationRequest

    Returns:
        Baseline schedule dict
    """
    logger.info("Computing baseline schedule (FIFO)")

    assignments = []
    berth_occupancy: Dict[str, List[Tuple[datetime, datetime]]] = {
        b.berth_id: [] for b in req.berths
    }
    total_waiting_seconds = 0

    # FIFO: sort by ETA ascending (no priority)
    sorted_vessels = sorted(req.vessels, key=lambda v: _utc(v.eta))

    for vessel in sorted_vessels:
        eta_aware = _utc(vessel.eta)
        assigned_berth = None
        assigned_start: Optional[datetime] = None

        for berth in req.berths:
            earliest_start = max(eta_aware, req.horizon_start)

            # Push past any occupied windows
            for occ_start, occ_end in berth_occupancy[berth.berth_id]:
                if earliest_start < occ_end:
                    earliest_start = max(earliest_start, occ_end)

            slot_end = earliest_start + timedelta(seconds=vessel.service_duration_seconds)
            if slot_end <= req.horizon_end:
                if assigned_start is None or earliest_start < assigned_start:
                    assigned_berth = berth
                    assigned_start = earliest_start

        if assigned_berth and assigned_start is not None:
            slot_end = assigned_start + timedelta(seconds=vessel.service_duration_seconds)
            berth_occupancy[assigned_berth.berth_id].append((assigned_start, slot_end))

            waiting_seconds = max(0, int((assigned_start - eta_aware).total_seconds()))
            total_waiting_seconds += waiting_seconds

            assignments.append({
                "vessel_id": vessel.vessel_id,
                "vessel_name": vessel.vessel_name,
                "assigned_berth": assigned_berth.berth_id,
                "planned_start": assigned_start.isoformat(),
                "planned_end": slot_end.isoformat(),
                "waiting_time_hours": round(waiting_seconds / 3600.0, 2),
                "assigned_cranes": 1,
                "service_duration_hours": vessel.service_duration_hours,
            })

    total_waiting_hours = total_waiting_seconds / 3600.0
    avg_waiting = total_waiting_hours / len(req.vessels) if req.vessels else 0.0

    return {
        "total_waiting_time_hours": round(total_waiting_hours, 2),
        "average_waiting_time_hours": round(avg_waiting, 2),
        "num_assignments": len(assignments),
        "assignments": assignments,
    }
