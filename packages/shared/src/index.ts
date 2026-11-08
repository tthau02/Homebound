export const SOCKET_NAMESPACE = '/bus-multiplayer';

export const SOCKET_EVENTS = {
  // Client -> Server
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  PLAYER_MOVE: 'player:move',
  PLAYER_SIT: 'player:sit',
  PLAYER_STAND: 'player:stand',
  PLAYER_EMOTE: 'player:emote',
  CHAT_SEND: 'chat:send',
  JOURNEY_START: 'journey:start',
  JOURNEY_STOP: 'journey:stop',
  JOURNEY_NEXT_STOP: 'journey:next-stop',
  JOURNEY_ANNOUNCE: 'journey:announce',
  TICKET_BOOK: 'ticket:book',
  TICKET_PAY: 'ticket:pay',
  TICKET_CHECK: 'ticket:check',
  MUSIC_PLAY: 'music:play',
  MUSIC_PAUSE: 'music:pause',
  MUSIC_NEXT: 'music:next',
  MUSIC_VOLUME: 'music:volume',
  ROLE_ASSIGN: 'role:assign',

  // Server -> Client
  ROOM_JOINED: 'room:joined',
  ROOM_PLAYER_JOINED: 'room:player-joined',
  ROOM_PLAYER_LEFT: 'room:player-left',
  ROOM_STATE: 'room:state',
  ROOM_LIST_UPDATED: 'room:list-updated',
  PLAYER_MOVED: 'player:moved',
  PLAYER_SAT: 'player:sat',
  PLAYER_STOOD: 'player:stood',
  PLAYER_EMOTE_BROADCAST: 'player:emote',
  CHAT_MESSAGE: 'chat:message',
  JOURNEY_UPDATED: 'journey:updated',
  BUS_STOP_ARRIVED: 'bus:stop-arrived',
  TICKET_UPDATED: 'ticket:updated',
  MUSIC_UPDATED: 'music:updated',
  SERVER_ERROR: 'server:error',
} as const;

export type PlayerRole = 'OWNER' | 'DRIVER' | 'ASSISTANT' | 'PASSENGER';

export type RoomStatus =
  | 'WAITING'
  | 'BOARDING'
  | 'RUNNING'
  | 'STOPPED_AT_STATION'
  | 'COMPLETED';

export type JourneyStatus =
  | 'IDLE'
  | 'IN_TRANSIT'
  | 'AT_STOP'
  | 'PAUSED'
  | 'FINISHED';

export type JourneyWeather = 'SUNNY' | 'CLOUDY' | 'RAINY';
export type JourneyTimeOfDay = 'DAY' | 'NIGHT';

export type TicketStatus = 'BOOKED' | 'PAID' | 'CHECKED' | 'CANCELLED';

export type SharedCharacterState = 'idle' | 'walking' | 'sitting' | 'standing';

export type SharedAnimationType =
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

export type SharedEmoteType =
  | 'Wave'
  | 'Smile'
  | 'Nod'
  | 'Laugh'
  | 'Clap'
  | 'Sleep';

export interface AuthUserDto {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  shirtColor: string;
  walletBalance: number;
  bio?: string;
  interests?: string[];
  profileVisibility?: 'public' | 'private';
  baseAvatar?: string;
  baseShirtColor?: string;
  inventoryItemIds?: string[];
  equippedItemId?: string | null;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface RegisterRequestDto {
  username: string;
  password: string;
  displayName: string;
  avatar?: string;
  shirtColor?: string;
  bio?: string;
  interests?: string[];
  profileVisibility?: 'public' | 'private';
}

export interface AuthResponseDto {
  accessToken: string;
  user: AuthUserDto;
}

export interface BusStopDto {
  id: string;
  routeId: string;
  name: string;
  order: number;
  distanceKm: number;
  description: string;
}

export interface BusRouteDto {
  id: string;
  name: string;
  origin: string;
  destination: string;
  totalDistanceKm: number;
  ticketPrice: number;
  stops: BusStopDto[];
}

export interface BusJourneyDto {
  id: string;
  roomId: string;
  routeId: string;
  currentStopOrder: number;
  status: JourneyStatus;
  weather: JourneyWeather;
  timeOfDay: JourneyTimeOfDay;
  speedKmh: number;
  announcement: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
}

export interface BusTicketDto {
  id: string;
  playerId: string;
  playerName: string;
  journeyId: string;
  roomId: string;
  seatId: string;
  price: number;
  status: TicketStatus;
  paidAt: string | null;
  checkedByAssistant: boolean;
}

export interface MultiplayerPlayerState {
  playerId: string;
  username: string;
  displayName: string;
  avatar: string;
  shirtColor: string;
  role: PlayerRole;
  position: [number, number, number];
  rotationY: number;
  state: SharedCharacterState;
  animation: SharedAnimationType;
  activeEmote: SharedEmoteType | null;
  seatId: string | null;
  isDisembarked: boolean;
  connected: boolean;
  walletBalance: number;
  bio?: string;
  interests?: string[];
  profileVisibility?: 'public' | 'private';
  baseAvatar?: string;
  baseShirtColor?: string;
  inventoryItemIds?: string[];
  equippedItemId?: string | null;
}

export interface CosmeticShopItemDto {
  id: string;
  name: string;
  description: string;
  priceCoins: number;
  avatar?: string;
  shirtColor?: string;
}

export const COSMETIC_SHOP_ITEMS: CosmeticShopItemDto[] = [
  {
    id: 'look-mekong-sunset',
    name: 'Hoàng hôn Mekong',
    description: 'Áo khoác màu cam hoàng hôn.',
    priceCoins: 120,
    shirtColor: '#f97316',
  },
  {
    id: 'look-river-teal',
    name: 'Sóng nước miền Tây',
    description: 'Áo màu xanh ngọc dịu mắt.',
    priceCoins: 150,
    shirtColor: '#0f766e',
  },
  {
    id: 'look-night-violet',
    name: 'Đêm cao nguyên',
    description: 'Áo tím cho những chuyến xe đêm.',
    priceCoins: 180,
    shirtColor: '#7c3aed',
  },
  {
    id: 'avatar-cat',
    name: 'Mèo du lịch',
    description: 'Avatar mèo vui vẻ cho hồ sơ.',
    priceCoins: 90,
    avatar: '🐱',
  },
  {
    id: 'avatar-capybara',
    name: 'Capybara thư thái',
    description: 'Avatar capybara cho chuyến đi bình yên.',
    priceCoins: 110,
    avatar: '🦫',
  },
];

export interface ChatMessageDto {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: PlayerRole;
  recipientId: string | null;
  recipientName: string | null;
  content: string;
  scope: 'PUBLIC' | 'PRIVATE' | 'SYSTEM';
  createdAt: string;
}

export interface MusicTrackDto {
  id: string;
  title: string;
  artist: string;
  tempoBpm: number;
  notesHz: number[];
  durationSec: number;
}

export interface MusicStateDto {
  roomId: string;
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  startedAtServerMs: number;
  pausedElapsedSec: number;
  updatedBy: string;
}

export interface RoomSummaryDto {
  roomId: string;
  name: string;
  routeId: string;
  routeName: string;
  maxPlayers: number;
  currentPlayers: number;
  status: RoomStatus;
  driverName: string;
  assistantName: string;
}

export interface RoomFullStateDto {
  roomId: string;
  name: string;
  route: BusRouteDto;
  maxPlayers: number;
  status: RoomStatus;
  ownerId: string | null;
  driverId: string | null;
  driverName: string;
  assistantId: string | null;
  assistantName: string;
  players: Record<string, MultiplayerPlayerState>;
  seats: Record<string, string | null>; // seatId -> occupant playerId
  journey: BusJourneyDto;
  tickets: Record<string, BusTicketDto>; // playerId -> ticket
  music: MusicStateDto;
  chatHistory: ChatMessageDto[];
}

// Client -> Server Payloads
export interface JoinRoomPayload {
  roomId: string;
}

export interface CreateRoomPayload {
  roomCode?: string;
  name: string;
  routeId: string;
  maxPlayers?: number;
}

export interface PlayerMovePayload {
  roomId: string;
  position: [number, number, number];
  rotationY: number;
  state: SharedCharacterState;
  animation: SharedAnimationType;
}

export interface PlayerSitPayload {
  roomId: string;
  seatId: string;
}

export interface PlayerStandPayload {
  roomId: string;
}

export interface PlayerEmotePayload {
  roomId: string;
  emote: SharedEmoteType;
}

export interface SendChatPayload {
  roomId: string;
  content: string;
  recipientId?: string | null;
}

export interface JourneyControlPayload {
  roomId: string;
  action: 'START' | 'PAUSE' | 'RESUME' | 'NEXT_STOP' | 'ARRIVE_STOP' | 'DEPART_STOP' | 'COMPLETE' | 'SET_WEATHER' | 'SET_TIME';
  announcement?: string;
  weather?: JourneyWeather;
  timeOfDay?: JourneyTimeOfDay;
}

export interface TicketActionPayload {
  roomId: string;
  targetPlayerId: string;
  seatId?: string;
  action: 'BOOK' | 'PAY' | 'CHECK' | 'COLLECT_ALL';
}

export interface MusicControlPayload {
  roomId: string;
  action: 'PLAY' | 'PAUSE' | 'NEXT' | 'VOLUME';
  volume?: number;
}

export interface AssignRolePayload {
  roomId: string;
  targetPlayerId: string;
  role: PlayerRole;
}

// Validation & Bounds Constants
export const VALID_SEAT_IDS = [
  '1A', '1B', '1C', '1D',
  '2A', '2B', '2C', '2D',
  '3A', '3B', '3C', '3D',
  '4A', '4B', '4C', '4D',
  '5A', '5B', '5C', '5D',
  '6A', '6B', '6C', '6D',
  '7A', '7B', '7C', '7D',
] as const;

export const SERVER_CABIN_BOUNDS = {
  minX: -1.15,
  maxX: 1.15,
  aisleMinX: -0.32,
  aisleMaxX: 0.32,
  minZ: -3.75,
  maxZ: 5.35,
  floorY: 0.72,
  maxTeleportDeltaM: 3.8,
  maxChatLength: 110,
  chatCooldownMs: 650,
} as const;

export const DEFAULT_MUSIC_TRACKS: MusicTrackDto[] = [
  {
    id: 'track-1',
    title: 'Sớm Mai Bình Lục (Acoustic Chill)',
    artist: 'Virtual Bus Ensemble',
    tempoBpm: 92,
    notesHz: [261.63, 293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66],
    durationSec: 180,
  },
  {
    id: 'track-2',
    title: 'Cao Tốc Pháp Vân Đêm (Lo-Fi Synth)',
    artist: 'Red River Beats',
    tempoBpm: 84,
    notesHz: [220.0, 261.63, 329.63, 349.23, 392.0, 349.23, 329.63, 261.63],
    durationSec: 210,
  },
  {
    id: 'track-3',
    title: 'Hà Nội Phố Chiều Thu (Guitar Hòa Tấu)',
    artist: 'Thăng Long Sound',
    tempoBpm: 102,
    notesHz: [293.66, 329.63, 392.0, 440.0, 493.88, 440.0, 392.0, 329.63],
    durationSec: 195,
  },
];

export const DEFAULT_ROUTES: BusRouteDto[] = [
  {
    id: 'route-binhluc-mydinh',
    name: 'Bánh mì 168 Bình Lục → Phủ Lý → BX Mỹ Đình (ĐCT01)',
    origin: 'Bánh mì 168 – Ngã tư 168 Bình Lục (QL21B, Đồn Xá – Bình Mỹ, Hà Nam)',
    destination: 'Bến xe Mỹ Đình (20 Phạm Hùng, Nam Từ Liêm, Hà Nội)',
    totalDistanceKm: 72,
    ticketPrice: 110000,
    stops: [
      {
        id: 'stop-banhmi168',
        routeId: 'route-binhluc-mydinh',
        name: 'Bánh mì 168 – Ngã tư 168 Bình Lục (QL21B, Đồn Xá – Bình Mỹ)',
        order: 0,
        distanceKm: 0,
        description: 'Điểm hẹn đón khách nổi tiếng trục QL21B, huyện Bình Lục, Hà Nam',
      },
      {
        id: 'stop-liemtuyen',
        routeId: 'route-binhluc-mydinh',
        name: 'Nút giao Liêm Tuyền – Trạm dừng Km227 (TP. Phủ Lý)',
        order: 1,
        distanceKm: 13,
        description: 'Đón khách Phủ Lý & nghỉ giải lao trước khi lên Cao tốc Cầu Giẽ – Pháp Vân',
      },
      {
        id: 'stop-phapvan',
        routeId: 'route-binhluc-mydinh',
        name: 'Nút giao Pháp Vân – Cửa ngõ Nước Ngầm (Hoàng Mai, Hà Nội)',
        order: 2,
        distanceKm: 56,
        description: 'Trả khách đi Giải Phóng, Nước Ngầm & khu các bệnh viện Bạch Mai, Việt Đức',
      },
      {
        id: 'stop-khuatduytien',
        routeId: 'route-binhluc-mydinh',
        name: '168 Khuất Duy Tiến – Big C Thăng Long (Thanh Xuân, Hà Nội)',
        order: 3,
        distanceKm: 65,
        description: 'Điểm trả khách dọc Vành đai 3, Nhà văn hóa Thanh Xuân & Trần Duy Hưng',
      },
      {
        id: 'stop-mydinh',
        routeId: 'route-binhluc-mydinh',
        name: 'Bến xe Mỹ Đình (Số 20 Phạm Hùng, Nam Từ Liêm, Hà Nội)',
        order: 4,
        distanceKm: 72,
        description: 'Bến cuối hành trình tại trung tâm phía Tây Thủ đô Hà Nội',
      },
    ],
  },
  {
    id: 'route-mydinh-binhluc',
    name: 'BX Mỹ Đình → Giải Phóng (Bạch Mai) → Bánh mì 168 Bình Lục',
    origin: 'Bến xe Mỹ Đình (20 Phạm Hùng, Hà Nội)',
    destination: 'Bánh mì 168 – Ngã tư 168 Bình Lục (Hà Nam)',
    totalDistanceKm: 75,
    ticketPrice: 110000,
    stops: [
      {
        id: 'stop-md-start',
        routeId: 'route-mydinh-binhluc',
        name: 'Bến xe Mỹ Đình – 20 Phạm Hùng (Hà Nội)',
        order: 0,
        distanceKm: 0,
        description: 'Xuất bến tại Bến xe Mỹ Đình & đón dọc Phạm Hùng – Big C Thăng Long',
      },
      {
        id: 'stop-bachmai',
        routeId: 'route-mydinh-binhluc',
        name: 'Trục Giải Phóng – Cổng Bệnh viện Bạch Mai (Hà Nội)',
        order: 1,
        distanceKm: 14,
        description: 'Đón hành khách khám chữa bệnh và sinh viên khu Bách – Kinh – Xây',
      },
      {
        id: 'stop-dongvan-liemtuyen',
        routeId: 'route-mydinh-binhluc',
        name: 'Nút giao Đồng Văn – Liêm Tuyền (TP. Phủ Lý, Hà Nam)',
        order: 2,
        distanceKm: 61,
        description: 'Trạm dừng nghỉ cửa ngõ TP. Phủ Lý rẽ về QL21B',
      },
      {
        id: 'stop-bm168-end',
        routeId: 'route-mydinh-binhluc',
        name: 'Bánh mì 168 – Ngã tư 168 Bình Lục (Đồn Xá – Bình Mỹ, Hà Nam)',
        order: 3,
        distanceKm: 75,
        description: 'Điểm trả khách cuối tuyến tại trung tâm huyện Bình Lục',
      },
    ],
  },
];

