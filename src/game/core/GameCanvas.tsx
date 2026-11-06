import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../stores/useGameStore';
import { GameWorld } from './GameWorld';
import { PerformanceProbe3D } from './PerformanceProbe3D';
import { CAMERA_PRESETS } from '../config/cameraConfig';

export const GameCanvas: React.FC = () => {
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

  const dpr: [number, number] =
    graphicsQuality === 'high'
      ? [1, 2]
      : graphicsQuality === 'medium'
        ? [1, 1.5]
        : [0.85, 1];

  const enableShadows = graphicsQuality !== 'low';

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows={enableShadows ? 'soft' : false}
        dpr={dpr}
        camera={{
          position: CAMERA_PRESETS.interior.position,
          fov: CAMERA_PRESETS.interior.fov,
          near: 0.1,
          far: 240,
        }}
        gl={{
          antialias: graphicsQuality !== 'low',
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.25;
          if (enableShadows) {
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }
        }}
      >
        <Suspense fallback={null}>
          <GameWorld />
          <PerformanceProbe3D />
        </Suspense>
      </Canvas>
    </div>
  );
};
