import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality, useGameStore } from '../../../stores/useGameStore';
import { getStationLayoutForStop, liveJourneyTelemetry } from '../../../stores/useJourneyStore';
import { QUALITY_PROFILES, ROAD_LAYOUT } from '../../config/environmentConfig';
import { BUS_DIMENSIONS } from '../../config/busConfig';
import type { BiomeId } from '../../config/biomeConfig';
import { sceneryLive } from '../scenery/sceneryLive';
import { VEHICLE_KINDS, VehicleKind, getTrafficAssets } from './trafficAssets';

/**
 * Ambient traffic on the dual carriageway (visual only, not synchronised between peers).
 * The bus never leaves x = 0, so every vehicle simply moves along Z relative to it:
 *   same direction: dz = (busSpeed - ownSpeed) · dt      oncoming: dz = (busSpeed + ownSpeed) · dt
 * A fixed pool is recycled; each vehicle kind renders as three InstancedMeshes.
 */

interface LaneDef {
  x: number;
  /** +1 travels with the bus (toward -Z), -1 is oncoming. */
  dir: 1 | -1;
  kinds: VehicleKind[];
  minKmh: number;
  maxKmh: number;
  /** Vehicles wanted in view at density 1. */
  base: number;
}

const LANE_OVERTAKE = 0;
const LANE_SHOULDER = 3;
const LANE_BUS = 4;

const LANES: LaneDef[] = [
  { x: ROAD_LAYOUT.overtakeLaneX, dir: 1, kinds: ['sedan', 'suv', 'sedan', 'van', 'coach', 'suv'], minKmh: 74, maxKmh: 98, base: 5 },
  { x: ROAD_LAYOUT.oncomingInnerX, dir: -1, kinds: ['sedan', 'suv', 'van', 'sedan', 'coach'], minKmh: 64, maxKmh: 92, base: 6 },
  { x: ROAD_LAYOUT.oncomingOuterX, dir: -1, kinds: ['truck', 'container', 'coach', 'motorbike', 'motorbike', 'van', 'truck'], minKmh: 44, maxKmh: 66, base: 6 },
  { x: ROAD_LAYOUT.shoulderLaneX, dir: 1, kinds: ['motorbike'], minKmh: 30, maxKmh: 46, base: 5 },
  { x: ROAD_LAYOUT.busLaneX, dir: 1, kinds: ['sedan', 'suv', 'truck', 'van'], minKmh: 58, maxKmh: 80, base: 2 },
];

const POOL_SIZE = 40;
const BIOME_DENSITY: Record<BiomeId, number> = { village: 0.55, town: 0.9, expressway: 1, suburb: 1.15, city: 1.35 };
const QUALITY_DENSITY: Record<GraphicsQuality, number> = { low: 0.5, medium: 0.8, high: 1 };
const BEHIND_Z = 72;
const BUS_HALF = BUS_DIMENSIONS.length / 2;
/** Where a shoulder rider swerves to when the kerb is blocked by a station (left of the bus). */
const SWERVE_X = -2.2;

interface Vehicle {
  active: boolean;
  kind: number;
  lane: number;
  x: number;
  targetX: number;
  z: number;
  /** Desired and current speed along its own travel direction (m/s). */
  desired: number;
  speed: number;
  halfLength: number;
  color: number;
}

const tmpColor = new THREE.Color();
const laneCounts = new Int32Array(LANES.length);
const kindCounts = new Int32Array(VEHICLE_KINDS.length);

function hexOf(color: string): number {
  return tmpColor.set(color).getHex();
}

export const TrafficSystem: React.FC = () => {
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const isNight = useGameStore((s) => s.timeOfDay === 'night');
  const assets = useMemo(() => getTrafficAssets(), []);
  const lightMaterial = useMemo(() => assets.lightMaterial.clone(), [assets]);
  useEffect(() => () => lightMaterial.dispose(), [lightMaterial]);
  useEffect(() => {
    // Lamps glow (and bloom) at night, read as plain lenses by day
    lightMaterial.toneMapped = !isNight;
    lightMaterial.color.setScalar(isNight ? 2.4 : 0.85);
  }, [lightMaterial, isNight]);

  // Per-kind palette pre-converted to hex so spawning never parses strings in the frame loop
  const palettes = useMemo(
    () => VEHICLE_KINDS.map((kind) => assets.defs[kind].palette.map(hexOf)),
    [assets]
  );
  const laneKinds = useMemo(() => LANES.map((lane) => lane.kinds.map((k) => VEHICLE_KINDS.indexOf(k))), []);

  const poolRef = useRef<Vehicle[]>([]);
  if (poolRef.current.length === 0) {
    for (let i = 0; i < POOL_SIZE; i++) {
      poolRef.current.push({
        active: false,
        kind: 0,
        lane: 0,
        x: 0,
        targetX: 0,
        z: 0,
        desired: 0,
        speed: 0,
        halfLength: 2,
        color: 0xffffff,
      });
    }
  }
  const meshRefs = useRef<(THREE.InstancedMesh | null)[][]>(VEHICLE_KINDS.map(() => [null, null, null]));
  const dummyRef = useRef(new THREE.Object3D());
  const colorRef = useRef(new THREE.Color());
  const seededRef = useRef(false);

  /** True when no active vehicle in `lane` is within `gap` metres of `z`. */
  const isLaneFree = (lane: number, z: number, gap: number): boolean => {
    const pool = poolRef.current;
    for (let i = 0; i < POOL_SIZE; i++) {
      const o = pool[i];
      if (o.active && o.lane === lane && Math.abs(o.z - z) < gap + o.halfLength) return false;
    }
    return true;
  };

  const spawn = (v: Vehicle, lane: number, z: number): void => {
    const def = LANES[lane];
    const kinds = laneKinds[lane];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const kindName = VEHICLE_KINDS[kind];
    const palette = palettes[kind];
    const isBike = kindName === 'motorbike';
    v.active = true;
    v.kind = kind;
    v.lane = lane;
    // Two-wheelers hug the outer edge of a shared lane
    v.x = def.x + (isBike && lane !== LANE_SHOULDER ? -0.95 : 0) + (Math.random() - 0.5) * (isBike ? 0.5 : 0.3);
    v.targetX = v.x;
    v.z = z;
    const slow = isBike || kindName === 'truck' || kindName === 'container' ? 0.85 : 1;
    v.desired = ((def.minKmh + Math.random() * (def.maxKmh - def.minKmh)) * slow) / 3.6;
    v.speed = v.desired;
    v.halfLength = assets.defs[kindName].length / 2;
    v.color = palette[Math.floor(Math.random() * palette.length)];
  };

  useFrame((_, rawDelta) => {
    const game = useGameStore.getState();
    const delta = Math.min(rawDelta, 0.1);
    const pool = poolRef.current;
    const busV = game.isPaused ? 0 : game.busSpeedKmh / 3.6;
    const aheadZ = -Math.min(QUALITY_PROFILES[game.graphicsQuality].cameraFar * 0.85, 460);

    // Station plot on the kerb (shoulder riders must go around it)
    const anchor = liveJourneyTelemetry.stationAnchorS;
    const hasStation = Number.isFinite(anchor);
    const stationZ = hasStation ? sceneryLive.traveledM - anchor : 0;
    const stationHalf = hasStation
      ? getStationLayoutForStop(liveJourneyTelemetry.stationStopIndex).halfLength
      : 0;

    // ---- First frame: scatter vehicles along the whole visible stretch ----
    if (!seededRef.current) {
      seededRef.current = true;
      let next = 0;
      for (let lane = 0; lane < LANES.length; lane++) {
        const want = Math.round(LANES[lane].base * QUALITY_DENSITY[game.graphicsQuality] * 0.7);
        for (let n = 0; n < want && next < POOL_SIZE; n++) {
          const z = aheadZ + Math.random() * (BEHIND_Z - aheadZ);
          if (lane === LANE_BUS && Math.abs(z) < 40) continue;
          if (lane === LANE_SHOULDER && hasStation && Math.abs(z - stationZ) < stationHalf + 30) continue;
          if (!isLaneFree(lane, z, 16)) continue;
          spawn(pool[next++], lane, z);
        }
      }
    }

    if (!game.isPaused) {
      // ---- Move, follow, recycle ----
      laneCounts.fill(0);
      for (let i = 0; i < POOL_SIZE; i++) {
        const v = pool[i];
        if (!v.active) continue;
        const dir = LANES[v.lane].dir;

        // Car following: never run into the vehicle ahead in the same lane
        let limit = v.desired;
        for (let j = 0; j < POOL_SIZE; j++) {
          if (j === i) continue;
          const o = pool[j];
          if (!o.active || o.lane !== v.lane) continue;
          const gap = (dir === 1 ? v.z - o.z : o.z - v.z) - v.halfLength - o.halfLength;
          if (gap > -1 && gap < 7 + v.speed * 0.7 && o.speed < limit) limit = o.speed;
        }

        if (v.lane === LANE_BUS) {
          if (v.z > 0) {
            // Behind the bus: tail it, or pull out and overtake once it slows right down
            const gap = v.z - v.halfLength - BUS_HALF;
            if (gap < 9 + v.speed * 0.6) {
              if (busV < 6 && gap > 3 && isLaneFree(LANE_OVERTAKE, v.z, 10)) {
                v.lane = LANE_OVERTAKE;
                v.targetX = LANES[LANE_OVERTAKE].x;
              } else if (busV < limit) {
                limit = busV;
              }
            }
          } else if (-v.z - v.halfLength - BUS_HALF < 30) {
            // Ahead of the bus: keep pulling away so the bus never rear-ends it
            limit = Math.max(limit, busV + 1.5);
          }
        } else if (v.lane === LANE_SHOULDER) {
          // The kerb is occupied by a station: swerve around the bus on its left
          const blocked =
            hasStation && v.z > stationZ - stationHalf - 34 && v.z < stationZ + stationHalf + 10;
          const want = blocked ? SWERVE_X : LANES[LANE_SHOULDER].x;
          if (want !== v.targetX) {
            const alongsideBus = Math.abs(v.z) < BUS_HALF + 4;
            if (!alongsideBus) v.targetX = want;
            else if (blocked && v.x > 1.5 && Math.abs(v.z - stationZ) < stationHalf) v.active = false;
          }
        }

        const accel = limit > v.speed ? 2.2 : 5;
        v.speed += THREE.MathUtils.clamp(limit - v.speed, -accel * delta, accel * delta);
        if (v.x !== v.targetX) {
          v.x += THREE.MathUtils.clamp(v.targetX - v.x, -2.4 * delta, 2.4 * delta);
        }
        v.z += (busV - dir * v.speed) * delta;

        if (v.z > BEHIND_Z + 8 || v.z < aheadZ - 30) v.active = false;
        if (v.active) laneCounts[v.lane] += 1;
      }

      // ---- Top up lanes that are below their target density ----
      const density = BIOME_DENSITY[sceneryLive.biome] * QUALITY_DENSITY[game.graphicsQuality];
      for (let lane = 0; lane < LANES.length; lane++) {
        const def = LANES[lane];
        if (laneCounts[lane] >= Math.round(def.base * density)) continue;
        // Enter from whichever end the vehicle will drift into view from
        const typical = (def.minKmh + def.maxKmh) / 2 / 3.6;
        const drift = busV - def.dir * typical;
        const z = drift > 0 ? aheadZ - 10 : BEHIND_Z;
        if (lane === LANE_BUS && z > 0 && busV < 8) continue;
        if (lane === LANE_SHOULDER && hasStation && Math.abs(z - stationZ) < stationHalf + 40) continue;
        if (!isLaneFree(lane, z, 22)) continue;
        // Stagger arrivals so vehicles do not enter as an evenly spaced convoy
        if (Math.random() > delta * 1.4) continue;
        for (let i = 0; i < POOL_SIZE; i++) {
          if (!pool[i].active) {
            spawn(pool[i], lane, z);
            // Faster traffic entering from behind must actually be faster than the bus
            if (z > 0 && def.dir === 1) pool[i].desired = Math.max(pool[i].desired, busV + 3);
            break;
          }
        }
      }
    }

    // ---- Write instance matrices / colours ----
    const dummy = dummyRef.current;
    const color = colorRef.current;
    kindCounts.fill(0);
    dummy.scale.set(1, 1, 1);
    for (let i = 0; i < POOL_SIZE; i++) {
      const v = pool[i];
      if (!v.active) continue;
      const meshes = meshRefs.current[v.kind];
      const idx = kindCounts[v.kind]++;
      const lateral = v.targetX - v.x;
      dummy.position.set(v.x, 0, v.z);
      dummy.rotation.set(0, (LANES[v.lane].dir === 1 ? 0 : Math.PI) - THREE.MathUtils.clamp(lateral, -1, 1) * 0.12, 0);
      dummy.updateMatrix();
      meshes[0]?.setMatrixAt(idx, dummy.matrix);
      meshes[1]?.setMatrixAt(idx, dummy.matrix);
      meshes[2]?.setMatrixAt(idx, dummy.matrix);
      meshes[0]?.setColorAt(idx, color.setHex(v.color));
    }
    for (let k = 0; k < VEHICLE_KINDS.length; k++) {
      const meshes = meshRefs.current[k];
      for (let p = 0; p < 3; p++) {
        const mesh = meshes[p];
        if (!mesh) continue;
        mesh.count = kindCounts[k];
        mesh.instanceMatrix.needsUpdate = true;
      }
      const bodyMesh = meshes[0];
      if (bodyMesh?.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
    }
  });

  const castShadow = graphicsQuality !== 'low';

  return (
    <group name="TrafficSystem">
      {VEHICLE_KINDS.map((kind, k) => {
        const def = assets.defs[kind];
        const setRef = (part: number) => (el: THREE.InstancedMesh | null) => {
          meshRefs.current[k][part] = el;
          if (el) {
            el.count = 0;
            if (part === 0 && !el.instanceColor) el.setColorAt(0, colorRef.current.set(0xffffff));
          }
        };
        return (
          <group key={kind}>
            <instancedMesh
              ref={setRef(0)}
              args={[def.body, assets.bodyMaterial, POOL_SIZE]}
              castShadow={castShadow}
              frustumCulled={false}
            />
            <instancedMesh
              ref={setRef(1)}
              args={[def.trim, assets.trimMaterial, POOL_SIZE]}
              castShadow={castShadow}
              frustumCulled={false}
            />
            <instancedMesh ref={setRef(2)} args={[def.lights, lightMaterial, POOL_SIZE]} frustumCulled={false} />
          </group>
        );
      })}
    </group>
  );
};
