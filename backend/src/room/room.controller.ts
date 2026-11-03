import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AuthUserDto,
  BusRouteDto,
  CreateRoomPayload,
  RoomFullStateDto,
  RoomSummaryDto,
} from '@virtual-bus/shared';
import { RoomService } from './room.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('routes')
  getRoutes(): BusRouteDto[] {
    return this.roomService.getRoutes();
  }

  @Get('rooms')
  listRooms(): RoomSummaryDto[] {
    return this.roomService.listRooms();
  }

  @Get('rooms/:roomId')
  getRoom(@Param('roomId') roomId: string): RoomFullStateDto {
    return this.roomService.getRoomOrThrow(roomId);
  }

  @Post('rooms')
  @UseGuards(JwtAuthGuard)
  createRoom(
    @Body() body: CreateRoomPayload,
    @Req() req: { user: AuthUserDto }
  ): RoomFullStateDto {
    return this.roomService.createRoom(body, req.user);
  }
}
