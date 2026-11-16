import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT_CONFIG, QUALITY_PROFILES, ROAD_LAYOUT } from '../config/environmentConfig';
import { getAsphaltTexture, getDirtTexture } from '../materials/proceduralTextures';
import { useGameStore } from '../../stores/useGameStore';
import { getStationLayoutForStop, liveJourneyTelemetry } from '../../stores/useJourneyStore';
import { sceneryLive } from './scenery/sceneryLive';

const ASPHALT_TILE_M = 4;
const DIRT_TILE_M = 3;

/** Lane dividers that are dashed (between same-direction lanes). */
const DASHED_LINE_X = [ROAD_LAYOUT.rightLineX - ROAD_LAYOUT.laneWidth, ROAD_LAYOUT.oncomingInnerX - ROAD_LAYOUT.laneWidth / 2] as const;
const MARKER_COUNT = 8;
const GUARD_POST_COUNT = 20;
const MEDIAN_POST_COUNT = 40;

/** Z of the i-th looping roadside instance for the current scroll offset. */
function loopZ(index: number, spacing: number, scroll: number): number {
  const z = ENVIRONMENT_CONFIG.zMin + index * spacing + scroll;
  return z > ENVIRONMENT_CONFIG.zMax ? z - ENVIRONMENT_CONFIG.loopSpan : z;
}

/**
 * Dual carriageway: the bus keeps the right-hand lane (x = 0), with an overtaking lane, a
 * raised median and two oncoming lanes to its left, and a paved shoulder to its right.
 * Static strips never move; motion is conveyed by scrolling textures and looping instances.
 */
export const RoadSystem: React.FC = () => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const isNight = timeOfDay === 'night';

  // Private clones so repeat/offset do not leak to other users of the cached textures
  const asphaltTexture = useMemo(() => {
    const t = getAsphaltTexture().clone();
    t.needsUpdate = true;
    return t;
  }, []);
  const dirtTexture = useMemo(() => {
    const t = getDirtTexture().clone();
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(
    () => () => {
      asphaltTexture.dispose();
      dirtTexture.dispose();
    },
    [asphaltTexture, dirtTexture]
  );

  const dashMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const markerPostMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const markerTopMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const guardPostMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const medianPostMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const dummyRef = useRef(new THREE.Object3D());
  /** Shared scroll offset in [0, loopSpan) for every looping roadside instance. */
  const scrollRef = useRef(0);

  const dashCount = ENVIRONMENT_CONFIG.laneDashCount;
  const { zMax, loopSpan } = ENVIRONMENT_CONFIG;

  useFrame((_, rawDelta) => {
    const state = useGameStore.getState();
    const delta = Math.min(rawDelta, 0.1);
    const dz = state.isPaused ? 0 : ((state.busSpeedKmh * 1000) / 3600) * delta;

    // Scroll road textures so the surface itself conveys motion
    asphaltTexture.offset.y = (asphaltTexture.offset.y + dz / ASPHALT_TILE_M) % 1;
    dirtTexture.offset.y = (dirtTexture.offset.y + dz / DIRT_TILE_M) % 1;
    scrollRef.current = (scrollRef.current + dz) % loopSpan;
    const scroll = scrollRef.current;

    const dummy = dummyRef.current;
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);

    // Dashed lane dividers (two lines share one instanced mesh)
    if (dashMeshRef.current) {
      const mesh = dashMeshRef.current;
      for (let line = 0; line < DASHED_LINE_X.length; line++) {
        for (let i = 0; i < dashCount; i++) {
          dummy.position.set(DASHED_LINE_X[line], 0.012, loopZ(i, ENVIRONMENT_CONFIG.laneDashSpacing, scroll));
          dummy.updateMatrix();
          mesh.setMatrixAt(line * dashCount + i, dummy.matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Kilometre posts on the right verge, hidden where a station occupies the kerb
    if (markerPostMeshRef.current && markerTopMeshRef.current) {
      const anchor = liveJourneyTelemetry.stationAnchorS;
      const hasStation = Number.isFinite(anchor);
      const stationZ = hasStation ? sceneryLive.traveledM - anchor : 0;
      const stationHalf = hasStation
        ? getStationLayoutForStop(liveJourneyTelemetry.stationStopIndex).halfLength + 2
        : 0;
      const markerX = ROAD_LAYOUT.rightVergeX - 0.25;
      const markerSpacing = loopSpan / MARKER_COUNT;
      for (let i = 0; i < MARKER_COUNT; i++) {
        const z = loopZ(i, markerSpacing, scroll);
        const sink = hasStation && Math.abs(z - stationZ) < stationHalf ? -5 : 0;
        dummy.position.set(markerX, 0.35 + sink, z);
        dummy.updateMatrix();
        markerPostMeshRef.current.setMatrixAt(i, dummy.matrix);
        dummy.position.set(markerX, 0.78 + sink, z);
        dummy.updateMatrix();
        markerTopMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      markerPostMeshRef.current.instanceMatrix.needsUpdate = true;
      markerTopMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Guardrail posts along the far (left) edge
    if (guardPostMeshRef.current) {
      const spacing = loopSpan / GUARD_POST_COUNT;
      for (let i = 0; i < GUARD_POST_COUNT; i++) {
        dummy.position.set(ROAD_LAYOUT.leftPavedX - 0.4, 0.38, loopZ(i, spacing, scroll));
        dummy.updateMatrix();
        guardPostMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      guardPostMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Barrier posts on the median
    if (medianPostMeshRef.current) {
      const spacing = loopSpan / MEDIAN_POST_COUNT;
      for (let i = 0; i < MEDIAN_POST_COUNT; i++) {
        dummy.position.set(ROAD_LAYOUT.medianX, 0.62, loopZ(i, spacing, scroll));
        dummy.updateMatrix();
        medianPostMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      medianPostMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // Road extends from just behind the chase camera to the far view distance
  const roadLen = QUALITY_PROFILES[graphicsQuality].cameraFar + zMax + 40;
  const centerZ = (zMax + 40 - QUALITY_PROFILES[graphicsQuality].cameraFar) / 2;
  const pavedWidth = ROAD_LAYOUT.rightPavedX - ROAD_LAYOUT.leftPavedX;
  const pavedCenterX = (ROAD_LAYOUT.rightPavedX + ROAD_LAYOUT.leftPavedX) / 2;
  const vergeWidth = ROAD_LAYOUT.rightVergeX - ROAD_LAYOUT.leftVergeX;
  const vergeCenterX = (ROAD_LAYOUT.rightVergeX + ROAD_LAYOUT.leftVergeX) / 2;
  const medianHalf = ROAD_LAYOUT.medianWidth / 2;

  useEffect(() => {
    asphaltTexture.repeat.set(pavedWidth / ASPHALT_TILE_M, roadLen / ASPHALT_TILE_M);
    dirtTexture.repeat.set(vergeWidth / DIRT_TILE_M, roadLen / DIRT_TILE_M);
  }, [asphaltTexture, dirtTexture, roadLen, pavedWidth, vergeWidth]);

  const lineMaterialProps = { roughness: 0.4 } as const;
  const solidLines: { x: number; color: string }[] = [
    { x: ROAD_LAYOUT.rightLineX, color: '#f1f5f9' },
    { x: ROAD_LAYOUT.medianX + medianHalf + 0.28, color: '#facc15' },
    { x: ROAD_LAYOUT.medianX - medianHalf - 0.28, color: '#facc15' },
    { x: ROAD_LAYOUT.leftLineX, color: '#f1f5f9' },
  ];

  return (
    <group name="RoadSystem">
      {/* Gravel verges */}
      <mesh position={[vergeCenterX, -0.02, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[vergeWidth, roadLen]} />
        <meshStandardMaterial map={dirtTexture} color={isNight ? '#3a3631' : '#8c8478'} roughness={0.95} />
      </mesh>

      {/* Asphalt surface (texture scrolls with bus speed) */}
      <mesh position={[pavedCenterX, 0.002, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[pavedWidth, roadLen]} />
        <meshStandardMaterial map={asphaltTexture} roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Solid edge / median lines */}
      {solidLines.map((line) => (
        <mesh key={line.x} position={[line.x, 0.012, centerZ]}>
          <boxGeometry args={[0.15, 0.004, roadLen]} />
          <meshStandardMaterial color={line.color} {...lineMaterialProps} />
        </mesh>
      ))}

      {/* Raised median kerb with a low steel barrier */}
      <mesh position={[ROAD_LAYOUT.medianX, 0.1, centerZ]} receiveShadow>
        <boxGeometry args={[ROAD_LAYOUT.medianWidth, 0.2, roadLen]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.9} />
      </mesh>
      <mesh position={[ROAD_LAYOUT.medianX, 0.74, centerZ]} castShadow>
        <boxGeometry args={[0.08, 0.26, roadLen]} />
        <meshStandardMaterial color="#b6c0cc" metalness={0.7} roughness={0.32} />
      </mesh>
      <instancedMesh ref={medianPostMeshRef} args={[undefined, undefined, MEDIAN_POST_COUNT]}>
        <boxGeometry args={[0.1, 0.9, 0.1]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
      </instancedMesh>

      {/* Guardrail along the far edge of the oncoming carriageway */}
      <mesh position={[ROAD_LAYOUT.leftPavedX - 0.4, 0.52, centerZ]} castShadow>
        <boxGeometry args={[0.07, 0.24, roadLen]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.32} />
      </mesh>
      <instancedMesh ref={guardPostMeshRef} args={[undefined, undefined, GUARD_POST_COUNT]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.76, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.65} roughness={0.4} />
      </instancedMesh>

      {/* Dashed lane dividers */}
      <instancedMesh ref={dashMeshRef} args={[undefined, undefined, dashCount * DASHED_LINE_X.length]} receiveShadow>
        <boxGeometry args={[0.15, 0.005, 3.2]} />
        <meshStandardMaterial
          color="#f8fafc"
          emissive="#e2e8f0"
          emissiveIntensity={isNight ? 0.3 : 0.03}
          roughness={0.4}
        />
      </instancedMesh>

      {/* Kilometre posts (white base + red cap) */}
      <instancedMesh ref={markerPostMeshRef} args={[undefined, undefined, MARKER_COUNT]} castShadow>
        <boxGeometry args={[0.24, 0.7, 0.24]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={markerTopMeshRef} args={[undefined, undefined, MARKER_COUNT]} castShadow>
        <boxGeometry args={[0.25, 0.22, 0.25]} />
        <meshStandardMaterial color="#dc2626" roughness={0.45} />
      </instancedMesh>
    </group>
  );
};
