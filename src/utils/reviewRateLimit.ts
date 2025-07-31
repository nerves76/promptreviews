/**
 * Review Submission Rate Limiting
 * 
 * Provides configurable rate limiting for review submissions
 * with generous limits to ensure legitimate users are not blocked
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const reviewRateLimitStore = new Map<string, { count: number; resetTime: number; lastRequest: number }>();

interface ReviewRateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

const defaultReviewConfig: ReviewRateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 reviews per hour per IP (very generous)
  keyGenerator: (req: NextRequest) => {
    // Use IP address as key, with fallback
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    return `review:${ip}`;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

export function createReviewRateLimit(config: Partial<ReviewRateLimitConfig> = {}) {
  const finalConfig = { ...defaultReviewConfig, ...config };

  return function reviewRateLimit(req: NextRequest) {
    const key = finalConfig.keyGenerator!(req);
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of reviewRateLimitStore.entries()) {
      if (now > v.resetTime) {
        reviewRateLimitStore.delete(k);
      }
    }

    const current = reviewRateLimitStore.get(key);
    
    if (!current) {
      // First request
      reviewRateLimitStore.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs,
        lastRequest: now,
      });
      return null; // Allow request
    }

    if (now > current.resetTime) {
      // Window expired, reset
      reviewRateLimitStore.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs,
        lastRequest: now,
      });
      return null; // Allow request
    }

    if (current.count >= finalConfig.maxRequests) {
      // Rate limit exceeded
      const response = NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many review submissions. Please try again later.',
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
          limit: finalConfig.maxRequests,
          window: Math.ceil(finalConfig.windowMs / (60 * 1000)) + ' minutes'
        },
        { status: 429 }
      );
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', finalConfig.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
      response.headers.set('Retry-After', Math.ceil((current.resetTime - now) / 1000).toString());
      
      return response;
    }

    // Increment count
    current.count++;
    current.lastRequest = now;
    return null; // Allow request
  };
}

// Pre-configured rate limiters for different review scenarios
export const standardReviewRateLimit = createReviewRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 reviews per hour per IP
});

export const strictReviewRateLimit = createReviewRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 reviews per hour per IP (for suspicious activity)
});

export const generousReviewRateLimit = createReviewRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // 100 reviews per hour per IP (for high-traffic businesses)
});

// Helper function to get rate limit info for monitoring
export function getReviewRateLimitInfo(ip: string) {
  const key = `review:${ip}`;
  const current = reviewRateLimitStore.get(key);
  
  if (!current) {
    return {
      ip,
      count: 0,
      remaining: 50,
      resetTime: null,
      isLimited: false,
    };
  }
  
  const now = Date.now();
  const isExpired = now > current.resetTime;
  
  return {
    ip,
    count: isExpired ? 0 : current.count,
    remaining: isExpired ? 50 : Math.max(0, 50 - current.count),
    resetTime: isExpired ? null : new Date(current.resetTime).toISOString(),
    isLimited: !isExpired && current.count >= 50,
    lastRequest: new Date(current.lastRequest).toISOString(),
  };
} 