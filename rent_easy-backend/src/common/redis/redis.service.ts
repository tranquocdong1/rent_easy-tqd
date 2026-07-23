import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const options = {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => Math.min(times * 1000, 10000),
    };

    if (redisUrl) {
      this.redisClient = new Redis(redisUrl, options);
    } else {
      const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
      const port = Number(this.configService.get<number>('REDIS_PORT') || 6379);
      this.redisClient = new Redis({ host, port, ...options });
    }

    this.redisClient.on('error', (err) => {
      this.logger.warn(`Redis connection event: ${err.message}`);
    });
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async setSession(sessionId: string, data: any, ttlInSeconds: number): Promise<void> {
    try {
      await this.redisClient.setex(`refresh:${sessionId}`, ttlInSeconds, JSON.stringify(data));
    } catch (err: any) {
      this.logger.warn(`Redis setSession failed: ${err.message}`);
    }
  }

  async getSession(sessionId: string): Promise<any> {
    try {
      const data = await this.redisClient.get(`refresh:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (err: any) {
      this.logger.warn(`Redis getSession failed: ${err.message}`);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.redisClient.del(`refresh:${sessionId}`);
    } catch (err: any) {
      this.logger.warn(`Redis deleteSession failed: ${err.message}`);
    }
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', 'refresh:*', 'COUNT', 100);
        cursor = nextCursor;
        
        for (const key of keys) {
          const sessionData = await this.redisClient.get(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.userId === userId) {
              await this.redisClient.del(key);
            }
          }
        }
      } while (cursor !== '0');
    } catch (err: any) {
      this.logger.warn(`Redis deleteAllUserSessions failed: ${err.message}`);
    }
  }
}
