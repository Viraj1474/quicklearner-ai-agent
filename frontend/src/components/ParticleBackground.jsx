import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "./theme";

// Particles component
function Particles({ count = 2000, darkMode }) {
  const points = useRef();
  
  // Generate random points in a 3D space
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Position
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 8 - 5;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random speed for each particle
      speeds[i] = Math.random() * 0.01;
    }
    
    return { positions, speeds };
  }, [count]);
  
  // Animate particles
  useFrame((state) => {
    const { positions: pos, speeds } = positions;
    
    for (let i = 0; i < count; i++) {
      // Apply sine wave motion
      const i3 = i * 3;
      const x = pos[i3];
      const y = pos[i3 + 1];
      
      // Z-axis motion based on sine waves
      pos[i3 + 2] += Math.sin(x / 2 + state.clock.elapsedTime) * speeds[i] * 0.2;
      
      // Slight X and Y drift
      pos[i3] += Math.sin(state.clock.elapsedTime * speeds[i]) * 0.002;
      pos[i3 + 1] += Math.cos(state.clock.elapsedTime * speeds[i]) * 0.002;
    }
    
    points.current.geometry.attributes.position.needsUpdate = true;
    
    // Subtle rotation of the entire system
    points.current.rotation.y = state.clock.elapsedTime * 0.05;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.025) * 0.1;
  });
  
  return (
    <Points ref={points} positions={positions.positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={darkMode ? "#38bdf8" : "#3b82f6"}
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export default function ParticleBackground() {
  const { darkMode } = useTheme();
  
  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden" 
      style={{ 
        opacity: 0.4,
        top: '64px', // Position below navbar
        height: 'calc(100vh - 64px)' // Fill remaining viewport height
      }}
    >
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Particles count={1200} darkMode={darkMode} />
      </Canvas>
    </div>
  );
}