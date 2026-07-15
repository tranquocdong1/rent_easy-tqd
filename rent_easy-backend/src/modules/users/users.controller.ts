import { Controller, Get, Patch, Body, Req, UnauthorizedException, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException({ message: 'User not found', code: 'USER_NOT_FOUND' });
    
    // Omit password
    const { passwordHash, ...rest } = user;
    return rest;
  }

  @Patch('me')
  async updateProfile(
    @Req() req: any,
    @Body() dto: UpdateProfileDto
  ) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    await this.usersService.changePassword(userId, dto, { ipAddress, userAgent });
    
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
