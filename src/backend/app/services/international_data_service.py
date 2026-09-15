"""Access the international ML pipeline's processed CSV data."""

from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

from app.core.config import get_settings

# Cache TTL in seconds — reload data at most once per hour
_CACHE_TTL_SECONDS = 3600


REQUIRED_COLUMNS = {
    "date",
    "port_id",
    "port_name",
    "waiting_time_hours",
    "vessel_arrivals",
    "berth_hours",
    "anchor_hours",
}


def _candidate_data_directories() -> List[Path]:
    settings = get_settings()
    candidates: List[Path] = []
    if settings.international_data_path:
        candidates.append(Path(settings.international_data_path))

    candidates.extend(
        [
            Path.cwd() / "data" / "processed" / "international",
            Path(__file__).resolve().parents[4]
            / "bob-ai-hackathon-BugHunters100"
            / "data"
            / "processed"
            / "international",
            Path(__file__).resolve().parents[3]
            / "data"
            / "processed"
            / "international",
        ]
    )
    return candidates


def _find_csv(filename: str) -> Path:
    for directory in _candidate_data_directories():
        path = directory / filename
        if path.exists():
            return path
    searched = ", ".join(str(path / filename) for path in _candidate_data_directories())
    raise FileNotFoundError(f"International ML data file not found. Searched: {searched}")


def _find_ais_csv() -> Optional[Path]:
    candidates = [
        Path.cwd() / "src" / "AI" / "data" / "indian_ports_activity.csv",
        Path.cwd() / ".." / "AI" / "data" / "indian_ports_activity.csv",
        Path(__file__).resolve().parents[3] / "AI" / "data" / "indian_ports_activity.csv",
        Path(__file__).resolve().parents[4] / "src" / "AI" / "data" / "indian_ports_activity.csv",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


# Module-level simple TTL cache so data can be refreshed after _CACHE_TTL_SECONDS
_operations_cache: Optional[pd.DataFrame] = None
_operations_loaded_at: float = 0.0


def load_operations() -> pd.DataFrame:
    """Return the operations DataFrame, reloading from disk at most once per hour."""
    import time
    global _operations_cache, _operations_loaded_at

    if _operations_cache is not None and (time.monotonic() - _operations_loaded_at) < _CACHE_TTL_SECONDS:
        return _operations_cache

    frame = _load_operations_uncached()
    _operations_cache = frame
    _operations_loaded_at = time.monotonic()
    return frame


def _load_operations_uncached() -> pd.DataFrame:
    try:
        path = _find_csv("international_port_operations.csv")
        frame = pd.read_csv(path, parse_dates=["date"])
        missing = REQUIRED_COLUMNS - set(frame.columns)
        if not missing:
            return frame.sort_values("date").reset_index(drop=True)
    except Exception:
        pass

    # Ingest from Person 1's indian_ports_activity.csv
    ais_path = _find_ais_csv()
    if ais_path:
        df = pd.read_csv(ais_path, parse_dates=["date"])
        df["port_id"] = "port776"
        df["port_name"] = "JNPA / Nhava Sheva"
        df["vessel_arrivals"] = df["unique_vessels"].fillna(45).astype(int)
        df["waiting_time_hours"] = (df["unique_vessels_anchor"] * 2.4).round(1)
        df["berth_hours"] = (df["berth_pings"] / 500.0).round(1)
        df["anchor_hours"] = (df["anchor_pings"] / 500.0).round(1)
        df["vessels_at_anchor_avg"] = df["unique_vessels_anchor"].fillna(12)
        df["dwell_time_hours"] = 28.5
        df["service_time_hours"] = 24.0
        return df.sort_values("date").reset_index(drop=True)

    # Fallback default synthetic frame
    dates = pd.date_range(end=datetime.now(timezone.utc), periods=30, freq="D")
    return pd.DataFrame({
        "date": dates,
        "port_id": ["port776"] * 30,
        "port_name": ["JNPA / Nhava Sheva"] * 30,
        "waiting_time_hours": [18.5] * 30,
        "vessel_arrivals": [35] * 30,
        "berth_hours": [140.0] * 30,
        "anchor_hours": [60.0] * 30,
        "vessels_at_anchor_avg": [10] * 30,
        "dwell_time_hours": [28.0] * 30,
        "service_time_hours": [24.0] * 30,
    })


@lru_cache(maxsize=1)  # features file is static — lru_cache is fine
def load_features() -> Optional[pd.DataFrame]:
    try:
        path = _find_csv("international_congestion_features.csv")
    except FileNotFoundError:
        return None
    return pd.read_csv(path, parse_dates=["date"]).sort_values("date").reset_index(drop=True)


def _number(row: pd.Series, column: str, default: float = 0.0) -> float:
    value = row.get(column, default)
    return default if pd.isna(value) else float(value)


def latest_snapshot(port_id: str = "port776") -> Dict[str, Any]:
    frame = load_operations()
    matches = frame[frame["port_id"].astype(str).str.upper() == port_id.upper()]
    if matches.empty:
        raise KeyError(f"No international data found for port {port_id}")
    row = matches.iloc[-1]
    history = matches
    historical_wait = float(history["waiting_time_hours"].mean())
    wait_ratio = _number(row, "waiting_time_hours") / historical_wait if historical_wait else 0.0
    total_hours = _number(row, "berth_hours") + _number(row, "anchor_hours")
    berth_share = (_number(row, "berth_hours") / total_hours * 100) if total_hours > 0 else 0.0

    return {
        "port_id": str(row["port_id"]),
        "port_name": str(row["port_name"]),
        "date": row["date"].to_pydatetime().replace(tzinfo=timezone.utc),
        "vessel_arrivals": int(_number(row, "vessel_arrivals")),
        "waiting_time_hours": _number(row, "waiting_time_hours"),
        "dwell_time_hours": _number(row, "dwell_time_hours"),
        "service_time_hours": _number(row, "service_time_hours"),
        "anchor_hours": _number(row, "anchor_hours"),
        "berth_hours": _number(row, "berth_hours"),
        "waiting_vessels": int(round(_number(row, "vessels_at_anchor_avg"))),
        "berth_utilisation": round(max(0.0, min(100.0, berth_share)), 1),
        "congestion_index": round(max(0.0, min(100.0, wait_ratio * 100)), 1),
        "historical_wait_mean": historical_wait,
        "data_as_of": row["date"].date().isoformat(),
    }


def congestion_probability(port_id: str = "port776") -> float:
    snapshot = latest_snapshot(port_id)
    features = load_features()
    if features is not None and "target_1m_congestion" in features.columns:
        targets = features[features["port_id"].astype(str).str.upper() == port_id.upper()]["target_1m_congestion"]
        if not targets.empty:
            baseline = float(targets.mean())
            return round(max(0.0, min(1.0, baseline * 0.5 + snapshot["congestion_index"] / 100 * 0.5)), 4)
    return round(max(0.0, min(1.0, snapshot["congestion_index"] / 100)), 4)


def trend(port_id: str = "port776", limit: int = 13) -> List[Dict[str, Any]]:
    frame = load_operations()
    matches = frame[frame["port_id"].astype(str).str.upper() == port_id.upper()].tail(limit)
    historical_wait = float(frame["waiting_time_hours"].mean())
    points = []
    for _, row in matches.iterrows():
        index = _number(row, "waiting_time_hours") / historical_wait * 100 if historical_wait else 0
        points.append(
            {
                "timestamp": row["date"].to_pydatetime().replace(tzinfo=timezone.utc).isoformat(),
                "congestionIndex": round(max(0.0, min(100.0, index)), 1),
                "waitingVessels": int(round(_number(row, "vessels_at_anchor_avg"))),
                "berthUtilisation": round(
                    _number(row, "berth_hours")
                    / (_number(row, "berth_hours") + _number(row, "anchor_hours"))
                    * 100,
                    1,
                ),
            }
        )
    return points
