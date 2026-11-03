import { create } from 'zustand';
import {
  CharacterAnimationType,
  CharacterData,
  CharacterStateType,
  EMOTE_DEFINITIONS,
  EmoteType,
} from '../game/character/characterTypes';
import {
  BUS_DIMENSIONS,
  INITIAL_PASSENGERS,
  SEAT_COLUMNS_X,
  SEAT_ROWS_Z,
} from '../game/config/busConfig';
import { useSeatStore } from './useSeatStore';

interface CharacterStoreState {
  characters: Record<string, CharacterData>;
  characterOrder: string[];
  playerId: string;
  focusedCharacterId: string | null;

  // Actions
  setFocusedCharacterId: (id: string | null) => void;
  updateCharacterTransform: (
    id: string,
    position: [number, number, number],
    rotationY: number
  ) => void;
  setCharacterStateAndAnimation: (
    id: string,
    state: CharacterStateType,
    animation: CharacterAnimationType,
    activityLabel?: string
  ) => void;
  triggerCharacterEmote: (id: string, emote: EmoteType) => void;
  clearCharacterEmote: (id: string) => void;
  commandMoveToSeat: (characterId: string, seatId: string) => boolean;
  completeSitDownAtSeat: (characterId: string, seatId: string) => boolean;
  standUpFromSeat: (characterId: string) => boolean;
  cancelAutoWalk: (characterId: string) => void;
}

const NPC_PROFILES: Record<
  string,
  { avatar: string; hometown: string; bio: string; activity: string; hair: string }
> = {
  p1: {
    avatar: '👩‍💻',
    hometown: 'Cần Thơ',
    bio: 'Kỹ sư phần mềm về thăm gia đình dịp cuối tuần.',
    activity: 'Đang ngắm cảnh bên cửa sổ',
    hair: '#18181b',
  },
  p2: {
    avatar: '👨‍🌾',
    hometown: 'Tiền Giang',
    bio: 'Chủ vườn trái cây Cái Bè, rất thích trò chuyện cùng khách đi xe.',
    activity: 'Đang nghỉ ngơi trên ghế',
    hair: '#27272a',
  },
  p3: {
    avatar: '👩‍🎨',
    hometown: 'Vĩnh Long',
    bio: 'Họa sĩ minh họa tự do, đang ký họa phong cảnh miền Tây.',
    activity: 'Đang nghe nhạc thư giãn',
    hair: '#3f2314',
  },
  p4: {
    avatar: '👨‍💼',
    hometown: 'TP. Hồ Chí Minh',
    bio: 'Chuyên viên kinh doanh đi công tác tuyến Sài Gòn - Cần Thơ.',
    activity: 'Đang trò chuyện vui vẻ',
    hair: '#0f172a',
  },
  p5: {
    avatar: '👩‍⚕️',
    hometown: 'Đồng Tháp',
    bio: 'Bác sĩ trẻ vừa hoàn thành khóa tập huấn tại TP.HCM.',
    activity: 'Đang đọc sách trên xe',
    hair: '#1e1b18',
  },
  p6: {
    avatar: '🧑‍🎓',
    hometown: 'An Giang',
    bio: 'Sinh viên năm cuối Đại học Bách Khoa về quê nghỉ lễ.',
    activity: 'Đang nhìn ra cánh đồng lúa',
    hair: '#09090b',
  },
  p7: {
    avatar: '👩‍🏫',
    hometown: 'Bến Tre',
    bio: 'Giáo viên tiểu học yêu thích những chuyến xe đường dài.',
    activity: 'Đang mỉm cười thân thiện',
    hair: '#291d12',
  },
  p8: {
    avatar: '👨‍🔧',
    hometown: 'Sóc Trăng',
    bio: 'Kỹ thuật viên cơ khí vui tính, hay kể chuyện cười.',
    activity: 'Đang ngồi thư giãn',
    hair: '#18181b',
  },
  p9: {
    avatar: '👩‍🍳',
    hometown: 'Trà Vinh',
    bio: 'Đầu bếp ẩm thực miền Tây, mang theo nhiều quà quê.',
    activity: 'Đang ngắm hàng cây ven đường',
    hair: '#1c1917',
  },
  p10: {
    avatar: '🎸',
    hometown: 'Bạc Liêu',
    bio: 'Nhạc công trẻ đam mê đờn ca tài tử Nam Bộ.',
    activity: 'Đang ngân nga giai điệu',
    hair: '#0f172a',
  },
};

function createInitialCharacters(): {
  characters: Record<string, CharacterData>;
  characterOrder: string[];
} {
  const floorY = BUS_DIMENSIONS.floorY;
  const characters: Record<string, CharacterData> = {};
  const characterOrder: string[] = [];

  // 1. Main Controllable Player Character (starts standing in the central aisle)
  const player: CharacterData = {
    id: 'player',
    name: 'Bạn (Khách hành trình)',
    avatar: '🧑‍🚀',
    modelUrl: null,
    position: [0, floorY, 1.35],
    rotationY: 0,
    state: 'idle',
    currentAnimation: 'Idle',
    activeEmote: null,
    seatId: null,
    targetSeatId: null,
    waypoints: [],
    isPlayer: true,
    shirtColor: '#f59e0b',
    pantsColor: '#1e293b',
    hairColor: '#18181b',
    hometown: 'TP. Hồ Chí Minh',
    bio: 'Người chơi chính trên chuyến xe khách đường dài Virtual Bus.',
    activityLabel: 'Đang đứng ở lối đi giữa',
  };

  characters[player.id] = player;
  characterOrder.push(player.id);

  // 2. NPC Passengers seated in their initial seats
  for (const p of INITIAL_PASSENGERS) {
    const rowZ = SEAT_ROWS_Z[p.row];
    const colX =
      p.side === 'left'
        ? p.col === 'window'
          ? SEAT_COLUMNS_X.leftWindow
          : SEAT_COLUMNS_X.leftAisle
        : p.col === 'aisle'
          ? SEAT_COLUMNS_X.rightAisle
          : SEAT_COLUMNS_X.rightWindow;

    const profile = NPC_PROFILES[p.id] ?? {
      avatar: '🙂',
      hometown: 'Miền Tây',
      bio: 'Hành khách trên chuyến xe.',
      activity: 'Đang ngồi trên ghế',
      hair: '#18181b',
    };

    characters[p.id] = {
      id: p.id,
      name: p.name,
      avatar: profile.avatar,
      modelUrl: null,
      position: [colX, floorY, rowZ],
      rotationY: 0,
      state: 'sitting',
      currentAnimation: 'Sitting',
      activeEmote: null,
      seatId: p.seatLabel,
      targetSeatId: null,
      waypoints: [],
      isPlayer: false,
      shirtColor: p.shirtColor,
      pantsColor: '#1e293b',
      hairColor: profile.hair,
      hometown: profile.hometown,
      bio: profile.bio,
      activityLabel: profile.activity,
    };
    characterOrder.push(p.id);
  }

  return { characters, characterOrder };
}

const initialCharData = createInitialCharacters();
const emoteTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useCharacterStore = create<CharacterStoreState>((set, get) => ({
  characters: initialCharData.characters,
  characterOrder: initialCharData.characterOrder,
  playerId: 'player',
  focusedCharacterId: null,

  setFocusedCharacterId: (id) => set({ focusedCharacterId: id }),

  updateCharacterTransform: (id, position, rotationY) => {
    const char = get().characters[id];
    if (!char) return;
    set((state) => ({
      characters: {
        ...state.characters,
        [id]: {
          ...state.characters[id],
          position,
          rotationY,
        },
      },
    }));
  },

  setCharacterStateAndAnimation: (id, charState, animation, activityLabel) => {
    const char = get().characters[id];
    if (!char) return;
    if (
      char.state === charState &&
      char.currentAnimation === animation &&
      (!activityLabel || char.activityLabel === activityLabel)
    ) {
      return;
    }

    set((state) => ({
      characters: {
        ...state.characters,
        [id]: {
          ...state.characters[id],
          state: charState,
          currentAnimation: animation,
          activityLabel: activityLabel ?? state.characters[id].activityLabel,
        },
      },
    }));
  },

  triggerCharacterEmote: (id, emote) => {
    const char = get().characters[id];
    if (!char) return;

    const existingTimer = emoteTimers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const def = EMOTE_DEFINITIONS[emote];
    set((state) => ({
      characters: {
        ...state.characters,
        [id]: {
          ...state.characters[id],
          activeEmote: emote,
          currentAnimation: def.animation,
          activityLabel: `Biểu cảm: ${def.label}`,
        },
      },
    }));

    const timer = setTimeout(() => {
      get().clearCharacterEmote(id);
    }, def.durationMs);
    emoteTimers.set(id, timer);
  },

  clearCharacterEmote: (id) => {
    const char = get().characters[id];
    if (!char) return;

    const fallbackAnimation: CharacterAnimationType =
      char.state === 'sitting'
        ? 'Sitting'
        : char.state === 'walking'
          ? 'Walking'
          : 'Idle';

    const fallbackActivity =
      char.state === 'sitting'
        ? `Đang ngồi tại ghế ${char.seatId ?? ''}`
        : char.state === 'walking'
          ? 'Đang di chuyển trên lối đi'
          : 'Đang đứng ở lối đi giữa';

    set((state) => ({
      characters: {
        ...state.characters,
        [id]: {
          ...state.characters[id],
          activeEmote: null,
          currentAnimation: fallbackAnimation,
          activityLabel: fallbackActivity,
        },
      },
    }));
  },

  commandMoveToSeat: (characterId, seatId) => {
    const seatStore = useSeatStore.getState();
    const targetSeat = seatStore.getSeatById(seatId);
    const char = get().characters[characterId];
    if (!targetSeat || !char) return false;

    // Cannot move to a seat already occupied by someone else
    if (targetSeat.occupied && targetSeat.occupantId !== characterId) {
      return false;
    }

    // Already sitting in this exact seat
    if (char.seatId === seatId && char.state === 'sitting') {
      return true;
    }

    const floorY = BUS_DIMENSIONS.floorY;
    const waypoints: Array<[number, number, number]> = [];
    let startPos: [number, number, number] = [...char.position];

    // If currently sitting in another seat, first release it and step into the aisle
    if (char.seatId && char.state === 'sitting') {
      const oldSeat = seatStore.getSeatById(char.seatId);
      seatStore.releaseSeatByCharacter(characterId);
      if (oldSeat) {
        startPos = [0, floorY, oldSeat.position[2] - 0.08];
      } else {
        startPos = [0, floorY, char.position[2]];
      }
    }

    // Waypoint 1: Align with central aisle X = 0 at current Z
    if (Math.abs(startPos[0]) > 0.08) {
      waypoints.push([0, floorY, startPos[2]]);
    }

    // Waypoint 2: Walk along the central aisle to the target seat row Z
    waypoints.push([0, floorY, targetSeat.position[2] - 0.1]);

    // Waypoint 3: Step laterally into the seat's exact position
    waypoints.push([...targetSeat.position]);

    set((state) => ({
      characters: {
        ...state.characters,
        [characterId]: {
          ...state.characters[characterId],
          position: startPos,
          seatId: null,
          targetSeatId: seatId,
          waypoints,
          state: 'walking',
          currentAnimation: 'Walking',
          activeEmote: null,
          activityLabel: `Đang đi tới ghế ${seatId}...`,
        },
      },
    }));

    return true;
  },

  completeSitDownAtSeat: (characterId, seatId) => {
    const seatStore = useSeatStore.getState();
    const targetSeat = seatStore.getSeatById(seatId);
    if (!targetSeat) return false;

    // Claim seat atomically via SeatStore
    const success = seatStore.occupySeat(seatId, characterId);
    if (!success) {
      // Someone else claimed it; stop in the aisle
      get().cancelAutoWalk(characterId);
      return false;
    }

    set((state) => ({
      characters: {
        ...state.characters,
        [characterId]: {
          ...state.characters[characterId],
          position: [...targetSeat.position],
          rotationY: targetSeat.rotationY,
          state: 'sitting',
          currentAnimation: 'Sitting',
          seatId,
          targetSeatId: null,
          waypoints: [],
          activityLabel: `Đang ngồi tại ghế ${seatId}`,
        },
      },
    }));
    return true;
  },

  standUpFromSeat: (characterId) => {
    const char = get().characters[characterId];
    if (!char || char.state !== 'sitting') return false;

    const seatStore = useSeatStore.getState();
    const oldSeat = char.seatId ? seatStore.getSeatById(char.seatId) : undefined;
    seatStore.releaseSeatByCharacter(characterId);

    const floorY = BUS_DIMENSIONS.floorY;
    const standZ = oldSeat ? oldSeat.position[2] - 0.05 : char.position[2];
    const aislePos: [number, number, number] = [0, floorY, standZ];

    set((state) => ({
      characters: {
        ...state.characters,
        [characterId]: {
          ...state.characters[characterId],
          position: aislePos,
          rotationY: 0,
          state: 'standing',
          currentAnimation: 'Standing',
          seatId: null,
          targetSeatId: null,
          waypoints: [],
          activeEmote: null,
          activityLabel: 'Đang đứng ở lối đi giữa',
        },
      },
    }));

    // Transition smoothly from 'standing' to 'idle' after 450ms
    setTimeout(() => {
      const latest = get().characters[characterId];
      if (latest && latest.state === 'standing') {
        get().setCharacterStateAndAnimation(
          characterId,
          'idle',
          'Idle',
          'Đang đứng ở lối đi giữa'
        );
      }
    }, 450);

    return true;
  },

  cancelAutoWalk: (characterId) => {
    const char = get().characters[characterId];
    if (!char) return;
    set((state) => ({
      characters: {
        ...state.characters,
        [characterId]: {
          ...state.characters[characterId],
          targetSeatId: null,
          waypoints: [],
          state: 'idle',
          currentAnimation: 'Idle',
          activityLabel: 'Đang đứng ở lối đi giữa',
        },
      },
    }));
  },
}));

