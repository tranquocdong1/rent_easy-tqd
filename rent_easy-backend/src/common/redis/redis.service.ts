import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redisClient = new Redis(this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379');
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async setSession(sessionId: string, data: any, ttlInSeconds: number): Promise<void> {
    await this.redisClient.setex(`refresh:${sessionId}`, ttlInSeconds, JSON.stringify(data));
  }

  async getSession(sessionId: string): Promise<any> {
    const data = await this.redisClient.get(`refresh:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redisClient.del(`refresh:${sessionId}`);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    // Note: In production with many keys, scanning is better than keys() or maintaining a Set per user.
    // We will do a basic scan for 'refresh:*' and delete those matching userId.
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
  }
}
