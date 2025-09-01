/**
 * Example of how to add rate limiting to API routes
 * Copy this pattern to any API route that needs protection
 */

import { checkRateLimit, apiRateLimiter } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

// Add this to the beginning of any API route handler:
export async function GET(request: Request) {
  // Check rate limit
  const { allowed, remaining } = checkRateLimit(request, apiRateLimiter);
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        }
      }
    );
  }

  // Your normal API logic here
  const response = NextResponse.json({ 
    message: 'Success',
    // ... your data
  });
  
  // Add rate limit headers to response
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  
  return response;
}