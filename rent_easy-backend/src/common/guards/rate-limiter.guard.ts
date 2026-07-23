import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private inMemoryStore = new Map<string, { count: number; expiresAt: number }>();

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rateLimitOptions) {
      return true;
    }

    const { limit, ttl } = rateLimitOptions;
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const ip =
      req.ip ||
      (req.headers && req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].toString().split(',')[0].trim()
        : '127.0.0.1');

    const routePath = req.route?.path || req.url || 'login';
    const key = `rate_limit:${routePath}:${ip}`;

    let currentCount = 0;
    let ttlRemaining = ttl;

    let redisSuccess = false;
    try {
      const client = this.redisService.getClient();
      if (client && (client.status === 'ready' || client.status === 'connect')) {
        currentCount = await client.incr(key);
        if (currentCount === 1) {
          await client.expire(key, ttl);
        } else {
          const pttl = await client.ttl(key);
          if (pttl > 0) {
            ttlRemaining = pttl;
          }
        }
        redisSuccess = true;
      }
    } catch {
      redisSuccess = false;
    }

    // In-memory fallback if Redis is not ready or fails
    if (!redisSuccess) {
      const now = Date.now();
      const record = this.inMemoryStore.get(key);

      if (!record || record.expiresAt <= now) {
        this.inMemoryStore.set(key, { count: 1, expiresAt: now + ttl * 1000 });
        currentCount = 1;
      } else {
        record.count += 1;
        currentCount = record.count;
        ttlRemaining = Math.max(1, Math.ceil((record.expiresAt - now) / 1000));
      }
    }

    // Set standard rate limit HTTP headers if response object is available
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentCount).toString());
      res.setHeader('X-RateLimit-Reset', ttlRemaining.toString());
    }

    if (currentCount > limit) {
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', ttlRemaining.toString());
      }

      const minutes = Math.ceil(ttlRemaining / 60);
      const timeMessage = minutes > 1 ? `${minutes} phút` : `${ttlRemaining} giây`;

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ${timeMessage}.`,
          code: 'TOO_MANY_REQUESTS',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
