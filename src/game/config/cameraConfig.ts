import { CameraMode } from '../../stores/useGameStore';

export interface CameraPreset {
  id: CameraMode;
  label: string;
  shortLabel: string;
  keyTrigger: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  cutawayRoof: boolean;
}

export const CAMERA_PRESETS: Record<CameraMode, CameraPreset> = {
  interior: {
    id: 'interior',
    label: 'Theo nhân vật (Follow)',
    shortLabel: 'Nhân vật',
    keyTrigger: '1',
    description: 'Camera bám theo nhân vật, trong xe cũng như ngoài trạm',
    position: [0, 2.18, 4.95],
    target: [0, 1.82, -5.2],
    fov: 58,
    cutawayRoof: false,
  },
  'top-down': {
    id: 'top-down',
    label: 'Trên xuống (Cutaway)',
    shortLabel: 'Trên xuống',
    keyTrigger: '2',
    description: 'Góc nhìn toàn cảnh nội thất từ trên cao với chế độ ẩn trần xe',
    position: [0, 14.8, 0.25],
    target: [0, 1.2, -0.35],
    fov: 48,
    cutawayRoof: true,
  },
  chase: {
    id: 'chase',
    label: 'Sau xe (Rear Chase)',
    shortLabel: 'Sau xe',
    keyTrigger: '3',
    description: 'Camera bám theo đuôi xe quan sát toàn bộ xe và cung đường phía trước',
    position: [0, 4.35, 13.8],
    target: [0, 1.75, -14.0],
    fov: 52,
    cutawayRoof: false,
  },
};

/**
 * Spherical orbit parameters per camera mode.
 * Yaw = 0 places the camera on the +Z side of the pivot (behind the bus, looking toward -Z).
 * Pitch > 0 places the camera above the pivot. Yaw is unbounded (full 360°).
 */
export interface OrbitPreset {
  yaw: number;
  pitch: number;
  distance: number;
  minPitch: number;
  maxPitch: number;
  minDistance: number;
  maxDistance: number;
}

const DEG = Math.PI / 180;

export const ORBIT_PRESETS: Record<CameraMode, OrbitPreset> = {
  interior: {
    yaw: 0,
    pitch: 12 * DEG,
    distance: 2.3,
    minPitch: -55 * DEG,
    maxPitch: 75 * DEG,
    minDistance: 0.45,
    maxDistance: 7.5,
  },
  'top-down': {
    yaw: 0,
    pitch: 72 * DEG,
    distance: 15,
    minPitch: 25 * DEG,
    maxPitch: 89 * DEG,
    minDistance: 7,
    maxDistance: 28,
  },
  chase: {
    yaw: 0,
    pitch: 12 * DEG,
    distance: 22,
    minPitch: 2 * DEG,
    maxPitch: 80 * DEG,
    minDistance: 7,
    maxDistance: 34,
  },
};

export const CAMERA_INPUT_CONFIG = {
  /** Radians per pixel at sensitivity = 1 */
  rotateSpeed: 0.0042,
  /** Pixels a left-button drag must travel before it becomes a camera rotation */
  dragThresholdPx: 4,
  /** Distance multiplier per wheel notch (deltaY = 100) */
  zoomStep: 0.1,
  /** Exponential damping rates (higher = snappier) */
  rotationDamping: 14,
  zoomDamping: 10,
  pivotDamping: 12,
  /** Preferred follow distance while the character walks around a station */
  outdoorDistance: 4.4,
  /** Inner cabin volume used to keep the interior camera from clipping through walls */
  cabinClamp: {
    minX: -1.22,
    maxX: 1.22,
    minY: 0.95,
    maxY: 2.74,
    minZ: -5.85,
    maxZ: 5.95,
  },
} as const;

