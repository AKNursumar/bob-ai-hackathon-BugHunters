# PORTPULSE DATA + ML ARCHITECTURE

```mermaid
flowchart TD
    subgraph Data_Sources ["Historical Public Data"]
        pw[IMF PortWatch\n(Simulated Proxy)]
        mopsw[MoPSW / PBDT\n(Aggregated)]
        dwell[Dwell / Traffic]
        weather[Weather / Marine\n(Simulated GFS)]
        official[Official Port Data]
    end

    subgraph Data_Processing ["Data Pipeline"]
        ingestion[Data Ingestion]
        val_prov[Validation & Provenance]
        alignment[Temporal Alignment\n(Point-in-Time)]
        state_recon[Port State Reconstruction]
        feat_eng[Feature Engineering]
    end
    
    subgraph ML_Core ["ML Modeling"]
        target[Future Congestion Target\n(Anomaly > 75th pctl)]
        train[Time-Aware Training\n(Chronological Split)]
        select[Model Selection\n(XGBoost)]
    end
    
    subgraph Prediction_Serving ["Inference & Output"]
        forecast[24h / 48h / 72h Forecast]
        risk[Risk + Drivers + Pressure State]
        ml_contract[ML Prediction Contract API]
    end
    
    subgraph Downstream ["Consumers"]
        person2[Person 2: Live Port Monitoring]
        person3[Person 3: Optimisation]
    end

    %% Flow
    pw --> ingestion
    mopsw -.-> ingestion
    dwell -.-> ingestion
    weather --> ingestion
    official -.-> ingestion
    
    ingestion --> val_prov
    val_prov --> alignment
    alignment --> state_recon
    state_recon --> feat_eng
    
    feat_eng --> target
    target --> train
    train --> select
    select --> forecast
    
    forecast --> risk
    risk --> ml_contract
    
    ml_contract --> person2
    ml_contract --> person3
```
