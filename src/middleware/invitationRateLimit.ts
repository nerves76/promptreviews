/**
 * Invitation Rate Limiting Middleware
 * 
 * This middleware provides rate limiting specifically for invitation operations
 * to prevent spam, abuse, and ensure fair usage across accounts.
 */

import { NextRequest } from 'next/server';

interface RateLimit {
  count: number;
  resetTime: number;
}

interface InvitationLimits {
  perMinute: number;
  perHour: number;
  perDay: number;
  maxPendingPerAccount: number;
}

class InvitationRateLimiter {
  private store = new Map<string, RateLimit>();
  private limits: InvitationLimits;

  constructor(limits: InvitationLimits = {
    perMinute: 5,    // 5 invitations per minute
    perHour: 20,     // 20 invitations per hour  
    perDay: 100,     // 100 invitations per day
    maxPendingPerAccount: 50  // 50 pending invitations max
  }) {
    this.limits = limits;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private getKey(accountId: string, timeWindow: 'minute' | 'hour' | 'day'): string {
    const now = Date.now();
    let windowSize: number;
    
    switch (timeWindow) {
      case 'minute':
        windowSize = 60 * 1000;
        break;
      case 'hour':
        windowSize = 60 * 60 * 1000;
        break;
      case 'day':
        windowSize = 24 * 60 * 60 * 1000;
        break;
    }
    
    const windowStart = Math.floor(now / windowSize) * windowSize;
    return `${accountId}:${timeWindow}:${windowStart}`;
  }

  private getRateLimit(key: string): RateLimit {
    return this.store.get(key) || { count: 0, resetTime: Date.now() };
  }

  private setRateLimit(key: string, rateLimit: RateLimit): void {
    this.store.set(key, rateLimit);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, rateLimit] of this.store.entries()) {
      if (now > rateLimit.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check if an account has exceeded rate limits for invitations
   */
  public checkRateLimit(accountId: string): {
    allowed: boolean;
    error?: string;
    retryAfter?: number;
    limits: {
      minute: { current: number; limit: number; resetTime: number };
      hour: { current: number; limit: number; resetTime: number };
      day: { current: number; limit: number; resetTime: number };
    };
  } {
    const now = Date.now();
    
    // Check minute limit
    const minuteKey = this.getKey(accountId, 'minute');
    const minuteLimit = this.getRateLimit(minuteKey);
    const minuteResetTime = Math.ceil(now / (60 * 1000)) * (60 * 1000);
    
    // Check hour limit
    const hourKey = this.getKey(accountId, 'hour');
    const hourLimit = this.getRateLimit(hourKey);
    const hourResetTime = Math.ceil(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
    
    // Check day limit
    const dayKey = this.getKey(accountId, 'day');
    const dayLimit = this.getRateLimit(dayKey);
    const dayResetTime = Math.ceil(now / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);

    // Check if any limit is exceeded
    if (minuteLimit.count >= this.limits.perMinute) {
      return {
        allowed: false,
        error: `Rate limit exceeded: Maximum ${this.limits.perMinute} invitations per minute`,
        retryAfter: Math.ceil((minuteResetTime - now) / 1000),
        limits: {
          minute: { current: minuteLimit.count, limit: this.limits.perMinute, resetTime: minuteResetTime },
          hour: { current: hourLimit.count, limit: this.limits.perHour, resetTime: hourResetTime },
          day: { current: dayLimit.count, limit: this.limits.perDay, resetTime: dayResetTime }
        }
      };
    }

    if (hourLimit.count >= this.limits.perHour) {
      return {
        allowed: false,
        error: `Rate limit exceeded: Maximum ${this.limits.perHour} invitations per hour`,
        retryAfter: Math.ceil((hourResetTime - now) / 1000),
        limits: {
          minute: { current: minuteLimit.count, limit: this.limits.perMinute, resetTime: minuteResetTime },
          hour: { current: hourLimit.count, limit: this.limits.perHour, resetTime: hourResetTime },
          day: { current: dayLimit.count, limit: this.limits.perDay, resetTime: dayResetTime }
        }
      };
    }

    if (dayLimit.count >= this.limits.perDay) {
      return {
        allowed: false,
        error: `Rate limit exceeded: Maximum ${this.limits.perDay} invitations per day`,
        retryAfter: Math.ceil((dayResetTime - now) / 1000),
        limits: {
          minute: { current: minuteLimit.count, limit: this.limits.perMinute, resetTime: minuteResetTime },
          hour: { current: hourLimit.count, limit: this.limits.perHour, resetTime: hourResetTime },
          day: { current: dayLimit.count, limit: this.limits.perDay, resetTime: dayResetTime }
        }
      };
    }

    return {
      allowed: true,
      limits: {
        minute: { current: minuteLimit.count, limit: this.limits.perMinute, resetTime: minuteResetTime },
        hour: { current: hourLimit.count, limit: this.limits.perHour, resetTime: hourResetTime },
        day: { current: dayLimit.count, limit: this.limits.perDay, resetTime: dayResetTime }
      }
    };
  }

  /**
   * Record an invitation attempt (call this after successful invitation)
   */
  public recordInvitation(accountId: string): void {
    const now = Date.now();

    // Update minute counter
    const minuteKey = this.getKey(accountId, 'minute');
    const minuteLimit = this.getRateLimit(minuteKey);
    minuteLimit.count += 1;
    minuteLimit.resetTime = Math.ceil(now / (60 * 1000)) * (60 * 1000);
    this.setRateLimit(minuteKey, minuteLimit);

    // Update hour counter
    const hourKey = this.getKey(accountId, 'hour');
    const hourLimit = this.getRateLimit(hourKey);
    hourLimit.count += 1;
    hourLimit.resetTime = Math.ceil(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
    this.setRateLimit(hourKey, hourLimit);

    // Update day counter
    const dayKey = this.getKey(accountId, 'day');
    const dayLimit = this.getRateLimit(dayKey);
    dayLimit.count += 1;
    dayLimit.resetTime = Math.ceil(now / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
    this.setRateLimit(dayKey, dayLimit);
  }

  /**
   * Get current usage statistics for an account
   */
  public getUsageStats(accountId: string) {
    const result = this.checkRateLimit(accountId);
    return {
      limits: result.limits,
      remaining: {
        minute: Math.max(0, this.limits.perMinute - result.limits.minute.current),
        hour: Math.max(0, this.limits.perHour - result.limits.hour.current),
        day: Math.max(0, this.limits.perDay - result.limits.day.current)
      }
    };
  }
}

// Global singleton instance
export const invitationRateLimiter = new InvitationRateLimiter();

/**
 * Middleware function to check rate limits for invitation endpoints
 */
export async function checkInvitationRateLimit(
  request: NextRequest,
  accountId: string
): Promise<{ allowed: boolean; error?: string; retryAfter?: number; headers?: Record<string, string> }> {
  const result = invitationRateLimiter.checkRateLimit(accountId);
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit-Minute': invitationRateLimiter['limits'].perMinute.toString(),
    'X-RateLimit-Limit-Hour': invitationRateLimiter['limits'].perHour.toString(),
    'X-RateLimit-Limit-Day': invitationRateLimiter['limits'].perDay.toString(),
    'X-RateLimit-Remaining-Minute': Math.max(0, invitationRateLimiter['limits'].perMinute - result.limits.minute.current).toString(),
    'X-RateLimit-Remaining-Hour': Math.max(0, invitationRateLimiter['limits'].perHour - result.limits.hour.current).toString(),
    'X-RateLimit-Remaining-Day': Math.max(0, invitationRateLimiter['limits'].perDay - result.limits.day.current).toString(),
    'X-RateLimit-Reset-Minute': Math.ceil(result.limits.minute.resetTime / 1000).toString(),
    'X-RateLimit-Reset-Hour': Math.ceil(result.limits.hour.resetTime / 1000).toString(),
    'X-RateLimit-Reset-Day': Math.ceil(result.limits.day.resetTime / 1000).toString()
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return {
    allowed: result.allowed,
    error: result.error,
    retryAfter: result.retryAfter,
    headers
  };
}

/**
 * Record successful invitation (call this after sending invitation)
 */
export function recordInvitationSuccess(accountId: string): void {
  invitationRateLimiter.recordInvitation(accountId);
} 