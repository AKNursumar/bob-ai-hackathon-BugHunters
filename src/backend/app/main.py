"""
Harborline Backend — Main FastAPI Application
"""

from contextlib import asynccontextmanager
import logging
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging_config import setup_logging, get_logger
from app.database.connection import init_db
from app.services.ais_service import start_ais_listener
from app.api import health, ports, congestion, optimization, planning, dashboard, mcp as mcp_routes

logger = get_logger("app")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    setup_logging(logging.DEBUG if settings.api_debug else logging.INFO)
    logger.info("Harborline Backend starting...")
    init_db()
    logger.info("Database initialized")

    # Start live AIS tracking in background (only if API key is configured)
    if settings.aisstream_api_key:
        start_ais_listener()
        logger.info("AISStream listener started")
    else:
        logger.warning(
            "AISSTREAM_API_KEY is not set — live vessel tracking disabled. "
            "Set AISSTREAM_API_KEY env var to enable real-time AIS data."
        )

    yield

    logger.info("Harborline Backend shutting down...")


# ============================================================================
# Application
# ============================================================================

app = FastAPI(
    title="Harborline — Port Operations Intelligence API",
    description=(
        "Harborline is an AI-powered port operations intelligence platform for Indian ports. "
        "Combines live AIS vessel tracking, ML-based congestion forecasting (XGBoost), "
        "and constraint-solver berth/crane optimisation (OR-Tools CP-SAT). "
        "Covers JNPA/Nhava Sheva, Mundra, Chennai, Kandla, and Visakhapatnam."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — configured via CORS_ORIGINS environment variable.
# Development default: localhost Vite dev server.
# Production: set CORS_ORIGINS=https://your-app.vercel.app
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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
        "name": "Harborline Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.effective_port,
        reload=settings.api_debug,
    )
