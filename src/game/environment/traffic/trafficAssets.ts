import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Procedural low-poly vehicles for ambient traffic and station car parks.
 * Every vehicle is three merged geometries so a whole kind renders in three draw calls:
 *  - `body`:   painted panels, tinted per instance (instanceColor)
 *  - `trim`:   glass, tyres, bumpers, cargo… with baked vertex colours
 *  - `lights`: head / tail lamps (unlit, bloom at night)
 * Local space: base at y = 0, nose toward -Z (the bus travel direction).
 */

export const VEHICLE_KINDS = ['sedan', 'suv', 'van', 'truck', 'container', 'coach', 'motorbike'] as const;
export type VehicleKind = (typeof VEHICLE_KINDS)[number];

export interface VehicleDef {
  kind: VehicleKind;
  length: number;
  width: number;
  body: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  lights: THREE.BufferGeometry;
  palette: readonly string[];
}

export interface TrafficAssets {
  defs: Record<VehicleKind, VehicleDef>;
  bodyMaterial: THREE.MeshStandardMaterial;
  trimMaterial: THREE.MeshStandardMaterial;
  lightMaterial: THREE.MeshBasicMaterial;
}

const GLASS = '#1c2733';
const TYRE = '#15171a';
const DARK = '#262b33';
const CHROME = '#aab4c0';
const HEAD = '#fff3c4';
const TAIL = '#ff2d2d';

const tmpColor = new THREE.Color();

/** Normalise to non-indexed position + normal (+ optional baked colour) so parts can be merged. */
function prep(g: THREE.BufferGeometry, color?: string): THREE.BufferGeometry {
  const ng = g.index ? g.toNonIndexed() : g;
  for (const name of Object.keys(ng.attributes)) {
    if (name !== 'position' && name !== 'normal') ng.deleteAttribute(name);
  }
  if (color) {
    tmpColor.set(color);
    const count = ng.attributes.position.count;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      data[i * 3] = tmpColor.r;
      data[i * 3 + 1] = tmpColor.g;
      data[i * 3 + 2] = tmpColor.b;
    }
    ng.setAttribute('color', new THREE.BufferAttribute(data, 3));
  }
  return ng;
}

function box(w: number, h: number, l: number, x: number, y: number, z: number, color?: string): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, l);
  g.translate(x, y, z);
  return prep(g, color);
}

/**
 * Box whose top face is narrower / shorter than its base (windscreen and tailgate rake).
 * `front` / `rear` are the metres the top edge is pulled in at the nose (-Z) and tail (+Z).
 */
function cabin(
  w: number,
  h: number,
  l: number,
  x: number,
  y: number,
  z: number,
  topWidthScale: number,
  front: number,
  rear: number,
  color?: string
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, l);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      pos.setX(i, pos.getX(i) * topWidthScale);
      pos.setZ(i, pos.getZ(i) < 0 ? pos.getZ(i) + front : pos.getZ(i) - rear);
    }
  }
  g.computeVertexNormals();
  g.translate(x, y, z);
  return prep(g, color);
}

function wheel(radius: number, width: number, x: number, z: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, width, 12);
  g.rotateZ(Math.PI / 2);
  g.translate(x, radius, z);
  return prep(g, TYRE);
}

function wheels(radius: number, width: number, trackX: number, zs: number[]): THREE.BufferGeometry[] {
  const list: THREE.BufferGeometry[] = [];
  for (const z of zs) {
    list.push(wheel(radius, width, -trackX, z), wheel(radius, width, trackX, z));
  }
  return list;
}

function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(list, false);
  if (!merged) throw new Error('Failed to merge vehicle geometry');
  for (const g of list) g.dispose();
  return merged;
}

function lamps(width: number, y: number, halfLength: number, size = 0.32): THREE.BufferGeometry {
  const x = width / 2 - size / 2 - 0.08;
  return merge([
    box(size, 0.13, 0.06, -x, y, -halfLength, HEAD),
    box(size, 0.13, 0.06, x, y, -halfLength, HEAD),
    box(size, 0.13, 0.06, -x, y + 0.04, halfLength, TAIL),
    box(size, 0.13, 0.06, x, y + 0.04, halfLength, TAIL),
  ]);
}

function buildCar(kind: 'sedan' | 'suv'): VehicleDef {
  const suv = kind === 'suv';
  const L = suv ? 4.7 : 4.5;
  const W = suv ? 1.9 : 1.8;
  const bodyH = suv ? 0.72 : 0.56;
  const bodyY = suv ? 0.74 : 0.6;
  const cabH = suv ? 0.62 : 0.5;
  const cabL = suv ? 3.0 : 2.5;
  const cabZ = suv ? 0.35 : 0.2;
  const cabY = bodyY + bodyH / 2 + cabH / 2;
  const body = merge([
    box(W, bodyH, L, 0, bodyY, 0),
    // Roof panel and pillars
    cabin(W * 0.84, 0.05, cabL - (suv ? 0.75 : 1.0), 0, cabY + cabH / 2, cabZ + (suv ? 0.05 : 0.02), 1, 0, 0),
    box(0.06, cabH, 0.07, -W * 0.44, cabY, cabZ + 0.1),
    box(0.06, cabH, 0.07, W * 0.44, cabY, cabZ + 0.1),
  ]);
  const trim = merge([
    cabin(W * 0.94, cabH, cabL, 0, cabY, cabZ, 0.86, suv ? 0.42 : 0.6, suv ? 0.22 : 0.5, GLASS),
    box(W + 0.02, 0.2, L + 0.06, 0, 0.36, 0, DARK),
    box(W * 0.6, 0.14, 0.05, 0, bodyY - 0.05, -L / 2 - 0.01, DARK),
    ...wheels(suv ? 0.37 : 0.33, 0.24, W / 2 - 0.1, [-L * 0.31, L * 0.31]),
  ]);
  return {
    kind,
    length: L,
    width: W,
    body,
    trim,
    lights: lamps(W, bodyY + 0.12, L / 2 + 0.01),
    palette: ['#f1f5f9', '#111827', '#9ca3af', '#b91c1c', '#1d4ed8', '#e5e7eb', '#6b4423', '#0f766e', '#f8fafc'],
  };
}

function buildVan(): VehicleDef {
  const L = 5.4;
  const W = 2.0;
  const body = merge([
    cabin(W, 1.75, L, 0, 1.3, 0, 0.94, 0.55, 0.06),
  ]);
  const trim = merge([
    box(W + 0.03, 0.5, L * 0.66, 0, 1.75, 0.35, GLASS),
    cabin(W * 0.9, 0.62, 0.5, 0, 1.72, -L / 2 + 0.42, 0.96, 0.2, 0, GLASS),
    box(W + 0.02, 0.22, L + 0.06, 0, 0.42, 0, DARK),
    ...wheels(0.36, 0.24, W / 2 - 0.1, [-L * 0.3, L * 0.3]),
  ]);
  return {
    kind: 'van',
    length: L,
    width: W,
    body,
    trim,
    lights: lamps(W, 0.86, L / 2 + 0.01),
    palette: ['#f8fafc', '#cbd5e1', '#1e3a8a', '#f59e0b', '#e2e8f0', '#334155'],
  };
}

function buildTruck(): VehicleDef {
  const L = 7.8;
  const W = 2.4;
  const body = merge([cabin(W - 0.1, 2.0, 2.0, 0, 1.75, -L / 2 + 1.0, 0.96, 0.25, 0)]);
  const trim = merge([
    box(W, 2.5, 5.5, 0, 2.2, 1.1, '#dfe3e8'),
    box(W + 0.02, 0.06, 5.52, 0, 3.46, 1.1, CHROME),
    box(W - 0.3, 0.7, 0.06, 0, 2.15, -L / 2 + 0.11, GLASS),
    box(W - 0.4, 0.3, L - 0.3, 0, 0.72, 0, DARK),
    box(W, 0.25, 0.12, 0, 0.62, -L / 2 + 0.02, DARK),
    ...wheels(0.46, 0.3, W / 2 - 0.16, [-L / 2 + 1.1, 1.6, 2.7]),
  ]);
  return {
    kind: 'truck',
    length: L,
    width: W,
    body,
    trim,
    lights: lamps(W, 0.95, L / 2 + 0.01, 0.3),
    palette: ['#1d4ed8', '#f8fafc', '#dc2626', '#f59e0b', '#15803d', '#0e7490'],
  };
}

function buildContainer(): VehicleDef {
  const L = 15;
  const W = 2.5;
  // The painted part is the container itself; the tractor unit stays white
  const body = merge([box(W, 2.7, 12, 0, 2.75, 1.4)]);
  const trim = merge([
    cabin(W - 0.1, 2.5, 2.3, 0, 2.05, -L / 2 + 1.15, 0.96, 0.3, 0, '#eef1f5'),
    box(W - 0.35, 0.75, 0.06, 0, 2.55, -L / 2 + 0.14, GLASS),
    box(W - 0.3, 0.3, L - 0.4, 0, 1.1, 0.1, DARK),
    box(W, 0.3, 0.14, 0, 0.7, -L / 2 + 0.02, DARK),
    ...wheels(0.5, 0.32, W / 2 - 0.18, [-L / 2 + 1.2, -3.4, -2.2, 4.6, 5.8]),
  ]);
  return {
    kind: 'container',
    length: L,
    width: W,
    body,
    trim,
    lights: lamps(W, 1.05, L / 2 + 0.01, 0.3),
    palette: ['#b45309', '#1e40af', '#991b1b', '#065f46', '#475569', '#0f766e'],
  };
}

function buildCoach(): VehicleDef {
  const L = 11.6;
  const W = 2.5;
  const body = merge([cabin(W, 2.75, L, 0, 1.85, 0, 0.97, 0.18, 0.05)]);
  const trim = merge([
    box(W + 0.03, 0.95, L - 1.3, 0, 2.3, 0.25, GLASS),
    cabin(W - 0.25, 1.35, 0.3, 0, 2.05, -L / 2 + 0.2, 0.98, 0.1, 0, GLASS),
    box(W + 0.02, 0.3, L + 0.04, 0, 0.6, 0, DARK),
    box(1.6, 0.2, 3.4, 0, 3.32, -0.4, '#d7dce2'),
    ...wheels(0.5, 0.32, W / 2 - 0.16, [-L / 2 + 2.3, L / 2 - 2.6]),
  ]);
  return {
    kind: 'coach',
    length: L,
    width: W,
    body,
    trim,
    lights: lamps(W, 0.95, L / 2 + 0.01, 0.4),
    palette: ['#f8fafc', '#f97316', '#0ea5e9', '#dc2626', '#16a34a', '#facc15'],
  };
}

function buildMotorbike(): VehicleDef {
  const L = 1.9;
  const W = 0.7;
  // Tinted: scooter fairing + the rider's jacket
  const fairing = new THREE.BoxGeometry(0.34, 0.42, 1.0);
  fairing.translate(0, 0.62, 0.02);
  const shield = new THREE.BoxGeometry(0.36, 0.5, 0.12);
  shield.rotateX(-0.35);
  shield.translate(0, 0.86, -0.52);
  const torso = new THREE.CapsuleGeometry(0.17, 0.3, 4, 10);
  torso.rotateX(-0.22);
  torso.translate(0, 1.28, 0.16);
  const armL = new THREE.CapsuleGeometry(0.055, 0.42, 3, 8);
  armL.rotateX(1.05);
  armL.translate(-0.2, 1.24, -0.16);
  const armR = armL.clone();
  armR.translate(0.4, 0, 0);
  const body = merge([prep(fairing), prep(shield), prep(torso), prep(armL), prep(armR)]);

  const frontWheel = new THREE.CylinderGeometry(0.29, 0.29, 0.1, 12);
  frontWheel.rotateZ(Math.PI / 2);
  frontWheel.translate(0, 0.29, -0.66);
  const rearWheel = frontWheel.clone();
  rearWheel.translate(0, 0, 1.3);
  const fork = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6);
  fork.rotateX(-0.4);
  fork.translate(0, 0.66, -0.56);
  const bars = new THREE.BoxGeometry(0.62, 0.04, 0.04);
  bars.translate(0, 1.04, -0.44);
  const seat = new THREE.BoxGeometry(0.3, 0.1, 0.72);
  seat.translate(0, 0.88, 0.3);
  const legL = new THREE.CapsuleGeometry(0.075, 0.36, 3, 8);
  legL.rotateX(1.15);
  legL.translate(-0.16, 0.86, -0.02);
  const legR = legL.clone();
  legR.translate(0.32, 0, 0);
  const shinL = new THREE.CapsuleGeometry(0.06, 0.34, 3, 8);
  shinL.translate(-0.17, 0.56, -0.26);
  const shinR = shinL.clone();
  shinR.translate(0.34, 0, 0);
  const head = new THREE.SphereGeometry(0.115, 12, 10);
  head.translate(0, 1.68, 0.06);
  const helmet = new THREE.SphereGeometry(0.135, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58);
  helmet.translate(0, 1.7, 0.07);
  const trim = merge([
    prep(frontWheel, TYRE),
    prep(rearWheel, TYRE),
    prep(fork, CHROME),
    prep(bars, DARK),
    prep(seat, DARK),
    prep(legL, '#27364a'),
    prep(legR, '#27364a'),
    prep(shinL, '#27364a'),
    prep(shinR, '#27364a'),
    prep(head, '#e3b088'),
    prep(helmet, '#e7ebf0'),
  ]);
  const lights = merge([
    box(0.16, 0.12, 0.05, 0, 0.98, -0.62, HEAD),
    box(0.14, 0.08, 0.05, 0, 0.78, 0.66, TAIL),
  ]);
  return {
    kind: 'motorbike',
    length: L,
    width: W,
    body,
    trim,
    lights,
    palette: ['#dc2626', '#1f2937', '#2563eb', '#f8fafc', '#f59e0b', '#16a34a', '#be185d', '#0f766e', '#7c3aed'],
  };
}

let cached: TrafficAssets | null = null;

/** Session-wide singleton (never disposed: shared by traffic and parked station vehicles). */
export function getTrafficAssets(): TrafficAssets {
  if (cached) return cached;
  cached = {
    defs: {
      sedan: buildCar('sedan'),
      suv: buildCar('suv'),
      van: buildVan(),
      truck: buildTruck(),
      container: buildContainer(),
      coach: buildCoach(),
      motorbike: buildMotorbike(),
    },
    bodyMaterial: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.38, metalness: 0.25 }),
    trimMaterial: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.1 }),
    lightMaterial: new THREE.MeshBasicMaterial({ vertexColors: true }),
  };
  return cached;
}
