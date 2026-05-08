import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const EnergyOrb = ({ color }) => {
  const meshRef = useRef(null);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth floating motion
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.4;

      // Slow rotation
      meshRef.current.rotation.y += delta * 0.6;

      // Pulse scale animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh
      ref={meshRef}
      onClick={() => setActive(!active)}
      scale={active ? 1.3 : 1}
    >
      {/* Sphere (orb) */}
      <sphereGeometry args={[1, 64, 64]} />

      {/* Glass + glow material */}
      <meshStandardMaterial
        color={color || '#0DABC6'}
        transparent
        opacity={0.7}
        metalness={0.9}
        roughness={0.1}
        emissive={color || '#0DABC6'}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

export default function ThreeDComponent({ style }) {
  return (
    <Canvas style={style} camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      {/* Glow lighting */}
      <pointLight position={[0, 0, 2]} intensity={1.5} color="#0DABC6" />

      <EnergyOrb />
    </Canvas>
  );
}
