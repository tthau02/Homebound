import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createRng } from '../../materials/proceduralTextures';

/**
 * Procedural low-poly asset library for roadside scenery (stylized, flat-shaded).
 * Every asset is built in unit-ish local space with its base at y = 0 so a single
 * instance matrix (position / rotY / scale) places all of its parts.
 */

export type AssetKind =
  | 'treeRound'
  | 'treeCone'
  | 'palm'
  | 'bamboo'
  | 'villageHouse'
  | 'tube2'
  | 'tube3'
  | 'tube4'
  | 'tube5'
  | 'tower10'
  | 'tower16'
  | 'tower24'
  | 'factory'
  | 'paddy'
  | 'water'
  | 'pylon'
  | 'pole'
  | 'billboard'
  | 'karst'
  | 'hill';

export interface AssetPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  /** When true, each instance gets its own colour from the item's tint for this part. */
  tintable: boolean;
  castShadow: boolean;
}

export interface AssetDef {
  parts: AssetPart[];
  /** Approximate footprint radius (metres at scale 1) used for overlap rejection. */
  footprint: number;
}

/** Shared wind uniform: animated by RouteScenery, read by foliage shaders. */
export const windUniforms = { uTime: { value: 0 } };

function applyWind(material: THREE.MeshStandardMaterial, strength: number): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec3 instOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
#else
  vec3 instOrigin = vec3(0.0);
#endif
  float windPhase = uTime * 1.7 + instOrigin.x * 0.31 + instOrigin.z * 0.17;
  float windAmt = max(position.y - 0.6, 0.0) * ${strength.toFixed(3)};
  transformed.x += sin(windPhase) * windAmt;
  transformed.z += cos(windPhase * 0.8) * windAmt * 0.6;`
      );
  };
  material.customProgramCacheKey = () => `wind-${strength}`;
}

function std(color: string, roughness = 0.85, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true, ...extra });
}

function translated(g: THREE.BufferGeometry, x: number, y: number, z: number): THREE.BufferGeometry {
  g.translate(x, y, z);
  return g;
}

/** Strip attributes so geometries with/without uv can be merged; keeps position + normal. */
function normalized(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const ng = g.index ? g.toNonIndexed() : g;
  for (const name of Object.keys(ng.attributes)) {
    if (name !== 'position' && name !== 'normal') ng.deleteAttribute(name);
  }
  return ng;
}

function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(list.map(normalized), false);
  if (!merged) throw new Error('Failed to merge scenery geometry');
  merged.computeVertexNormals();
  return merged;
}

// ----------------------------------------------------------------------------
// Facade textures (windows) for tube houses and apartment towers
// ----------------------------------------------------------------------------

function facadeTextures(kind: 'tube' | 'tower'): { map: THREE.Texture; emissive: THREE.Texture } {
  const w = 64;
  const h = 64;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    return [c, ctx] as const;
  };
  const [colorCanvas, cx] = mk();
  const [emCanvas, ex] = mk();
  const rng = createRng(kind === 'tube' ? 21 : 87);

  cx.fillStyle = '#ffffff';
  cx.fillRect(0, 0, w, h);
  ex.fillStyle = '#000000';
  ex.fillRect(0, 0, w, h);

  if (kind === 'tube') {
    // One floor of a Vietnamese tube house: big window + balcony rail
    cx.fillStyle = '#3b4a5c';
    cx.fillRect(12, 10, 40, 30);
    cx.fillStyle = '#d6dde5';
    cx.fillRect(30, 10, 3, 30);
    cx.fillStyle = '#9aa3ad';
    cx.fillRect(6, 44, 52, 4);
    for (let x = 8; x < 58; x += 6) cx.fillRect(x, 44, 2, 12);
    cx.fillStyle = '#7d8790';
    cx.fillRect(6, 56, 52, 3);
    ex.fillStyle = '#ffd59a';
    ex.fillRect(12, 10, 18, 30);
    if (rng() > 0.4) ex.fillRect(33, 10, 19, 30);
  } else {
    // Apartment tower floor: 4 window bays
    for (let i = 0; i < 4; i++) {
      const x = 3 + i * 15;
      cx.fillStyle = '#4b5d73';
      cx.fillRect(x, 14, 11, 32);
      cx.fillStyle = '#c3ccd6';
      cx.fillRect(x, 28, 11, 2);
      if (rng() > 0.45) {
        ex.fillStyle = rng() > 0.5 ? '#ffe2a8' : '#dbeafe';
        ex.fillRect(x, 14, 11, 32);
      }
    }
    cx.fillStyle = '#aeb7c1';
    cx.fillRect(0, 54, w, 4);
  }
  // Keep the top-left corner pure wall colour (used by roof faces)
  cx.fillStyle = '#ffffff';
  cx.fillRect(0, 0, 4, 4);
  ex.fillStyle = '#000000';
  ex.fillRect(0, 0, 4, 4);

  const toTex = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return { map: toTex(colorCanvas, true), emissive: toTex(emCanvas, true) };
}

/**
 * Box whose side-face UVs repeat the facade tile `tileW` metres wide and one tile per floor.
 * Roof/floor faces sample the pure-wall corner of the texture.
 */
function facadeBox(width: number, floors: number, depth: number, floorH: number, tileW: number) {
  const height = floors * floorH;
  const g = new THREE.BoxGeometry(width, height, depth);
  g.translate(0, height / 2, 0);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // Face order: +X, -X, +Y, -Y, +Z, -Z (4 vertices each)
  const faceWidths = [depth, depth, 0, 0, width, width];
  for (let face = 0; face < 6; face++) {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      if (faceWidths[face] === 0) {
        uv.setXY(i, 0.01, 0.99);
      } else {
        uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(faceWidths[face] / tileW)), uv.getY(i) * floors);
      }
    }
  }
  uv.needsUpdate = true;
  return g;
}

function paddyTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#d9e3cc';
  for (let y = 2; y < 64; y += 5) ctx.fillRect(0, y, 64, 1.5);
  // Earthen dike border
  ctx.fillStyle = '#b7a585';
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillRect(0, 62, 64, 2);
  ctx.fillRect(0, 0, 2, 64);
  ctx.fillRect(62, 0, 2, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ----------------------------------------------------------------------------
// Asset construction
// ----------------------------------------------------------------------------

export interface AssetLibrary {
  defs: Record<AssetKind, AssetDef>;
  /** Materials whose emissive glow follows day/night. */
  nightGlowMaterials: THREE.MeshStandardMaterial[];
  dispose: () => void;
}

export function createAssetLibrary(): AssetLibrary {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const g = <T extends THREE.BufferGeometry>(geo: T): T => {
    geometries.push(geo);
    return geo;
  };
  const m = <T extends THREE.Material>(mat: T): T => {
    materials.push(mat);
    return mat;
  };

  const part = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    tintable = false,
    castShadow = false
  ): AssetPart => ({ geometry: g(geometry), material: m(material), tintable, castShadow });

  // --- Materials ---
  const trunkMat = std('#6b4f3a', 0.95);
  const foliageMat = std('#ffffff', 0.9);
  applyWind(foliageMat, 0.05);
  const palmLeafMat = std('#ffffff', 0.85, { side: THREE.DoubleSide });
  applyWind(palmLeafMat, 0.09);
  const bambooStemMat = std('#8ea64a', 0.7);
  const bambooLeafMat = std('#ffffff', 0.9);
  applyWind(bambooLeafMat, 0.08);
  const wallMat = std('#ffffff', 0.9);
  const roofMat = std('#ffffff', 0.75);
  const steelMat = std('#9aa4ae', 0.5, { metalness: 0.6, flatShading: false });
  const concreteMat = std('#c9c4bb', 0.9);
  const boardMat = std('#ffffff', 0.6);
  const rockMat = std('#ffffff', 0.95);

  const tubeTex = facadeTextures('tube');
  const towerTex = facadeTextures('tower');
  textures.push(tubeTex.map, tubeTex.emissive, towerTex.map, towerTex.emissive);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: tubeTex.map,
    emissive: '#ffcf8a',
    emissiveMap: tubeTex.emissive,
    emissiveIntensity: 0,
    roughness: 0.85,
  });
  const towerMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: towerTex.map,
    emissive: '#ffe7b8',
    emissiveMap: towerTex.emissive,
    emissiveIntensity: 0,
    roughness: 0.7,
    metalness: 0.1,
  });

  const paddyTex = paddyTexture();
  textures.push(paddyTex);
  const paddyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: paddyTex, roughness: 0.95 });
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.08,
    metalness: 0.35,
  });

  // --- Geometries ---
  const unitTrunk = translated(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 6), 0, 1.1, 0);
  const roundCrown = merge([
    translated(new THREE.IcosahedronGeometry(1.35, 0), 0, 3.0, 0),
    translated(new THREE.IcosahedronGeometry(0.95, 0), 0.6, 3.8, 0.2),
    translated(new THREE.IcosahedronGeometry(0.85, 0), -0.6, 3.5, -0.3),
  ]);
  const coneTrunk = translated(new THREE.CylinderGeometry(0.1, 0.16, 1.6, 6), 0, 0.8, 0);
  const coneCrown = merge([
    translated(new THREE.ConeGeometry(1.2, 2.6, 7), 0, 2.6, 0),
    translated(new THREE.ConeGeometry(0.9, 2.0, 7), 0, 3.9, 0),
  ]);

  const palmTrunk = translated(new THREE.CylinderGeometry(0.1, 0.17, 4.2, 6), 0, 2.1, 0);
  const palmFronds: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const frond = new THREE.PlaneGeometry(0.7, 2.6, 1, 2);
    frond.translate(0, 1.3, 0);
    frond.rotateX(-1.05);
    frond.rotateY((i / 7) * Math.PI * 2);
    frond.translate(0, 4.2, 0);
    palmFronds.push(frond);
  }
  const palmCrown = merge(palmFronds);

  const stems: THREE.BufferGeometry[] = [];
  const leaves: THREE.BufferGeometry[] = [];
  const bRng = createRng(55);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = 0.25 + bRng() * 0.35;
    const h = 5 + bRng() * 2.5;
    const stem = new THREE.CylinderGeometry(0.05, 0.07, h, 5);
    stem.translate(0, h / 2, 0);
    stem.rotateZ(Math.cos(a) * 0.12);
    stem.rotateX(Math.sin(a) * 0.12);
    stem.translate(Math.cos(a) * r, 0, Math.sin(a) * r);
    stems.push(stem);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = new THREE.IcosahedronGeometry(1.1, 0);
    leaf.scale(1, 1.6, 1);
    leaf.translate(Math.cos(a) * 0.9, 5.2 + (i % 2) * 1.0, Math.sin(a) * 0.9);
    leaves.push(leaf);
  }

  const houseWalls = translated(new THREE.BoxGeometry(1, 1, 1), 0, 0.5, 0);
  const roofPrism = new THREE.CylinderGeometry(0.72, 0.72, 1.08, 3, 1);
  roofPrism.rotateZ(Math.PI / 2);
  roofPrism.rotateX(-Math.PI / 2); // apex up, ridge along local X
  roofPrism.scale(1, 0.55, 0.85);
  roofPrism.translate(0, 1.18, 0);
  const roofGeo = roofPrism;

  const factoryBody = merge([
    translated(new THREE.BoxGeometry(22, 7, 14), 0, 3.5, 0),
    translated(new THREE.CylinderGeometry(0.8, 1.0, 16, 8), 8, 8, 4),
  ]);
  const factoryRoof = merge(
    [0, 1, 2, 3].map((i) => {
      const r = new THREE.BoxGeometry(5.6, 0.3, 14.4);
      r.rotateZ(0.32);
      r.translate(-8.2 + i * 5.5, 7.8, 0);
      return r;
    })
  );

  const pylonParts: THREE.BufferGeometry[] = [];
  const legH = 26;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const leg = new THREE.BoxGeometry(0.22, legH, 0.22);
    leg.translate(0, legH / 2, 0);
    leg.rotateZ(-sx * 0.07);
    leg.rotateX(sz * 0.07);
    leg.translate(sx * 1.9, 0, sz * 1.9);
    pylonParts.push(leg);
  }
  for (const y of [14, 19, 24]) {
    pylonParts.push(translated(new THREE.BoxGeometry(y === 24 ? 8 : 11, 0.25, 0.4), 0, y, 0));
  }
  for (const y of [5, 10, 15, 20]) {
    const w = 3.8 - y * 0.12;
    pylonParts.push(translated(new THREE.BoxGeometry(w, 0.12, 0.12), 0, y, w / 2));
    pylonParts.push(translated(new THREE.BoxGeometry(w, 0.12, 0.12), 0, y, -w / 2));
  }
  const pylonGeo = merge(pylonParts);

  const poleGeo = merge([
    translated(new THREE.CylinderGeometry(0.1, 0.14, 8, 6), 0, 4, 0),
    translated(new THREE.BoxGeometry(0.12, 0.12, 1.8), 0, 7.4, 0),
    translated(new THREE.CylinderGeometry(0.25, 0.25, 0.7, 8), 0.25, 6.6, 0),
  ]);

  const billboardPosts = merge([
    translated(new THREE.CylinderGeometry(0.18, 0.2, 7, 8), 0, 3.5, 0),
    translated(new THREE.BoxGeometry(0.3, 0.3, 6.4), 0, 6.8, 0),
  ]);
  const billboardBoard = translated(new THREE.BoxGeometry(0.25, 3.4, 7.6), -0.2, 8.6, 0);

  const karstGeo = new THREE.IcosahedronGeometry(1, 1);
  karstGeo.translate(0, 0.55, 0);
  karstGeo.scale(1, 1.8, 1);
  const hillGeo = new THREE.IcosahedronGeometry(1, 1);
  hillGeo.translate(0, 0.25, 0);
  hillGeo.scale(1, 0.55, 1);

  const flatPlane = new THREE.PlaneGeometry(1, 1);
  flatPlane.rotateX(-Math.PI / 2);

  const tube = (floors: number) => part(facadeBox(4.2, floors, 11, 3.2, 4.2), tubeMat, true, true);
  const tower = (floors: number) => part(facadeBox(18, floors, 14, 3.1, 4.5), towerMat, true, false);

  m(tubeMat);
  m(towerMat);

  const defs: Record<AssetKind, AssetDef> = {
    treeRound: { footprint: 2.2, parts: [part(unitTrunk, trunkMat, false, true), part(roundCrown, foliageMat, true, true)] },
    treeCone: { footprint: 1.6, parts: [part(coneTrunk, trunkMat, false, true), part(coneCrown, foliageMat, true, true)] },
    palm: { footprint: 1.8, parts: [part(palmTrunk, trunkMat, false, true), part(palmCrown, palmLeafMat, true, false)] },
    bamboo: { footprint: 2.2, parts: [part(merge(stems), bambooStemMat, false, true), part(merge(leaves), bambooLeafMat, true, true)] },
    villageHouse: { footprint: 0.75, parts: [part(houseWalls, wallMat, true, true), part(roofGeo, roofMat, true, true)] },
    tube2: { footprint: 2.3, parts: [tube(2)] },
    tube3: { footprint: 2.3, parts: [tube(3)] },
    tube4: { footprint: 2.3, parts: [tube(4)] },
    tube5: { footprint: 2.3, parts: [tube(5)] },
    tower10: { footprint: 9.5, parts: [tower(10)] },
    tower16: { footprint: 9.5, parts: [tower(16)] },
    tower24: { footprint: 9.5, parts: [tower(24)] },
    factory: { footprint: 12, parts: [part(factoryBody, concreteMat, true, false), part(factoryRoof, roofMat, true, false)] },
    paddy: { footprint: 0.6, parts: [part(flatPlane, paddyMat, true, false)] },
    water: { footprint: 0.6, parts: [part(flatPlane.clone(), waterMat, true, false)] },
    pylon: { footprint: 3, parts: [part(pylonGeo, steelMat, false, false)] },
    pole: { footprint: 0.6, parts: [part(poleGeo, concreteMat, false, false)] },
    billboard: { footprint: 4, parts: [part(billboardPosts, steelMat, false, false), part(billboardBoard, boardMat, true, false)] },
    karst: { footprint: 1, parts: [part(karstGeo, rockMat, true, false)] },
    hill: { footprint: 1, parts: [part(hillGeo, rockMat, true, false)] },
  };

  return {
    defs,
    nightGlowMaterials: [tubeMat, towerMat],
    dispose: () => {
      geometries.forEach((x) => x.dispose());
      materials.forEach((x) => x.dispose());
      textures.forEach((x) => x.dispose());
    },
  };
}
