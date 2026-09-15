import asyncio
import json
import logging
import threading
from typing import Dict, List, Any

import websockets
from datetime import datetime, timezone

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger("ais_service")
settings = get_settings()

# In-memory cache for live vessels
_live_vessels: Dict[str, Dict[str, Any]] = {}

# Bounding boxes for Indian ports (expanded to catch more regional traffic)
PORT_BOUNDING_BOXES = {
    "port776":  [[17.0, 71.0], [20.0, 73.5]],   # JNPA / Mumbai
    "port777":  [[21.0, 68.0], [23.5, 71.0]],   # Mundra
    "port235":  [[12.0, 79.0], [14.0, 81.0]],   # Chennai
    "port540":  [[22.0, 69.0], [24.0, 71.0]],   # Kandla
    "port1367": [[16.0, 82.0], [18.0, 84.0]],   # Visakhapatnam
}

# AIS connection status — exposed for health/monitoring endpoints
_ais_status: Dict[str, Any] = {
    "connected": False,
    "last_message_at": None,
    "vessel_count": 0,
    "enabled": False,
}


def get_ais_status() -> Dict[str, Any]:
    """Return AIS connection status for monitoring."""
    return {**_ais_status, "vessel_count": len(_live_vessels)}


def get_live_vessels(port_id: str) -> List[Dict[str, Any]]:
    vessels = []
    box = PORT_BOUNDING_BOXES.get(port_id)

    for mmsi, data in _live_vessels.items():
        if box:
            lat = data.get("latitude")
            lon = data.get("longitude")
            if lat and lon:
                if box[0][0] <= lat <= box[1][0] and box[0][1] <= lon <= box[1][1]:
                    vessels.append(data)
        else:
            vessels.append(data)

    formatted_vessels = []
    for v in vessels:
        formatted_vessels.append({
            "id": str(v.get("mmsi")),
            "name": v.get("name") or f"Vessel {v.get('mmsi')}",
            "type": "Container" if v.get("type", 0) in [70, 71, 72, 73, 74] else "Cargo",
            "status": "AT_ANCHOR" if v.get("sog", 0) < 0.5 else "IN_TRANSIT",
            "eta": datetime.now(timezone.utc).isoformat(),
            "destination": v.get("destination", "Unknown"),
            "latitude": v.get("latitude"),
            "longitude": v.get("longitude"),
            "heading": v.get("heading", 0),
            "speed": v.get("sog", 0),
        })

    return formatted_vessels


async def _listen_ais(api_key: str):
    """Connect to AISStream and listen for vessel data. Reconnects on failure."""
    boxes = list(PORT_BOUNDING_BOXES.values())
    subscribe_msg = {
        "APIKey": api_key,
        "BoundingBoxes": boxes,
        "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
    }

    while True:
        try:
            async with websockets.connect(
                "wss://stream.aisstream.io/v0/stream",
                ping_interval=20,
                ping_timeout=20,
            ) as ws:
                await ws.send(json.dumps(subscribe_msg))
                _ais_status["connected"] = True
                logger.info("Connected to AISStream.io — listening for Indian port vessel traffic")

                async for message_str in ws:
                    try:
                        message = json.loads(message_str)
                        msg_type = message.get("MessageType")

                        if msg_type == "PositionReport":
                            report = message.get("Message", {}).get("PositionReport", {})
                            mmsi = str(message.get("MetaData", {}).get("MMSI", ""))
                            if mmsi:
                                if mmsi not in _live_vessels:
                                    _live_vessels[mmsi] = {}
                                _live_vessels[mmsi].update({
                                    "mmsi": mmsi,
                                    "latitude": report.get("Latitude"),
                                    "longitude": report.get("Longitude"),
                                    "sog": report.get("Sog"),
                                    "heading": report.get("TrueHeading"),
                                    "last_updated": datetime.now(timezone.utc).isoformat(),
                                })
                                _ais_status["last_message_at"] = datetime.now(timezone.utc).isoformat()

                        elif msg_type == "ShipStaticData":
                            report = message.get("Message", {}).get("ShipStaticData", {})
                            mmsi = str(message.get("MetaData", {}).get("MMSI", ""))
                            if mmsi:
                                if mmsi not in _live_vessels:
                                    _live_vessels[mmsi] = {}
                                _live_vessels[mmsi].update({
                                    "mmsi": mmsi,
                                    "name": report.get("Name", "").strip(),
                                    "type": report.get("Type"),
                                    "destination": report.get("Destination", "").strip(),
                                })

                    except Exception as e:
                        logger.debug(f"Error parsing AIS message: {e}")

        except Exception as e:
            _ais_status["connected"] = False
            logger.error(f"AISStream connection error: {e}. Reconnecting in 10s...")
            await asyncio.sleep(10)


def start_ais_listener():
    """Start the AIS listener in a daemon background thread.

    Reads AISSTREAM_API_KEY from environment (via settings).
    Does nothing if key is missing — AIS is optional, not a hard dependency.
    """
    api_key = settings.aisstream_api_key
    if not api_key:
        logger.warning("AISSTREAM_API_KEY not set — AIS listener not started")
        return

    _ais_status["enabled"] = True

    def _run():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_listen_ais(api_key))

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    logger.info("AISStream listener thread started")
