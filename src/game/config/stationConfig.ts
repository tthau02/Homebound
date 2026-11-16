/**
 * Station layouts (pure data, no store imports).
 * A station is a ground-locked set piece on the +X side of the bus lane. Coordinates are in
 * station-local metres: x grows away from the road, z follows the world Z axis and z = 0 is
 * the centre of the docked bus (door at z = DOOR_Z).
 *
 * The same data drives rendering (RouteStation), player collision (CharacterController),
 * context prompts (ActionDock) and the ambient crowd (StationPeople).
 */

export type StationLayoutId = 'townStop' | 'restStop' | 'cityStop' | 'terminal';

/** Height of the kerb / pavement surface above the asphalt. */
export const PLATFORM_Y = 0.22;
/** Z of the bus entry door centre. */
export const DOOR_Z = -4.75;
export const DOOR_HALF_WIDTH = 0.6;
/** First walkable X outside the bus body. */
export const PLATFORM_EDGE_X = 1.45;
/** Where a passenger stands right after stepping off. */
export const DOOR_EXIT_SPOT: [number, number, number] = [2.4, PLATFORM_Y, DOOR_Z];

export interface StationRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export type StationInteractableKind = 'stall' | 'photo' | 'info';

export interface StationInteractable {
  id: string;
  kind: StationInteractableKind;
  /** Short verb phrase shown on the context button. */
  label: string;
  x: number;
  z: number;
  radius: number;
  /** What the player says in a chat bubble. */
  playerLine: string;
  toast: string;
}

export type StationPersonPose = 'stand' | 'sit' | 'walk' | 'wave' | 'talk';

export interface StationPerson {
  id: string;
  x: number;
  z: number;
  rotY: number;
  pose: StationPersonPose;
  /** Walkers pace between (x, z) and this point. */
  walkTo?: [number, number];
  bodyType?: 'masc' | 'fem';
  shirt?: string;
  accessory?: 'nonLa' | 'cap' | 'backpack' | 'glasses';
}

export interface StationLayout {
  id: StationLayoutId;
  /** Half extent along Z of the paved area. */
  halfLength: number;
  /** How far the paved area reaches from the road (max X). */
  depth: number;
  walkBounds: StationRect;
  obstacles: StationRect[];
  interactables: StationInteractable[];
  people: StationPerson[];
  /** Where the player spawns when a journey starts here. */
  spawn: [number, number];
}

const rect = (minX: number, maxX: number, minZ: number, maxZ: number): StationRect => ({ minX, maxX, minZ, maxZ });
/** Facing helpers (rotationY): a character with rotationY = 0 faces -Z. */
const FACE_ROAD = Math.PI / 2;
const FACE_AWAY = -Math.PI / 2;
const FACE_BACK = Math.PI;

export const STATION_LAYOUTS: Record<StationLayoutId, StationLayout> = {
  // Roadside pick-up point in a small town: bánh mì shop, tea stall, bus shelter.
  townStop: {
    id: 'townStop',
    halfLength: 20,
    depth: 17,
    spawn: [4.6, -2.4],
    walkBounds: rect(PLATFORM_EDGE_X, 10.2, -19.4, 19.4),
    obstacles: [
      rect(4.5, 5.7, -12.7, -8.3), // shelter bench + back panel
      rect(7.7, 9.1, -4.4, -2.0), // bánh mì cart
      rect(6.4, 7.6, 4.4, 5.6), // tea table
      rect(8.2, 9.7, 10.3, 15.7), // parked motorbikes
      rect(2.9, 3.9, 11.5, 12.5), // tree planter
      rect(2.9, 3.9, -16.0, -15.0),
    ],
    interactables: [
      {
        id: 'banh-mi',
        kind: 'stall',
        label: 'Mua bánh mì 168',
        x: 7.2,
        z: -3.2,
        radius: 2.2,
        playerLine: 'Cô ơi cho cháu một ổ bánh mì pa-tê nóng ạ! 🥖',
        toast: 'Ổ bánh mì 168 nóng giòn, thơm mùi pa-tê!',
      },
      {
        id: 'tra-da',
        kind: 'stall',
        label: 'Uống trà đá',
        x: 6.0,
        z: 5.0,
        radius: 2.0,
        playerLine: 'Cho cháu cốc trà đá bác ơi! 🍵',
        toast: 'Một cốc trà đá mát lạnh trước giờ xe chạy.',
      },
    ],
    people: [
      { id: 'me', x: 5.6, z: -1.5, rotY: Math.PI * 0.82, pose: 'wave', bodyType: 'fem', shirt: '#9d4b6c', accessory: 'nonLa' },
      { id: 'banhmi-vendor', x: 9.5, z: -3.2, rotY: FACE_ROAD, pose: 'stand', bodyType: 'fem', shirt: '#f1f5f9' },
      { id: 'shelter-1', x: 4.82, z: -10.9, rotY: FACE_ROAD, pose: 'sit', bodyType: 'masc', accessory: 'backpack' },
      { id: 'tea-1', x: 6.15, z: 5.0, rotY: FACE_AWAY, pose: 'sit', bodyType: 'masc', accessory: 'cap' },
      { id: 'tea-2', x: 7.85, z: 5.0, rotY: FACE_ROAD, pose: 'sit', bodyType: 'masc' },
      { id: 'walker-1', x: 9.6, z: -17, rotY: 0, pose: 'walk', walkTo: [9.6, 8.5], bodyType: 'fem' },
      { id: 'xe-om', x: 7.6, z: 12.8, rotY: FACE_ROAD, pose: 'stand', bodyType: 'masc', accessory: 'cap' },
    ],
  },

  // Expressway service area: food hall, sugar-cane stall, local specialities, parking.
  restStop: {
    id: 'restStop',
    halfLength: 26,
    depth: 31,
    spawn: [4.2, -2.4],
    walkBounds: rect(PLATFORM_EDGE_X, 18.3, -25.2, 25.2),
    obstacles: [
      rect(7.3, 8.8, 0.4, 2.7), // sugar-cane cart
      rect(7.3, 8.8, 6.8, 9.3), // specialities stall
      rect(10.9, 12.1, -9.6, -8.4), // umbrella tables
      rect(10.9, 12.1, -5.1, -3.9),
      rect(13.9, 15.1, -7.4, -6.2),
      rect(4.6, 5.4, -17.8, -12.2), // check-in sign
      rect(6.9, 9.1, 11.6, 16.4), // parked cars
      rect(6.9, 9.1, 17.6, 22.4),
      rect(11.1, 13.9, 11.0, 23.2), // parked coach
    ],
    interactables: [
      {
        id: 'nuoc-mia',
        kind: 'stall',
        label: 'Mua nước mía',
        x: 6.8,
        z: 1.5,
        radius: 2.4,
        playerLine: 'Cho con 1 ly nước mía nhiều đá nha cô ơi! 🥤',
        toast: 'Ly nước mía mát lạnh giữa chặng đường (+10 năng lượng)!',
      },
      {
        id: 'dac-san',
        kind: 'stall',
        label: 'Xem đặc sản Hà Nam',
        x: 6.8,
        z: 8.0,
        radius: 2.2,
        playerLine: 'Bánh đa Kiện Khê với chuối Ngự bán thế nào cô ơi? 🍌',
        toast: 'Bạn mua một túi bánh đa Kiện Khê làm quà.',
      },
      {
        id: 'check-in',
        kind: 'photo',
        label: 'Chụp ảnh check-in',
        x: 3.6,
        z: -15,
        radius: 2.6,
        playerLine: '📸 Check-in trạm dừng Km227 Liêm Tuyền!',
        toast: 'Đã lưu một tấm ảnh kỷ niệm ở trạm dừng nghỉ.',
      },
    ],
    people: [
      { id: 'mia-vendor', x: 9.3, z: 1.5, rotY: FACE_ROAD, pose: 'stand', bodyType: 'fem', accessory: 'nonLa' },
      { id: 'dacsan-vendor', x: 9.3, z: 8.0, rotY: FACE_ROAD, pose: 'stand', bodyType: 'fem' },
      { id: 'table-1', x: 10.55, z: -9.0, rotY: FACE_AWAY, pose: 'sit', bodyType: 'masc' },
      { id: 'table-2', x: 12.45, z: -9.0, rotY: FACE_ROAD, pose: 'sit', bodyType: 'fem' },
      { id: 'table-3', x: 14.5, z: -7.75, rotY: FACE_BACK, pose: 'sit', bodyType: 'masc', accessory: 'glasses' },
      { id: 'chat-1', x: 15.6, z: 2.0, rotY: 0.3, pose: 'talk', bodyType: 'masc' },
      { id: 'chat-2', x: 15.5, z: 0.6, rotY: FACE_BACK - 0.2, pose: 'talk', bodyType: 'fem' },
      { id: 'walker-1', x: 17.2, z: -20, rotY: 0, pose: 'walk', walkTo: [17.2, 9], bodyType: 'masc', accessory: 'backpack' },
      { id: 'walker-2', x: 4.0, z: 9, rotY: 0, pose: 'walk', walkTo: [13.5, 4.5], bodyType: 'fem' },
      { id: 'photo-1', x: 3.3, z: -12.0, rotY: FACE_BACK, pose: 'wave', bodyType: 'fem', accessory: 'cap' },
      { id: 'driver-1', x: 10.4, z: 14.0, rotY: FACE_ROAD, pose: 'stand', bodyType: 'masc' },
    ],
  },

  // Inner-city kerbside stop: glass shelter, shop fronts, street vendors.
  cityStop: {
    id: 'cityStop',
    halfLength: 22,
    depth: 16,
    spawn: [3.8, -2.4],
    walkBounds: rect(PLATFORM_EDGE_X, 8.9, -21.4, 21.4),
    obstacles: [
      rect(4.2, 5.4, -12.8, -8.2), // shelter
      rect(5.9, 7.3, 2.2, 4.4), // drinks cart
      rect(2.5, 3.3, 8.6, 9.4), // tree pits
      rect(2.5, 3.3, -17.4, -16.6),
      rect(2.5, 3.3, 16.6, 17.4),
      rect(7.6, 8.9, 10.2, 14.8), // parked motorbikes
    ],
    interactables: [
      {
        id: 'tra-chanh',
        kind: 'stall',
        label: 'Mua trà chanh',
        x: 5.2,
        z: 3.3,
        radius: 2.1,
        playerLine: 'Cho em một cốc trà chanh mang đi ạ! 🍋',
        toast: 'Cốc trà chanh vỉa hè đúng chất Hà Nội.',
      },
      {
        id: 'route-map',
        kind: 'info',
        label: 'Xem bản đồ tuyến',
        x: 3.2,
        z: -7.4,
        radius: 1.8,
        playerLine: 'Để xem còn mấy điểm nữa thì tới Mỹ Đình... 🗺️',
        toast: 'Bảng tuyến: Pháp Vân → Khuất Duy Tiến → BX Mỹ Đình.',
      },
    ],
    people: [
      { id: 'wait-1', x: 4.52, z: -11.2, rotY: FACE_ROAD, pose: 'sit', bodyType: 'fem' },
      { id: 'wait-2', x: 3.6, z: -9.2, rotY: FACE_ROAD + 0.3, pose: 'stand', bodyType: 'masc', accessory: 'backpack' },
      { id: 'vendor', x: 7.7, z: 3.3, rotY: FACE_ROAD, pose: 'stand', bodyType: 'fem', accessory: 'nonLa' },
      { id: 'walker-1', x: 8.2, z: -20, rotY: 0, pose: 'walk', walkTo: [8.2, 8], bodyType: 'masc' },
      { id: 'walker-2', x: 7.1, z: 20, rotY: 0, pose: 'walk', walkTo: [7.1, -6], bodyType: 'fem', accessory: 'glasses' },
      { id: 'walker-3', x: 6.2, z: -18, rotY: 0, pose: 'walk', walkTo: [6.2, -1], bodyType: 'fem' },
      { id: 'xe-om', x: 7.1, z: 12.4, rotY: FACE_ROAD, pose: 'stand', bodyType: 'masc', accessory: 'cap' },
      { id: 'chat-1', x: 8.0, z: -4.2, rotY: 0.2, pose: 'talk', bodyType: 'masc' },
      { id: 'chat-2', x: 8.0, z: -5.5, rotY: FACE_BACK, pose: 'talk', bodyType: 'masc', accessory: 'glasses' },
    ],
  },

  // Big inter-provincial terminal: hall, covered bays with parked coaches, kiosks.
  terminal: {
    id: 'terminal',
    halfLength: 28,
    depth: 37,
    spawn: [4.2, -2.4],
    walkBounds: rect(PLATFORM_EDGE_X, 22.6, -27.2, 27.2),
    obstacles: [
      rect(6.2, 8.0, -15.4, -12.6), // information kiosk
      rect(5.8, 7.2, 2.9, 5.1), // drinks kiosk
      rect(9.2, 12.2, 5.0, 17.2), // parked coaches
      rect(15.6, 18.6, -15.2, -3.0),
      rect(15.6, 18.6, 5.0, 17.2),
      rect(12.9, 14.1, -9.2, -4.8), // bench rows
      rect(12.9, 14.1, -1.2, 3.2),
    ],
    interactables: [
      {
        id: 'info',
        kind: 'info',
        label: 'Hỏi quầy thông tin',
        x: 5.4,
        z: -14,
        radius: 2.2,
        playerLine: 'Chị ơi, xe buýt về Cầu Giấy bắt ở cửa nào ạ? 🚏',
        toast: 'Quầy thông tin: xe buýt nội đô đón ở cổng phía Phạm Hùng.',
      },
      {
        id: 'tra-da-ben-xe',
        kind: 'stall',
        label: 'Mua nước',
        x: 5.0,
        z: 4.0,
        radius: 2.0,
        playerLine: 'Cho em chai nước suối ạ! 💧',
        toast: 'Một chai nước mát sau chuyến đi dài.',
      },
    ],
    people: [
      { id: 'info-staff', x: 8.6, z: -14.0, rotY: FACE_ROAD, pose: 'stand', bodyType: 'fem', shirt: '#1d4ed8' },
      { id: 'kiosk-vendor', x: 7.8, z: 4.0, rotY: FACE_ROAD, pose: 'stand', bodyType: 'fem' },
      { id: 'bench-1', x: 13.5, z: -8.2, rotY: FACE_ROAD, pose: 'sit', bodyType: 'masc', accessory: 'backpack' },
      { id: 'bench-2', x: 13.5, z: -6.0, rotY: FACE_ROAD, pose: 'sit', bodyType: 'fem' },
      { id: 'bench-3', x: 13.5, z: 0.4, rotY: FACE_ROAD, pose: 'sit', bodyType: 'masc', accessory: 'cap' },
      { id: 'bench-4', x: 13.5, z: 2.2, rotY: FACE_ROAD, pose: 'sit', bodyType: 'fem', accessory: 'glasses' },
      { id: 'walker-1', x: 21.0, z: -24, rotY: 0, pose: 'walk', walkTo: [21.0, 20], bodyType: 'masc' },
      { id: 'walker-2', x: 20.0, z: 22, rotY: 0, pose: 'walk', walkTo: [20.0, -18], bodyType: 'fem', accessory: 'backpack' },
      { id: 'walker-3', x: 3.6, z: 14, rotY: 0, pose: 'walk', walkTo: [8.4, 22], bodyType: 'masc', accessory: 'backpack' },
      { id: 'walker-4', x: 5.0, z: -22, rotY: 0, pose: 'walk', walkTo: [11.0, -18], bodyType: 'fem' },
      { id: 'greeter', x: 4.6, z: -7.6, rotY: FACE_ROAD - 0.4, pose: 'wave', bodyType: 'masc', shirt: '#0f766e' },
      { id: 'chat-1', x: 10.4, z: -1.0, rotY: 0.2, pose: 'talk', bodyType: 'fem' },
      { id: 'chat-2', x: 10.4, z: -2.3, rotY: FACE_BACK, pose: 'talk', bodyType: 'masc' },
      { id: 'porter', x: 14.6, z: 11.0, rotY: FACE_AWAY, pose: 'stand', bodyType: 'masc', accessory: 'cap' },
    ],
  },
};

export function isInsideRect(r: StationRect, x: number, z: number, margin = 0): boolean {
  return x > r.minX - margin && x < r.maxX + margin && z > r.minZ - margin && z < r.maxZ + margin;
}

/** True when a standing character (radius ≈ 0.25 m) may occupy this spot of the station. */
export function isStationWalkable(layout: StationLayout, x: number, z: number): boolean {
  const b = layout.walkBounds;
  if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return false;
  for (const o of layout.obstacles) {
    if (isInsideRect(o, x, z, 0.22)) return false;
  }
  return true;
}

/** Nearest interactable whose radius contains the point, or null. */
export function findStationInteractable(layout: StationLayout, x: number, z: number): StationInteractable | null {
  let best: StationInteractable | null = null;
  let bestDist = Infinity;
  for (const it of layout.interactables) {
    const d = Math.hypot(it.x - x, it.z - z);
    if (d < it.radius && d < bestDist) {
      best = it;
      bestDist = d;
    }
  }
  return best;
}
