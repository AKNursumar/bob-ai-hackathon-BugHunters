# DATA PROVENANCE & LEAKAGE PREVENTION

## 1. Feature Engineering (Strictly Backward-Looking)
To ensure the ML model predicts future outcomes relying ONLY on information known at time $T$:
- **Lag Features**: All operational features (`port_calls`, `container_calls`, `wind_speed`) are shifted backward ($T-1, T-2, \dots$).
- **Rolling Features**: 3-day, 7-day, 14-day, and 30-day rolling statistics are calculated such that the window strictly terminates at $T$.

## 2. Target Design & Integrity
- **Target Variable**: Future Port Activity / Congestion Pressure Anomaly (24h, 48h, 72h horizons).
- **Threshold**: We define "High Pressure" as port activity exceeding the 75th percentile. 
- **Leakage Prevention in Thresholding**: The 75th percentile is computed *exclusively* on the Training partition (Jan 2020 - May 2022). Applying a globally calculated percentile across the entire dataset would leak future distribution characteristics into the training set.

## 3. Train/Validation/Test Split
We strictly use **Chronological Splitting** instead of random `train_test_split`:
- **Train**: 2020-01-01 to 2022-05-31
- **Validation**: 2022-06-01 to 2022-12-31
- **Test**: 2023-01-01 to 2023-12-31

This proves the model can forecast *future* unobserved congestion patterns, rather than merely interpolating between random observations.
