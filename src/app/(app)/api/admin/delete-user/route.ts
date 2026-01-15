/**
 * Admin Delete User API Route
 *
 * This endpoint provides admin functionality to completely delete a user and all
 * associated data from the system. It requires admin privileges and performs
 * comprehensive cleanup across all database tables.
 *
 * Security: This endpoint should only be accessible to authenticated admins.
 * Method: POST
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { deleteUserCompletely } from '@/utils/adminDelete';
import { isAdmin as checkIsAdmin } from '@/auth/utils/admin';
import { withRateLimit, RateLimits } from '@/app/(app)/api/middleware/rate-limit';

// Initialize Supabase admin client
const supabaseAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Extracts user information from the request for rate limiting and admin checks.
 * @param request - The incoming request
 * @returns Promise resolving to the user's ID, or undefined if auth fails.
 */
async function getUserInfo(request: NextRequest): Promise<{ userId?: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {};
  }
  const token = authHeader.substring(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return { userId: user?.id };
}

/**
 * Main handler for the admin user deletion logic.
 * Rate limiting is handled by the withRateLimit wrapper.
 */
async function handler(request: NextRequest) {
  try {
    // Check admin privileges
    const { userId } = await getUserInfo(request);
    if (!userId || !(await checkIsAdmin(userId, supabaseAdmin))) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, checkOnly } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required and must be a string' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // If checkOnly is true, just verify the user exists
    if (checkOnly) {
      const { getUserIdByEmail } = await import('@/utils/adminDelete');
      const userIdFound = await getUserIdByEmail(email);
      if (!userIdFound) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'User found', userId: userIdFound });
    }

    // Perform comprehensive user deletion
    const result = await deleteUserCompletely(email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        details: result.details
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message,
        details: result.details
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in admin delete user endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during user deletion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Wrap the handler with rate limiting middleware
export const POST = withRateLimit(handler, RateLimits.adminStrict, getUserInfo);


/**
 * GET handler for endpoint information (optional)
 * @returns NextResponse with endpoint information
 */
export async function GET() {
  return NextResponse.json({
    message: 'Admin Delete User API',
    description: 'POST endpoint for comprehensive user deletion',
    required: {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer <admin_jwt_token>',
        'Content-Type': 'application/json'
      },
      body: {
        email: 'string (required)'
      }
    },
    security: 'Admin privileges required'
  });
} 