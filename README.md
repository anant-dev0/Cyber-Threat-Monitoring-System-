# 🛡️ Cyber Threat Monitoring & Intrusion Detection System

## 🌟 Overview
A sophisticated, real-time **Cyber Threat Monitoring and Intrusion Detection System (IDS)** designed for modern network security. This project leverages **Machine Learning** to classify network traffic and uses a **Dynamic Web Dashboard** to visualize global threat patterns as they happen.

---

## 🚀 Key Features

- **🧠 Intelligent Detection**: Powered by a **Random Forest Classifier** trained on high-fidelity network traffic data (CIC-IDS2017).
- **📊 Real-Time Visualization**: Interactive 3D world map showing attack origins and targets with smooth glow-arc animations.
- **⚡ High Performance**: Built with a reactive frontend and a robust Python backend for low-latency alerts.
- **🛡️ Threat Coverage**: Successfully identifies a variety of network attacks:
  - **DDoS** (Distributed Denial of Service)
  - **Port Scans**
  - **Botnets**
  - **Brute Force**
- **💻 Simulation Suite**: Includes scripts to generate synthetic traffic and simulate realistic attack scenarios for testing.

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Backend** | Python, Flask, Flask-SocketIO |
| **Machine Learning** | Scikit-learn, Pandas, NumPy |
| **Frontend** | React, Deck.gl, Mapbox (Custom Layers) |
| **Data Handling** | Git LFS (for large datasets) |

---

## 📂 Project Structure

```bash
cyber/
├── 📁 backend          # API server and core logic
├── 📁 data             # Network traffic datasets (LFS)
├── 📁 frontend         # Legacy dashboard implementation
├── 📁 frontend-react   # Modern React-based vizualization
├── 📁 models           # Serialized ML models (.pkl)
├── 📁 scripts          # Simulation and training utilities
├── 📄 requirements.txt # Python dependencies
└── 📄 project_banner.png
```

---

## 🔌 Quick Start

### 1. Environment Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/anant-dev0/Cyber-Threat-Monitoring-System-.git
cd Cyber-Threat-Monitoring-System-
pip install -r requirements.txt
```

### 2. Model Initialization (Optional)
If you wish to retrain the brain of the IDS:
```bash
# Generate synthetic dataset
python scripts/generate_data.py

# Train the Random Forest model
python scripts/train_model.py
```

### 3. Launch System
Start the monitoring server:
```bash
python backend/app.py
```
*The dashboard will be available at `http://localhost:5000`*

### 4. Run Attack Simulation
To see the system in action, run the simulation in a new terminal:
```bash
python scripts/simulate_attacks.py
```

---

## 📖 How It Works

1.  **Traffic Analysis**: The system extracts flow-based features (e.g., duration, packet counts, bytes per second) from raw network data.
2.  **Classification**: Each flow is processed by the Random Forest model to determine if it is `BENIGN` or an `ATTACK`.
3.  **Alerting**: Detections are instantly broadcasted via WebSockets to the connected frontend.
4.  **Visualization**: The dashboard renders these threats as dynamic arcs on a global map, providing immediate situational awareness.

---

---
✨ *Built as a comprehensive solution for network security and real-time data visualization.*
