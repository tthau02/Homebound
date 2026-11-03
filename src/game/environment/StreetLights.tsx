import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT_CONFIG } from '../config/environmentConfig';
import { useGameStore } from '../../stores/useGameStore';

interface StreetLightItem {
  z: number;
  side: -1 | 1;
}

export const StreetLights: React.FC = () => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const isNight = timeOfDay === 'night';

  const poleMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const armMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const bulbMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const nearLightLeftRef = useRef<THREE.PointLight | null>(null);
  const nearLightRightRef = useRef<THREE.PointLight | null>(null);

  const dummyRef = useRef(new THREE.Object3D());
  const count = ENVIRONMENT_CONFIG.streetLightCount;

  const itemsRef = useRef<StreetLightItem[]>([]);

  useMemo(() => {
    const arr: StreetLightItem[] = [];
    const pairs = count / 2;
    const spacing = ENVIRONMENT_CONFIG.loopSpan / pairs;
    for (let i = 0; i < pairs; i++) {
      const z = ENVIRONMENT_CONFIG.zMin + i * spacing;
      arr.push({ z, side: -1 });
      arr.push({ z: z + spacing * 0.5, side: 1 });
    }
    itemsRef.current = arr;
  }, [count]);

  useFrame((_, rawDelta) => {
    const state = useGameStore.getState();
    if (state.isPaused) return;

    const delta = Math.min(rawDelta, 0.1);
    const speedMs = (state.busSpeedKmh * 1000) / 3600;
    const dz = speedMs * delta;
    const dummy = dummyRef.current;

    const poleXBase = ENVIRONMENT_CONFIG.roadWidth / 2 + 1.15;
    let closestLeftZ = -999;
    let closestRightZ = -999;

    for (let i = 0; i < itemsRef.current.length; i++) {
      const item = itemsRef.current[i];
      item.z += dz;
      if (item.z > ENVIRONMENT_CONFIG.zMax) {
        item.z -= ENVIRONMENT_CONFIG.loopSpan;
      }

      const xPole = item.side * poleXBase;

      // Track closest street light to the bus (z around 0) for active point light pool
      if (item.side === -1 && Math.abs(item.z) < Math.abs(closestLeftZ)) {
        closestLeftZ = item.z;
      }
      if (item.side === 1 && Math.abs(item.z) < Math.abs(closestRightZ)) {
        closestRightZ = item.z;
      }

      if (poleMeshRef.current) {
        dummy.position.set(xPole, 3.4, item.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poleMeshRef.current.setMatrixAt(i, dummy.matrix);
      }

      if (armMeshRef.current) {
        dummy.position.set(xPole - item.side * 0.85, 6.65, item.z);
        dummy.rotation.set(0, 0, item.side * 0.22);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        armMeshRef.current.setMatrixAt(i, dummy.matrix);
      }

      if (bulbMeshRef.current) {
        dummy.position.set(xPole - item.side * 1.55, 6.72, item.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bulbMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (poleMeshRef.current) poleMeshRef.current.instanceMatrix.needsUpdate = true;
    if (armMeshRef.current) armMeshRef.current.instanceMatrix.needsUpdate = true;
    if (bulbMeshRef.current) bulbMeshRef.current.instanceMatrix.needsUpdate = true;

    if (nearLightLeftRef.current) {
      nearLightLeftRef.current.position.set(-poleXBase + 1.5, 6.4, closestLeftZ);
    }
    if (nearLightRightRef.current) {
      nearLightRightRef.current.position.set(poleXBase - 1.5, 6.4, closestRightZ);
    }
  });

  return (
    <group name="StreetLights">
      {/* Vertical Steel Poles */}
      <instancedMesh ref={poleMeshRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 6.8, 10]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.35} />
      </instancedMesh>

      {/* Cantilever Lamp Arms */}
      <instancedMesh ref={armMeshRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1.85, 0.08, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.35} />
      </instancedMesh>

      {/* Sodium-Vapor / LED Streetlight Lamp Heads */}
      <instancedMesh ref={bulbMeshRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.52, 0.12, 0.26]} />
        <meshStandardMaterial
          color={isNight ? '#fef08a' : '#cbd5e1'}
          emissive="#f59e0b"
          emissiveIntensity={isNight ? 3.4 : 0.0}
        />
      </instancedMesh>

      {/* Dynamic Pooled Point Lights for Night Highway Illumination */}
      {isNight && (
        <>
          <pointLight
            ref={nearLightLeftRef}
            intensity={2.6}
            distance={24}
            decay={1.6}
            color="#fbbf24"
          />
          <pointLight
            ref={nearLightRightRef}
            intensity={2.6}
            distance={24}
            decay={1.6}
          color="#fbbf24"
          />
        </>
      )}
    </group>
  );
};

