import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RefreshSessionService } from './refresh-session.service';

jest.mock('argon2');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let auditService: jest.Mocked<Partial<AuditService>>;
  let prismaService: any;
  let refreshSessionService: jest.Mocked<Partial<RefreshSessionService>>;

  const mockReqMeta = { ipAddress: '127.0.0.1', userAgent: 'test-agent', deviceInfo: 'test-device' };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn() };
    jwtService = { 
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      decode: jest.fn().mockReturnValue({ exp: 1234567890 })
    };
    auditService = { logEvent: jest.fn() };
    refreshSessionService = {
      createSession: jest.fn(),
    };
    prismaService = {
      $transaction: jest.fn(async (cb) => {
        return cb({
          auditLog: { create: jest.fn() }
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditService, useValue: auditService },
        { provide: PrismaService, useValue: prismaService },
        { provide: RefreshSessionService, useValue: refreshSessionService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should throw UnauthorizedException if user not found', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(authService.login({ email: 'test@test.com', password: 'password' }, mockReqMeta)).rejects.toThrow(UnauthorizedException);
    expect(auditService.logEvent).toHaveBeenCalledWith('UNKNOWN', AuditAction.LOGIN_FAILED, expect.any(Object));
  });

  it('should throw UnauthorizedException if password is wrong', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({ id: '1', passwordHash: 'hash', isActive: true });
    (argon2.verify as jest.Mock).mockResolvedValue(false);
    await expect(authService.login({ email: 'test@test.com', password: 'wrong' }, mockReqMeta)).rejects.toThrow(UnauthorizedException);
    expect(auditService.logEvent).toHaveBeenCalledWith('1', AuditAction.LOGIN_FAILED, expect.any(Object));
  });

  it('should throw ForbiddenException if user is inactive', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({ id: '1', passwordHash: 'hash', isActive: false });
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    await expect(authService.login({ email: 'test@test.com', password: 'password' }, mockReqMeta)).rejects.toThrow(ForbiddenException);
  });

  it('should login successfully', async () => {
    const mockUser = { id: '1', email: 'test@test.com', fullName: 'Test', avatarUrl: null, role: 'OWNER', passwordHash: 'hash', isActive: true };
    (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({ email: 'test@test.com', password: 'password' }, mockReqMeta);

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.id).toBe('1');
    expect(prismaService.$transaction).toHaveBeenCalled();
  });
});
