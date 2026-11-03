export type SeatSide = 'left' | 'right';
export type SeatColumnType = 'window' | 'aisle';

export interface SeatData {
  seatId: string;
  row: number;
  side: SeatSide;
  col: SeatColumnType;
  /** Local position inside BusSuspendedBody [x, y, z] */
  position: [number, number, number];
  /** Entry point in the central aisle for walking to/from this seat [x, y, z] */
  aisleEntryPosition: [number, number, number];
  /** Target yaw rotation when sitting (0 = facing -Z front of bus) */
  rotationY: number;
  occupantId: string | null;
  occupied: boolean;
}

