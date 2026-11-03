import { Module } from '@nestjs/common';
import { BusGateway } from './bus.gateway';
import { AuthModule } from '../auth/auth.module';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [AuthModule, RoomModule],
  providers: [BusGateway],
})
export class GatewayModule {}
