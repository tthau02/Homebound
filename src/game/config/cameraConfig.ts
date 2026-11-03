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
    label: 'Trong xe (Interior)',
    shortLabel: 'Trong xe',
    keyTrigger: '1',
    description: 'Góc nhìn dọc lối đi từ giữa/cuối xe hướng về khoang tài xế',
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

export const CAMERA_TRANSITION_CONFIG = {
  /** Smooth damping time in seconds (target 0.4s - 0.8s transition feel) */
  smoothTime: 0.16,
  /** Maximum look offset in interior/chase camera from pointer or drag */
  interiorMaxYaw: 0.55,
  interiorMaxPitch: 0.25,
} as const;

