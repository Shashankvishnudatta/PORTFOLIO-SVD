
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Cylinder, Cone, Sparkles, Cloud, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Stage } from '../store';
import gsap from 'gsap';

const AdvancedRocket: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    
    // Dynamic Fire
    useFrame((state) => {
        if(groupRef.current) {
            // Slight rumble
            groupRef.current.position.x = (Math.random() - 0.5) * 0.02;
            groupRef.current.position.z = (Math.random() - 0.5) * 0.02;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
             {/* Main Fuselage */}
             <Cylinder args={[0.5, 0.7, 3, 32]} position={[0, 1.5, 0]}>
                 <meshStandardMaterial color="#eeeeee" metalness={0.6} roughness={0.2} />
             </Cylinder>
             <Cylinder args={[0.5, 0.5, 0.5, 32]} position={[0, 3.25, 0]}>
                 <meshStandardMaterial color="#333" metalness={0.8} />
             </Cylinder>
             {/* Nose Cone */}
             <Cone args={[0.5, 1, 32]} position={[0, 4, 0]}>
                 <meshStandardMaterial color="#ff0000" metalness={0.5} />
             </Cone>

             {/* Window */}
             <mesh position={[0, 2.2, 0.45]}>
                 <circleGeometry args={[0.2, 32]} />
                 <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.5} />
             </mesh>

             {/* Boosters */}
             <group position={[0.6, 0.5, 0]}>
                 <Cylinder args={[0.25, 0.3, 1.5, 16]}>
                    <meshStandardMaterial color="#cccccc" />
                 </Cylinder>
                 <Cone args={[0.25, 0.4, 16]} position={[0, 0.95, 0]}>
                     <meshStandardMaterial color="#333" />
                 </Cone>
                 {/* Booster Fire */}
                 <Cone args={[0.2, 0.8, 16]} position={[0, -1.2, 0]} rotation={[Math.PI, 0, 0]}>
                     <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
                 </Cone>
             </group>
             <group position={[-0.6, 0.5, 0]}>
                 <Cylinder args={[0.25, 0.3, 1.5, 16]}>
                    <meshStandardMaterial color="#cccccc" />
                 </Cylinder>
                 <Cone args={[0.25, 0.4, 16]} position={[0, 0.95, 0]}>
                     <meshStandardMaterial color="#333" />
                 </Cone>
                  {/* Booster Fire */}
                 <Cone args={[0.2, 0.8, 16]} position={[0, -1.2, 0]} rotation={[Math.PI, 0, 0]}>
                     <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
                 </Cone>
             </group>

             {/* Main Engine Fire */}
             <Cone args={[0.4, 1.5, 32]} position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
                  <meshBasicMaterial color="#00f3ff" transparent opacity={0.9} />
             </Cone>
             <pointLight position={[0, -1, 0]} color="#00f3ff" intensity={2} distance={5} />
        </group>
    );
};

const UFO: React.FC = () => {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (ref.current) {
            const t = clock.getElapsedTime();
            // Figure 8 movement
            ref.current.position.x = Math.sin(t * 0.5) * 6;
            ref.current.position.z = Math.cos(t * 0.5) * 3 - 5;
            ref.current.position.y = Math.sin(t) * 1 + 4;
            ref.current.rotation.y += 0.02;
            ref.current.rotation.z = Math.sin(t) * 0.1;
        }
    });

    return (
        <group ref={ref}>
            {/* Saucer Body */}
            <mesh>
                <cylinderGeometry args={[0.5, 1.5, 0.3, 32]} />
                <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Dome */}
            <mesh position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshPhysicalMaterial color="#00ff00" transmission={0.5} opacity={0.8} transparent />
            </mesh>
            {/* Lights Ring */}
            {Array.from({ length: 8 }).map((_, i) => (
                <mesh key={i} position={[Math.cos(i/8 * Math.PI*2)*1.2, -0.1, Math.sin(i/8 * Math.PI*2)*1.2]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color="#00ff00" />
                </mesh>
            ))}
        </group>
    );
};

const WelcomeButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const text = "WELCOME";
    const letters = text.split("");

    return (
        <Html position={[0, -1.5, 2]} center transform>
            <button 
                onClick={onClick}
                className="group relative px-8 py-4 bg-transparent border-none cursor-pointer outline-none"
            >
                <div className="absolute inset-0 bg-black/60 skew-x-12 border border-neon-blue shadow-[0_0_20px_#00f3ff] transition-all group-hover:bg-neon-blue/20 group-hover:scale-105"></div>
                <div className="flex gap-1 relative z-10">
                    {letters.map((char, i) => (
                        <span 
                            key={i} 
                            className="text-3xl font-orbitron font-bold text-white group-hover:text-neon-blue transition-colors"
                            style={{ 
                                display: 'inline-block',
                                animation: `bounce 1s infinite ${i * 0.1}s` 
                            }}
                        >
                            {char}
                        </span>
                    ))}
                </div>
                <style>{`
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-5px); }
                    }
                `}</style>
            </button>
        </Html>
    );
};

// Visual Effects for Launch
const LaunchFX = () => {
    const flashRef = useRef<THREE.Mesh>(null);
    
    useFrame((state, delta) => {
        if (flashRef.current) {
            flashRef.current.scale.x += delta * 15;
            flashRef.current.scale.y += delta * 15;
            flashRef.current.scale.z += delta * 15;
            (flashRef.current.material as THREE.MeshBasicMaterial).opacity -= delta * 1.5;
        }
    });

    return (
        <group>
             {/* Ignition Flash */}
             <Sphere ref={flashRef} args={[1, 32, 32]} position={[0, 0, 0]}>
                 <meshBasicMaterial color="#ffaa00" transparent opacity={1} />
             </Sphere>
             
             {/* Exhaust Particles */}
             <Sparkles count={200} scale={[2, 10, 2]} size={10} speed={5} opacity={1} color="#ff4400" position={[0, -2, 0]} />
             <Sparkles count={100} scale={[4, 8, 4]} size={5} speed={2} opacity={0.5} color="#aaaaaa" position={[0, -3, 0]} />
             
             {/* Smoke */}
             <Cloud opacity={0.5} speed={1} bounds={[10, 2, 1.5]} segments={20} color="#333333" position={[0, -2, 0]} />
        </group>
    );
};

const StageLogin: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const rocketRef = useRef<THREE.Group>(null);
    const shakeGroupRef = useRef<THREE.Group>(null);
    const { setStage } = useStore();
    const [isLaunching, setIsLaunching] = useState(false);

    useFrame((state) => {
        // Camera Shake Effect
        if (isLaunching && shakeGroupRef.current) {
            shakeGroupRef.current.position.x = (Math.random() - 0.5) * 0.3;
            shakeGroupRef.current.position.y = (Math.random() - 0.5) * 0.3;
            shakeGroupRef.current.position.z = (Math.random() - 0.5) * 0.1;
        }
    });

    const handleEnter = () => {
        if (isLaunching) return;
        setIsLaunching(true);

        // Launch Animation
        if (rocketRef.current) {
            gsap.to(rocketRef.current.position, {
                y: 50,
                duration: 2.0,
                ease: "power4.in",
                onComplete: () => {
                    setStage(Stage.INTRO);
                }
            });
            
            // Tilt rocket slightly for realism
            gsap.to(rocketRef.current.rotation, {
                x: -0.1,
                duration: 2.0,
                ease: "power2.in"
            });
        }
    };

    return (
        <group position={position}>
            {/* Shake Wrapper */}
            <group ref={shakeGroupRef}>
                {/* Ground Planet Surface */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                    <sphereGeometry args={[15, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.15]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
                </mesh>

                {/* Lighting for Login Scene */}
                <pointLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
                <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={1} color="#00f3ff" />

                {/* Rocket */}
                <group ref={rocketRef}>
                    <AdvancedRocket />
                    {isLaunching && <LaunchFX />}
                </group>

                {/* Background Elements */}
                <UFO />

                {/* UI */}
                {!isLaunching && <WelcomeButton onClick={handleEnter} />}
            </group>
        </group>
    );
};

export default StageLogin;
