
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Stage } from '../store';
import gsap from 'gsap';

// --- AUDIO SYSTEM FOR CORE HUM ---
const useCoreAudio = () => {
    const audioCtx = useRef<AudioContext | null>(null);
    const nodes = useRef<any[]>([]);

    const initAudio = useCallback(() => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioCtx.current;
    }, []);

    const startHum = useCallback(() => {
        const ctx = initAudio();
        
        // Handle Autoplay Policy
        if (ctx.state === 'suspended') {
            const resume = () => {
                ctx.resume();
                window.removeEventListener('click', resume);
                window.removeEventListener('keydown', resume);
            };
            window.addEventListener('click', resume);
            window.addEventListener('keydown', resume);
        }

        if (nodes.current.length > 0) return; // Already playing

        const t = ctx.currentTime;

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, t);
        masterGain.gain.linearRampToValueAtTime(0.12, t + 2); // Slow fade in
        masterGain.connect(ctx.destination);

        // 1. Low Drone (Base)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(60, t); // Low A/B flat
        osc1.connect(masterGain);
        osc1.start();

        // 2. Detuned Pulse (Interference)
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(60.5, t); // 0.5Hz beat frequency
        const osc2Gain = ctx.createGain();
        osc2Gain.gain.value = 0.05; // Subtle
        osc2.connect(osc2Gain);
        osc2Gain.connect(masterGain);
        osc2.start();

        // 3. Resonant Whine (Sci-fi Texture)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 800;
        noiseFilter.Q.value = 15;

        // LFO to modulate filter
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // Very slow breathe
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 200; // Modulate frequency by +/- 200Hz
        
        lfo.connect(lfoGain);
        lfoGain.connect(noiseFilter.frequency);
        lfo.start();

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.03;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start();

        nodes.current = [osc1, osc2, lfo, noise, masterGain, ctx];
    }, [initAudio]);

    const powerUpAndStop = useCallback(() => {
        if (nodes.current.length > 0) {
            const [osc1, osc2, lfo, noise, masterGain, ctx] = nodes.current;
            
            // Ensure context is running if triggered by click
            if (ctx.state === 'suspended') ctx.resume();

            const t = ctx.currentTime;
            
            // Pitch Shift Up (Powering Up Effect)
            osc1.frequency.exponentialRampToValueAtTime(400, t + 1.5);
            osc2.frequency.exponentialRampToValueAtTime(400, t + 1.5);
            
            // Volume Swell -> Cut
            masterGain.gain.cancelScheduledValues(t);
            masterGain.gain.setValueAtTime(masterGain.gain.value, t);
            masterGain.gain.linearRampToValueAtTime(0.4, t + 0.5); // Swell
            masterGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5); // Fade out

            // Cleanup
            setTimeout(() => {
                osc1.stop();
                osc2.stop();
                lfo.stop();
                noise.stop();
                nodes.current = [];
            }, 1600);
        }
    }, []);

    const stopHumImmediate = useCallback(() => {
         if (nodes.current.length > 0) {
            const [osc1, osc2, lfo, noise, masterGain, ctx] = nodes.current;
            const t = ctx.currentTime;
            masterGain.gain.setTargetAtTime(0, t, 0.5);
            setTimeout(() => {
                osc1.stop(); osc2.stop(); lfo.stop(); noise.stop();
                nodes.current = [];
            }, 1000);
         }
    }, []);

    return { startHum, powerUpAndStop, stopHumImmediate };
};

const StageIntro: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { completeStage, completedStages } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0.2);
  const [showName, setShowName] = useState(false);
  const [decodedText, setDecodedText] = useState("");
  
  // Audio
  const { startHum, powerUpAndStop, stopHumImmediate } = useCoreAudio();

  const isCompleted = completedStages.includes(Stage.INTRO);

  // Start ambient hum on mount
  useEffect(() => {
      if (!isCompleted) {
          startHum();
      }
      return () => {
          stopHumImmediate();
      };
  }, [startHum, stopHumImmediate, isCompleted]);

  // Text Decryption Effect
  useEffect(() => {
    if (showName) {
        const targetText = "SHASHANK VISHNU DATTA";
        const chars = "!<>-_\\/[]{}—=+*^?#";
        let iterations = 0;
        
        const interval = setInterval(() => {
            setDecodedText(targetText.split("")
                .map((letter, index) => {
                    if (index < iterations) {
                        return targetText[index];
                    }
                    if (letter === " ") return " ";
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("")
            );

            if (iterations >= targetText.length) { 
                clearInterval(interval);
                setDecodedText(targetText);
            }
            
            iterations += 1/2; // Speed of decoding
        }, 30);

        return () => clearInterval(interval);
    }
  }, [showName]);

  useFrame((state, delta) => {
    if (!sphereRef.current || !ringRef.current) return;

    // Idle rotation
    if (!isCompleted) {
      sphereRef.current.rotation.y += delta * rotationSpeed;
      ringRef.current.rotation.z -= delta * 0.1;
      ringRef.current.rotation.x += delta * 0.1;
    } else {
        // Fast spin on complete
        sphereRef.current.rotation.y += delta * 8;
        ringRef.current.rotation.z += delta * 2;
    }
  });

  const handleClick = () => {
    if (isCompleted) return;
    
    // SFX: Power Up
    powerUpAndStop();

    // Animate sphere explosion/reaction
    if (sphereRef.current) {
        gsap.to(sphereRef.current.scale, {
            x: 0.1, y: 0.1, z: 0.1, duration: 0.5, ease: "back.in(2)"
        });
    }

    // Trigger name reveal
    setShowName(true);
    setRotationSpeed(0);
    
    // Complete stage with 1.5s delay as requested
    completeStage(Stage.INTRO, 1500);
  };

  const materialProps = {
    color: isCompleted ? "#00ff00" : isHovered ? "#00f3ff" : "#0055ff",
    emissive: isCompleted ? "#00ff00" : "#001133",
    emissiveIntensity: isCompleted ? 2 : 0.5,
    wireframe: true,
    transparent: true,
    opacity: 0.8
  };

  return (
    <group position={position}>
      {/* High Detail Sphere */}
      <Sphere ref={sphereRef} args={[1.5, 64, 64]} onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setIsHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; setIsHovered(false); }}
      >
          <meshStandardMaterial {...materialProps} />
      </Sphere>

      {/* Outer Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[2.5, 0.02, 16, 64]} />
        <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
      </mesh>
      
      {/* Name Reveal Overlay */}
      {showName && (
        <Html center zIndexRange={[100, 0]}>
            <div className="pointer-events-none text-center flex flex-col items-center justify-center w-[90vw] md:w-auto">
                
                {/* Hyper Pop & Decrypt Animation */}
                <div style={{ animation: 'hyperPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                    <h1 className="text-4xl md:text-6xl lg:text-8xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 drop-shadow-[0_0_30px_rgba(0,243,255,0.8)] whitespace-nowrap glitch-text tracking-tighter">
                        {decodedText}
                    </h1>
                </div>

                {/* Decorative Line Expanding */}
                <div className="w-full h-[2px] bg-neon-blue mt-2 shadow-[0_0_20px_#00f3ff] opacity-0"
                     style={{ animation: 'expandLine 0.5s ease-out 0.4s forwards' }}>
                </div>
                
                {/* Subtitle Fade In */}
                <p className="font-rajdhani text-neon-blue tracking-[0.5em] mt-4 text-xl md:text-2xl opacity-0"
                   style={{ animation: 'fadeIn 0.5s ease-out 0.6s forwards' }}>
                    SYSTEM INITIALIZED
                </p>

                <style>{`
                    @keyframes hyperPop {
                        0% { transform: scale(0); filter: blur(20px); opacity: 0; }
                        50% { transform: scale(1.5); filter: blur(0px); opacity: 1; }
                        70% { transform: scale(0.9); }
                        100% { transform: scale(1); }
                    }
                    @keyframes expandLine {
                        0% { width: 0%; opacity: 0; }
                        100% { width: 100%; opacity: 1; }
                    }
                    @keyframes fadeIn {
                        0% { opacity: 0; transform: translateY(10px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                    .glitch-text::before, .glitch-text::after {
                        content: attr(data-text);
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        opacity: 0.8;
                    }
                    .glitch-text::before {
                        color: #ff00ff;
                        z-index: -1;
                        animation: glitch-anim-1 0.4s infinite linear alternate-reverse;
                    }
                    .glitch-text::after {
                        color: #00ffff;
                        z-index: -2;
                        animation: glitch-anim-2 0.4s infinite linear alternate-reverse;
                    }
                    @keyframes glitch-anim-1 {
                        0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 2px); }
                        20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -2px); }
                        100% { clip-path: inset(10% 0 50% 0); transform: translate(-2px, 2px); }
                    }
                    @keyframes glitch-anim-2 {
                        0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, -2px); }
                        20% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 2px); }
                        100% { clip-path: inset(30% 0 20% 0); transform: translate(2px, -2px); }
                    }
                `}</style>
            </div>
        </Html>
      )}

      {/* Particles/Glow */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#00f3ff" distance={5} />
    </group>
  );
};

export default StageIntro;
