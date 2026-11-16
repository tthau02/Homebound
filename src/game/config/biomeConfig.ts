import type { AssetKind } from '../environment/scenery/sceneryAssets';

export type BiomeId = 'village' | 'town' | 'expressway' | 'suburb' | 'city';

export interface SpawnRule {
  kind: AssetKind;
  /** Average number of items per chunk (per side when `side` is 'both'). */
  perChunk: number;
  side: 'left' | 'right' | 'both';
  /** Lateral distance band from the road centre (absolute metres). */
  minX: number;
  maxX: number;
  /** Uniform scale range, or explicit per-axis ranges. */
  scale?: [number, number];
  scaleX?: [number, number];
  scaleY?: [number, number];
  scaleZ?: [number, number];
  /** Colour palette for tintable part 0 / part 1. */
  palette?: string[];
  palette2?: string[];
  /** Face the road (rotate so local +X points toward x = 0) instead of random yaw. */
  faceRoad?: boolean;
  /** Place items evenly along the chunk (e.g. canals, pylons) instead of randomly. */
  continuous?: boolean;
  /** Skip overlap rejection (ground planes). */
  ground?: boolean;
  y?: number;
}

export interface BiomeDef {
  id: BiomeId;
  label: string;
  groundColor: string;
  nightGroundColor: string;
  rules: SpawnRule[];
}

const GREENS = ['#5f8f3a', '#4f7f32', '#6d9c3f', '#3f6f2c', '#7aa64a'];
const DARK_GREENS = ['#3d6b2e', '#4a7a33', '#335f28'];
const HOUSE_WALLS = ['#f3e7c9', '#efe0b0', '#e8d3a8', '#f6efe0', '#dfe8d5', '#f0d9c4'];
const RED_TILES = ['#b5452f', '#a63f2b', '#c0563a', '#9a3a28'];
const TUBE_COLORS = ['#f6e7c1', '#e9f0f7', '#f9d6c4', '#d9efe1', '#f7f1e3', '#fde68a', '#c7e0f4', '#f4c7c7'];
const TOWER_COLORS = ['#e5e7eb', '#d6dce4', '#ece4d8', '#dbe4ee', '#f1efe9'];
const PADDY = ['#86b34c', '#9cc457', '#76a843', '#b4c95e', '#8fbf5a'];
const WATER = ['#5d8fa8', '#4f8299', '#6a9bb0'];
const BILLBOARD = ['#ef4444', '#0ea5e9', '#f59e0b', '#22c55e', '#a855f7', '#f97316'];
const KARST = ['#55705a', '#4b6650', '#5f7a62'];
const HILLS = ['#6b8a5a', '#5d7d4f', '#7a9466'];

export const BIOMES: Record<BiomeId, BiomeDef> = {
  village: {
    id: 'village',
    label: 'Làng quê đồng bằng Hà Nam',
    groundColor: '#6f9a3e',
    nightGroundColor: '#13220f',
    rules: [
      { kind: 'paddy', perChunk: 5, side: 'both', minX: 14, maxX: 90, scaleX: [18, 30], scaleY: [1, 1], scaleZ: [16, 26], palette: PADDY, ground: true, y: 0.01 },
      { kind: 'water', perChunk: 1, side: 'left', minX: 10.5, maxX: 10.5, scaleX: [3.6, 3.6], scaleY: [1, 1], scaleZ: [100, 100], palette: WATER, continuous: true, ground: true, y: 0.02 },
      { kind: 'treeRound', perChunk: 5, side: 'both', minX: 7.5, maxX: 40, scale: [0.8, 1.35], palette: GREENS },
      { kind: 'palm', perChunk: 2, side: 'both', minX: 8, maxX: 35, scale: [0.85, 1.2], palette: GREENS },
      { kind: 'bamboo', perChunk: 3, side: 'both', minX: 22, maxX: 70, scale: [0.9, 1.3], palette: DARK_GREENS },
      { kind: 'villageHouse', perChunk: 3, side: 'both', minX: 24, maxX: 75, scaleX: [5, 7], scaleY: [3, 3.8], scaleZ: [7, 10], palette: HOUSE_WALLS, palette2: RED_TILES, faceRoad: true },
      { kind: 'pole', perChunk: 2, side: 'left', minX: 6.8, maxX: 6.8, scale: [1, 1], continuous: true },
      { kind: 'karst', perChunk: 0.5, side: 'both', minX: 200, maxX: 320, scaleX: [30, 55], scaleY: [40, 85], scaleZ: [30, 55], palette: KARST },
    ],
  },
  town: {
    id: 'town',
    label: 'Thị trấn & TP. Phủ Lý',
    groundColor: '#7c9a4c',
    nightGroundColor: '#161f12',
    rules: [
      { kind: 'tube2', perChunk: 3, side: 'both', minX: 15.5, maxX: 19, palette: TUBE_COLORS, faceRoad: true },
      { kind: 'tube3', perChunk: 4, side: 'both', minX: 15.5, maxX: 19, palette: TUBE_COLORS, faceRoad: true },
      { kind: 'tube4', perChunk: 3, side: 'both', minX: 15.5, maxX: 22, palette: TUBE_COLORS, faceRoad: true },
      { kind: 'tube5', perChunk: 1, side: 'both', minX: 26, maxX: 40, palette: TUBE_COLORS, faceRoad: true },
      { kind: 'treeRound', perChunk: 4, side: 'both', minX: 7.2, maxX: 9, scale: [0.75, 1.0], palette: GREENS },
      { kind: 'pole', perChunk: 3, side: 'both', minX: 6.8, maxX: 6.8, scale: [1, 1], continuous: true },
      { kind: 'billboard', perChunk: 0.6, side: 'both', minX: 9, maxX: 12, scale: [1, 1], palette: BILLBOARD, faceRoad: true },
      { kind: 'villageHouse', perChunk: 3, side: 'both', minX: 40, maxX: 90, scaleX: [5, 7], scaleY: [3, 3.8], scaleZ: [7, 10], palette: HOUSE_WALLS, palette2: RED_TILES, faceRoad: true },
      { kind: 'karst', perChunk: 0.6, side: 'left', minX: 160, maxX: 260, scaleX: [30, 50], scaleY: [45, 90], scaleZ: [30, 50], palette: KARST },
    ],
  },
  expressway: {
    id: 'expressway',
    label: 'Cao tốc Cầu Giẽ – Pháp Vân',
    groundColor: '#83a04a',
    nightGroundColor: '#151f10',
    rules: [
      { kind: 'paddy', perChunk: 6, side: 'both', minX: 16, maxX: 140, scaleX: [24, 40], scaleY: [1, 1], scaleZ: [20, 34], palette: PADDY, ground: true, y: 0.01 },
      { kind: 'treeCone', perChunk: 4, side: 'both', minX: 8, maxX: 11, scale: [0.8, 1.1], palette: DARK_GREENS },
      { kind: 'pylon', perChunk: 1, side: 'right', minX: 70, maxX: 70, scale: [1, 1], continuous: true },
      { kind: 'treeRound', perChunk: 3, side: 'both', minX: 30, maxX: 110, scale: [1, 1.5], palette: GREENS },
      { kind: 'villageHouse', perChunk: 2, side: 'both', minX: 60, maxX: 150, scaleX: [5, 7], scaleY: [3, 3.8], scaleZ: [7, 10], palette: HOUSE_WALLS, palette2: RED_TILES, faceRoad: true },
      { kind: 'factory', perChunk: 0.35, side: 'both', minX: 70, maxX: 160, scale: [0.9, 1.3], palette: ['#d8d4cc', '#cfd6dc'], palette2: ['#3b82f6', '#64748b', '#0f766e'], faceRoad: true },
      { kind: 'billboard', perChunk: 0.3, side: 'both', minX: 14, maxX: 18, scale: [1.2, 1.4], palette: BILLBOARD, faceRoad: true },
      { kind: 'hill', perChunk: 0.4, side: 'both', minX: 220, maxX: 340, scaleX: [60, 110], scaleY: [18, 35], scaleZ: [60, 110], palette: HILLS },
    ],
  },
  suburb: {
    id: 'suburb',
    label: 'Ngoại thành Hà Nội',
    groundColor: '#7d9550',
    nightGroundColor: '#141c11',
    rules: [
      { kind: 'tube3', perChunk: 3, side: 'both', minX: 16, maxX: 24, palette: TUBE_COLORS, faceRoad: true },
      { kind: 'tube4', perChunk: 3, side: 'both', minX: 16, maxX: 26, palette: TUBE_COLORS, faceRoad: true },
      { kind: 'tower10', perChunk: 0.7, side: 'both', minX: 60, maxX: 140, palette: TOWER_COLORS, faceRoad: true },
      { kind: 'tower16', perChunk: 0.4, side: 'both', minX: 90, maxX: 180, palette: TOWER_COLORS, faceRoad: true },
      { kind: 'paddy', perChunk: 2, side: 'both', minX: 30, maxX: 90, scaleX: [18, 26], scaleY: [1, 1], scaleZ: [16, 24], palette: PADDY, ground: true, y: 0.01 },
      { kind: 'treeRound', perChunk: 5, side: 'both', minX: 7.2, maxX: 12, scale: [0.8, 1.2], palette: GREENS },
      { kind: 'billboard', perChunk: 0.7, side: 'both', minX: 10, maxX: 13, scale: [1, 1.2], palette: BILLBOARD, faceRoad: true },
      { kind: 'pole', perChunk: 3, side: 'both', minX: 6.8, maxX: 6.8, scale: [1, 1], continuous: true },
    ],
  },
  city: {
    id: 'city',
    label: 'Nội đô Hà Nội',
    groundColor: '#8a9170',
    nightGroundColor: '#14171a',
    rules: [
      { kind: 'tube4', perChunk: 4, side: 'both', minX: 15.5, maxX: 18, palette: TUBE_COLORS, faceRoad: true },
      { kind: 'tube5', perChunk: 4, side: 'both', minX: 15.5, maxX: 18, palette: TUBE_COLORS, faceRoad: true },
      { kind: 'tower10', perChunk: 1.2, side: 'both', minX: 34, maxX: 70, palette: TOWER_COLORS, faceRoad: true },
      { kind: 'tower16', perChunk: 1.2, side: 'both', minX: 50, maxX: 120, palette: TOWER_COLORS, faceRoad: true },
      { kind: 'tower24', perChunk: 1, side: 'both', minX: 80, maxX: 200, palette: TOWER_COLORS, faceRoad: true },
      { kind: 'treeRound', perChunk: 6, side: 'both', minX: 7.2, maxX: 8.4, scale: [0.85, 1.15], palette: GREENS },
      { kind: 'billboard', perChunk: 0.8, side: 'both', minX: 10, maxX: 13, scale: [1, 1.2], palette: BILLBOARD, faceRoad: true },
    ],
  },
};

/** Biome timeline for the offline route Bình Lục → BX Mỹ Đình (route km). */
export const ROUTE_BIOME_TIMELINE: { fromKm: number; biome: BiomeId }[] = [
  { fromKm: 0, biome: 'village' },
  { fromKm: 8, biome: 'town' },
  { fromKm: 16, biome: 'expressway' },
  { fromKm: 50, biome: 'suburb' },
  { fromKm: 60, biome: 'city' },
];

const CYCLE: BiomeId[] = ['village', 'town', 'expressway', 'suburb', 'city', 'expressway'];

export function getBiomeAtKm(km: number): BiomeId {
  if (km <= 72) {
    let current: BiomeId = 'village';
    for (const entry of ROUTE_BIOME_TIMELINE) {
      if (km >= entry.fromKm) current = entry.biome;
    }
    return current;
  }
  // Longer online routes: cycle biomes every ~15 km
  return CYCLE[Math.floor((km - 72) / 15) % CYCLE.length];
}

export type LandmarkKind = 'riverBridge' | 'tollPlaza' | 'signGantry' | 'skylineTower';

export interface LandmarkDef {
  id: string;
  km: number;
  kind: LandmarkKind;
  /** Sign text lines (gantries / toll plaza) */
  lines?: string[];
}

/** Recognisable route landmarks, spawned on the horizon when the bus nears their km. */
export const ROUTE_LANDMARKS: LandmarkDef[] = [
  { id: 'song-day', km: 10, kind: 'riverBridge', lines: ['CẦU SÔNG ĐÁY'] },
  { id: 'gantry-1', km: 20, kind: 'signGantry', lines: ['CAO TỐC CẦU GIẼ – PHÁP VÂN', 'HÀ NỘI  45 km'] },
  { id: 'toll-dai-xuyen', km: 34, kind: 'tollPlaza', lines: ['TRẠM THU PHÍ ĐẠI XUYÊN'] },
  { id: 'gantry-2', km: 46, kind: 'signGantry', lines: ['PHÁP VÂN  10 km', 'VÀNH ĐAI 3 ↑'] },
  { id: 'skyline', km: 58, kind: 'skylineTower' },
];

/** Metres of scenery per generated chunk. */
export const CHUNK_LENGTH = 100;
