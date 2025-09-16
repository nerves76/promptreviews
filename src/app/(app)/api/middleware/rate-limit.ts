/**
 * Rate Limiting Middleware for API Endpoints
 * 
 * Provides configurable rate limiting with different strategies:
 * - Per-user limits
 * - Per-IP limits  
 * - Per-account limits
 * - Global limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest, userId?: string, accountId?: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  error?: string;
}

// In-memory store for rate limit tracking (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Check rate limit for a given key
 */
function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  let entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(key, entry);
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: new Date(entry.resetTime)
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: new Date(entry.resetTime),
      error: config.message || 'Rate limit exceeded. Please try again later.'
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: new Date(entry.resetTime)
  };
}

/**
 * Default key generators for different rate limiting strategies
 */
export const KeyGenerators = {
  byIP: (request: NextRequest) => `ip:${request.ip || 'unknown'}`,
  byUser: (request: NextRequest, userId?: string) => `user:${userId || 'anonymous'}`,
  byAccount: (request: NextRequest, userId?: string, accountId?: string) => `account:${accountId || 'none'}`,
  byUserAndEndpoint: (request: NextRequest, userId?: string) => {
    const endpoint = new URL(request.url).pathname;
    return `user:${userId || 'anonymous'}:${endpoint}`;
  },
  global: () => 'global'
};

/**
 * Common rate limit configurations
 */
export const RateLimits = {
  // General API endpoints - moderate limits
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: KeyGenerators.byUser
  },
  
  // Auth endpoints - stricter limits to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    maxRequests: 10,
    keyGenerator: KeyGenerators.byIP,
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  
  // AI endpoints - expensive operations, limit more strictly
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyGenerator: KeyGenerators.byUser,
    message: 'AI request limit exceeded. Please upgrade your plan for higher limits.'
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    keyGenerator: KeyGenerators.byAccount
  },
  
  // Public endpoints (no auth required)
  public: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: KeyGenerators.byIP
  },
  
  // Admin endpoints - higher limits for authorized users
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,
    keyGenerator: KeyGenerators.byUser
  }
};

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string,
  accountId?: string
): Promise<RateLimitResult> {
  try {
    const key = config.keyGenerator 
      ? config.keyGenerator(request, userId, accountId)
      : KeyGenerators.byIP(request);
      
    const result = checkRateLimit(key, config);
    
    // Log rate limit violations
    if (!result.success) {
      console.warn('Rate limit exceeded:', {
        key,
        userId,
        accountId,
        endpoint: request.url,
        ip: request.ip
      });
      
      // Log to database for monitoring
      try {
        const supabase = createServiceRoleClient();
        await supabase.from('rate_limit_violations').insert({
          rate_limit_key: key,
          user_id: userId || null,
          account_id: accountId || null,
          endpoint: request.url,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent'),
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to log rate limit violation:', error);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // If rate limiting fails, allow the request (fail open)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: new Date(Date.now() + config.windowMs)
    };
  }
}

/**
 * Create a rate limit response with proper headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    { 
      error: result.error || 'Rate limit exceeded',
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset.toISOString()
    },
    { status: 429 }
  );
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString());
  response.headers.set('Retry-After', Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString());
  
  return response;
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString());
  return response;
}

/**
 * Wrapper function to easily add rate limiting to API routes
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig,
  getUserInfo?: (request: NextRequest) => Promise<{ userId?: string; accountId?: string }>
) {
  return async (request: NextRequest, context?: any) => {
    let userId: string | undefined;
    let accountId: string | undefined;
    
    // Get user info if function provided
    if (getUserInfo) {
      try {
        const userInfo = await getUserInfo(request);
        userId = userInfo.userId;
        accountId = userInfo.accountId;
      } catch (error) {
        // Continue without user info if it fails
      }
    }
    
    // Check rate limit
    const rateLimitResult = await applyRateLimit(request, config, userId, accountId);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }
    
    // Call the original handler
    const response = await handler(request, context);
    
    // Add rate limit headers to successful responses
    return addRateLimitHeaders(response, rateLimitResult);
  };
}

/**
 * Get current rate limit status for a key (useful for dashboards)
 */
export function getRateLimitStatus(key: string): {
  count: number;
  resetTime: Date;
  isLimited: boolean;
} | null {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  if (now > entry.resetTime) {
    rateLimitStore.delete(key);
    return null;
  }
  
  return {
    count: entry.count,
    resetTime: new Date(entry.resetTime),
    isLimited: entry.count >= entry.count // This would need the original config to be accurate
  };
}