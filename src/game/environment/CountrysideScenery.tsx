import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT_CONFIG } from '../config/environmentConfig';
import { useGameStore } from '../../stores/useGameStore';

interface SceneryTree {
  x: number;
  z: number;
  scale: number;
  speedFactor: number;
}

interface SceneryHouse {
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotY: number;
  speedFactor: number;
}

interface DistantMountain {
  x: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

export const CountrysideScenery: React.FC = () => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const isNight = timeOfDay === 'night';

  const treeTrunkRef = useRef<THREE.InstancedMesh | null>(null);
  const treeCrownLowerRef = useRef<THREE.InstancedMesh | null>(null);
  const treeCrownUpperRef = useRef<THREE.InstancedMesh | null>(null);

  const houseWallRef = useRef<THREE.InstancedMesh | null>(null);
  const houseRoofRef = useRef<THREE.InstancedMesh | null>(null);
  const houseWindowRef = useRef<THREE.InstancedMesh | null>(null);

  const paddyPlotRef = useRef<THREE.InstancedMesh | null>(null);
  const mountainRef = useRef<THREE.InstancedMesh | null>(null);
  const restStopGroupRef = useRef<THREE.Group | null>(null);

  const dummyRef = useRef(new THREE.Object3D());
  const restStopZRef = useRef<number>(ENVIRONMENT_CONFIG.restStopInitialZ);

  const treeCount = ENVIRONMENT_CONFIG.nearTreeCount;
  const houseCount = ENVIRONMENT_CONFIG.midHouseCount;
  const mountainCount = ENVIRONMENT_CONFIG.farMountainCount;
  const paddyCount = 16;

  const treesRef = useRef<SceneryTree[]>([]);
  const housesRef = useRef<SceneryHouse[]>([]);
  const paddyZRef = useRef<number[]>([]);
  const mountainsRef = useRef<DistantMountain[]>([]);

  useMemo(() => {
    // 1. Roadside & Midground Trees (depth-layered speed factor based on X distance)
    const trees: SceneryTree[] = [];
    for (let i = 0; i < treeCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const distBand = (i % 3) * 3.8;
      const x = side * (7.6 + distBand + ((i * 7) % 3) * 0.9);
      const z =
        ENVIRONMENT_CONFIG.zMin +
        (i / treeCount) * ENVIRONMENT_CONFIG.loopSpan;
      const scale = 0.85 + ((i * 13) % 5) * 0.14;
      // Objects further away move slightly slower for depth perception
      const speedFactor = Math.max(0.76, 1.0 - Math.abs(x) * 0.008);
      trees.push({ x, z, scale, speedFactor });
    }
    treesRef.current = trees;

    // 2. Vietnamese Countryside Houses (Nhà dân mái ngói đỏ)
    const houses: SceneryHouse[] = [];
    for (let i = 0; i < houseCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (15.5 + ((i * 5) % 4) * 4.2);
      const z =
        ENVIRONMENT_CONFIG.zMin +
        (i / houseCount) * ENVIRONMENT_CONFIG.loopSpan;
      const width = 3.8 + (i % 3) * 0.8;
      const height = 2.8 + (i % 2) * 1.1;
      const depth = 4.6 + (i % 3) * 0.9;
      const rotY = side === -1 ? Math.PI / 2 : -Math.PI / 2;
      const speedFactor = Math.max(0.72, 1.0 - Math.abs(x) * 0.009);
      houses.push({ x, z, width, height, depth, rotY, speedFactor });
    }
    housesRef.current = houses;

    // 3. Rice Paddy Plots (Cánh đồng lúa hai bên đường)
    const paddies: number[] = [];
    const paddySpacing = ENVIRONMENT_CONFIG.loopSpan / (paddyCount / 2);
    for (let i = 0; i < paddyCount; i++) {
      const pairIdx = Math.floor(i / 2);
      paddies.push(ENVIRONMENT_CONFIG.zMin + pairIdx * paddySpacing);
    }
    paddyZRef.current = paddies;

    // 4. Distant Horizon Mountains (Slow parallax speed factor = 0.28)
    const mountains: DistantMountain[] = [];
    for (let i = 0; i < mountainCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (68 + (i % 3) * 12);
      const z =
        ENVIRONMENT_CONFIG.zMin +
        (i / mountainCount) * ENVIRONMENT_CONFIG.loopSpan;
      mountains.push({
        x,
        z,
        scaleX: 18 + (i % 4) * 5,
        scaleY: 14 + (i % 3) * 6,
        scaleZ: 22 + (i % 3) * 6,
      });
    }
    mountainsRef.current = mountains;
  }, [treeCount, houseCount, mountainCount, paddyCount]);

  useFrame((_, rawDelta) => {
    const state = useGameStore.getState();
    if (state.isPaused) return;

    const delta = Math.min(rawDelta, 0.1);
    const speedMs = (state.busSpeedKmh * 1000) / 3600;
    const baseDz = speedMs * delta;
    const dummy = dummyRef.current;

    // Update Trees
    if (
      treeTrunkRef.current &&
      treeCrownLowerRef.current &&
      treeCrownUpperRef.current
    ) {
      for (let i = 0; i < treeCount; i++) {
        const t = treesRef.current[i];
        t.z += baseDz * t.speedFactor;
        if (t.z > ENVIRONMENT_CONFIG.zMax) {
          t.z -= ENVIRONMENT_CONFIG.loopSpan;
        }

        // Trunk
        dummy.position.set(t.x, 1.3 * t.scale, t.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(t.scale, t.scale, t.scale);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);

        // Lower Foliage Canopy
        dummy.position.set(t.x, 3.1 * t.scale, t.z);
        dummy.scale.set(t.scale, t.scale, t.scale);
        dummy.updateMatrix();
        treeCrownLowerRef.current.setMatrixAt(i, dummy.matrix);

        // Upper Foliage Canopy
        dummy.position.set(t.x, 4.4 * t.scale, t.z);
        dummy.scale.set(t.scale * 0.78, t.scale * 0.85, t.scale * 0.78);
        dummy.updateMatrix();
        treeCrownUpperRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeCrownLowerRef.current.instanceMatrix.needsUpdate = true;
      treeCrownUpperRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Vietnamese Rural Houses
    if (houseWallRef.current && houseRoofRef.current && houseWindowRef.current) {
      for (let i = 0; i < houseCount; i++) {
        const h = housesRef.current[i];
        h.z += baseDz * h.speedFactor;
        if (h.z > ENVIRONMENT_CONFIG.zMax) {
          h.z -= ENVIRONMENT_CONFIG.loopSpan;
        }

        // House Walls
        dummy.position.set(h.x, h.height / 2, h.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(h.width, h.height, h.depth);
        dummy.updateMatrix();
        houseWallRef.current.setMatrixAt(i, dummy.matrix);

        // Pitched Terracotta Roof
        dummy.position.set(h.x, h.height + 0.65, h.z);
        dummy.rotation.set(0, Math.PI / 4, 0);
        dummy.scale.set(h.width * 0.82, 1.35, h.depth * 0.82);
        dummy.updateMatrix();
        houseRoofRef.current.setMatrixAt(i, dummy.matrix);

        // Front Illuminated Window facing road
        const windowFaceX =
          h.x < 0 ? h.x + h.width * 0.51 : h.x - h.width * 0.51;
        dummy.position.set(windowFaceX, h.height * 0.52, h.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.08, 0.95, 1.45);
        dummy.updateMatrix();
        houseWindowRef.current.setMatrixAt(i, dummy.matrix);
      }
      houseWallRef.current.instanceMatrix.needsUpdate = true;
      houseRoofRef.current.instanceMatrix.needsUpdate = true;
      houseWindowRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Rice Paddy Fields
    if (paddyPlotRef.current) {
      for (let i = 0; i < paddyCount; i++) {
        let z = paddyZRef.current[i] + baseDz * 0.88;
        if (z > ENVIRONMENT_CONFIG.zMax) {
          z -= ENVIRONMENT_CONFIG.loopSpan;
        }
        paddyZRef.current[i] = z;

        const side = i % 2 === 0 ? -1 : 1;
        dummy.position.set(side * 34, -0.03, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        paddyPlotRef.current.setMatrixAt(i, dummy.matrix);
      }
      paddyPlotRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Distant Horizon Mountains (Slow Parallax = 0.28x speed)
    if (mountainRef.current) {
      for (let i = 0; i < mountainCount; i++) {
        const m = mountainsRef.current[i];
        m.z += baseDz * 0.28;
        if (m.z > ENVIRONMENT_CONFIG.zMax) {
          m.z -= ENVIRONMENT_CONFIG.loopSpan;
        }

        dummy.position.set(m.x, m.scaleY * 0.45, m.z);
        dummy.rotation.set(0, i * 0.6, 0);
        dummy.scale.set(m.scaleX, m.scaleY, m.scaleZ);
        dummy.updateMatrix();
        mountainRef.current.setMatrixAt(i, dummy.matrix);
      }
      mountainRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Roadside Rest Stop (Trạm Dừng Nghỉ Miền Tây)
    restStopZRef.current += baseDz * 0.94;
    if (restStopZRef.current > ENVIRONMENT_CONFIG.zMax + 25) {
      restStopZRef.current -= ENVIRONMENT_CONFIG.restStopLoopSpan;
    }
    if (restStopGroupRef.current) {
      restStopGroupRef.current.position.z = restStopZRef.current;
    }
  });

  return (
    <group name="CountrysideScenery">
      {/* ==================== INSTANCED ROADSIDE TREES ==================== */}
      <instancedMesh ref={treeTrunkRef} args={[undefined, undefined, treeCount]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 2.6, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={treeCrownLowerRef}
        args={[undefined, undefined, treeCount]}
        castShadow
      >
        <coneGeometry args={[1.45, 2.8, 9]} />
        <meshStandardMaterial
          color={isNight ? '#14532d' : '#15803d'}
          roughness={0.8}
        />
      </instancedMesh>
      <instancedMesh
        ref={treeCrownUpperRef}
        args={[undefined, undefined, treeCount]}
        castShadow
      >
        <coneGeometry args={[1.3, 2.4, 9]} />
        <meshStandardMaterial
          color={isNight ? '#166534' : '#22c55e'}
          roughness={0.78}
        />
      </instancedMesh>

      {/* ==================== INSTANCED VIETNAMESE RURAL HOUSES ==================== */}
      <instancedMesh ref={houseWallRef} args={[undefined, undefined, houseCount]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isNight ? '#94a3b8' : '#fef3c7'}
          roughness={0.75}
        />
      </instancedMesh>
      <instancedMesh ref={houseRoofRef} args={[undefined, undefined, houseCount]} castShadow>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={houseWindowRef} args={[undefined, undefined, houseCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isNight ? '#fde047' : '#38bdf8'}
          emissive={isNight ? '#f59e0b' : '#0284c7'}
          emissiveIntensity={isNight ? 2.2 : 0.15}
        />
      </instancedMesh>

      {/* ==================== INSTANCED RICE PADDY FIELDS (CÁNH ĐỒNG LÚA) ==================== */}
      <instancedMesh ref={paddyPlotRef} args={[undefined, undefined, paddyCount]} receiveShadow>
        <boxGeometry args={[32, 0.04, 18]} />
        <meshStandardMaterial
          color={isNight ? '#14532d' : '#65a30d'}
          roughness={0.88}
        />
      </instancedMesh>

      {/* ==================== INSTANCED DISTANT MOUNTAINS (PARALLAX) ==================== */}
      <instancedMesh ref={mountainRef} args={[undefined, undefined, mountainCount]}>
        <coneGeometry args={[1, 1, 6]} />
        <meshStandardMaterial
          color={isNight ? '#0f172a' : '#475569'}
          roughness={0.95}
        />
      </instancedMesh>

      {/* ==================== VIETNAMESE HIGHWAY REST STOP (TRẠM DỪNG NGHỈ) ==================== */}
      <group
        ref={restStopGroupRef}
        position={[13.5, 0, ENVIRONMENT_CONFIG.restStopInitialZ]}
      >
        {/* Concrete Rest Stop Parking Apron */}
        <mesh position={[-2.5, 0.01, 0]} receiveShadow>
          <boxGeometry args={[14, 0.04, 24]} />
          <meshStandardMaterial color="#475569" roughness={0.85} />
        </mesh>

        {/* Main Pavilion Building */}
        <mesh position={[2.2, 2.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.5, 4.2, 16]} />
          <meshStandardMaterial color="#fffbeb" roughness={0.6} />
        </mesh>

        {/* Traditional Red Tiled Pavilion Roof */}
        <mesh position={[1.2, 4.6, 0]} castShadow>
          <boxGeometry args={[9.2, 0.6, 18]} />
          <meshStandardMaterial color="#dc2626" roughness={0.5} />
        </mesh>

        {/* Rest Stop Canopy Pillars */}
        {[-6.5, -2.2, 2.2, 6.5].map((zPillar, idx) => (
          <mesh key={`rs-pillar-${idx}`} position={[-2.6, 2.15, zPillar]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 4.3, 10]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}

        {/* Glowing Roadside Signboard Pylon ("TRẠM DỪNG NGHỈ") */}
        <group position={[-5.8, 0, -9.5]}>
          <mesh position={[0, 3.2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 6.4, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 5.8, 0]}>
            <boxGeometry args={[3.2, 1.3, 0.28]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#ef4444"
              emissiveIntensity={isNight ? 1.8 : 0.4}
            />
          </mesh>
          <mesh position={[0, 5.8, 0.15]}>
            <boxGeometry args={[2.8, 0.9, 0.04]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#facc15"
              emissiveIntensity={isNight ? 2.4 : 0.6}
            />
          </mesh>
        </group>

        {/* Warm Rest Stop Storefront Glass & Lanterns */}
        <mesh position={[-1.08, 1.8, 0]}>
          <boxGeometry args={[0.08, 2.6, 12.5]} />
          <meshStandardMaterial
            color="#fde68a"
            emissive="#f59e0b"
            emissiveIntensity={isNight ? 2.2 : 0.4}
          />
        </mesh>
      </group>
    </group>
  );
};

