import urllib.request
import json
import pandas as pd
import time
import os

ports = ['port776', 'port777', 'port235', 'port540', 'port1367']
base_url = "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Ports_Data/FeatureServer/0/query"

all_data = []

for port in ports:
    print(f"Fetching data for {port}...", flush=True)
    offset = 0
    while offset < 5000:
        url = f"{base_url}?where=portid%3D%27{port}%27&outFields=*&f=json&resultOffset={offset}&resultRecordCount=1000"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                features = [f['attributes'] for f in data.get('features', [])]
                if not features:
                    break
                all_data.extend(features)
                print(f"  Got {len(features)} records... total for port: {offset + len(features)}", flush=True)
                offset += len(features)
                if len(features) < 1000:
                    break
        except Exception as e:
            print(f"  Error: {e}")
            break
        time.sleep(1)

if all_data:
    df = pd.DataFrame(all_data)
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/indian_ports_activity.csv', index=False)
    print(f"Saved {len(df)} total records to data/indian_ports_activity.csv")
    print(df.columns.tolist())
    print(df.head())
else:
    print("No data fetched.")
