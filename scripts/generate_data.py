import pandas as pd
import numpy as np
import random
import sys
import os

# Add current directory to path to import attack_profiles
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from attack_profiles import ATTACK_CATEGORIES, get_random_profile

def generate_synthetic_data(num_samples=10000):
    """Generates a synthetic network flow dataset for training the IDS model."""
    
    print("Generating synthetic data based on Attack Profiles...")
    data = []
    
    # Attack types available in our shared config
    attack_types = list(ATTACK_CATEGORIES.keys())
    
    for _ in range(num_samples):
        # 40% Benign, 60% Attack (Balanced enough for training)
        is_attack = random.random() > 0.4
        
        if not is_attack:
            label = 'BENIGN'
            category = 'BENIGN'
            
            # Benign Profile
            dest_port = np.random.randint(80, 443+1)
            flow_duration = np.random.randint(100, 5000)
            total_fwd_packets = np.random.randint(1, 20)
            total_bwd_packets = np.random.randint(1, 20)
            pkt_len_std = np.random.uniform(0, 10)
        else:
            # Pick a random attack category
            category = random.choice(attack_types)
            
            # Get features from shared profile
            features = get_random_profile(category)
            
            label = features['specific_name'] # Specific label (e.g. 'SSH Brute Force')
            # For ML training purposes, we might want the broad category or specific label.
            # detailed_label = features['specific_name'] 
            
            dest_port = features['dest_port']
            flow_duration = features['flow_duration']
            total_fwd_packets = features['fwd_pkts']
            total_bwd_packets = features['bwd_pkts']
            pkt_len_std = features['pkt_std']

        # Source IP and Dest IP (Mocking for visualization, not used in ML training)
        src_ip = ".".join(map(str, (random.randint(0, 255) for _ in range(4))))
        dst_ip = ".".join(map(str, (random.randint(0, 255) for _ in range(4))))
        
        # Construct row
        row = {
            'Destination Port': dest_port,
            'Flow Duration': flow_duration,
            'Total Fwd Packets': total_fwd_packets,
            'Total Bwd Packets': total_bwd_packets,
            'Packet Length Std': pkt_len_std,
            'Label': category, # Train on Category (Phishing, Malware, Suspicious) or 'BENIGN'
            'DetailedLabel': label,
            'Source IP': src_ip, 
            'Destination IP': dst_ip
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # Save to CSV
    output_path = 'e:/cyber/data/synthetic_ids_2017.csv'
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    df.to_csv(output_path, index=False)
    print(f"Synthetic dataset saved to {output_path} with {len(df)} samples.")
    print("Class Distribution:")
    print(df['Label'].value_counts())

if __name__ == "__main__":
    generate_synthetic_data()

