# PortPulse AI: ML Architecture & Engineering Decisions

This document outlines the core technical and strategic decisions made for the Data and Machine Learning (ML) layer of PortPulse AI. The goal of this architecture is to provide a robust, scientifically valid, and operationally useful intelligence pipeline for international port operations.

## 1. What We Predict (Target Definition)
**Decision:** We predict future *port-level congestion pressure* (specifically, anchorage queues exceeding historical baselines), rather than simple vessel traffic volume.
**Reasoning:** High traffic volume is only a problem if port capacity is exceeded. Predicting the actual "friction" (how many ships are forced to wait at anchor) provides a direct proxy for operational congestion.

## 2. Multi-Horizon Forecasting (24h / 48h / 72h)
**Decision:** We train three distinct models to predict congestion across 24-hour, 48-hour, and 72-hour horizons.
**Reasoning:** Port operations require different planning cycles. A 24-hour forecast triggers immediate tactical responses (like crane shifts), while a 72-hour forecast allows for strategic supply chain adjustments. The predictive signal and uncertainty differ across these horizons, so evaluating them separately ensures higher accuracy for each specific operational window.

## 3. Strict Chronological Validation (Zero Leakage)
**Decision:** We strictly evaluate the model by training on past data to predict future unseen data, without randomized shuffling.
**Reasoning:** In time-series forecasting, using a standard random split scrambles time and accidentally feeds "future" information to the model, creating artificially inflated accuracy (Temporal Leakage). A model evaluated under realistic point-in-time conditions is vastly more credible and defensible than one whose high performance depends on an unrealistic validation setup. We optimize for scientific validity, not inflated demo optics.

## 4. Explainable AI (Risk Drivers)
**Decision:** The ML pipeline outputs specific "Risk Drivers" (e.g., rising arrival momentum, historical baseline violations) alongside its probabilistic risk scores.
**Reasoning:** A black-box prediction of "High Risk" is unactionable. Port Captains and operations teams need to understand *why* the AI is raising an alert. Exposing the underlying feature momentum builds trust and aids operational decision-making.

## 5. Architectural Decoupling (ML vs. Optimizer)
**Decision:** The ML layer strictly predicts *what is likely to happen*, and outputs a clean JSON contract. It does not attempt to solve *what to do about it* (e.g., assigning specific berths or cranes).
**Reasoning:** This is a standard enterprise architectural boundary. The ML engine calculates probabilistic risk based on historical macro-data. The downstream Optimizer takes that risk contract and combines it with live, deterministic micro-constraints (crane availability, specific vessel dimensions) to generate actionable plans. This prevents monolithic dependencies and allows each system to scale independently.

## 6. Tree-Based Tabular Models (XGBoost)
**Decision:** We utilize XGBoost as our primary forecasting engine.
**Reasoning:** For macro-level daily tabular data with complex feature interactions, gradient boosting provides the best balance of speed, performance, and interpretability. Deep learning approaches would introduce unnecessary compute overhead and reduce the explainability needed for maritime operations without offering tangible performance gains on this scale of data.
