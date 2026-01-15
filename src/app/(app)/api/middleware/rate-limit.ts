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
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/auth/providers/supabase';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest, userId?: string, accountId?: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  failClosed?: boolean; // If true, block requests when rate limiting fails (for sensitive endpoints)
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  error?: string;
}

const RATE_LIMIT_TABLE = 'rate_limit_counters';
let rateLimitClient: SupabaseClient | null = null;

function getRateLimitClient() {
  if (!rateLimitClient) {
    rateLimitClient = createServiceRoleClient();
  }
  return rateLimitClient;
}

/**
 * Check rate limit for a given key using atomic database function
 * This prevents race conditions by using row-level locking in Postgres
 */
async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const supabase = getRateLimitClient();
  const resetAt = new Date(Date.now() + config.windowMs);

  // Use atomic function to check and increment in a single transaction
  const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
    p_key: key,
    p_max_requests: config.maxRequests,
    p_window_ms: config.windowMs,
  });

  if (error) {
    throw error;
  }

  // The function returns an array with a single row
  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error('Rate limit check returned no result');
  }

  const resetTime = new Date(result.reset_time);
  const currentCount = result.current_count;

  if (!result.allowed) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetTime,
      error: config.message || 'Rate limit exceeded. Please try again later.'
    };
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - currentCount),
    reset: resetTime,
  };
}

/**
 * Get client IP from request, handling proxies
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.ip || 'unknown';
}

/**
 * Default key generators for different rate limiting strategies
 */
export const KeyGenerators = {
  byIP: (request: NextRequest) => `ip:${getClientIP(request)}`,
  byUser: (request: NextRequest, userId?: string) => `user:${userId || 'anonymous'}`,
  byAccount: (request: NextRequest, userId?: string, accountId?: string) => `account:${accountId || 'none'}`,
  byUserAndEndpoint: (request: NextRequest, userId?: string) => {
    const endpoint = new URL(request.url).pathname;
    return `user:${userId || 'anonymous'}:${endpoint}`;
  },
  byIPAndEndpoint: (request: NextRequest) => {
    const endpoint = new URL(request.url).pathname;
    return `ip:${getClientIP(request)}:${endpoint}`;
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
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    failClosed: true // Block requests if rate limiting fails
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
    keyGenerator: KeyGenerators.byUser,
    failClosed: true // Block requests if rate limiting fails
  },

  // Stricter admin endpoints for sensitive operations
  adminStrict: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    keyGenerator: KeyGenerators.byUser,
    message: 'Too many requests for this admin operation.',
    failClosed: true // Block requests if rate limiting fails
  },

  // General-purpose API limit
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: KeyGenerators.byIP
  },

  // Permissive limit for public-facing widgets
  widget: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: KeyGenerators.byIP
  },

  // Public AI endpoints - strict limits to prevent OpenAI cost abuse
  publicAi: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: KeyGenerators.byIPAndEndpoint,
    message: 'Too many requests. Please try again in a minute.'
  },

  // Signup endpoints - strict limits to prevent spam account creation
  signup: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: KeyGenerators.byIP,
    message: 'Too many signup attempts. Please try again in 15 minutes.',
    failClosed: true // Block requests if rate limiting fails
  },

  // Email check endpoint - moderate limits to prevent enumeration
  emailCheck: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    keyGenerator: KeyGenerators.byIP,
    message: 'Too many requests. Please try again later.'
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

    const result = await checkRateLimit(key, config);

    // Log rate limit violations
    if (!result.success) {
      console.warn('Rate limit exceeded:', {
        key,
        userId,
        accountId,
        endpoint: request.url,
        ip: getClientIP(request)
      });

      // Log to database for monitoring (fire and forget)
      try {
        const supabase = getRateLimitClient();
        await supabase.from('rate_limit_violations').insert({
          rate_limit_key: key,
          user_id: userId || null,
          account_id: accountId || null,
          endpoint: new URL(request.url).pathname,
          ip_address: getClientIP(request),
          user_agent: request.headers.get('user-agent')
        });
      } catch (logError) {
        console.error('Failed to log rate limit violation:', logError);
      }
    }

    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);

    // Fail-closed for sensitive endpoints (auth, admin)
    if (config.failClosed) {
      console.warn('Rate limit check failed, blocking request (failClosed enabled)');
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: new Date(Date.now() + config.windowMs),
        error: 'Service temporarily unavailable. Please try again later.'
      };
    }

    // Fail-open for non-sensitive endpoints (default behavior)
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
