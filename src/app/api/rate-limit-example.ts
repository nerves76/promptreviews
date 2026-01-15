/**
 * Example of how to add rate limiting to API routes
 * This route is protected by a persistent, database-backed rate limiter.
 */

import { withRateLimit, RateLimits } from '@/app/(app)/api/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

async function handler(request: NextRequest) {
  // Your normal API logic here
  // The withRateLimit wrapper handles checking and headers automatically.
  return NextResponse.json({ 
    message: 'Success! This response is rate-limited.',
  });
}

// Wrap the handler with the rate limit middleware
export const GET = withRateLimit(handler, RateLimits.api);