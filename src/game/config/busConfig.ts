import { PassengerSeatInfo } from '../../stores/useGameStore';

export const BUS_DIMENSIONS = {
  length: 12.4,
  width: 2.76,
  floorY: 0.72,
  chassisBottomY: 0.48,
  ceilingY: 2.88,
  roofTopY: 3.06,
  wallThickness: 0.07,
  windowBottomY: 1.46,
  windowTopY: 2.54,
  wheelRadius: 0.52,
  wheelWidth: 0.32,
  frontAxleZ: -3.65,
  rearAxleZ: 3.55,
  wheelTrackX: 1.26,
} as const;

export const BUS_COLORS = {
  exteriorBodyPrimary: '#f8fafc',
  exteriorStripePrimary: '#dc2626',
  exteriorStripeAccent: '#f59e0b',
  exteriorBumper: '#1e293b',
  ceilingRed: '#991b1b',
  ceilingRedTrim: '#7f1d1d',
  ceilingPanelInner: '#b91c1c',
  seatLeatherMain: '#d97706', // Warm cognac orange-brown leather
  seatLeatherCushion: '#b45309',
  seatHeadrest: '#f59e0b',
  seatFrameDark: '#27272a',
  floorWood: '#3f2e21',
  aisleCarpet: '#475569',
  aisleTrimLED: '#fbbf24',
  wallLowerPanel: '#d6d3d1',
  metalHandrail: '#cbd5e1',
  windowFrameMetal: '#334155',
  dashboardDark: '#18181b',
} as const;

export const SEAT_ROWS_Z = [-3.2, -1.9, -0.6, 0.7, 2.0, 3.3, 4.6] as const;

export const SEAT_COLUMNS_X = {
  leftWindow: -1.02,
  leftAisle: -0.56,
  rightAisle: 0.56,
  rightWindow: 1.02,
} as const;

export const INITIAL_PASSENGERS: PassengerSeatInfo[] = [
  { id: 'p1', seatLabel: '1A', name: 'Minh Anh', row: 0, side: 'left', col: 'window', occupied: true, shirtColor: '#2563eb' },
  { id: 'p2', seatLabel: '1D', name: 'Hoàng Nam', row: 0, side: 'right', col: 'window', occupied: true, shirtColor: '#059669' },
  { id: 'p3', seatLabel: '2B', name: 'Thanh Trúc', row: 1, side: 'left', col: 'aisle', occupied: true, shirtColor: '#db2777' },
  { id: 'p4', seatLabel: '3C', name: 'Quốc Bảo', row: 2, side: 'right', col: 'aisle', occupied: true, shirtColor: '#4f46e5' },
  { id: 'p5', seatLabel: '3D', name: 'Lan Hương', row: 2, side: 'right', col: 'window', occupied: true, shirtColor: '#0d9488' },
  { id: 'p6', seatLabel: '4A', name: 'Văn Khoa', row: 3, side: 'left', col: 'window', occupied: true, shirtColor: '#7c3aed' },
  { id: 'p7', seatLabel: '5B', name: 'Ngọc Mai', row: 4, side: 'left', col: 'aisle', occupied: true, shirtColor: '#e11d48' },
  { id: 'p8', seatLabel: '5D', name: 'Đức Thịnh', row: 4, side: 'right', col: 'window', occupied: true, shirtColor: '#0284c7' },
  { id: 'p9', seatLabel: '6A', name: 'Hải Yến', row: 5, side: 'left', col: 'window', occupied: true, shirtColor: '#16a34a' },
  { id: 'p10', seatLabel: '6C', name: 'Tuấn Kiệt', row: 5, side: 'right', col: 'aisle', occupied: true, shirtColor: '#9333ea' },
];

