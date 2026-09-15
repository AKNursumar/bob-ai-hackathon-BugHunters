"""
Harborline Backend — Configuration management
"""

from functools import lru_cache
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ENV_FILES = (".env", str(_BACKEND_DIR / ".env"))


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Database
    database_url: str = "sqlite:///./harborline.db"

    # API
    api_host: str = "0.0.0.0"
    # PORT is the Render-standard env var; API_PORT is our local override.
    # We read PORT first (Render), fall back to API_PORT, then default 8001.
    port: int = 8001  # overridden by $PORT on Render
    api_port: int = 8001  # kept for backward-compat local dev

    api_debug: bool = False

    # CORS — comma-separated list of allowed origins.
    # Production: set CORS_ORIGINS=https://your-app.vercel.app
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # ML Model paths (relative to backend working directory)
    # In production on Render, the repo is cloned and CWD is src/backend,
    # so "../AI/models" resolves correctly.
    ml_model_path: str = "../AI/models"
    ml_data_path: str = "../AI/data"
    international_data_path: Optional[str] = None

    # Ports
    ports: str = "port776,port777,port235,port540,port1367"

    # AISStream — REQUIRED for live vessel tracking.
    # Never hardcode this key in source. Set AISSTREAM_API_KEY in env.
    aisstream_api_key: str = ""

    # Optimization
    optimization_timeout_seconds: int = 30
    optimization_log_search: bool = False

    # MCP
    mcp_enabled: bool = True
    mcp_host: str = "0.0.0.0"
    mcp_port: int = 3000

    # Operational constraints (configurable assumptions)
    berth_count_default: int = 5
    crane_count_default: int = 10
    service_time_default_hours: int = 24
    vessel_berth_compatibility_strict: bool = False

    @property
    def effective_port(self) -> int:
        """Return the port to bind to, honouring Render's $PORT env var."""
        import os
        render_port = os.environ.get("PORT")
        if render_port:
            try:
                return int(render_port)
            except ValueError:
                pass
        return self.port

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS origins as a list, stripped of whitespace."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def port_list(self) -> list[str]:
        """Return list of port IDs."""
        return [p.strip().lower() for p in self.ports.split(",") if p.strip()]

    def get_port_name(self, port_id: str) -> str:
        """Get display name for a port."""
        mapping = {
            "port776": "JNPA / Nhava Sheva",
            "port777": "Mundra",
            "port235": "Chennai",
            "port540": "Kandla",
            "port1367": "Visakhapatnam",
        }
        return mapping.get(port_id.lower(), port_id)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings singleton."""
    return Settings()
