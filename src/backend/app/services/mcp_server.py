"""
PortPulse Backend — MCP Server for IBM Bob Integration

MCP (Model Context Protocol) server that exposes PortPulse tools to IBM Bob.
This allows Bob to query port status, get forecasts, run optimizations, etc.

Tools exposed:
 1. get_port_status          — Current port operational status
 2. get_vessel_schedule      — Scheduled vessels
 3. get_congestion_forecast  — 24h/48h/72h forecasts (live ML + DB cache)
 4. get_congestion_hotspots  — High-risk areas and time windows
 5. get_berth_status         — Berth availability
 6. get_crane_status         — Crane availability
 7. optimise_schedule        — Run full vessel-berth-crane optimization
 8. run_what_if              — Scenario simulation (delay, unavailability)
 9. generate_72_hour_plan    — Generate + store a 72-hour operations plan
10. explain_congestion       — Explain forecast risk drivers
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger("portpulse.mcp")

# ---------------------------------------------------------------------------
# DB session factory — can be overridden by tests via set_db_factory()
# ---------------------------------------------------------------------------

_db_factory = None  # set lazily from SessionLocal on first use


def _get_db_factory():
    """Return the session factory, defaulting to the app's SessionLocal."""
    global _db_factory
    if _db_factory is None:
        from app.database.connection import SessionLocal
        _db_factory = SessionLocal
    return _db_factory


def set_db_factory(factory) -> None:
    """Override the DB session factory (used by tests to inject in-memory DB)."""
    global _db_factory
    _db_factory = factory


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _naive_utc() -> datetime:
    """Naive UTC timestamp for SQLite-stored datetimes."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# Base Tool
# ---------------------------------------------------------------------------

class MCPTool:
    """Base class for MCP tools."""

    def __init__(self, name: str, description: str, inputSchema: Dict[str, Any]):
        self.name = name
        self.description = description
        self.inputSchema = inputSchema

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

class GetPortStatusTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="get_port_status",
            description="Get current operational status of a port including vessel count, berth/crane utilisation and congestion level.",
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    }
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService

        port_id = arguments.get("port_id", "")
        db = _get_db_factory()()
        try:
            service = PortService(db)
            status = service.get_port_status(port_id)
            if status is None:
                return {"success": False, "error": f"Port '{port_id}' not found"}
            return {"success": True, "data": status}
        finally:
            db.close()


class GetVesselScheduleTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="get_vessel_schedule",
            description="Get scheduled vessels for a port within a given planning window.",
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    },
                    "horizon_hours": {
                        "type": "integer",
                        "description": "Planning window in hours (default 72)",
                        "default": 72,
                    },
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService

        port_id = arguments.get("port_id", "")
        horizon_hours = int(arguments.get("horizon_hours", 72))
        db = _get_db_factory()()
        try:
            service = PortService(db)
            now = _naive_utc()
            schedules = service.get_vessel_schedules(
                port_id,
                from_time=now,
                to_time=now + timedelta(hours=horizon_hours),
            )
            vessels = [
                {
                    "vessel_id": s.vessel_id,
                    "vessel_name": s.vessel.vessel_name if s.vessel else s.vessel_id,
                    "eta": s.eta.isoformat(),
                    "expected_service_duration_hours": s.expected_service_duration_hours,
                    "priority": s.priority,
                    "status": s.status,
                }
                for s in schedules
            ]
            return {
                "success": True,
                "port_id": port_id,
                "horizon_hours": horizon_hours,
                "vessel_count": len(vessels),
                "vessels": vessels,
            }
        except Exception as e:
            logger.error(f"get_vessel_schedule error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class GetCongestionForecastTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="get_congestion_forecast",
            description=(
                "Get ML congestion forecast for a port. "
                "Returns 24h, 48h and 72h probability and risk level. "
                "Calls the live ML model if no cached prediction is available."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    },
                    "horizon": {
                        "type": "string",
                        "description": "Forecast horizon: 24h, 48h, or 72h (default: 24h)",
                        "enum": ["24h", "48h", "72h"],
                        "default": "24h",
                    },
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService
        from app.services.prediction_service import predict_port

        port_id = arguments.get("port_id", "")
        horizon = arguments.get("horizon", "24h")
        horizon_hours = int(horizon.replace("h", ""))

        db = _get_db_factory()()
        try:
            service = PortService(db)

            # Check DB cache first
            predictions = service.get_latest_predictions(port_id)
            pred = predictions.get(horizon_hours)

            # If no cached prediction, run the ML pipeline and persist
            if pred is None:
                logger.info(f"No cached prediction for {port_id}/{horizon} — running ML pipeline")
                ml_result = predict_port(port_id, horizons=[horizon_hours // 24])
                forecast = ml_result.get("forecast", {})
                f = forecast.get(f"forecast_{horizon_hours}h", {})
                if f.get("probability") is not None:
                    service.store_prediction(
                        port_id=port_id,
                        horizon_hours=horizon_hours,
                        congestion_probability=f["probability"],
                        congestion_level=f["risk"],
                        confidence=f.get("confidence", 0.5),
                        drivers=ml_result.get("drivers", []),
                        feature_importance=ml_result.get("feature_importance", {}),
                    )
                    predictions = service.get_latest_predictions(port_id)
                    pred = predictions.get(horizon_hours)

            if pred is None:
                return {
                    "success": False,
                    "error": f"No forecast available for {port_id} / {horizon}",
                }

            ts = pred.timestamp
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)

            return {
                "success": True,
                "port_id": port_id,
                "horizon_hours": horizon_hours,
                "timestamp": ts.isoformat(),
                "congestion_probability": pred.congestion_probability,
                "congestion_level": pred.congestion_level,
                "confidence": pred.confidence,
                "drivers": pred.drivers,
                "feature_importance": pred.feature_importance,
            }
        except Exception as e:
            logger.error(f"get_congestion_forecast error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class GetCongestionHotspotsTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="get_congestion_hotspots",
            description="Get high-risk congestion time windows for a port.",
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    },
                    "horizon_hours": {
                        "type": "integer",
                        "description": "Horizon in hours: 24, 48, or 72 (default 24)",
                        "default": 24,
                    },
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService

        port_id = arguments.get("port_id", "")
        horizon_hours = int(arguments.get("horizon_hours", 24))
        horizon_hours = max(24, min(72, (horizon_hours // 24) * 24))  # snap to 24/48/72

        db = _get_db_factory()()
        try:
            service = PortService(db)
            port = service.get_port(port_id)
            if not port:
                return {"success": False, "error": f"Port '{port_id}' not found"}

            preds = service.get_latest_predictions(port_id)
            hotspots: List[Dict[str, Any]] = []
            now = _now_utc()

            pred = preds.get(horizon_hours)
            if pred and pred.congestion_level in ("HIGH", "CRITICAL"):
                ts = pred.timestamp
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                hotspots.append({
                    "location": "Port-level",
                    "risk_level": pred.congestion_level,
                    "time_window_start": ts.isoformat(),
                    "time_window_end": (ts + timedelta(hours=horizon_hours)).isoformat(),
                    "reason": "Predicted elevated port activity",
                    "congestion_probability": pred.congestion_probability,
                    "expected_waiting_time_increase_percent": min(
                        100, (pred.congestion_probability * 100 - 50) * 2
                    ),
                })

            return {
                "success": True,
                "port_id": port_id,
                "horizon_hours": horizon_hours,
                "timestamp": now.isoformat(),
                "hotspot_count": len(hotspots),
                "hotspots": hotspots,
            }
        except Exception as e:
            logger.error(f"get_congestion_hotspots error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class GetBerthStatusTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="get_berth_status",
            description="Get berth availability and status for a port.",
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    }
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService

        port_id = arguments.get("port_id", "")
        db = _get_db_factory()()
        try:
            service = PortService(db)
            port = service.get_port(port_id)
            if not port:
                return {"success": False, "error": f"Port '{port_id}' not found"}

            berths = service.list_berths(port_id)
            berth_list = [
                {
                    "berth_id": b.id,
                    "name": b.name,
                    "status": b.status,
                    "capacity_teu": b.capacity_teu,
                    "capacity_tonnage": b.capacity_tonnage,
                }
                for b in berths
            ]
            available_count = sum(1 for b in berths if b.status == "AVAILABLE")
            return {
                "success": True,
                "port_id": port_id,
                "total_berths": len(berths),
                "available_berths": available_count,
                "occupied_berths": len(berths) - available_count,
                "utilisation_percent": round(
                    (len(berths) - available_count) / len(berths) * 100, 1
                ) if berths else 0.0,
                "berths": berth_list,
            }
        except Exception as e:
            logger.error(f"get_berth_status error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class GetCraneStatusTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="get_crane_status",
            description="Get crane availability and status for a port.",
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    }
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService

        port_id = arguments.get("port_id", "")
        db = _get_db_factory()()
        try:
            service = PortService(db)
            port = service.get_port(port_id)
            if not port:
                return {"success": False, "error": f"Port '{port_id}' not found"}

            cranes = service.list_cranes(port_id)
            crane_list = [
                {
                    "crane_id": c.id,
                    "name": c.name,
                    "berth_id": c.berth_id,
                    "status": c.status,
                    "capacity_teu_per_hour": c.capacity_teu_per_hour,
                }
                for c in cranes
            ]
            available_count = sum(1 for c in cranes if c.status == "AVAILABLE")
            return {
                "success": True,
                "port_id": port_id,
                "total_cranes": len(cranes),
                "available_cranes": available_count,
                "in_use_cranes": sum(1 for c in cranes if c.status == "IN_USE"),
                "utilisation_percent": round(
                    sum(1 for c in cranes if c.status == "IN_USE") / len(cranes) * 100, 1
                ) if cranes else 0.0,
                "cranes": crane_list,
            }
        except Exception as e:
            logger.error(f"get_crane_status error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class AnalyzeSpaceOccupancyTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="analyze_space_occupancy",
            description=(
                "Analyze scheduled berth occupancy and identify safe, physically feasible opportunities "
                "to accommodate additional compatible vessels in unused berth space."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {"type": "string"},
                    "berth_id": {"type": "string", "description": "Optional berth filter"},
                    "include_waiting_vessels": {"type": "boolean", "default": True},
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        db = _get_db_factory()()
        try:
            from app.services.space_occupancy_service import SpaceOccupancyAnalyzer
            data = SpaceOccupancyAnalyzer().analyze_port(
                db,
                arguments.get("port_id", ""),
                arguments.get("berth_id"),
                bool(arguments.get("include_waiting_vessels", True)),
            )
            opportunity_count = sum(len(berth["opportunities"]) for berth in data["berths"])
            return {"success": True, **data, "opportunity_count": opportunity_count}
        except Exception as e:
            logger.error(f"analyze_space_occupancy error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class OptimiseScheduleTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="optimise_schedule",
            description=(
                "Run the vessel-berth-crane optimization for a port and return "
                "both the baseline FIFO schedule and the optimized plan with "
                "improvement metrics."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    },
                    "horizon_hours": {
                        "type": "integer",
                        "description": "Planning horizon in hours (default 72)",
                        "default": 72,
                    },
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService
        from app.services.optimization_engine import (
            OptimizationRequest as OptRequest,
            VesselData,
            BerthData,
            CraneData,
            optimize,
            compute_baseline,
        )

        port_id = arguments.get("port_id", "")
        horizon_hours = int(arguments.get("horizon_hours", 72))

        db = _get_db_factory()()
        try:
            service = PortService(db)

            port = service.get_port(port_id)
            if not port:
                return {"success": False, "error": f"Port '{port_id}' not found"}

            now = _now_utc()
            vessel_schedules = service.get_vessel_schedules(
                port_id,
                from_time=now,
                to_time=now + timedelta(hours=horizon_hours),
            )
            if not vessel_schedules:
                return {
                    "success": False,
                    "error": "No vessels scheduled in the planning horizon",
                }

            berths = service.list_berths(port_id)
            cranes = service.list_cranes(port_id)
            if not berths:
                return {"success": False, "error": "No berths configured for this port"}
            if not cranes:
                return {"success": False, "error": "No cranes configured for this port"}

            vessels = [
                VesselData(
                    vessel_id=s.vessel_id,
                    vessel_name=s.vessel.vessel_name if s.vessel else s.vessel_id,
                    eta=s.eta,
                    service_duration_hours=s.expected_service_duration_hours,
                    priority=s.priority,
                    vessel_type=s.vessel.vessel_type if s.vessel else "GENERAL",
                    length_m=s.vessel.length_m if s.vessel else None,
                    beam_m=s.vessel.beam_m if s.vessel else None,
                )
                for s in vessel_schedules
            ]
            berth_data = [BerthData(b.id, b.name, b.capacity_teu, b.usable_length_m, b.usable_width_m, bool(b.supports_parallel_berthing), b.safety_clearance_m) for b in berths]
            crane_data = [CraneData(c.id, c.name, c.capacity_teu_per_hour) for c in cranes]

            opt_req = OptRequest(
                port_id=port_id,
                vessels=vessels,
                berths=berth_data,
                cranes=crane_data,
                planning_horizon_hours=horizon_hours,
                horizon_start=now,
            )

            baseline = compute_baseline(opt_req)
            optimized = optimize(opt_req)

            baseline_wait = baseline.get("total_waiting_time_hours", 0)
            optimized_wait = optimized.get("total_waiting_time_hours", 0)
            improvement_pct = (
                round((baseline_wait - optimized_wait) / baseline_wait * 100, 1)
                if baseline_wait > 0 else 0.0
            )

            return {
                "success": True,
                "port_id": port_id,
                "horizon_hours": horizon_hours,
                "status": optimized.get("status"),
                "is_optimal": optimized.get("is_optimal", False),
                "solve_time_seconds": optimized.get("solve_time_seconds"),
                "vessel_count": len(vessels),
                "improvement_metrics": {
                    "baseline_total_waiting_hours": baseline_wait,
                    "optimized_total_waiting_hours": optimized_wait,
                    "improvement_percent": improvement_pct,
                },
                "optimized_assignments": optimized.get("assignments", []),
            }
        except Exception as e:
            logger.error(f"optimise_schedule error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class RunWhatIfTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="run_what_if",
            description=(
                "Run a what-if scenario to test the impact of operational changes. "
                "Scenario types: VESSEL_DELAY (delay a vessel by N hours), "
                "CRANE_UNAVAILABLE (remove a crane), BERTH_UNAVAILABLE (remove a berth)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    },
                    "scenario_type": {
                        "type": "string",
                        "description": "Type of scenario",
                        "enum": ["VESSEL_DELAY", "CRANE_UNAVAILABLE", "BERTH_UNAVAILABLE"],
                    },
                    "parameters": {
                        "type": "object",
                        "description": (
                            "Scenario parameters. "
                            "VESSEL_DELAY: {vessel_id, delay_hours}. "
                            "CRANE_UNAVAILABLE: {crane_id}. "
                            "BERTH_UNAVAILABLE: {berth_id}."
                        ),
                    },
                },
                "required": ["port_id", "scenario_type", "parameters"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService
        from app.services.optimization_engine import (
            OptimizationRequest as OptRequest,
            VesselData,
            BerthData,
            CraneData,
            optimize,
            compute_baseline,
        )

        port_id = arguments.get("port_id", "")
        scenario_type = arguments.get("scenario_type", "")
        parameters = arguments.get("parameters", {})

        db = _get_db_factory()()
        try:
            service = PortService(db)

            port = service.get_port(port_id)
            if not port:
                return {"success": False, "error": f"Port '{port_id}' not found"}

            now = _now_utc()
            vessel_schedules = service.get_vessel_schedules(
                port_id,
                from_time=now,
                to_time=now + timedelta(hours=72),
            )
            berths = service.list_berths(port_id)
            cranes = service.list_cranes(port_id)

            if not vessel_schedules or not berths or not cranes:
                return {"success": False, "error": "Insufficient port data for scenario simulation"}

            # Apply scenario modifications
            vessels = []
            for s in vessel_schedules:
                eta = s.eta
                # Normalise naive DB datetime to UTC-aware
                if eta.tzinfo is None:
                    eta = eta.replace(tzinfo=timezone.utc)

                if scenario_type == "VESSEL_DELAY":
                    if s.vessel_id == parameters.get("vessel_id"):
                        eta = eta + timedelta(hours=float(parameters.get("delay_hours", 0)))

                vessels.append(VesselData(
                    vessel_id=s.vessel_id,
                    vessel_name=s.vessel.vessel_name if s.vessel else s.vessel_id,
                    eta=eta,
                    service_duration_hours=s.expected_service_duration_hours,
                    priority=s.priority,
                    vessel_type=s.vessel.vessel_type if s.vessel else "GENERAL",
                    length_m=s.vessel.length_m if s.vessel else None,
                    beam_m=s.vessel.beam_m if s.vessel else None,
                ))

            berth_data = [
                BerthData(b.id, b.name, b.capacity_teu, b.usable_length_m, b.usable_width_m, bool(b.supports_parallel_berthing), b.safety_clearance_m)
                for b in berths
                if not (scenario_type == "BERTH_UNAVAILABLE" and b.id == parameters.get("berth_id"))
            ]
            crane_data = [
                CraneData(c.id, c.name, c.capacity_teu_per_hour)
                for c in cranes
                if not (scenario_type == "CRANE_UNAVAILABLE" and c.id == parameters.get("crane_id"))
            ]

            if not berth_data or not crane_data:
                return {"success": False, "error": "Scenario would leave no available resources"}

            opt_req = OptRequest(
                port_id=port_id,
                vessels=vessels,
                berths=berth_data,
                cranes=crane_data,
                planning_horizon_hours=72,
                horizon_start=now,
            )

            baseline = compute_baseline(opt_req)
            scenario_result = optimize(opt_req)

            baseline_wait = baseline.get("total_waiting_time_hours", 0)
            scenario_wait = scenario_result.get("total_waiting_time_hours", 0)
            impact_pct = (
                round((scenario_wait - baseline_wait) / baseline_wait * 100, 1)
                if baseline_wait > 0 else 0.0
            )

            affected_vessels = (
                [parameters.get("vessel_id")]
                if scenario_type == "VESSEL_DELAY" else []
            )

            return {
                "success": True,
                "scenario_type": scenario_type,
                "parameters": parameters,
                "baseline_metrics": {
                    "total_waiting_time_hours": baseline_wait,
                    "average_waiting_time_hours": baseline.get("average_waiting_time_hours"),
                    "num_assignments": baseline.get("num_assignments"),
                },
                "scenario_metrics": {
                    "total_waiting_time_hours": scenario_wait,
                    "average_waiting_time_hours": scenario_result.get("average_waiting_time_hours"),
                    "num_assignments": scenario_result.get("num_assignments"),
                },
                "differences": {
                    "waiting_time_change_hours": round(scenario_wait - baseline_wait, 2),
                    "impact_percent": impact_pct,
                },
                "affected_vessels": affected_vessels,
                "recommendations": [
                    "Consider mitigating the scenario impact",
                    "Review alternative scheduling strategies",
                ],
            }
        except Exception as e:
            logger.error(f"run_what_if error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class Generate72HourPlanTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="generate_72_hour_plan",
            description=(
                "Generate and store an optimized 72-hour operations plan for a port. "
                "Returns the plan with vessel assignments, metrics, and risk periods."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    }
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService
        from app.services.optimization_engine import (
            OptimizationRequest as OptRequest,
            VesselData,
            BerthData,
            CraneData,
            optimize,
        )

        port_id = arguments.get("port_id", "")
        db = _get_db_factory()()
        try:
            service = PortService(db)

            port = service.get_port(port_id)
            if not port:
                return {"success": False, "error": f"Port '{port_id}' not found"}

            now = _now_utc()
            horizon_end = now + timedelta(hours=72)

            vessel_schedules = service.get_vessel_schedules(
                port_id, from_time=now, to_time=horizon_end
            )
            berths = service.list_berths(port_id)
            cranes = service.list_cranes(port_id)

            if not vessel_schedules:
                return {"success": False, "error": "No vessels scheduled in 72-hour window"}
            if not berths or not cranes:
                return {"success": False, "error": "Port infrastructure not configured (berths/cranes)"}

            vessels = [
                VesselData(
                    vessel_id=s.vessel_id,
                    vessel_name=s.vessel.vessel_name if s.vessel else s.vessel_id,
                    eta=s.eta,
                    service_duration_hours=s.expected_service_duration_hours,
                    priority=s.priority,
                    vessel_type=s.vessel.vessel_type if s.vessel else "GENERAL",
                    length_m=s.vessel.length_m if s.vessel else None,
                    beam_m=s.vessel.beam_m if s.vessel else None,
                )
                for s in vessel_schedules
            ]
            berth_data = [BerthData(b.id, b.name, b.capacity_teu, b.usable_length_m, b.usable_width_m, bool(b.supports_parallel_berthing), b.safety_clearance_m) for b in berths]
            crane_data = [CraneData(c.id, c.name, c.capacity_teu_per_hour) for c in cranes]

            opt_req = OptRequest(
                port_id=port_id,
                vessels=vessels,
                berths=berth_data,
                cranes=crane_data,
                planning_horizon_hours=72,
                horizon_start=now,
            )
            optimized = optimize(opt_req)

            if optimized.get("status") != "COMPLETED":
                return {"success": False, "error": "Optimization did not find a feasible solution"}

            # Persist the plan
            preds = service.get_latest_predictions(port_id)
            pred_24h = preds.get(24)
            total_wait = optimized.get("total_waiting_time_hours", 0)
            avg_wait = optimized.get("average_waiting_time_hours", 0)
            berths_used = len({a["assigned_berth"] for a in optimized.get("assignments", [])})
            berth_util = round(berths_used / len(berths) * 100, 1) if berths else 0.0

            plan_db = service.create_operations_plan(
                port_id=port_id,
                start_time=now.replace(tzinfo=None),
                end_time=horizon_end.replace(tzinfo=None),
                planning_horizon_hours=72,
                plan_data={"assignments": optimized.get("assignments", []), "optimization_metrics": optimized},
                metrics={
                    "total_waiting_time_hours": total_wait,
                    "average_waiting_time_hours": avg_wait,
                    "berth_utilization_percent": berth_util,
                    "crane_utilization_percent": 75.0,
                },
                status="DRAFT",
            )

            return {
                "success": True,
                "plan_id": plan_db.id,
                "port_id": port_id,
                "port_name": port.name,
                "horizon_start": now.isoformat(),
                "horizon_end": horizon_end.isoformat(),
                "total_vessels": len(vessel_schedules),
                "total_waiting_time_hours": round(total_wait, 2),
                "average_waiting_time_hours": round(avg_wait, 2),
                "berth_utilization_percent": berth_util,
                "status": "DRAFT",
                "high_risk": pred_24h is not None and pred_24h.congestion_level in ("HIGH", "CRITICAL"),
                "current_congestion_level": pred_24h.congestion_level if pred_24h else "UNKNOWN",
                "assignments_count": len(optimized.get("assignments", [])),
            }
        except Exception as e:
            logger.error(f"generate_72_hour_plan error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


class ExplainCongestionTool(MCPTool):
    def __init__(self):
        super().__init__(
            name="explain_congestion",
            description=(
                "Explain the key risk drivers behind a congestion forecast. "
                "Returns top contributing features with direction and importance, "
                "plus a human-readable summary Bob can present to operators."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "port_id": {
                        "type": "string",
                        "description": "Port identifier: port776, port777, port235, port540, port1367",
                    },
                    "horizon": {
                        "type": "string",
                        "description": "Forecast horizon: 24h, 48h, or 72h (default 24h)",
                        "enum": ["24h", "48h", "72h"],
                        "default": "24h",
                    },
                },
                "required": ["port_id"],
            },
        )

    async def execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from app.database.connection import SessionLocal
        from app.services.port_service import PortService
        from app.services.prediction_service import predict_port, _get_top_drivers

        port_id = arguments.get("port_id", "")
        horizon = arguments.get("horizon", "24h")
        horizon_hours = int(horizon.replace("h", ""))

        db = _get_db_factory()()
        try:
            service = PortService(db)

            port = service.get_port(port_id)
            if not port:
                return {"success": False, "error": f"Port '{port_id}' not found"}

            # Try cached prediction first
            predictions = service.get_latest_predictions(port_id)
            pred = predictions.get(horizon_hours)

            # If nothing in DB, fetch fresh from ML
            if pred is None:
                ml_result = predict_port(port_id, horizons=[horizon_hours // 24])
                forecast = ml_result.get("forecast", {})
                f = forecast.get(f"forecast_{horizon_hours}h", {})
                if f.get("probability") is not None:
                    service.store_prediction(
                        port_id=port_id,
                        horizon_hours=horizon_hours,
                        congestion_probability=f["probability"],
                        congestion_level=f["risk"],
                        confidence=f.get("confidence", 0.5),
                        drivers=ml_result.get("drivers", []),
                        feature_importance=ml_result.get("feature_importance", {}),
                    )
                    predictions = service.get_latest_predictions(port_id)
                    pred = predictions.get(horizon_hours)

            if pred is None:
                return {"success": False, "error": f"No forecast data available for {port_id} / {horizon}"}

            drivers = pred.drivers or []
            feature_importance = pred.feature_importance or {}

            # Human-readable driver explanations
            _driver_labels: Dict[str, str] = {
                "waiting_vessels_change_1d": "Vessels at anchor increased day-over-day",
                "waiting_vessels_change_7d": "Vessels at anchor elevated vs last week",
                "unique_vessels_anchor_rolling_mean_14": "14-day anchor queue above historical average",
                "unique_vessels_anchor_rolling_mean_30": "30-day anchor queue elevated",
                "anchor_pings_lag_1": "High anchor-zone AIS activity yesterday",
                "anchor_pings_rolling_mean_7": "Sustained anchor traffic over 7 days",
                "berth_pings_rolling_mean_14": "Berth throughput elevated over 14 days",
                "unique_vessels_lag_1": "Total vessel count was high yesterday",
            }
            readable_drivers = [
                _driver_labels.get(d, d.replace("_", " ").capitalize())
                for d in drivers[:5]
            ]

            risk = pred.congestion_level
            prob = pred.congestion_probability

            summary_parts = [
                f"The {horizon} congestion forecast for {port.name} is {risk} "
                f"(probability: {prob:.0%})."
            ]
            if readable_drivers:
                summary_parts.append(
                    "Key contributing factors: " + "; ".join(readable_drivers) + "."
                )
            if risk in ("HIGH", "CRITICAL"):
                summary_parts.append(
                    "Recommend reviewing berth allocation and vessel sequencing "
                    "to reduce expected waiting times."
                )

            return {
                "success": True,
                "port_id": port_id,
                "port_name": port.name,
                "horizon": horizon,
                "congestion_level": risk,
                "congestion_probability": prob,
                "confidence": pred.confidence,
                "top_drivers": drivers[:5],
                "driver_explanations": readable_drivers,
                "feature_importance": feature_importance,
                "summary": " ".join(summary_parts),
            }
        except Exception as e:
            logger.error(f"explain_congestion error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        finally:
            db.close()


# ---------------------------------------------------------------------------
# MCP Server
# ---------------------------------------------------------------------------

class MCPServer:
    """MCP Server for PortPulse — exposes tools to IBM Bob."""

    def __init__(self):
        self.tools: Dict[str, MCPTool] = {}
        self._register_tools()

    def _register_tools(self) -> None:
        for tool in [
            GetPortStatusTool(),
            GetVesselScheduleTool(),
            GetCongestionForecastTool(),
            GetCongestionHotspotsTool(),
            GetBerthStatusTool(),
            GetCraneStatusTool(),
            AnalyzeSpaceOccupancyTool(),
            OptimiseScheduleTool(),
            RunWhatIfTool(),
            Generate72HourPlanTool(),
            ExplainCongestionTool(),
        ]:
            self.tools[tool.name] = tool
            logger.info(f"Registered MCP tool: {tool.name}")

    def get_tools(self) -> List[Dict[str, Any]]:
        """Return tool manifests (name, description, inputSchema)."""
        return [
            {
                "name": t.name,
                "description": t.description,
                "inputSchema": t.inputSchema,
            }
            for t in self.tools.values()
        ]

    async def call_tool(
        self, tool_name: str, arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Dispatch a tool call. Raises KeyError for unknown tool names."""
        if tool_name not in self.tools:
            raise KeyError(f"Unknown tool: '{tool_name}'")

        tool = self.tools[tool_name]
        try:
            return await tool.execute(arguments)
        except Exception as e:
            logger.error(f"Tool '{tool_name}' execution error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_mcp_server: Optional[MCPServer] = None


def get_mcp_server() -> MCPServer:
    """Return (or lazily create) the singleton MCPServer."""
    global _mcp_server
    if _mcp_server is None:
        _mcp_server = MCPServer()
    return _mcp_server

