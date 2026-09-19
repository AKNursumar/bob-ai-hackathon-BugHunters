"""
Seed realistic operational data for PortPulse (Port port776).
Populates berths, cranes, vessels, and a fresh 72-hour arrival schedule.

On every startup the vessel schedules are refreshed: any existing SCHEDULED
entries whose ETA has already passed are removed and new ones are inserted
relative to the current wall-clock time, so the planning horizon always
contains live data.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.database_models import Port, Berth, Crane, Vessel, VesselSchedule, Assignment
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
    ("V-201", 10, 3.0, 0),
    ("V-202", 11, 4.0, 0),
]


def seed_database(db: Session) -> None:
    """Seed initial operational entities and refresh vessel schedules."""
    try:
        # ----------------------------------------------------------------
        # 1. Ensure Indian Ports exist
        # ----------------------------------------------------------------
        indian_ports_data = [
            ("port776", "JNPA / Nhava Sheva", "INNSA", 18.9499, 72.9500),
            ("port777", "Mundra", "INMUN", 22.7369, 69.7022),
            ("port235", "Chennai", "INMAA", 13.0827, 80.2707),
            ("port540", "Kandla", "INIXY", 23.0163, 70.2177),
            ("port1367", "Visakhapatnam", "INVTZ", 17.6868, 83.2185),
        ]
        
        for pid, pname, pcode, plat, plon in indian_ports_data:
            port_entry = db.query(Port).filter(Port.id == pid).first()
            if not port_entry:
                port_entry = Port(
                    id=pid,
                    name=pname,
                    code=pcode,
                    latitude=plat,
                    longitude=plon,
                )
                db.add(port_entry)
        db.commit()

        # ----------------------------------------------------------------
        # 2. Seed Berths for Mundra (idempotent)
        # ----------------------------------------------------------------
        if db.query(Berth).filter(Berth.port_id == "port777").count() == 0:
            berths = [
                Berth(id="B1", port_id="port777", name="Adani CT1 - Berth 1", capacity_teu=25000.0, usable_length_m=620.0, usable_width_m=70.0, supports_parallel_berthing=1, safety_clearance_m=20.0, status="AVAILABLE"),
                Berth(id="B2", port_id="port777", name="Adani CT2 - Berth 2", capacity_teu=20000.0, usable_length_m=450.0, usable_width_m=70.0, supports_parallel_berthing=1, safety_clearance_m=20.0, status="AVAILABLE"),
                Berth(id="B3", port_id="port777", name="Adani CT3 - Berth 3", capacity_teu=18000.0, status="AVAILABLE"),
                Berth(id="B4", port_id="port777", name="Bulk Terminal - Berth 4", capacity_tonnage=100000.0, status="AVAILABLE"),
                Berth(id="B5", port_id="port777", name="Liquid Terminal - Berth 5", capacity_tonnage=150000.0, status="AVAILABLE"),
            ]
            db.add_all(berths)
            db.commit()
            logger.info("Seeded 5 berths for port777")

        # Upgrade existing berth rows without disturbing operational status.
        for berth_id, length, width, clearance in (("B1", 620.0, 70.0, 20.0), ("B2", 450.0, 70.0, 20.0)):
            berth = db.query(Berth).filter(Berth.id == berth_id, Berth.port_id == "port777").first()
            if berth and (berth.usable_length_m is None or (berth_id == "B1" and berth.usable_length_m == 500.0)):
                berth.usable_length_m = length
                berth.usable_width_m = width
                berth.supports_parallel_berthing = 1
                berth.safety_clearance_m = clearance
        db.commit()

        # ----------------------------------------------------------------
        # 3. Seed Cranes for Mundra (idempotent)
        # ----------------------------------------------------------------
        if db.query(Crane).filter(Crane.port_id == "port777").count() == 0:
            cranes = [
                Crane(
                    id=f"CR-{i:02d}",
                    port_id="port777",
                    berth_id=f"B{((i - 1) // 2) + 1}",
                    name=f"Super Post-Panamax Crane {i}",
                    capacity_teu_per_hour=35.0,
                    status="AVAILABLE",
                )
                for i in range(1, 11)
            ]
            db.add_all(cranes)
            db.commit()
            logger.info("Seeded 10 cranes for port777")

        # ----------------------------------------------------------------
        # 4. Seed Vessels for Mundra (idempotent)
        # ----------------------------------------------------------------
        if db.query(Vessel).count() == 0:
            vessels = [
                Vessel(id="V-101", vessel_name="Ever Given",          vessel_type="Container", port_id="port777", capacity=20124.0, length_m=400.0, beam_m=58.8, draft_m=15.7),
                Vessel(id="V-102", vessel_name="Maersk Mc-Kinney",    vessel_type="Container", port_id="port777", capacity=18270.0, length_m=399.0, beam_m=59.0, draft_m=16.0),
                Vessel(id="V-103", vessel_name="CMA CGM Marco Polo",  vessel_type="Container", port_id="port777", capacity=16020.0, length_m=396.0, beam_m=53.6, draft_m=15.8),
                Vessel(id="V-104", vessel_name="MSC Oscar",           vessel_type="Container", port_id="port777", capacity=19224.0, length_m=395.0, beam_m=59.0, draft_m=16.0),
                Vessel(id="V-105", vessel_name="OOCL Hong Kong",      vessel_type="Container", port_id="port777", capacity=21413.0, length_m=399.0, beam_m=58.8, draft_m=16.0),
                Vessel(id="V-106", vessel_name="Cosco Universe",      vessel_type="Container", port_id="port777", capacity=21237.0, length_m=400.0, beam_m=58.6, draft_m=16.0),
                Vessel(id="V-107", vessel_name="Nordic Saturn",       vessel_type="Tanker",    port_id="port777", capacity=150000.0, length_m=274.0, beam_m=48.0, draft_m=14.5),
                Vessel(id="V-108", vessel_name="Golden Enterprise",   vessel_type="Bulk",      port_id="port777", capacity=82000.0,  length_m=229.0, beam_m=32.2, draft_m=14.0),
                Vessel(id="V-201", vessel_name="Coastal Feeder A",     vessel_type="Container", port_id="port777", capacity=1200.0,   length_m=70.0, beam_m=14.0, draft_m=7.0),
                Vessel(id="V-202", vessel_name="Coastal Feeder B",     vessel_type="Container", port_id="port777", capacity=1500.0,   length_m=80.0, beam_m=15.0, draft_m=7.5),
            ]
            db.add_all(vessels)
            db.commit()
            logger.info("Seeded 8 vessels")
        else:
            existing_ids = {v.id for v in db.query(Vessel).all()}
            demo_vessels = [
                Vessel(id="V-201", vessel_name="Coastal Feeder A", vessel_type="Container", port_id="port777", capacity=1200.0, length_m=70.0, beam_m=14.0, draft_m=7.0),
                Vessel(id="V-202", vessel_name="Coastal Feeder B", vessel_type="Container", port_id="port777", capacity=1500.0, length_m=80.0, beam_m=15.0, draft_m=7.5),
            ]
            db.add_all([vessel for vessel in demo_vessels if vessel.id not in existing_ids])
            db.commit()

        # ----------------------------------------------------------------
        # 5. Refresh vessel schedules every startup
        # ----------------------------------------------------------------
        _refresh_schedules(db)
        _ensure_demo_assignment(db)
        _ensure_all_port_space_data(db)

    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        db.rollback()


def _refresh_schedules(db: Session) -> None:
    """Remove stale port777 SCHEDULED entries and re-seed if needed."""
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)

    future_count = (
        db.query(VesselSchedule)
        .filter(
            VesselSchedule.port_id == "port777",
            VesselSchedule.status == "SCHEDULED",
            VesselSchedule.eta > now_naive,
        )
        .count()
    )

    if future_count >= 4:
        _ensure_demo_schedules(db, now_naive)
        return

    db.query(VesselSchedule).filter(
        VesselSchedule.port_id == "port777",
        VesselSchedule.status == "SCHEDULED",
    ).delete(synchronize_session=False)
    db.commit()

    schedules = [
        VesselSchedule(
            vessel_id=vessel_id,
            port_id="port777",
            eta=now_naive + timedelta(hours=offset_h),
            expected_service_duration_hours=svc_h,
            priority=priority,
            status="SCHEDULED",
        )
        for vessel_id, offset_h, svc_h, priority in _VESSEL_OFFSETS
    ]
    db.add_all(schedules)
    db.commit()
    logger.info(f"Refreshed {len(schedules)} vessel schedules for port777 (72-hour window)")


def _ensure_demo_schedules(db: Session, now_naive: datetime) -> None:
    """Add demo feeder arrivals to an existing installation without refresh churn."""
    existing_ids = {schedule.vessel_id for schedule in db.query(VesselSchedule).filter(VesselSchedule.port_id == "port777").all()}
    missing = [
        VesselSchedule(vessel_id=vessel_id, port_id="port777", eta=now_naive + timedelta(hours=offset), expected_service_duration_hours=duration, priority=0, status="SCHEDULED")
        for vessel_id, offset, duration in (("V-201", 10, 3.0), ("V-202", 11, 4.0))
        if vessel_id not in existing_ids
    ]
    if missing:
        db.add_all(missing)
        db.commit()


def _ensure_demo_assignment(db: Session) -> None:
    """Create one real active occupancy record for the space-recovery demo."""
    if db.query(Assignment).filter(Assignment.vessel_id == "V-101", Assignment.berth_id == "B1").first():
        return
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add(Assignment(
        vessel_id="V-101",
        berth_id="B1",
        planned_start=now + timedelta(hours=2),
        planned_end=now + timedelta(hours=26),
        waiting_time_hours=0.0,
    ))
    db.commit()


def _ensure_all_port_space_data(db: Session) -> None:
    """Add isolated, globally unique occupancy demo data for every other port."""
    port_configs = {
        "port776": ("JNPA", 500.0),
        "port235": ("Chennai", 500.0),
        "port540": ("Kandla", 500.0),
        "port1367": ("Visakhapatnam", 500.0),
    }
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for port_id, (short_name, berth_length) in port_configs.items():
        prefix = port_id.replace("port", "P")
        berth_ids = [f"{prefix}-B1", f"{prefix}-B2", f"{prefix}-B3"]
        if db.query(Berth).filter(Berth.port_id == port_id).count() == 0:
            db.add_all([
                Berth(
                    id=berth_ids[0], port_id=port_id, name=f"{short_name} Container Berth 1",
                    capacity_teu=18000.0, usable_length_m=berth_length, usable_width_m=70.0,
                    supports_parallel_berthing=1, safety_clearance_m=20.0, status="AVAILABLE",
                ),
                Berth(
                    id=berth_ids[1], port_id=port_id, name=f"{short_name} Container Berth 2",
                    capacity_teu=16000.0, usable_length_m=450.0, usable_width_m=70.0,
                    supports_parallel_berthing=1, safety_clearance_m=20.0, status="AVAILABLE",
                ),
                Berth(
                    id=berth_ids[2], port_id=port_id, name=f"{short_name} General Berth 3",
                    capacity_tonnage=90000.0, supports_parallel_berthing=0, status="AVAILABLE",
                ),
            ])
            db.commit()

        if db.query(Crane).filter(Crane.port_id == port_id).count() == 0:
            db.add_all([
                Crane(
                    id=f"{prefix}-CR-{index:02d}", port_id=port_id, berth_id=berth_ids[(index - 1) // 2],
                    name=f"{short_name} Gantry Crane {index}", capacity_teu_per_hour=35.0, status="AVAILABLE",
                )
                for index in range(1, 7)
            ])
            db.commit()

        vessel_specs = [
            (f"{prefix}-V101", f"{short_name} Mainline Vessel", 300.0, 50.0, 14.0),
            (f"{prefix}-V201", f"{short_name} Feeder A", 60.0, 14.0, 7.0),
            (f"{prefix}-V202", f"{short_name} Feeder B", 70.0, 15.0, 7.5),
        ]
        existing_vessel_ids = {vessel.id for vessel in db.query(Vessel).filter(Vessel.port_id == port_id).all()}
        for vessel_id, vessel_name, length, beam, draft in vessel_specs:
            if vessel_id not in existing_vessel_ids:
                db.add(Vessel(
                    id=vessel_id, vessel_name=vessel_name, vessel_type="Container", port_id=port_id,
                    capacity=5000.0, length_m=length, beam_m=beam, draft_m=draft,
                ))
        db.commit()

        existing_schedule_ids = {
            schedule.vessel_id
            for schedule in db.query(VesselSchedule).filter(VesselSchedule.port_id == port_id).all()
        }
        schedules = [
            VesselSchedule(
                vessel_id=f"{prefix}-V201", port_id=port_id, eta=now + timedelta(hours=10),
                expected_service_duration_hours=3.0, priority=0, status="SCHEDULED",
            ),
            VesselSchedule(
                vessel_id=f"{prefix}-V202", port_id=port_id, eta=now + timedelta(hours=11),
                expected_service_duration_hours=4.0, priority=0, status="SCHEDULED",
            ),
        ]
        db.add_all([schedule for schedule in schedules if schedule.vessel_id not in existing_schedule_ids])
        db.commit()

        if not db.query(Assignment).filter(Assignment.vessel_id == f"{prefix}-V101", Assignment.berth_id == berth_ids[0]).first():
            db.add(Assignment(
                vessel_id=f"{prefix}-V101", berth_id=berth_ids[0],
                planned_start=now + timedelta(hours=2), planned_end=now + timedelta(hours=26),
                waiting_time_hours=0.0,
            ))
            db.commit()
