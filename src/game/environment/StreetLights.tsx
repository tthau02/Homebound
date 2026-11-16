import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT_CONFIG, ROAD_LAYOUT } from '../config/environmentConfig';
import { useGameStore } from '../../stores/useGameStore';

const POLE_COUNT = ENVIRONMENT_CONFIG.streetLightCount / 2;
const ARM_REACH = 2.4;

/**
 * Double-arm street lights standing on the median, one arm over each carriageway.
 * Instanced and looped along Z; two pooled point lights follow the pole nearest the bus.
 */
export const StreetLights: React.FC = () => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const isNight = timeOfDay === 'night';

  const poleMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const armMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const bulbMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const nearLightLeftRef = useRef<THREE.PointLight | null>(null);
  const nearLightRightRef = useRef<THREE.PointLight | null>(null);
  const dummyRef = useRef(new THREE.Object3D());
  const scrollRef = useRef(0);

  useFrame((_, rawDelta) => {
    const state = useGameStore.getState();
    const delta = Math.min(rawDelta, 0.1);
    const { zMin, zMax, loopSpan } = ENVIRONMENT_CONFIG;
    if (!state.isPaused) {
      scrollRef.current = (scrollRef.current + ((state.busSpeedKmh * 1000) / 3600) * delta) % loopSpan;
    }
    const scroll = scrollRef.current;
    const dummy = dummyRef.current;
    const spacing = loopSpan / POLE_COUNT;
    const x = ROAD_LAYOUT.medianX;
    let closestZ = -999;

    for (let i = 0; i < POLE_COUNT; i++) {
      let z = zMin + i * spacing + scroll;
      if (z > zMax) z -= loopSpan;
      if (Math.abs(z + 6) < Math.abs(closestZ + 6)) closestZ = z;

      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.position.set(x, 4.2, z);
      dummy.updateMatrix();
      poleMeshRef.current?.setMatrixAt(i, dummy.matrix);

      for (let side = 0; side < 2; side++) {
        const sign = side === 0 ? -1 : 1;
        dummy.position.set(x + sign * (ARM_REACH / 2), 8.25, z);
        dummy.rotation.set(0, 0, sign * 0.16);
        dummy.updateMatrix();
        armMeshRef.current?.setMatrixAt(i * 2 + side, dummy.matrix);

        dummy.position.set(x + sign * ARM_REACH, 8.4, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        bulbMeshRef.current?.setMatrixAt(i * 2 + side, dummy.matrix);
      }
    }

    if (poleMeshRef.current) poleMeshRef.current.instanceMatrix.needsUpdate = true;
    if (armMeshRef.current) armMeshRef.current.instanceMatrix.needsUpdate = true;
    if (bulbMeshRef.current) bulbMeshRef.current.instanceMatrix.needsUpdate = true;

    nearLightLeftRef.current?.position.set(x - ARM_REACH - 2, 7.6, closestZ);
    nearLightRightRef.current?.position.set(x + ARM_REACH + 1.5, 7.6, closestZ);
  });

  return (
    <group name="StreetLights">
      <instancedMesh ref={poleMeshRef} args={[undefined, undefined, POLE_COUNT]} castShadow>
        <cylinderGeometry args={[0.08, 0.13, 8.4, 10]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.35} />
      </instancedMesh>

      <instancedMesh ref={armMeshRef} args={[undefined, undefined, POLE_COUNT * 2]}>
        <boxGeometry args={[ARM_REACH, 0.08, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.35} />
      </instancedMesh>

      <instancedMesh ref={bulbMeshRef} args={[undefined, undefined, POLE_COUNT * 2]}>
        <boxGeometry args={[0.6, 0.12, 0.28]} />
        <meshStandardMaterial
          color={isNight ? '#fef08a' : '#cbd5e1'}
          emissive="#f59e0b"
          emissiveIntensity={isNight ? 3.4 : 0.0}
        />
      </instancedMesh>

      {/* Pooled point lights for night illumination around the bus */}
      {isNight && (
        <>
          <pointLight ref={nearLightLeftRef} intensity={3} distance={30} decay={1.6} color="#fbbf24" />
          <pointLight ref={nearLightRightRef} intensity={3} distance={30} decay={1.6} color="#fbbf24" />
        </>
      )}
    </group>
  );
};
