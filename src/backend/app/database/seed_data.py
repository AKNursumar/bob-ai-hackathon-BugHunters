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
        # 2. Seed Berths for Mundra and JNPA
        # ----------------------------------------------------------------
        if db.query(Berth).filter(Berth.port_id == "port777").count() == 0:
            berths = [
                Berth(id="B1", port_id="port777", name="Adani CT1 - Berth 1", capacity_teu=25000.0, status="AVAILABLE"),
                Berth(id="B2", port_id="port777", name="Adani CT2 - Berth 2", capacity_teu=20000.0, status="AVAILABLE"),
                Berth(id="B3", port_id="port777", name="Adani CT3 - Berth 3", capacity_teu=18000.0, status="AVAILABLE"),
                Berth(id="B4", port_id="port777", name="Bulk Terminal - Berth 4", capacity_tonnage=100000.0, status="AVAILABLE"),
                Berth(id="B5", port_id="port777", name="Liquid Terminal - Berth 5", capacity_tonnage=150000.0, status="AVAILABLE"),
            ]
            db.add_all(berths)
            
        if db.query(Berth).filter(Berth.port_id == "port776").count() == 0:
            berths = [
                Berth(id="JNPA-B1", port_id="port776", name="JNPCT - Berth 1", capacity_teu=18000.0, status="AVAILABLE"),
                Berth(id="JNPA-B2", port_id="port776", name="JNPCT - Berth 2", capacity_teu=18000.0, status="AVAILABLE"),
                Berth(id="JNPA-B3", port_id="port776", name="NSICT - Berth 1", capacity_teu=22000.0, status="AVAILABLE"),
                Berth(id="JNPA-B4", port_id="port776", name="NSIGT - Berth 1", capacity_teu=24000.0, status="AVAILABLE"),
            ]
            db.add_all(berths)
            
        db.commit()
        logger.info("Seeded berths for port777 and port776")

        # ----------------------------------------------------------------
        # 3. Seed Cranes for Mundra and JNPA
        # ----------------------------------------------------------------
        if db.query(Crane).filter(Crane.port_id == "port777").count() == 0:
            cranes = [
                Crane(id=f"CR-{i:02d}", port_id="port777", berth_id=f"B{((i - 1) // 2) + 1}", name=f"Mundra Panamax {i}", capacity_teu_per_hour=35.0, status="AVAILABLE")
                for i in range(1, 11)
            ]
            db.add_all(cranes)
            
        if db.query(Crane).filter(Crane.port_id == "port776").count() == 0:
            cranes = [
                Crane(id=f"J-CR-{i:02d}", port_id="port776", berth_id=f"JNPA-B{((i - 1) // 2) + 1}", name=f"JNPA Super Post-Panamax {i}", capacity_teu_per_hour=40.0, status="AVAILABLE")
                for i in range(1, 9)
            ]
            db.add_all(cranes)

        db.commit()
        logger.info("Seeded cranes for port777 and port776")

        # ----------------------------------------------------------------
        # 4. Seed Vessels for Mundra and JNPA
        # ----------------------------------------------------------------
        if db.query(Vessel).count() == 0:
            vessels = [
                # Mundra Vessels
                Vessel(id="V-101", vessel_name="Ever Given",          vessel_type="Container", port_id="port777", capacity=20124.0, length_m=400.0, beam_m=58.8, draft_m=15.7),
                Vessel(id="V-102", vessel_name="Maersk Mc-Kinney",    vessel_type="Container", port_id="port777", capacity=18270.0, length_m=399.0, beam_m=59.0, draft_m=16.0),
                Vessel(id="V-103", vessel_name="CMA CGM Marco Polo",  vessel_type="Container", port_id="port777", capacity=16020.0, length_m=396.0, beam_m=53.6, draft_m=15.8),
                Vessel(id="V-104", vessel_name="MSC Oscar",           vessel_type="Container", port_id="port777", capacity=19224.0, length_m=395.0, beam_m=59.0, draft_m=16.0),
                Vessel(id="V-105", vessel_name="OOCL Hong Kong",      vessel_type="Container", port_id="port777", capacity=21413.0, length_m=399.0, beam_m=58.8, draft_m=16.0),
                Vessel(id="V-106", vessel_name="Cosco Universe",      vessel_type="Container", port_id="port777", capacity=21237.0, length_m=400.0, beam_m=58.6, draft_m=16.0),
                Vessel(id="V-107", vessel_name="Nordic Saturn",       vessel_type="Tanker",    port_id="port777", capacity=150000.0, length_m=274.0, beam_m=48.0, draft_m=14.5),
                Vessel(id="V-108", vessel_name="Golden Enterprise",   vessel_type="Bulk",      port_id="port777", capacity=82000.0,  length_m=229.0, beam_m=32.2, draft_m=14.0),
                
                # JNPA Vessels
                Vessel(id="V-201", vessel_name="MSC Isabella",        vessel_type="Container", port_id="port776", capacity=23656.0, length_m=399.7, beam_m=61.0, draft_m=16.5),
                Vessel(id="V-202", vessel_name="HMM Algeciras",       vessel_type="Container", port_id="port776", capacity=23964.0, length_m=399.9, beam_m=61.0, draft_m=16.5),
                Vessel(id="V-203", vessel_name="Ever Ace",            vessel_type="Container", port_id="port776", capacity=23992.0, length_m=399.9, beam_m=61.5, draft_m=16.2),
                Vessel(id="V-204", vessel_name="CMA CGM Antoine",     vessel_type="Container", port_id="port776", capacity=20600.0, length_m=399.5, beam_m=54.0, draft_m=16.0),
                Vessel(id="V-205", vessel_name="OOCL Gdynia",         vessel_type="Container", port_id="port776", capacity=21413.0, length_m=399.0, beam_m=58.8, draft_m=16.0),
                Vessel(id="V-206", vessel_name="Cosco Shipping Leo",  vessel_type="Container", port_id="port776", capacity=20119.0, length_m=399.8, beam_m=58.6, draft_m=16.0),
            ]
            db.add_all(vessels)
            db.commit()
            logger.info("Seeded vessels for port777 and port776")

        # ----------------------------------------------------------------
        # 5. Refresh vessel schedules every startup
        # ----------------------------------------------------------------
        _refresh_schedules(db)

    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        db.rollback()


def _refresh_schedules(db: Session) -> None:
    """Remove stale SCHEDULED entries and re-seed if needed."""
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)

    for port_id in ["port777", "port776"]:
        future_count = (
            db.query(VesselSchedule)
            .filter(
                VesselSchedule.port_id == port_id,
                VesselSchedule.status == "SCHEDULED",
                VesselSchedule.eta > now_naive,
            )
            .count()
        )

        if future_count >= 4:
            continue

        db.query(VesselSchedule).filter(
            VesselSchedule.port_id == port_id,
            VesselSchedule.status == "SCHEDULED",
        ).delete(synchronize_session=False)
        db.commit()

        # Seed Mundra (V-10X) or JNPA (V-20X)
        vessel_prefix = "V-1" if port_id == "port777" else "V-2"
        schedules = [
            VesselSchedule(
                vessel_id=vessel_id.replace("V-1", vessel_prefix),
                port_id=port_id,
                eta=now_naive + timedelta(hours=offset_h),
                expected_service_duration_hours=svc_h,
                priority=priority,
                status="SCHEDULED",
            )
            for vessel_id, offset_h, svc_h, priority in _VESSEL_OFFSETS
            if vessel_id.replace("V-1", vessel_prefix) in [v.id for v in db.query(Vessel.id).all()]
        ]
        db.add_all(schedules)
        db.commit()
        logger.info(f"Refreshed {len(schedules)} vessel schedules for {port_id} (72-hour window)")
