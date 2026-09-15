# PORTPULSE DATA SOURCES (INDIAN PORTS)

## 1. Primary Backbone: IMF PortWatch (Real World Data)
- **Source**: IMF PortWatch ArcGIS REST API (`Daily_Ports_Data` Layer)
- **Ports Covered**: 
  - `port776` (JNPA / Nhava Sheva)
  - `port777` (Mundra)
  - `port235` (Chennai)
  - `port540` (Kandla)
  - `port1367` (Visakhapatnam)
- **Date Range**: 2019-01-01 to Present (Downloaded 14,020 records across 5 ports)
- **Variables Ingested**: `portcalls`, `portcalls_container`, `portcalls_tanker`, `portcalls_dry_bulk`, `import_cargo`, `export_cargo`.
- **Quality Notes**: 100% real daily historical AIS aggregations officially published by the IMF. No simulations, no fabricated data.
- **Temporal Alignment**: Strictly Point-in-Time. Historical records are timestamped for the end of the daily operating window.

## Excluded Sources
- **MoPSW PBDT**: MoPSW Port-wise Average Turnaround Time is only available as monthly/annual aggregates. Fabricating daily values violates scientific validity. Instead, we use PortWatch Activity Anomaly as the target proxy for congestion.
- **AIS Paid Data**: Excluded to comply with cost/license constraints. Person 2 is architected to ingest live AISStream independently.
