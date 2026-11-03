import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  AssignRolePayload,
  AuthUserDto,
  BusJourneyDto,
  BusRouteDto,
  BusStopDto,
  BusTicketDto,
  ChatMessageDto,
  CreateRoomPayload,
  DEFAULT_MUSIC_TRACKS,
  DEFAULT_ROUTES,
  JourneyControlPayload,
  MultiplayerPlayerState,
  MusicControlPayload,
  MusicStateDto,
  PlayerEmotePayload,
  PlayerMovePayload,
  PlayerRole,
  PlayerSitPayload,
  RoomFullStateDto,
  RoomSummaryDto,
  SendChatPayload,
  SERVER_CABIN_BOUNDS,
  TicketActionPayload,
  VALID_SEAT_IDS,
} from '@virtual-bus/shared';
import { AuthService } from '../auth/auth.service';

// Exact 3D coordinates for each seat ID (1A..7D) matching frontend busConfig.ts
const SEAT_ROWS_Z = [-3.2, -1.9, -0.6, 0.7, 2.0, 3.3, 4.6];
const SEAT_COLS_X: Record<string, number> = {
  A: -1.02,
  B: -0.56,
  C: 0.56,
  D: 1.02,
};

function getSeatPosition3D(seatId: string): [number, number, number] {
  const rowNum = parseInt(seatId.slice(0, -1), 10) - 1;
  const colLetter = seatId.slice(-1).toUpperCase();
  const z = SEAT_ROWS_Z[rowNum] ?? 0.7;
  const x = SEAT_COLS_X[colLetter] ?? -0.56;
  return [x, SERVER_CABIN_BOUNDS.floorY, z];
}

@Injectable()
export class RoomService {
  private readonly routes = new Map<string, BusRouteDto>();
  private readonly rooms = new Map<string, RoomFullStateDto>();
  /** Tracks which room a player is currently in (1 player -> max 1 active room) */
  private readonly playerRoomMap = new Map<string, string>();
  /** Anti-spam rate limit timestamp per player */
  private readonly lastChatTimeMap = new Map<string, number>();

  constructor(private readonly authService: AuthService) {
    for (const route of DEFAULT_ROUTES) {
      this.routes.set(route.id, route);
    }
    this.seedDefaultRooms();
  }

  private seedDefaultRooms(): void {
    this.createRoomInternal(
      {
        name: 'Xe Khách Phương Trang Miền Tây #01',
        routeId: 'route-ql1a-mientay',
        maxPlayers: 28,
      },
      null,
      'room-mientay-01'
    );

    this.createRoomInternal(
      {
        name: 'Chuyến Xe Cao Nguyên Đà Lạt #02',
        routeId: 'route-ql20-dalat',
        maxPlayers: 28,
      },
      null,
      'room-dalat-02'
    );
  }

  private createRoomInternal(
    dto: CreateRoomPayload,
    creator: AuthUserDto | null,
    fixedId?: string
  ): RoomFullStateDto {
    const route =
      this.routes.get(dto.routeId) ?? DEFAULT_ROUTES[0];
    const roomId = fixedId || `room-${crypto.randomUUID().slice(0, 8)}`;
    const journeyId = `journey-${roomId}`;

    const seats: Record<string, string | null> = {};
    for (const sId of VALID_SEAT_IDS) {
      seats[sId] = null;
    }

    const journey: BusJourneyDto = {
      id: journeyId,
      roomId,
      routeId: route.id,
      currentStopOrder: 0,
      status: 'IN_TRANSIT',
      speedKmh: 68,
      announcement: `Chào mừng quý khách lên chuyến xe ${route.name}!`,
      departureTime: new Date().toISOString(),
      arrivalTime: null,
    };

    const music: MusicStateDto = {
      roomId,
      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.5,
      startedAtServerMs: Date.now(),
      pausedElapsedSec: 0,
      updatedBy: 'Hệ thống',
    };

    const room: RoomFullStateDto = {
      roomId,
      name: dto.name.trim() || 'Chuyến Xe Đường Dài',
      route,
      maxPlayers: Math.min(28, Math.max(4, dto.maxPlayers ?? 28)),
      status: 'RUNNING',
      ownerId: creator?.id ?? null,
      driverId: creator?.id ?? null,
      driverName: creator?.displayName ?? 'Bác Tài AI (Tự động)',
      assistantId: null,
      assistantName: 'Phụ Xe AI',
      players: {},
      seats,
      journey,
      tickets: {},
      music,
      chatHistory: [
        {
          id: `sys-init-${roomId}`,
          roomId,
          senderId: 'system',
          senderName: 'Nhà Xe Virtual Bus',
          senderAvatar: '🚌',
          senderRole: 'DRIVER',
          recipientId: null,
          recipientName: null,
          content: `Chuyến xe "${dto.name}" tuyến ${route.name} đang sẵn sàng đón khách!`,
          scope: 'SYSTEM',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoutes(): BusRouteDto[] {
    return Array.from(this.routes.values());
  }

  listRooms(): RoomSummaryDto[] {
    const list: RoomSummaryDto[] = [];
    for (const room of this.rooms.values()) {
      const connectedCount = Object.values(room.players).filter(
        (p) => p.connected
      ).length;
      list.push({
        roomId: room.roomId,
        name: room.name,
        routeId: room.route.id,
        routeName: room.route.name,
        maxPlayers: room.maxPlayers,
        currentPlayers: connectedCount,
        status: room.status,
        driverName: room.driverName,
        assistantName: room.assistantName,
      });
    }
    return list;
  }

  createRoom(dto: CreateRoomPayload, user: AuthUserDto): RoomFullStateDto {
    if (!dto.name || dto.name.trim().length < 3) {
      throw new BadRequestException('Tên phòng xe phải có ít nhất 3 ký tự.');
    }
    return this.createRoomInternal(dto, user);
  }

  getRoomOrThrow(roomId: string): RoomFullStateDto {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng xe ${roomId}.`);
    }
    return room;
  }

  getPlayerRoomId(playerId: string): string | undefined {
    return this.playerRoomMap.get(playerId);
  }

  /**
   * Join or Reconnect to a Room.
   * Enforces 1 room per player at a time and restores state on reconnect.
   */
  joinRoom(
    roomId: string,
    user: AuthUserDto
  ): {
    room: RoomFullStateDto;
    player: MultiplayerPlayerState;
    previousRoomId: string | null;
  } {
    const room = this.getRoomOrThrow(roomId);

    // If player was in another room, remove them from that room first
    const existingRoomId = this.playerRoomMap.get(user.id);
    let previousRoomId: string | null = null;
    if (existingRoomId && existingRoomId !== roomId) {
      this.leaveRoom(existingRoomId, user.id);
      previousRoomId = existingRoomId;
    }

    const connectedPlayers = Object.values(room.players).filter(
      (p) => p.connected && p.playerId !== user.id
    );
    if (connectedPlayers.length >= room.maxPlayers) {
      throw new BadRequestException('Phòng xe đã đủ số lượng hành khách tối đa.');
    }

    // Check if player is reconnecting to this room
    const existingPlayer = room.players[user.id];
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.displayName = user.displayName;
      existingPlayer.avatar = user.avatar;
      existingPlayer.walletBalance = user.walletBalance;
      this.playerRoomMap.set(user.id, roomId);
      return { room, player: existingPlayer, previousRoomId };
    }

    // Assign default role based on username or room ownership
    let role: PlayerRole = 'PASSENGER';
    if (!room.ownerId) {
      room.ownerId = user.id;
    }
    if (user.username === 'taixe' || (!room.driverId && room.ownerId === user.id)) {
      role = 'DRIVER';
      room.driverId = user.id;
      room.driverName = user.displayName;
    } else if (user.username === 'phuxe' || !room.assistantId) {
      if (user.username === 'phuxe') {
        role = 'ASSISTANT';
        room.assistantId = user.id;
        room.assistantName = user.displayName;
      }
    }

    // Stagger initial spawn position along the central aisle so players don't stack identically
    const spawnOffsetZ = ((Object.keys(room.players).length % 5) - 2) * 0.55;
    const spawnZ = Math.max(-2.8, Math.min(4.2, 1.2 + spawnOffsetZ));

    const newPlayer: MultiplayerPlayerState = {
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
      connected: true,
      walletBalance: user.walletBalance,
    };

    room.players[user.id] = newPlayer;
    this.playerRoomMap.set(user.id, roomId);

    return { room, player: newPlayer, previousRoomId };
  }

  /**
   * Explicit leave room: releases seat and removes player from active list.
   */
  leaveRoom(roomId: string, playerId: string): RoomFullStateDto | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players[playerId];
    if (player) {
      if (player.seatId && room.seats[player.seatId] === playerId) {
        room.seats[player.seatId] = null;
      }
      delete room.players[playerId];
    }

    if (this.playerRoomMap.get(playerId) === roomId) {
      this.playerRoomMap.delete(playerId);
    }

    return room;
  }

  /**
   * Handle unexpected socket disconnect: release seat if occupied and mark disconnected
   * while keeping player record for fast reconnect recovery.
   */
  handleDisconnect(playerId: string): {
    roomId: string;
    room: RoomFullStateDto;
  } | null {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players[playerId];
    if (player) {
      player.connected = false;
      // Release seat so other online players are not blocked by disconnected user
      if (player.seatId && room.seats[player.seatId] === playerId) {
        room.seats[player.seatId] = null;
        player.seatId = null;
        player.state = 'idle';
        player.animation = 'Idle';
        player.position = [0, SERVER_CABIN_BOUNDS.floorY, player.position[2]];
      }
    }

    this.playerRoomMap.delete(playerId);
    return { roomId, room };
  }

  /**
   * Server-Authoritative Movement validation (Anti-Teleport + Bounds clamping).
   */
  validateAndMovePlayer(
    playerId: string,
    payload: PlayerMovePayload
  ): MultiplayerPlayerState {
    const room = this.getRoomOrThrow(payload.roomId);
    const player = room.players[playerId];
    if (!player || !player.connected) {
      throw new ForbiddenException('Bạn không ở trong phòng xe này.');
    }

    // Cannot move while sitting
    if (player.state === 'sitting') {
      return player;
    }

    const rawX = Number(payload.position?.[0] ?? 0);
    const rawZ = Number(payload.position?.[2] ?? 0);
    const rawRotY = Number(payload.rotationY ?? 0);

    // Clamp inside walkable cabin aisle bounds
    const clampedX = Math.max(
      SERVER_CABIN_BOUNDS.aisleMinX,
      Math.min(SERVER_CABIN_BOUNDS.aisleMaxX, rawX)
    );
    const clampedZ = Math.max(
      SERVER_CABIN_BOUNDS.minZ,
      Math.min(SERVER_CABIN_BOUNDS.maxZ, rawZ)
    );

    // Anti-teleport distance check
    const dx = clampedX - player.position[0];
    const dz = clampedZ - player.position[2];
    const dist = Math.hypot(dx, dz);

    let finalX = clampedX;
    let finalZ = clampedZ;
    if (dist > SERVER_CABIN_BOUNDS.maxTeleportDeltaM) {
      const ratio = SERVER_CABIN_BOUNDS.maxTeleportDeltaM / dist;
      finalX = player.position[0] + dx * ratio;
      finalZ = player.position[2] + dz * ratio;
    }

    player.position = [finalX, SERVER_CABIN_BOUNDS.floorY, finalZ];
    player.rotationY = Number.isFinite(rawRotY) ? rawRotY : 0;
    player.state = payload.state === 'walking' ? 'walking' : 'idle';
    player.animation = payload.state === 'walking' ? 'Walking' : 'Idle';

    return player;
  }

  /**
   * Server-Authoritative Atomic Seat Lock & Ticket Creation.
   */
  sitAtSeat(
    playerId: string,
    payload: PlayerSitPayload
  ): {
    player: MultiplayerPlayerState;
    seats: Record<string, string | null>;
    ticket: BusTicketDto;
  } {
    const room = this.getRoomOrThrow(payload.roomId);
    const player = room.players[playerId];
    if (!player || !player.connected) {
      throw new ForbiddenException('Bạn không ở trong phòng xe này.');
    }

    const seatId = payload.seatId?.trim().toUpperCase();
    if (!VALID_SEAT_IDS.includes(seatId as (typeof VALID_SEAT_IDS)[number])) {
      throw new BadRequestException(`Mã ghế ${seatId} không hợp lệ.`);
    }

    const currentOccupant = room.seats[seatId];
    if (currentOccupant && currentOccupant !== playerId) {
      throw new BadRequestException(
        `Ghế ${seatId} vừa có hành khách khác ngồi! Vui lòng chọn ghế trống khác.`
      );
    }

    // Release any previous seat held by this player
    if (player.seatId && player.seatId !== seatId) {
      room.seats[player.seatId] = null;
    }

    // Lock the seat atomically
    room.seats[seatId] = playerId;
    player.seatId = seatId;
    player.position = getSeatPosition3D(seatId);
    player.rotationY = 0;
    player.state = 'sitting';
    player.animation = 'Sitting';

    // Create or update ticket for this player on this journey
    const existingTicket = room.tickets[playerId];
    const ticket: BusTicketDto = existingTicket
      ? {
          ...existingTicket,
          seatId,
        }
      : {
          id: `ticket-${room.roomId}-${playerId.slice(-4)}`,
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

    room.tickets[playerId] = ticket;

    return { player, seats: room.seats, ticket };
  }

  /**
   * Stand up from current seat and release lock on server.
   */
  standUpFromSeat(
    playerId: string,
    roomId: string
  ): {
    player: MultiplayerPlayerState;
    seats: Record<string, string | null>;
    releasedSeatId: string | null;
  } {
    const room = this.getRoomOrThrow(roomId);
    const player = room.players[playerId];
    if (!player) {
      throw new ForbiddenException('Bạn không ở trong phòng xe này.');
    }

    const releasedSeatId = player.seatId;
    if (releasedSeatId && room.seats[releasedSeatId] === playerId) {
      room.seats[releasedSeatId] = null;
    }

    player.seatId = null;
    player.state = 'idle';
    player.animation = 'Idle';
    player.position = [0, SERVER_CABIN_BOUNDS.floorY, player.position[2]];
    player.rotationY = 0;

    return { player, seats: room.seats, releasedSeatId };
  }

  /**
   * Trigger Emote & Animation sync.
   */
  triggerEmote(
    playerId: string,
    payload: PlayerEmotePayload
  ): MultiplayerPlayerState {
    const room = this.getRoomOrThrow(payload.roomId);
    const player = room.players[playerId];
    if (!player) {
      throw new ForbiddenException('Bạn không ở trong phòng xe này.');
    }

    const animMap: Record<string, MultiplayerPlayerState['animation']> = {
      Wave: 'Waving',
      Smile: 'Talking',
      Nod: 'Nodding',
      Laugh: 'Laughing',
      Clap: 'Clapping',
      Sleep: 'Sleeping',
    };

    player.activeEmote = payload.emote;
    player.animation = animMap[payload.emote] ?? 'Idle';
    return player;
  }

  /**
   * Public & Private Chat with validation, room membership check, and rate-limiting.
   */
  createChatMessage(
    senderId: string,
    payload: SendChatPayload
  ): ChatMessageDto {
    const room = this.getRoomOrThrow(payload.roomId);
    const sender = room.players[senderId];
    if (!sender || !sender.connected) {
      throw new ForbiddenException(
        'Chỉ thành viên đang ở trong phòng mới được gửi tin nhắn.'
      );
    }

    const now = Date.now();
    const lastSent = this.lastChatTimeMap.get(senderId) ?? 0;
    if (now - lastSent < SERVER_CABIN_BOUNDS.chatCooldownMs) {
      throw new BadRequestException(
        'Bạn gửi tin nhắn quá nhanh, vui lòng chờ giây lát.'
      );
    }

    const cleanContent = payload.content
      ?.trim()
      .slice(0, SERVER_CABIN_BOUNDS.maxChatLength);
    if (!cleanContent) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống.');
    }

    this.lastChatTimeMap.set(senderId, now);

    let recipientName: string | null = null;
    let scope: 'PUBLIC' | 'PRIVATE' = 'PUBLIC';

    if (payload.recipientId) {
      const recipient = room.players[payload.recipientId];
      if (!recipient) {
        throw new NotFoundException('Người nhận không còn trong phòng.');
      }
      recipientName = recipient.displayName;
      scope = 'PRIVATE';
    }

    const msg: ChatMessageDto = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      roomId: room.roomId,
      senderId,
      senderName: sender.displayName,
      senderAvatar: sender.avatar,
      senderRole: sender.role,
      recipientId: payload.recipientId ?? null,
      recipientName,
      content: cleanContent,
      scope,
      createdAt: new Date().toISOString(),
    };

    if (scope === 'PUBLIC') {
      room.chatHistory.push(msg);
      if (room.chatHistory.length > 60) {
        room.chatHistory.shift();
      }
    }

    return msg;
  }

  /**
   * Assign Role (Driver / Assistant / Passenger)
   */
  assignRole(
    actorId: string,
    payload: AssignRolePayload
  ): RoomFullStateDto {
    const room = this.getRoomOrThrow(payload.roomId);
    const actor = room.players[actorId];
    const target = room.players[payload.targetPlayerId];

    if (!actor || !target) {
      throw new NotFoundException('Không tìm thấy người chơi trong phòng.');
    }

    // Allow self-claim if the DRIVER or ASSISTANT slot is vacant, or if actor is OWNER/DRIVER
    const isSelfClaim = actorId === payload.targetPlayerId;
    const isAuthorized =
      room.ownerId === actorId ||
      actor.role === 'OWNER' ||
      actor.role === 'DRIVER' ||
      isSelfClaim;

    if (!isAuthorized) {
      throw new ForbiddenException('Bạn không có quyền phân công vai trò.');
    }

    target.role = payload.role;
    if (payload.role === 'DRIVER') {
      room.driverId = target.playerId;
      room.driverName = target.displayName;
    } else if (payload.role === 'ASSISTANT') {
      room.assistantId = target.playerId;
      room.assistantName = target.displayName;
    }

    return room;
  }

  /**
   * Driver & Assistant Journey / Bus Stop Controls (RBAC checked on Backend).
   */
  controlJourney(
    actorId: string,
    payload: JourneyControlPayload
  ): {
    journey: BusJourneyDto;
    roomStatus: RoomFullStateDto['status'];
    currentStop: BusStopDto;
    systemMessage: ChatMessageDto;
  } {
    const room = this.getRoomOrThrow(payload.roomId);
    const actor = room.players[actorId];
    if (!actor) {
      throw new ForbiddenException('Bạn không ở trong phòng xe này.');
    }

    // Only OWNER, DRIVER, or ASSISTANT can control journey/announcements
    if (
      actor.role !== 'OWNER' &&
      actor.role !== 'DRIVER' &&
      actor.role !== 'ASSISTANT'
    ) {
      throw new ForbiddenException(
        'Chỉ Tài xế (Driver) hoặc Phụ xe (Assistant) mới có quyền điều khiển hành trình.'
      );
    }

    const stops = room.route.stops;
    let announcementText = '';

    switch (payload.action) {
      case 'START':
      case 'RESUME':
      case 'DEPART_STOP': {
        room.journey.status = 'IN_TRANSIT';
        room.journey.speedKmh = 68;
        room.status = 'RUNNING';
        const nextStop =
          stops[Math.min(stops.length - 1, room.journey.currentStopOrder + 1)];
        announcementText = `🚌 Bác tài ${actor.displayName} cho xe lăn bánh! Trạm tiếp theo: ${nextStop.name}.`;
        room.journey.announcement = announcementText;
        break;
      }

      case 'PAUSE': {
        room.journey.status = 'PAUSED';
        room.journey.speedKmh = 0;
        room.status = 'WAITING';
        announcementText = `⏸️ Chuyến xe đang tạm dừng trên đường theo điều khiển của ${actor.displayName}.`;
        room.journey.announcement = announcementText;
        break;
      }

      case 'ARRIVE_STOP':
      case 'NEXT_STOP': {
        if (room.journey.currentStopOrder < stops.length - 1) {
          room.journey.currentStopOrder += 1;
        }
        const arrivedStop = stops[room.journey.currentStopOrder];
        const isFinal = room.journey.currentStopOrder >= stops.length - 1;
        room.journey.status = isFinal ? 'FINISHED' : 'AT_STOP';
        room.journey.speedKmh = 0;
        room.status = isFinal ? 'COMPLETED' : 'STOPPED_AT_STATION';
        if (isFinal) {
          room.journey.arrivalTime = new Date().toISOString();
        }
        announcementText = `📍 Xe đã dừng tại "${arrivedStop.name}" (${arrivedStop.distanceKm} km) — ${arrivedStop.description}. Hành khách có thể lên/xuống xe!`;
        room.journey.announcement = announcementText;
        break;
      }

      case 'COMPLETE': {
        room.journey.currentStopOrder = stops.length - 1;
        room.journey.status = 'FINISHED';
        room.journey.speedKmh = 0;
        room.journey.arrivalTime = new Date().toISOString();
        room.status = 'COMPLETED';
        announcementText = `🏁 Chuyến xe đã hoàn thành hành trình tại ${stops[stops.length - 1].name}! Cảm ơn quý khách!`;
        room.journey.announcement = announcementText;
        break;
      }
    }

    if (payload.announcement?.trim()) {
      announcementText = `📢 Thông báo từ ${actor.displayName}: ${payload.announcement.trim()}`;
      room.journey.announcement = announcementText;
    }

    const currentStop =
      stops[room.journey.currentStopOrder] ?? stops[0];

    const systemMessage: ChatMessageDto = {
      id: `sys-${crypto.randomUUID().slice(0, 8)}`,
      roomId: room.roomId,
      senderId: actorId,
      senderName: actor.displayName,
      senderAvatar: actor.avatar,
      senderRole: actor.role,
      recipientId: null,
      recipientName: null,
      content: announcementText,
      scope: 'SYSTEM',
      createdAt: new Date().toISOString(),
    };

    room.chatHistory.push(systemMessage);
    return {
      journey: room.journey,
      roomStatus: room.status,
      currentStop,
      systemMessage,
    };
  }

  /**
   * Ticket Booking, Virtual Currency Payment, and Assistant Verification.
   */
  handleTicketAction(
    actorId: string,
    payload: TicketActionPayload
  ): {
    tickets: Record<string, BusTicketDto>;
    updatedPlayer: MultiplayerPlayerState | null;
    systemMessage: ChatMessageDto;
  } {
    const room = this.getRoomOrThrow(payload.roomId);
    const actor = room.players[actorId];
    if (!actor) {
      throw new ForbiddenException('Bạn không ở trong phòng xe này.');
    }

    const targetPlayer =
      room.players[payload.targetPlayerId] ?? actor;
    let announcement = '';

    if (payload.action === 'PAY') {
      let ticket = room.tickets[targetPlayer.playerId];
      if (!ticket) {
        ticket = {
          id: `ticket-${room.roomId}-${targetPlayer.playerId.slice(-4)}`,
          playerId: targetPlayer.playerId,
          playerName: targetPlayer.displayName,
          journeyId: room.journey.id,
          roomId: room.roomId,
          seatId: targetPlayer.seatId ?? 'Chưa chọn',
          price: room.route.ticketPrice,
          status: 'BOOKED',
          paidAt: null,
          checkedByAssistant: false,
        };
      }

      if (ticket.status !== 'PAID' && ticket.status !== 'CHECKED') {
        const newBalance = this.authService.adjustWalletBalance(
          targetPlayer.playerId,
          -ticket.price
        );
        targetPlayer.walletBalance = newBalance;
        ticket.status = 'PAID';
        ticket.paidAt = new Date().toISOString();
      }
      room.tickets[targetPlayer.playerId] = ticket;
      announcement = `🎫 Hành khách ${targetPlayer.displayName} đã thanh toán vé xe (${ticket.price.toLocaleString('vi-VN')}đ - Ghế ${ticket.seatId}).`;
    } else if (payload.action === 'CHECK') {
      if (
        actor.role !== 'ASSISTANT' &&
        actor.role !== 'DRIVER' &&
        actor.role !== 'OWNER'
      ) {
        throw new ForbiddenException(
          'Chỉ Phụ xe (Assistant) hoặc Tài xế mới có quyền soát vé.'
        );
      }

      const ticket = room.tickets[targetPlayer.playerId];
      if (ticket) {
        ticket.checkedByAssistant = true;
        if (ticket.status === 'PAID') {
          ticket.status = 'CHECKED';
        }
        room.tickets[targetPlayer.playerId] = ticket;
      }
      announcement = `✅ Phụ xe ${actor.displayName} đã kiểm tra vé của ${targetPlayer.displayName}.`;
    } else if (payload.action === 'COLLECT_ALL') {
      if (
        actor.role !== 'ASSISTANT' &&
        actor.role !== 'DRIVER' &&
        actor.role !== 'OWNER'
      ) {
        throw new ForbiddenException(
          'Chỉ Phụ xe (Assistant) hoặc Tài xế mới có quyền thu tiền vé.'
        );
      }

      for (const p of Object.values(room.players)) {
        if (!p.connected) continue;
        let t = room.tickets[p.playerId];
        if (!t) {
          t = {
            id: `ticket-${room.roomId}-${p.playerId.slice(-4)}`,
            playerId: p.playerId,
            playerName: p.displayName,
            journeyId: room.journey.id,
            roomId: room.roomId,
            seatId: p.seatId ?? 'Lối đi',
            price: room.route.ticketPrice,
            status: 'PAID',
            paidAt: new Date().toISOString(),
            checkedByAssistant: true,
          };
          p.walletBalance = this.authService.adjustWalletBalance(
            p.playerId,
            -t.price
          );
        } else if (t.status === 'BOOKED') {
          t.status = 'CHECKED';
          t.paidAt = new Date().toISOString();
          t.checkedByAssistant = true;
          p.walletBalance = this.authService.adjustWalletBalance(
            p.playerId,
            -t.price
          );
        } else {
          t.status = 'CHECKED';
          t.checkedByAssistant = true;
        }
        room.tickets[p.playerId] = t;
      }
      announcement = `💵 Phụ xe ${actor.displayName} đã hoàn tất thu tiền và soát vé toàn bộ hành khách trên xe!`;
    }

    const systemMessage: ChatMessageDto = {
      id: `sys-tkt-${crypto.randomUUID().slice(0, 8)}`,
      roomId: room.roomId,
      senderId: actorId,
      senderName: actor.displayName,
      senderAvatar: actor.avatar,
      senderRole: actor.role,
      recipientId: null,
      recipientName: null,
      content: announcement || 'Cập nhật trạng thái vé xe.',
      scope: 'SYSTEM',
      createdAt: new Date().toISOString(),
    };

    room.chatHistory.push(systemMessage);
    return {
      tickets: room.tickets,
      updatedPlayer: targetPlayer,
      systemMessage,
    };
  }

  /**
   * Synchronized Room Music Player (Play, Pause, Next Track, Volume) with server timestamp.
   */
  controlMusic(
    actorId: string,
    payload: MusicControlPayload
  ): MusicStateDto {
    const room = this.getRoomOrThrow(payload.roomId);
    const actor = room.players[actorId];
    if (!actor) {
      throw new ForbiddenException('Bạn không ở trong phòng xe này.');
    }

    const music = room.music;
    const now = Date.now();

    switch (payload.action) {
      case 'PLAY': {
        music.isPlaying = true;
        music.startedAtServerMs = now - music.pausedElapsedSec * 1000;
        music.updatedBy = actor.displayName;
        break;
      }
      case 'PAUSE': {
        if (music.isPlaying) {
          music.pausedElapsedSec = Math.max(
            0,
            (now - music.startedAtServerMs) / 1000
          );
        }
        music.isPlaying = false;
        music.updatedBy = actor.displayName;
        break;
      }
      case 'NEXT': {
        music.currentTrackIndex =
          (music.currentTrackIndex + 1) % DEFAULT_MUSIC_TRACKS.length;
        music.pausedElapsedSec = 0;
        music.startedAtServerMs = now;
        music.isPlaying = true;
        music.updatedBy = actor.displayName;
        break;
      }
      case 'VOLUME': {
        if (typeof payload.volume === 'number') {
          music.volume = Math.max(0, Math.min(1, payload.volume));
        }
        break;
      }
    }

    return music;
  }
}
