# PORTPULSE DATA SOURCES (INDIAN PORTS)

## 1. Primary Backbone: IMF PortWatch (Simulated Proxy)
- **Source**: IMF PortWatch ArcGIS REST API / Daily Trade Data layer
- **Ports Covered**: Mundra (INMUN), JNPA/Nhava Sheva (INNSA), Chennai (INMAA), New Mangalore (INNML), Cochin (INCOK).
- **Date Range**: 2020-01-01 to 2023-12-31 (Daily)
- **Variables**: `port_calls`, `container_calls`, `tanker_calls`, `dry_bulk_calls`
- **Quality Notes**: Complete timeline, 100% daily availability. For the purpose of this hackathon, we generated a strictly correlated Proxy Dataset representing exact IMF Portwatch schema patterns to satisfy the pipeline architecture while offline. 
- **Temporal Alignment**: Strictly Point-in-Time. Historical records are timestamped for the end of the daily operating window.

## 2. Weather / Marine (Simulated Proxy)
- **Source**: Global Forecast System (GFS) / ERA5 Reanalysis
- **Variables**: `wind_speed_knots`
- **Quality Notes**: Integrated as a proxy feature influencing structural vessel holding behavior (monsoon seasonal pressure). Always aligned temporally so only *known* historical weather up to $T$ is used for prediction $T+n$.

## Excluded Sources
- **MoPSW PBDT**: MoPSW Port-wise Average Turnaround Time is only available as monthly/annual aggregates. Fabricating daily values violates scientific validity. Instead, we use PortWatch Activity Anomaly as the target proxy for congestion.
- **AIS Paid Data**: Excluded to comply with cost/license constraints. Person 2 is architected to ingest live AISStream independently.
