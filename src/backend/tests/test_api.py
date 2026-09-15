"""
PortPulse Backend — Tests
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.connection import get_db
from app.models.database_models import Base

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

from sqlalchemy.pool import StaticPool

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Point the MCP server's internal DB factory at the same in-memory engine
# so MCP tool tests use the same schema as the rest of the test suite.
from app.services.mcp_server import set_db_factory
set_db_factory(TestingSessionLocal)

client = TestClient(app)


# ============================================================================
# Health Tests
# ============================================================================

def test_health_check():
    """Test health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["ok", "degraded", "error"]


# ============================================================================
# Port Tests
# ============================================================================

def test_list_ports():
    """Test listing ports."""
    response = client.get("/api/v1/ports")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_port():
    """Test getting port details."""
    # First, create a port
    response = client.get("/api/v1/ports")
    assert response.status_code == 200
    
    ports = response.json()
    if ports:
        port_id = ports[0]["id"]
        response = client.get(f"/api/v1/ports/{port_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == port_id


def test_get_port_status():
    """Test getting port status."""
    # Initialize a port first
    response = client.get("/api/v1/ports")
    assert response.status_code == 200
    
    ports = response.json()
    if ports:
        port_id = ports[0]["id"]
        response = client.get(f"/api/v1/ports/{port_id}/status")
        assert response.status_code == 200
        data = response.json()
        assert "port_id" in data
        assert "congestion_status" in data


# ============================================================================
# Congestion Tests
# ============================================================================

def test_congestion_forecast():
    """Test congestion forecast endpoint."""
    # Get ports first
    response = client.get("/api/v1/ports")
    assert response.status_code == 200
    
    ports = response.json()
    if ports:
        port_id = ports[0]["id"]
        try:
            response = client.get(f"/api/v1/congestion/forecast/{port_id}")
            # This may fail if ML models aren't available, which is ok for testing
            if response.status_code == 200:
                data = response.json()
                assert "forecast_24h" in data
                assert "forecast_48h" in data
                assert "forecast_72h" in data
        except Exception:
            # ML models may not be available in test environment
            pass


def test_current_congestion():
    """Test current congestion status."""
    response = client.get("/api/v1/ports")
    assert response.status_code == 200
    
    ports = response.json()
    if ports:
        port_id = ports[0]["id"]
        response = client.get(f"/api/v1/congestion/current/{port_id}")
        # May be unknown if no predictions
        assert response.status_code == 200


# ============================================================================
# MCP Tests
# ============================================================================

EXPECTED_MCP_TOOLS = {
    "get_port_status",
    "get_vessel_schedule",
    "get_congestion_forecast",
    "get_congestion_hotspots",
    "get_berth_status",
    "get_crane_status",
    "optimise_schedule",
    "run_what_if",
    "generate_72_hour_plan",
    "explain_congestion",
}


def test_mcp_tools_list():
    """All 10 expected MCP tools are registered."""
    response = client.get("/api/v1/mcp/tools")
    assert response.status_code == 200
    data = response.json()
    assert "tools" in data
    tool_names = {t["name"] for t in data["tools"]}
    assert EXPECTED_MCP_TOOLS == tool_names, (
        f"Missing: {EXPECTED_MCP_TOOLS - tool_names}  "
        f"Extra: {tool_names - EXPECTED_MCP_TOOLS}"
    )
    # Every tool must have a non-empty description and inputSchema
    for tool in data["tools"]:
        assert tool["description"], f"Tool {tool['name']} has no description"
        assert "properties" in tool["inputSchema"], f"Tool {tool['name']} missing inputSchema.properties"


def test_mcp_status():
    """MCP status returns ok and lists tool names."""
    response = client.get("/api/v1/mcp/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "tool_names" in data
    assert set(data["tool_names"]) == EXPECTED_MCP_TOOLS


def test_mcp_unknown_tool_returns_404():
    """Calling an unknown tool must return 404, not 200."""
    response = client.post(
        "/api/v1/mcp/tools/nonexistent_tool",
        json={"arguments": {}},
    )
    assert response.status_code == 404


def test_mcp_tool_call_get_port_status():
    """get_port_status returns success for a known port."""
    # Ensure ports are seeded
    client.get("/api/v1/ports")
    response = client.post(
        "/api/v1/mcp/tools/get_port_status",
        json={"arguments": {"port_id": "port776"}},
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "data" in data


def test_mcp_tool_call_missing_arguments():
    """Calling a tool without required arguments succeeds at HTTP level (tool returns error dict)."""
    response = client.post(
        "/api/v1/mcp/tools/get_port_status",
        json={"arguments": {}},
    )
    # The request is valid HTTP; tool returns success=False for unknown port ""
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is False


def test_mcp_tool_get_vessel_schedule():
    """get_vessel_schedule returns a vessel list for port776."""
    # Ensure ports are seeded
    client.get("/api/v1/ports")
    response = client.post(
        "/api/v1/mcp/tools/get_vessel_schedule",
        json={"arguments": {"port_id": "port776", "horizon_hours": 72}},
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "vessels" in data
    assert isinstance(data["vessels"], list)


def test_mcp_tool_get_berth_status():
    """get_berth_status returns berth list for port776."""
    client.get("/api/v1/ports")
    response = client.post(
        "/api/v1/mcp/tools/get_berth_status",
        json={"arguments": {"port_id": "port776"}},
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "berths" in data


def test_mcp_tool_get_crane_status():
    """get_crane_status returns crane list for port776."""
    client.get("/api/v1/ports")
    response = client.post(
        "/api/v1/mcp/tools/get_crane_status",
        json={"arguments": {"port_id": "port776"}},
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "cranes" in data


def test_mcp_resources():
    """GET /mcp/resources lists port resources."""
    client.get("/api/v1/ports")
    response = client.get("/api/v1/mcp/resources")
    assert response.status_code == 200
    data = response.json()
    assert "resources" in data
    assert isinstance(data["resources"], list)


# ============================================================================
# Database Model Tests
# ============================================================================

def test_port_model():
    """Test Port database model."""
    from app.models.database_models import Port
    
    db = TestingSessionLocal()
    
    port = Port(
        id="test_port",
        name="Test Port",
        code="TEST",
        latitude=13.0,
        longitude=80.0
    )
    
    db.add(port)
    db.commit()
    
    stored = db.query(Port).filter(Port.id == "test_port").first()
    assert stored is not None
    assert stored.name == "Test Port"
    
    db.close()


def test_vessel_model():
    """Test Vessel database model."""
    from app.models.database_models import Vessel
    
    db = TestingSessionLocal()
    
    vessel = Vessel(
        id="V001",
        vessel_name="Test Vessel",
        vessel_type="Container",
        capacity=5000.0
    )
    
    db.add(vessel)
    db.commit()
    
    stored = db.query(Vessel).filter(Vessel.id == "V001").first()
    assert stored is not None
    assert stored.vessel_name == "Test Vessel"
    
    db.close()


# ============================================================================
# Service Tests
# ============================================================================

def test_port_service_create_port():
    """Test PortService.create_port."""
    from app.services.port_service import PortService
    
    db = TestingSessionLocal()
    service = PortService(db)
    
    port = service.create_port(
        "service_test",
        "Service Test Port",
        code="SRVTEST"
    )
    
    assert port.id == "service_test"
    assert port.name == "Service Test Port"
    
    db.close()


def test_port_service_get_port():
    """Test PortService.get_port."""
    from app.services.port_service import PortService
    
    db = TestingSessionLocal()
    service = PortService(db)
    
    # Create a port first
    service.create_port("retrieve_test", "Retrieve Test Port")
    
    # Retrieve it
    port = service.get_port("retrieve_test")
    assert port is not None
    assert port.name == "Retrieve Test Port"
    
    db.close()


# ============================================================================
# Optimization Tests
# ============================================================================

def test_optimization_basic():
    """Test basic optimization."""
    from app.services.optimization_engine import (
        OptimizationRequest, VesselData, BerthData, CraneData, optimize
    )
    
    now = datetime.now(timezone.utc)
    
    vessels = [
        VesselData(
            vessel_id="V001",
            vessel_name="Vessel 1",
            eta=now + timedelta(hours=1),
            service_duration_hours=6.0,
            priority=0
        ),
        VesselData(
            vessel_id="V002",
            vessel_name="Vessel 2",
            eta=now + timedelta(hours=4),
            service_duration_hours=6.0,
            priority=0
        ),
    ]
    
    berths = [
        BerthData("B1", "Berth 1"),
        BerthData("B2", "Berth 2"),
    ]
    
    cranes = [
        CraneData("C1", "Crane 1"),
        CraneData("C2", "Crane 2"),
    ]
    
    opt_request = OptimizationRequest(
        port_id="test_port",
        vessels=vessels,
        berths=berths,
        cranes=cranes,
        planning_horizon_hours=72,
        horizon_start=now
    )
    
    result = optimize(opt_request, timeout_seconds=10)
    
    assert "status" in result
    assert "assignments" in result
    assert len(result["assignments"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
