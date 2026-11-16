import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BodyType, CharacterAccessory, CharacterData, HairStyle } from './characterTypes';

export type { BodyType, CharacterAccessory, HairStyle };

/**
 * Procedural human figures with realistic proportions (≈1.72 m, 7.5 heads tall).
 *
 * Each character is a 15-joint rig. Instead of ~45 separate primitive meshes, the parts
 * attached to a joint are merged into ONE geometry with baked vertex colours, so a whole
 * person renders in about 15 draw calls with a single shared material. Geometries are
 * cached per look + colour set, so identical bystanders share GPU buffers.
 */

export interface CharacterAppearance {
  bodyType: BodyType;
  hairStyle: HairStyle;
  accessories: CharacterAccessory[];
  shortSleeves: boolean;
  skinColor: string;
  shoeColor: string;
  /** Uniform scale applied to the whole rig (people are not all the same height). */
  heightScale: number;
}

export interface CharacterColors {
  shirt: string;
  pants: string;
  hair: string;
}

const SKIN_TONES = ['#f1c9a5', '#e9b98f', '#deaa80', '#d19a6f', '#c58c62'];
const SHOE_COLORS = ['#f1f5f9', '#1f2937', '#5b3a22', '#334155', '#d6d3d1'];
const MASC_HAIR: HairStyle[] = ['short', 'sidePart', 'buzz', 'short'];
const FEM_HAIR: HairStyle[] = ['long', 'bun', 'ponytail', 'long'];
export const SHIRT_PALETTE = ['#2563eb', '#0f766e', '#b45309', '#be123c', '#4d7c0f', '#7c3aed', '#f1f5f9', '#334155', '#c2410c', '#0e7490', '#a16207', '#9d174d'];
export const PANTS_PALETTE = ['#1e293b', '#27364a', '#3f3f46', '#1f2937', '#4a3b2a', '#2f3e52'];
export const HAIR_PALETTE = ['#18181b', '#1c1917', '#291d12', '#0f172a', '#3f2314', '#6b7280'];

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic appearance: explicit fields win, everything else is derived from the id. */
export function resolveAppearance(
  character: Pick<CharacterData, 'id'> & Partial<Pick<CharacterData, 'bodyType' | 'hairStyle' | 'accessories'>>
): CharacterAppearance {
  const h = hashString(character.id);
  const bodyType: BodyType = character.bodyType ?? (h % 2 === 0 ? 'masc' : 'fem');
  const pool = bodyType === 'fem' ? FEM_HAIR : MASC_HAIR;
  const heightJitter = ((h >>> 15) % 7) / 6; // 0..1
  return {
    bodyType,
    hairStyle: character.hairStyle ?? pool[(h >>> 3) % pool.length],
    accessories: character.accessories ?? [],
    shortSleeves: ((h >>> 7) & 1) === 1,
    skinColor: SKIN_TONES[(h >>> 9) % SKIN_TONES.length],
    shoeColor: SHOE_COLORS[(h >>> 12) % SHOE_COLORS.length],
    heightScale: bodyType === 'fem' ? 0.915 + heightJitter * 0.05 : 0.965 + heightJitter * 0.06,
  };
}

/** Clothing colours for bystanders that have no explicit palette. */
export function resolveAmbientColors(id: string, shirt?: string): CharacterColors {
  const h = hashString(`${id}:colors`);
  return {
    shirt: shirt ?? SHIRT_PALETTE[h % SHIRT_PALETTE.length],
    pants: PANTS_PALETTE[(h >>> 5) % PANTS_PALETTE.length],
    hair: HAIR_PALETTE[(h >>> 9) % HAIR_PALETTE.length],
  };
}

// ---------------------------------------------------------------------------
// Rig layout (metres, standing, before heightScale). Shared with CharacterRig and
// AnimationController so joint placement and poses can never drift apart.
// ---------------------------------------------------------------------------

export const RIG = {
  /** Hip-centre height when standing / seated on a bus seat. */
  standPelvisY: 0.9,
  sitPelvisY: 0.49,
  waistY: 0.09,
  neckY: 0.51,
  shoulderY: 0.375,
  shoulderX: { masc: 0.186, fem: 0.168 },
  upperArmLength: 0.27,
  hipX: 0.085,
  hipY: -0.03,
  thighLength: 0.42,
  shinLength: 0.38,
  /** Eye line / mouth line above the neck joint (blink & talk meshes pivot here). */
  eyeY: 0.112,
  mouthY: 0.052,
  /** Head top above the character origin when standing / seated. */
  standHeight: 1.72,
  sitHeight: 1.31,
} as const;

/** One shared lit material for every body part of every character. */
export const BODY_MATERIAL = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.78,
  metalness: 0,
});

export const CHAR_GEO = {
  selectionRing: new THREE.RingGeometry(0.3, 0.36, 40),
  storyMarker: new THREE.OctahedronGeometry(0.1, 0),
};

export interface BodyGeometries {
  pelvis: THREE.BufferGeometry;
  torso: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  eyes: THREE.BufferGeometry;
  mouth: THREE.BufferGeometry;
  upperArm: THREE.BufferGeometry;
  forearm: THREE.BufferGeometry;
  thigh: THREE.BufferGeometry;
  shin: THREE.BufferGeometry;
  foot: THREE.BufferGeometry;
}

const tmpColor = new THREE.Color();
const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const tmpEuler = new THREE.Euler();

interface Placement {
  p?: [number, number, number];
  s?: [number, number, number] | number;
  r?: [number, number, number];
}

/** Bake a transform + flat colour into a (consumed) primitive so it can be merged. */
function part(source: THREE.BufferGeometry, color: string, placement: Placement = {}): THREE.BufferGeometry {
  const g = source.index ? source.toNonIndexed() : source;
  if (g !== source) source.dispose();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  }
  const { p = [0, 0, 0], s = 1, r = [0, 0, 0] } = placement;
  tmpPos.set(p[0], p[1], p[2]);
  tmpQuat.setFromEuler(tmpEuler.set(r[0], r[1], r[2]));
  if (typeof s === 'number') tmpScale.setScalar(s);
  else tmpScale.set(s[0], s[1], s[2]);
  g.applyMatrix4(tmpMatrix.compose(tmpPos, tmpQuat, tmpScale));

  tmpColor.set(color);
  const count = g.attributes.position.count;
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    data[i * 3] = tmpColor.r;
    data[i * 3 + 1] = tmpColor.g;
    data[i * 3 + 2] = tmpColor.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(data, 3));
  return g;
}

function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(list, false);
  if (!merged) throw new Error('Failed to merge character geometry');
  for (const g of list) g.dispose();
  merged.computeBoundingSphere();
  return merged;
}

const sphere = (detail = 14) => new THREE.SphereGeometry(1, detail, Math.max(8, Math.round(detail * 0.75)));
const capsule = (radius: number, length: number, radial = 10) => new THREE.CapsuleGeometry(radius, length, 4, radial);
const cylinder = (top: number, bottom: number, height: number, radial = 12) =>
  new THREE.CylinderGeometry(top, bottom, height, radial);

/** Slightly darker shade of a colour (belts, soles, lashes). */
function shade(color: string, factor: number): string {
  return `#${tmpColor.set(color).multiplyScalar(factor).getHexString()}`;
}

function buildTorso(look: CharacterAppearance, colors: CharacterColors): THREE.BufferGeometry {
  const fem = look.bodyType === 'fem';
  const profile: [number, number][] = fem
    ? [[0.134, -0.06], [0.13, 0.0], [0.116, 0.09], [0.138, 0.2], [0.152, 0.3], [0.15, 0.365], [0.106, 0.42], [0.056, 0.445]]
    : [[0.136, -0.06], [0.14, 0.0], [0.142, 0.1], [0.156, 0.21], [0.17, 0.31], [0.168, 0.37], [0.118, 0.425], [0.06, 0.447]];
  const lathe = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    18
  );
  const sx = RIG.shoulderX[look.bodyType];
  const list: THREE.BufferGeometry[] = [
    part(lathe, colors.shirt, { s: [1, 1, fem ? 0.7 : 0.66] }),
    part(sphere(10), colors.shirt, { p: [-sx, RIG.shoulderY, 0], s: 0.064 }),
    part(sphere(10), colors.shirt, { p: [sx, RIG.shoulderY, 0], s: 0.064 }),
    // Collar and neck
    part(cylinder(0.064, 0.074, 0.032, 14), shade(colors.shirt, 0.86), { p: [0, 0.445, 0.002], s: [1, 1, 0.84] }),
    part(cylinder(0.046, 0.052, 0.11, 12), look.skinColor, { p: [0, 0.475, 0.004] }),
  ];
  if (look.accessories.includes('backpack')) {
    const bag = '#334155';
    list.push(
      part(capsule(0.115, 0.16, 10), bag, { p: [0, 0.2, 0.175], s: [1, 1, 0.62] }),
      part(new THREE.BoxGeometry(0.16, 0.1, 0.05), shade(bag, 0.8), { p: [0, 0.13, 0.255] }),
      part(new THREE.BoxGeometry(0.036, 0.34, 0.02), shade(bag, 0.75), { p: [-0.1, 0.25, -0.1], r: [0.12, 0, 0] }),
      part(new THREE.BoxGeometry(0.036, 0.34, 0.02), shade(bag, 0.75), { p: [0.1, 0.25, -0.1], r: [0.12, 0, 0] })
    );
  }
  return merge(list);
}

function buildHead(look: CharacterAppearance, colors: CharacterColors): THREE.BufferGeometry {
  const skin = look.skinColor;
  const hair = colors.hair;
  const cy = 0.105;
  const cz = -0.005;
  const list: THREE.BufferGeometry[] = [
    part(sphere(18), skin, { p: [0, cy, cz], s: [0.094, 0.112, 0.104] }),
    // Jaw and chin give the face a human silhouette instead of a ball
    part(sphere(14), skin, { p: [0, 0.047, -0.016], s: [0.075, 0.064, 0.08] }),
    part(sphere(8), skin, { p: [-0.093, 0.1, 0.004], s: [0.014, 0.027, 0.018] }),
    part(sphere(8), skin, { p: [0.093, 0.1, 0.004], s: [0.014, 0.027, 0.018] }),
    // Nose bridge + tip
    part(sphere(8), shade(skin, 0.95), { p: [0, 0.09, -0.103], s: [0.012, 0.026, 0.017] }),
    // Brows and upper lash line
    part(capsule(0.0048, 0.03, 6), shade(hair, 0.9), { p: [-0.036, 0.137, -0.093], r: [0, 0.18, Math.PI / 2 - 0.1] }),
    part(capsule(0.0048, 0.03, 6), shade(hair, 0.9), { p: [0.036, 0.137, -0.093], r: [0, -0.18, Math.PI / 2 + 0.1] }),
    part(capsule(0.0028, 0.03, 6), '#2a1d16', { p: [-0.036, 0.1225, -0.0945], r: [0, 0.16, Math.PI / 2] }),
    part(capsule(0.0028, 0.03, 6), '#2a1d16', { p: [0.036, 0.1225, -0.0945], r: [0, -0.16, Math.PI / 2] }),
  ];
  if (look.bodyType === 'fem') {
    const blush = shade(skin, 0.92);
    list.push(
      part(sphere(8), blush, { p: [-0.058, 0.074, -0.085], s: [0.02, 0.012, 0.01] }),
      part(sphere(8), blush, { p: [0.058, 0.074, -0.085], s: [0.02, 0.012, 0.01] })
    );
  }

  // ---- Hair ----
  // Hemisphere tilted back so the hairline sits above the forehead and reaches the nape
  const capShell = (sx: number, sy: number, sz: number) =>
    part(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, {
      p: [0, cy + 0.01, cz + 0.01],
      s: [sx, sy, sz],
      r: [0.3, 0, 0],
    });
  const backShell = (sy: number, sz: number, y = -0.012) =>
    part(sphere(14), hair, { p: [0, cy + y, cz + 0.026], s: [0.098, sy, sz] });
  switch (look.hairStyle) {
    case 'buzz':
      list.push(capShell(0.0975, 0.1155, 0.107));
      break;
    case 'short':
      list.push(capShell(0.101, 0.121, 0.111), backShell(0.1, 0.092));
      break;
    case 'sidePart':
      list.push(
        capShell(0.101, 0.122, 0.111),
        backShell(0.1, 0.092),
        part(sphere(10), hair, { p: [0.03, cy + 0.093, -0.07], s: [0.06, 0.024, 0.04], r: [0.3, 0, -0.3] })
      );
      break;
    case 'long':
      list.push(
        capShell(0.102, 0.122, 0.112),
        part(sphere(14), hair, { p: [0, cy - 0.07, cz + 0.05], s: [0.102, 0.19, 0.072] }),
        part(capsule(0.03, 0.15, 8), hair, { p: [-0.088, cy - 0.07, -0.004] }),
        part(capsule(0.03, 0.15, 8), hair, { p: [0.088, cy - 0.07, -0.004] }),
        part(sphere(10), hair, { p: [-0.03, cy + 0.09, -0.072], s: [0.06, 0.024, 0.038], r: [0.3, 0, 0.3] })
      );
      break;
    case 'bun':
      list.push(
        capShell(0.101, 0.121, 0.111),
        backShell(0.1, 0.092),
        part(sphere(12), hair, { p: [0, cy + 0.1, cz + 0.07], s: 0.046 })
      );
      break;
    case 'ponytail':
    default:
      list.push(
        capShell(0.101, 0.121, 0.111),
        backShell(0.1, 0.092),
        part(sphere(8), shade(hair, 1.4), { p: [0, cy + 0.04, cz + 0.118], s: 0.022 }),
        part(capsule(0.03, 0.16, 8), hair, { p: [0, cy - 0.06, cz + 0.135], r: [0.28, 0, 0] })
      );
      break;
  }

  // ---- Accessories ----
  if (look.accessories.includes('glasses')) {
    const frame = '#1f2937';
    list.push(
      part(new THREE.TorusGeometry(0.021, 0.0032, 6, 14), frame, { p: [-0.036, RIG.eyeY, -0.101] }),
      part(new THREE.TorusGeometry(0.021, 0.0032, 6, 14), frame, { p: [0.036, RIG.eyeY, -0.101] }),
      part(new THREE.BoxGeometry(0.03, 0.004, 0.004), frame, { p: [0, RIG.eyeY + 0.004, -0.103] }),
      part(new THREE.BoxGeometry(0.004, 0.004, 0.09), frame, { p: [-0.085, RIG.eyeY + 0.004, -0.058] }),
      part(new THREE.BoxGeometry(0.004, 0.004, 0.09), frame, { p: [0.085, RIG.eyeY + 0.004, -0.058] })
    );
  }
  if (look.accessories.includes('nonLa')) {
    list.push(part(new THREE.ConeGeometry(0.27, 0.14, 22), '#d9c27e', { p: [0, cy + 0.15, cz] }));
  } else if (look.accessories.includes('cap')) {
    const capColor = '#b91c1c';
    list.push(
      part(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), capColor, {
        p: [0, cy + 0.035, cz + 0.004],
        s: [0.104, 0.1, 0.112],
        r: [-0.12, 0, 0],
      }),
      part(cylinder(0.07, 0.07, 0.012, 14), capColor, { p: [0, cy + 0.052, -0.118], s: [1, 1, 0.8], r: [0.14, 0, 0] })
    );
  }
  return merge(list);
}

function buildEyes(): THREE.BufferGeometry {
  const list: THREE.BufferGeometry[] = [];
  for (const x of [-0.036, 0.036]) {
    list.push(
      part(sphere(10), '#f6f1ea', { p: [x, 0, -0.091], s: [0.0165, 0.0105, 0.007] }),
      part(sphere(8), '#2b1a12', { p: [x, 0, -0.0962], s: [0.0084, 0.0086, 0.004] }),
      part(sphere(6), '#ffffff', { p: [x + 0.003, 0.003, -0.0998], s: 0.0022 })
    );
  }
  return merge(list);
}

function buildMouth(fem: boolean): THREE.BufferGeometry {
  return merge([
    part(sphere(10), fem ? '#b8545a' : '#a8605a', { p: [0, 0, -0.096], s: [fem ? 0.021 : 0.024, 0.0062, 0.008] }),
  ]);
}

function buildBody(look: CharacterAppearance, colors: CharacterColors): BodyGeometries {
  const fem = look.bodyType === 'fem';
  const skin = look.skinColor;
  const hipW = fem ? 1.05 : 1;

  const pelvis = merge([
    part(sphere(14), colors.pants, { p: [0, -0.02, 0], s: [0.158 * hipW, 0.118, 0.118] }),
    part(cylinder(0.142, 0.146, 0.04, 16), fem ? shade(colors.pants, 0.8) : '#2b2118', {
      p: [0, 0.07, 0],
      s: [hipW * 0.98, 1, 0.72],
    }),
  ]);

  const upperArm = look.shortSleeves
    ? merge([
        part(capsule(0.05, 0.09, 10), colors.shirt, { p: [0, -0.075, 0] }),
        part(capsule(0.04, 0.2, 10), skin, { p: [0, -0.15, 0] }),
      ])
    : merge([part(capsule(0.047, 0.2, 10), colors.shirt, { p: [0, -0.135, 0] })]);

  const forearmList: THREE.BufferGeometry[] = [
    part(cylinder(0.04, 0.031, 0.21, 10), look.shortSleeves ? skin : colors.shirt, { p: [0, -0.115, 0] }),
    part(sphere(8), look.shortSleeves ? skin : colors.shirt, { p: [0, -0.005, 0], s: 0.041 }),
    // Hand: palm + thumb
    part(sphere(10), skin, { p: [0, -0.268, -0.004], s: [0.03, 0.052, 0.019] }),
    part(sphere(6), skin, { p: [0, -0.256, -0.026], s: [0.011, 0.026, 0.011] }),
  ];
  if (!look.shortSleeves) {
    forearmList.push(part(cylinder(0.035, 0.035, 0.026, 10), shade(colors.shirt, 0.85), { p: [0, -0.218, 0] }));
  }
  const forearm = merge(forearmList);

  const thigh = merge([
    part(cylinder(0.078, 0.058, 0.4, 12), colors.pants, { p: [0, -0.21, 0] }),
    part(sphere(10), colors.pants, { p: [0, -0.01, 0], s: 0.078 }),
    part(sphere(10), colors.pants, { p: [0, -RIG.thighLength, 0], s: 0.059 }),
  ]);

  const shin = merge([part(cylinder(0.057, 0.044, 0.37, 12), colors.pants, { p: [0, -0.19, 0] })]);

  const shoeBody = capsule(0.047, 0.13, 10);
  shoeBody.rotateX(Math.PI / 2);
  const foot = merge([
    part(sphere(8), colors.pants, { p: [0, -0.005, 0.004], s: 0.046 }),
    part(shoeBody, look.shoeColor, { p: [0, -0.036, -0.05], s: [1, 0.74, 1] }),
    part(new THREE.BoxGeometry(0.088, 0.016, 0.215), shade(look.shoeColor, 0.55), { p: [0, -0.068, -0.05] }),
  ]);

  return {
    pelvis,
    torso: buildTorso(look, colors),
    head: buildHead(look, colors),
    eyes: buildEyes(),
    mouth: buildMouth(fem),
    upperArm,
    forearm,
    thigh,
    shin,
    foot,
  };
}

const bodyCache = new Map<string, BodyGeometries>();

/** Cached merged geometries for a look + colour set (shared by identical characters). */
export function getBodyGeometries(look: CharacterAppearance, colors: CharacterColors): BodyGeometries {
  const key = [
    look.bodyType,
    look.hairStyle,
    look.accessories.join('+'),
    look.shortSleeves ? 's' : 'l',
    look.skinColor,
    look.shoeColor,
    colors.shirt,
    colors.pants,
    colors.hair,
  ].join('|');
  let geos = bodyCache.get(key);
  if (!geos) {
    geos = buildBody(look, colors);
    bodyCache.set(key, geos);
  }
  return geos;
}
