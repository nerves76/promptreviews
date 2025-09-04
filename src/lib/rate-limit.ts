/**
 * Simple in-memory rate limiter
 * This provides basic protection against API abuse without external dependencies
 * For production, consider using Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 60) { // Default: 60 requests per minute
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }
}

// Different rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter(60000, 60); // 60 req/min for general API
export const authRateLimiter = new RateLimiter(900000, 5); // 5 attempts per 15 min for auth
export const widgetRateLimiter = new RateLimiter(60000, 100); // 100 req/min for widgets (more permissive)
export const adminRateLimiter = new RateLimiter(300000, 10); // 10 req per 5 min for admin operations (strict)

/**
 * Middleware helper for API routes
 */
export function checkRateLimit(
  request: Request,
  limiter: RateLimiter = apiRateLimiter
): { allowed: boolean; remaining: number } {
  // Use IP address as identifier (fallback to a generic identifier if not available)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  const allowed = limiter.isAllowed(ip);
  const remaining = limiter.getRemainingRequests(ip);
  
  return { allowed, remaining };
}