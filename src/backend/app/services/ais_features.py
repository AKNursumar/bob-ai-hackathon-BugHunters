"""
PortPulse / Harborline Backend — AIS Feature Extraction & Smoothing

Translates real-time raw AIS position and static messages from AISStream.io
into calibrated operational features for live port congestion nowcasting.
"""

import math
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

from app.core.logging_config import get_logger
from app.services.ais_service import get_live_vessels, get_ais_status, PORT_BOUNDING_BOXES

logger = get_logger("ais_features")

# Port Coordinates (Approximate Harbor / Anchorage Center)
PORT_COORDINATES = {
    "port776":  {"name": "JNPA / Nhava Sheva", "lat": 18.95, "lon": 72.95, "nominal_anchorage_capacity": 15},
    "port777":  {"name": "Mundra",             "lat": 22.74, "lon": 69.70, "nominal_anchorage_capacity": 20},
    "port235":  {"name": "Chennai",            "lat": 13.08, "lon": 80.29, "nominal_anchorage_capacity": 12},
    "port540":  {"name": "Kandla",             "lat": 23.00, "lon": 70.22, "nominal_anchorage_capacity": 16},
    "port1367": {"name": "Visakhapatnam",      "lat": 17.69, "lon": 83.29, "nominal_anchorage_capacity": 14},
}

# Smoothing cache per port for streaming stability: {port_id: {"anchorage": float, "transit": float, "last_updated": dt}}
_smoothed_metrics: Dict[str, Dict[str, Any]] = {}
EMA_ALPHA = 0.35  # Smoothing factor (higher = more responsive, lower = smoother)


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in kilometers between two points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _is_approaching(v_lat: float, v_lon: float, v_heading: float, p_lat: float, p_lon: float) -> bool:
    """Determine if a vessel is heading towards the port center."""
    if v_heading is None or v_heading == 511:  # 511 = heading not available
        return False

    # Bearing from vessel to port
    dlon = math.radians(p_lon - v_lon)
    lat1 = math.radians(v_lat)
    lat2 = math.radians(p_lat)

    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - (math.sin(lat1) * math.cos(lat2) * math.cos(dlon))
    bearing = (math.degrees(math.atan2(x, y)) + 360) % 360

    # If heading is within +/- 45 degrees of bearing to port, consider approaching
    angle_diff = abs(bearing - v_heading)
    if angle_diff > 180:
        angle_diff = 360 - angle_diff
    return angle_diff <= 45.0


def extract_live_ais_features(port_id: str) -> Dict[str, Any]:
    """
    Extract real-time operational features for a specific port from live AIS stream.

    Returns a feature dictionary ready for nowcasting & explainable AI.
    """
    port_id_lower = port_id.lower()
    port_meta = PORT_COORDINATES.get(port_id_lower, {
        "name": port_id, "lat": 19.0, "lon": 73.0, "nominal_anchorage_capacity": 15
    })
    nom_cap = port_meta.get("nominal_anchorage_capacity", 15)

    vessels = get_live_vessels(port_id_lower)
    status = get_ais_status()
    is_ais_active = status.get("connected", False) and (len(vessels) > 0)

    # Counters
    anchorage_count = 0
    in_transit_count = 0
    speeds: List[float] = []
    approaching_count = 0

    container_count = 0
    tanker_count = 0
    cargo_count = 0
    other_count = 0

    p_lat = port_meta["lat"]
    p_lon = port_meta["lon"]

    for v in vessels:
        speed = float(v.get("speed", 0.0) or 0.0)
        v_status = v.get("status", "")
        v_type = (v.get("type") or "").lower()
        v_lat = v.get("latitude")
        v_lon = v.get("longitude")
        v_heading = v.get("heading")

        # Anchorage vs Transit
        if speed < 0.5 or v_status == "AT_ANCHOR":
            anchorage_count += 1
        else:
            in_transit_count += 1
            speeds.append(speed)

        # Vessel Type Breakdown
        if "container" in v_type:
            container_count += 1
        elif "tanker" in v_type:
            tanker_count += 1
        elif "cargo" in v_type or "bulk" in v_type:
            cargo_count += 1
        else:
            other_count += 1

        # Approaching Check
        if v_lat and v_lon and speed >= 0.5:
            if _is_approaching(v_lat, v_lon, v_heading, p_lat, p_lon):
                approaching_count += 1

    total_vessels = len(vessels)
    avg_speed = round(sum(speeds) / len(speeds), 2) if speeds else 0.0

    # Exponential Moving Average (EMA) smoothing for stability against transponder drops
    now_dt = datetime.now(timezone.utc)
    if port_id_lower not in _smoothed_metrics:
        _smoothed_metrics[port_id_lower] = {
            "anchorage": float(anchorage_count),
            "transit": float(in_transit_count),
            "last_updated": now_dt,
        }
    else:
        prev = _smoothed_metrics[port_id_lower]
        prev["anchorage"] = round(EMA_ALPHA * anchorage_count + (1 - EMA_ALPHA) * prev["anchorage"], 2)
        prev["transit"] = round(EMA_ALPHA * in_transit_count + (1 - EMA_ALPHA) * prev["transit"], 2)
        prev["last_updated"] = now_dt

    smoothed = _smoothed_metrics[port_id_lower]
    smoothed_anchorage = smoothed["anchorage"]
    smoothed_transit = smoothed["transit"]

    # Ratios
    container_ratio = round(container_count / max(total_vessels, 1), 3)
    tanker_ratio = round(tanker_count / max(total_vessels, 1), 3)
    anchorage_utilization = round(smoothed_anchorage / max(nom_cap, 1), 3)

    # Dynamic Congestion Index (0 to 100) from Live AIS
    # Combines anchorage backlog (60%), in-transit friction/density (25%), and approach pressure (15%)
    if is_ais_active:
        anchorage_score = min(anchorage_utilization * 65.0, 70.0)
        transit_score = min((smoothed_transit / (nom_cap * 1.5)) * 25.0, 20.0)
        approach_score = min((approaching_count / 8.0) * 15.0, 15.0)
        live_congestion_index = round(min(max(anchorage_score + transit_score + approach_score, 15.0), 98.0), 1)
    else:
        live_congestion_index = None

    # Generate Human-Readable Live Risk Drivers
    live_drivers = []
    if is_ais_active:
        if smoothed_anchorage >= 5:
            live_drivers.append(f"Live AIS: {int(smoothed_anchorage)} vessels waiting at anchor ({int(anchorage_utilization * 100)}% anchorage load)")
        elif smoothed_anchorage > 0:
            live_drivers.append(f"Live AIS: {int(smoothed_anchorage)} vessel(s) at anchorage basin")
        
        if approaching_count >= 3:
            live_drivers.append(f"Inbound Traffic: {approaching_count} active vessels approaching navigation fairway")
        
        if container_ratio >= 0.45:
            live_drivers.append(f"Container Surge: {int(container_ratio * 100)}% of tracked vessels are container ships")

    return {
        "port_id": port_id_lower,
        "port_name": port_meta.get("name", port_id),
        "is_ais_active": is_ais_active,
        "total_vessels": total_vessels,
        "anchorage_count": anchorage_count,
        "in_transit_count": in_transit_count,
        "smoothed_anchorage": smoothed_anchorage,
        "smoothed_transit": smoothed_transit,
        "approaching_count": approaching_count,
        "avg_speed_knots": avg_speed,
        "container_count": container_count,
        "tanker_count": tanker_count,
        "container_ratio": container_ratio,
        "tanker_ratio": tanker_ratio,
        "anchorage_utilization": anchorage_utilization,
        "live_congestion_index": live_congestion_index,
        "live_drivers": live_drivers,
        "last_updated": now_dt.isoformat(),
    }
