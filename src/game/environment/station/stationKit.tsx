import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getSignTexture } from '../../materials/proceduralTextures';
import { VehicleKind, getTrafficAssets } from '../traffic/trafficAssets';

/**
 * Building blocks for station set pieces.
 * Everything is assembled from four shared unit geometries and colour-cached materials,
 * so a whole station adds no per-mesh GPU buffers and only a handful of shader programs.
 */

export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
export const UNIT_CYLINDER = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
export const UNIT_CONE = new THREE.ConeGeometry(0.5, 1, 14);
export const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 12, 9);
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);

type Vec3 = [number, number, number];

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/** Cached standard material. `glow` > 0 makes the surface emit its own colour. */
export function mat(color: string, roughness = 0.8, metalness = 0, glow = 0, opacity = 1): THREE.MeshStandardMaterial {
  const key = `${color}|${roughness}|${metalness}|${glow}|${opacity}`;
  let m = materialCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive: glow > 0 ? color : '#000000',
      emissiveIntensity: glow,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
    });
    materialCache.set(key, m);
  }
  return m;
}

interface ShapeProps {
  /** Centre position. */
  p: Vec3;
  /** Size (box: w, h, d · cylinder / cone: diameter, height, diameter). */
  s: Vec3;
  c: string;
  rough?: number;
  metal?: number;
  glow?: number;
  opacity?: number;
  rot?: Vec3;
  shadow?: boolean;
}

function shape(geometry: THREE.BufferGeometry) {
  const Shape: React.FC<ShapeProps> = ({ p, s, c, rough, metal, glow, opacity, rot, shadow }) => (
    <mesh
      geometry={geometry}
      material={mat(c, rough, metal, glow, opacity)}
      position={p}
      scale={s}
      rotation={rot}
      castShadow={shadow}
      receiveShadow
    />
  );
  return Shape;
}

export const Box = shape(UNIT_BOX);
export const Cyl = shape(UNIT_CYLINDER);
export const Cone = shape(UNIT_CONE);
export const Ball = shape(UNIT_SPHERE);

const signMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

type Facing = 'road' | 'ahead' | 'behind' | 'away';
const FACING_ROT: Record<Facing, number> = {
  /** Readable from the bus windows (normal toward -X). */
  road: -Math.PI / 2,
  /** Readable from the approaching bus (normal toward +Z). */
  ahead: 0,
  behind: Math.PI,
  away: Math.PI / 2,
};

interface SignProps {
  lines: string[];
  p: Vec3;
  /** Width and height in metres. */
  w: number;
  h: number;
  bg?: string;
  fg?: string;
  face?: Facing;
  night?: boolean;
  /** Draw a matching solid backing board. */
  backing?: boolean;
}

/** Text panel (canvas texture, cached per text). Glows softly at night. */
export const Sign: React.FC<SignProps> = ({ lines, p, w, h, bg = '#1d4ed8', fg = '#ffffff', face = 'road', night = false, backing = true }) => {
  const aspect = Math.max(1, Math.round((w / h) * 2) / 2);
  const material = useMemo(() => {
    const key = `${lines.join('|')}|${bg}|${fg}|${aspect}|${night ? 'n' : 'd'}`;
    let m = signMaterialCache.get(key);
    if (!m) {
      const map = getSignTexture(lines, bg, fg, aspect);
      m = new THREE.MeshStandardMaterial({
        map,
        emissiveMap: map,
        emissive: '#ffffff',
        emissiveIntensity: night ? 0.85 : 0.1,
        roughness: 0.6,
      });
      signMaterialCache.set(key, m);
    }
    return m;
    // `lines` is compared by content through the joined key
  }, [lines.join('|'), bg, fg, aspect, night]);
  const rotY = FACING_ROT[face];
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh geometry={UNIT_PLANE} material={material} scale={[w, h, 1]} position={[0, 0, 0.06]} />
      {backing && <mesh geometry={UNIT_BOX} material={mat(bg, 0.7)} scale={[w + 0.12, h + 0.12, 0.1]} castShadow />}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Street furniture (all positioned on the pavement surface, y = 0)
// ---------------------------------------------------------------------------

export const LampPost: React.FC<{ x: number; z: number; night: boolean; height?: number }> = ({ x, z, night, height = 4.6 }) => (
  <group position={[x, 0, z]}>
    <Cyl p={[0, height / 2, 0]} s={[0.12, height, 0.12]} c="#475569" metal={0.7} rough={0.35} shadow />
    <Box p={[-0.35, height, 0]} s={[0.9, 0.07, 0.07]} c="#475569" metal={0.7} rough={0.35} />
    <Box p={[-0.72, height - 0.06, 0]} s={[0.42, 0.1, 0.22]} c={night ? '#fde68a' : '#e2e8f0'} glow={night ? 3 : 0} />
  </group>
);

export const TreePlanter: React.FC<{ x: number; z: number; scale?: number }> = ({ x, z, scale = 1 }) => (
  <group position={[x, 0, z]} scale={scale}>
    <Box p={[0, 0.2, 0]} s={[1.0, 0.4, 1.0]} c="#b8b2a7" shadow />
    <Box p={[0, 0.41, 0]} s={[0.84, 0.03, 0.84]} c="#4b3a2a" rough={1} />
    <Cyl p={[0, 1.5, 0]} s={[0.2, 2.3, 0.2]} c="#6b4a2e" rough={0.95} shadow />
    <Ball p={[0, 3.2, 0]} s={[2.4, 2.0, 2.4]} c="#3f7d3a" rough={0.9} shadow />
    <Ball p={[0.5, 3.8, 0.3]} s={[1.5, 1.3, 1.5]} c="#4f9446" rough={0.9} shadow />
    <Ball p={[-0.55, 3.6, -0.3]} s={[1.4, 1.2, 1.4]} c="#35702f" rough={0.9} shadow />
  </group>
);

export const Bin: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <group position={[x, 0, z]}>
    <Cyl p={[0, 0.42, 0]} s={[0.42, 0.84, 0.42]} c="#15803d" rough={0.6} shadow />
    <Cyl p={[0, 0.86, 0]} s={[0.46, 0.06, 0.46]} c="#14532d" rough={0.6} />
  </group>
);

/** Slatted bench along Z, backrest on the +X side (sitters face the road). */
export const Bench: React.FC<{ x: number; z: number; length?: number }> = ({ x, z, length = 2.4 }) => (
  <group position={[x, 0, z]}>
    <Box p={[0, 0.4, 0]} s={[0.46, 0.06, length]} c="#8a5a35" rough={0.7} shadow />
    <Box p={[0.24, 0.72, 0]} s={[0.06, 0.4, length]} c="#7a4e2d" rough={0.7} shadow />
    {[-1, 1].map((e) => (
      <Box key={e} p={[0.02, 0.2, e * (length / 2 - 0.15)]} s={[0.4, 0.4, 0.07]} c="#3f3f46" metal={0.5} rough={0.5} />
    ))}
  </group>
);

interface ShelterProps {
  x: number;
  z: number;
  night: boolean;
  /** City stops get a glass back wall with an advertising light box. */
  glass?: boolean;
  adLines?: string[];
}

/** Bus shelter: roof on posts, bench, back wall on the +X side. Footprint ≈ 1.6 × 4.6 m. */
export const Shelter: React.FC<ShelterProps> = ({ x, z, night, glass = false, adLines }) => (
  <group position={[x, 0, z]}>
    {[-2.1, 0, 2.1].map((pz) => (
      <Cyl key={pz} p={[0.62, 1.3, pz]} s={[0.09, 2.6, 0.09]} c="#334155" metal={0.75} rough={0.3} shadow />
    ))}
    <Box p={[-0.05, 2.66, 0]} s={[1.9, 0.1, 4.7]} c={glass ? '#0f766e' : '#b91c1c'} rough={0.5} shadow />
    <Box p={[-0.05, 2.74, 0]} s={[1.7, 0.06, 4.5]} c="#e2e8f0" rough={0.4} />
    {glass ? (
      <Box p={[0.62, 1.35, -0.55]} s={[0.05, 1.9, 3.0]} c="#9bd3e6" rough={0.1} metal={0.2} opacity={0.35} />
    ) : (
      <Box p={[0.62, 1.35, 0]} s={[0.06, 1.9, 4.2]} c="#e7e2d6" rough={0.8} shadow />
    )}
    {glass && adLines && (
      <Sign lines={adLines} p={[0.56, 1.4, 1.55]} w={1.1} h={1.7} bg="#f59e0b" fg="#1f2937" face="road" night={night} />
    )}
    <Bench x={0.32} z={-0.4} length={2.8} />
    {night && <Box p={[-0.05, 2.58, 0]} s={[0.14, 0.04, 3.6]} c="#fef9c3" glow={2.6} />}
  </group>
);

/** Round table with a parasol and four stools (stools at ±0.85 m on X and Z). */
export const UmbrellaTable: React.FC<{ x: number; z: number; color?: string }> = ({ x, z, color = '#dc2626' }) => (
  <group position={[x, 0, z]}>
    <Cyl p={[0, 0.66, 0]} s={[0.95, 0.05, 0.95]} c="#f1f5f9" rough={0.5} shadow />
    <Cyl p={[0, 0.33, 0]} s={[0.08, 0.66, 0.08]} c="#64748b" metal={0.6} />
    <Cyl p={[0, 1.45, 0]} s={[0.05, 1.6, 0.05]} c="#94a3b8" metal={0.6} />
    <Cone p={[0, 2.35, 0]} s={[2.7, 0.55, 2.7]} c={color} rough={0.7} shadow />
    {([[-0.85, 0], [0.85, 0], [0, -0.95], [0, 0.95]] as const).map(([sx, sz]) => (
      <Cyl key={`${sx}-${sz}`} p={[sx, 0.2, sz]} s={[0.34, 0.4, 0.34]} c="#2563eb" rough={0.6} shadow />
    ))}
  </group>
);

interface CartProps {
  x: number;
  z: number;
  night: boolean;
  lines: string[];
  body?: string;
  canopy?: string;
  signBg?: string;
  /** Extra detail on the counter. */
  goods?: 'bread' | 'cane' | 'baskets' | 'drinks';
}

/** Vendor cart: counter facing the road (-X), canopy and name board. Footprint ≈ 1.2 × 2.1 m. */
export const StallCart: React.FC<CartProps> = ({ x, z, night, lines, body = '#0f766e', canopy = '#f59e0b', signBg = '#b91c1c', goods = 'drinks' }) => (
  <group position={[x, 0, z]}>
    <Box p={[0, 0.5, 0]} s={[1.1, 0.8, 2.0]} c={body} rough={0.55} shadow />
    <Box p={[0, 0.93, 0]} s={[1.2, 0.06, 2.1]} c="#e5e7eb" metal={0.7} rough={0.25} />
    {[-0.9, 0.9].map((wz) => (
      <Cyl key={wz} p={[0.35, 0.16, wz]} s={[0.32, 0.08, 0.32]} c="#18181b" rot={[0, 0, Math.PI / 2]} />
    ))}
    {[-0.95, 0.95].map((pz) => (
      <Cyl key={pz} p={[0.5, 1.6, pz]} s={[0.05, 1.3, 0.05]} c="#64748b" metal={0.6} />
    ))}
    <Box p={[-0.1, 2.3, 0]} s={[1.9, 0.07, 2.5]} c={canopy} rough={0.7} shadow rot={[0, 0, 0.1]} />
    <Sign lines={lines} p={[-0.62, 1.98, 0]} w={2.0} h={0.42} bg={signBg} face="road" night={night} backing={false} />
    {goods === 'bread' && (
      <>
        <Box p={[-0.1, 1.2, 0.3]} s={[0.7, 0.5, 1.1]} c="#bfe3ee" rough={0.1} opacity={0.35} />
        {[0.0, 0.25, 0.5].map((bz) => (
          <Cyl key={bz} p={[-0.1, 1.05, bz]} s={[0.1, 0.42, 0.1]} c="#c98b3c" rot={[0, 0, Math.PI / 2]} />
        ))}
      </>
    )}
    {goods === 'cane' && (
      <>
        <Box p={[0.05, 1.22, 0.45]} s={[0.45, 0.5, 0.5]} c="#94a3b8" metal={0.8} rough={0.25} shadow />
        {[-0.08, 0, 0.08].map((cx) => (
          <Cyl key={cx} p={[cx - 0.2, 1.5, -0.6]} s={[0.06, 1.2, 0.06]} c="#84a83a" rot={[0.12, 0, 0.12]} />
        ))}
      </>
    )}
    {goods === 'baskets' && (
      <>
        {[-0.6, 0, 0.6].map((bz) => (
          <Cyl key={bz} p={[-0.15, 1.05, bz]} s={[0.46, 0.2, 0.46]} c="#b08a4a" rough={0.95} />
        ))}
        <Ball p={[-0.15, 1.2, -0.6]} s={[0.36, 0.2, 0.36]} c="#e7c94b" />
        <Ball p={[-0.15, 1.2, 0.6]} s={[0.36, 0.2, 0.36]} c="#d9c39a" />
      </>
    )}
    {goods === 'drinks' && (
      <>
        <Cyl p={[-0.1, 1.2, -0.5]} s={[0.36, 0.5, 0.36]} c="#fde68a" rough={0.2} opacity={0.6} />
        <Box p={[-0.1, 1.1, 0.4]} s={[0.5, 0.3, 0.7]} c="#2563eb" rough={0.5} />
      </>
    )}
    {night && <Box p={[-0.2, 2.2, 0]} s={[0.08, 0.05, 1.6]} c="#fef9c3" glow={3} />}
  </group>
);

interface ShopProps {
  /** Centre of the building footprint. */
  x: number;
  z: number;
  /** Width along the road (Z) and depth away from it (X). */
  w: number;
  d: number;
  h: number;
  wall: string;
  lines: string[];
  signBg?: string;
  awning?: string;
  night: boolean;
  /** Number of upper floors with window bands. */
  floors?: number;
}

/** Shop-house facing the road: glazed ground floor, awning, fascia sign, upper windows. */
export const Shop: React.FC<ShopProps> = ({ x, z, w, d, h, wall, lines, signBg = '#b91c1c', awning = '#dc2626', night, floors = 1 }) => {
  const frontX = -d / 2;
  const upper: number[] = [];
  const floorH = (h - 3.4) / Math.max(1, floors);
  for (let i = 0; i < floors; i++) upper.push(3.4 + floorH * (i + 0.5));
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, h / 2, 0]} s={[d, h, w - 0.1]} c={wall} rough={0.85} shadow />
      <Box p={[0, h + 0.1, 0]} s={[d + 0.3, 0.2, w + 0.1]} c="#8f8a80" rough={0.9} />
      {/* Shop window + door */}
      <Box p={[frontX - 0.02, 1.35, 0]} s={[0.06, 2.3, w - 0.9]} c={night ? '#f6d48a' : '#22303d'} rough={0.15} metal={0.2} glow={night ? 0.9 : 0} />
      <Box p={[frontX - 0.05, 1.15, w * 0.22]} s={[0.06, 2.2, 0.08]} c="#e5e7eb" metal={0.5} />
      <Box p={[frontX - 0.05, 1.15, -w * 0.22]} s={[0.06, 2.2, 0.08]} c="#e5e7eb" metal={0.5} />
      {/* Awning and fascia sign */}
      <Box p={[frontX - 0.75, 2.62, 0]} s={[1.6, 0.07, w - 0.3]} c={awning} rough={0.7} shadow rot={[0, 0, 0.16]} />
      <Sign lines={lines} p={[frontX - 0.08, 3.1, 0]} w={w - 0.6} h={0.8} bg={signBg} face="road" night={night} />
      {/* Upper-floor window bands */}
      {upper.map((y) => (
        <group key={y}>
          <Box p={[frontX - 0.02, y, 0]} s={[0.05, floorH * 0.5, w - 1.4]} c={night ? '#e9c98a' : '#3b4a5c'} rough={0.2} glow={night ? 0.55 : 0} />
          <Box p={[frontX - 0.3, y - floorH * 0.36, 0]} s={[0.6, 0.08, w - 0.8]} c="#a8a29e" rough={0.9} />
        </group>
      ))}
    </group>
  );
};

/** Riderless parked scooter (the traffic asset has a rider baked in). */
export const ParkedScooter: React.FC<{ x: number; z: number; color: string; rotY?: number }> = ({ x, z, color, rotY = Math.PI / 2 }) => (
  <group position={[x, 0, z]} rotation={[0, rotY, 0.08]}>
    <Cyl p={[0, 0.27, -0.62]} s={[0.54, 0.1, 0.54]} c="#15171a" rot={[0, 0, Math.PI / 2]} />
    <Cyl p={[0, 0.27, 0.62]} s={[0.54, 0.1, 0.54]} c="#15171a" rot={[0, 0, Math.PI / 2]} />
    <Box p={[0, 0.58, 0.05]} s={[0.32, 0.4, 1.0]} c={color} rough={0.4} metal={0.2} shadow />
    <Box p={[0, 0.84, -0.5]} s={[0.34, 0.5, 0.1]} c={color} rough={0.4} rot={[-0.35, 0, 0]} />
    <Box p={[0, 0.86, 0.3]} s={[0.3, 0.1, 0.7]} c="#1f2937" />
    <Box p={[0, 1.04, -0.44]} s={[0.6, 0.04, 0.04]} c="#1f2937" />
  </group>
);

const bodyMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

/** Static vehicle from the traffic asset library (three meshes). Nose toward -Z at rotY = 0. */
export const ParkedVehicle: React.FC<{ kind: VehicleKind; color: string; x: number; z: number; rotY?: number }> = ({ kind, color, x, z, rotY = 0 }) => {
  const assets = getTrafficAssets();
  const def = assets.defs[kind];
  let body = bodyMaterialCache.get(color);
  if (!body) {
    body = assets.bodyMaterial.clone();
    body.color.set(color);
    bodyMaterialCache.set(color, body);
  }
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh geometry={def.body} material={body} castShadow receiveShadow />
      <mesh geometry={def.trim} material={assets.trimMaterial} castShadow />
      <mesh geometry={def.lights} material={assets.lightMaterial} />
    </group>
  );
};

interface PavementProps {
  /** Near and far edge (X) and half length (Z). */
  minX: number;
  maxX: number;
  halfLength: number;
  height: number;
  color?: string;
}

/** Raised pavement with kerb, yellow safety line, tactile strip and paving joints. */
export const Pavement: React.FC<PavementProps> = ({ minX, maxX, halfLength, height, color = '#cfcac0' }) => {
  const width = maxX - minX;
  const cx = (minX + maxX) / 2;
  const len = halfLength * 2;
  const joints: number[] = [];
  for (let z = -halfLength + 4; z < halfLength; z += 4) joints.push(z);
  return (
    <group>
      <Box p={[cx, height / 2, 0]} s={[width, height, len]} c={color} rough={0.9} />
      {/* Granite kerb */}
      <Box p={[minX + 0.11, height / 2 + 0.005, 0]} s={[0.22, height + 0.01, len]} c="#9a958c" rough={0.85} />
      {/* Safety line + tactile paving */}
      <Box p={[minX + 0.36, height + 0.004, 0]} s={[0.14, 0.008, len - 0.4]} c="#facc15" rough={0.5} />
      <Box p={[minX + 0.78, height + 0.004, 0]} s={[0.36, 0.008, len - 0.6]} c="#e0b93a" rough={0.9} />
      {joints.map((z) => (
        <Box key={z} p={[cx + 0.6, height + 0.003, z]} s={[width - 1.6, 0.006, 0.05]} c="#b3ada2" rough={1} />
      ))}
    </group>
  );
};
