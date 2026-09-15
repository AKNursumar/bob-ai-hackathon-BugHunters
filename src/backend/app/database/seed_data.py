"""
Seed realistic operational data for PortPulse (Port LALB).
Populates berths, cranes, vessels, and a fresh 72-hour arrival schedule.

On every startup the vessel schedules are refreshed: any existing SCHEDULED
entries whose ETA has already passed are removed and new ones are inserted
relative to the current wall-clock time, so the planning horizon always
contains live data.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.database_models import Port, Berth, Crane, Vessel, VesselSchedule
from app.core.logging_config import get_logger

logger = get_logger("seed_data")

_VESSEL_OFFSETS = [
    # (vessel_id, eta_offset_hours, service_hours, priority)
    ("V-101", 2,  24.0,  1),
    ("V-102", 6,  22.0,  0),
    ("V-103", 14, 20.0,  0),
    ("V-104", 22, 26.0,  1),
    ("V-105", 30, 24.0,  0),
    ("V-106", 42, 22.0,  0),
    ("V-107", 48, 18.0,  0),
    ("V-108", 58, 16.0, -1),
]


def seed_database(db: Session) -> None:
    """Seed initial operational entities and refresh vessel schedules."""
    try:
        # ----------------------------------------------------------------
        # 1. Ensure LALB Port exists
        # ----------------------------------------------------------------
        lalb = db.query(Port).filter(Port.id == "lalb").first()
        if not lalb:
            lalb = Port(
                id="lalb",
                name="Los Angeles-Long Beach",
                code="USLAX",
                latitude=33.743184,
                longitude=-118.267258,
            )
            db.add(lalb)
            db.commit()

        # ----------------------------------------------------------------
        # 2. Seed Berths (idempotent)
        # ----------------------------------------------------------------
        if db.query(Berth).filter(Berth.port_id == "lalb").count() == 0:
            berths = [
                Berth(id="B1", port_id="lalb", name="Pier 400 - Berth 1 (Container)", capacity_teu=25000.0, status="AVAILABLE"),
                Berth(id="B2", port_id="lalb", name="Pier G - Berth 2 (Container)",   capacity_teu=20000.0, status="AVAILABLE"),
                Berth(id="B3", port_id="lalb", name="Pier J - Berth 3 (Container)",   capacity_teu=18000.0, status="AVAILABLE"),
                Berth(id="B4", port_id="lalb", name="Pier T - Berth 4 (Bulk)",        capacity_tonnage=100000.0, status="AVAILABLE"),
                Berth(id="B5", port_id="lalb", name="Pier B - Berth 5 (Tanker)",      capacity_tonnage=150000.0, status="AVAILABLE"),
            ]
            db.add_all(berths)
            db.commit()
            logger.info("Seeded 5 berths for LALB")

        # ----------------------------------------------------------------
        # 3. Seed Cranes (idempotent)
        # ----------------------------------------------------------------
        if db.query(Crane).filter(Crane.port_id == "lalb").count() == 0:
            cranes = [
                Crane(
                    id=f"CR-{i:02d}",
                    port_id="lalb",
                    berth_id=f"B{((i - 1) // 2) + 1}",
                    name=f"Super Post-Panamax Crane {i}",
                    capacity_teu_per_hour=35.0,
                    status="AVAILABLE",
                )
                for i in range(1, 11)
            ]
            db.add_all(cranes)
            db.commit()
            logger.info("Seeded 10 cranes for LALB")

        # ----------------------------------------------------------------
        # 4. Seed Vessels (idempotent)
        # ----------------------------------------------------------------
        if db.query(Vessel).count() == 0:
            vessels = [
                Vessel(id="V-101", vessel_name="Ever Given",          vessel_type="Container", port_id="lalb", capacity=20124.0, length_m=400.0, beam_m=58.8, draft_m=15.7),
                Vessel(id="V-102", vessel_name="Maersk Mc-Kinney",    vessel_type="Container", port_id="lalb", capacity=18270.0, length_m=399.0, beam_m=59.0, draft_m=16.0),
                Vessel(id="V-103", vessel_name="CMA CGM Marco Polo",  vessel_type="Container", port_id="lalb", capacity=16020.0, length_m=396.0, beam_m=53.6, draft_m=15.8),
                Vessel(id="V-104", vessel_name="MSC Oscar",           vessel_type="Container", port_id="lalb", capacity=19224.0, length_m=395.0, beam_m=59.0, draft_m=16.0),
                Vessel(id="V-105", vessel_name="OOCL Hong Kong",      vessel_type="Container", port_id="lalb", capacity=21413.0, length_m=399.0, beam_m=58.8, draft_m=16.0),
                Vessel(id="V-106", vessel_name="Cosco Universe",      vessel_type="Container", port_id="lalb", capacity=21237.0, length_m=400.0, beam_m=58.6, draft_m=16.0),
                Vessel(id="V-107", vessel_name="Nordic Saturn",       vessel_type="Tanker",    port_id="lalb", capacity=150000.0, length_m=274.0, beam_m=48.0, draft_m=14.5),
                Vessel(id="V-108", vessel_name="Golden Enterprise",   vessel_type="Bulk",      port_id="lalb", capacity=82000.0,  length_m=229.0, beam_m=32.2, draft_m=14.0),
            ]
            db.add_all(vessels)
            db.commit()
            logger.info("Seeded 8 vessels")

        # ----------------------------------------------------------------
        # 5. Refresh vessel schedules every startup
        #
        # Delete SCHEDULED entries whose ETA is in the past, then re-seed
        # all slots relative to *now* if the window is partially or fully
        # stale (i.e., fewer than 4 future SCHEDULED rows remain).
        # ----------------------------------------------------------------
        _refresh_schedules(db)

    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        db.rollback()


def _refresh_schedules(db: Session) -> None:
    """Remove stale LALB SCHEDULED entries and re-seed if needed."""
    # Use naive UTC to match what SQLite stores (no tzinfo on stored datetimes)
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)

    # Count how many SCHEDULED rows are still in the future
    future_count = (
        db.query(VesselSchedule)
        .filter(
            VesselSchedule.port_id == "lalb",
            VesselSchedule.status == "SCHEDULED",
            VesselSchedule.eta > now_naive,
        )
        .count()
    )

    if future_count >= 4:
        # Enough active schedules — nothing to do
        return

    # Remove all SCHEDULED entries (past and future) and re-seed fresh ones
    db.query(VesselSchedule).filter(
        VesselSchedule.port_id == "lalb",
        VesselSchedule.status == "SCHEDULED",
    ).delete(synchronize_session=False)
    db.commit()

    schedules = [
        VesselSchedule(
            vessel_id=vessel_id,
            port_id="lalb",
            eta=now_naive + timedelta(hours=offset_h),  # naive UTC
            expected_service_duration_hours=svc_h,
            priority=priority,
            status="SCHEDULED",
        )
        for vessel_id, offset_h, svc_h, priority in _VESSEL_OFFSETS
    ]
    db.add_all(schedules)
    db.commit()
    logger.info(f"Refreshed {len(schedules)} vessel schedules for LALB (72-hour window)")
