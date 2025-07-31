/**
 * Rate Limit Status API
 * 
 * Provides information about current rate limit status for monitoring
 */

import { NextResponse } from "next/server";
import { getReviewRateLimitInfo } from "@/utils/reviewRateLimit";

export async function GET(request: Request) {
  try {
    // Get IP from request
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    
    // Get rate limit info for this IP
    const rateLimitInfo = getReviewRateLimitInfo(ip);
    
    return NextResponse.json({
      success: true,
      data: rateLimitInfo,
      message: rateLimitInfo.isLimited 
        ? 'Rate limit exceeded' 
        : `${rateLimitInfo.remaining} requests remaining`
    });
    
  } catch (error) {
    console.error('[RATE-LIMIT-STATUS] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get rate limit status' 
      },
      { status: 500 }
    );
  }
} 