import { create } from 'zustand';
import { SeatData } from '../game/seat/seatTypes';
import {
  BUS_DIMENSIONS,
  INITIAL_PASSENGERS,
  SEAT_COLUMNS_X,
  SEAT_ROWS_Z,
} from '../game/config/busConfig';

interface SeatStoreState {
  seats: Record<string, SeatData>;
  seatOrder: string[];
  hoveredSeatId: string | null;

  // Actions
  setHoveredSeatId: (seatId: string | null) => void;
  occupySeat: (seatId: string, characterId: string) => boolean;
  releaseSeatByCharacter: (characterId: string) => string | null;
  releaseSeat: (seatId: string) => void;
  getSeatById: (seatId: string) => SeatData | undefined;
  getCharacterSeat: (characterId: string) => SeatData | undefined;
}

function buildInitialSeats(): {
  seats: Record<string, SeatData>;
  seatOrder: string[];
} {
  const seats: Record<string, SeatData> = {};
  const seatOrder: string[] = [];
  const floorY = BUS_DIMENSIONS.floorY;

  const colDefs: Array<{
    letter: string;
    side: 'left' | 'right';
    col: 'window' | 'aisle';
    x: number;
  }> = [
    { letter: 'A', side: 'left', col: 'window', x: SEAT_COLUMNS_X.leftWindow },
    { letter: 'B', side: 'left', col: 'aisle', x: SEAT_COLUMNS_X.leftAisle },
    { letter: 'C', side: 'right', col: 'aisle', x: SEAT_COLUMNS_X.rightAisle },
    { letter: 'D', side: 'right', col: 'window', x: SEAT_COLUMNS_X.rightWindow },
  ];

  // Map initial NPC passengers from busConfig
  const initialOccupantByKey = new Map<string, string>();
  for (const p of INITIAL_PASSENGERS) {
    if (p.occupied) {
      initialOccupantByKey.set(`${p.row}-${p.side}-${p.col}`, p.id);
    }
  }

  SEAT_ROWS_Z.forEach((rowZ, rowIdx) => {
    const rowNumber = rowIdx + 1;
    for (const colDef of colDefs) {
      const seatId = `${rowNumber}${colDef.letter}`;
      const key = `${rowIdx}-${colDef.side}-${colDef.col}`;
      const occupantId = initialOccupantByKey.get(key) ?? null;

      seats[seatId] = {
        seatId,
        row: rowIdx,
        side: colDef.side,
        col: colDef.col,
        position: [colDef.x, floorY, rowZ],
        aisleEntryPosition: [0, floorY, rowZ - 0.12],
        rotationY: 0,
        occupantId,
        occupied: occupantId !== null,
      };
      seatOrder.push(seatId);
    }
  });

  return { seats, seatOrder };
}

const initialData = buildInitialSeats();

export const useSeatStore = create<SeatStoreState>((set, get) => ({
  seats: initialData.seats,
  seatOrder: initialData.seatOrder,
  hoveredSeatId: null,

  setHoveredSeatId: (seatId) => set({ hoveredSeatId: seatId }),

  occupySeat: (seatId, characterId) => {
    const state = get();
    const targetSeat = state.seats[seatId];
    if (!targetSeat) return false;

    // Prevent two characters from occupying the same seat
    if (targetSeat.occupied && targetSeat.occupantId !== characterId) {
      return false;
    }

    const updatedSeats = { ...state.seats };

    // Free any previous seat held by this character
    for (const id of state.seatOrder) {
      if (updatedSeats[id].occupantId === characterId && id !== seatId) {
        updatedSeats[id] = {
          ...updatedSeats[id],
          occupantId: null,
          occupied: false,
        };
      }
    }

    updatedSeats[seatId] = {
      ...targetSeat,
      occupantId: characterId,
      occupied: true,
    };

    set({ seats: updatedSeats });
    return true;
  },

  releaseSeatByCharacter: (characterId) => {
    const state = get();
    let releasedId: string | null = null;
    const updatedSeats = { ...state.seats };

    for (const id of state.seatOrder) {
      if (updatedSeats[id].occupantId === characterId) {
        releasedId = id;
        updatedSeats[id] = {
          ...updatedSeats[id],
          occupantId: null,
          occupied: false,
        };
      }
    }

    if (releasedId) {
      set({ seats: updatedSeats });
    }
    return releasedId;
  },

  releaseSeat: (seatId) => {
    const state = get();
    const seat = state.seats[seatId];
    if (!seat || !seat.occupied) return;

    set({
      seats: {
        ...state.seats,
        [seatId]: {
          ...seat,
          occupantId: null,
          occupied: false,
        },
      },
    });
  },

  getSeatById: (seatId) => get().seats[seatId],

  getCharacterSeat: (characterId) => {
    const state = get();
    for (const id of state.seatOrder) {
      if (state.seats[id].occupantId === characterId) {
        return state.seats[id];
      }
    }
    return undefined;
  },
}));

