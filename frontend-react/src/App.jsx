import React, { useEffect, useState, useRef, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { ScatterplotLayer, TextLayer, ArcLayer } from '@deck.gl/layers';
import { io } from 'socket.io-client';
import 'maplibre-gl/dist/maplibre-gl.css';

import { FlowArcLayer } from './layers/FlowArcLayer';
import { ATTACK_PROFILES, getProfile, INITIAL_VIEW_STATE } from './constants';

function App() {
    const [activeArcs, setActiveArcs] = useState([]);
    const [activeNodes, setActiveNodes] = useState([]);
    const [time, setTime] = useState(0);

    // Refs for muteable state to avoid re-renders on every event
    const arcsRef = useRef([]);
    const nodesRef = useRef([]);
    const arcIdCounter = useRef(0);
    const requestRef = useRef();

    useEffect(() => {
        // 1. Socket Connection
        const socket = io();

        socket.on('connect', () => console.log('✅ Connected to WebSocket'));

        socket.on('new_event', (data) => {
            const isAttack = data.prediction === 'ATTACK';
            const attackCategory = data.category || (isAttack ? 'Unknown' : 'BENIGN');
            const specificName = data.attack_type || 'Benign Traffic';
            const severity = data.severity || (isAttack ? 0.5 : 0);
            const arcId = arcIdCounter.current++;
            const duration = 4000 + severity * 2000;
            const now = Date.now();

            const newArc = {
                id: arcId,
                source: [data.src_lon, data.src_lat],
                target: [data.dst_lon, data.dst_lat],
                srcIP: data.src_ip || 'Unknown',
                dstIP: data.dst_ip || 'Target',
                isAttack,
                attackType: attackCategory,
                specificName,
                severity,
                timestamp: now,
                duration,
                srcColor: getProfile(attackCategory).srcColor,
                dstColor: getProfile(attackCategory).dstColor,
                flowId: arcId
            };

            const newSourceNode = {
                id: arcId + '_src',
                position: [data.src_lon, data.src_lat],
                isAttack: true,
                attackType: attackCategory,
                severity,
                nodeType: 'source',
                timestamp: now,
                duration
            };

            const newDestNode = {
                id: arcId + '_dst',
                position: [data.dst_lon, data.dst_lat],
                isAttack: true,
                attackType: attackCategory,
                severity,
                nodeType: 'dest',
                timestamp: now,
                duration
            };

            if (data.src_lon && data.dst_lon) {
                arcsRef.current.push(newArc);
                if (isAttack) {
                    nodesRef.current.push(newSourceNode);
                    nodesRef.current.push(newDestNode);
                }
            }
        });

        return () => socket.disconnect();
    }, []);

    const animate = () => {
        const now = Date.now();
        const globalTime = (now % 3600000) / 1000.0;
        setTime(globalTime);

        // Filter expired items
        arcsRef.current = arcsRef.current.filter(a => now - a.timestamp < a.duration);
        nodesRef.current = nodesRef.current.filter(n => now - n.timestamp < n.duration);

        // Filtered arrays for state update
        setActiveArcs([...arcsRef.current]);
        setActiveNodes([...nodesRef.current]);

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    const layers = [
        new ArcLayer({
            id: 'attack-glow',
            data: activeArcs.filter(a => a.isAttack),
            getSourcePosition: d => d.source,
            getTargetPosition: d => d.target,
            getSourceColor: d => [...getProfile(d.attackType).glowColor.slice(0, 3), 20],
            getTargetColor: d => [...getProfile(d.attackType).glowColor.slice(0, 3), 20],
            getWidth: 2,
            greatCircle: true,
            getHeight: d => 0.2 + d.severity * 0.4
        }),
        new FlowArcLayer({
            id: 'attack-flow',
            data: activeArcs,
            pickable: true,
            getSourcePosition: d => d.source,
            getTargetPosition: d => d.target,
            getSourceColor: d => d.srcColor,
            getTargetColor: d => d.dstColor,
            getWidth: d => d.isAttack ? 1.5 + d.severity * 1.5 : 1.0,
            greatCircle: true,
            getHeight: d => d.isAttack ? 0.2 + d.severity * 0.4 : 0.1,
            rTime: time,
            getFlowId: d => d.flowId
        }),
        new ScatterplotLayer({
            id: 'src-nodes',
            data: activeNodes.filter(n => n.nodeType === 'source'),
            getPosition: d => d.position,
            getFillColor: d => getProfile(d.attackType).srcColor,
            getRadius: d => {
                const age = (Date.now() - d.timestamp) / 2000;
                const pulse = 1 + 0.3 * Math.sin(age * Math.PI * 5);
                return (d.isAttack ? 30000 : 15000) * pulse;
            },
            radiusMinPixels: 3,
            radiusMaxPixels: 12,
            stroked: true,
            getLineColor: [255, 255, 255, 100],
            getLineWidth: 1,
            updateTriggers: {
                getRadius: [time]
            }
        }),
        new ScatterplotLayer({
            id: 'dst-nodes',
            data: activeNodes.filter(n => n.nodeType === 'dest'),
            getPosition: d => d.position,
            getFillColor: d => getProfile(d.attackType).pulseColor,
            getRadius: d => {
                const age = (Date.now() - d.timestamp) / 1000;
                const pulse = 1 + 0.5 * Math.sin(age * Math.PI * 4);
                return 40000 * pulse * (0.8 + d.severity * 0.4);
            },
            radiusMinPixels: 6,
            radiusMaxPixels: 20,
            stroked: true,
            getLineColor: d => [...getProfile(d.attackType).pulseColor, 180],
            getLineWidth: 2,
            updateTriggers: {
                getRadius: [time]
            }
        }),
        new TextLayer({
            id: 'attack-icons',
            data: activeNodes.filter(n => n.nodeType === 'dest' && n.isAttack),
            getPosition: d => d.position,
            getText: d => getProfile(d.attackType).icon,
            getSize: 16,
            getColor: [255, 255, 255, 220],
            backgroundColor: [0, 0, 0, 100],
            billboard: true,
            fontFamily: 'Inter',
            sizeScale: 1
        })
    ];

    return (
        <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={layers}
            getTooltip={({ object }) => {
                if (!object || !object.isAttack) return null;
                return {
                    html: `<div style="padding: 8px; color: white; background: rgba(0,0,0,0.8); border-radius: 4px;">
            <div><b>${object.specificName}</b></div>
            <div>${object.srcIP} → ${object.dstIP}</div>
            <div>Severity: ${object.severity}</div>
          </div>`
                };
            }}
        >
            <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" />
        </DeckGL>
    );
}

export default App;
