import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT_CONFIG } from '../config/environmentConfig';
import { useGameStore } from '../../stores/useGameStore';

export const RoadSystem: React.FC = () => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);

  const dashMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const markerPostMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const markerTopMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const dashOffsetsRef = useRef<number[]>([]);
  const markerOffsetsRef = useRef<number[]>([]);
  const dummyRef = useRef(new THREE.Object3D());

  const dashCount = ENVIRONMENT_CONFIG.laneDashCount;
  const markerCount = 10;
  const markerSpacing = ENVIRONMENT_CONFIG.loopSpan / markerCount;

  // Initialize Z offsets once
  useMemo(() => {
    const dashes: number[] = [];
    for (let i = 0; i < dashCount; i++) {
      dashes.push(ENVIRONMENT_CONFIG.zMin + i * ENVIRONMENT_CONFIG.laneDashSpacing);
    }
    dashOffsetsRef.current = dashes;

    const markers: number[] = [];
    for (let i = 0; i < markerCount; i++) {
      markers.push(ENVIRONMENT_CONFIG.zMin + i * markerSpacing);
    }
    markerOffsetsRef.current = markers;
  }, [dashCount, markerCount, markerSpacing]);

  // Set initial instance matrices on mount
  useEffect(() => {
    const dummy = dummyRef.current;
    if (dashMeshRef.current) {
      for (let i = 0; i < dashCount; i++) {
        dummy.position.set(0, 0.015, dashOffsetsRef.current[i]);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dashMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      dashMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dashCount]);

  useFrame((_, rawDelta) => {
    const state = useGameStore.getState();
    if (state.isPaused) return;

    const delta = Math.min(rawDelta, 0.1);
    const speedMs = (state.busSpeedKmh * 1000) / 3600;
    const dz = speedMs * delta;
    const dummy = dummyRef.current;

    // Update center lane dashes (InstancedMesh)
    if (dashMeshRef.current) {
      for (let i = 0; i < dashCount; i++) {
        let z = dashOffsetsRef.current[i] + dz;
        if (z > ENVIRONMENT_CONFIG.zMax) {
          z -= ENVIRONMENT_CONFIG.loopSpan;
        }
        dashOffsetsRef.current[i] = z;

        dummy.position.set(0, 0.015, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        dashMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      dashMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Vietnamese Highway Kilometer Marker Posts (Cột cây số trắng-đỏ)
    if (markerPostMeshRef.current && markerTopMeshRef.current) {
      const markerX = ENVIRONMENT_CONFIG.roadWidth / 2 + 0.55;
      for (let i = 0; i < markerCount; i++) {
        let z = markerOffsetsRef.current[i] + dz;
        if (z > ENVIRONMENT_CONFIG.zMax) {
          z -= ENVIRONMENT_CONFIG.loopSpan;
        }
        markerOffsetsRef.current[i] = z;

        dummy.position.set(markerX, 0.35, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        markerPostMeshRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(markerX, 0.78, z);
        dummy.updateMatrix();
        markerTopMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      markerPostMeshRef.current.instanceMatrix.needsUpdate = true;
      markerTopMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const centerZ = (ENVIRONMENT_CONFIG.zMin + ENVIRONMENT_CONFIG.zMax) / 2;
  const roadLen = ENVIRONMENT_CONFIG.loopSpan + 40;
  const halfRoad = ENVIRONMENT_CONFIG.roadWidth / 2;

  return (
    <group name="RoadSystem">
      {/* Lush Vietnamese Rice Paddy & Countryside Ground Plane */}
      <mesh
        position={[0, -0.06, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[260, roadLen]} />
        <meshStandardMaterial
          color={timeOfDay === 'day' ? '#365314' : '#0f1f12'}
          roughness={0.92}
        />
      </mesh>

      {/* Raised Earthen Roadbed / Gravel Shoulder */}
      <mesh position={[0, -0.02, centerZ]} receiveShadow>
        <boxGeometry
          args={[
            ENVIRONMENT_CONFIG.roadWidth + ENVIRONMENT_CONFIG.shoulderWidth * 2,
            0.04,
            roadLen,
          ]}
        />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </mesh>

      {/* Main Asphalt Highway Surface */}
      <mesh position={[0, 0, centerZ]} receiveShadow>
        <boxGeometry args={[ENVIRONMENT_CONFIG.roadWidth, 0.02, roadLen]} />
        <meshStandardMaterial color="#1e293b" roughness={0.82} metalness={0.08} />
      </mesh>

      {/* Continuous Left & Right White Edge Lines */}
      <mesh position={[-halfRoad + 0.25, 0.014, centerZ]}>
        <boxGeometry args={[0.14, 0.004, roadLen]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[halfRoad - 0.25, 0.014, centerZ]}>
        <boxGeometry args={[0.14, 0.004, roadLen]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {/* Instanced Dashed Center Lane Divider */}
      <instancedMesh
        ref={dashMeshRef}
        args={[undefined, undefined, dashCount]}
        receiveShadow
      >
        <boxGeometry args={[0.16, 0.006, 3.2]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#facc15"
          emissiveIntensity={timeOfDay === 'night' ? 0.35 : 0.05}
          roughness={0.4}
        />
      </instancedMesh>

      {/* Instanced Vietnamese Highway Milestone Posts (White Base + Red Cap) */}
      <instancedMesh
        ref={markerPostMeshRef}
        args={[undefined, undefined, markerCount]}
        castShadow
      >
        <boxGeometry args={[0.24, 0.7, 0.24]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </instancedMesh>
      <instancedMesh
        ref={markerTopMeshRef}
        args={[undefined, undefined, markerCount]}
        castShadow
      >
        <boxGeometry args={[0.25, 0.22, 0.25]} />
        <meshStandardMaterial color="#dc2626" roughness={0.45} />
      </instancedMesh>
    </group>
  );
};

