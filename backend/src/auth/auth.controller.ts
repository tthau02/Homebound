import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AuthResponseDto,
  AuthUserDto,
  LoginRequestDto,
  RegisterRequestDto,
} from '@virtual-bus/shared';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(body);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(): Promise<{ success: boolean }> {
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: { user: AuthUserDto }): Promise<AuthUserDto> {
    return req.user;
  }
}
