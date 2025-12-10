
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Stage } from '../store';
import { Mail, Github, Linkedin } from 'lucide-react';
import gsap from 'gsap';

// --- AUDIO SYSTEM ---
const useAudioEffects = () => {
    const audioCtx = useRef<AudioContext | null>(null);
    const activeNodes = useRef<AudioScheduledSourceNode[]>([]);
    const activeGains = useRef<GainNode[]>([]);

    const initAudio = useCallback(() => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.current.state === 'suspended') {
            audioCtx.current.resume().catch(() => {});
        }
    }, []);

    const playClick = useCallback(() => {
        initAudio();
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // High pitch tech chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }, [initAudio]);

    const playWhoosh = useCallback(() => {
        initAudio();
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;

        // Create white noise buffer
        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter sweep
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 1;
        filter.frequency.setValueAtTime(100, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + 0.3); // Up
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 2.0); // Down

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3); // Fade in
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0); // Fade out

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
    }, [initAudio]);

    const startHum = useCallback(() => {
        initAudio();
        if (!audioCtx.current || activeNodes.current.length > 0) return;
        const ctx = audioCtx.current;
        const now = ctx.currentTime;

        // --- 1. BASE HUM ---
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now); // Low drone A1

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, now);
        filter.Q.value = 2;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 2); 

        osc.start();

        // --- 2. ENERGY CRACKLE / STATIC ---
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            if (Math.random() > 0.98) {
                data[i] = (Math.random() * 2 - 1) * 0.8;
            } else {
                data[i] = 0;
            }
        }

        const staticSource = ctx.createBufferSource();
        staticSource.buffer = buffer;
        staticSource.loop = true;

        const staticFilter = ctx.createBiquadFilter();
        staticFilter.type = 'highpass';
        staticFilter.frequency.value = 5000;

        const staticGain = ctx.createGain();
        staticGain.gain.setValueAtTime(0, now);
        staticGain.gain.linearRampToValueAtTime(0.04, now + 2); 

        staticSource.connect(staticFilter);
        staticFilter.connect(staticGain);
        staticGain.connect(ctx.destination);
        staticSource.start();

        activeNodes.current.push(osc, staticSource);
        activeGains.current.push(gain, staticGain);
    }, [initAudio]);

    const stopHum = useCallback(() => {
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;
        const now = ctx.currentTime;

        activeGains.current.forEach(gain => {
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(gain.gain.value, now);
            gain.gain.linearRampToValueAtTime(0, now + 1.0);
        });

        activeNodes.current.forEach(node => {
            node.stop(now + 1.1);
        });
        
        setTimeout(() => {
            activeNodes.current = [];
            activeGains.current = [];
        }, 1200);
    }, []);

    return { playClick, playWhoosh, startHum, stopHum };
};

// Particle Burst Effect
const PortalBurst: React.FC = () => {
    const count = 600;
    const geomRef = useRef<THREE.BufferGeometry>(null);
    const matRef = useRef<THREE.PointsMaterial>(null);
    
    const [data] = useState(() => {
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        const palette = [
            new THREE.Color("#00f3ff"),
            new THREE.Color("#ff00ff"),
            new THREE.Color("#ffffff"),
            new THREE.Color("#50ff50"),
        ];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 2.8 + (Math.random() - 0.5) * 0.5;
            
            positions[i*3] = Math.cos(angle) * r;
            positions[i*3+1] = Math.sin(angle) * r;
            positions[i*3+2] = (Math.random() - 0.5) * 0.5;

            const speed = 0.05 + Math.random() * 0.2;
            velocities[i*3] = Math.cos(angle) * speed + (Math.random()-0.5)*0.05;
            velocities[i*3+1] = Math.sin(angle) * speed + (Math.random()-0.5)*0.05;
            velocities[i*3+2] = (Math.random() - 0.5) * 0.2; 

            const color = palette[Math.floor(Math.random() * palette.length)];
            colors[i*3] = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;
        }
        return { positions, velocities, colors };
    });

    useFrame(() => {
        if (!geomRef.current || !matRef.current) return;
        if (matRef.current.opacity <= 0) return;

        const posAttr = geomRef.current.attributes.position;
        const positions = posAttr.array as Float32Array;
        
        for (let i = 0; i < count; i++) {
            positions[i*3] += data.velocities[i*3];
            positions[i*3+1] += data.velocities[i*3+1];
            positions[i*3+2] += data.velocities[i*3+2];
            
            data.velocities[i*3] *= 0.98;
            data.velocities[i*3+1] *= 0.98;
            data.velocities[i*3+2] *= 0.98;
        }
        posAttr.needsUpdate = true;
        matRef.current.opacity -= 0.015;
    });

    return (
        <points>
            <bufferGeometry ref={geomRef}>
                <bufferAttribute attach="attributes-position" count={count} array={data.positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={data.colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial 
                ref={matRef} 
                vertexColors 
                size={0.15} 
                transparent 
                opacity={1} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
                sizeAttenuation={true}
            />
        </points>
    );
};

const Vortex: React.FC<{ innerRef: React.RefObject<THREE.Group | null> }> = ({ innerRef }) => {
    useFrame((state, delta) => {
        if (innerRef.current) {
            innerRef.current.rotation.z -= delta * 2;
        }
    });

    return (
        <group ref={innerRef}>
            <mesh>
                <ringGeometry args={[0.1, 2.8, 32]} />
                <meshBasicMaterial color="#00f3ff" transparent opacity={0.2} side={THREE.DoubleSide} wireframe />
            </mesh>
            <mesh position={[0, 0, -0.1]}>
                <circleGeometry args={[2.8, 32]} />
                <meshBasicMaterial color="#000020" transparent opacity={0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}>
                <ringGeometry args={[1.5, 2, 6]} />
                <meshBasicMaterial color="#a020f0" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

// --- FLOATING SOCIAL ORB COMPONENT ---
const SocialOrb: React.FC<{ 
    position: [number, number, number], 
    icon: any, 
    label: string, 
    colorHex: string,
    href: string,
    delay: number 
}> = ({ position, icon: Icon, label, colorHex, href, delay }) => {
    return (
        <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5} floatingRange={[-0.2, 0.2]}>
             <Html transform distanceFactor={12} position={position} zIndexRange={[100, 0]}>
                 <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => window.open(href, '_blank')}
                    style={{ 
                        opacity: 0, 
                        animation: `fadeIn 0.8s ease-out ${delay}s forwards` 
                    }}
                 >
                    {/* Icon Circle - Medium Size */}
                    <div 
                        className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{
                            border: `2px solid ${colorHex}`,
                            boxShadow: `0 0 15px ${colorHex}`,
                        }}
                    >
                        <Icon size={28} style={{ color: colorHex }} />
                    </div>

                    {/* Floating Label */}
                    <div 
                        className="mt-3 px-3 py-1 bg-black/80 rounded border transition-all duration-300"
                        style={{
                            borderColor: colorHex,
                            color: colorHex,
                            boxShadow: `0 0 10px ${colorHex}`,
                            fontFamily: "'Orbitron', sans-serif",
                            letterSpacing: '1px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}
                    >
                        {label}
                    </div>
                 </div>
             </Html>
        </Float>
    );
};

const StageContact: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  const portalRingRef = useRef<THREE.Mesh>(null);
  const vortexRef = useRef<THREE.Group>(null);
  const { completeStage, completedStages } = useStore();
  const [nodesActive, setNodesActive] = useState([false, false, false]);
  const [isOpen, setIsOpen] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  
  const { playClick, playWhoosh, startHum, stopHum } = useAudioEffects();
  const isCompleted = completedStages.includes(Stage.CONTACT);

  useFrame((state, delta) => {
    if (portalRingRef.current) {
        portalRingRef.current.rotation.z += delta * rotationSpeed;
    }
  });

  useEffect(() => {
      if (nodesActive.every(n => n) && !isOpen) {
          setRotationSpeed(12);
          
          const tl = gsap.timeline({
              onComplete: () => {
                  setIsOpen(true);
                  setRotationSpeed(0.5); 
                  completeStage(Stage.CONTACT);
                  playWhoosh(); 
                  startHum();
                  
                  // Automatically stop the ambient hum after 5 seconds
                  setTimeout(() => {
                      stopHum();
                  }, 5000);
              }
          });

          tl.to({}, { duration: 0.8 });

          if (portalRingRef.current) {
              tl.to(portalRingRef.current.scale, {
                  x: 2.2, y: 2.2, z: 2.2, duration: 0.15, ease: "power4.out"
              })
              .to(portalRingRef.current.scale, {
                  x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.3)"
              }, "-=0.05");
          }
      }
  }, [nodesActive, isOpen, completeStage, playWhoosh, startHum, stopHum]);

  useEffect(() => {
      return () => stopHum();
  }, [stopHum]);

  useEffect(() => {
    if (isOpen && portalRingRef.current) {
        const material = portalRingRef.current.material as THREE.MeshStandardMaterial;
        
        const ctx = gsap.context(() => {
            const pulseDuration = 2;
            gsap.to(material, {
                emissiveIntensity: 2.5,
                duration: pulseDuration,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            if (vortexRef.current) {
                gsap.to(vortexRef.current.scale, {
                    x: 1.1, y: 1.1, z: 1.1,
                    duration: pulseDuration,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            }

            const triggerGlitch = () => {
                const burstDuration = gsap.utils.random(0.05, 0.2);
                const repeats = gsap.utils.random(1, 4, 1);
                const glitchIntensity = gsap.utils.random(0.2, 5);
                const glitchScale = 1 + (glitchIntensity / 5) * 0.3;

                gsap.to(material, {
                    emissiveIntensity: glitchIntensity,
                    opacity: "random(0.3, 0.9)",
                    duration: burstDuration,
                    repeat: repeats,
                    yoyo: true,
                    ease: "steps(1)",
                    onComplete: () => {
                        gsap.to(material, { opacity: 1, duration: 0.1 });
                        gsap.delayedCall(gsap.utils.random(0.5, 3), triggerGlitch);
                    }
                });
                
                if (vortexRef.current) {
                    gsap.to(vortexRef.current.scale, {
                        x: glitchScale, y: glitchScale, z: glitchScale,
                        duration: burstDuration,
                        repeat: repeats,
                        yoyo: true,
                        ease: "steps(1)"
                    });
                }
            };
            gsap.delayedCall(1, triggerGlitch);
        });
        return () => ctx.revert();
    }
  }, [isOpen]);

  const handleNodeClick = (index: number) => {
      if (isOpen || nodesActive[index]) return;
      playClick(); 
      const newNodes = [...nodesActive];
      newNodes[index] = true;
      setNodesActive(newNodes);
      setRotationSpeed(prev => prev + 3);
  };

  return (
    <group ref={groupRef} position={position}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group>
            {/* Main Portal Ring */}
            <mesh ref={portalRingRef}>
                <torusGeometry args={[3, 0.2, 12, 48]} />
                <meshStandardMaterial 
                    color={isOpen ? "#00f3ff" : "#333"} 
                    emissive={isOpen ? "#00f3ff" : "#111"}
                    emissiveIntensity={isOpen ? 2 : 0.5}
                    metalness={0.8}
                    roughness={0.2}
                    transparent={true}
                />
            </mesh>

            {/* Power Nodes */}
            {[0, 120, 240].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 3;
                const y = Math.sin(rad) * 3;
                return (
                    <group key={i} position={[x, y, 0]}>
                        <mesh 
                            visible={false} 
                            onClick={(e) => { e.stopPropagation(); handleNodeClick(i); }}
                            onPointerOver={() => document.body.style.cursor = 'pointer'}
                            onPointerOut={() => document.body.style.cursor = 'auto'}
                        >
                            <sphereGeometry args={[0.8, 16, 16]} />
                        </mesh>
                        <mesh scale={nodesActive[i] ? 1.2 : 1}>
                            <sphereGeometry args={[0.3, 24, 24]} />
                            <meshStandardMaterial 
                                color={nodesActive[i] ? "#00ff00" : "#ff0055"} 
                                emissive={nodesActive[i] ? "#00ff00" : "#ff0055"} 
                                emissiveIntensity={nodesActive[i] ? 3 : 1} 
                            />
                        </mesh>
                        <mesh position={[-x/2, -y/2, 0]} rotation={[0, 0, rad]} scale={[1.5, 0.05, 0.05]}>
                             <boxGeometry />
                             <meshBasicMaterial color={nodesActive[i] ? "#00ff00" : "#333"} transparent opacity={0.5} />
                        </mesh>
                    </group>
                );
            })}

            {isOpen && <Vortex innerRef={vortexRef} />}
            {isOpen && <PortalBurst />}
            {isOpen && <Sparkles count={50} scale={6} size={4} speed={0.4} opacity={0.5} color="#00f3ff" />}
        </group>
      </Float>

      {/* Floating Social Icons - Sized Medium & Moved Outside Portal */}
      {isOpen && (
          <group position={[0, 0, 1]}>
              <SocialOrb 
                  position={[-5, 0, 0]} 
                  icon={Github} 
                  label="GITHUB" 
                  colorHex="#a855f7" 
                  href="https://github.com/Shashankvishnudatta"
                  delay={0.2} 
              />
              <SocialOrb 
                  position={[5, 0, 0]} 
                  icon={Linkedin} 
                  label="LINKEDIN" 
                  colorHex="#00f3ff" 
                  href="https://www.linkedin.com/in/shashankvishnudatta/"
                  delay={0.4} 
              />
              <SocialOrb 
                  position={[0, -4.5, 0]} 
                  icon={Mail} 
                  label="EMAIL" 
                  colorHex="#22c55e" 
                  href="mailto:shashankvishnudatta@gmail.com"
                  delay={0.6} 
              />
          </group>
      )}
    </group>
  );
};

export default StageContact;
