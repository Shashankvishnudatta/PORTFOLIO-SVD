import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Stars, PerspectiveCamera, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from './store';

// Stages
import StageIntro from './components/StageIntro';
import StageEducation from './components/StageEducation';
import StageSkills from './components/StageSkills';
import StageProjects from './components/StageProjects';
import StageExperience from './components/StageExperience';
import StageContact from './components/StageContact';
import StageLogin from './components/StageLogin';
import Overlay from './components/Overlay';

// --- GLOBAL AUDIO HOOK ---
const useGlobalAmbience = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const isPlaying = useRef(false);

  useEffect(() => {
    const handleInteraction = () => {
      if (isPlaying.current) return;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioCtx.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.015; 
      masterGain.connect(ctx.destination);

      const t = ctx.currentTime;

      // Layer 1: Deep Space Rumble
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 150;
      noiseFilter.Q.value = 1;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 100; 

      lfo.connect(lfoGain);
      lfoGain.connect(noiseFilter.frequency);
      lfo.start(t);

      noise.connect(noiseFilter);
      noiseFilter.connect(masterGain);
      noise.start(t);

      // Layer 2: Ethereal Pad
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 220; 
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 221.5; 

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.2; 

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(masterGain);

      osc1.start(t);
      osc2.start(t);

      isPlaying.current = true;

      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      audioCtx.current?.close();
    };
  }, []);
};

const CameraController = () => {
  const { currentStage } = useStore();
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const pCamera = camera as THREE.PerspectiveCamera;

    // Determine target position based on stage index
    // Spacing: 30 units per stage
    const targetX = currentStage * 30;
    
    // Smooth dampening for position
    const speed = 2.5;
    pCamera.position.x = THREE.MathUtils.damp(pCamera.position.x, targetX, speed, delta);
    
    // Add a slight Z/Y float for "zero gravity" feel
    const time = state.clock.elapsedTime;
    pCamera.position.y = THREE.MathUtils.damp(pCamera.position.y, Math.sin(time * 0.5) * 0.5, 1, delta);
    pCamera.position.z = THREE.MathUtils.damp(pCamera.position.z, 12 + Math.cos(time * 0.3) * 0.5, 1, delta);

    // DYNAMIC FOV WARP
    const dist = Math.abs(targetX - pCamera.position.x);
    const targetFov = 50 + (dist * 1.5); 
    const clampedFov = Math.min(targetFov, 80);
    
    if (pCamera.fov !== undefined) {
        pCamera.fov = THREE.MathUtils.lerp(pCamera.fov, clampedFov, delta * 3);
        pCamera.updateProjectionMatrix();
    }

    // LOOK AHEAD LOGIC
    const lookOffset = (targetX - pCamera.position.x) * 0.5;
    lookAtTarget.current.set(pCamera.position.x + lookOffset, 0, 0);
    
    const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(pCamera.quaternion).add(pCamera.position);
    currentLook.lerp(lookAtTarget.current, delta * 3);
    pCamera.lookAt(currentLook);
  });

  return null;
}

const SceneContent = () => {
  return (
    <>
      <CameraController />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      
      <StageLogin position={[-30, 0, 0]} />
      <StageIntro position={[0, 0, 0]} />
      <StageEducation position={[30, 0, 0]} />
      <StageSkills position={[60, 0, 0]} />
      <StageProjects position={[90, 0, 0]} />
      <StageExperience position={[120, 0, 0]} />
      <StageContact position={[150, 0, 0]} />
    </>
  );
};

const TransitionOverlay = () => {
    const { isTransitioning } = useStore();
    return (
        <div className={`absolute inset-0 pointer-events-none z-40 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
             <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,243,255,0.1)_50%,rgba(0,0,0,0.8)_100%)]"></div>
             <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white opacity-20 blur-sm transform scale-x-[2]"></div>
             <div className="absolute top-1/3 left-0 w-full h-[1px] bg-neon-blue opacity-30 blur-md transform scale-x-[3]"></div>
             <div className="absolute bottom-1/3 left-0 w-full h-[1px] bg-purple-500 opacity-30 blur-md transform scale-x-[3]"></div>
        </div>
    );
}

const App: React.FC = () => {
  const [dpr, setDpr] = useState(1.5); 
  useGlobalAmbience();

  return (
    <div className="w-full h-full bg-black relative">
      <Overlay />
      <TransitionOverlay />
      
      <Canvas 
        dpr={dpr} 
        gl={{ 
            antialias: false, 
            toneMapping: THREE.ReinhardToneMapping, 
            toneMappingExposure: 1.5,
            powerPreference: "high-performance"
        }}
      >
        <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
        {/* Start camera at StageLogin (-30) */}
        <PerspectiveCamera makeDefault position={[-30, 0, 12]} fov={50} />
        <Suspense fallback={null}>
            <SceneContent />
            <Environment preset="city" /> 
        </Suspense>
      </Canvas>
      
      <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none opacity-30 text-[10px] text-white font-mono">
        USE MOUSE TO INTERACT • SCROLL LOCKED • PUZZLE NAVIGATION
      </div>
    </div>
  );
};

export default App;