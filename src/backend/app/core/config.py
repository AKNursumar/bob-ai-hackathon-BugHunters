"""
PortPulse Backend — Configuration management
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
    database_url: str = "sqlite:///./portpulse.db"
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    api_debug: bool = False
    
    # ML Model paths
    ml_model_path: str = "../AI/models"
    ml_data_path: str = "../AI/data"
    international_data_path: Optional[str] = None
    
    # Ports
    ports: str = "LALB,port235,port776,port777"
    port_lalb_name: str = "Los Angeles-Long Beach"
    
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
    def port_list(self) -> list[str]:
        """Return list of port IDs."""
        return [p.strip().lower() for p in self.ports.split(",") if p.strip()]
    
    def get_port_name(self, port_id: str) -> str:
        """Get display name for a port."""
        mapping = {
            "lalb": self.port_lalb_name,
            "port235": "Chennai",
            "port776": "JNPT / Mumbai",
            "port777": "Mundra",
        }
        return mapping.get(port_id.lower(), port_id)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings singleton."""
    return Settings()
