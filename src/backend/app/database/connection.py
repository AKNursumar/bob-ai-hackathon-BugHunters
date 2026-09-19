"""
PortPulse Backend — Database connection and session management
"""

from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings

settings = get_settings()

# Ensure relative SQLite path resolves to canonical src/backend directory
db_url = settings.database_url
if db_url.startswith("sqlite:///./"):
    backend_dir = Path(__file__).resolve().parents[2]
    db_file = backend_dir / db_url.replace("sqlite:///./", "")
    db_url = f"sqlite:///{db_file.as_posix()}"

# Create engine
engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database and create all tables."""
    from app.models.database_models import Base
    Base.metadata.create_all(bind=engine)
    _ensure_berth_columns()
    
    # Seed default operational data
    from app.database.seed_data import seed_database
    with SessionLocal() as db:
        seed_database(db)


def _ensure_berth_columns() -> None:
    """Add new nullable berth fields to existing SQLite installations."""
    if "sqlite" not in str(engine.url):
        return
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("berths")}
    additions = {
        "usable_length_m": "FLOAT",
        "usable_width_m": "FLOAT",
        "supports_parallel_berthing": "INTEGER NOT NULL DEFAULT 0",
        "safety_clearance_m": "FLOAT",
    }
    with engine.begin() as connection:
        for name, definition in additions.items():
            if name not in columns:
                connection.execute(text(f"ALTER TABLE berths ADD COLUMN {name} {definition}"))
