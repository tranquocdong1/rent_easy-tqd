import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceInfo = userAgent; // In a real app, parse this with a library like UAParser

    const result = await this.authService.login(loginDto, {
      ipAddress,
      userAgent,
      deviceInfo,
    });

    // Set Refresh Token as HttpOnly Cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set Access Token as HttpOnly Cookie
    // TODO: Implement CSRF protection (e.g. CSRF token or custom header) since we rely on cookies now
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return {
      message: 'Login successful',
      data: {
        expiresIn: result.expiresIn,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Refresh token không tồn tại.',
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.refresh(refreshToken, { ipAddress, userAgent });

    // Set new Refresh Token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Set new Access Token
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return {
      message: 'Token refreshed',
      data: {
        expiresIn: result.expiresIn,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await this.authService.logout(refreshToken, { ipAddress, userAgent });
    }

    // Clear Cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return {
      message: 'Logout successful',
    };
  }
}
