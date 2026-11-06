import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT_CONFIG } from '../config/environmentConfig';
import { useGameStore } from '../../stores/useGameStore';

export const RoadSystem: React.FC = () => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const isNight = timeOfDay === 'night';

  const dashMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const markerPostMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const markerTopMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const guardPostMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const dashOffsetsRef = useRef<number[]>([]);
  const markerOffsetsRef = useRef<number[]>([]);
  const guardOffsetsRef = useRef<number[]>([]);
  const dummyRef = useRef(new THREE.Object3D());

  const dashCount = ENVIRONMENT_CONFIG.laneDashCount;
  const markerCount = 10;
  const markerSpacing = ENVIRONMENT_CONFIG.loopSpan / markerCount;

  // Guardrail posts along both sides
  const guardCount = 36;
  const guardSpacing = ENVIRONMENT_CONFIG.loopSpan / (guardCount / 2);

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

    const guards: number[] = [];
    for (let i = 0; i < guardCount / 2; i++) {
      guards.push(ENVIRONMENT_CONFIG.zMin + i * guardSpacing);
    }
    guardOffsetsRef.current = guards;
  }, [dashCount, markerCount, markerSpacing, guardCount, guardSpacing]);

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
      const markerX = ENVIRONMENT_CONFIG.roadWidth / 2 + 0.65;
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

    // Update Highway Guardrail Posts
    if (guardPostMeshRef.current) {
      const leftGuardX = -ENVIRONMENT_CONFIG.roadWidth / 2 - 0.42;
      const rightGuardX = ENVIRONMENT_CONFIG.roadWidth / 2 + 0.42;
      const halfGuards = guardCount / 2;

      for (let i = 0; i < halfGuards; i++) {
        let z = guardOffsetsRef.current[i] + dz;
        if (z > ENVIRONMENT_CONFIG.zMax) {
          z -= ENVIRONMENT_CONFIG.loopSpan;
        }
        guardOffsetsRef.current[i] = z;

        // Left post
        dummy.position.set(leftGuardX, 0.38, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        guardPostMeshRef.current.setMatrixAt(i * 2, dummy.matrix);

        // Right post
        dummy.position.set(rightGuardX, 0.38, z);
        dummy.updateMatrix();
        guardPostMeshRef.current.setMatrixAt(i * 2 + 1, dummy.matrix);
      }
      guardPostMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const centerZ = (ENVIRONMENT_CONFIG.zMin + ENVIRONMENT_CONFIG.zMax) / 2;
  const roadLen = ENVIRONMENT_CONFIG.loopSpan + 40;
  const halfRoad = ENVIRONMENT_CONFIG.roadWidth / 2;
  const leftGuardX = -halfRoad - 0.42;
  const rightGuardX = halfRoad + 0.42;

  return (
    <group name="RoadSystem">
      {/* Lush Vietnamese Countryside Ground Plane */}
      <mesh
        position={[0, -0.06, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[260, roadLen]} />
        <meshStandardMaterial
          color={timeOfDay === 'day' ? '#3f6212' : '#0f1f12'}
          roughness={0.92}
        />
      </mesh>

      {/* Mekong Delta Water Canal (Kênh Nước Ven Đường Miền Tây) */}
      <group position={[halfRoad + 5.2, -0.12, centerZ]}>
        {/* Canal Water Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4.8, roadLen]} />
          <meshStandardMaterial
            color={isNight ? '#082f49' : '#0284c7'}
            roughness={0.15}
            metalness={0.45}
          />
        </mesh>
        {/* Canal Banks / Bờ Kênh Đất & Cỏ */}
        <mesh position={[-2.45, 0.05, 0]}>
          <boxGeometry args={[0.35, 0.22, roadLen]} />
          <meshStandardMaterial color="#4d7c0f" roughness={0.88} />
        </mesh>
        <mesh position={[2.45, 0.05, 0]}>
          <boxGeometry args={[0.35, 0.22, roadLen]} />
          <meshStandardMaterial color="#4d7c0f" roughness={0.88} />
        </mesh>
      </group>

      {/* Raised Earthen Roadbed / Gravel Shoulder */}
      <mesh position={[0, -0.02, centerZ]} receiveShadow>
        <boxGeometry
          args={[
            ENVIRONMENT_CONFIG.roadWidth + ENVIRONMENT_CONFIG.shoulderWidth * 2,
            0.04,
            roadLen,
          ]}
        />
        <meshStandardMaterial color="#44403c" roughness={0.92} />
      </mesh>

      {/* Main Asphalt Highway Surface with Natural Texture & Contrast */}
      <mesh position={[0, 0, centerZ]} receiveShadow>
        <boxGeometry args={[ENVIRONMENT_CONFIG.roadWidth, 0.02, roadLen]} />
        <meshStandardMaterial color="#1e2229" roughness={0.85} metalness={0.06} />
      </mesh>

      {/* Continuous Left & Right White Edge Lines */}
      <mesh position={[-halfRoad + 0.25, 0.014, centerZ]}>
        <boxGeometry args={[0.16, 0.004, roadLen]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.35} />
      </mesh>
      <mesh position={[halfRoad - 0.25, 0.014, centerZ]}>
        <boxGeometry args={[0.16, 0.004, roadLen]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.35} />
      </mesh>

      {/* Continuous Highway Corrugated Guardrail Horizontal Beams */}
      {/* Left Guardrail Beam */}
      <mesh position={[leftGuardX, 0.52, centerZ]} castShadow>
        <boxGeometry args={[0.07, 0.24, roadLen]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.32} />
      </mesh>
      {/* Right Guardrail Beam */}
      <mesh position={[rightGuardX, 0.52, centerZ]} castShadow>
        <boxGeometry args={[0.07, 0.24, roadLen]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.32} />
      </mesh>

      {/* Instanced Guardrail Vertical Support Posts */}
      <instancedMesh
        ref={guardPostMeshRef}
        args={[undefined, undefined, guardCount]}
        castShadow
      >
        <cylinderGeometry args={[0.045, 0.045, 0.76, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.65} roughness={0.4} />
      </instancedMesh>

      {/* Instanced Dashed Center Lane Divider */}
      <instancedMesh
        ref={dashMeshRef}
        args={[undefined, undefined, dashCount]}
        receiveShadow
      >
        <boxGeometry args={[0.18, 0.006, 3.4]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#facc15"
          emissiveIntensity={timeOfDay === 'night' ? 0.35 : 0.05}
          roughness={0.35}
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
