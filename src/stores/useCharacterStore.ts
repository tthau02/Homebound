import { create } from 'zustand';
import {
  BodyType,
  CharacterAccessory,
  CharacterAnimationType,
  CharacterData,
  HairStyle,
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
import { DOOR_Z, PLATFORM_EDGE_X, PLATFORM_Y, STATION_LAYOUTS } from '../game/config/stationConfig';
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
  {
    avatar: string;
    hometown: string;
    bio: string;
    activity: string;
    hair: string;
    bodyType?: BodyType;
    hairStyle?: HairStyle;
    accessories?: CharacterAccessory[];
  }
> = {
  p1: {
    avatar: '👩‍💻',
    hometown: 'Bình Mỹ, Bình Lục',
    bio: 'Kỹ sư phần mềm bắt xe từ Ngã tư 168 Bình Lục lên văn phòng Cầu Giấy làm việc đầu tuần.',
    activity: 'Đang ngắm cảnh bên cửa sổ',
    hair: '#18181b',
    bodyType: 'fem',
    hairStyle: 'long',
    accessories: ['glasses'],
  },
  p2: {
    avatar: '👨‍🌾',
    hometown: 'Đồn Xá, Bình Lục',
    bio: 'Bác nông dân hiếu khách ở gần điểm Bánh mì 168, mang chuối Ngự & bánh đa lên Hà Nội thăm cháu.',
    activity: 'Đang nghỉ ngơi trên ghế',
    hair: '#9ca3af',
    bodyType: 'masc',
    hairStyle: 'buzz',
    accessories: ['nonLa'],
  },
  p3: {
    avatar: '👩‍🎨',
    hometown: 'TP. Phủ Lý, Hà Nam',
    bio: 'Nhà thiết kế đồ họa tự do đón xe tại Nút giao Liêm Tuyền đi Mỹ Đình.',
    activity: 'Đang nghe nhạc thư giãn',
    hair: '#3f2314',
    bodyType: 'fem',
    hairStyle: 'bun',
    accessories: [],
  },
  p4: {
    avatar: '👨‍💼',
    hometown: 'Cầu Giấy, Hà Nội',
    bio: 'Chuyên viên kinh doanh thường xuyên đi công tác tuyến Mỹ Đình – Phủ Lý – Bình Lục.',
    activity: 'Đang trò chuyện vui vẻ',
    hair: '#0f172a',
    bodyType: 'masc',
    hairStyle: 'sidePart',
    accessories: [],
  },
  p5: {
    avatar: '👩‍⚕️',
    hometown: 'An Đổ, Bình Lục',
    bio: 'Bác sĩ trẻ công tác tại khu Giải Phóng – Bạch Mai, xuống xe ở nút giao Pháp Vân.',
    activity: 'Đang đọc sách trên xe',
    hair: '#1e1b18',
    bodyType: 'fem',
    hairStyle: 'ponytail',
    accessories: [],
  },
  p6: {
    avatar: '🧑‍🎓',
    hometown: 'Bình Lục, Hà Nam',
    bio: 'Sinh viên Đại học Thương Mại bắt xe từ Bánh mì 168 lên thẳng Bến xe Mỹ Đình.',
    activity: 'Đang nhìn ra cánh đồng lúa Hà Nam',
    hair: '#09090b',
    bodyType: 'masc',
    hairStyle: 'short',
    accessories: ['glasses', 'backpack'],
  },
  p7: {
    avatar: '👩‍🏫',
    hometown: 'Thanh Xuân, Hà Nội',
    bio: 'Giáo viên tiểu học về thăm quê Bình Lục cuối tuần, chuẩn bị xuống điểm 168 Khuất Duy Tiến.',
    activity: 'Đang mỉm cười thân thiện',
    hair: '#291d12',
    bodyType: 'fem',
    hairStyle: 'long',
    accessories: [],
  },
  p8: {
    avatar: '👨‍🔧',
    hometown: 'Duy Tiên, Hà Nam',
    bio: 'Kỹ thuật viên cơ khí vui tính, thuộc làu từng điểm dừng trên cao tốc Pháp Vân – Cầu Giẽ.',
    activity: 'Đang ngồi thư giãn',
    hair: '#18181b',
    bodyType: 'masc',
    hairStyle: 'short',
    accessories: ['cap'],
  },
  p9: {
    avatar: '👩‍🍳',
    hometown: 'Lý Nhân, Hà Nam',
    bio: 'Đầu bếp mang đặc sản cá kho Vũ Đại và bánh đa Kiện Khê lên biếu người thân ở Mỹ Đình.',
    activity: 'Đang ngắm hàng cây ven đường',
    hair: '#1c1917',
    bodyType: 'fem',
    hairStyle: 'bun',
    accessories: [],
  },
  p10: {
    avatar: '🎸',
    hometown: 'Nam Từ Liêm, Hà Nội',
    bio: 'Nhạc công Acoustic trẻ đang trên chuyến xe từ Hà Nam trở về Bến xe Mỹ Đình.',
    activity: 'Đang ngân nga giai điệu',
    hair: '#0f172a',
    bodyType: 'masc',
    hairStyle: 'sidePart',
    accessories: ['backpack'],
  },
  p11: {
    avatar: '👵',
    hometown: 'Vũ Bản, Bình Lục',
    bio: 'Bà Tư mang gà quê và rau vườn lên thăm con gái ở Thanh Xuân, đi chuyến này đã thành quen.',
    activity: 'Đang ôm làn quà quê',
    hair: '#9ca3af',
    bodyType: 'fem',
    hairStyle: 'bun',
    accessories: [],
  },
  p12: {
    avatar: '🧑‍💻',
    hometown: 'Phủ Lý, Hà Nam',
    bio: 'Lập trình viên làm ở Cầu Giấy, tranh thủ ngủ bù trên xe sau cuối tuần về quê.',
    activity: 'Đang lướt điện thoại',
    hair: '#18181b',
    bodyType: 'masc',
    hairStyle: 'short',
    accessories: ['glasses'],
  },
  p13: {
    avatar: '👩‍🎓',
    hometown: 'Tràng An, Bình Lục',
    bio: 'Sinh viên năm hai Học viện Ngân hàng, hay kể chuyện ký túc xá cho cả xe nghe.',
    activity: 'Đang ngắm đường qua cửa kính',
    hair: '#1c1917',
    bodyType: 'fem',
    hairStyle: 'ponytail',
    accessories: ['backpack'],
  },
  p14: {
    avatar: '👨‍🏭',
    hometown: 'Thanh Liêm, Hà Nam',
    bio: 'Chú Sơn làm thợ xây ở Hà Nội, tuần nào cũng đi về trên chuyến xe này.',
    activity: 'Đang chợp mắt ở hàng ghế cuối',
    hair: '#3f3f46',
    bodyType: 'masc',
    hairStyle: 'buzz',
    accessories: ['cap'],
  },
  p15: {
    avatar: '👩‍🌾',
    hometown: 'Thanh Liêm, Hà Nam',
    bio: 'Cô Liên đi cùng chồng lên Hà Nội khám bệnh định kỳ ở Bạch Mai.',
    activity: 'Đang trò chuyện với chú Sơn',
    hair: '#27272a',
    bodyType: 'fem',
    hairStyle: 'long',
    accessories: [],
  },
  p16: {
    avatar: '🎧',
    hometown: 'Mỹ Đình, Hà Nội',
    bio: 'Bảo Ngọc về quê ngoại chơi hè, giờ quay lại Hà Nội đi học thêm.',
    activity: 'Đang nghe nhạc',
    hair: '#1e1b18',
    bodyType: 'fem',
    hairStyle: 'sidePart',
    accessories: ['glasses'],
  },
};

function createInitialCharacters(): {
  characters: Record<string, CharacterData>;
  characterOrder: string[];
} {
  const floorY = BUS_DIMENSIONS.floorY;
  const characters: Record<string, CharacterData> = {};
  const characterOrder: string[] = [];

  // 1. Main controllable player: waits on the kerb of the first stop, facing the bus
  const [spawnX, spawnZ] = STATION_LAYOUTS.townStop.spawn;
  const player: CharacterData = {
    id: 'player',
    name: 'Bạn (Khách hành trình)',
    avatar: '🧑‍🚀',
    modelUrl: null,
    position: [spawnX, PLATFORM_Y, spawnZ],
    rotationY: Math.PI / 2,
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
    bodyType: 'masc',
    hairStyle: 'sidePart',
    accessories: ['backpack'],
    hometown: 'Bình Lục, Hà Nam',
    bio: 'Hành khách khởi hành từ điểm hẹn Bánh mì 168 Bình Lục lên Bến xe Mỹ Đình.',
    activityLabel: 'Đang chờ xe ở điểm đón',
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
      hometown: 'Hà Nam',
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
      bodyType: profile.bodyType,
      hairStyle: profile.hairStyle,
      accessories: profile.accessories,
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

    if (startPos[0] >= PLATFORM_EDGE_X - 0.05) {
      // Standing outside: walk along the kerb to the door, then up the steps into the aisle
      const kerbX = 2.3;
      if (Math.abs(startPos[2] - DOOR_Z) > 0.3) {
        if (startPos[0] > kerbX + 0.3) waypoints.push([kerbX, PLATFORM_Y, startPos[2]]);
        waypoints.push([kerbX, PLATFORM_Y, DOOR_Z]);
      }
      waypoints.push([0, floorY, DOOR_Z]);
    } else if (Math.abs(startPos[0]) > 0.08) {
      // Waypoint 1: Align with central aisle X = 0 at current Z
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

