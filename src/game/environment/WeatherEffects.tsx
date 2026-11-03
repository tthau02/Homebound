import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../stores/useGameStore';

const RAIN_DROPS = 560;

export const WeatherEffects: React.FC = () => {
  const weather = useGameStore((state) => state.weather);
  const positionAttribute = useRef<THREE.BufferAttribute>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(RAIN_DROPS * 3);
    for (let i = 0; i < RAIN_DROPS; i += 1) {
      values[i * 3] = ((i * 37) % 320) / 10 - 16;
      values[i * 3 + 1] = ((i * 53) % 130) / 10 + 1;
      values[i * 3 + 2] = ((i * 71) % 360) / 10 - 18;
    }
    return values;
  }, []);

  useFrame((_, rawDelta) => {
    if (weather !== 'rainy') return;
    const attribute = positionAttribute.current;
    if (!attribute) return;
    const delta = Math.min(rawDelta, 0.1);
    const values = attribute.array as Float32Array;
    for (let i = 0; i < RAIN_DROPS; i += 1) {
      const yIndex = i * 3 + 1;
      values[yIndex] -= delta * 10;
      if (values[yIndex] < 0) values[yIndex] = 13 + ((i * 17) % 30) / 10;
    }
    attribute.needsUpdate = true;
  });

  if (weather !== 'rainy') return null;

  return (
    <points position={[0, 0, -1]} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          ref={positionAttribute}
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#b8d9e8"
        size={0.055}
        transparent
        opacity={0.62}
        depthWrite={false}
      />
    </points>
  );
};
