
import React, { useRef, useState, useCallback } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { Box, Html, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Stage } from '../store';
import gsap from 'gsap';

// --- CUSTOM SHADER FOR CIRCUIT BOARD ---
const CircuitMaterial = shaderMaterial(
  { 
    uTime: 0, 
    uColor: new THREE.Color(0.2, 0.5, 1), // Base Dark Blue
    uActiveColor: new THREE.Color(0, 0.95, 1), // Neon Blue
    uActive: 0 
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uActiveColor;
    uniform float uActive;
    varying vec2 vUv;

    void main() {
        // Grid setup to match chip positions (approx 1 unit spacing)
        // Plane is 10x8. UV 0..1.
        // x coords: -3, 0, 3. Center is 0. 
        // To align, we need lines roughly at specific UVs.
        // Let's just make a dense grid, it looks cooler.
        
        vec2 grid = fract(vUv * vec2(10.0, 8.0)); 
        float width = 0.05;
        
        // Lines
        float lineX = step(1.0 - width, grid.x) + step(grid.x, width);
        float lineY = step(1.0 - width, grid.y) + step(grid.y, width);
        float lines = max(lineX, lineY);

        if (lines < 0.1) discard; // Transparent gaps

        // Electrical Flow Animation
        // Create pulses moving along the lines
        float speed = 2.0 + (uActive * 8.0); // Much faster when active
        
        // Combine X and Y flows
        float flowX = sin(vUv.x * 20.0 + uTime * speed);
        float flowY = sin(vUv.y * 20.0 + uTime * speed);
        
        // Pulse intensity
        float pulse = (flowX + flowY) * 0.5 + 0.5;
        pulse = pow(pulse, 4.0); // Sharpen the pulse

        // Mix colors based on activity
        // Base state: Dim, slow pulses
        // Active state: Bright, fast pulses, neon color
        
        float brightness = 0.2 + (pulse * 0.5); // Base brightness
        brightness += uActive * pulse * 2.0; // Boost when active

        vec3 finalColor = mix(uColor, uActiveColor, uActive * 0.8 + pulse * 0.2);
        
        // Apply brightness
        finalColor *= brightness;

        gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ CircuitMaterial });

// Add type definition for the new material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      circuitMaterial: any;
    }
  }
}

// --- AUDIO SYSTEM ---
const useAudioEffects = () => {
    const audioCtx = useRef<AudioContext | null>(null);

    const initAudio = useCallback(() => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.current.state === 'suspended') {
            audioCtx.current.resume().catch(() => {});
        }
    }, []);

    const playZap = useCallback(() => {
        initAudio();
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;
        const t = ctx.currentTime;

        // 1. Mechanical Snap (Sine Drop)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.start(t);
        osc.stop(t + 0.1);

        // 2. Electrical Spark (High-pass Noise)
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5; // Scale down amplitude
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);

    }, [initAudio]);

    const playPowerErupt = useCallback(() => {
        initAudio();
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;
        const t = ctx.currentTime;

        // 1. Power Ramping Up (Square Wave)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square'; // Buzzy/Tech feel
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Rev up engine
        osc.frequency.setValueAtTime(50, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 2.0); 

        // Fade in and out
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.5);
        gain.gain.linearRampToValueAtTime(0, t + 2.5);

        osc.start(t);
        osc.stop(t + 2.5);

        // 2. Energy Flow (Filtered Noise Sweep)
        const bufferSize = ctx.sampleRate * 2.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 5;
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.linearRampToValueAtTime(3000, t + 2.0); // Sweep up

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, t);
        noiseGain.gain.linearRampToValueAtTime(0.2, t + 0.5);
        noiseGain.gain.linearRampToValueAtTime(0, t + 2.5);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);

    }, [initAudio]);

    return { playZap, playPowerErupt };
};

const Chip: React.FC<{ 
    position: [number, number, number], 
    targetPos: [number, number, number],
    label: string,
    role: string,
    year: string,
    isPlaced: boolean,
    onPlace: () => void,
    playZap: () => void
}> = ({ position, targetPos, label, role, year, isPlaced, onPlace, playZap }) => {
    const ref = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);

    const handleClick = (e: any) => {
        e.stopPropagation();
        if (!isPlaced && ref.current) {
            playZap(); // SFX: Zap/Click
            gsap.to(ref.current.position, {
                x: targetPos[0],
                y: targetPos[1],
                z: targetPos[2],
                duration: 0.5,
                ease: "power2.out",
                onComplete: onPlace
            });
        }
    };

    return (
        <group ref={ref} position={isPlaced ? targetPos : position} onClick={handleClick}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }} 
            onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}>
            <Box args={[1.5, 0.2, 1]}>
                <meshStandardMaterial color={hovered && !isPlaced ? "#223344" : "#111"} />
            </Box>
            {/* Pins */}
            <Box args={[1.6, 0.1, 0.8]} position={[0, -0.1, 0]}>
                <meshStandardMaterial color="#gold" metalness={1} roughness={0.2} />
            </Box>
            
            {/* Label on Chip */}
            <Html position={[0, 0.2, 0]} transform scale={0.2} rotation={[-Math.PI/2, 0, 0]}>
                <div className={`text-[8px] font-bold font-orbitron text-center ${isPlaced ? 'text-neon-blue' : 'text-gray-500'} select-none`}>
                    {label}
                </div>
            </Html>

            {/* Hover Info */}
            {isPlaced && (
                <Html position={[0, 2, 0]} distanceFactor={10}>
                    <div className="glass-panel p-3 min-w-[150px] rounded-bl-none animate-[fadeIn_0.5s_ease-out]">
                         <h4 className="text-neon-blue font-bold text-xs">{role}</h4>
                         <p className="text-white text-[10px]">{year}</p>
                    </div>
                    <div className="w-0.5 h-8 bg-neon-blue mx-auto opacity-50"></div>
                </Html>
            )}
        </group>
    );
};

const StageExperience: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const { completeStage, completedStages } = useStore();
  const [chipsPlaced, setChipsPlaced] = useState(0);
  const { playZap, playPowerErupt } = useAudioEffects();
  const circuitMatRef = useRef<any>(null);

  const isCompleted = completedStages.includes(Stage.EXPERIENCE);

  useFrame((state, delta) => {
    if (circuitMatRef.current) {
        circuitMatRef.current.uTime += delta;
        // Smoothly ramp up activity when completed
        circuitMatRef.current.uActive = THREE.MathUtils.lerp(
            circuitMatRef.current.uActive, 
            isCompleted ? 1.0 : 0.0, 
            delta * 2
        );
    }
  });

  const handlePlace = () => {
      const newCount = chipsPlaced + 1;
      setChipsPlaced(newCount);
      if (newCount >= 3) {
          playPowerErupt(); // SFX: Eruption
          completeStage(Stage.EXPERIENCE);
      }
  };

  return (
    <group position={position} rotation={[Math.PI / 4, 0, 0]}>
      {/* Motherboard Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
          <planeGeometry args={[10, 8]} />
          <meshStandardMaterial color="#051020" roughness={0.5} metalness={0.8} />
      </mesh>
      
      {/* Animated Circuit Lines (Shader) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
          <planeGeometry args={[10, 8]} />
          {/* @ts-ignore */}
          <circuitMaterial ref={circuitMatRef} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Slots */}
      <Box args={[1.6, 0.1, 1.1]} position={[-3, 0, 0]}><meshBasicMaterial color="#222" /></Box>
      <Box args={[1.6, 0.1, 1.1]} position={[0, 0, 0]}><meshBasicMaterial color="#222" /></Box>
      <Box args={[1.6, 0.1, 1.1]} position={[3, 0, 0]}><meshBasicMaterial color="#222" /></Box>

      {/* Draggable Chips (Initially scattered) */}
      <Chip 
        position={[-3, 1, 3]} 
        targetPos={[-3, 0.2, 0]} 
        label="GOOGLE" 
        role="Junior Dev" 
        year="2022 - 2023"
        isPlaced={chipsPlaced > 0 || isCompleted} 
        onPlace={handlePlace}
        playZap={playZap}
      />
       <Chip 
        position={[0, 1, 4]} 
        targetPos={[0, 0.2, 0]} 
        label="MICROSOFT" 
        role="AI Engineer" 
        year="2023 - 2024"
        isPlaced={chipsPlaced > 1 || isCompleted}
        onPlace={handlePlace}
        playZap={playZap}
      />
       <Chip 
        position={[3, 1, 3]} 
        targetPos={[3, 0.2, 0]} 
        label="FREELANCE" 
        role="Full Stack" 
        year="2024 - Present"
        isPlaced={chipsPlaced > 2 || isCompleted}
        onPlace={handlePlace}
        playZap={playZap}
      />
    </group>
  );
};

export default StageExperience;
