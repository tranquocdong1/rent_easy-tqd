import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterGuard } from './rate-limiter.guard';
import { RedisService } from '../redis/redis.service';

describe('RateLimiterGuard', () => {
  let guard: RateLimiterGuard;
  let reflector: jest.Mocked<Reflector>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    redisService = {
      getClient: jest.fn().mockReturnValue(null),
    } as any;

    guard = new RateLimiterGuard(reflector, redisService);
  });

  const createMockContext = (ip = '127.0.0.1'): ExecutionContext => {
    const req = {
      ip,
      headers: {},
      route: { path: '/v1/auth/login' },
      url: '/v1/auth/login',
    };
    const res = {
      setHeader: jest.fn(),
    };

    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as any;
  };

  it('should allow request if no rate limit metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const context = createMockContext();

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow requests within limit using in-memory store', async () => {
    reflector.getAllAndOverride.mockReturnValue({ limit: 5, ttl: 60 });
    const context = createMockContext('10.0.0.1');

    for (let i = 0; i < 5; i++) {
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    }
  });

  it('should throw HttpException 429 when request limit is exceeded', async () => {
    reflector.getAllAndOverride.mockReturnValue({ limit: 3, ttl: 60 });
    const context = createMockContext('10.0.0.2');

    // 3 requests allowed
    await guard.canActivate(context);
    await guard.canActivate(context);
    await guard.canActivate(context);

    // 4th request should fail
    try {
      await guard.canActivate(context);
      fail('Should have thrown HttpException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const response = err.getResponse();
      expect(response).toEqual(
        expect.objectContaining({
          statusCode: 429,
          code: 'TOO_MANY_REQUESTS',
          message: expect.stringContaining('Quá nhiều lần thử đăng nhập'),
        }),
      );
    }
  });

  it('should use Redis client when available and status is ready', async () => {
    const mockRedisClient = {
      status: 'ready',
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(55),
    };
    redisService.getClient.mockReturnValue(mockRedisClient as any);

    reflector.getAllAndOverride.mockReturnValue({ limit: 5, ttl: 60 });
    const context = createMockContext('10.0.0.3');

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockRedisClient.incr).toHaveBeenCalled();
    expect(mockRedisClient.expire).toHaveBeenCalledWith(expect.stringContaining('10.0.0.3'), 60);
  });
});
