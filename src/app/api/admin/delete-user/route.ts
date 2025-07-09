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
import { createClient } from '@supabase/supabase-js';
import { deleteUserCompletely } from '@/utils/adminDelete';
import { isAdmin } from '@/utils/admin';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Check if the requesting user has admin privileges
 * @param request - The incoming request
 * @returns Promise resolving to admin status
 */
async function checkAdminPrivileges(request: NextRequest): Promise<boolean> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user info
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return false;
    }

    // Check if user has admin privileges
    const adminStatus = await isAdmin(user.id, supabaseAdmin);
    if (!adminStatus) {
      console.error('Admin check failed: user does not have admin privileges');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking admin privileges:', error);
    return false;
  }
}

/**
 * POST handler for admin user deletion
 * @param request - The incoming request
 * @returns NextResponse with deletion result
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin privileges
    const isAdmin = await checkAdminPrivileges(request);
    if (!isAdmin) {
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`Admin ${checkOnly ? 'check' : 'delete'} request for email: ${email}`);

    // If checkOnly is true, just verify the user exists
    if (checkOnly) {
      const { getUserIdByEmail } = await import('@/utils/adminDelete');
      const userId = await getUserIdByEmail(email);
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'User found',
        userId: userId
      });
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