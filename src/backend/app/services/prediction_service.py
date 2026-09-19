"""
PortPulse Backend — Prediction Service

Integrates with Person 1's ML model and contracts.
Provides a clean, resilient interface for port congestion predictions.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger("prediction_service")
settings = get_settings()

_model_cache: Dict[str, Any] = {}
_meta_cache: Dict[str, Dict] = {}


# ============================================================================
# Risk Classification
# ============================================================================

RISK_THRESHOLDS = {
    "CRITICAL": 0.80,
    "HIGH": 0.60,
    "MODERATE": 0.40,
    "LOW": 0.00,
}


def classify_risk(probability: float) -> str:
    """Classify risk level based on probability."""
    for label, threshold in RISK_THRESHOLDS.items():
        if probability >= threshold:
            return label
    return "LOW"


# ============================================================================
# Paths & File Discovery
# ============================================================================

def _find_ai_file(rel_path: str) -> Optional[Path]:
    """Locate file in AI directory relative to backend, repo root, or configured settings."""
    fname = Path(rel_path).name
    candidates = [
        Path(settings.ml_model_path) / rel_path,
        Path(settings.ml_model_path) / fname,
        Path(settings.ml_data_path) / rel_path,
        Path(settings.ml_data_path) / fname,
        Path.cwd() / "src" / "AI" / rel_path,
        Path.cwd() / "src" / "AI" / "models" / fname,
        Path.cwd() / "src" / "AI" / "data" / fname,
        Path.cwd() / ".." / "AI" / rel_path,
        Path.cwd() / ".." / "AI" / "models" / fname,
        Path.cwd() / ".." / "AI" / "data" / fname,
        Path(__file__).resolve().parents[3] / "AI" / rel_path,
        Path(__file__).resolve().parents[3] / "AI" / "models" / fname,
        Path(__file__).resolve().parents[3] / "AI" / "data" / fname,
        Path(__file__).resolve().parents[4] / "src" / "AI" / rel_path,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    return None


def _load_metadata() -> Dict[str, Any]:
    """Load metadata.json created by Person 1's pipeline."""
    meta_path = _find_ai_file("models/metadata.json")
    if meta_path and meta_path.exists():
        try:
            with open(meta_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not parse metadata.json: {e}")
    return {}


def _load_indian_forecast() -> Dict[str, Any]:
    """Load pre-computed Indian port forecasts from Person 1."""
    contract_path = _find_ai_file("contracts/indian_ports_forecast.json")
    if contract_path and contract_path.exists():
        try:
            with open(contract_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not parse indian_ports_forecast.json: {e}")
    return {}


def _get_top_drivers(horizon_hours: int = 24) -> List[str]:
    """Read top drivers from feature importance reports."""
    report_path = _find_ai_file(f"reports/india/feature_importance_{horizon_hours}h.csv")
    if report_path and report_path.exists():
        try:
            df = pd.read_csv(report_path)
            return df["feature"].head(5).tolist()
        except Exception:
            pass
    return ["portcalls_rolling_mean_3", "portcalls_lag_1", "portcalls_rolling_mean_7"]


# ============================================================================
# Prediction
# ============================================================================

def predict_port(
    port_id: str,
    horizons: Optional[list] = None
) -> Dict[str, Any]:
    """
    Generate congestion forecast for a port across multiple horizons (24h, 48h, 72h).
    Combines trained XGBoost macro models with real-time AISStream.io telemetry nowcasting.
    """
    from app.services.hybrid_model import get_hybrid_engine
    return get_hybrid_engine().predict(port_id, horizons)


def predict_all_ports(horizons: Optional[list] = None) -> Dict[str, Dict[str, Any]]:
    """
    Generate forecasts for all configured ports.
    """
    settings_obj = get_settings()
    results = {}

    for port_id in settings_obj.port_list:
        try:
            results[port_id] = predict_port(port_id, horizons)
        except Exception as e:
            logger.warning(f"Failed to predict for {port_id}: {e}")
            results[port_id] = {"error": str(e)}

    return results
