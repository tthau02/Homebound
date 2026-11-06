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
  const housePorchRef = useRef<THREE.InstancedMesh | null>(null);
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
    // 1. Roadside & Midground Tropical Trees
    const trees: SceneryTree[] = [];
    for (let i = 0; i < treeCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const distBand = (i % 3) * 4.2;
      const x = side * (8.8 + distBand + ((i * 7) % 3) * 1.1);
      const z =
        ENVIRONMENT_CONFIG.zMin +
        (i / treeCount) * ENVIRONMENT_CONFIG.loopSpan;
      const scale = 0.95 + ((i * 13) % 5) * 0.16;
      const speedFactor = Math.max(0.76, 1.0 - Math.abs(x) * 0.008);
      trees.push({ x, z, scale, speedFactor });
    }
    treesRef.current = trees;

    // 2. Vietnamese Countryside Houses (Nhà dân ngói đỏ miền quê)
    const houses: SceneryHouse[] = [];
    for (let i = 0; i < houseCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (16.5 + ((i * 5) % 4) * 4.5);
      const z =
        ENVIRONMENT_CONFIG.zMin +
        (i / houseCount) * ENVIRONMENT_CONFIG.loopSpan;
      const width = 4.2 + (i % 3) * 0.8;
      const height = 2.9 + (i % 2) * 0.6;
      const depth = 5.6 + (i % 3) * 1.1;
      const rotY = side === -1 ? Math.PI / 2 : -Math.PI / 2;
      const speedFactor = Math.max(0.72, 1.0 - Math.abs(x) * 0.009);
      houses.push({ x, z, width, height, depth, rotY, speedFactor });
    }
    housesRef.current = houses;

    // 3. Rice Paddy Plots
    const paddies: number[] = [];
    const paddySpacing = ENVIRONMENT_CONFIG.loopSpan / (paddyCount / 2);
    for (let i = 0; i < paddyCount; i++) {
      const pairIdx = Math.floor(i / 2);
      paddies.push(ENVIRONMENT_CONFIG.zMin + pairIdx * paddySpacing);
    }
    paddyZRef.current = paddies;

    // 4. Distant Horizon Mountain Ridges
    const mountains: DistantMountain[] = [];
    for (let i = 0; i < mountainCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (75 + (i % 4) * 16);
      const z =
        ENVIRONMENT_CONFIG.zMin +
        (i / mountainCount) * ENVIRONMENT_CONFIG.loopSpan;
      const scaleX = 26 + (i % 3) * 12;
      const scaleY = 14 + (i % 4) * 8;
      const scaleZ = 28 + (i % 3) * 10;
      mountains.push({ x, z, scaleX, scaleY, scaleZ });
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

    // Update Trees (Smooth Natural Tropical Canopy)
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
        dummy.position.set(t.x, 1.4 * t.scale, t.z);
        dummy.rotation.set(0, (i * 1.1) % (Math.PI * 2), 0);
        dummy.scale.set(t.scale, t.scale, t.scale);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);

        // Lower Broad Leafy Canopy
        dummy.position.set(t.x, 3.2 * t.scale, t.z);
        dummy.rotation.set(0, (i * 0.7) % (Math.PI * 2), 0);
        dummy.scale.set(t.scale * 1.35, t.scale * 1.1, t.scale * 1.35);
        dummy.updateMatrix();
        treeCrownLowerRef.current.setMatrixAt(i, dummy.matrix);

        // Upper Crown Cluster
        dummy.position.set(t.x + 0.15, 4.4 * t.scale, t.z - 0.1);
        dummy.rotation.set(0.2, (i * 1.3) % (Math.PI * 2), 0);
        dummy.scale.set(t.scale * 1.05, t.scale * 1.0, t.scale * 1.05);
        dummy.updateMatrix();
        treeCrownUpperRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeCrownLowerRef.current.instanceMatrix.needsUpdate = true;
      treeCrownUpperRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Vietnamese Rural Houses
    if (
      houseWallRef.current &&
      houseRoofRef.current &&
      housePorchRef.current &&
      houseWindowRef.current
    ) {
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

        // Traditional Pitched Gable Terracotta Roof (3-sided prism)
        dummy.position.set(h.x, h.height + 0.7, h.z);
        dummy.rotation.set(0, 0, Math.PI / 2);
        dummy.scale.set(1.4, h.width * 1.18, h.depth * 1.12);
        dummy.updateMatrix();
        houseRoofRef.current.setMatrixAt(i, dummy.matrix);

        // Front Porch Awning (Mái hiên nhà hướng ra đường)
        const porchX = h.x < 0 ? h.x + h.width * 0.55 : h.x - h.width * 0.55;
        dummy.position.set(porchX, h.height * 0.65, h.z);
        dummy.rotation.set(0, 0, h.x < 0 ? 0.2 : -0.2);
        dummy.scale.set(1.4, 0.12, h.depth * 0.85);
        dummy.updateMatrix();
        housePorchRef.current.setMatrixAt(i, dummy.matrix);

        // Front Illuminated Window facing road
        const windowFaceX =
          h.x < 0 ? h.x + h.width * 0.51 : h.x - h.width * 0.51;
        dummy.position.set(windowFaceX, h.height * 0.55, h.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.08, 1.05, 1.6);
        dummy.updateMatrix();
        houseWindowRef.current.setMatrixAt(i, dummy.matrix);
      }
      houseWallRef.current.instanceMatrix.needsUpdate = true;
      houseRoofRef.current.instanceMatrix.needsUpdate = true;
      housePorchRef.current.instanceMatrix.needsUpdate = true;
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
        dummy.position.set(side * 36, -0.03, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        paddyPlotRef.current.setMatrixAt(i, dummy.matrix);
      }
      paddyPlotRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Distant Horizon Mountains (Smooth Parallax)
    if (mountainRef.current) {
      for (let i = 0; i < mountainCount; i++) {
        const m = mountainsRef.current[i];
        m.z += baseDz * 0.25;
        if (m.z > ENVIRONMENT_CONFIG.zMax) {
          m.z -= ENVIRONMENT_CONFIG.loopSpan;
        }

        dummy.position.set(m.x, 0, m.z);
        dummy.rotation.set(0, i * 0.7, 0);
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
      {/* ==================== INSTANCED ROADSIDE TROPICAL TREES ==================== */}
      <instancedMesh ref={treeTrunkRef} args={[undefined, undefined, treeCount]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 2.8, 10]} />
        <meshStandardMaterial color="#451a03" roughness={0.92} />
      </instancedMesh>
      {/* Lower Broad Leafy Canopy (Multifaceted Natural Shading) */}
      <instancedMesh
        ref={treeCrownLowerRef}
        args={[undefined, undefined, treeCount]}
        castShadow
      >
        <dodecahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial
          color={isNight ? '#14532d' : '#15803d'}
          roughness={0.75}
        />
      </instancedMesh>
      {/* Upper Crown Foliage */}
      <instancedMesh
        ref={treeCrownUpperRef}
        args={[undefined, undefined, treeCount]}
        castShadow
      >
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial
          color={isNight ? '#166534' : '#22c55e'}
          roughness={0.72}
        />
      </instancedMesh>

      {/* ==================== INSTANCED VIETNAMESE RURAL HOUSES ==================== */}
      {/* Walls with Warm Lime Plaster */}
      <instancedMesh ref={houseWallRef} args={[undefined, undefined, houseCount]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isNight ? '#64748b' : '#fef3c7'}
          roughness={0.8}
        />
      </instancedMesh>

      {/* Traditional Pitched Gable Roof (3-sided prism) */}
      <instancedMesh ref={houseRoofRef} args={[undefined, undefined, houseCount]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 3]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </instancedMesh>

      {/* Front Porch Awning */}
      <instancedMesh ref={housePorchRef} args={[undefined, undefined, houseCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#991b1b" roughness={0.65} />
      </instancedMesh>

      {/* Illuminated Windows */}
      <instancedMesh ref={houseWindowRef} args={[undefined, undefined, houseCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isNight ? '#fde047' : '#bae6fd'}
          emissive={isNight ? '#f59e0b' : '#38bdf8'}
          emissiveIntensity={isNight ? 2.6 : 0.2}
        />
      </instancedMesh>

      {/* ==================== INSTANCED RICE PADDY FIELDS (CÁNH ĐỒNG LÚA) ==================== */}
      <instancedMesh ref={paddyPlotRef} args={[undefined, undefined, paddyCount]} receiveShadow>
        <boxGeometry args={[34, 0.04, 20]} />
        <meshStandardMaterial
          color={isNight ? '#14532d' : '#65a30d'}
          roughness={0.9}
        />
      </instancedMesh>

      {/* ==================== INSTANCED DISTANT MOUNTAIN RIDGES ==================== */}
      <instancedMesh ref={mountainRef} args={[undefined, undefined, mountainCount]}>
        <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color={isNight ? '#091024' : '#475569'}
          roughness={0.96}
        />
      </instancedMesh>

      {/* ==================== VIETNAMESE HIGHWAY REST STOP (TRẠM DỪNG NGHỈ) ==================== */}
      <group
        ref={restStopGroupRef}
        position={[14.5, 0, ENVIRONMENT_CONFIG.restStopInitialZ]}
      >
        {/* Concrete Rest Stop Parking Apron */}
        <mesh position={[-2.5, 0.01, 0]} receiveShadow>
          <boxGeometry args={[15, 0.04, 26]} />
          <meshStandardMaterial color="#475569" roughness={0.85} />
        </mesh>

        {/* Main Pavilion Building */}
        <mesh position={[2.4, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.8, 4.4, 18]} />
          <meshStandardMaterial color="#fffbeb" roughness={0.6} />
        </mesh>

        {/* Traditional Red Tiled Pavilion Roof */}
        <mesh position={[1.4, 4.8, 0]} castShadow>
          <boxGeometry args={[9.5, 0.65, 20]} />
          <meshStandardMaterial color="#dc2626" roughness={0.5} />
        </mesh>

        {/* Rest Stop Canopy Pillars */}
        {[-7.2, -2.4, 2.4, 7.2].map((zPillar, idx) => (
          <mesh key={`rs-pillar-${idx}`} position={[-2.8, 2.2, zPillar]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 4.4, 10]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}

        {/* Glowing Roadside Signboard Pylon ("TRẠM DỪNG NGHỈ MIỀN TÂY") */}
        <group position={[-6.2, 0, -10.5]}>
          <mesh position={[0, 3.4, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.24, 6.8, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 6.2, 0]}>
            <boxGeometry args={[3.6, 1.4, 0.3]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#ef4444"
              emissiveIntensity={isNight ? 1.8 : 0.4}
            />
          </mesh>
          <mesh position={[0, 6.2, 0.16]}>
            <boxGeometry args={[3.2, 1.0, 0.04]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#facc15"
              emissiveIntensity={isNight ? 2.5 : 0.6}
            />
          </mesh>
        </group>

        {/* Warm Rest Stop Storefront Glass */}
        <mesh position={[-1.02, 1.9, 0]}>
          <boxGeometry args={[0.08, 2.8, 14]} />
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
