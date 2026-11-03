import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('VirtualBusBackend');
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  logger.log(`Virtual Bus Multiplayer Server running on http://localhost:${port}`);
}

bootstrap();
