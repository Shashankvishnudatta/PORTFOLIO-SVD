
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Stage } from '../store';
import gsap from 'gsap';

// Shared geometries to reduce draw calls and memory overhead
const sharedCardGeometry = new THREE.PlaneGeometry(1.5, 2);
const sharedEdgesGeometry = new THREE.EdgesGeometry(sharedCardGeometry);

const SkillCard: React.FC<{ position: [number, number, number], label: string, delay: number }> = ({ position, label, delay }) => {
    const ref = useRef<THREE.Group>(null);
    const [visible, setVisible] = useState(false);

    useFrame((state) => {
        if (ref.current && visible) {
            ref.current.position.y += Math.sin(state.clock.elapsedTime + delay) * 0.002;
        }
    });

    React.useEffect(() => {
        if (ref.current) {
            ref.current.scale.set(0, 0, 0);
        }
        
        const t = setTimeout(() => {
            setVisible(true);
            if (ref.current) {
                // Slower scale animation for deliberate effect
                gsap.to(ref.current.scale, { x: 1, y: 1, z: 1, duration: 2.0, ease: "back.out(1.2)" });
            }
        }, delay * 1000);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <group ref={ref} position={position}>
             <mesh geometry={sharedCardGeometry}>
                 <meshStandardMaterial color="#111" transparent opacity={0.85} side={THREE.DoubleSide} roughness={0.3} metalness={0.8}/>
             </mesh>
             <lineSegments geometry={sharedEdgesGeometry}>
                <lineBasicMaterial color="#00f3ff" />
             </lineSegments>
             <Text position={[0, 0, 0.1]} fontSize={0.2} color="#00f3ff">
                 {label}
             </Text>
        </group>
    );
};

const StageSkills: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const cubeRef = useRef<THREE.Mesh>(null);
  const { completeStage, completedStages } = useStore();
  const [exploding, setExploding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isCompleted = completedStages.includes(Stage.SKILLS);

  useFrame((state, delta) => {
    if (cubeRef.current && !isCompleted && !exploding) {
       // Idle rotation if not interacting
       cubeRef.current.rotation.x += delta * 0.2;
       cubeRef.current.rotation.y += delta * 0.3;
       
       // Alignment check (Visual feedback simulation)
       const rotY = cubeRef.current.rotation.y % (Math.PI * 2);
       if (Math.abs(rotY) < 0.5) {
           (cubeRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x00ff00);
       } else {
           (cubeRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x00f3ff);
       }
    }
  });

  const handlePointerDown = (e: any) => {
    if (isCompleted || exploding) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: any) => {
     if (isCompleted || exploding || !e.buttons) return;
     if (cubeRef.current) {
         cubeRef.current.rotation.y += e.movementX * 0.01;
         cubeRef.current.rotation.x += e.movementY * 0.01;
     }
  };

  const handlePointerUp = (e: any) => {
      if (isCompleted || exploding) return;
      if (cubeRef.current) {
          triggerExplosion();
      }
  };
  
  const triggerExplosion = () => {
    setExploding(true);
    if (cubeRef.current) {
         gsap.to(cubeRef.current.scale, { 
             x: 0, y: 0, z: 0, 
             duration: 0.5, 
             ease: "back.in(1.7)",
             onComplete: () => {
                 completeStage(Stage.SKILLS, 8000); // Increased delay to 8s
             }
         });
    } else {
        completeStage(Stage.SKILLS, 8000);
    }
  }

  const skills = [
      { name: "REACT", pos: [-2, 1, 0] },
      { name: "THREE.JS", pos: [0, 1.5, 0] },
      { name: "PYTHON", pos: [2, 1, 0] },
      { name: "NODE.JS", pos: [-2, -1, 0] },
      { name: "AI / ML", pos: [0, -1.5, 0] },
      { name: "WEBGL", pos: [2, -1, 0] },
  ];

  return (
    <group position={position}>
      {!isCompleted && (
          <Box 
            ref={cubeRef} 
            args={[2, 2, 2]} 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => { e.stopPropagation(); triggerExplosion(); }}
            onPointerOver={() => { document.body.style.cursor = 'grab'; setIsHovered(true); }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; setIsHovered(false); }}
          >
            <meshStandardMaterial 
                color="#1a1a1a" 
                roughness={0.2} 
                metalness={0.9} 
                emissive="#00f3ff" 
                emissiveIntensity={0.2}
            />
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 2)]} />
                <lineBasicMaterial color="#00f3ff" />
            </lineSegments>
          </Box>
      )}

      {isCompleted && skills.map((skill, i) => (
          <SkillCard 
            key={i} 
            position={[skill.pos[0], skill.pos[1], skill.pos[2]]} 
            label={skill.name} 
            delay={i * 0.5} // Increased stagger
          />
      ))}

      {isCompleted && (
          <points>
              <sphereGeometry args={[4, 32, 32]} />
              <pointsMaterial size={0.05} color="#00f3ff" transparent opacity={0.5} />
          </points>
      )}
    </group>
  );
};

export default StageSkills;
    