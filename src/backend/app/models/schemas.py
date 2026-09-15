"""
PortPulse Backend — Pydantic schemas for API
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# Port & Vessel Schemas
# ============================================================================

class PortBase(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PortResponse(PortBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime


class VesselBase(BaseModel):
    id: str
    vessel_name: str
    vessel_type: str
    capacity: Optional[float] = None


class VesselResponse(VesselBase):
    model_config = ConfigDict(from_attributes=True)

    length_m: Optional[float] = None
    beam_m: Optional[float] = None
    draft_m: Optional[float] = None
    created_at: datetime


class VesselScheduleBase(BaseModel):
    vessel_id: str
    port_id: str
    eta: datetime
    etd: Optional[datetime] = None
    expected_service_duration_hours: float
    priority: int = 0
    status: str = "SCHEDULED"


class VesselScheduleResponse(VesselScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ============================================================================
# Berth & Crane Schemas
# ============================================================================

class BerthBase(BaseModel):
    id: str
    port_id: str
    name: str
    capacity_teu: Optional[float] = None
    capacity_tonnage: Optional[float] = None
    status: str = "AVAILABLE"


class BerthResponse(BerthBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime


class CraneBase(BaseModel):
    id: str
    port_id: str
    berth_id: Optional[str] = None
    name: str
    capacity_teu_per_hour: Optional[float] = None
    status: str = "AVAILABLE"


class CraneResponse(CraneBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime


# ============================================================================
# Congestion Prediction Schemas
# ============================================================================

class CongestionPredictionBase(BaseModel):
    port_id: str
    horizon_hours: int
    congestion_probability: float
    congestion_level: str
    confidence: float


class CongestionPredictionResponse(CongestionPredictionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    expected_waiting_time_hours: Optional[float] = None
    drivers: Optional[Dict[str, Any]] = None
    feature_importance: Optional[Dict[str, float]] = None
    created_at: datetime


class CongestionForecast(BaseModel):
    """Forecast for a single horizon."""
    probability: float
    risk_level: str


class CongestionReport(BaseModel):
    """Congestion status and forecast for a port."""
    port_id: str
    port_name: str
    timestamp: datetime
    current_activity: Optional[Dict[str, Any]] = None
    forecast_24h: CongestionForecast
    forecast_48h: CongestionForecast
    forecast_72h: CongestionForecast
    hotspots: List[Dict[str, Any]] = []
    data_freshness: str  # "current", "stale", "unavailable"


# ============================================================================
# Optimization & Planning Schemas
# ============================================================================

class AssignmentBase(BaseModel):
    vessel_id: str
    berth_id: str
    planned_start: datetime
    planned_end: datetime
    waiting_time_hours: float


class AssignmentResponse(AssignmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    optimization_run_id: int
    created_at: datetime


class CraneAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    crane_id: str
    expected_service_time_hours: float


class OptimizationRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    port_id: str
    planning_horizon_hours: int
    status: str
    objective_value: Optional[float] = None
    baseline_metric: Optional[float] = None
    optimized_metric: Optional[float] = None
    improvement_percent: Optional[float] = None
    num_assignments: int
    solve_time_seconds: Optional[float] = None
    created_at: datetime


class OptimizationRequest(BaseModel):
    """Request to run optimization."""
    port_id: str
    planning_horizon_hours: int = 72
    objective_weights: Optional[Dict[str, float]] = None
    constraints: Optional[Dict[str, Any]] = None


class OptimizationResult(BaseModel):
    """Result of optimization."""
    optimization_run_id: int
    baseline_plan: List[Dict[str, Any]]
    optimized_plan: List[Dict[str, Any]]
    improvement_metrics: Dict[str, float]
    recommendations: List[str]


# ============================================================================
# Scenario Schemas
# ============================================================================

class ScenarioRequest(BaseModel):
    """Request to run a what-if scenario."""
    port_id: str
    scenario_type: str  # VESSEL_DELAY, CRANE_UNAVAILABLE, etc.
    parameters: Dict[str, Any]


class ScenarioResult(BaseModel):
    """Result of scenario simulation."""
    scenario_id: int
    baseline_metrics: Dict[str, float]
    scenario_metrics: Dict[str, float]
    differences: Dict[str, float]
    affected_vessels: List[str]
    affected_berths: List[str]
    recommendations: List[str]


# ============================================================================
# Operations Plan Schemas
# ============================================================================

class OperationsPlanRequest(BaseModel):
    """Request to generate a 72-hour plan."""
    port_id: str
    horizon_hours: int = 72


class VesselAssignmentDetail(BaseModel):
    """Detail of vessel assignment in plan."""
    vessel_id: str
    vessel_name: str
    eta: datetime
    assigned_berth: str
    service_start: datetime
    service_end: datetime
    expected_waiting_time_hours: float
    assigned_cranes: List[str]
    risk_level: str


class OperationsPlanResponse(BaseModel):
    """72-hour operations plan."""
    model_config = ConfigDict(from_attributes=True)

    plan_id: int
    port_id: str
    port_name: str
    horizon_start: datetime
    horizon_end: datetime
    total_vessels: int
    total_waiting_time_hours: float
    average_waiting_time_hours: float
    berth_utilization_percent: float
    crane_utilization_percent: float
    vessel_assignments: List[VesselAssignmentDetail]
    conflicts: List[str]
    high_risk_periods: List[Dict[str, Any]]
    status: str
    generated_at: datetime


# ============================================================================
# Health & Status Schemas
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str  # "ok", "degraded", "error"
    timestamp: datetime
    version: str
    database: str
    ml_service: str


class PortStatusResponse(BaseModel):
    """Current port operational status."""
    port_id: str
    port_name: str
    timestamp: datetime
    current_vessel_count: int
    current_berth_utilization: float
    current_crane_utilization: float
    waiting_vessels: int
    average_waiting_time: float
    congestion_status: str  # LOW, MODERATE, HIGH, CRITICAL


# ============================================================================
# Frontend dashboard and monitoring schemas
# ============================================================================

class DashboardSummaryResponse(BaseModel):
    lastUpdated: str
    portName: str
    systemStatus: str
    kpis: Dict[str, Dict[str, Any]]
    congestionTrend: List[Dict[str, Any]]
    berthUtilisations: List[Dict[str, Any]]
    activeRisks: List[Dict[str, Any]]
    aiRecommendation: Dict[str, Any]
    operationsSummary: Dict[str, Any]


class MonitoringDataResponse(BaseModel):
    summary: Dict[str, Any]
    vessels: List[Dict[str, Any]]
    berths: List[Dict[str, Any]]
    activityHistory: List[Dict[str, Any]]

