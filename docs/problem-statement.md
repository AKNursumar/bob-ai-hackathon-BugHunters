# Problem Statement

## Background

Port congestion is not simply a high vessel count. It occurs when arrivals, berth availability, crane capacity, and service duration combine in a way that creates an anchorage queue. By the time that queue is plainly visible, a supervisor has fewer useful choices: vessels are already waiting, berths may be committed, and downstream cargo movements are disrupted.

## The Problem

The 2021 LA/Long Beach port backlog had 100+ ships waiting offshore for weeks, costing global supply chains $10B+. Port operators allocate berths, cranes, and yard space across hundreds of vessels manually in spreadsheets. Congestion hotspots are identified reactively — after vessels are already queuing — and alternate routing decisions come too late to help.

## Who Is Affected

- **Port operations supervisors** who sequence arrivals and resolve berth conflicts during a shift.
- **Berth and yard planners** who need a usable 72-hour view of vessel service windows and resource pressure.
- **Supply-chain coordinators and shipping agents** who need early visibility of likely waiting time and disruption.

## Why It Matters

Waiting vessels consume scarce berth and crane capacity, create uncertainty for cargo hand-offs, and make schedule changes more expensive as the planning window closes. The important operational distinction is between seeing an existing queue and receiving an explainable warning early enough to adjust the schedule.

## Why Existing Approaches Fall Short

Many tools provide vessel positions or a static schedule in isolation. They do not combine a congestion-risk forecast with configured operational constraints, nor do they let an operator compare a baseline schedule with an optimized alternative in the same workflow.

PORTPULSE AI addresses that gap by treating forecasting as one input to an operational decision flow: it exposes risk and its drivers, evaluates disruption scenarios, and creates a constraint-based plan for the next 72 hours.

## Prototype Scope and Data Boundaries

The runnable prototype is centered on **Los Angeles-Long Beach (`lalb`)**. Its forecasting layer uses checked-in AIS-derived daily aggregates and trained XGBoost models. At startup, the backend seeds a local SQLite database with a representative operational configuration: five berths, ten cranes, eight vessels, and a rolling 72-hour schedule.

These two data types have different roles:

- AIS-derived aggregates support the port-level congestion-pressure forecast.
- Seeded berth, crane, and schedule records support demonstration and testing of the optimizer.

Consequently, the project forecasts **port-level congestion pressure**—an anchorage-queue proxy—not a production berth-level wait-time prediction. The configured operational records should be replaced with validated port feeds before production use.
