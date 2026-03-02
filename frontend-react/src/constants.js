export const ATTACK_PROFILES = {
    'Phishing Attack': {
        srcColor: [0, 255, 255],
        dstColor: [0, 100, 255],
        glowColor: [0, 200, 255, 80],
        pulseColor: [0, 160, 255],
        icon: '✉',
        label: 'Phishing'
    },
    'Suspicious Login': {
        srcColor: [255, 255, 200],
        dstColor: [255, 140, 0],
        glowColor: [255, 200, 0, 80],
        pulseColor: [255, 200, 0],
        icon: '⚠',
        label: 'Login Anomaly'
    },
    'Malware Injection': {
        srcColor: [255, 255, 0],
        dstColor: [255, 0, 0],
        glowColor: [255, 50, 0, 80],
        pulseColor: [255, 0, 0],
        icon: '🐛',
        label: 'Malware'
    },
    'BENIGN': {
        srcColor: [100, 255, 100],
        dstColor: [0, 100, 0],
        glowColor: [0, 255, 136, 40],
        pulseColor: [0, 255, 136],
        icon: '✓',
        label: 'Benign'
    }
};

export function getProfile(type) {
    return ATTACK_PROFILES[type] || ATTACK_PROFILES['BENIGN'];
}

export const INITIAL_VIEW_STATE = {
    longitude: 20,
    latitude: 15,
    zoom: 1.5,
    pitch: 0,
    bearing: 0
};
