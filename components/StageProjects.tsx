
import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Stage } from '../store';

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

    const playHyperjump = useCallback(() => {
        initAudio();
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;
        const t = ctx.currentTime;

        // 1. IGNITION BURST (NEW LAYER)
        const burstLen = 0.4;
        const burstBuffer = ctx.createBuffer(1, ctx.sampleRate * burstLen, ctx.sampleRate);
        const burstData = burstBuffer.getChannelData(0);
        for (let i = 0; i < burstBuffer.length; i++) burstData[i] = Math.random() * 2 - 1;
        
        const burstSrc = ctx.createBufferSource();
        burstSrc.buffer = burstBuffer;
        
        const burstFilter = ctx.createBiquadFilter();
        burstFilter.type = 'lowpass';
        burstFilter.frequency.setValueAtTime(3000, t);
        burstFilter.frequency.exponentialRampToValueAtTime(100, t + 0.2); 
        
        const burstGain = ctx.createGain();
        burstGain.gain.setValueAtTime(1.0, t); // High impact volume
        burstGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        burstSrc.connect(burstFilter);
        burstFilter.connect(burstGain);
        burstGain.connect(ctx.destination);
        burstSrc.start(t);

        // 2. Rocket Thrust (Filtered Noise)
        const bufferSize = ctx.sampleRate * 2.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.Q.value = 1;
        noiseFilter.frequency.setValueAtTime(100, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(5000, t + 1.5); // Whoosh up

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, t);
        noiseGain.gain.linearRampToValueAtTime(0.5, t + 0.1); // Explosive start
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 2.0); // Tail off

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);

        // 3. Warp Drive Acceleration (Oscillator Sweep)
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(2000, t + 1.8); // Pitch Zoom

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, t);
        oscGain.gain.linearRampToValueAtTime(0.15, t + 0.5);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

        const delay = ctx.createDelay();
        delay.delayTime.value = 0.1;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.3;

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        oscGain.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 2.0);

    }, [initAudio]);

    return { playHyperjump };
};

const Planet: React.FC<{ 
    radius: number, 
    speed: number, 
    color: string, 
    label: string, 
    desc: string, 
    orbitRadius: number, 
    isActive: boolean, 
    link: string,
    onClick: (link: string) => void
}> = ({ radius, speed, color, label, desc, orbitRadius, isActive, link, onClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const angleRef = useRef(Math.random() * Math.PI * 2);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Orbit logic
        angleRef.current += delta * speed;
        const x = Math.cos(angleRef.current) * orbitRadius;
        const z = Math.sin(angleRef.current) * orbitRadius;
        
        meshRef.current.position.set(x, 0, z);

        // Orbit Ring Pulse Logic
        if (ringMatRef.current) {
            if (isActive) {
                const t = state.clock.elapsedTime;
                const pulse = 0.5 + Math.sin(t * 3) * 0.3;
                ringMatRef.current.color.set(color);
                ringMatRef.current.opacity = pulse;
                ringMatRef.current.toneMapped = false;
            } else {
                ringMatRef.current.color.set("#333");
                ringMatRef.current.opacity = 0.3;
                ringMatRef.current.toneMapped = true;
            }
        }
    });

    return (
        <group>
            {/* Orbit Path */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[orbitRadius - 0.05, orbitRadius + 0.05, 64]} />
                <meshBasicMaterial ref={ringMatRef} color="#333" side={THREE.DoubleSide} transparent opacity={0.3} />
            </mesh>
            
            <Sphere 
                ref={meshRef} 
                args={[radius, 16, 16]}
                onClick={(e) => {
                    if (isActive) {
                        e.stopPropagation();
                        onClick(link);
                    }
                }}
                onPointerOver={(e) => {
                    if (isActive) {
                        e.stopPropagation();
                        document.body.style.cursor = 'pointer';
                    }
                }}
                onPointerOut={(e) => {
                    if (isActive) document.body.style.cursor = 'auto';
                }}
            >
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                {isActive && (
                    <Html distanceFactor={15} position={[0, 1.5, 0]}>
                        <div 
                            className="glass-panel p-4 rounded-lg w-48 transform -translate-x-1/2 cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_#00f3ff] group border-l-4 border-l-neon-blue"
                            onClick={(e) => { e.stopPropagation(); window.open(link, '_blank'); }}
                        >
                            <h3 className="text-neon-blue font-bold font-orbitron text-sm group-hover:text-white transition-colors">{label}</h3>
                            <p className="text-gray-300 text-xs mt-1 font-rajdhani leading-tight">{desc}</p>
                            <div className="mt-2 flex items-center justify-between border-t border-gray-700 pt-1">
                                <span className="text-[9px] text-neon-blue font-bold tracking-wider">VIEW SOURCE</span>
                                <span className="text-neon-blue text-xs transform group-hover:translate-x-1 transition-transform">»</span>
                            </div>
                        </div>
                    </Html>
                )}
            </Sphere>
        </group>
    );
};

const StageProjects: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const { completeStage, completedStages, nextStage } = useStore();
  const [clicked, setClicked] = useState(false);
  const isCompleted = completedStages.includes(Stage.PROJECTS);
  
  // Audio
  const { playHyperjump } = useAudioEffects();

  // Interaction Refs
  const systemRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const dragThreshold = useRef(0);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
    dragThreshold.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current || !systemRef.current) return;
    e.stopPropagation();
    
    const deltaX = e.clientX - previousMouse.current.x;
    const deltaY = e.clientY - previousMouse.current.y;
    
    dragThreshold.current += Math.abs(deltaX) + Math.abs(deltaY);

    // Rotate system based on drag
    systemRef.current.rotation.y += deltaX * 0.005;
    systemRef.current.rotation.x += deltaY * 0.005;

    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleSunClick = (e: any) => {
      e.stopPropagation();
      // Only treat as click if we haven't dragged much
      if (dragThreshold.current > 5) return;

      if (!clicked && !isCompleted) {
          setClicked(true);
          completeStage(Stage.PROJECTS, 999999); 
      }
  };

  const handlePlanetClick = (link: string) => {
      // Only navigate if it was a distinct click, not a drag rotation
      if (dragThreshold.current < 5) {
          window.open(link, '_blank');
      }
  };

  const handleManualNext = (e: any) => {
      e.stopPropagation();
      playHyperjump(); // SFX: Rocket/Hyperjump
      nextStage();
  };

  return (
    <group position={position}>
        {/* Rotatable Solar System Container */}
        <group 
            ref={systemRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
             {/* Invisible Hit Sphere allows grabbing empty space between orbits */}
             <mesh visible={false}>
                 <sphereGeometry args={[8, 16, 16]} />
                 <meshBasicMaterial />
             </mesh>

            {/* Central Sun / Core */}
            <Sphere args={[1.2, 16, 16]} 
                onClick={handleSunClick}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <meshBasicMaterial color="#ffaa00" wireframe={!isCompleted} />
            </Sphere>

            {/* Planets */}
            <Planet 
                radius={0.4} speed={0.4} color="#ff0055" 
                label="CIVIC ISSUE" desc="Community tracking platform."
                orbitRadius={3} isActive={isCompleted}
                link="https://github.com/Shashankvishnudatta/civic-issue"
                onClick={handlePlanetClick}
            />
            <Planet 
                radius={0.6} speed={0.25} color="#00f3ff" 
                label="RECIPE FINDER" desc="Ingredient based search engine."
                orbitRadius={5} isActive={isCompleted}
                link="https://github.com/Shashankvishnudatta/recipe-finder-VB-1-"
                onClick={handlePlanetClick}
            />
            <Planet 
                radius={0.5} speed={0.15} color="#aa00ff" 
                label="BMI CALCULATOR" desc="Health & fitness tracking tool."
                orbitRadius={7} isActive={isCompleted}
                link="https://github.com/Shashankvishnudatta/BMI-CALCULATOR_VB-2"
                onClick={handlePlanetClick}
            />
        </group>

        {/* Static UI (Does not rotate with system) */}
        <group>
            {!isCompleted && (
                <Html position={[0, -2.5, 0]} center>
                    <div className="text-neon-blue font-orbitron text-xs animate-pulse bg-black/50 p-2 rounded border border-neon-blue whitespace-nowrap pointer-events-none">
                        CLICK CORE TO DECRYPT PROJECTS
                    </div>
                </Html>
            )}

            {isCompleted && (
                <Html position={[0, -3.5, 0]} center zIndexRange={[100, 0]}>
                    <button 
                        className="
                            bg-neon-blue/20 text-white font-bold py-3 px-8 rounded-full 
                            border border-neon-blue shadow-[0_0_30px_rgba(0,243,255,0.4)]
                            hover:bg-neon-blue hover:text-black hover:scale-105
                            transition-all duration-300 font-orbitron tracking-widest text-sm
                            flex items-center gap-2
                            cursor-pointer pointer-events-auto
                        "
                        onClick={handleManualNext}
                    >
                        INITIATE HYPERJUMP <span>🚀</span>
                    </button>
                </Html>
            )}
        </group>
    </group>
  );
};

export default StageProjects;
