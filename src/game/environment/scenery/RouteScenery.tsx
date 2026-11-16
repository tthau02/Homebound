import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../../stores/useGameStore';
import { ENVIRONMENT_CONFIG, QUALITY_PROFILES, ROAD_LAYOUT } from '../../config/environmentConfig';
import { getStationLayoutForStop, liveJourneyTelemetry } from '../../../stores/useJourneyStore';
import {
  BIOMES,
  BiomeId,
  CHUNK_LENGTH,
  LandmarkDef,
  ROUTE_LANDMARKS,
  SpawnRule,
  getBiomeAtKm,
} from '../../config/biomeConfig';
import { createRng, getGrassTexture } from '../../materials/proceduralTextures';
import { AssetKind, createAssetLibrary, windUniforms } from './sceneryAssets';
import { RouteLandmark } from './RouteLandmark';
import { sceneryLive } from './sceneryLive';

interface SceneryItem {
  kind: AssetKind;
  x: number;
  y: number;
  /** Along-route position in metres (increases in the bus travel direction). */
  s: number;
  rotY: number;
  sx: number;
  sy: number;
  sz: number;
  c0: number;
  c1: number;
}

interface ChunkData {
  biome: BiomeId;
  items: SceneryItem[];
}

export interface ActiveLandmark {
  def: LandmarkDef;
  s: number;
}


const BEHIND_M = ENVIRONMENT_CONFIG.zMax + 20;
const LANDMARK_CLEAR_RADIUS = 34;

const colorCache = new Map<string, number>();
function hexOf(color: string): number {
  let v = colorCache.get(color);
  if (v === undefined) {
    v = new THREE.Color(color).getHex();
    colorCache.set(color, v);
  }
  return v;
}

function randRange(rng: () => number, range: [number, number] | undefined, fallback: number): number {
  if (!range) return fallback;
  return range[0] + rng() * (range[1] - range[0]);
}

function generateChunk(
  chunkIndex: number,
  km: number,
  density: number,
  footprintOf: (kind: AssetKind) => number
): ChunkData {
  const biome = getBiomeAtKm(km);
  const prevBiome = getBiomeAtKm(Math.max(0, km - 2.5));
  const rng = createRng(chunkIndex * 7919 + 104729);
  const items: SceneryItem[] = [];
  const placed: { x: number; s: number; r: number }[] = [];
  const chunkStart = chunkIndex * CHUNK_LENGTH;

  const rulesFor = (id: BiomeId) => BIOMES[id].rules;
  const ruleSets: SpawnRule[][] =
    biome === prevBiome ? [rulesFor(biome)] : [rulesFor(biome), rulesFor(prevBiome)];
  const blendWeight = ruleSets.length > 1 ? 0.5 : 1;

  for (const rules of ruleSets) {
    for (const rule of rules) {
      const sides = rule.side === 'both' ? [-1, 1] : rule.side === 'left' ? [-1] : [1];
      for (const side of sides) {
        const scaled = rule.continuous || rule.ground ? rule.perChunk : rule.perChunk * density;
        const weighted = scaled * (rule.continuous ? 1 : blendWeight);
        const count = Math.floor(weighted) + (rng() < weighted % 1 ? 1 : 0);
        if (rule.continuous && blendWeight < 1 && rules !== ruleSets[0]) continue;

        for (let n = 0; n < count; n++) {
          let accepted: SceneryItem | null = null;
          for (let attempt = 0; attempt < 5 && !accepted; attempt++) {
            const absX = rule.minX + rng() * (rule.maxX - rule.minX);
            // Biome rules are measured from the bus lane; the left side sits beyond the
            // overtaking lane, median and oncoming carriageway.
            const x = side > 0 ? absX : -(absX + ROAD_LAYOUT.leftSceneryOffset);
            const s = rule.continuous
              ? chunkStart + ((n + 0.5) / count) * CHUNK_LENGTH
              : chunkStart + rng() * CHUNK_LENGTH;

            const uniform = randRange(rng, rule.scale, 1);
            const sx = rule.scaleX ? randRange(rng, rule.scaleX, 1) : uniform;
            const sy = rule.scaleY ? randRange(rng, rule.scaleY, 1) : uniform;
            const sz = rule.scaleZ ? randRange(rng, rule.scaleZ, 1) : uniform;

            if (!rule.ground) {
              const r = footprintOf(rule.kind) * Math.max(sx, sz);
              let collides = false;
              for (const p of placed) {
                const dx = p.x - x;
                const ds = p.s - s;
                if (dx * dx + ds * ds < (p.r + r) * (p.r + r)) {
                  collides = true;
                  break;
                }
              }
              if (collides) continue;
              placed.push({ x, s, r });
            }

            const rotY = rule.ground
              ? 0
              : rule.faceRoad
                ? (side < 0 ? Math.PI / 2 : -Math.PI / 2) + (rng() - 0.5) * 0.08
                : rng() * Math.PI * 2;
            const palette = rule.palette;
            const palette2 = rule.palette2;
            accepted = {
              kind: rule.kind,
              x,
              y: rule.y ?? 0,
              s,
              rotY,
              sx,
              sy,
              sz,
              c0: palette ? hexOf(palette[Math.floor(rng() * palette.length)]) : 0xffffff,
              c1: palette2
                ? hexOf(palette2[Math.floor(rng() * palette2.length)])
                : palette
                  ? hexOf(palette[Math.floor(rng() * palette.length)])
                  : 0xffffff,
            };
          }
          if (accepted) items.push(accepted);
        }
      }
    }
  }

  return { biome, items };
}

/**
 * Route-driven, chunk-streamed roadside scenery.
 * - World is split into CHUNK_LENGTH segments generated from a seeded RNG and the biome at
 *   the current route km, so scenery changes as the journey progresses instead of looping.
 * - All instances live in one container group; per frame only `group.position.z` moves.
 *   Instance matrices are rebuilt only when a chunk enters/leaves the window (~every 5 s).
 */
export const RouteScenery: React.FC = () => {
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const isNight = timeOfDay === 'night';
  const profile = QUALITY_PROFILES[graphicsQuality];
  const aheadM = profile.cameraFar * 0.92;

  const lib = useMemo(() => createAssetLibrary(), []);
  useEffect(() => () => lib.dispose(), [lib]);

  const kinds = useMemo(() => Object.keys(lib.defs) as AssetKind[], [lib]);

  // Instance capacity per kind: worst-case items per chunk across biomes × active chunks.
  const capacity = useMemo(() => {
    const perChunk: Partial<Record<AssetKind, number>> = {};
    for (const biome of Object.values(BIOMES)) {
      const local: Partial<Record<AssetKind, number>> = {};
      for (const rule of biome.rules) {
        const sides = rule.side === 'both' ? 2 : 1;
        local[rule.kind] = (local[rule.kind] ?? 0) + (Math.ceil(rule.perChunk) + 1) * sides;
      }
      for (const k of Object.keys(local) as AssetKind[]) {
        perChunk[k] = Math.max(perChunk[k] ?? 0, local[k] ?? 0);
      }
    }
    const chunks = Math.ceil((QUALITY_PROFILES.high.cameraFar + BEHIND_M) / CHUNK_LENGTH) + 2;
    const result = {} as Record<AssetKind, number>;
    for (const k of kinds) result[k] = Math.max(1, (perChunk[k] ?? 0) * chunks * 2);
    return result;
  }, [kinds]);

  const containerRef = useRef<THREE.Group | null>(null);
  const meshRefs = useRef<Partial<Record<AssetKind, (THREE.InstancedMesh | null)[]>>>({});
  const chunksRef = useRef(new Map<number, ChunkData>());
  const windowRef = useRef({ first: Number.NaN, last: Number.NaN });
  const anchorRef = useRef(0);
  const dummyRef = useRef(new THREE.Object3D());
  const tmpColorRef = useRef(new THREE.Color());
  const groundMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const groundTargetRef = useRef(new THREE.Color(BIOMES.village.groundColor));
  const lastKmRef = useRef(0);
  const spawnedLandmarksRef = useRef(new Set<string>());
  /** Station anchor the instances were last built against (NaN = none). */
  const builtStationRef = useRef(Number.NaN);
  const [landmarks, setLandmarks] = useState<ActiveLandmark[]>([]);

  const groundTexture = useMemo(() => {
    const t = getGrassTexture().clone();
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => groundTexture.dispose(), [groundTexture]);

  const groundLength = aheadM + BEHIND_M + 120;
  const groundWidth = 1600;
  const grassTile = 6;
  useEffect(() => {
    groundTexture.repeat.set(groundWidth / grassTile, groundLength / grassTile);
  }, [groundTexture, groundLength]);

  // Night glow on building windows
  useEffect(() => {
    for (const mat of lib.nightGlowMaterials) {
      mat.emissiveIntensity = isNight ? 1.6 : 0;
    }
  }, [lib, isNight]);

  // Force a full rebuild when the quality profile (density / range) changes
  useEffect(() => {
    chunksRef.current.clear();
    windowRef.current.first = Number.NaN;
  }, [graphicsQuality]);

  const rebuildInstances = () => {
    const dummy = dummyRef.current;
    const color = tmpColorRef.current;
    const anchor = sceneryLive.traveledM;
    anchorRef.current = anchor;
    const counts: Partial<Record<AssetKind, number>> = {};

    // Keep the kerb side clear where a station set piece stands
    const stationS = liveJourneyTelemetry.stationAnchorS;
    builtStationRef.current = stationS;
    const hasStation = Number.isFinite(stationS);
    const stationLayout = hasStation ? getStationLayoutForStop(liveJourneyTelemetry.stationStopIndex) : null;
    const clearHalf = stationLayout ? stationLayout.halfLength + 4 : 0;
    const clearDepth = stationLayout ? stationLayout.depth + 3 : 0;

    const { first, last } = windowRef.current;
    for (let c = first; c <= last; c++) {
      const chunk = chunksRef.current.get(c);
      if (!chunk) continue;
      for (const item of chunk.items) {
        const meshes = meshRefs.current[item.kind];
        if (!meshes) continue;
        if (hasStation && item.x > 0) {
          const radius = lib.defs[item.kind].footprint * Math.max(item.sx, item.sz) * 0.5;
          if (item.x - radius < clearDepth && Math.abs(item.s - stationS) < clearHalf + radius) continue;
        }
        const idx = counts[item.kind] ?? 0;
        if (idx >= capacity[item.kind]) continue;
        counts[item.kind] = idx + 1;

        dummy.position.set(item.x, item.y, -(item.s - anchor));
        dummy.rotation.set(0, item.rotY, 0);
        dummy.scale.set(item.sx, item.sy, item.sz);
        dummy.updateMatrix();

        const parts = lib.defs[item.kind].parts;
        for (let p = 0; p < meshes.length; p++) {
          const mesh = meshes[p];
          if (!mesh) continue;
          mesh.setMatrixAt(idx, dummy.matrix);
          if (parts[p].tintable) {
            color.setHex(p === 0 ? item.c0 : item.c1);
            mesh.setColorAt(idx, color);
          }
        }
      }
    }

    for (const kind of kinds) {
      const meshes = meshRefs.current[kind];
      if (!meshes) continue;
      const n = counts[kind] ?? 0;
      for (const mesh of meshes) {
        if (!mesh) continue;
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
  };

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const game = useGameStore.getState();
    windUniforms.uTime.value = state.clock.elapsedTime;

    if (!game.isPaused) {
      sceneryLive.traveledM += ((game.busSpeedKmh * 1000) / 3600) * delta;
    }
    const traveled = sceneryLive.traveledM;
    const km = game.distanceTraveledKm;

    // Journey restarted → forget landmarks so they can appear again
    if (km + 1 < lastKmRef.current) spawnedLandmarksRef.current.clear();
    lastKmRef.current = km;

    // ---- Chunk window maintenance ----
    const first = Math.floor((traveled - BEHIND_M) / CHUNK_LENGTH);
    const last = Math.floor((traveled + aheadM) / CHUNK_LENGTH);
    const win = windowRef.current;
    if (first !== win.first || last !== win.last) {
      const isInitial = Number.isNaN(win.first);
      const chunks = chunksRef.current;
      for (const key of Array.from(chunks.keys())) {
        if (key < first || key > last) chunks.delete(key);
      }
      const footprintOf = (kind: AssetKind) => lib.defs[kind].footprint;
      let newLandmark: ActiveLandmark | null = null;

      for (let c = first; c <= last; c++) {
        if (chunks.has(c)) continue;
        const chunk = generateChunk(c, km, profile.sceneryDensity, footprintOf);

        // Spawn the next due landmark on the horizon chunk
        if (!isInitial && c === last && !newLandmark) {
          const due = ROUTE_LANDMARKS.find(
            (l) => !spawnedLandmarksRef.current.has(l.id) && km + 2 >= l.km && km - 4 <= l.km
          );
          if (due) {
            spawnedLandmarksRef.current.add(due.id);
            const s = c * CHUNK_LENGTH + CHUNK_LENGTH / 2;
            newLandmark = { def: due, s };
            if (due.kind !== 'skylineTower') {
              chunk.items = chunk.items.filter(
                (it) => Math.abs(it.s - s) > LANDMARK_CLEAR_RADIUS || Math.abs(it.x) > 150
              );
            }
          }
        }
        chunks.set(c, chunk);
      }

      win.first = first;
      win.last = last;
      rebuildInstances();

      if (newLandmark) {
        const added = newLandmark;
        setLandmarks((prev) => [
          ...prev.filter((l) => l.def.id !== added.def.id && traveled - l.s < BEHIND_M + 200),
          added,
        ]);
      }
    }

    // A station appeared / disappeared: rebuild once so its plot is free of scenery
    if (!Object.is(builtStationRef.current, liveJourneyTelemetry.stationAnchorS)) {
      rebuildInstances();
    }

    // ---- Per-frame: slide the container, scroll ground, blend biome tint ----
    if (containerRef.current) {
      containerRef.current.position.z = traveled - anchorRef.current;
    }
    groundTexture.offset.y = (traveled / grassTile) % 1;

    const biome = getBiomeAtKm(km);
    sceneryLive.biome = biome;
    if (groundMatRef.current) {
      const def = BIOMES[biome];
      groundTargetRef.current.set(game.timeOfDay === 'night' ? def.nightGroundColor : def.groundColor);
      groundMatRef.current.color.lerp(groundTargetRef.current, 1 - Math.exp(-0.8 * delta));
    }
  });

  const groundCenterZ = (BEHIND_M - aheadM) / 2;

  return (
    <group name="RouteScenery">
      {/* Ground plane (biome-tinted grass, scrolls with travel) */}
      <mesh position={[0, -0.06, groundCenterZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[groundWidth, groundLength]} />
        <meshStandardMaterial
          ref={groundMatRef}
          map={groundTexture}
          color={BIOMES.village.groundColor}
          roughness={0.95}
        />
      </mesh>

      <group ref={containerRef}>
        {kinds.map((kind) =>
          lib.defs[kind].parts.map((part, p) => (
            <instancedMesh
              key={`${kind}-${p}-${capacity[kind]}`}
              ref={(el) => {
                const list = meshRefs.current[kind] ?? [];
                list[p] = el;
                meshRefs.current[kind] = list;
                if (el) {
                  el.count = 0;
                  // Ensure instanceColor exists for tintable parts
                  if (part.tintable && !el.instanceColor) {
                    el.setColorAt(0, tmpColorRef.current.set(0xffffff));
                  }
                }
              }}
              args={[part.geometry, part.material, capacity[kind]]}
              castShadow={part.castShadow && graphicsQuality !== 'low'}
              receiveShadow={kind !== 'karst' && kind !== 'hill'}
              frustumCulled={false}
            />
          ))
        )}
      </group>

      {landmarks.map((l) => (
        <RouteLandmark key={l.def.id} landmark={l} />
      ))}
    </group>
  );
};
