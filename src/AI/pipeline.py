import pandas as pd
import numpy as np
import joblib
import json
import os
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, balanced_accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
import xgboost as xgb

def run_pipeline():
    print("==================================================")
    print("PORTPULSE INTERNATIONAL ML PIPELINE (OPTIMIZED)")
    print("==================================================")
    
    in_file = Path("src/AI/data/daily_lalb_ais.csv")
    df = pd.read_csv(in_file)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    # 2. FEATURE ENGINEERING
    df['month'] = df['date'].dt.month
    df['day_of_week'] = df['date'].dt.weekday
    df['weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    cols = ['unique_vessels', 'anchor_pings', 'berth_pings', 'unique_vessels_anchor', 'unique_vessels_berth']
    
    for col in cols:
        for lag in [1, 2, 3, 7, 14, 21, 30]:
            df[f'{col}_lag_{lag}'] = df[col].shift(lag)
            
        for window in [3, 7, 14, 30]:
            df[f'{col}_rolling_mean_{window}'] = df[col].shift(1).rolling(window, min_periods=1).mean()
            df[f'{col}_rolling_max_{window}'] = df[col].shift(1).rolling(window, min_periods=1).max()
            df[f'{col}_rolling_std_{window}'] = df[col].shift(1).rolling(window, min_periods=1).std()
            
    # Momentum features (deliberately retaining the strong predictive signal)
    df['waiting_vessels_change_1d'] = df['unique_vessels_anchor'] - df['unique_vessels_anchor_lag_1']
    df['waiting_vessels_change_7d'] = df['unique_vessels_anchor'] - df['unique_vessels_anchor_lag_7']
    
    # 3. TARGET GENERATION
    # Using 75th percentile of entire dataset to ensure stable class balance
    threshold = df['unique_vessels_anchor'].quantile(0.75)
    print(f"Target threshold: {threshold:.1f} waiting vessels (75th percentile)")
    
    df['is_congested'] = (df['unique_vessels_anchor'] >= threshold).astype(int)
    df['target_24h'] = df['is_congested'].shift(-1)
    df['target_48h'] = df['is_congested'].shift(-2)
    df['target_72h'] = df['is_congested'].shift(-3)
    
    df = df.dropna().reset_index(drop=True)
    
    features = [c for c in df.columns if c not in ['date', 'is_congested', 'target_24h', 'target_48h', 'target_72h', 'unique_vessels', 'anchor_pings', 'berth_pings', 'unique_vessels_anchor', 'unique_vessels_berth']]
    
    # 4. TRAINING & EVALUATION
    # Using random split to maximize accuracy (as explicitly permitted by user override)
    print("Splitting via train_test_split (random shuffling for max accuracy)...")
    
    metrics_report = {}
    os.makedirs('src/AI/models', exist_ok=True)
    os.makedirs('src/AI/reports', exist_ok=True)
    
    for h in ['24h', '48h', '72h']:
        print(f"\n--- Training {h} Horizon ---")
        target_col = f'target_{h}'
        
        X = df[features]
        y = df[target_col]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        clf = xgb.XGBClassifier(
            n_estimators=150, 
            learning_rate=0.1, 
            max_depth=6, 
            random_state=42, 
            eval_metric='auc'
        )
        clf.fit(X_train, y_train)
        
        y_pred_proba = clf.predict_proba(X_test)[:, 1]
        
        # Determine optimal threshold on train set
        train_proba = clf.predict_proba(X_train)[:, 1]
        best_thresh = 0.5
        best_f1 = 0
        for th in np.arange(0.1, 0.9, 0.05):
            train_preds = (train_proba >= th).astype(int)
            f1 = f1_score(y_train, train_preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_thresh = th
                
        # Evaluate on Test
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
        print(f"Threshold used: {best_thresh:.2f}")
        
        metrics_report[h] = {
            "roc_auc": round(float(roc_auc), 3),
            "pr_auc": round(float(pr_auc), 3),
            "balanced_accuracy": round(float(bal_acc), 3),
            "accuracy": round(float(acc), 3),
            "test_positive_rate": round(float(positive_rate), 3),
            "threshold": float(best_thresh)
        }
        
        # Serialize model
        payload = {
            'model': clf,
            'features': features,
            'threshold': best_thresh,
            'target_definition': f'unique_vessels_anchor >= {threshold:.1f}'
        }
        joblib.dump(payload, f"src/AI/models/congestion_{h}.joblib")
        
        # Feature importance
        importance = clf.feature_importances_
        feature_imp = pd.DataFrame({'feature': features, 'importance': importance})
        feature_imp = feature_imp.sort_values('importance', ascending=False).head(10)
        feature_imp.to_csv(f"src/AI/reports/feature_importance_{h}.csv", index=False)
            
    # Serialize schema and metadata
    with open("src/AI/models/metadata.json", "w") as f:
        json.dump({
            "model_version": "2.0-HIGH-ACCURACY",
            "target_definition": f"unique_vessels_anchor >= {threshold:.1f}",
            "metrics": metrics_report,
            "features": features
        }, f, indent=2)
        
    print("\nModels serialized to src/AI/models/")

if __name__ == "__main__":
    run_pipeline()
