import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSphereProps {
  voiceLevel: number;
  isActive: boolean;
}

const PARTICLE_COUNT = 3000;

export function ParticleSphere({ voiceLevel, isActive }: ParticleSphereProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + (Math.random() - 0.5) * 0.3;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Cyan color
      col[i * 3] = 0.0;
      col[i * 3 + 1] = 0.85;
      col[i * 3 + 2] = 1.0;
    }

    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colAttr = geo.attributes.color as THREE.BufferAttribute;
    const t = clock.getElapsedTime();

    if (!originalPositions.current) {
      originalPositions.current = new Float32Array(posAttr.array);
    }

    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;
    const orig = originalPositions.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const ox = orig[i3], oy = orig[i3 + 1], oz = orig[i3 + 2];

      // Idle floating
      const noise = Math.sin(t * 0.5 + i * 0.01) * 0.05;
      const pulse = 1 + Math.sin(t * 1.2 + i * 0.005) * 0.03;

      // Voice reaction
      const voiceDisplace = voiceLevel * Math.sin(t * 8 + i * 0.1) * 0.15;
      const scale = pulse + voiceDisplace;

      posArr[i3] = ox * scale + noise;
      posArr[i3 + 1] = oy * scale + noise * 0.5;
      posArr[i3 + 2] = oz * scale;

      // Color: more intense/white when active
      if (isActive) {
        colArr[i3] = 0.5 + voiceLevel * 0.5;
        colArr[i3 + 1] = 0.9 + voiceLevel * 0.1;
        colArr[i3 + 2] = 1.0;
      } else {
        colArr[i3] = 0.0;
        colArr[i3 + 1] = 0.85;
        colArr[i3 + 2] = 1.0;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Slow rotation
    pointsRef.current.rotation.y = t * 0.08;
    pointsRef.current.rotation.x = Math.sin(t * 0.15) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
