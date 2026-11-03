import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  AssignRolePayload,
  AuthUserDto,
  JoinRoomPayload,
  JourneyControlPayload,
  MusicControlPayload,
  PlayerEmotePayload,
  PlayerMovePayload,
  PlayerSitPayload,
  PlayerStandPayload,
  SendChatPayload,
  SOCKET_EVENTS,
  SOCKET_NAMESPACE,
  TicketActionPayload,
} from '@virtual-bus/shared';
import { AuthService } from '../auth/auth.service';
import { RoomService } from '../room/room.service';

@WebSocketGateway({
  namespace: SOCKET_NAMESPACE,
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BusGateway.name);
  /** Maps authenticated playerId -> active socketId for Private 1-on-1 Chat */
  private readonly playerSocketMap = new Map<string, string>();

  constructor(
    private readonly authService: AuthService,
    private readonly roomService: RoomService
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const rawToken =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!rawToken) {
        client.emit(SOCKET_EVENTS.SERVER_ERROR, {
          message: 'Thiếu JWT token kết nối Socket.IO.',
        });
        client.disconnect();
        return;
      }

      const user = await this.authService.verifyToken(String(rawToken));
      client.data.user = user;
      this.playerSocketMap.set(user.id, client.id);
      this.logger.log(`Socket connected: ${user.displayName} (${user.id})`);
    } catch {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: 'Xác thực JWT thất bại.',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const user: AuthUserDto | undefined = client.data?.user;
    if (!user) return;

    if (this.playerSocketMap.get(user.id) === client.id) {
      this.playerSocketMap.delete(user.id);
    }

    const result = this.roomService.handleDisconnect(user.id);
    if (result) {
      this.server.to(result.roomId).emit(SOCKET_EVENTS.ROOM_PLAYER_LEFT, {
        playerId: user.id,
        seats: result.room.seats,
      });
      this.server
        .to(result.roomId)
        .emit(SOCKET_EVENTS.ROOM_STATE, result.room);
      this.server.emit(
        SOCKET_EVENTS.ROOM_LIST_UPDATED,
        this.roomService.listRooms()
      );
    }
  }

  private getAuthenticatedUser(client: Socket): AuthUserDto {
    const user: AuthUserDto | undefined = client.data?.user;
    if (!user) {
      throw new Error('Chưa xác thực người chơi.');
    }
    return user;
  }

  @SubscribeMessage(SOCKET_EVENTS.ROOM_JOIN)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const { room, player, previousRoomId } = this.roomService.joinRoom(
        payload.roomId,
        user
      );

      if (previousRoomId) {
        client.leave(previousRoomId);
        const prevRoom = this.roomService.getRoomOrThrow(previousRoomId);
        this.server
          .to(previousRoomId)
          .emit(SOCKET_EVENTS.ROOM_STATE, prevRoom);
      }

      client.join(room.roomId);

      // Send full authoritative room state to the joining player
      client.emit(SOCKET_EVENTS.ROOM_JOINED, {
        room,
        selfPlayerId: user.id,
      });

      // Notify other room members
      client.to(room.roomId).emit(SOCKET_EVENTS.ROOM_PLAYER_JOINED, {
        player,
        seats: room.seats,
      });

      // Broadcast updated room list to lobby
      this.server.emit(
        SOCKET_EVENTS.ROOM_LIST_UPDATED,
        this.roomService.listRooms()
      );
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: err instanceof Error ? err.message : 'Lỗi khi vào phòng.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.ROOM_LEAVE)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string }
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const room = this.roomService.leaveRoom(payload.roomId, user.id);
      client.leave(payload.roomId);

      if (room) {
        this.server.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_PLAYER_LEFT, {
          playerId: user.id,
          seats: room.seats,
        });
        this.server.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_STATE, room);
      }

      this.server.emit(
        SOCKET_EVENTS.ROOM_LIST_UPDATED,
        this.roomService.listRooms()
      );
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: err instanceof Error ? err.message : 'Lỗi khi rời phòng.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.PLAYER_MOVE)
  handlePlayerMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlayerMovePayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const updatedPlayer = this.roomService.validateAndMovePlayer(
        user.id,
        payload
      );

      // Broadcast validated transform to other players in the same room
      client.to(payload.roomId).emit(SOCKET_EVENTS.PLAYER_MOVED, {
        playerId: user.id,
        position: updatedPlayer.position,
        rotationY: updatedPlayer.rotationY,
        state: updatedPlayer.state,
        animation: updatedPlayer.animation,
      });
    } catch {
      // Ignore invalid out-of-room movement packets silently
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.PLAYER_SIT)
  handlePlayerSit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlayerSitPayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const result = this.roomService.sitAtSeat(user.id, payload);

      this.server.to(payload.roomId).emit(SOCKET_EVENTS.PLAYER_SAT, {
        player: result.player,
        seats: result.seats,
        ticket: result.ticket,
      });
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message:
          err instanceof Error ? err.message : 'Không thể ngồi vào ghế này.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.PLAYER_STAND)
  handlePlayerStand(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlayerStandPayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const result = this.roomService.standUpFromSeat(user.id, payload.roomId);

      this.server.to(payload.roomId).emit(SOCKET_EVENTS.PLAYER_STOOD, {
        player: result.player,
        seats: result.seats,
        releasedSeatId: result.releasedSeatId,
      });
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: err instanceof Error ? err.message : 'Lỗi khi đứng dậy.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.PLAYER_EMOTE)
  handlePlayerEmote(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlayerEmotePayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const player = this.roomService.triggerEmote(user.id, payload);

      this.server
        .to(payload.roomId)
        .emit(SOCKET_EVENTS.PLAYER_EMOTE_BROADCAST, {
          playerId: user.id,
          emote: payload.emote,
          animation: player.animation,
        });
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: err instanceof Error ? err.message : 'Lỗi biểu cảm.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.CHAT_SEND)
  handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendChatPayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const msg = this.roomService.createChatMessage(user.id, payload);

      if (msg.scope === 'PRIVATE' && msg.recipientId) {
        // Private 1-on-1 message: emit ONLY to sender and recipient
        client.emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
        const recipientSocketId = this.playerSocketMap.get(msg.recipientId);
        if (recipientSocketId && recipientSocketId !== client.id) {
          this.server
            .to(recipientSocketId)
            .emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
        }
      } else {
        // Public room chat: emit to everyone in this room
        this.server
          .to(payload.roomId)
          .emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
      }
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: err instanceof Error ? err.message : 'Không thể gửi tin nhắn.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.JOURNEY_START)
  handleJourneyControl(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JourneyControlPayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const res = this.roomService.controlJourney(user.id, payload);

      this.server.to(payload.roomId).emit(SOCKET_EVENTS.JOURNEY_UPDATED, {
        journey: res.journey,
        roomStatus: res.roomStatus,
        currentStop: res.currentStop,
      });

      if (res.journey.status === 'AT_STOP') {
        this.server.to(payload.roomId).emit(SOCKET_EVENTS.BUS_STOP_ARRIVED, {
          stop: res.currentStop,
          journey: res.journey,
        });
      }

      this.server
        .to(payload.roomId)
        .emit(SOCKET_EVENTS.CHAT_MESSAGE, res.systemMessage);
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message:
          err instanceof Error
            ? err.message
            : 'Không có quyền điều khiển hành trình.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.TICKET_PAY)
  handleTicketAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TicketActionPayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const res = this.roomService.handleTicketAction(user.id, payload);

      this.server.to(payload.roomId).emit(SOCKET_EVENTS.TICKET_UPDATED, {
        tickets: res.tickets,
        updatedPlayer: res.updatedPlayer,
      });

      this.server
        .to(payload.roomId)
        .emit(SOCKET_EVENTS.CHAT_MESSAGE, res.systemMessage);
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: err instanceof Error ? err.message : 'Lỗi xử lý vé xe.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.MUSIC_PLAY)
  handleMusicControl(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MusicControlPayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const music = this.roomService.controlMusic(user.id, payload);

      this.server
        .to(payload.roomId)
        .emit(SOCKET_EVENTS.MUSIC_UPDATED, music);
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: err instanceof Error ? err.message : 'Lỗi điều khiển nhạc.',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.ROLE_ASSIGN)
  handleRoleAssign(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AssignRolePayload
  ): void {
    try {
      const user = this.getAuthenticatedUser(client);
      const room = this.roomService.assignRole(user.id, payload);

      this.server.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_STATE, room);
    } catch (err) {
      client.emit(SOCKET_EVENTS.SERVER_ERROR, {
        message: err instanceof Error ? err.message : 'Lỗi phân quyền.',
      });
    }
  }
}
