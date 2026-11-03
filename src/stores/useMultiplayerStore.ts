import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  AssignRolePayload,
  AuthResponseDto,
  AuthUserDto,
  BusRouteDto,
  ChatMessageDto,
  CreateRoomPayload,
  DEFAULT_ROUTES,
  JourneyControlPayload,
  LoginRequestDto,
  MultiplayerPlayerState,
  MusicControlPayload,
  MusicStateDto,
  PlayerRole,
  RegisterRequestDto,
  RoomFullStateDto,
  RoomSummaryDto,
   SharedEmoteType,
  SOCKET_EVENTS,
  SOCKET_NAMESPACE,
  TicketActionPayload,
} from '@virtual-bus/shared';
import { useCharacterStore } from './useCharacterStore';
import { useSeatStore } from './useSeatStore';
import { useChatStore } from './useChatStore';
import { useGameStore } from './useGameStore';
import { useInteractionStore } from './useInteractionStore';
import { musicAudioEngine } from '../services/musicAudioEngine';
import { CharacterData } from '../game/character/characterTypes';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface MultiplayerStoreState {
  isOnlineMode: boolean;
  isConnected: boolean;
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

  // Actions
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

  // Realtime Socket Emitters
  emitMoveThrottled: (
    position: [number, number, number],
    rotationY: number,
    state: 'idle' | 'walking' | 'sitting' | 'standing',
    animation: CharacterData['currentAnimation']
  ) => void;
  emitSit: (seatId: string) => void;
  emitStand: () => void;
  emitEmote: (emote: SharedEmoteType) => void;
  emitChatMessage: (content: string, recipientId?: string | null) => void;
  emitJourneyControl: (
    action: JourneyControlPayload['action'],
    announcement?: string
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

let socketInstance: Socket | null = null;
let lastMoveEmitMs = 0;

function mapMultiplayerPlayerToCharacterData(
  mp: MultiplayerPlayerState,
  isSelf: boolean,
  existing?: CharacterData
): CharacterData {
  const roleLabelMap: Record<PlayerRole, string> = {
    OWNER: 'Chủ phòng',
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
    bio: `Thành viên trực tuyến (${mp.username}) • Vai trò: ${roleLabelMap[mp.role]}`,
    activityLabel:
      mp.state === 'sitting'
        ? `Đang ngồi ghế ${mp.seatId ?? ''}`
        : mp.state === 'walking'
          ? 'Đang đi trên lối đi'
          : 'Đang trực tuyến trên xe',
  };
}

function syncRoomTo3DScene(room: RoomFullStateDto, selfPlayerId: string): void {
  // 1. Sync Characters without recreating existing character references unnecessarily
  const charStore = useCharacterStore.getState();
  const nextCharacters: Record<string, CharacterData> = {};
  const nextOrder: string[] = [];

  for (const mp of Object.values(room.players)) {
    if (!mp.connected) continue;
    const isSelf = mp.playerId === selfPlayerId;
    const existing = charStore.characters[mp.playerId];
    nextCharacters[mp.playerId] = mapMultiplayerPlayerToCharacterData(
      mp,
      isSelf,
      existing
    );
    nextOrder.push(mp.playerId);
  }

  useCharacterStore.setState({
    characters: nextCharacters,
    characterOrder: nextOrder,
    playerId: selfPlayerId,
  });

  // 2. Sync Authoritative Seats (28 seats)
  const seatStore = useSeatStore.getState();
  const updatedSeats = { ...seatStore.seats };
  for (const seatId of seatStore.seatOrder) {
    const occupantId = room.seats[seatId] ?? null;
    if (updatedSeats[seatId]) {
      updatedSeats[seatId] = {
        ...updatedSeats[seatId],
        occupantId,
        occupied: occupantId !== null,
      };
    }
  }
  useSeatStore.setState({ seats: updatedSeats });

  // 3. Sync Bus Journey & Route Telemetry to GameStore
  const currentStop =
    room.route.stops[room.journey.currentStopOrder] ?? room.route.stops[0];
  useGameStore.setState({
    tripName: `${room.name}`,
    routeName: room.route.name,
    busSpeedKmh: room.journey.speedKmh,
    isPaused: room.journey.status !== 'IN_TRANSIT',
    journeyStatus:
      room.journey.status === 'IN_TRANSIT'
        ? `Đang chạy • Hướng tới: ${
            room.route.stops[
              Math.min(
                room.route.stops.length - 1,
                room.journey.currentStopOrder + 1
              )
            ]?.name ?? currentStop.name
          }`
        : room.journey.status === 'AT_STOP'
          ? `Đang dừng tại: ${currentStop.name}`
          : room.journey.status === 'FINISHED'
            ? 'Đã tới bến cuối'
            : 'Đang tạm dừng',
  });

  // 4. Sync Music Player
  musicAudioEngine.syncState(room.music);
}

export const useMultiplayerStore = create<MultiplayerStoreState>((set, get) => ({
  isOnlineMode: false,
  isConnected: false,
  isLobbyModalOpen: false,
  isSocialPanelOpen: false,
  activeSocialTab: 'chat',

  user: null,
  accessToken: null,
  authError: null,

  routes: DEFAULT_ROUTES,
  rooms: [],
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
    set({ authError: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ authError: data?.message || 'Đăng nhập thất bại.' });
        return false;
      }

      const authData = data as AuthResponseDto;
      set({
        user: authData.user,
        accessToken: authData.accessToken,
        authError: null,
      });

      connectSocket(authData.accessToken, set, get);
      await get().fetchRoomsAndRoutes();
      return true;
    } catch {
      set({
        authError:
          'Không kết nối được Backend (Hãy chạy `npm run dev:backend` tại cổng 4000).',
      });
      return false;
    }
  },

  register: async (dto) => {
    set({ authError: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ authError: data?.message || 'Đăng ký thất bại.' });
        return false;
      }

      const authData = data as AuthResponseDto;
      set({
        user: authData.user,
        accessToken: authData.accessToken,
        authError: null,
      });

      connectSocket(authData.accessToken, set, get);
      await get().fetchRoomsAndRoutes();
      return true;
    } catch {
      set({
        authError:
          'Không kết nối được Backend (Hãy chạy `npm run dev:backend` tại cổng 4000).',
      });
      return false;
    }
  },

  logout: () => {
    const currentRoom = get().currentRoom;
    if (socketInstance && currentRoom) {
      socketInstance.emit(SOCKET_EVENTS.ROOM_LEAVE, {
        roomId: currentRoom.roomId,
      });
    }
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    musicAudioEngine.stopLoop();
    set({
      isOnlineMode: false,
      isConnected: false,
      user: null,
      accessToken: null,
      currentRoom: null,
    });
  },

  fetchRoomsAndRoutes: async () => {
    try {
      const [roomsRes, routesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/rooms`),
        fetch(`${BACKEND_URL}/api/routes`),
      ]);
      if (roomsRes.ok) {
        const rooms = (await roomsRes.json()) as RoomSummaryDto[];
        set({ rooms });
      }
      if (routesRes.ok) {
        const routes = (await routesRes.json()) as BusRouteDto[];
        set({ routes });
      }
    } catch {
      // Ignore if backend offline
    }
  },

  createAndJoinRoom: async (dto) => {
    const token = get().accessToken;
    if (!token) return false;

    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (!res.ok) return false;
      const room = (await res.json()) as RoomFullStateDto;
      await get().fetchRoomsAndRoutes();
      get().joinRoom(room.roomId);
      return true;
    } catch {
      return false;
    }
  },

  joinRoom: (roomId) => {
    if (!socketInstance) return;
    socketInstance.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });
  },

  leaveCurrentRoom: () => {
    const room = get().currentRoom;
    if (socketInstance && room) {
      socketInstance.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId: room.roomId });
    }
    musicAudioEngine.stopLoop();
    set({
      currentRoom: null,
      isOnlineMode: false,
      isLobbyModalOpen: true,
    });
  },

  emitMoveThrottled: (position, rotationY, state, animation) => {
    const room = get().currentRoom;
    if (!socketInstance || !room || !get().isOnlineMode) return;

    const now = performance.now();
    // Rate-limit movement packets to ~14 updates/sec (70ms) unless stopping (idle)
    if (state === 'walking' && now - lastMoveEmitMs < 70) {
      return;
    }
    lastMoveEmitMs = now;

    socketInstance.emit(SOCKET_EVENTS.PLAYER_MOVE, {
      roomId: room.roomId,
      position,
      rotationY,
      state,
      animation,
    });
  },

  emitSit: (seatId) => {
    const room = get().currentRoom;
    if (!socketInstance || !room || !get().isOnlineMode) return;
    socketInstance.emit(SOCKET_EVENTS.PLAYER_SIT, {
      roomId: room.roomId,
      seatId,
    });
  },

  emitStand: () => {
    const room = get().currentRoom;
    if (!socketInstance || !room || !get().isOnlineMode) return;
    socketInstance.emit(SOCKET_EVENTS.PLAYER_STAND, {
      roomId: room.roomId,
    });
  },

  emitEmote: (emote) => {
    const room = get().currentRoom;
    if (!socketInstance || !room || !get().isOnlineMode) return;
    socketInstance.emit(SOCKET_EVENTS.PLAYER_EMOTE, {
      roomId: room.roomId,
      emote,
    });
  },

  emitChatMessage: (content, recipientId = null) => {
    const room = get().currentRoom;
    if (!socketInstance || !room || !get().isOnlineMode) return;
    socketInstance.emit(SOCKET_EVENTS.CHAT_SEND, {
      roomId: room.roomId,
      content,
      recipientId,
    });
  },

  emitJourneyControl: (action, announcement) => {
    const room = get().currentRoom;
    if (!socketInstance || !room) return;
    socketInstance.emit(SOCKET_EVENTS.JOURNEY_START, {
      roomId: room.roomId,
      action,
      announcement,
    });
  },

  emitTicketAction: (action, targetPlayerId) => {
    const room = get().currentRoom;
    const selfId = get().user?.id;
    if (!socketInstance || !room || !selfId) return;
    socketInstance.emit(SOCKET_EVENTS.TICKET_PAY, {
      roomId: room.roomId,
      targetPlayerId: targetPlayerId ?? selfId,
      action,
    });
  },

  emitMusicControl: (action, volume) => {
    const room = get().currentRoom;
    if (!socketInstance || !room) return;
    if (action === 'VOLUME' && typeof volume === 'number') {
      musicAudioEngine.setLocalVolume(volume);
    }
    socketInstance.emit(SOCKET_EVENTS.MUSIC_PLAY, {
      roomId: room.roomId,
      action,
      volume,
    });
  },

  emitRoleAssign: (targetPlayerId, role) => {
    const room = get().currentRoom;
    if (!socketInstance || !room) return;
    socketInstance.emit(SOCKET_EVENTS.ROLE_ASSIGN, {
      roomId: room.roomId,
      targetPlayerId,
      role,
    } satisfies AssignRolePayload);
  },
}));

function connectSocket(
  token: string,
  set: (partial: Partial<MultiplayerStoreState> | ((s: MultiplayerStoreState) => Partial<MultiplayerStoreState>)) => void,
  get: () => MultiplayerStoreState
): void {
  if (socketInstance) {
    socketInstance.disconnect();
  }

  const socket = io(`${BACKEND_URL}${SOCKET_NAMESPACE}`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socketInstance = socket;

  socket.on('connect', () => {
    set({ isConnected: true });
    // Reconnect recovery: if player was in a room before a brief network drop, rejoin automatically
    const activeRoom = get().currentRoom;
    if (activeRoom) {
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId: activeRoom.roomId });
    }
  });

  socket.on('disconnect', () => {
    set({ isConnected: false });
  });

  socket.on(
    SOCKET_EVENTS.ROOM_JOINED,
    (payload: { room: RoomFullStateDto; selfPlayerId: string }) => {
      set({
        currentRoom: payload.room,
        isOnlineMode: true,
        isLobbyModalOpen: false,
        isSocialPanelOpen: true,
      });
      syncRoomTo3DScene(payload.room, payload.selfPlayerId);
      useInteractionStore
        .getState()
        .showStatusToast(`Đã vào phòng "${payload.room.name}" thành công!`);
    }
  );

  socket.on(SOCKET_EVENTS.ROOM_STATE, (room: RoomFullStateDto) => {
    const selfId = get().user?.id;
    if (!selfId) return;
    set({ currentRoom: room });
    syncRoomTo3DScene(room, selfId);
  });

  socket.on(SOCKET_EVENTS.ROOM_LIST_UPDATED, (rooms: RoomSummaryDto[]) => {
    set({ rooms });
  });

  socket.on(
    SOCKET_EVENTS.ROOM_PLAYER_JOINED,
    (payload: {
      player: MultiplayerPlayerState;
      seats: Record<string, string | null>;
    }) => {
      const room = get().currentRoom;
      const selfId = get().user?.id;
      if (!room || !selfId) return;

      const updatedRoom: RoomFullStateDto = {
        ...room,
        players: {
          ...room.players,
          [payload.player.playerId]: payload.player,
        },
        seats: payload.seats,
      };
      set({ currentRoom: updatedRoom });
      syncRoomTo3DScene(updatedRoom, selfId);
      useInteractionStore
        .getState()
        .showStatusToast(`${payload.player.displayName} vừa lên xe!`);
    }
  );

  socket.on(
    SOCKET_EVENTS.ROOM_PLAYER_LEFT,
    (payload: { playerId: string; seats: Record<string, string | null> }) => {
      const room = get().currentRoom;
      const selfId = get().user?.id;
      if (!room || !selfId) return;

      const nextPlayers = { ...room.players };
      delete nextPlayers[payload.playerId];

      const updatedRoom: RoomFullStateDto = {
        ...room,
        players: nextPlayers,
        seats: payload.seats,
      };
      set({ currentRoom: updatedRoom });
      syncRoomTo3DScene(updatedRoom, selfId);
    }
  );

  socket.on(
    SOCKET_EVENTS.PLAYER_MOVED,
    (payload: {
      playerId: string;
      position: [number, number, number];
      rotationY: number;
      state: MultiplayerPlayerState['state'];
      animation: MultiplayerPlayerState['animation'];
    }) => {
      const charStore = useCharacterStore.getState();
      if (payload.playerId === charStore.playerId) return;
      charStore.updateCharacterTransform(
        payload.playerId,
        payload.position,
        payload.rotationY
      );
      charStore.setCharacterStateAndAnimation(
        payload.playerId,
        payload.state,
        payload.animation
      );
    }
  );

  socket.on(
    SOCKET_EVENTS.PLAYER_SAT,
    (payload: {
      player: MultiplayerPlayerState;
      seats: Record<string, string | null>;
      ticket: RoomFullStateDto['tickets'][string];
    }) => {
      const room = get().currentRoom;
      const selfId = get().user?.id;
      if (!room || !selfId) return;

      const updatedRoom: RoomFullStateDto = {
        ...room,
        players: {
          ...room.players,
          [payload.player.playerId]: payload.player,
        },
        seats: payload.seats,
        tickets: {
          ...room.tickets,
          [payload.player.playerId]: payload.ticket,
        },
      };
      set({ currentRoom: updatedRoom });
      syncRoomTo3DScene(updatedRoom, selfId);
    }
  );

  socket.on(
    SOCKET_EVENTS.PLAYER_STOOD,
    (payload: {
      player: MultiplayerPlayerState;
      seats: Record<string, string | null>;
    }) => {
      const room = get().currentRoom;
      const selfId = get().user?.id;
      if (!room || !selfId) return;

      const updatedRoom: RoomFullStateDto = {
        ...room,
        players: {
          ...room.players,
          [payload.player.playerId]: payload.player,
        },
        seats: payload.seats,
      };
      set({ currentRoom: updatedRoom });
      syncRoomTo3DScene(updatedRoom, selfId);
    }
  );

  socket.on(
    SOCKET_EVENTS.PLAYER_EMOTE_BROADCAST,
    (payload: { playerId: string; emote: SharedEmoteType }) => {
      useCharacterStore
        .getState()
        .triggerCharacterEmote(payload.playerId, payload.emote);
    }
  );

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg: ChatMessageDto) => {
    const room = get().currentRoom;
    if (room) {
      set({
        currentRoom: {
          ...room,
          chatHistory: [...room.chatHistory.slice(-59), msg],
        },
      });
    }

    // Show 3D overhead Chat Bubble on sender's head
    if (msg.senderId !== 'system') {
      const bubblePrefix =
        msg.scope === 'PRIVATE' ? `🔒 [Riêng] ` : '';
      useChatStore
        .getState()
        .sendChatBubble(
          msg.senderId,
          msg.senderName,
          `${bubblePrefix}${msg.content}`,
          5200
        );
    } else {
      useInteractionStore.getState().showStatusToast(msg.content);
    }
  });

  socket.on(
    SOCKET_EVENTS.JOURNEY_UPDATED,
    (payload: {
      journey: RoomFullStateDto['journey'];
      roomStatus: RoomFullStateDto['status'];
    }) => {
      const room = get().currentRoom;
      const selfId = get().user?.id;
      if (!room || !selfId) return;

      const updatedRoom: RoomFullStateDto = {
        ...room,
        journey: payload.journey,
        status: payload.roomStatus,
      };
      set({ currentRoom: updatedRoom });
      syncRoomTo3DScene(updatedRoom, selfId);
    }
  );

  socket.on(
    SOCKET_EVENTS.TICKET_UPDATED,
    (payload: {
      tickets: RoomFullStateDto['tickets'];
      updatedPlayer: MultiplayerPlayerState | null;
    }) => {
      const room = get().currentRoom;
      const selfId = get().user?.id;
      if (!room || !selfId) return;

      const nextPlayers = { ...room.players };
      if (payload.updatedPlayer) {
        nextPlayers[payload.updatedPlayer.playerId] = payload.updatedPlayer;
        if (payload.updatedPlayer.playerId === selfId) {
          const currUser = get().user;
          if (currUser) {
            set({
              user: {
                ...currUser,
                walletBalance: payload.updatedPlayer.walletBalance,
              },
            });
          }
        }
      }

      set({
        currentRoom: {
          ...room,
          players: nextPlayers,
          tickets: payload.tickets,
        },
      });
    }
  );

  socket.on(SOCKET_EVENTS.MUSIC_UPDATED, (music: MusicStateDto) => {
    const room = get().currentRoom;
    if (room) {
      set({
        currentRoom: {
          ...room,
          music,
        },
      });
    }
    musicAudioEngine.syncState(music);
  });

  socket.on(SOCKET_EVENTS.SERVER_ERROR, (err: { message: string }) => {
    if (err?.message) {
      useInteractionStore.getState().showStatusToast(`⚠️ ${err.message}`);
    }
  });
}
