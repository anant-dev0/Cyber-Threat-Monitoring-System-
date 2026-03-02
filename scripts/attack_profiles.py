import random

# Shared Attack Configuration
# Used by both generate_data.py (Training) and simulate_attacks.py (Live traffic)

ATTACK_CATEGORIES = {
    'Phishing Attack': {
        'names': [
            'Spear Phishing Email',
            'Credential Harvesting',
            'Social Engineering Link',
            'Whaling Attempt',
            'Fake OAuth Login'
        ],
        'severity_range': (0.5, 0.9),
        'dest_ports': [80, 443, 8080, 25, 587],
        'flow_duration_range': (500, 3000),
        'stats': {'fwd': (5, 50), 'bwd': (3, 30), 'std': (5, 20)}
    },
    'Suspicious Login': {
        'names': [
            'SSH Brute Force',
            'RDP Brute Force',
            'FTP Cracking Attempt',
            'SMB Relay Attack',
            'Telnet Dict Attack'
        ],
        'severity_range': (0.4, 0.85),
        'dest_ports': [22, 3389, 445, 21, 23],
        'flow_duration_range': (100, 1500),
        'stats': {'fwd': (10, 200), 'bwd': (1, 10), 'std': (1, 8)}
    },
    'Malware Injection': {
        'names': [
            'SQL Injection (SQLi)',
            'Ransomware: WannaCry',
            'Trojan: Emotet C2',
            'XSS Payload Injection',
            'DDoS UDP Flood',
            'Botnet Traffic'
        ],
        'severity_range': (0.7, 1.0),
        'dest_ports': [4444, 1433, 3306, 80, 53],
        'flow_duration_range': (50, 800),
        'stats': {'fwd': (100, 5000), 'bwd': (0, 5), 'std': (0, 3)}
    }
}

def get_random_profile(category_name):
    """Returns a randomized feature dictionary for a given category."""
    if category_name not in ATTACK_CATEGORIES:
        return None
        
    profile = ATTACK_CATEGORIES[category_name]
    
    return {
        'specific_name': random.choice(profile['names']),
        'severity': random.uniform(*profile['severity_range']),
        'dest_port': random.choice(profile['dest_ports']),
        'flow_duration': random.randint(*profile['flow_duration_range']),
        'fwd_pkts': random.randint(*profile['stats']['fwd']),
        'bwd_pkts': random.randint(*profile['stats']['bwd']),
        'pkt_std': random.uniform(*profile['stats']['std'])
    }
