import requests
import time
import random
import sys
import os

# Add current directory to path to import attack_profiles
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from attack_profiles import ATTACK_CATEGORIES, get_random_profile

# Configuration
API_URL = "http://127.0.0.1:5000/api/simulate"

def generate_random_traffic():
    """Generates a random flow packet with specific attack classification."""
    
    # 40% benign, 60% attacks (slightly more attacks for demo purposes)
    roll = random.random()
    if roll < 0.40:
        chosen_cat = 'BENIGN'
        specific_label = 'Benign Traffic'
        severity = 0.0
        dest_port = random.randint(80, 443)
        flow_duration = random.randint(100, 5000)
        fwd_pkts = random.randint(1, 20)
        bwd_pkts = random.randint(1, 20)
        pkt_std = random.uniform(0, 10)
    else:
        chosen_cat = random.choice(list(ATTACK_CATEGORIES.keys()))
        
        # Get randomized features from shared profile
        features = get_random_profile(chosen_cat)
        
        specific_label = features['specific_name']
        severity = features['severity']
        dest_port = features['dest_port']
        flow_duration = features['flow_duration']
        fwd_pkts = features['fwd_pkts']
        bwd_pkts = features['bwd_pkts']
        pkt_std = features['pkt_std']

    # IPs
    src_ip = ".".join(map(str, (random.randint(1, 255) for _ in range(4))))
    dst_ip = ".".join(map(str, (random.randint(1, 255) for _ in range(4))))

    payload = {
        'Destination Port': dest_port,
        'Flow Duration': flow_duration,
        'Total Fwd Packets': fwd_pkts,
        'Total Bwd Packets': bwd_pkts,
        'Packet Length Std': pkt_std,
        'Label': specific_label,       # Send the specific name (e.g. "SSH Brute Force")
        'Category': chosen_cat,        # Send category for easier frontend mapping
        'Source IP': src_ip,
        'Destination IP': dst_ip,
        'Timestamp': time.time(),
        'Severity': round(severity, 2)
    }

    return payload

def start_simulation():
    print(f"Starting traffic simulation to {API_URL}...")
    print("Press Ctrl+C to stop.")

    sent_count = 0
    error_count = 0

    while True:
        try:
            traffic_data = generate_random_traffic()
            # Send to backend
            response = requests.post(API_URL, json=traffic_data, timeout=5)
            sent_count += 1

            if sent_count % 10 == 0:
                label = traffic_data['Label']
                sev = traffic_data.get('Severity', 0)
                print(f"[OK] Sent {sent_count} | {label} (sev={sev:.2f}) -> {response.status_code}")

        except requests.exceptions.ConnectionError:
            error_count += 1
            print(f"[WARN] Connection failed ({error_count}). Is the backend running?")
            time.sleep(3)
            if error_count > 20: 
                print("[ERROR] Max retries reached.")
                break
        except requests.exceptions.Timeout:
            print("[WARN] Timeout. Retrying...")
            time.sleep(2)
        except KeyboardInterrupt:
            print("\nStopped.")
            break
        except Exception as e:
            print(f"[ERROR] {e}")
            time.sleep(2)
            
        time.sleep(random.uniform(0.3, 1.2))

if __name__ == "__main__":
    start_simulation()

