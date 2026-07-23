import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  /** Max allowed requests within the TTL window */
  limit: number;
  /** Window duration in seconds */
  ttl: number;
}

export const RATE_LIMIT_KEY = 'rate_limit';
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
