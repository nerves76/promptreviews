/**
 * Production Rate Limiting Utility
 * 
 * This utility provides distributed rate limiting for production
 * using Redis to prevent memory leaks and support multiple instances.
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

class RateLimiter {
  private redis: any = null;
  private memoryStore = new Map<string, { count: number; resetTime: number }>();
  private useRedis: boolean;

  constructor() {
    this.useRedis = !!process.env.REDIS_URL;
    
    if (this.useRedis) {
      this.initRedis();
    }
  }

  private async initRedis() {
    try {
      let Redis: any = null;
      try {
        Redis = (await import('ioredis')).default;
      } catch {
        // ioredis not available
      }
      if (Redis) {
        this.redis = new Redis(process.env.REDIS_URL!, {
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: null,
        });
        
        this.redis.on('error', (error: any) => {
          console.error('Redis connection error:', error);
          this.useRedis = false;
        });
      }
    } catch (error) {
      console.warn('Redis not available, falling back to memory store');
      this.useRedis = false;
    }
  }

  async checkRateLimit(key: string, config: RateLimitConfig): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    if (this.useRedis && this.redis) {
      return this.checkRedisRateLimit(key, config);
    } else {
      return this.checkMemoryRateLimit(key, config);
    }
  }

  private async checkRedisRateLimit(key: string, config: RateLimitConfig) {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      
      // Remove old entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, now, now.toString());
      
      // Set expiry
      pipeline.expire(key, Math.ceil(config.windowMs / 1000));
      
      const results = await pipeline.exec();
      const currentCount = results![1][1] as number;
      
      const allowed = currentCount < config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetTime = now + config.windowMs;
      
      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fallback to memory store
      return this.checkMemoryRateLimit(key, config);
    }
  }

  private checkMemoryRateLimit(key: string, config: RateLimitConfig) {
    const now = Date.now();
    const entry = this.memoryStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }
    
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }
    
    // Increment count
    entry.count++;
    
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Clean up expired entries (for memory store)
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (now > entry.resetTime) {
        this.memoryStore.delete(key);
      }
    }
  }

  // Get statistics
  getStats() {
    return {
      useRedis: this.useRedis,
      memoryStoreSize: this.memoryStore.size,
    };
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Rate limit middleware for Next.js API routes
export function rateLimitMiddleware(config: RateLimitConfig) {
  return (handler: Function) => {
    return async (req: any, res: any) => {
      const key = config.keyGenerator 
        ? config.keyGenerator(req)
        : req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      
      const result = await rateLimiter.checkRateLimit(key, config);
      
      if (!result.allowed) {
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.resetTime);
        
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
      }
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetTime);
      
      return handler(req, res);
    };
  };
}

// Rate limit decorator for functions
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: RateLimitConfig,
  keyGenerator?: (...args: T) => string
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator ? keyGenerator(...args) : 'default';
    const result = await rateLimiter.checkRateLimit(key, config);
    
    if (!result.allowed) {
      throw new Error('Rate limit exceeded');
    }
    
    return fn(...args);
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  rateLimiter.cleanup();
}, 60000); // Every minute

const rateLimitUtils = {
  rateLimitMiddleware,
  withRateLimit,
  getStats: () => rateLimiter.getStats(),
};

export default rateLimitUtils; 