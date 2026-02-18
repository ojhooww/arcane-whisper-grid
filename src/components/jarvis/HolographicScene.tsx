import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { ParticleSphere } from './ParticleSphere';

interface HolographicSceneProps {
  voiceLevel: number;
  isActive: boolean;
}

export function HolographicScene({ voiceLevel, isActive }: HolographicSceneProps) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.1} />
        <ParticleSphere voiceLevel={voiceLevel} isActive={isActive} />
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
