/**
 * CSRF Protection via Origin/Referer checking
 * This provides protection against cross-site request forgery attacks
 * without needing to modify forms or frontend code
 */

import { NextRequest, NextResponse } from 'next/server';

// Allowed origins for your application
const ALLOWED_ORIGINS = [
  'https://promptreviews.app',
  'https://app.promptreviews.app',
  'https://www.promptreviews.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
];

// Add any staging/preview domains
if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
}

/**
 * Validates the origin of a request to prevent CSRF attacks
 * Returns true if the request is from an allowed origin
 */
export function isValidOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // For same-origin requests, there might be no origin header
  // In this case, check the referer
  const sourceUrl = origin || referer;
  
  // If no source URL and it's not a browser request, could be a direct API call
  // You may want to handle this differently based on your needs
  if (!sourceUrl) {
    // Log for monitoring
    console.warn('[CSRF] Request with no origin or referer header');
    // For now, we'll allow it but log it
    // In production, you might want to be stricter
    return true;
  }
  
  // Check if the source URL is in our allowed list
  const isAllowed = ALLOWED_ORIGINS.some(allowed => sourceUrl.startsWith(allowed));
  
  // Check for Vercel preview deployments
  if (!isAllowed && sourceUrl.includes('.vercel.app')) {
    return true;
  }
  
  if (!isAllowed) {
    console.error('[CSRF] Blocked request from unauthorized origin:', sourceUrl);
  }
  
  return isAllowed;
}

/**
 * Helper function to check origin and return error response if invalid
 * Use this at the beginning of sensitive API routes
 */
export function requireValidOrigin(request: NextRequest | Request): NextResponse | null {
  if (!isValidOrigin(request)) {
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'unknown';
    
    // Log the attempt for security monitoring
    
    return NextResponse.json(
      { 
        error: 'Forbidden - Invalid origin',
        message: 'This request appears to be coming from an unauthorized source.'
      },
      { 
        status: 403,
        headers: {
          'X-CSRF-Protection': 'blocked'
        }
      }
    );
  }
  
  return null; // Origin is valid, continue with request
}

/**
 * Middleware wrapper for API routes that need CSRF protection
 * Usage: 
 * export async function POST(request: NextRequest) {
 *   return withCSRFProtection(request, async () => {
 *     // Your API logic here
 *   });
 * }
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const errorResponse = requireValidOrigin(request);
  if (errorResponse) {
    return errorResponse;
  }
  
  return handler();
}