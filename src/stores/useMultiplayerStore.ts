import { create } from 'zustand';
import {
  AssignRolePayload,
  AuthUserDto,
  BusRouteDto,
  ChatMessageDto,
  CreateRoomPayload,
  DEFAULT_ROUTES,
  JourneyControlPayload,
  JourneyTimeOfDay,
  JourneyWeather,
  LoginRequestDto,
  MultiplayerPlayerState,
  MusicControlPayload,
  PlayerRole,
  RegisterRequestDto,
  RoomFullStateDto,
  RoomSummaryDto,
  SharedEmoteType,
  TicketActionPayload,
} from '@virtual-bus/shared';
import { useCharacterStore } from './useCharacterStore';
import { useSeatStore } from './useSeatStore';
import { useChatStore } from './useChatStore';
import { useGameStore } from './useGameStore';
import { useInteractionStore } from './useInteractionStore';
import { musicAudioEngine } from '../services/musicAudioEngine';
import { p2pBusNetwork } from '../services/p2pBusNetwork';
import { CharacterData } from '../game/character/characterTypes';
import { SeatData } from '../game/seat/seatTypes';

interface MultiplayerStoreState {
  isOnlineMode: boolean;
  isConnected: boolean;
  isHostPeer: boolean;
  p2pStatusText: string;
  connectionLabel: string;
  isLobbyModalOpen: boolean;
  isSocialPanelOpen: boolean;
  activeSocialTab: 'chat' | 'journey' | 'tickets' | 'music' | 'roles';
  user: AuthUserDto | null;
  accessToken: string | null;
  authError: string | null;
  routes: BusRouteDto[];
  rooms: RoomSummaryDto[];
  currentRoom: RoomFullStateDto | null;
  privateChatTargetId: string | null;

  setLobbyModalOpen: (open: boolean) => void;
  setSocialPanelOpen: (open: boolean) => void;
  setActiveSocialTab: (
    tab: 'chat' | 'journey' | 'tickets' | 'music' | 'roles'
  ) => void;
  setPrivateChatTargetId: (playerId: string | null) => void;
  login: (dto: LoginRequestDto) => Promise<boolean>;
  register: (dto: RegisterRequestDto) => Promise<boolean>;
  logout: () => void;
  fetchRoomsAndRoutes: () => Promise<void>;
  createAndJoinRoom: (dto: CreateRoomPayload) => Promise<boolean>;
  joinRoom: (roomId: string) => void;
  leaveCurrentRoom: () => void;
  emitMoveThrottled: (
    position: [number, number, number],
    rotationY: number,
    state: 'idle' | 'walking' | 'sitting' | 'standing',
    animation: CharacterData['currentAnimation']
  ) => void;
  emitSit: (seatId: string) => void;
  emitStand: () => void;
  emitDisembark: () => void;
  emitReturnToBus: () => void;
  emitEmote: (emote: SharedEmoteType) => void;
  emitChatMessage: (content: string, recipientId?: string | null) => void;
  emitJourneyControl: (
    action: JourneyControlPayload['action'],
    announcement?: string,
    weather?: JourneyWeather,
    timeOfDay?: JourneyTimeOfDay
  ) => void;
  emitTicketAction: (
    action: TicketActionPayload['action'],
    targetPlayerId?: string
  ) => void;
  emitMusicControl: (
    action: MusicControlPayload['action'],
    volume?: number
  ) => void;
  emitRoleAssign: (targetPlayerId: string, role: PlayerRole) => void;
}

let savedOfflineScene: {
  characters: Record<string, CharacterData>;
  characterOrder: string[];
  playerId: string;
  seats: Record<string, SeatData>;
} | null = null;

function captureOfflineSceneIfNeeded(): void {
  if (savedOfflineScene) return;
  const charState = useCharacterStore.getState();
  const seatState = useSeatStore.getState();
  savedOfflineScene = {
    characters: structuredClone(charState.characters),
    characterOrder: [...charState.characterOrder],
    playerId: charState.playerId,
    seats: structuredClone(seatState.seats),
  };
}

function restoreOfflineScene(): void {
  if (!savedOfflineScene) return;
  useCharacterStore.setState({
    characters: structuredClone(savedOfflineScene.characters),
    characterOrder: [...savedOfflineScene.characterOrder],
    playerId: savedOfflineScene.playerId,
  });
  useSeatStore.setState({
    seats: structuredClone(savedOfflineScene.seats),
  });
  useGameStore.setState({
    tripName: 'Chuyến Xe Miền Tây #VB-108',
    routeName: 'TP.HCM → Tiền Giang → Cần Thơ',
    busSpeedKmh: 62,
    isPaused: false,
    journeyStatus: 'Đang chạy trên hành trình',
  });
}

function mapMultiplayerPlayerToCharacterData(
  mp: MultiplayerPlayerState,
  isSelf: boolean,
  existing?: CharacterData
): CharacterData {
  const roleLabelMap: Record<PlayerRole, string> = {
    OWNER: 'Chủ phòng P2P',
    DRIVER: 'Bác tài xế',
    ASSISTANT: 'Phụ xe',
    PASSENGER: 'Hành khách',
  };
  return {
    id: mp.playerId,
    name: `${mp.displayName} (${roleLabelMap[mp.role]})`,
    avatar: mp.avatar || '🧑‍🚀',
    modelUrl: null,
    position: mp.position,
    rotationY: mp.rotationY,
    state: mp.state,
    currentAnimation: mp.animation,
    activeEmote: mp.activeEmote,
    seatId: mp.seatId,
    targetSeatId: existing?.targetSeatId ?? null,
    waypoints: existing?.waypoints ?? [],
    isPlayer: isSelf,
    shirtColor: mp.shirtColor || '#f59e0b',
    pantsColor: '#1e293b',
    hairColor: '#18181b',
    hometown: roleLabelMap[mp.role],
    bio: `Kết nối P2P (${mp.username}) • Vai trò: ${roleLabelMap[mp.role]}`,
    activityLabel:
      mp.state === 'sitting'
        ? `Đang ngồi ghế ${mp.seatId ?? ''}`
        : mp.state === 'walking'
          ? 'Đang đi trên lối đi'
          : 'Đang trực tuyến P2P trên xe',
  };
}

function syncRoomTo3DScene(room: RoomFullStateDto, selfPlayerId: string): void {
  captureOfflineSceneIfNeeded();

  const charStore = useCharacterStore.getState();
  const nextCharacters: Record<string, CharacterData> = {};
  const nextOrder: string[] = [];
  for (const mp of Object.values(room.players)) {
    if (!mp.connected) continue;
    nextCharacters[mp.playerId] = mapMultiplayerPlayerToCharacterData(
      mp,
      mp.playerId === selfPlayerId,
      charStore.characters[mp.playerId]
    );
    nextOrder.push(mp.playerId);
  }
  useCharacterStore.setState({
    characters: nextCharacters,
    characterOrder: nextOrder,
    playerId: selfPlayerId,
  });

  const seatStore = useSeatStore.getState();
  const updatedSeats = { ...seatStore.seats };
  for (const seatId of seatStore.seatOrder) {
    const seat = updatedSeats[seatId];
    if (!seat) continue;
    const occupantId = room.seats[seatId] ?? null;
    updatedSeats[seatId] = {
      ...seat,
      occupantId,
      occupied: occupantId !== null,
    };
  }
  useSeatStore.setState({ seats: updatedSeats });

  const currentStop =
    room.route.stops[room.journey.currentStopOrder] ?? room.route.stops[0];
  const nextStop =
    room.route.stops[
      Math.min(room.route.stops.length - 1, room.journey.currentStopOrder + 1)
    ] ?? currentStop;
  useGameStore.setState({
    tripName: `${room.name} [${room.roomId}]`,
    routeName: room.route.name,
    busSpeedKmh: room.journey.speedKmh,
    isPaused: room.journey.status !== 'IN_TRANSIT',
    journeyStatus:
      room.journey.status === 'IN_TRANSIT'
        ? `Đang chạy • Hướng tới: ${nextStop.name}`
        : room.journey.status === 'AT_STOP'
          ? `Đang dừng tại: ${currentStop.name}`
          : room.journey.status === 'FINISHED'
            ? 'Đã tới bến cuối'
            : 'Đang tạm dừng',
  });
  const weatherMap: Record<JourneyWeather, 'sunny' | 'cloudy' | 'rainy'> = {
    SUNNY: 'sunny',
    CLOUDY: 'cloudy',
    RAINY: 'rainy',
  };
  useGameStore.getState().setWeather(weatherMap[room.journey.weather]);
  useGameStore
    .getState()
    .setTimeOfDay(room.journey.timeOfDay === 'NIGHT' ? 'night' : 'day');
  musicAudioEngine.syncState(room.music);
}

let lastMoveEmitMs = 0;

p2pBusNetwork.setCallbacks({
  onRoomJoined: (room, selfPlayerId, isHost) => {
    useMultiplayerStore.setState({
      currentRoom: room,
      isOnlineMode: true,
      isConnected: true,
      isHostPeer: isHost,
      isLobbyModalOpen: false,
      isSocialPanelOpen: true,
    });
    syncRoomTo3DScene(room, selfPlayerId);
    useInteractionStore
      .getState()
      .showStatusToast(
        `Đã kết nối P2P vào phòng "${room.name}" [Mã: ${room.roomId}]!`
      );
  },
  onRoomStateUpdated: (room, toastMessage) => {
    const selfId = useMultiplayerStore.getState().user?.id;
    useMultiplayerStore.setState({ currentRoom: room });
    if (selfId) syncRoomTo3DScene(room, selfId);
    if (toastMessage)
      useInteractionStore.getState().showStatusToast(toastMessage);
  },
  onPlayerMoved: (move) => {
    const charStore = useCharacterStore.getState();
    if (move.playerId === charStore.playerId) return;
    charStore.updateCharacterTransform(
      move.playerId,
      move.position,
      move.rotationY
    );
    charStore.setCharacterStateAndAnimation(
      move.playerId,
      move.state,
      move.animation
    );
  },
  onPlayerEmote: (playerId, emote) => {
    useCharacterStore.getState().triggerCharacterEmote(playerId, emote);
  },
  onChatMessage: (message: ChatMessageDto, room) => {
    useMultiplayerStore.setState({ currentRoom: room });
    if (message.senderId !== 'system') {
      const prefix = message.scope === 'PRIVATE' ? '🔒 [Riêng] ' : '';
      useChatStore
        .getState()
        .sendChatBubble(
          message.senderId,
          message.senderName,
          `${prefix}${message.content}`,
          5200
        );
    } else {
      useInteractionStore.getState().showStatusToast(message.content);
    }
  },
  onRoomListUpdated: (rooms) => useMultiplayerStore.setState({ rooms }),
  onWalletUpdated: (walletBalance) => {
    const user = useMultiplayerStore.getState().user;
    if (user)
      useMultiplayerStore.setState({ user: { ...user, walletBalance } });
  },
  onErrorToast: (message) =>
    useInteractionStore.getState().showStatusToast(message),
  onConnectionStatusChange: (connected, modeLabel) => {
    useMultiplayerStore.setState({
      isConnected: connected,
      isOnlineMode: connected,
      p2pStatusText: modeLabel,
      connectionLabel: modeLabel,
    });
  },
});

export const useMultiplayerStore = create<MultiplayerStoreState>((set, get) => ({
  isOnlineMode: false,
  isConnected: false,
  isHostPeer: false,
  p2pStatusText: 'Chưa kết nối P2P',
  connectionLabel: 'Chưa kết nối P2P',
  isLobbyModalOpen: false,
  isSocialPanelOpen: false,
  activeSocialTab: 'chat',
  user: null,
  accessToken: null,
  authError: null,
  routes: DEFAULT_ROUTES,
  rooms: p2pBusNetwork.getDiscoveredRooms(),
  currentRoom: null,
  privateChatTargetId: null,

  setLobbyModalOpen: (open) => set({ isLobbyModalOpen: open }),
  setSocialPanelOpen: (open) => set({ isSocialPanelOpen: open }),
  setActiveSocialTab: (tab) =>
    set({ activeSocialTab: tab, isSocialPanelOpen: true }),
  setPrivateChatTargetId: (playerId) =>
    set({
      privateChatTargetId: playerId,
      activeSocialTab: 'chat',
      isSocialPanelOpen: true,
    }),

  login: async (dto) => {
    const result = p2pBusNetwork.loginLocal(dto);
    if (!result.user) {
      set({ authError: result.error ?? 'Đăng nhập thất bại.' });
      return false;
    }
    set({ user: result.user, authError: null });
    await get().fetchRoomsAndRoutes();
    return true;
  },

  register: async (dto) => {
    const result = p2pBusNetwork.registerLocal(dto);
    if (!result.user) {
      set({ authError: result.error ?? 'Đăng ký thất bại.' });
      return false;
    }
    set({ user: result.user, authError: null });
    await get().fetchRoomsAndRoutes();
    return true;
  },

  logout: () => {
    p2pBusNetwork.leaveRoom();
    musicAudioEngine.stopLoop();
    restoreOfflineScene();
    set({
      isOnlineMode: false,
      isConnected: false,
      isHostPeer: false,
      user: null,
      accessToken: null,
      currentRoom: null,
      p2pStatusText: 'Chưa kết nối P2P',
      connectionLabel: 'Chưa kết nối P2P',
    });
  },

  fetchRoomsAndRoutes: async () => {
    const rooms = p2pBusNetwork.getDiscoveredRooms();
    set({ rooms, routes: DEFAULT_ROUTES });
  },

  createAndJoinRoom: async (dto) => {
    const user = get().user;
    if (!user) return false;
    p2pBusNetwork.createRoomAndConnect(dto, user);
    return true;
  },

  joinRoom: (roomId) => {
    const user = get().user;
    if (!user) {
      set({ authError: 'Hãy đăng nhập trước khi tham gia chuyến xe.' });
      return;
    }
    p2pBusNetwork.connectToRoomByCode(roomId, user);
  },

  leaveCurrentRoom: () => {
    p2pBusNetwork.leaveRoom();
    musicAudioEngine.stopLoop();
    restoreOfflineScene();
    set({
      currentRoom: null,
      isOnlineMode: false,
      isConnected: false,
      isHostPeer: false,
      p2pStatusText: 'Đã rời phòng P2P',
      connectionLabel: 'Đã rời phòng P2P',
      isLobbyModalOpen: true,
    });
  },

  emitMoveThrottled: (position, rotationY, state, animation) => {
    if (!get().currentRoom || !get().isOnlineMode) return;
    const now = performance.now();
    if (state === 'walking' && now - lastMoveEmitMs < 70) return;
    lastMoveEmitMs = now;
    p2pBusNetwork.sendAction('MOVE', { position, rotationY, state, animation });
  },
  emitSit: (seatId) => p2pBusNetwork.sendAction('SIT', { seatId }),
  emitStand: () => p2pBusNetwork.sendAction('STAND', {}),
  emitDisembark: () => p2pBusNetwork.sendAction('DISEMBARK', {}),
  emitReturnToBus: () => p2pBusNetwork.sendAction('RETURN_TO_BUS', {}),
  emitEmote: (emote) => p2pBusNetwork.sendAction('EMOTE', { emote }),
  emitChatMessage: (content, recipientId = null) =>
    p2pBusNetwork.sendAction('CHAT', { content, recipientId }),
  emitJourneyControl: (action, announcement, weather, timeOfDay) =>
    p2pBusNetwork.sendAction('JOURNEY', {
      action,
      announcement,
      weather,
      timeOfDay,
    }),
  emitTicketAction: (action, targetPlayerId) => {
    const selfId = get().user?.id;
    if (!selfId) return;
    p2pBusNetwork.sendAction('TICKET', {
      targetPlayerId: targetPlayerId ?? selfId,
      action,
    });
  },
  emitMusicControl: (action, volume) => {
    if (action === 'VOLUME' && typeof volume === 'number') {
      musicAudioEngine.setLocalVolume(volume);
    }
    p2pBusNetwork.sendAction('MUSIC', { action, volume });
  },
  emitRoleAssign: (targetPlayerId, role) => {
    const roomId = get().currentRoom?.roomId;
    if (!roomId) return;
    const payload: AssignRolePayload = { roomId, targetPlayerId, role };
    p2pBusNetwork.sendAction('ROLE', payload);
  },
}));
