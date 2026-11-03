import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [DatabaseModule, AuthModule, RoomModule, GatewayModule],
})
export class AppModule {}
