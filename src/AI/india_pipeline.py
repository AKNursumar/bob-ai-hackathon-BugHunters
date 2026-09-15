import pandas as pd
import numpy as np
import joblib
import json
import os
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, balanced_accuracy_score
import xgboost as xgb
import warnings
warnings.filterwarnings("ignore")

def create_features(df):
    """Create lag and rolling features without data leakage."""
    df = df.sort_values(['port_id', 'date']).reset_index(drop=True)
    
    # 1. Temporal features
    df['month'] = df['date'].dt.month
    df['day_of_week'] = df['date'].dt.weekday
    df['weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    # 2. Lag and rolling features for numerical columns
    cols = ['port_calls', 'container_calls', 'tanker_calls', 'dry_bulk_calls', 'wind_speed_knots']
    
    # Ensure no leakage: shift everything by 1 to represent data available AT prediction time
    # e.g., if we are predicting tomorrow (date + 1), we only know up to today (date).
    for col in cols:
        for lag in [1, 2, 3, 7, 14, 30]:
            df[f'{col}_lag_{lag}'] = df.groupby('port_id')[col].shift(lag)
            
        for window in [3, 7, 14, 30]:
            # shift(1) means the rolling window ends on yesterday, strictly using historical data
            # actually if we are at time T, predicting T+1, T+2, T+3, we know data at T.
            # So shift(0) on the daily level but we predict the FUTURE.
            # wait, if df has date T, and target is T+1, then features at T can use data up to T.
            df[f'{col}_rolling_mean_{window}'] = df.groupby('port_id')[col].transform(
                lambda x: x.rolling(window, min_periods=1).mean()
            )
            df[f'{col}_rolling_max_{window}'] = df.groupby('port_id')[col].transform(
                lambda x: x.rolling(window, min_periods=1).max()
            )
            df[f'{col}_rolling_std_{window}'] = df.groupby('port_id')[col].transform(
                lambda x: x.rolling(window, min_periods=1).std()
            )

    # 3. Momentum features
    df['port_calls_change_1d'] = df['port_calls'] - df['port_calls_lag_1']
    df['port_calls_change_7d'] = df['port_calls'] - df['port_calls_lag_7']
    
    # Cargo Mix
    df['container_ratio'] = df['container_calls'] / (df['port_calls'] + 1e-5)
    df['tanker_ratio'] = df['tanker_calls'] / (df['port_calls'] + 1e-5)
    
    return df

def run_pipeline():
    print("==================================================")
    print("PORTPULSE ML PIPELINE: INDIAN PORTS")
    print("==================================================")
    
    in_file = Path("data/indian_ports_activity.csv")
    if not in_file.exists():
        print(f"Error: {in_file} not found. Run generate_indian_ports.py first.")
        return
        
    df = pd.read_csv(in_file)
    df['date'] = pd.to_datetime(df['date'])
    
    print("1. FEATURE ENGINEERING...")
    df = create_features(df)
    
    print("2. TARGET GENERATION (Anomalous High Pressure)...")
    # Define target: future port activity / congestion pressure anomaly
    # To prevent leakage, threshold is defined on a port-specific basis using the chronological first 60% of data
    df_sorted = df.sort_values('date')
    train_end_idx = int(len(df_sorted) * 0.6)
    train_end_date = df_sorted.iloc[train_end_idx]['date']
    
    train_df = df[df['date'] <= train_end_date]
    port_thresholds = train_df.groupby('port_id')['port_calls'].quantile(0.75).to_dict()
    print(f"Port-specific High Pressure Thresholds (75th percentile from Train set): {port_thresholds}")
    
    df['high_pressure_threshold'] = df['port_id'].map(port_thresholds)
    df['is_high_pressure'] = (df['port_calls'] >= df['high_pressure_threshold']).astype(int)
    
    # Target variables (24h, 48h, 72h ahead)
    df['target_24h'] = df.groupby('port_id')['is_high_pressure'].shift(-1)
    df['target_48h'] = df.groupby('port_id')['is_high_pressure'].shift(-2)
    df['target_72h'] = df.groupby('port_id')['is_high_pressure'].shift(-3)
    
    df = df.dropna().reset_index(drop=True)
    
    # Add port identity dummies, but keep a copy for metrics
    df['port'] = df['port_id']
    df = pd.get_dummies(df, columns=['port_id'], drop_first=False)
    
    # Define features
    exclude_cols = ['date', 'port', 'port_name', 'is_high_pressure', 'high_pressure_threshold', 
                    'target_24h', 'target_48h', 'target_72h']
    features = [c for c in df.columns if c not in exclude_cols]
    
    print("3. TRAINING & CHRONOLOGICAL EVALUATION...")
    # Train: < 2022-06-01, Val: 2022-06-01 to 2023-01-01, Test: >= 2023-01-01
    train_df = df[df['date'] < '2022-06-01']
    val_df = df[(df['date'] >= '2022-06-01') & (df['date'] < '2023-01-01')]
    test_df = df[df['date'] >= '2023-01-01']
    
    print(f"Train samples: {len(train_df)}")
    print(f"Validation samples: {len(val_df)}")
    print(f"Test samples: {len(test_df)}")
    
    metrics_report = {}
    os.makedirs('models/india', exist_ok=True)
    os.makedirs('reports/india', exist_ok=True)
    
    for h in ['24h', '48h', '72h']:
        print(f"\n--- Training {h} Horizon ---")
        target_col = f'target_{h}'
        
        X_train, y_train = train_df[features], train_df[target_col]
        X_val, y_val = val_df[features], val_df[target_col]
        X_test, y_test = test_df[features], test_df[target_col]
        
        # Add Port identity via one-hot encoding if needed, or rely on tree splits
        # Since we excluded port_id, we should include it!
        # Wait, I'll update the feature set to include port_id dummy variables or use XGBoost categorical
        # Let's just create dummies for port_id and append to features list
        
        clf = xgb.XGBClassifier(
            n_estimators=200, 
            learning_rate=0.05, 
            max_depth=5, 
            subsample=0.8,
            random_state=42, 
            eval_metric='auc',
            early_stopping_rounds=20
        )
        
        clf.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
        
        y_pred_proba = clf.predict_proba(X_test)[:, 1]
        
        # Determine optimal threshold on validation set
        val_proba = clf.predict_proba(X_val)[:, 1]
        best_thresh = 0.5
        best_f1 = 0
        for th in np.arange(0.1, 0.9, 0.05):
            val_preds = (val_proba >= th).astype(int)
            f1 = f1_score(y_val, val_preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_thresh = th
                
        # Evaluate on Test (chronological split)
        y_pred = (y_pred_proba >= best_thresh).astype(int)
        
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        pr_auc = average_precision_score(y_test, y_pred_proba)
        bal_acc = balanced_accuracy_score(y_test, y_pred)
        acc = accuracy_score(y_test, y_pred)
        positive_rate = y_test.mean()
        
        print(f"ROC-AUC: {roc_auc:.3f}")
        print(f"PR-AUC:  {pr_auc:.3f}")
        print(f"Bal-Acc: {bal_acc:.3f}")
        print(f"Acc:     {acc:.3f}")
        print(f"Threshold used (from Val): {best_thresh:.2f}")
        print(f"Test Positive Rate: {positive_rate:.3f}")
        
        metrics_report[h] = {
            "roc_auc": round(float(roc_auc), 3),
            "pr_auc": round(float(pr_auc), 3),
            "balanced_accuracy": round(float(bal_acc), 3),
            "accuracy": round(float(acc), 3),
            "test_positive_rate": round(float(positive_rate), 3),
            "threshold": float(best_thresh)
        }
        
        # Port-level performance on test set
        test_df_results = test_df.copy()
        test_df_results['pred_proba'] = y_pred_proba
        test_df_results['pred'] = y_pred
        
        port_metrics = {}
        for port in test_df_results['port'].unique():
            port_data = test_df_results[test_df_results['port'] == port]
            if len(port_data[target_col].unique()) > 1: # check if both classes present
                port_bal_acc = balanced_accuracy_score(port_data[target_col], port_data['pred'])
                port_roc = roc_auc_score(port_data[target_col], port_data['pred_proba'])
                port_metrics[port] = {"balanced_accuracy": round(port_bal_acc, 3), "roc_auc": round(port_roc, 3)}
        
        metrics_report[h]['port_level'] = port_metrics
        
        # Serialize model
        payload = {
            'model': clf,
            'features': features,
            'threshold': best_thresh,
            'target_definition': 'Future Port Activity Anomaly (>= 85th percentile from training)',
            'port_thresholds': port_thresholds
        }
        joblib.dump(payload, f"models/india/congestion_{h}.joblib")
        
        # Feature importance
        importance = clf.feature_importances_
        feature_imp = pd.DataFrame({'feature': features, 'importance': importance})
        feature_imp = feature_imp.sort_values('importance', ascending=False).head(15)
        feature_imp.to_csv(f"reports/india/feature_importance_{h}.csv", index=False)
            
    # Serialize schema and metadata
    with open("models/india/metadata.json", "w") as f:
        json.dump({
            "model_version": "3.0-INDIAN-PORTS",
            "target_definition": "Future Port Activity Anomaly",
            "metrics": metrics_report,
            "features": features
        }, f, indent=2)
        
    print("\nModels serialized to models/india/")

if __name__ == "__main__":
    run_pipeline()
