import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import os
import sys

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from classifier import Classifier
from utils.geoip import GeoIP

# Fix static folder path resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="", template_folder=FRONTEND_DIR)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Load Resources
classifier = Classifier()
geoip = GeoIP()

# Global Stats
stats = {
    'tp': 0, # True Positive (Attack correctly identified)
    'tn': 0, # True Negative (Benign correctly identified)
    'fp': 0, # False Positive (Benign marked as Attack)
    'fn': 0  # False Negative (Attack marked as Benign)
}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def test_connect():
    print('Client connected')

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

# Endpoint to receive simulated traffic
@app.route('/api/simulate', methods=['POST'])
def receive_simulation():
    data = request.json
    
    # Predict
    prediction = classifier.predict(data)
    
    # --- Real-time Stats Calculation ---
    global stats
    ground_truth = "ATTACK" if data.get('Category', 'benign').lower() != 'benign' else "BENIGN"
    pred_label = prediction

    if ground_truth == "ATTACK" and pred_label == "ATTACK":
        stats['tp'] += 1
    elif ground_truth == "BENIGN" and pred_label == "BENIGN":
        stats['tn'] += 1
    elif ground_truth == "BENIGN" and pred_label == "ATTACK":
        stats['fp'] += 1
    elif ground_truth == "ATTACK" and pred_label == "BENIGN":
        stats['fn'] += 1

    # Avoid division by zero
    total = stats['tp'] + stats['tn'] + stats['fp'] + stats['fn']
    accuracy = (stats['tp'] + stats['tn']) / total if total > 0 else 0
    precision = stats['tp'] / (stats['tp'] + stats['fp']) if (stats['tp'] + stats['fp']) > 0 else 0
    recall = stats['tp'] / (stats['tp'] + stats['fn']) if (stats['tp'] + stats['fn']) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    # Enrich with GeoIP
    src_geo = geoip.get_country(data.get('Source IP'))
    dst_geo = geoip.get_country(data.get('Destination IP'))
    
    event_data = {
        'src_ip': data.get('Source IP'),
        'dst_ip': data.get('Destination IP'),
        'src_country': src_geo['country_name'],
        'src_lat': src_geo['location']['lat'],
        'src_lon': src_geo['location']['lon'],
        'dst_country': dst_geo['country_name'],
        'dst_lat': dst_geo['location']['lat'],
        'dst_lon': dst_geo['location']['lon'],
        'prediction': prediction,
        'attack_type': data.get('Label', 'Unknown'),
        'category': data.get('Category', 'Unknown'),
        'severity': data.get('Severity', 0),
        'timestamp': data.get('Timestamp')
    }
    
    # Broadcast to all connected clients
    socketio.emit('new_event', event_data)
    
    # Broadcast Stats Update
    socketio.emit('stats_update', {
        'tp': stats['tp'],
        'tn': stats['tn'],
        'fp': stats['fp'],
        'fn': stats['fn'],
        'accuracy': round(accuracy * 100, 1),
        'precision': round(precision * 100, 1),
        'recall': round(recall * 100, 1),
        'f1': round(f1 * 100, 1)
    })
    
    return jsonify({'status': 'success', 'prediction': prediction})

if __name__ == '__main__':
    print("Starting Cyber Threat Monitor Backend...")
    # use_reloader=False prevents watchdog crash on Windows with eventlet
    socketio.run(app, debug=True, use_reloader=False, host='0.0.0.0', port=5000)
