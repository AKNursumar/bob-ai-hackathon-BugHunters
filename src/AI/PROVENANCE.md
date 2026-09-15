# DATA PROVENANCE & LEAKAGE PREVENTION

## 1. Feature Engineering (Strictly Backward-Looking)
To ensure the ML model predicts future outcomes relying ONLY on information known at time $T$:
- **Lag Features**: All operational features (`portcalls`, `import_cargo`, etc.) are shifted backward ($T-1, T-2, \dots$).
- **Rolling Features**: 3-day, 7-day, 14-day, and 30-day rolling statistics are calculated such that the window strictly terminates at $T$.

## 2. Target Design & Integrity
- **Target Variable**: Future Port Activity / Congestion Pressure Anomaly (24h, 48h, 72h horizons).
- **Threshold**: We define "High Pressure" as port activity exceeding the 75th percentile. 
- **Leakage Prevention in Thresholding**: The 75th percentile is computed *exclusively* on the Training partition (Jan 2019 - Dec 2021). Applying a globally calculated percentile across the entire dataset would leak future distribution characteristics into the training set.

## 3. Train/Validation/Test Split
We strictly use **Chronological Splitting** on the real IMF PortWatch data instead of random `train_test_split`:
- **Train**: $\leq$ 2021-12-31
- **Validation**: 2022-01-01 to 2022-12-31
- **Test**: $\geq$ 2023-01-01

This proves the model can forecast *future* unobserved congestion patterns, relying exclusively on structural data dynamics.
