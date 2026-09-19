from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.services.space_occupancy_service import (
    CONDITIONALLY_FEASIBLE,
    FEASIBLE,
    SpaceOccupancyAnalyzer,
    VesselWindow,
)


def _berth(**overrides):
    values = {
        "id": "B1",
        "status": "AVAILABLE",
        "supports_parallel_berthing": True,
        "usable_length_m": 500.0,
        "usable_width_m": 70.0,
        "safety_clearance_m": 20.0,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def _vessel(vessel_id, length, vessel_type="Container", eta=None, duration=4):
    return VesselWindow(
        vessel_id=vessel_id,
        vessel_name=vessel_id,
        vessel_type=vessel_type,
        length_m=length,
        beam_m=15.0,
        draft_m=7.0,
        eta=eta or datetime.now(timezone.utc),
        duration_hours=duration,
    )


def _cranes(count):
    return [SimpleNamespace(status="AVAILABLE") for _ in range(count)]


def test_two_small_vessels_fit_with_clearance():
    analyzer = SpaceOccupancyAnalyzer()
    now = datetime.now(timezone.utc)
    existing = [_vessel("V-101", 300, eta=now, duration=8)]
    candidates = [_vessel("V-201", 60, eta=now), _vessel("V-202", 70, eta=now)]
    result = analyzer.find_parallel_opportunities(_berth(), existing, candidates, _cranes(3), now, now + timedelta(hours=24))
    pair = next(item for item in result if item["candidate_vessel_ids"] == ["V-201", "V-202"])
    assert pair["available_length_m"] == 180.0
    assert pair["required_length_m"] == 170.0


def test_parallel_disabled_and_wrong_type_are_rejected():
    analyzer = SpaceOccupancyAnalyzer()
    now = datetime.now(timezone.utc)
    existing = [_vessel("V-101", 300, eta=now)]
    assert analyzer.find_parallel_opportunities(_berth(supports_parallel_berthing=False), existing, [_vessel("V-201", 70)], _cranes(2), now, now + timedelta(hours=24)) == []
    assert analyzer.find_parallel_opportunities(_berth(), existing, [_vessel("V-202", 70, vessel_type="Tanker")], _cranes(2), now, now + timedelta(hours=24)) == []


def test_crane_shortage_is_conditional():
    analyzer = SpaceOccupancyAnalyzer()
    now = datetime.now(timezone.utc)
    result = analyzer.find_parallel_opportunities(
        _berth(), [_vessel("V-101", 300, eta=now)], [_vessel("V-201", 60), _vessel("V-202", 70)], _cranes(1), now, now + timedelta(hours=24)
    )
    pair = next(item for item in result if len(item["candidate_vessel_ids"]) == 2)
    assert pair["status"] == CONDITIONALLY_FEASIBLE


def test_missing_dimensions_are_unavailable():
    analyzer = SpaceOccupancyAnalyzer()
    result = analyzer.calculate_berth_occupancy(_berth(), [_vessel("V-101", None)])
    assert result["available"] is False