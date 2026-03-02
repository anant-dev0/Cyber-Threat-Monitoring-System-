import { ArcLayer } from '@deck.gl/layers';

export class FlowArcLayer extends ArcLayer {
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
        float offset = fract(sin(vFlowId) * 43758.5453);
        float speed = 0.6;
        float progress = fract(rTime * speed + offset);
        
        float dist = progress - vRatio;
        if (dist < 0.0) dist += 1.0;

        float headLen = 0.02;
        float trailLen = 0.5;
        
        float alphaMod = 0.0;
        vec3 glow = vec3(0.0);

        if (dist < headLen) {
            alphaMod = 1.0;
            glow = vec3(1.0, 1.0, 1.0);
        } 
        else if (dist < trailLen) {
            float t = (dist - headLen) / (trailLen - headLen);
            alphaMod = 0.8 * exp(-3.0 * t); 
        }
        else {
            alphaMod = 0.05; 
        }
        
        gl_FragColor.rgb += glow;
        gl_FragColor.a *= alphaMod;
      `
        };
        return shaders;
    }

    initializeState() {
        super.initializeState();
        this.getAttributeManager().add({
            instanceFlowId: {
                size: 1,
                accessor: 'getFlowId'
            }
        });
    }

    draw(opts) {
        this.state.model.setUniforms({ rTime: this.props.rTime });
        super.draw(opts);
    }
}

FlowArcLayer.layerName = 'FlowArcLayer';
FlowArcLayer.defaultProps = {
    rTime: { type: 'number', value: 0, min: 0 },
    getFlowId: { type: 'accessor', value: d => d.id }
};
