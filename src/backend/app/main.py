"""
PortPulse Backend — Main FastAPI Application
"""

from contextlib import asynccontextmanager
import logging
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging_config import setup_logging, get_logger
from app.database.connection import init_db
from app.api import health, ports, congestion, optimization, planning, dashboard, mcp as mcp_routes

logger = get_logger("app")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    setup_logging(logging.DEBUG if settings.api_debug else logging.INFO)
    logger.info("PortPulse Backend starting...")
    init_db()
    logger.info("Database initialized")

    yield

    logger.info("PortPulse Backend shutting down...")


# ============================================================================
# Application
# ============================================================================

app = FastAPI(
    title="PortPulse Backend API",
    description=(
        "Port operations optimization and congestion prediction system. "
        "Integrates ML-based port congestion forecasts with berth/crane "
        "allocation optimization using OR-Tools."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — use a specific allowlist in production; default to localhost + vite dev
_cors_origins: List[str] = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",
    "http://localhost:8001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Routers
# ============================================================================

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(ports.router, prefix="/api/v1", tags=["Ports"])
app.include_router(congestion.router, prefix="/api/v1", tags=["Congestion"])
app.include_router(optimization.router, prefix="/api/v1", tags=["Optimization"])
app.include_router(planning.router, prefix="/api/v1", tags=["Planning"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(mcp_routes.router, prefix="/api/v1", tags=["MCP"])


# ============================================================================
# Root endpoint
# ============================================================================

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": "PortPulse Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_debug,
    )
