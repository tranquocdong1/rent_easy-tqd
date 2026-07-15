import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { AuditAction, RefreshSessionRevokeReason } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RefreshSessionService } from './refresh-session.service';
import { hashToken } from './auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  async login(loginDto: LoginDto, reqMeta: { ipAddress: string; userAgent: string; deviceInfo: string }) {
    // 1. Find User
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      await this.auditService.logEvent('UNKNOWN', AuditAction.LOGIN_FAILED, { ...reqMeta, email: loginDto.email, reason: 'User not found' });
      throw new UnauthorizedException({ message: 'Email hoặc mật khẩu không chính xác.', code: 'INVALID_CREDENTIALS', statusCode: 401, error: 'Unauthorized' });
    }

    // 2. Verify Password
    const isPasswordValid = await argon2.verify(user.passwordHash, loginDto.password);
    if (!isPasswordValid) {
      await this.auditService.logEvent(user.id, AuditAction.LOGIN_FAILED, { ...reqMeta, reason: 'Invalid password' });
      throw new UnauthorizedException({ message: 'Email hoặc mật khẩu không chính xác.', code: 'INVALID_CREDENTIALS', statusCode: 401, error: 'Unauthorized' });
    }

    if (!user.isActive) {
      await this.auditService.logEvent(user.id, AuditAction.LOGIN_FAILED, { ...reqMeta, reason: 'Account disabled' });
      throw new ForbiddenException({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', code: 'ACCOUNT_DISABLED', statusCode: 403, error: 'Forbidden' });
    }

    const sessionId = crypto.randomUUID();
    const refreshTokenPayload = { sub: user.id, sid: sessionId, jti: crypto.randomUUID() };
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'refreshSecret';
    
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    const decodedRefresh = this.jwtService.decode(refreshToken) as { exp: number };
    const expiresAt = new Date(decodedRefresh.exp * 1000);
    const refreshTokenHash = hashToken(refreshToken);

    const accessTokenPayload = { sub: user.id, role: user.role };
    const expiresIn = 900; // 15 minutes
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'accessSecret',
      expiresIn: expiresIn,
    });

    await this.prisma.$transaction(async (tx) => {
      await this.refreshSessionService.createSession(tx, {
        id: sessionId,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
        ipAddress: reqMeta.ipAddress,
        userAgent: reqMeta.userAgent,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: AuditAction.LOGIN_SUCCESS,
          metadata: reqMeta as any,
        }
      });
    });

    return {
      accessToken,
      expiresIn,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  async refresh(oldRefreshToken: string, reqMeta: { ipAddress: string; userAgent: string }) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'refreshSecret';
    let payload: any;
    try {
      payload = this.jwtService.verify(oldRefreshToken, { secret: refreshSecret });
    } catch (e) {
      throw new UnauthorizedException({ message: 'Token không hợp lệ hoặc đã hết hạn.', code: 'INVALID_TOKEN' });
    }

    const { sub: userId, sid: sessionId } = payload;

    let reuseDetected = false;

    const result = await this.prisma.$transaction(async (tx) => {
      const session = await this.refreshSessionService.findById(tx, sessionId);
      
      if (!session) {
        throw new UnauthorizedException({ message: 'Session không tồn tại.', code: 'SESSION_NOT_FOUND' });
      }
      
      if (session.isRevoked) {
        throw new UnauthorizedException({ message: 'Session đã bị thu hồi.', code: 'SESSION_REVOKED' });
      }
      
      if (session.expiresAt < new Date()) {
        throw new UnauthorizedException({ message: 'Session đã hết hạn.', code: 'SESSION_EXPIRED' });
      }
      
      const oldTokenHash = hashToken(oldRefreshToken);
      
      // Token Reuse Detection
      if (session.tokenHash !== oldTokenHash) {
        // Reuse detected
        await this.refreshSessionService.revokeAllUserSessions(tx, userId, RefreshSessionRevokeReason.TOKEN_REUSE);
        await tx.auditLog.create({
          data: {
            userId,
            action: AuditAction.TOKEN_REUSE_DETECTED,
            metadata: { sessionId, ...reqMeta } as any,
          }
        });
        reuseDetected = true;
        return null;
      }
      
      // Valid, rotate token
      const newRefreshTokenPayload = { sub: userId, sid: sessionId, jti: crypto.randomUUID() };
      const newRefreshToken = this.jwtService.sign(newRefreshTokenPayload, {
        secret: refreshSecret,
        expiresIn: '7d',
      });
      
      const newRefreshTokenHash = hashToken(newRefreshToken);
      
      await this.refreshSessionService.updateSessionOnRefresh(tx, sessionId, newRefreshTokenHash, session.rotationCounter + 1);
      
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException({ message: 'Người dùng không tồn tại hoặc bị khóa.', code: 'USER_DISABLED' });
      }
      
      const accessTokenPayload = { sub: userId, role: user.role };
      const expiresIn = 900;
      const accessToken = this.jwtService.sign(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'accessSecret',
        expiresIn,
      });
      
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.TOKEN_REFRESH,
          metadata: { sessionId, ...reqMeta } as any,
        }
      });
      
      return {
        accessToken,
        expiresIn,
        refreshToken: newRefreshToken,
      };
    });

    if (reuseDetected || !result) {
      throw new UnauthorizedException({ message: 'Phát hiện sử dụng lại token.', code: 'TOKEN_REUSE_DETECTED' });
    }

    return result;
  }

  async logout(refreshToken: string, reqMeta: { ipAddress: string; userAgent: string }) {
    if (!refreshToken) return;
    
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'refreshSecret';
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
    } catch (e) {
      throw new UnauthorizedException({ message: 'Token không hợp lệ hoặc đã hết hạn.', code: 'INVALID_TOKEN' });
    }

    const { sub: userId, sid: sessionId } = payload;
    
    await this.prisma.$transaction(async (tx) => {
      const session = await this.refreshSessionService.findById(tx, sessionId);
      if (session && !session.isRevoked) {
        await this.refreshSessionService.revokeSession(tx, sessionId, RefreshSessionRevokeReason.LOGOUT);
        await tx.auditLog.create({
          data: {
            userId,
            action: AuditAction.LOGOUT,
            metadata: { sessionId, ...reqMeta } as any,
          }
        });
      }
    });
  }

  // TODO: Add a Cron job or scheduled task to clean up expired or revoked RefreshSessions from PostgreSQL periodically to avoid bloating the DB.
}
