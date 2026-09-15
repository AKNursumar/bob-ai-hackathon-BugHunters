import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

np.random.seed(42)

ports = {
    'INMUN': {'name': 'Mundra', 'scale': 100, 'container_pct': 0.40, 'tanker_pct': 0.20, 'bulk_pct': 0.40},
    'INNSA': {'name': 'JNPA', 'scale': 90, 'container_pct': 0.70, 'tanker_pct': 0.15, 'bulk_pct': 0.15},
    'INMAA': {'name': 'Chennai', 'scale': 60, 'container_pct': 0.50, 'tanker_pct': 0.20, 'bulk_pct': 0.30},
    'INNML': {'name': 'New Mangalore', 'scale': 30, 'container_pct': 0.10, 'tanker_pct': 0.50, 'bulk_pct': 0.40},
    'INCOK': {'name': 'Cochin', 'scale': 20, 'container_pct': 0.40, 'tanker_pct': 0.40, 'bulk_pct': 0.20}
}

dates = pd.date_range(start='2020-01-01', end='2023-12-31', freq='D')
records = []

for port_id, info in ports.items():
    scale = info['scale']
    
    # Base seasonal effect (monsoon dip in Jun-Aug)
    day_of_year = dates.dayofyear
    monsoon_effect = np.where((day_of_year > 152) & (day_of_year < 244), 0.85, 1.0)
    
    # Weekly effect (lower on Sundays)
    weekly_effect = np.where(dates.dayofweek == 6, 0.9, 1.0)
    
    # Autoregressive component for realistic time series (highly persistent)
    ar_series = np.zeros(len(dates))
    ar_series[0] = np.random.normal(0, 0.05)
    for i in range(1, len(dates)):
        ar_series[i] = 0.98 * ar_series[i-1] + np.random.normal(0, 0.01)
    
    # Base activity with strong deterministic seasonality
    base_activity = scale * monsoon_effect * weekly_effect * (1 + ar_series)
    base_activity = np.maximum(base_activity, 5) # Minimum 5 calls
    
    # We use a smaller variance to keep signal-to-noise ratio high
    # meaning the actual calls follow the underlying base_activity closely
    total_calls = np.random.normal(base_activity, base_activity * 0.02) 
    total_calls = np.maximum(np.round(total_calls), 5).astype(int)
    
    # Distribute by type
    container_calls = np.random.binomial(total_calls, info['container_pct'])
    remaining = total_calls - container_calls
    tanker_calls = np.random.binomial(remaining, info['tanker_pct'] / (info['tanker_pct'] + info['bulk_pct']))
    bulk_calls = total_calls - container_calls - tanker_calls
    
    # Simulate weather pressure (e.g. wind speed impacting operations)
    wind_speed = np.random.normal(10 + (1 - monsoon_effect) * 20, 5)
    wind_speed = np.clip(wind_speed, 0, 50)
    
    df_port = pd.DataFrame({
        'date': dates,
        'port_id': port_id,
        'port_name': info['name'],
        'port_calls': total_calls,
        'container_calls': container_calls,
        'tanker_calls': tanker_calls,
        'dry_bulk_calls': bulk_calls,
        'wind_speed_knots': wind_speed
    })
    records.append(df_port)

df_all = pd.concat(records, ignore_index=True)
os.makedirs('data', exist_ok=True)
df_all.to_csv('data/indian_ports_activity.csv', index=False)
print("Data generated:", df_all.shape)
