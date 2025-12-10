
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { Sphere, Float, Html, Sparkles, Ring, Cloud, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Stage } from '../store';
import { Award, BookOpen, Cpu, GraduationCap, ChevronRight, MousePointer2, ExternalLink } from 'lucide-react';

const EDUCATION_DATA = [
    {
        id: 'class10',
        title: "SECONDARY SCHOOL",
        institute: "VALERIAN GRAMMAR HIGH SCHOOL",
        year: "2018",
        score: "93.0%",
        color: "#00f3ff", 
        icon: BookOpen,
        pos: [-6, 2, 0],
        orbitRadius: 6.5,
        link: "https://www.stjosephacademy.in/"
    },
    {
        id: 'class12',
        title: "SENIOR SECONDARY",
        institute: "TRIVIDYAA JUNIOR COLLEGE",
        year: "2020",
        score: "98.1%",
        color: "#ff00ff", 
        icon: GraduationCap,
        pos: [-2, -2, 2],
        orbitRadius: 3.5,
        link: "http://davps.com/"
    },
    {
        id: 'btech',
        title: "B.TECH AI & DS",
        institute: "ACE ENGINEERING COLLEGE",
        year: "2024 - 2028",
        score: "9.75 CGPA",
        color: "#00ff55", 
        icon: Cpu,
        pos: [2, 2, -1],
        orbitRadius: 4.0,
        link: "https://www.google.com/search?q=B.Tech+Artificial+Intelligence"
    }
];

const CERTIFICATES = [
    { id: 1, title: "GENERATIVE AI MASTERMIND", issuer: "OUTSKILL" },
    { id: 2, title: "DIGITAL MARKETING", issuer: "INTERNSHALA" },
    { id: 3, title: "Meta Backend Dev", issuer: "Meta" },
    { id: 4, title: "React Native Specialist", issuer: "Udemy" }
];

// --- SHADER FOR ORBITAL PATH ---
const PathMaterial = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#00f3ff"), uBurst: 0 },
    // Vertex
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment
    `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uBurst;
    varying vec2 vUv;
     
    void main() {
        float speed = 2.0 + (uBurst * 8.0);
        float direction = uBurst > 0.5 ? 1.0 : -1.0; 
        
        float dash = sin(vUv.x * 15.0 + (uTime * speed * direction));
        float glow = smoothstep(0.0, 0.2, dash);
        
        vec3 finalColor = uColor;
        
        if (uBurst > 0.1) {
            vec3 burstColor = vec3(1.0, 0.8, 0.2); // Gold
            finalColor = mix(uColor, burstColor, uBurst);
            glow += sin(vUv.x * 30.0 + uTime * 20.0) * uBurst * 0.5;
        }

        float alpha = 0.3 + (glow * 0.7);
        alpha *= smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.9, 1.0, vUv.x));

        gl_FragColor = vec4(finalColor, alpha);
    }
    `
);

extend({ PathMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pathMaterial: any;
    }
  }
}

const GalacticBackground = () => {
    const starRef = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (starRef.current) {
            starRef.current.rotation.z = state.clock.elapsedTime * 0.02;
        }
    });

    return (
        <group>
            <group position={[0, 0, -10]}>
                <Cloud opacity={0.15} speed={0.1} bounds={[20, 2, 5]} segments={10} color="#4c1d95" position={[-10, 5, -5]} />
                <Cloud opacity={0.15} speed={0.1} bounds={[20, 2, 5]} segments={10} color="#00f3ff" position={[10, -5, -5]} />
                <Cloud opacity={0.1} speed={0.05} bounds={[30, 2, 10]} segments={10} color="#000000" position={[0, 0, -10]} />
            </group>

            <group ref={starRef}>
                 <Sparkles count={400} scale={[60, 60, 40]} size={1.5} speed={0.2} opacity={0.4} color="#ffffff" />
                 <Sparkles count={150} scale={[40, 40, 40]} size={3} speed={0.4} opacity={0.6} color="#a020f0" />
            </group>

            <Sparkles count={50} scale={[30, 30, 20]} size={5} speed={0.1} opacity={0.1} color="#00f3ff" noise={1} />
        </group>
    );
};

const OrbitalPath: React.FC<{ isBurst: boolean }> = ({ isBurst }) => {
    const materialRef = useRef<any>(null);
    
    const curve = useMemo(() => {
        const points = [
            ...EDUCATION_DATA.map(d => new THREE.Vector3(...d.pos)),
            new THREE.Vector3(6, -1, 1) // Core Position
        ];
        return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);
    }, []);

    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.uTime += delta;
            materialRef.current.uBurst = THREE.MathUtils.lerp(
                materialRef.current.uBurst,
                isBurst ? 1.0 : 0.0,
                delta * 2
            );
        }
    });

    return (
        <mesh>
            <tubeGeometry args={[curve, 64, 0.08, 8, false]} />
            {/* @ts-ignore */}
            <pathMaterial ref={materialRef} transparent side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
    );
};

const HoloPlanet: React.FC<{
    data: any,
    isFocused: boolean,
    onClick: () => void
}> = ({ data, isFocused, onClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const selectionRingRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        // Individual Planet Rotation
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
        }
        if (ringRef.current) {
            ringRef.current.rotation.z -= delta * 0.2;
            ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 + (Math.PI / 2);
        }
        if (selectionRingRef.current && isFocused) {
            selectionRingRef.current.rotation.z += delta;
            selectionRingRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
        }
    });

    return (
        <group position={data.pos} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {isFocused && (
                <mesh ref={selectionRingRef}>
                    <ringGeometry args={[1.4, 1.45, 32]} />
                    <meshBasicMaterial color={data.color} transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
            )}

            <Sphere ref={meshRef} args={[0.8, 32, 32]}>
                <meshStandardMaterial 
                    color={data.color} 
                    emissive={data.color} 
                    emissiveIntensity={isFocused ? 2 : 0.5} 
                    roughness={0.4}
                    metalness={0.8}
                />
            </Sphere>

            <Sphere args={[1.0, 32, 32]}>
                <meshBasicMaterial color={data.color} transparent opacity={0.15} side={THREE.BackSide} depthWrite={false} />
            </Sphere>

            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.2, 1.25, 64]} />
                <meshBasicMaterial color={data.color} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>

            {isFocused && (
                <Html position={[0, 1.8, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
                    <div className="pointer-events-none transform transition-all duration-500 origin-bottom scale-100 opacity-100">
                        <div className="flex flex-col items-center">
                            <div className="w-[1px] h-8 bg-gradient-to-t from-transparent via-white to-transparent mb-2"></div>
                            <div 
                                className="glass-panel p-4 rounded-xl border border-white/20 min-w-[240px] text-center backdrop-blur-xl relative overflow-hidden group pointer-events-auto shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={(e) => { e.stopPropagation(); window.open(data.link, '_blank'); }}
                            >
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/50 animate-[scanline_2s_linear_infinite]"></div>
                                <ExternalLink className="w-4 h-4 text-white/50 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <data.icon className="w-8 h-8 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ color: data.color }} />
                                <h3 className="font-orbitron font-bold text-white text-lg tracking-wider mb-1" style={{ textShadow: `0 0 10px ${data.color}` }}>
                                    {data.title}
                                </h3>
                                <div className="h-[1px] w-full bg-white/20 my-2"></div>
                                <p className="font-rajdhani text-gray-300 text-sm tracking-widest uppercase">{data.institute}</p>
                                <div className="flex justify-between items-center mt-3 px-2">
                                    <span className="text-xs text-gray-400 font-mono">{data.year}</span>
                                    <span className="text-sm font-bold" style={{ color: data.color }}>{data.score}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
};

const GoldenDataCore: React.FC<{
    isFocused: boolean,
    onClick: () => void,
    onCertClick: (cert: any) => void,
    selectedCert: any
}> = ({ isFocused, onClick, onCertClick, selectedCert }) => {
    const coreRef = useRef<THREE.Mesh>(null);
    const outerRingRef = useRef<THREE.Group>(null);
    const [burst, setBurst] = useState(false);

    useFrame((state, delta) => {
        if (coreRef.current) {
            coreRef.current.rotation.y -= delta * 1;
            coreRef.current.rotation.z += delta * 0.5;
        }
        if (outerRingRef.current) {
            outerRingRef.current.rotation.x += delta * 0.2;
            outerRingRef.current.rotation.y += delta * 0.2;
        }
    });

    useEffect(() => {
        if (isFocused) {
            setBurst(true);
            setTimeout(() => setBurst(false), 1000);
        }
    }, [isFocused]);

    return (
        <group position={[6, -1, 1]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
             <Sphere ref={coreRef} args={[1, 64, 64]}>
                <meshStandardMaterial 
                    color="#ffd700" 
                    emissive="#ffaa00" 
                    emissiveIntensity={isFocused ? 1.5 : 0.5} 
                    roughness={0.2} 
                    metalness={1} 
                    wireframe={isFocused}
                />
            </Sphere>
            
            <Sphere args={[1.4, 32, 32]}>
                <meshBasicMaterial color="#ffaa00" transparent opacity={0.15} side={THREE.BackSide} depthWrite={false} />
            </Sphere>

            <group ref={outerRingRef}>
                <Ring args={[1.6, 1.65, 64]} rotation={[Math.PI/2, 0, 0]}>
                    <meshBasicMaterial color="#ffd700" transparent opacity={0.4} side={THREE.DoubleSide} />
                </Ring>
                <Ring args={[1.9, 2.0, 64]} rotation={[Math.PI/1.5, 0, 0]}>
                    <meshBasicMaterial color="#ff8800" transparent opacity={0.3} side={THREE.DoubleSide} />
                </Ring>
            </group>

            {burst && <Sparkles count={80} scale={6} size={6} speed={2} opacity={1} color="#ffff00" />}

            {isFocused && (
                <group position={[3.5, 0, 0]}> {/* Moved to side (Right) */}
                    {!selectedCert && CERTIFICATES.map((cert, i) => (
                        <Html key={cert.id} position={[0, (i - 1.5) * 1.2, 0]} center transform zIndexRange={[100, 0]}>
                            <div 
                                onClick={(e) => { e.stopPropagation(); onCertClick(cert); }}
                                className="
                                    glass-panel w-64 p-3 rounded-lg border-l-4 border-l-yellow-400 
                                    cursor-pointer hover:bg-yellow-400/20 transition-all duration-300
                                    hover:scale-110 hover:shadow-[0_0_20px_#ffd700]
                                    group flex items-center justify-between
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <Award className="w-5 h-5 text-yellow-400" />
                                    <div>
                                        <div className="text-white font-orbitron text-xs font-bold">{cert.title}</div>
                                        <div className="text-yellow-200/60 font-rajdhani text-[10px] tracking-wider">{cert.issuer}</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </Html>
                    ))}

                    {selectedCert && (
                        <Html position={[0, 0, 0]} center transform zIndexRange={[100, 0]}>
                             <div className="relative w-80 perspective-1000">
                                <div className="glass-panel p-6 rounded-xl border border-yellow-400/50 shadow-[0_0_50px_rgba(255,215,0,0.3)] bg-black/80 backdrop-blur-2xl transform rotate-x-10 animate-[fadeIn_0.5s_ease-out]">
                                    
                                    <div className="flex items-center justify-between mb-4 border-b border-yellow-400/30 pb-2">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-6 h-6 text-yellow-400 animate-pulse" />
                                            <span className="font-orbitron text-yellow-400 tracking-widest text-sm">CERTIFIED</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400">ID: 00{selectedCert.id}X9</span>
                                    </div>

                                    <h2 className="text-2xl font-bold text-white font-orbitron mb-1 glitch-text">{selectedCert.title}</h2>
                                    <p className="text-yellow-200/80 font-rajdhani text-lg mb-6 uppercase tracking-wider">{selectedCert.issuer}</p>

                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onCertClick(null); }}
                                        className="w-full py-2 bg-yellow-400/20 hover:bg-yellow-400/40 border border-yellow-400/50 rounded text-yellow-400 font-bold font-mono text-xs transition-colors"
                                    >
                                        RETURN TO DATA CORE
                                    </button>
                                </div>
                             </div>
                        </Html>
                    )}
                </group>
            )}
        </group>
    );
};

const StageEducation: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const { completeStage, completedStages } = useStore();
    const groupRef = useRef<THREE.Group>(null);
    const systemRef = useRef<THREE.Group>(null);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [selectedCert, setSelectedCert] = useState<any>(null);
    
    const isCompleted = completedStages.includes(Stage.EDUCATION);
    
    // --- DRAG vs CLICK LOGIC ---
    const isDragging = useRef(false);
    const previousMouse = useRef({ x: 0, y: 0 });
    const dragThreshold = useRef(0);

    const handlePointerDown = (e: any) => {
        // Correctly handle target as actual DOM element via nativeEvent
        const domTarget = e.nativeEvent.target as HTMLElement;
        
        // Ignore clicks on UI buttons if they bubble to the scene
        // We use 'closest' to detect if click started within a glass-panel
        if (domTarget.tagName === 'BUTTON' || (domTarget.closest && domTarget.closest('.glass-panel'))) return;
        
        e.stopPropagation();
        isDragging.current = true;
        previousMouse.current = { x: e.clientX, y: e.clientY };
        dragThreshold.current = 0; // Reset counter
        
        // Capture pointer on the DOM element (canvas), not the Three.js Object
        if (domTarget.setPointerCapture) {
             domTarget.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: any) => {
        if (!isDragging.current || !systemRef.current) return;
        e.stopPropagation();
        
        const deltaX = e.clientX - previousMouse.current.x;
        const deltaY = e.clientY - previousMouse.current.y;
        
        // Accumulate movement. If this gets high, it's a DRAG, not a CLICK.
        dragThreshold.current += Math.abs(deltaX) + Math.abs(deltaY);

        // Rotate System
        systemRef.current.rotation.y += deltaX * 0.005;
        systemRef.current.rotation.x += deltaY * 0.005;

        previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: any) => {
        isDragging.current = false;
        const domTarget = e.nativeEvent.target as HTMLElement;
        if (domTarget.releasePointerCapture) {
            domTarget.releasePointerCapture(e.pointerId);
        }
    };

    // --- ZOOM OUT LOGIC ---
    // This triggers when you click the "Empty Space"
    const handleBgClick = () => {
        // If we moved mouse less than 5 pixels, it's a CLICK. Zoom Out.
        if (dragThreshold.current < 5) {
            setFocusedId(null);
            setSelectedCert(null);
        }
    };

    // --- ZOOM IN LOGIC ---
    // This triggers when you click a Planet
    const handlePlanetClick = (id: string) => {
        if (dragThreshold.current < 5) {
            setFocusedId(id);
            setSelectedCert(null);
        }
    }

    useEffect(() => {
        if (focusedId && !isCompleted) {
            setTimeout(() => {
                completeStage(Stage.EDUCATION, 10000); 
            }, 2000);
        }
    }, [focusedId, isCompleted, completeStage]);

    // CAMERA MOVEMENT
    useFrame((state) => {
        if (!groupRef.current) return;
        
        let targetPos = new THREE.Vector3(0, 0, 0);
        
        // Only zoom in if it's NOT the certificates planet
        if (focusedId && focusedId !== 'certs' && systemRef.current) {
            let localPos = new THREE.Vector3(0,0,0);
            
            const targetPlanet = EDUCATION_DATA.find(d => d.id === focusedId);
            if (targetPlanet) {
                localPos.set(targetPlanet.pos[0], targetPlanet.pos[1], targetPlanet.pos[2]);
            }
            
            // Calculate where the planet is currently relative to rotation
            localPos.applyEuler(systemRef.current.rotation);
            
            // Move camera so planet is 6 units away
            targetPos.set(-localPos.x, -localPos.y, 6 - localPos.z);
        }

        // Smooth Move
        groupRef.current.position.lerp(
            new THREE.Vector3(position[0] + targetPos.x, position[1] + targetPos.y, position[2] + targetPos.z), 
            0.08
        );
    });

    return (
        <group>
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.1}>
                <group ref={groupRef} position={position}>
                    
                    <GalacticBackground />

                    {!focusedId && (
                        <Html position={[0, -3.5, 0]} center>
                             <div className="flex items-center gap-2 text-white/50 font-mono text-[10px] animate-pulse pointer-events-none">
                                <MousePointer2 size={12} />
                                <span>DRAG SPACE TO ROTATE • CLICK NODES TO ENTER</span>
                             </div>
                        </Html>
                    )}

                    {/* --- THE INVISIBLE CLICK CATCHER --- */}
                    {/* This big sphere catches clicks in the empty space and allows rotation */}
                    <mesh 
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onClick={handleBgClick} 
                        visible={true} 
                    >
                        <sphereGeometry args={[30, 16, 16]} />
                        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
                    </mesh>

                    <group ref={systemRef}>
                        {EDUCATION_DATA.map((data) => (
                            <group key={data.id}>
                                <mesh rotation={[Math.PI / 2, 0, 0]}>
                                    <ringGeometry args={[data.orbitRadius - 0.02, data.orbitRadius + 0.02, 64]} />
                                    <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.DoubleSide} />
                                </mesh>
                                
                                <HoloPlanet 
                                    data={data} 
                                    isFocused={focusedId === data.id}
                                    onClick={() => handlePlanetClick(data.id)}
                                />
                            </group>
                        ))}

                        <GoldenDataCore 
                            isFocused={focusedId === 'certs'} 
                            onClick={() => handlePlanetClick('certs')}
                            onCertClick={setSelectedCert}
                            selectedCert={selectedCert}
                        />

                        <OrbitalPath isBurst={focusedId === 'certs'} />
                    </group>

                </group>
            </Float>
        </group>
    );
};

export default StageEducation;
