export type CharacterStateType = 'idle' | 'walking' | 'sitting' | 'standing';

export type CharacterAnimationType =
  | 'Idle'
  | 'Walking'
  | 'Sitting'
  | 'Standing'
  | 'Talking'
  | 'Waving'
  | 'Laughing'
  | 'Nodding'
  | 'Clapping'
  | 'Sleeping';

export type EmoteType = 'Wave' | 'Smile' | 'Nod' | 'Laugh' | 'Clap' | 'Sleep';

export interface EmoteDefinition {
  id: EmoteType;
  label: string;
  emoji: string;
  animation: CharacterAnimationType;
  defaultChatText: string;
  durationMs: number;
}

export const EMOTE_DEFINITIONS: Record<EmoteType, EmoteDefinition> = {
  Wave: {
    id: 'Wave',
    label: 'Vẫy tay (Wave)',
    emoji: '👋',
    animation: 'Waving',
    defaultChatText: 'Xin chào mọi người trên chuyến xe nhé! 👋',
    durationMs: 3600,
  },
  Smile: {
    id: 'Smile',
    label: 'Mỉm cười (Smile)',
    emoji: '😊',
    animation: 'Talking',
    defaultChatText: 'Chuyến xe miền Tây hôm nay mát mẻ quá 😊',
    durationMs: 3600,
  },
  Nod: {
    id: 'Nod',
    label: 'Gật đầu (Nod)',
    emoji: '😌',
    animation: 'Nodding',
    defaultChatText: 'Đồng ý luôn nhé! 😌👍',
    durationMs: 3200,
  },
  Laugh: {
    id: 'Laugh',
    label: 'Cười vui (Laugh)',
    emoji: '😄',
    animation: 'Laughing',
    defaultChatText: 'Haha vui quá trời luôn! 😄✨',
    durationMs: 3800,
  },
  Clap: {
    id: 'Clap',
    label: 'Vỗ tay (Clap)',
    emoji: '👏',
    animation: 'Clapping',
    defaultChatText: 'Tuyệt vời quá bác tài ơi! 👏🎉',
    durationMs: 3600,
  },
  Sleep: {
    id: 'Sleep',
    label: 'Chợp mắt (Sleep)',
    emoji: '😴',
    animation: 'Sleeping',
    defaultChatText: 'Mình chợp mắt một chút tới trạm dừng nhé... 😴💤',
    durationMs: 8000,
  },
};

export interface CharacterData {
  id: string;
  name: string;
  avatar: string;
  /** Optional external GLB URL; null uses articulated procedural CharacterModel */
  modelUrl: string | null;
  position: [number, number, number];
  rotationY: number;
  state: CharacterStateType;
  currentAnimation: CharacterAnimationType;
  activeEmote: EmoteType | null;
  seatId: string | null;
  targetSeatId: string | null;
  waypoints: Array<[number, number, number]>;
  isPlayer: boolean;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  hometown: string;
  bio: string;
  activityLabel: string;
}

