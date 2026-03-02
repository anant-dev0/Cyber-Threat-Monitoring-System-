/* ═══════════════════════════════════════════════════════════════
   CYBER THREAT MONITORING SYSTEM — MAIN SCRIPT
   Socket.IO + MapLibre GL + Enhanced deck.gl Visualization
   ═══════════════════════════════════════════════════════════════ */

// ──────────────────────────────────────────
// 1. SOCKET.IO & STATE
// ──────────────────────────────────────────
const socket = io();
let totalPackets = 0;
let totalAttacks = 0;
let startTime = Date.now();
let logCount = 0;

const attackingIPs = {};
let activeArcs = [];
let activeNodes = [];
let arcIdCounter = 0;

socket.on('connect', () => console.log('✅ Connected to WebSocket Server'));
socket.on('disconnect', () => console.log('❌ Disconnected'));

// ──────────────────────────────────────────
// 2. ATTACK TYPE PROFILES
// ──────────────────────────────────────────
const ATTACK_PROFILES = {
    'Phishing Attack': {
        srcColor: [0, 255, 255],   // Cyan (Start)
        dstColor: [0, 100, 255],   // Deep Blue (End)
        glowColor: [0, 200, 255, 80],
        pulseColor: [0, 160, 255],
        icon: '✉',
        label: 'Phishing'
    },
    'Suspicious Login': {
        srcColor: [255, 255, 200], // Pale Yellow/White
        dstColor: [255, 140, 0],   // Orange
        glowColor: [255, 200, 0, 80],
        pulseColor: [255, 200, 0],
        icon: '⚠',
        label: 'Login Anomaly'
    },
    'Malware Injection': {
        srcColor: [255, 255, 0],   // Bright Yellow (Hot)
        dstColor: [255, 0, 0],     // Red (Cold tail)
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

function getProfile(type) {
    return ATTACK_PROFILES[type] || ATTACK_PROFILES['BENIGN'];
}

// ──────────────────────────────────────────
// 3. MAPLIBRE GL MAP
// ──────────────────────────────────────────
const mapgl = new maplibregl.Map({
    container: 'map-container',
    style: {
        version: 8,
        name: 'Dark SOC',
        sources: {
            'carto-dark': {
                type: 'raster',
                tiles: [
                    'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                    'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                    'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
                ],
                tileSize: 256,
                attribution: '&copy; OSM &copy; CARTO'
            }
        },
        layers: [{
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 18
        }]
    },
    center: [20, 15],
    zoom: 1.5,
    minZoom: 1,
    maxZoom: 8,
    attributionControl: false
});

mapgl.addControl(new maplibregl.NavigationControl(), 'top-right');
mapgl.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

// ──────────────────────────────────────────
// 4. CUSTOM FLOW LAYER
// ──────────────────────────────────────────
class FlowArcLayer extends deck.ArcLayer {
    getShaders() {
        const shaders = super.getShaders();
        shaders.inject = {
            'vs:#decl': `
                attribute float instanceFlowId;
                varying float vFlowId;
                varying float vRatio;
            `,
            'vs:#main-end': `
                vFlowId = instanceFlowId;
                vRatio = segmentRatio;
            `,
            'fs:#decl': `
                uniform float rTime;
                varying float vFlowId;
                varying float vRatio;
            `,
            'fs:#main-end': `
                // Random offset based on ID to unsync arcs
                float offset = fract(sin(vFlowId) * 43758.5453);
                
                // Flow progress (looping 0..1)
                float speed = 0.6; // Slower, more elegant speed
                float progress = fract(rTime * speed + offset);
                
                // Trail calculation
                float dist = progress - vRatio;
                if (dist < 0.0) dist += 1.0;

                // Particle Head Configuration
                float headLen = 0.02; // Short, distinct bullet
                float trailLen = 0.5; // Long tail
                
                float alphaMod = 0.0;
                vec3 glow = vec3(0.0);

                if (dist < headLen) {
                    // PARTICLE HEAD: Intense and distinct
                    alphaMod = 1.0;
                    glow = vec3(1.0, 1.0, 1.0); // Pure white core
                } 
                else if (dist < trailLen) {
                    // TRAIL: Exponential fade from color
                    float t = (dist - headLen) / (trailLen - headLen);
                    alphaMod = 0.8 * exp(-3.0 * t); 
                }
                else {
                    // Dim background path
                    alphaMod = 0.05; 
                }
                
                gl_FragColor.rgb += glow;
                gl_FragColor.a *= alphaMod;
            `
        };
        return shaders;
    }
    // ... initializeState ...
    initializeState() {
        super.initializeState();
        this.getAttributeManager().add({
            instanceFlowId: { size: 1, accessor: 'getFlowId' }
        });
    }

    draw(opts) {
        this.state.model.setUniforms({ rTime: this.props.rTime });
        super.draw(opts);
    }
}

// ──────────────────────────────────────────
// 5. DECK.GL SETUP
// ──────────────────────────────────────────
const deckOverlay = new deck.MapboxOverlay({
    interleaved: false,
    layers: [],
    getTooltip: ({ object }) => {
        if (!object || !object.isAttack) return null;
        const profile = getProfile(object.attackType);
        return {
            html: `
                <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">
                        <span style="font-size: 1.2em;">${profile.icon}</span>
                        <strong style="color: #fff; font-size: 0.95rem;">${object.specificName}</strong>
                    </div>
                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px; font-size: 0.85rem; color: #ccc;">
                        <span>Source:</span> <span style="color: #fff; text-align: right;">${object.srcIP || 'Unknown'}</span>
                        <span>Target:</span> <span style="color: #fff; text-align: right;">${object.dstIP || 'Unknown'}</span>
                        <span>Threat:</span> <span style="color: ${'rgba(' + profile.srcColor.join(',') + ',1)'}; text-align: right; font-weight: bold;">${Math.round(object.severity * 100)}/100</span>
                    </div>
                </div>
            `,
            style: {
                backgroundColor: 'rgba(5, 10, 20, 0.95)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }
        };
    }
});
mapgl.addControl(deckOverlay);

let globalTime = 0;

function updateDeckLayers() {
    const now = Date.now();
    globalTime = (now % 3600000) / 1000.0;

    // ── GLOW LAYER (Subtle ambient path) ──
    const glowLayer = new deck.ArcLayer({
        id: 'attack-glow',
        data: activeArcs.filter(a => a.isAttack),
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: d => {
            const p = getProfile(d.attackType);
            return [...p.glowColor.slice(0, 3), 20]; // Very faint
        },
        getTargetColor: d => {
            const p = getProfile(d.attackType);
            return [...p.glowColor.slice(0, 3), 20];
        },
        getWidth: 2, // Constant thin width
        greatCircle: true,
        numSegments: 60,
        getHeight: d => 0.2 + d.severity * 0.4
    });

    // ── MAIN FLOW ARC LAYER ──
    const arcLayer = new FlowArcLayer({
        id: 'attack-flow',
        data: activeArcs,
        pickable: true, // Enable hover
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: d => getProfile(d.attackType).srcColor,
        getTargetColor: d => getProfile(d.attackType).dstColor,
        // Thinner, sharper lines for professional look
        getWidth: d => d.isAttack ? 1.5 + d.severity * 1.5 : 1.0,
        greatCircle: true,
        numSegments: 80, // Smoother curves
        getHeight: d => d.isAttack ? 0.2 + d.severity * 0.4 : 0.1,
        // Custom props
        rTime: globalTime,
        getFlowId: d => d.id,
        updateTriggers: {
            getSourceColor: [now],
            getFlowId: [now]
        }
    });

    // ── SOURCE NODES ──
    const srcNodeLayer = new deck.ScatterplotLayer({
        id: 'src-nodes',
        data: activeNodes.filter(n => n.nodeType === 'source'),
        getPosition: d => d.position,
        getFillColor: d => getProfile(d.attackType).srcColor,
        getRadius: d => {
            const age = (now - d.timestamp) / 2000;
            const pulse = 1 + 0.3 * Math.sin(age * Math.PI * 5); // Simple pulse
            return (d.isAttack ? 30000 : 15000) * pulse;
        },
        radiusMinPixels: 3,
        radiusMaxPixels: 12,
        stroked: true,
        getLineColor: [255, 255, 255, 100],
        getLineWidth: 1,
        updateTriggers: {
            getRadius: [now]
        }
    });

    // ── DESTINATION NODES (Target) ──
    const dstNodeLayer = new deck.ScatterplotLayer({
        id: 'dst-nodes',
        data: activeNodes.filter(n => n.nodeType === 'dest' && n.isAttack),
        getPosition: d => d.position,
        getFillColor: d => getProfile(d.attackType).pulseColor,
        getRadius: d => {
            // Arrival pulse logic could be synced with flow, but using age is smoother for now
            const age = (now - d.timestamp) / 1000;
            const pulse = 1 + 0.5 * Math.sin(age * Math.PI * 4);
            return 40000 * pulse * (0.8 + d.severity * 0.4);
        },
        radiusMinPixels: 6,
        radiusMaxPixels: 20,
        stroked: true,
        getLineColor: d => [...getProfile(d.attackType).pulseColor, 180],
        getLineWidth: 2,
        updateTriggers: {
            getRadius: [now]
        }
    });

    // ── EXPANDING RINGS ──
    const ringLayer = new deck.ScatterplotLayer({
        id: 'dst-rings',
        data: activeNodes.filter(n => n.nodeType === 'dest' && n.isAttack),
        getPosition: d => d.position,
        filled: false,
        stroked: true,
        getLineColor: d => [...getProfile(d.attackType).pulseColor, 120],
        getRadius: d => {
            const age = (now - d.timestamp) / 1500;
            const phase = age % 1;
            return 20000 + phase * 100000;
        },
        getLineWidth: 2,
        radiusMinPixels: 5,
        radiusMaxPixels: 35,
        updateTriggers: {
            getRadius: [now]
        }
    });

    // ── ICON LAYER ──
    const iconLayer = new deck.TextLayer({
        id: 'attack-icons',
        data: activeNodes.filter(n => n.nodeType === 'dest' && n.isAttack),
        getPosition: d => d.position,
        getText: d => getProfile(d.attackType).icon,
        getSize: 16,
        getColor: [255, 255, 255, 220],
        backgroundColor: [0, 0, 0, 100], // Background to make icon pop
        billboard: true,
        fontFamily: 'Inter',
        sizeScale: 1
    });

    deckOverlay.setProps({
        layers: [glowLayer, arcLayer, srcNodeLayer, ringLayer, dstNodeLayer, iconLayer]
    });
}

let animationFrame;
function animate() {
    updateDeckLayers();
    animationFrame = requestAnimationFrame(animate);
}
animate();

setInterval(() => {
    const now = Date.now();
    activeArcs = activeArcs.filter(a => now - a.timestamp < a.duration);
    activeNodes = activeNodes.filter(n => now - n.timestamp < n.duration);
}, 500);

// ──────────────────────────────────────────
// 6. EVENT HANDLERS
// ──────────────────────────────────────────
socket.on('new_event', (data) => {
    totalPackets++;
    const isAttack = data.prediction === 'ATTACK';
    // Use category for visual profile (Color/Icon), specific name for Label
    const attackCategory = data.category || (isAttack ? 'Unknown' : 'BENIGN');
    const specificName = data.attack_type || 'Benign Traffic';

    const severity = data.severity || (isAttack ? 0.5 : 0);
    const arcId = arcIdCounter++;

    if (isAttack) {
        totalAttacks++;
        const srcIP = data.src_ip || 'Unknown';
        if (!attackingIPs[srcIP]) {
            attackingIPs[srcIP] = { count: 0, country: data.src_country || 'Unknown', type: attackCategory };
        }
        attackingIPs[srcIP].count++;

        const duration = 4000 + severity * 2000;

        activeArcs.push({
            id: arcId,
            source: [data.src_lon, data.src_lat],
            target: [data.dst_lon, data.dst_lat],
            srcIP: srcIP, // Store IPs for tooltip
            dstIP: data.dst_ip || 'Target',
            isAttack: true,
            attackType: attackCategory, // Use category for color/style lookup
            specificName: specificName,
            severity: severity,
            timestamp: Date.now(),
            duration: duration
        });

        activeNodes.push({
            id: arcId + '_src',
            position: [data.src_lon, data.src_lat],
            isAttack: true, attackType: attackCategory, severity, nodeType: 'source',
            timestamp: Date.now(), duration
        });

        activeNodes.push({
            id: arcId + '_dst',
            position: [data.dst_lon, data.dst_lat],
            isAttack: true, attackType: attackCategory, severity, nodeType: 'dest',
            timestamp: Date.now(), duration
        });

        addLog(data, 'attack');
    } else {
        // Benign
        activeArcs.push({
            id: arcId,
            source: [data.src_lon, data.src_lat],
            target: [data.dst_lon, data.dst_lat],
            isAttack: false,
            attackType: 'BENIGN',
            severity: 0,
            timestamp: Date.now(),
            duration: 2000
        });

        addLog(data, 'benign');
    }

    document.getElementById('total-attacks').innerText = totalPackets;
    document.getElementById('last-target').innerText = data.dst_country || 'N/A';
    updateAttacksPerMin();
    updateTopIPs();
});

function addLog(data, type) {
    const logList = document.getElementById('log-list');
    const placeholder = logList.querySelector('.log-placeholder');
    if (placeholder) placeholder.remove();

    logCount++;
    document.getElementById('log-count').innerText = `${logCount} events`;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();

    // Visual profile from category, Text from specific name
    const category = data.category || 'BENIGN';
    const profile = getProfile(category);
    const label = data.attack_type || 'Benign';

    entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-icon" style="color: rgba(${profile.pulseColor}, 1)">${profile.icon}</span>
        <span class="log-type">${label}</span>
        <span class="log-route">${data.src_country} → ${data.dst_country}</span>
    `;
    logList.prepend(entry);

    while (logList.children.length > 30) logList.removeChild(logList.lastChild);
}

function updateAttacksPerMin() {
    const elapsedMin = (Date.now() - startTime) / 60000;
    const rate = elapsedMin > 0 ? Math.round(totalAttacks / elapsedMin) : 0;
    document.getElementById('attacks-per-min').innerText = rate;
}

function updateTopIPs() {
    const sorted = Object.entries(attackingIPs).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
    const tbody = document.getElementById('top-ips-body');
    tbody.innerHTML = '';
    sorted.forEach(([ip, info], idx) => {
        let threatClass = info.count > 10 ? 'threat-critical' : (info.count > 5 ? 'threat-high' : 'threat-medium');
        let threatLabel = info.count > 10 ? 'Critical' : (info.count > 5 ? 'High' : 'Medium');
        const profile = getProfile(info.type);
        tbody.innerHTML += `<tr><td>${idx + 1}</td><td>${ip}</td><td>${info.country}</td><td>${info.count}</td>
        <td><span class="threat-badge ${threatClass}">${profile.icon} ${threatLabel}</span></td></tr>`;
    });
}

function bindSlider(id, displayId, div = 1) {
    const s = document.getElementById(id);
    const d = document.getElementById(displayId);
    if (s && d) s.addEventListener('input', () => d.textContent = (s.value / div).toFixed(div > 1 ? 2 : 0));
}
bindSlider('speed-slider', 'speed-val');
bindSlider('alpha-slider', 'alpha-val', 100);
bindSlider('beta-slider', 'beta-val', 100);
bindSlider('thresh-slider', 'thresh-val', 100);

// Init Charts (Simplified to save space, assuming they are working from previous step, but I'll leave them in if this is a full rewrite)
// ... Keeping Chart.js logs ...
// ──────────────────────────────────────────
// 7. CHART INITIALIZATION & UPDATES
// ──────────────────────────────────────────
let confusionChart, rocChart, prChart, featChart;

function initCharts() {
    Chart.defaults.color = '#7a8599';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';

    const ctxConf = document.getElementById('chart-confusion');
    if (ctxConf) {
        confusionChart = new Chart(ctxConf, {
            type: 'bar',
            data: {
                labels: ['TP', 'TN', 'FP', 'FN'],
                datasets: [{
                    data: [0, 0, 0, 0], // Initial empty state
                    backgroundColor: ['#00ff88', '#00b4ff', '#ff9500', '#ff3b5c']
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.03)' } } }
            }
        });
    }

    // Other charts remain static for now as they require complex history
    const ctxRoc = document.getElementById('chart-roc');
    if (ctxRoc) {
        rocChart = new Chart(ctxRoc, {
            type: 'line',
            data: {
                labels: [0, 0.5, 1],
                datasets: [{
                    label: 'ROC',
                    data: [0, 0.9, 1],
                    borderColor: '#00e5ff',
                    fill: true,
                    backgroundColor: 'rgba(0,229,255,0.1)'
                }]
            },
            options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }

    const ctxPr = document.getElementById('chart-pr');
    if (ctxPr) {
        prChart = new Chart(ctxPr, {
            type: 'line',
            data: {
                labels: [0, 0.5, 1],
                datasets: [{
                    label: 'PR',
                    data: [1, 0.9, 0.5],
                    borderColor: '#a855f7',
                    fill: true,
                    backgroundColor: 'rgba(168,85,247,0.1)'
                }]
            },
            options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }

    const ctxFeat = document.getElementById('chart-features');
    if (ctxFeat) {
        featChart = new Chart(ctxFeat, {
            type: 'bar',
            data: {
                labels: ['Fwd', 'Dur', 'IAT', 'Bwd'],
                datasets: [{
                    data: [0.3, 0.25, 0.2, 0.1],
                    backgroundColor: ['#00b4ff', '#00ff88', '#a855f7', '#ff9500']
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { position: 'left' } }
            }
        });
    }
}

// Initialize Charts
initCharts();

// Handle Real-time Stats Updates
socket.on('stats_update', (stats) => {
    // Update Metric Cards
    if (document.getElementById('metric-accuracy')) document.getElementById('metric-accuracy').innerText = stats.accuracy + '%';
    if (document.getElementById('metric-precision')) document.getElementById('metric-precision').innerText = stats.precision + '%';
    if (document.getElementById('metric-recall')) document.getElementById('metric-recall').innerText = stats.recall + '%';
    if (document.getElementById('metric-f1')) document.getElementById('metric-f1').innerText = stats.f1 + '%';

    // Update Confusion Matrix Chart
    if (confusionChart) {
        confusionChart.data.datasets[0].data = [stats.tp, stats.tn, stats.fp, stats.fn];
        confusionChart.update('none'); // 'none' mode for smooth animation
    }
});

console.log('🛡️ Cyber Threat Monitor — Directional Flow Layer Active');
