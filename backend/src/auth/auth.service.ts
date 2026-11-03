import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import {
  AuthResponseDto,
  AuthUserDto,
  LoginRequestDto,
  RegisterRequestDto,
} from '@virtual-bus/shared';
import { PrismaService } from '../database/prisma.service';

interface InternalUserRecord {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatar: string;
  shirtColor: string;
  walletBalance: number;
}

@Injectable()
export class AuthService {
  private readonly usersById = new Map<string, InternalUserRecord>();
  private readonly userIdByUsername = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {
    this.seedDefaultDemoAccounts();
  }

  private hashPassword(password: string): string {
    const salt = 'virtual_bus_salt_2026';
    return crypto.scryptSync(password, salt, 32).toString('hex');
  }

  private seedDefaultDemoAccounts(): void {
    const defaults: Array<Omit<InternalUserRecord, 'passwordHash'> & { password: string }> = [
      {
        id: 'user-driver-1',
        username: 'taixe',
        password: '123456',
        displayName: 'Bác Tài Ba Miền Tây',
        avatar: '👨‍✈️',
        shirtColor: '#2563eb',
        walletBalance: 1500000,
      },
      {
        id: 'user-assistant-1',
        username: 'phuxe',
        password: '123456',
        displayName: 'Phụ Xe Tư Vui Vẻ',
        avatar: '🧢',
        shirtColor: '#059669',
        walletBalance: 1200000,
      },
      {
        id: 'user-passenger-1',
        username: 'hanhkhach',
        password: '123456',
        displayName: 'Hành Khách Minh Khoa',
        avatar: '🧑‍🚀',
        shirtColor: '#f59e0b',
        walletBalance: 1000000,
      },
    ];

    for (const acc of defaults) {
      const record: InternalUserRecord = {
        id: acc.id,
        username: acc.username,
        passwordHash: this.hashPassword(acc.password),
        displayName: acc.displayName,
        avatar: acc.avatar,
        shirtColor: acc.shirtColor,
        walletBalance: acc.walletBalance,
      };
      this.usersById.set(record.id, record);
      this.userIdByUsername.set(record.username.toLowerCase(), record.id);
    }
  }

  private toDto(record: InternalUserRecord): AuthUserDto {
    return {
      id: record.id,
      username: record.username,
      displayName: record.displayName,
      avatar: record.avatar,
      shirtColor: record.shirtColor,
      walletBalance: record.walletBalance,
    };
  }

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const username = dto.username?.trim().toLowerCase();
    const password = dto.password?.trim();
    const displayName = dto.displayName?.trim();

    if (!username || username.length < 3 || username.length > 24) {
      throw new BadRequestException('Tên đăng nhập phải từ 3–24 ký tự.');
    }
    if (!password || password.length < 4) {
      throw new BadRequestException('Mật khẩu phải từ 4 ký tự trở lên.');
    }
    if (!displayName || displayName.length < 2 || displayName.length > 32) {
      throw new BadRequestException('Tên hiển thị phải từ 2–32 ký tự.');
    }

    if (this.userIdByUsername.has(username)) {
      throw new ConflictException('Tên đăng nhập đã tồn tại.');
    }

    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = this.hashPassword(password);
    const avatar = dto.avatar?.trim() || '🧑‍🚀';
    const shirtColor = dto.shirtColor?.trim() || '#f59e0b';

    const record: InternalUserRecord = {
      id,
      username,
      passwordHash,
      displayName,
      avatar,
      shirtColor,
      walletBalance: 1000000,
    };

    this.usersById.set(id, record);
    this.userIdByUsername.set(username, id);

    if (this.prisma.isDatabaseConnected) {
      try {
        await this.prisma.user.create({
          data: {
            id,
            username,
            passwordHash,
            profile: {
              create: {
                displayName,
                avatar,
                shirtColor,
                walletBalance: 1000000,
              },
            },
          },
        });
      } catch {
        // Ignore DB sync error if table not migrated yet
      }
    }

    const userDto = this.toDto(record);
    const accessToken = await this.jwtService.signAsync({
      sub: record.id,
      username: record.username,
    });

    return { accessToken, user: userDto };
  }

  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const username = dto.username?.trim().toLowerCase();
    const password = dto.password?.trim();

    if (!username || !password) {
      throw new BadRequestException('Vui lòng nhập tên đăng nhập và mật khẩu.');
    }

    const userId = this.userIdByUsername.get(username);
    const record = userId ? this.usersById.get(userId) : undefined;
    const expectedHash = this.hashPassword(password);

    if (!record || record.passwordHash !== expectedHash) {
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu.');
    }

    const userDto = this.toDto(record);
    const accessToken = await this.jwtService.signAsync({
      sub: record.id,
      username: record.username,
    });

    return { accessToken, user: userDto };
  }

  async verifyToken(token: string): Promise<AuthUserDto> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        username: string;
      }>(token);
      const user = this.usersById.get(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }
      return this.toDto(user);
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
    }
  }

  getUserById(userId: string): AuthUserDto | undefined {
    const rec = this.usersById.get(userId);
    return rec ? this.toDto(rec) : undefined;
  }

  adjustWalletBalance(userId: string, delta: number): number {
    const rec = this.usersById.get(userId);
    if (!rec) return 0;
    rec.walletBalance = Math.max(0, rec.walletBalance + delta);
    return rec.walletBalance;
  }
}
