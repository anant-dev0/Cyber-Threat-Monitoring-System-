# Cyber Threat Monitoring and Intrusion Detection System

A complete final-year project that detects and visualizes network intrusions in real-time.

## features
- **Machine Learning**: RandomForest Classifier trained on (synthetic) CIC-IDS2017 data.
- **Real-Time Dashboard**: Live world map visualization of cyber attacks.
- **Traffic Simulation**: Generates realistic network flows for demonstration.
- **Attack Detection**: Identifies DDoS, Port Scans, Botnets, and Brute Force attacks.

## Project Structure
```
/cyber
├── /backend            # Flask Server & Logic
│   └── app.py
├── /data               # Dataset (Synthetic or Real)
├── /frontend           # Dashboard (HTML/CSS/JS)
├── /models             # Trained ML Models
├── /scripts            # Utility Scripts
│   ├── generate_data.py
│   ├── train_model.py
│   └── simulate_attacks.py
└── requirements.txt
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Generate Data & Train Model**
   (First time only)
   ```bash
   # Generate synthetic dataset
   python scripts/generate_data.py
   
   # Train the Intrusion Detection System
   python scripts/train_model.py
   ```

3. **Run the Dashboard**
   ```bash
   python backend/app.py
   ```
   *Server will start at http://localhost:5000*

4. **Start Attack Simulation**
   (Open a new terminal)
   ```bash
   python scripts/simulate_attacks.py
   ```

## How It Works
1. **Data**: The system uses flow-based features (Duration, Packet Count, etc.) to characterize traffic.
2. **Model**: A Random Forest model classifies traffic as BENIGN or ATTACK.
3. **Detection**: `app.py` receives flow data, predicts its nature, and broadcasts alerts via WebSockets.
4. **Visualization**: The frontend listens for alerts and updates the live map and statistics.
