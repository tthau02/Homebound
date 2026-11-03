import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  public isDatabaseConnected = false;

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      this.logger.warn(
        'DATABASE_URL not set — running with in-memory authoritative state store.'
      );
      return;
    }

    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DB connection timeout')), 2000)
        ),
      ]);
      this.isDatabaseConnected = true;
      this.logger.log('Connected to PostgreSQL via Prisma ORM.');
    } catch {
      this.isDatabaseConnected = false;
      this.logger.warn(
        'PostgreSQL is not reachable on DATABASE_URL — using hybrid in-memory authoritative store.'
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isDatabaseConnected) {
      await this.$disconnect();
    }
  }
}
