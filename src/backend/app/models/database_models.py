"""
PortPulse Backend — SQLAlchemy database models
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Port(Base):
    """Port entity."""
    __tablename__ = "ports"
    
    id = Column(String, primary_key=True)  # port235, port776, port777
    name = Column(String, index=True)  # Display name
    code = Column(String, index=True)  # UN/LOCODE if available
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    vessels = relationship("Vessel", back_populates="port")
    berths = relationship("Berth", back_populates="port")
    cranes = relationship("Crane", back_populates="port")
    predictions = relationship("CongestionPrediction", back_populates="port")
    plans = relationship("OperationsPlan", back_populates="port")


class Vessel(Base):
    """Vessel entity."""
    __tablename__ = "vessels"
    
    id = Column(String, primary_key=True)
    vessel_name = Column(String, index=True)
    vessel_type = Column(String)  # Container, Tanker, Bulk, etc.
    port_id = Column(String, ForeignKey("ports.id"), index=True, nullable=True)
    capacity = Column(Float, nullable=True)  # TEU or tonnage
    length_m = Column(Float, nullable=True)
    beam_m = Column(Float, nullable=True)
    draft_m = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    port = relationship("Port", back_populates="vessels")
    schedules = relationship("VesselSchedule", back_populates="vessel")
    assignments = relationship("Assignment", back_populates="vessel")


class VesselSchedule(Base):
    """Vessel arrival/schedule entry."""
    __tablename__ = "vessel_schedules"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    vessel_id = Column(String, ForeignKey("vessels.id"), index=True)
    port_id = Column(String, ForeignKey("ports.id"), index=True)
    eta = Column(DateTime, index=True)
    etd = Column(DateTime, nullable=True)
    expected_service_duration_hours = Column(Float)
    priority = Column(Integer, default=0)  # 0=normal, 1=high, -1=low
    status = Column(String, default="SCHEDULED")  # SCHEDULED, IN_PORT, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    vessel = relationship("Vessel", back_populates="schedules")
    port = relationship("Port")


class Berth(Base):
    """Berth/dock entity."""
    __tablename__ = "berths"
    
    id = Column(String, primary_key=True)  # B1, B2, etc.
    port_id = Column(String, ForeignKey("ports.id"), index=True)
    name = Column(String)
    capacity_teu = Column(Float, nullable=True)  # For container berths
    capacity_tonnage = Column(Float, nullable=True)  # For bulk berths
    usable_length_m = Column(Float, nullable=True)
    usable_width_m = Column(Float, nullable=True)
    supports_parallel_berthing = Column(Integer, nullable=False, default=0)
    safety_clearance_m = Column(Float, nullable=True)
    status = Column(String, default="AVAILABLE")  # AVAILABLE, OCCUPIED, MAINTENANCE
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    port = relationship("Port", back_populates="berths")
    assignments = relationship("Assignment", back_populates="berth")


class Crane(Base):
    """Crane/equipment entity."""
    __tablename__ = "cranes"
    
    id = Column(String, primary_key=True)  # C1, C2, etc.
    port_id = Column(String, ForeignKey("ports.id"), index=True)
    berth_id = Column(String, ForeignKey("berths.id"), nullable=True)
    name = Column(String)
    capacity_teu_per_hour = Column(Float, nullable=True)
    status = Column(String, default="AVAILABLE")  # AVAILABLE, IN_USE, MAINTENANCE
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    port = relationship("Port", back_populates="cranes")
    assignments = relationship("CraneAssignment", back_populates="crane")


class CongestionPrediction(Base):
    """Congestion prediction from ML model."""
    __tablename__ = "congestion_predictions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    port_id = Column(String, ForeignKey("ports.id"), index=True)
    timestamp = Column(DateTime, index=True)
    horizon_hours = Column(Integer)  # 24, 48, or 72
    congestion_probability = Column(Float)
    congestion_level = Column(String)  # LOW, MODERATE, HIGH, CRITICAL
    expected_waiting_time_hours = Column(Float, nullable=True)
    confidence = Column(Float)
    drivers = Column(JSON)  # List of contributing factors
    feature_importance = Column(JSON)  # Feature importance dict
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    port = relationship("Port", back_populates="predictions")


class OptimizationRun(Base):
    """Record of an optimization run."""
    __tablename__ = "optimization_runs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    port_id = Column(String, ForeignKey("ports.id"), index=True)
    planning_horizon_hours = Column(Integer)
    status = Column(String)  # RUNNING, COMPLETED, FAILED
    objective_value = Column(Float, nullable=True)
    baseline_metric = Column(Float, nullable=True)
    optimized_metric = Column(Float, nullable=True)
    improvement_percent = Column(Float, nullable=True)
    num_assignments = Column(Integer, default=0)
    solve_time_seconds = Column(Float, nullable=True)
    solver_metadata = Column(JSON)  # Solver info, params, etc.
    created_at = Column(DateTime, default=datetime.utcnow)


class Assignment(Base):
    """Vessel-to-berth assignment from optimization."""
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    optimization_run_id = Column(Integer, ForeignKey("optimization_runs.id"))
    vessel_id = Column(String, ForeignKey("vessels.id"), index=True)
    berth_id = Column(String, ForeignKey("berths.id"), index=True)
    planned_start = Column(DateTime)
    planned_end = Column(DateTime)
    waiting_time_hours = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    vessel = relationship("Vessel", back_populates="assignments")
    berth = relationship("Berth", back_populates="assignments")
    crane_assignments = relationship("CraneAssignment", back_populates="assignment")


class CraneAssignment(Base):
    """Crane allocation for a vessel assignment."""
    __tablename__ = "crane_assignments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    crane_id = Column(String, ForeignKey("cranes.id"), index=True)
    expected_service_time_hours = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="crane_assignments")
    crane = relationship("Crane", back_populates="assignments")


class Scenario(Base):
    """What-if scenario."""
    __tablename__ = "scenarios"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    base_optimization_run_id = Column(Integer, ForeignKey("optimization_runs.id"))
    scenario_type = Column(String)  # VESSEL_DELAY, CRANE_UNAVAILABLE, BERTH_UNAVAILABLE, etc.
    scenario_parameters = Column(JSON)  # Scenario-specific params
    result = Column(JSON)  # Result metrics and plan
    created_at = Column(DateTime, default=datetime.utcnow)


class OperationsPlan(Base):
    """72-hour operations plan."""
    __tablename__ = "operations_plans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    port_id = Column(String, ForeignKey("ports.id"), index=True)
    start_time = Column(DateTime, index=True)
    end_time = Column(DateTime)
    planning_horizon_hours = Column(Integer, default=72)
    status = Column(String, default="DRAFT")  # DRAFT, PUBLISHED, EXECUTED
    plan_data = Column(JSON)  # Complete plan structure
    metrics = Column(JSON)  # Performance metrics
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    port = relationship("Port", back_populates="plans")
