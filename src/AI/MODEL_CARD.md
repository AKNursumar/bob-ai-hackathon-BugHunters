# MODEL CARD: PortPulse Congestion Forecaster (India)

## Model Overview
- **Model Type**: XGBoost Classifier (Trees)
- **Target**: Port Activity Anomaly (> 75th percentile of historical train activity)
- **Horizons**: 24h, 48h, 72h
- **Modeling Unit**: Port $\times$ Prediction Time
- **Version**: 3.0-INDIAN-PORTS

## Performance Metrics (Unseen Future Test Set: 2023)

### 24h Horizon
- **ROC-AUC**: 0.916
- **Balanced Accuracy**: 0.826
- **PR-AUC**: 0.799

### 48h Horizon
- **ROC-AUC**: 0.901
- **Balanced Accuracy**: 0.831
- **PR-AUC**: 0.777

### 72h Horizon
- **ROC-AUC**: 0.880
- **Balanced Accuracy**: 0.788
- **PR-AUC**: 0.721

## Feature Importance (Top Drivers)
Based on SHAP / Tree-Split criteria across the models, the dominant risk drivers are:
1. `port_calls_rolling_mean_3` (Recent short-term congestion state)
2. `port_calls_lag_1` (Immediate momentum)
3. `port_calls_rolling_mean_7` (Medium-term backlog state)
4. `port_calls_change_1d` (Acceleration of arrivals)

## Ethical & Scientific Considerations
- **No Random Shuffling**: Model performance is reported on a strict chronological out-of-time test set. 
- **No Threshold Cheating**: The classification threshold was optimized against the Validation set, not tuned to inflate Test metrics.
- **Explainability**: XGBoost provides structural importance, helping downstream optimization components understand *why* risk is elevated.
