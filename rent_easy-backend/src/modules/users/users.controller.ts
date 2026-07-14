import { Controller, Get, Patch, Body, Req, UnauthorizedException, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('v1/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private extractUserId(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({ message: 'Missing or invalid token', code: 'UNAUTHORIZED' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'accessSecret'
      });
      return payload.sub;
    } catch (e) {
      throw new UnauthorizedException({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' });
    }
  }

  @Get('me')
  async getProfile(@Headers('authorization') authHeader: string) {
    const userId = this.extractUserId(authHeader);
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException({ message: 'User not found', code: 'USER_NOT_FOUND' });
    
    // Omit password
    const { passwordHash, ...rest } = user;
    return rest;
  }

  @Patch('me')
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() dto: UpdateProfileDto
  ) {
    const userId = this.extractUserId(authHeader);
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Headers('authorization') authHeader: string,
    @Req() req: any,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = this.extractUserId(authHeader);
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    await this.usersService.changePassword(userId, dto, { ipAddress, userAgent });
    
    // Note: Since all refresh sessions are revoked, the client should logically clear its refresh cookie,
    // but the controller itself doesn't have `@Res()` here. If we want to clear it here:
    if (req.res) {
      req.res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
      });
    }

    return { message: 'Password changed successfully. All sessions revoked.' };
  }
}
