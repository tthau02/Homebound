import Peer, { DataConnection } from 'peerjs';
import {
  AssignRolePayload,
  AuthUserDto,
  BusRouteDto,
  ChatMessageDto,
  CreateRoomPayload,
  DEFAULT_MUSIC_TRACKS,
  DEFAULT_ROUTES,
  JourneyControlPayload,
  LoginRequestDto,
  MultiplayerPlayerState,
  MusicControlPayload,
  MusicStateDto,
  PlayerEmotePayload,
  PlayerMovePayload,
  PlayerRole,
  PlayerSitPayload,
  RegisterRequestDto,
  RoomFullStateDto,
  RoomSummaryDto,
   SendChatPayload,
  SERVER_CABIN_BOUNDS,
  TicketActionPayload,
  VALID_SEAT_IDS,
} from '@virtual-bus/shared';
import { BUS_DIMENSIONS, SEAT_COLUMNS_X, SEAT_ROWS_Z } from '../game/config/busConfig';

const ACCOUNTS_STORAGE_KEY = 'virtual_bus_p2p_accounts_v1';
const ROOM_INDEX_STORAGE_KEY = 'virtual_bus_p2p_rooms_v1';
const BROADCAST_CHANNEL_NAME = 'virtual_bus_p2p_channel_v1';

interface StoredAccount extends AuthUserDto {
  passwordHash: string;
}

export type P2PPacket =
  | {
      id: string;
      type: 'DISCOVER_ROOMS_REQ';
    }
  | {
      id: string;
      type: 'DISCOVER_ROOMS_RES';
      summary: RoomSummaryDto;
    }
  | {
      id: string;
      type: 'CLIENT_JOIN_REQ';
      roomId: string;
      user: AuthUserDto;
    }
  | {
      id: string;
      type: 'CLIENT_LEAVE';
      roomId: string;
      playerId: string;
    }
  | {
      id: string;
      type: 'CLIENT_ACTION';
      roomId: string;
      playerId: string;
      actionType:
        | 'MOVE'
        | 'SIT'
        | 'STAND'
        | 'EMOTE'
        | 'CHAT'
        | 'JOURNEY'
        | 'TICKET'
        | 'MUSIC'
        | 'ROLE'
        | 'DISEMBARK'
        | 'RETURN_TO_BUS';
      payload: unknown;
    }
  | {
      id: string;
      type: 'HOST_ROOM_STATE';
      roomId: string;
      room: RoomFullStateDto;
      toastMessage?: string;
    }
  | {
      id: string;
      type: 'HOST_PLAYER_MOVED';
      roomId: string;
      move: PlayerMovePayload & { playerId: string };
    }
  | {
      id: string;
      type: 'HOST_PLAYER_EMOTE';
      roomId: string;
      playerId: string;
      emote: PlayerEmotePayload['emote'];
    }
  | {
      id: string;
      type: 'HOST_CHAT_MSG';
      roomId: string;
      message: ChatMessageDto;
      room: RoomFullStateDto;
    }
  | {
      id: string;
      type: 'HOST_ERROR';
      roomId: string;
      targetPlayerId: string;
      message: string;
    };

export interface P2PCallbacks {
  onRoomJoined: (room: RoomFullStateDto, selfPlayerId: string, isHost: boolean) => void;
  onRoomStateUpdated: (room: RoomFullStateDto, toastMessage?: string) => void;
  onPlayerMoved: (move: PlayerMovePayload & { playerId: string }) => void;
  onPlayerEmote: (playerId: string, emote: PlayerEmotePayload['emote']) => void;
  onChatMessage: (msg: ChatMessageDto, room: RoomFullStateDto) => void;
  onRoomListUpdated: (rooms: RoomSummaryDto[]) => void;
  onWalletUpdated: (newBalance: number) => void;
  onErrorToast: (msg: string) => void;
  onConnectionStatusChange: (connected: boolean, modeLabel: string) => void;
}

const TAB_SESSION_SUFFIX = Math.random().toString(36).substring(2, 6);

function makePacketId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function normalizeRoomCode(raw: string): string {
  const cleaned = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'MIENTAY-01';
}

function getHostPeerId(roomCode: string): string {
  const slug = normalizeRoomCode(roomCode).toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `vbus3d-p2p-host-${slug}`;
}

function getSeatPosition3D(seatId: string): [number, number, number] {
  const rowNum = parseInt(seatId.slice(0, 1), 10) - 1;
  const colChar = seatId.slice(1, 2);
  const z = SEAT_ROWS_Z[rowNum] ?? 0;
  let x: number = SEAT_COLUMNS_X.leftAisle;
  if (colChar === 'A') x = SEAT_COLUMNS_X.leftWindow;
  else if (colChar === 'B') x = SEAT_COLUMNS_X.leftAisle;
  else if (colChar === 'C') x = SEAT_COLUMNS_X.rightAisle;
  else if (colChar === 'D') x = SEAT_COLUMNS_X.rightWindow;
  return [x, BUS_DIMENSIONS.floorY, z];
}

function createEmptyRoomState(
  roomCode: string,
  name: string,
  route: BusRouteDto,
  maxPlayers = 28
): RoomFullStateDto {
  const seats: Record<string, string | null> = {};
  for (const sid of VALID_SEAT_IDS) {
    seats[sid] = null;
  }

  const music: MusicStateDto = {
    roomId: roomCode,
    currentTrackIndex: 0,
    isPlaying: false,
    volume: 0.55,
    startedAtServerMs: Date.now(),
    pausedElapsedSec: 0,
    updatedBy: 'Hệ thống P2P',
  };

  return {
    roomId: roomCode,
    name,
    route,
    maxPlayers,
    status: 'BOARDING',
    ownerId: null,
    driverId: null,
    driverName: 'Chưa có tài xế',
    assistantId: null,
    assistantName: 'Chưa có phụ xe',
    players: {},
    seats,
    journey: {
      id: `journey-${roomCode}`,
      roomId: roomCode,
      routeId: route.id,
      currentStopOrder: 0,
      status: 'IN_TRANSIT',
      weather: 'SUNNY',
      timeOfDay: 'DAY',
      speedKmh: 65,
      announcement: 'Chào mừng hành khách lên chuyến xe P2P WebRTC!',
      departureTime: new Date().toISOString(),
      arrivalTime: null,
    },
    tickets: {},
    music,
    chatHistory: [
      {
        id: `sys-init-${roomCode}`,
        roomId: roomCode,
        senderId: 'system',
        senderName: 'Hệ Thống P2P',
        senderAvatar: '📡',
        senderRole: 'OWNER',
        recipientId: null,
        recipientName: null,
        content: `Phòng xe P2P [Mã: ${roomCode}] đã sẵn sàng! Chia sẻ mã "${roomCode}" để bạn bè ở máy khác hoặc tab khác cùng lên xe.`,
        scope: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

function toSummary(room: RoomFullStateDto): RoomSummaryDto {
  const activeCount = Object.values(room.players).filter((p) => p.connected).length;
  return {
    roomId: room.roomId,
    name: room.name,
    routeId: room.route.id,
    routeName: room.route.name,
    maxPlayers: room.maxPlayers,
    currentPlayers: activeCount,
    status: room.status,
    driverName: room.driverName,
    assistantName: room.assistantName,
  };
}

export class P2PBusNetworkService {
  private callbacks: P2PCallbacks | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private peer: Peer | null = null;
  private hostConnection: DataConnection | null = null;
  private clientConnections: Map<string, DataConnection> = new Map();
  private peerIdToPlayerId: Map<string, string> = new Map();
  private processedPacketIds: Set<string> = new Set();

  private isHosting = false;
  private joinSettled = false;
  private hasReceivedHostState = false;
  private hostedRoom: RoomFullStateDto | null = null;
  private currentRoomId: string | null = null;
  private selfUser: AuthUserDto | null = null;
  private discoveredRooms: Map<string, RoomSummaryDto> = new Map();

  constructor() {
    this.seedDefaultAccountsAndRooms();
    this.initBroadcastChannel();
  }

  public setCallbacks(cb: P2PCallbacks): void {
    this.callbacks = cb;
  }

  private seedDefaultAccountsAndRooms(): void {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (!raw) {
        const defaults: Record<string, StoredAccount> = {
          taixe: {
            id: 'user-taixe',
            username: 'taixe',
            displayName: 'Bác Tài Minh',
            avatar: '👨‍✈️',
            shirtColor: '#0284c7',
            walletBalance: 900000,
            passwordHash: '123456',
          },
          phuxe: {
            id: 'user-phuxe',
            username: 'phuxe',
            displayName: 'Phụ Xe Tùng',
            avatar: '🧢',
            shirtColor: '#059669',
            walletBalance: 650000,
            passwordHash: '123456',
          },
          hanhkhach: {
            id: 'user-hanhkhach',
            username: 'hanhkhach',
            displayName: 'Hành Khách Khoa',
            avatar: '🧑‍🚀',
            shirtColor: '#f59e0b',
            walletBalance: 500000,
            passwordHash: '123456',
          },
        };
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(defaults));
      }
    } catch {
      // Ignore storage errors
    }

    // Seed default room templates in discoveredRooms
    const routeMienTay = DEFAULT_ROUTES[0];
    const routeDaLat = DEFAULT_ROUTES[1] ?? DEFAULT_ROUTES[0];

    this.discoveredRooms.set('MIENTAY-01', {
      roomId: 'MIENTAY-01',
      name: 'Xe Phương Trang — Miền Tây (QL1A)',
      routeId: routeMienTay.id,
      routeName: routeMienTay.name,
      maxPlayers: 28,
      currentPlayers: 0,
      status: 'BOARDING',
      driverName: 'Chưa có tài xế',
      assistantName: 'Chưa có phụ xe',
    });

    this.discoveredRooms.set('DALAT-02', {
      roomId: 'DALAT-02',
      name: 'Xe Thành Bưởi — Cao Nguyên Đà Lạt',
      routeId: routeDaLat.id,
      routeName: routeDaLat.name,
      maxPlayers: 28,
      currentPlayers: 0,
      status: 'BOARDING',
      driverName: 'Chưa có tài xế',
      assistantName: 'Chưa có phụ xe',
    });

    this.loadStoredRoomCatalog();
  }

  private loadStoredRoomCatalog(): void {
    try {
      const raw = localStorage.getItem(ROOM_INDEX_STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw) as RoomSummaryDto[];
      for (const item of list) {
        if (item?.roomId) {
          this.discoveredRooms.set(item.roomId, item);
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveRoomToCatalog(summary: RoomSummaryDto): void {
    this.discoveredRooms.set(summary.roomId, summary);
    try {
      const arr = Array.from(this.discoveredRooms.values());
      localStorage.setItem(ROOM_INDEX_STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // Ignore
    }
    this.callbacks?.onRoomListUpdated(Array.from(this.discoveredRooms.values()));
  }

  private initBroadcastChannel(): void {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    this.broadcastChannel.onmessage = (ev: MessageEvent<P2PPacket>) => {
      if (!ev.data || !ev.data.id) return;
      this.handleIncomingPacket(ev.data);
    };
  }

  private markPacketSeen(id: string): boolean {
    if (this.processedPacketIds.has(id)) return true;
    this.processedPacketIds.add(id);
    if (this.processedPacketIds.size > 600) {
      const first = this.processedPacketIds.values().next().value;
      if (first) this.processedPacketIds.delete(first);
    }
    return false;
  }

  // ==================== LOCAL CLIENT AUTH ====================
  public loginLocal(dto: LoginRequestDto): { user?: AuthUserDto; error?: string } {
    const key = dto.username.trim().toLowerCase();
    if (!key) return { error: 'Vui lòng nhập tên đăng nhập.' };

    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts: Record<string, StoredAccount> = raw ? JSON.parse(raw) : {};
      const existing = accounts[key];

      if (!existing) {
        // Auto-create account on login if not found so user can jump right in seamlessly
        const autoUser: StoredAccount = {
          id: `user-${key}-${TAB_SESSION_SUFFIX}`,
          username: key,
          displayName: dto.username.trim(),
          avatar: '🧑‍🚀',
          shirtColor: '#f59e0b',
          walletBalance: 500000,
          passwordHash: dto.password || '123456',
        };
        accounts[key] = autoUser;
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
        this.selfUser = { ...autoUser };
        return { user: this.selfUser };
      }

      // Append per-tab session ID so multiple browser tabs testing the same demo account don't overwrite each other
      const sessionUser: AuthUserDto = {
        id: `${existing.id}-${TAB_SESSION_SUFFIX}`,
        username: existing.username,
        displayName: existing.displayName,
        avatar: existing.avatar,
        shirtColor: existing.shirtColor,
        walletBalance: existing.walletBalance,
      };
      this.selfUser = sessionUser;
      return { user: sessionUser };
    } catch {
      return { error: 'Không thể đọc dữ liệu tài khoản trên trình duyệt.' };
    }
  }

  public registerLocal(dto: RegisterRequestDto): { user?: AuthUserDto; error?: string } {
    const key = dto.username.trim().toLowerCase();
    if (!key || !dto.displayName.trim()) {
      return { error: 'Vui lòng điền đầy đủ Username và Tên hiển thị.' };
    }

    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts: Record<string, StoredAccount> = raw ? JSON.parse(raw) : {};

      const newAcc: StoredAccount = {
        id: `user-${key}`,
        username: key,
        displayName: dto.displayName.trim(),
        avatar: dto.avatar || '🧑‍🚀',
        shirtColor: dto.shirtColor || '#f59e0b',
        walletBalance: 500000,
        passwordHash: dto.password || '123456',
      };

      accounts[key] = newAcc;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));

      const sessionUser: AuthUserDto = {
        ...newAcc,
        id: `${newAcc.id}-${TAB_SESSION_SUFFIX}`,
      };
      this.selfUser = sessionUser;
      return { user: sessionUser };
    } catch {
      return { error: 'Lỗi lưu tài khoản trên trình duyệt.' };
    }
  }

  public getDiscoveredRooms(): RoomSummaryDto[] {
    this.loadStoredRoomCatalog();
    // Ping other tabs to refresh active player counts
    this.sendBroadcast({
      id: makePacketId(),
      type: 'DISCOVER_ROOMS_REQ',
    });
    return Array.from(this.discoveredRooms.values());
  }

  // ==================== P2P ROOM CREATE & JOIN ====================
  public createRoomAndConnect(dto: CreateRoomPayload, user: AuthUserDto): RoomSummaryDto {
    const code = normalizeRoomCode(
      dto.roomCode?.trim() ||
        `XE-${Math.floor(1000 + Math.random() * 9000)}`
    );
    const route =
      DEFAULT_ROUTES.find((r) => r.id === dto.routeId) ?? DEFAULT_ROUTES[0];

    const summary: RoomSummaryDto = {
      roomId: code,
      name: dto.name.trim() || `Chuyến Xe ${code}`,
      routeId: route.id,
      routeName: route.name,
      maxPlayers: dto.maxPlayers ?? 28,
      currentPlayers: 1,
      status: 'BOARDING',
      driverName: user.displayName,
      assistantName: 'Chưa có phụ xe',
    };

    this.saveRoomToCatalog(summary);
    this.connectToRoomByCode(code, user, summary.name, route.id);
    return summary;
  }

  public connectToRoomByCode(
    rawRoomCode: string,
    user: AuthUserDto,
    customRoomName?: string,
    customRouteId?: string
  ): void {
    const roomCode = normalizeRoomCode(rawRoomCode);
    this.leaveRoom();

    this.selfUser = user;
    this.currentRoomId = roomCode;

    const catalogItem = this.discoveredRooms.get(roomCode);
    const route =
      DEFAULT_ROUTES.find(
        (r) => r.id === (customRouteId ?? catalogItem?.routeId)
      ) ?? DEFAULT_ROUTES[0];
    const roomTitle =
      customRoomName ??
      catalogItem?.name ??
      `Chuyến Xe P2P #${roomCode}`;

    const hostPeerId = getHostPeerId(roomCode);
    this.joinSettled = false;
    this.hasReceivedHostState = false;

    this.callbacks?.onConnectionStatusChange(
      false,
      `Đang kết nối P2P mã phòng ${roomCode}...`
    );

    // 1. Also broadcast CLIENT_JOIN_REQ on BroadcastChannel immediately.
    // If another tab on the SAME browser is already hosting this roomCode, it will reply in <15ms!
    this.sendBroadcast({
      id: makePacketId(),
      type: 'CLIENT_JOIN_REQ',
      roomId: roomCode,
      user,
    });

    // 2. Try claiming the deterministic Host Peer ID on PeerJS WebRTC signaling broker
    try {
      const candidatePeer = new Peer(hostPeerId, { debug: 0 });
      this.peer = candidatePeer;

      const fallbackTimer = window.setTimeout(() => {
        if (this.joinSettled || this.currentRoomId !== roomCode) return;
        // If neither BroadcastChannel host nor PeerJS broker responded within 2.2s (e.g. offline), become local Host immediately
        this.joinSettled = true;
        this.becomeHostForRoom(roomCode, roomTitle, route, user);
      }, 2200);

      candidatePeer.on('open', () => {
        if (this.joinSettled || this.currentRoomId !== roomCode) return;
        window.clearTimeout(fallbackTimer);
        this.joinSettled = true;
        this.becomeHostForRoom(roomCode, roomTitle, route, user);
      });

      candidatePeer.on('connection', (conn) => {
        this.setupIncomingClientConnection(conn);
      });

      candidatePeer.on('error', (err: { type?: string }) => {
        window.clearTimeout(fallbackTimer);
        if (this.joinSettled || this.currentRoomId !== roomCode) return;

        if (err?.type === 'unavailable-id') {
          // Another computer or tab is ALREADY hosting `hostPeerId`!
          // Connect to that Host as a WebRTC Client Peer!
          this.joinSettled = true;
          try {
            candidatePeer.destroy();
          } catch {
            // ignore
          }
          this.connectAsWebRtcClient(roomCode, hostPeerId, user, roomTitle, route);
        } else {
          // Network/offline fallback -> host locally + BroadcastChannel
          this.joinSettled = true;
          this.becomeHostForRoom(roomCode, roomTitle, route, user);
        }
      });
    } catch {
      if (!this.joinSettled) {
        this.joinSettled = true;
        this.becomeHostForRoom(roomCode, roomTitle, route, user);
      }
    }
  }

  private becomeHostForRoom(
    roomCode: string,
    roomTitle: string,
    route: BusRouteDto,
    user: AuthUserDto
  ): void {
    this.isHosting = true;
    const room = createEmptyRoomState(roomCode, roomTitle, route, 28);
    this.hostedRoom = room;

    this.addOrUpdatePlayerInHostedRoom(room, user);

    this.saveRoomToCatalog(toSummary(room));
    this.callbacks?.onConnectionStatusChange(
      true,
      `Host P2P (Mã: ${roomCode})`
    );
    this.callbacks?.onRoomJoined(structuredClone(room), user.id, true);
    this.broadcastHostedRoomState();
  }

  private connectAsWebRtcClient(
    roomCode: string,
    hostPeerId: string,
    user: AuthUserDto,
    fallbackTitle: string,
    fallbackRoute: BusRouteDto
  ): void {
    this.isHosting = false;
    const clientPeer = new Peer({ debug: 0 });
    this.peer = clientPeer;

    let connectedToHost = false;
    const timeoutId = window.setTimeout(() => {
      if (
        !connectedToHost &&
        !this.hasReceivedHostState &&
        this.currentRoomId === roomCode &&
        !this.hostedRoom
      ) {
        // If stale PeerJS ID on broker timed out and no BroadcastChannel host replied, promote self to Host
        this.becomeHostForRoom(roomCode, fallbackTitle, fallbackRoute, user);
      }
    }, 3500);

    clientPeer.on('open', () => {
      const conn = clientPeer.connect(hostPeerId, { reliable: true });
      this.hostConnection = conn;

      conn.on('open', () => {
        connectedToHost = true;
        window.clearTimeout(timeoutId);
        this.callbacks?.onConnectionStatusChange(
          true,
          `Đã kết nối P2P (Mã: ${roomCode})`
        );
        const joinPkt: P2PPacket = {
          id: makePacketId(),
          type: 'CLIENT_JOIN_REQ',
          roomId: roomCode,
          user,
        };
        conn.send(joinPkt);
      });

      conn.on('data', (data) => {
        if (data && typeof data === 'object' && 'id' in data) {
          this.handleIncomingPacket(data as P2PPacket);
        }
      });

      conn.on('close', () => {
        this.callbacks?.onConnectionStatusChange(
          false,
          `Mất kết nối host phòng ${roomCode}`
        );
        this.callbacks?.onErrorToast(
          'Chủ phòng P2P đã ngắt kết nối. Phòng này không còn authoritative; hãy tạo phòng mới để tiếp tục.'
        );
      });
    });

    clientPeer.on('error', () => {
      window.clearTimeout(timeoutId);
      if (
        !connectedToHost &&
        !this.hasReceivedHostState &&
        this.currentRoomId === roomCode
      ) {
        this.becomeHostForRoom(roomCode, fallbackTitle, fallbackRoute, user);
      }
    });
  }

  private setupIncomingClientConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.clientConnections.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object' || !('id' in data)) return;
      const pkt = data as P2PPacket;
      if (pkt.type === 'CLIENT_JOIN_REQ') {
        this.peerIdToPlayerId.set(conn.peer, pkt.user.id);
      }
      this.handleIncomingPacket(pkt);
    });

    conn.on('close', () => {
      this.clientConnections.delete(conn.peer);
      const leftPlayerId = this.peerIdToPlayerId.get(conn.peer);
      if (leftPlayerId && this.isHosting && this.hostedRoom) {
        this.peerIdToPlayerId.delete(conn.peer);
        this.removePlayerFromHostedRoom(leftPlayerId);
      }
    });
  }

  public leaveRoom(): void {
    if (this.currentRoomId && this.selfUser) {
      if (this.isHosting && this.hostedRoom) {
        this.removePlayerFromHostedRoom(this.selfUser.id);
      } else {
        this.sendToHost({
          id: makePacketId(),
          type: 'CLIENT_LEAVE',
          roomId: this.currentRoomId,
          playerId: this.selfUser.id,
        });
      }
    }

    for (const conn of this.clientConnections.values()) {
      try {
        conn.close();
      } catch {
        // ignore
      }
    }
    this.clientConnections.clear();
    this.peerIdToPlayerId.clear();

    if (this.hostConnection) {
      try {
        this.hostConnection.close();
      } catch {
        // ignore
      }
      this.hostConnection = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }

    this.isHosting = false;
    this.hostedRoom = null;
    this.currentRoomId = null;
  }

  // ==================== CLIENT -> HOST ACTIONS ====================
  public sendAction(
    actionType:
      | 'MOVE'
      | 'SIT'
      | 'STAND'
      | 'EMOTE'
      | 'CHAT'
      | 'JOURNEY'
      | 'TICKET'
      | 'MUSIC'
      | 'ROLE'
      | 'DISEMBARK'
      | 'RETURN_TO_BUS',
    payload: unknown
  ): void {
    if (!this.currentRoomId || !this.selfUser) return;

    if (this.isHosting && this.hostedRoom) {
      this.processHostAction(this.selfUser.id, actionType, payload);
      return;
    }

    const pkt: P2PPacket = {
      id: makePacketId(),
      type: 'CLIENT_ACTION',
      roomId: this.currentRoomId,
      playerId: this.selfUser.id,
      actionType,
      payload,
    };
    this.sendToHost(pkt);
  }

  private sendToHost(pkt: P2PPacket): void {
    this.markPacketSeen(pkt.id);
    if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(pkt);
      } catch {
        // fallback to BroadcastChannel
      }
    }
    this.sendBroadcast(pkt);
  }

  private sendFromHostToAllPeers(pkt: P2PPacket): void {
    this.markPacketSeen(pkt.id);
    for (const conn of this.clientConnections.values()) {
      if (conn.open) {
        try {
          conn.send(pkt);
        } catch {
          // ignore
        }
      }
    }
    this.sendBroadcast(pkt);
  }

  private sendBroadcast(pkt: P2PPacket): void {
    if (!this.broadcastChannel) return;
    try {
      this.broadcastChannel.postMessage(pkt);
    } catch {
      // ignore
    }
  }

  // ==================== PACKET ROUTER ====================
  private handleIncomingPacket(pkt: P2PPacket): void {
    if (this.markPacketSeen(pkt.id)) return;

    if (pkt.type === 'DISCOVER_ROOMS_REQ') {
      if (this.isHosting && this.hostedRoom) {
        this.sendBroadcast({
          id: makePacketId(),
          type: 'DISCOVER_ROOMS_RES',
          summary: toSummary(this.hostedRoom),
        });
      }
      return;
    }

    if (pkt.type === 'DISCOVER_ROOMS_RES') {
      this.saveRoomToCatalog(pkt.summary);
      return;
    }

    // Host-side packet handling
    if (this.isHosting && this.hostedRoom && pkt.roomId === this.hostedRoom.roomId) {
      if (pkt.type === 'CLIENT_JOIN_REQ') {
        const added = this.addOrUpdatePlayerInHostedRoom(this.hostedRoom, pkt.user);
        this.saveRoomToCatalog(toSummary(this.hostedRoom));
        this.broadcastHostedRoomState(`${added.displayName} vừa lên xe qua P2P!`);
        return;
      }

      if (pkt.type === 'CLIENT_LEAVE') {
        this.removePlayerFromHostedRoom(pkt.playerId);
        return;
      }

      if (pkt.type === 'CLIENT_ACTION') {
        this.processHostAction(pkt.playerId, pkt.actionType, pkt.payload);
        return;
      }
    }

    // Client-side packet handling
    if (!this.isHosting && pkt.roomId === this.currentRoomId && this.selfUser) {
      if (pkt.type === 'HOST_ROOM_STATE') {
        const wasAlreadyInRoom = Boolean(
          pkt.room.players[this.selfUser.id]
        );
        if (wasAlreadyInRoom) {
          this.joinSettled = true;
          this.hasReceivedHostState = true;
          this.callbacks?.onConnectionStatusChange(
            true,
            `Đã kết nối P2P (Mã: ${pkt.roomId})`
          );
          this.callbacks?.onRoomJoined(pkt.room, this.selfUser.id, false);
          if (pkt.toastMessage) {
            this.callbacks?.onErrorToast(pkt.toastMessage);
          }
          const myPlayer = pkt.room.players[this.selfUser.id];
          if (myPlayer) {
            this.callbacks?.onWalletUpdated(myPlayer.walletBalance);
          }
        }
        return;
      }

      if (pkt.type === 'HOST_PLAYER_MOVED') {
        this.callbacks?.onPlayerMoved(pkt.move);
        return;
      }

      if (pkt.type === 'HOST_PLAYER_EMOTE') {
        this.callbacks?.onPlayerEmote(pkt.playerId, pkt.emote);
        return;
      }

      if (pkt.type === 'HOST_CHAT_MSG') {
        this.callbacks?.onChatMessage(pkt.message, pkt.room);
        return;
      }

      if (
        pkt.type === 'HOST_ERROR' &&
        pkt.targetPlayerId === this.selfUser.id
      ) {
        this.callbacks?.onErrorToast(pkt.message);
      }
    }
  }

  // ==================== HOST AUTHORITATIVE ROOM LOGIC ====================
  private addOrUpdatePlayerInHostedRoom(
    room: RoomFullStateDto,
    user: AuthUserDto
  ): MultiplayerPlayerState {
    const existing = room.players[user.id];
    if (existing) {
      existing.connected = true;
      return existing;
    }

    let role: PlayerRole = 'PASSENGER';
    if (!room.ownerId) {
      room.ownerId = user.id;
    }
    if (!room.driverId && (user.username === 'taixe' || Object.keys(room.players).length === 0)) {
      room.driverId = user.id;
      room.driverName = user.displayName;
      role = 'DRIVER';
    } else if (!room.assistantId && user.username === 'phuxe') {
      room.assistantId = user.id;
      room.assistantName = user.displayName;
      role = 'ASSISTANT';
    }

    const activeCount = Object.keys(room.players).length;
    const spawnZ = Math.min(
      SERVER_CABIN_BOUNDS.maxZ - 0.3,
      Math.max(SERVER_CABIN_BOUNDS.minZ + 0.4, -2.2 + (activeCount % 7) * 0.95)
    );

    const playerState: MultiplayerPlayerState = {
      playerId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      shirtColor: user.shirtColor,
      role,
      position: [0, SERVER_CABIN_BOUNDS.floorY, spawnZ],
      rotationY: 0,
      state: 'idle',
      animation: 'Idle',
      activeEmote: null,
      seatId: null,
      isDisembarked: false,
      connected: true,
      walletBalance: user.walletBalance,
    };

    room.players[user.id] = playerState;
    return playerState;
  }

  private removePlayerFromHostedRoom(playerId: string): void {
    if (!this.hostedRoom) return;
    const room = this.hostedRoom;
    const p = room.players[playerId];
    if (!p) return;

    if (p.seatId && room.seats[p.seatId] === playerId) {
      room.seats[p.seatId] = null;
    }
    delete room.players[playerId];

    if (room.driverId === playerId) {
      room.driverId = null;
      room.driverName = 'Chưa có tài xế';
    }
    if (room.assistantId === playerId) {
      room.assistantId = null;
      room.assistantName = 'Chưa có phụ xe';
    }

    this.saveRoomToCatalog(toSummary(room));
    this.broadcastHostedRoomState(`${p.displayName} đã rời chuyến xe.`);
  }

  private broadcastHostedRoomState(toastMessage?: string): void {
    if (!this.hostedRoom || !this.selfUser) return;
    const snapshot = structuredClone(this.hostedRoom);

    this.callbacks?.onRoomStateUpdated(snapshot, toastMessage);
    const selfPlayer = snapshot.players[this.selfUser.id];
    if (selfPlayer) {
      this.callbacks?.onWalletUpdated(selfPlayer.walletBalance);
    }

    this.sendFromHostToAllPeers({
      id: makePacketId(),
      type: 'HOST_ROOM_STATE',
      roomId: snapshot.roomId,
      room: snapshot,
      toastMessage,
    });
  }

  private processHostAction(
    playerId: string,
    actionType:
      | 'MOVE'
      | 'SIT'
      | 'STAND'
      | 'EMOTE'
      | 'CHAT'
      | 'JOURNEY'
      | 'TICKET'
      | 'MUSIC'
      | 'ROLE'
      | 'DISEMBARK'
      | 'RETURN_TO_BUS',
    rawPayload: unknown
  ): void {
    const room = this.hostedRoom;
    if (!room) return;
    const player = room.players[playerId];
    if (!player) return;

    switch (actionType) {
      case 'MOVE': {
        const payload = rawPayload as PlayerMovePayload;
        if (player.state === 'sitting') return;
        if (player.isDisembarked && room.journey.status !== 'AT_STOP') return;
        const [rx, , rz] = payload.position;
        const minX = player.isDisembarked ? 2.2 : SERVER_CABIN_BOUNDS.minX;
        const maxX = player.isDisembarked ? 13.5 : SERVER_CABIN_BOUNDS.maxX;
        const minZ = player.isDisembarked ? -5.5 : SERVER_CABIN_BOUNDS.minZ;
        const maxZ = player.isDisembarked ? 5.5 : SERVER_CABIN_BOUNDS.maxZ;
        const clampedX = Math.max(minX, Math.min(maxX, rx));
        const clampedZ = Math.max(
          minZ,
          Math.min(maxZ, rz)
        );

        player.position = [clampedX, SERVER_CABIN_BOUNDS.floorY, clampedZ];
        player.rotationY = payload.rotationY;
        player.state = payload.state;
        player.animation = payload.animation;

        const moveEvent = {
          roomId: room.roomId,
          playerId,
          position: player.position,
          rotationY: player.rotationY,
          state: player.state,
          animation: player.animation,
        };
        this.callbacks?.onPlayerMoved(moveEvent);
        this.sendFromHostToAllPeers({
          id: makePacketId(),
          type: 'HOST_PLAYER_MOVED',
          roomId: room.roomId,
          move: moveEvent,
        });
        break;
      }

      case 'SIT': {
        const payload = rawPayload as PlayerSitPayload;
        const seatId = payload.seatId;
        if (!(VALID_SEAT_IDS as readonly string[]).includes(seatId)) return;

        const currentOccupant = room.seats[seatId];
        if (currentOccupant && currentOccupant !== playerId) {
          this.sendErrorToPlayer(playerId, `Ghế ${seatId} đã có người ngồi!`);
          return;
        }

        if (player.seatId && room.seats[player.seatId] === playerId) {
          room.seats[player.seatId] = null;
        }

        room.seats[seatId] = playerId;
        player.seatId = seatId;
        player.position = getSeatPosition3D(seatId);
        player.rotationY = Math.PI;
        player.state = 'sitting';
        player.animation = 'Sitting';

        // Auto-book ticket if not booked
        if (!room.tickets[playerId]) {
          room.tickets[playerId] = {
            id: `ticket-${room.roomId}-${playerId}`,
            playerId,
            playerName: player.displayName,
            journeyId: room.journey.id,
            roomId: room.roomId,
            seatId,
            price: room.route.ticketPrice,
            status: 'BOOKED',
            paidAt: null,
            checkedByAssistant: false,
          };
        } else {
          room.tickets[playerId].seatId = seatId;
        }

        this.broadcastHostedRoomState();
        break;
      }

      case 'STAND': {
        if (player.seatId && room.seats[player.seatId] === playerId) {
          room.seats[player.seatId] = null;
        }
        player.seatId = null;
        player.position = [0, SERVER_CABIN_BOUNDS.floorY, player.position[2]];
        player.rotationY = 0;
        player.state = 'idle';
        player.animation = 'Idle';
        this.broadcastHostedRoomState();
        break;
      }

      case 'DISEMBARK': {
        if (room.journey.status !== 'AT_STOP') {
          this.sendErrorToPlayer(playerId, 'Chỉ có thể xuống xe khi xe đang dừng tại trạm.');
          return;
        }
        if (player.seatId && room.seats[player.seatId] === playerId) {
          room.seats[player.seatId] = null;
        }
        player.seatId = null;
        player.isDisembarked = true;
        player.position = [4.5, SERVER_CABIN_BOUNDS.floorY, 0];
        player.state = 'idle';
        player.animation = 'Idle';
        this.broadcastHostedRoomState(`${player.displayName} đã xuống trạm.`);
        break;
      }

      case 'RETURN_TO_BUS': {
        player.isDisembarked = false;
        player.position = [0, SERVER_CABIN_BOUNDS.floorY, SERVER_CABIN_BOUNDS.maxZ - 0.5];
        player.state = 'idle';
        player.animation = 'Idle';
        this.broadcastHostedRoomState(`${player.displayName} đã quay lại xe.`);
        break;
      }

      case 'EMOTE': {
        const payload = rawPayload as PlayerEmotePayload;
        player.activeEmote = payload.emote;
        this.callbacks?.onPlayerEmote(playerId, payload.emote);
        this.sendFromHostToAllPeers({
          id: makePacketId(),
          type: 'HOST_PLAYER_EMOTE',
          roomId: room.roomId,
          playerId,
          emote: payload.emote,
        });
        break;
      }

      case 'CHAT': {
        const payload = rawPayload as SendChatPayload;
        const content = payload.content
          .trim()
          .slice(0, SERVER_CABIN_BOUNDS.maxChatLength);
        if (!content) return;

        const recipient = payload.recipientId
          ? room.players[payload.recipientId]
          : null;

        const msg: ChatMessageDto = {
          id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          roomId: room.roomId,
          senderId: playerId,
          senderName: player.displayName,
          senderAvatar: player.avatar,
          senderRole: player.role,
          recipientId: recipient ? recipient.playerId : null,
          recipientName: recipient ? recipient.displayName : null,
          content,
          scope: recipient ? 'PRIVATE' : 'PUBLIC',
          createdAt: new Date().toISOString(),
        };

        room.chatHistory = [...room.chatHistory.slice(-59), msg];
        const snapshot = structuredClone(room);
        this.callbacks?.onChatMessage(msg, snapshot);
        this.sendFromHostToAllPeers({
          id: makePacketId(),
          type: 'HOST_CHAT_MSG',
          roomId: room.roomId,
          message: msg,
          room: snapshot,
        });
        break;
      }

      case 'JOURNEY': {
        const payload = rawPayload as JourneyControlPayload;
        if (!['OWNER', 'DRIVER', 'ASSISTANT'].includes(player.role)) {
          this.sendErrorToPlayer(playerId, 'Chỉ chủ phòng, tài xế hoặc phụ xe mới được điều khiển hành trình.');
          return;
        }
        const stops = room.route.stops;

        if (payload.action === 'START' || payload.action === 'RESUME') {
          for (const passenger of Object.values(room.players)) {
            if (!passenger.isDisembarked) continue;
            passenger.isDisembarked = false;
            passenger.position = [0, SERVER_CABIN_BOUNDS.floorY, SERVER_CABIN_BOUNDS.maxZ - 0.5];
            passenger.state = 'idle';
            passenger.animation = 'Idle';
          }
          room.journey.status = 'IN_TRANSIT';
          room.journey.speedKmh = 72;
          room.status = 'RUNNING';
        } else if (payload.action === 'PAUSE') {
          room.journey.status = 'PAUSED';
          room.journey.speedKmh = 0;
        } else if (payload.action === 'NEXT_STOP') {
          const nextIdx = Math.min(
            stops.length - 1,
            room.journey.currentStopOrder + 1
          );
          room.journey.currentStopOrder = nextIdx;
          const stopInfo = stops[nextIdx];
          if (nextIdx >= stops.length - 1) {
            room.journey.status = 'FINISHED';
            room.journey.speedKmh = 0;
            room.status = 'COMPLETED';
          } else {
            room.journey.status = 'AT_STOP';
            room.journey.speedKmh = 0;
            room.status = 'STOPPED_AT_STATION';
          }
          if (stopInfo) {
            this.appendSystemMessage(
              room,
              `🚏 Xe đã đến "${stopInfo.name}" (${stopInfo.description}).`
            );
          }
        } else if (payload.action === 'COMPLETE') {
          room.journey.currentStopOrder = stops.length - 1;
          room.journey.status = 'FINISHED';
          room.journey.speedKmh = 0;
          room.status = 'COMPLETED';
          this.appendSystemMessage(
            room,
            '🏁 Chuyến xe đã hoàn thành hành trình tại bến cuối!'
          );
        } else if (payload.action === 'SET_WEATHER' && payload.weather) {
          room.journey.weather = payload.weather;
          const weatherLabel = {
            SUNNY: 'nắng đẹp',
            CLOUDY: 'nhiều mây',
            RAINY: 'mưa nhẹ',
          }[payload.weather];
          this.appendSystemMessage(room, `🌦️ Thời tiết trên tuyến chuyển sang ${weatherLabel}.`);
        } else if (payload.action === 'SET_TIME' && payload.timeOfDay) {
          room.journey.timeOfDay = payload.timeOfDay;
          this.appendSystemMessage(
            room,
            payload.timeOfDay === 'NIGHT'
              ? '🌙 Xe tiếp tục hành trình trong đêm.'
              : '☀️ Bình minh đã lên trên tuyến đường.'
          );
        }

        if (payload.announcement?.trim()) {
          room.journey.announcement = payload.announcement.trim();
          this.appendSystemMessage(
            room,
            `📢 Thông báo từ ${player.displayName}: "${payload.announcement.trim()}"`
          );
        }

        this.saveRoomToCatalog(toSummary(room));
        this.broadcastHostedRoomState();
        break;
      }

      case 'TICKET': {
        const payload = rawPayload as TicketActionPayload;
        const targetId = payload.targetPlayerId || playerId;
        const targetPlayer = room.players[targetId];

        if (payload.action === 'PAY' && targetPlayer) {
          let ticket = room.tickets[targetId];
          if (!ticket) {
            ticket = {
              id: `ticket-${room.roomId}-${targetId}`,
              playerId: targetId,
              playerName: targetPlayer.displayName,
              journeyId: room.journey.id,
              roomId: room.roomId,
              seatId: targetPlayer.seatId ?? 'Chưa chọn',
              price: room.route.ticketPrice,
              status: 'BOOKED',
              paidAt: null,
              checkedByAssistant: false,
            };
            room.tickets[targetId] = ticket;
          }
          if (ticket.status === 'BOOKED') {
            if (targetPlayer.walletBalance < ticket.price) {
              this.sendErrorToPlayer(targetId, 'Số dư ví không đủ để thanh toán vé!');
              return;
            }
            targetPlayer.walletBalance -= ticket.price;
            ticket.status = 'PAID';
            ticket.paidAt = new Date().toISOString();
            this.appendSystemMessage(
              room,
              `🎫 ${targetPlayer.displayName} đã thanh toán vé xe (${ticket.price.toLocaleString('vi-VN')}đ).`
            );
          }
        } else if (payload.action === 'CHECK' && room.tickets[targetId]) {
          room.tickets[targetId].status = 'CHECKED';
          room.tickets[targetId].checkedByAssistant = true;
        } else if (payload.action === 'COLLECT_ALL') {
          for (const p of Object.values(room.players)) {
            if (!room.tickets[p.playerId]) {
              room.tickets[p.playerId] = {
                id: `ticket-${room.roomId}-${p.playerId}`,
                playerId: p.playerId,
                playerName: p.displayName,
                journeyId: room.journey.id,
                roomId: room.roomId,
                seatId: p.seatId ?? 'Tự do',
                price: room.route.ticketPrice,
                status: 'BOOKED',
                paidAt: null,
                checkedByAssistant: false,
              };
            }
            const t = room.tickets[p.playerId];
            if (t.status === 'BOOKED' && p.walletBalance >= t.price) {
              p.walletBalance -= t.price;
              t.paidAt = new Date().toISOString();
            }
            t.status = 'CHECKED';
            t.checkedByAssistant = true;
          }
          this.appendSystemMessage(
            room,
            `💵 Phụ xe ${player.displayName} đã thu tiền & soát vé toàn bộ hành khách!`
          );
        }

        this.broadcastHostedRoomState();
        break;
      }

      case 'MUSIC': {
        const payload = rawPayload as MusicControlPayload;
        const tracksCount = DEFAULT_MUSIC_TRACKS.length;

        if (payload.action === 'PLAY') {
          room.music.isPlaying = true;
          room.music.startedAtServerMs = Date.now();
        } else if (payload.action === 'PAUSE') {
          room.music.isPlaying = false;
        } else if (payload.action === 'NEXT') {
          room.music.currentTrackIndex =
            (room.music.currentTrackIndex + 1) % tracksCount;
          room.music.isPlaying = true;
          room.music.startedAtServerMs = Date.now();
        } else if (
          payload.action === 'VOLUME' &&
          typeof payload.volume === 'number'
        ) {
          room.music.volume = Math.max(0, Math.min(1, payload.volume));
        }
        room.music.updatedBy = player.displayName;
        this.broadcastHostedRoomState();
        break;
      }

      case 'ROLE': {
        const payload = rawPayload as AssignRolePayload;
        const target = room.players[payload.targetPlayerId];
        if (!target) return;

        target.role = payload.role;
        if (payload.role === 'DRIVER') {
          room.driverId = target.playerId;
          room.driverName = target.displayName;
        } else if (payload.role === 'ASSISTANT') {
          room.assistantId = target.playerId;
          room.assistantName = target.displayName;
        }

        this.saveRoomToCatalog(toSummary(room));
        this.broadcastHostedRoomState(
          `${target.displayName} đã nhận vai trò ${payload.role}!`
        );
        break;
      }
    }
  }

  private appendSystemMessage(room: RoomFullStateDto, text: string): void {
    const sysMsg: ChatMessageDto = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId: room.roomId,
      senderId: 'system',
      senderName: 'Loa Phát Thanh Xe',
      senderAvatar: '📢',
      senderRole: 'DRIVER',
      recipientId: null,
      recipientName: null,
      content: text,
      scope: 'SYSTEM',
      createdAt: new Date().toISOString(),
    };
    room.chatHistory = [...room.chatHistory.slice(-59), sysMsg];
  }

  private sendErrorToPlayer(targetPlayerId: string, message: string): void {
    if (!this.hostedRoom) return;
    if (this.selfUser?.id === targetPlayerId) {
      this.callbacks?.onErrorToast(message);
      return;
    }
    this.sendFromHostToAllPeers({
      id: makePacketId(),
      type: 'HOST_ERROR',
      roomId: this.hostedRoom.roomId,
      targetPlayerId,
      message,
    });
  }
}

export const p2pBusNetwork = new P2PBusNetworkService();
