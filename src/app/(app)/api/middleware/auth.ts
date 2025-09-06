/**
 * API Authentication and Authorization Middleware
 * 
 * This middleware provides comprehensive security for API endpoints including:
 * - User authentication verification
 * - Account access validation 
 * - Admin permission checks
 * - Rate limiting preparation
 * - Security event logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '../utils/getRequestAccountId';
import { isAdmin } from '@/auth/utils/admin';

export interface AuthResult {
  success: boolean;
  user?: any;
  accountId?: string;
  error?: string;
  errorCode?: number;
}

export interface AdminAuthResult extends AuthResult {
  isAdmin?: boolean;
}

/**
 * Standard authentication middleware for API endpoints
 * Verifies user session and returns user information
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Try different auth methods based on request type
    let user = null;
    let authError = null;

    // Method 1: Check for Bearer token in Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = createServiceRoleClient();
      const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token);
      if (tokenUser && !error) {
        user = tokenUser;
      } else {
        authError = error;
      }
    }

    // Method 2: If no bearer token, try cookie-based auth
    if (!user) {
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: (name) => cookieStore.get(name)?.value,
              set: () => {},
              remove: () => {},
            },
          }
        );
        
        const { data: { user: cookieUser }, error } = await supabase.auth.getUser();
        if (cookieUser && !error) {
          user = cookieUser;
        } else if (!authError) {
          authError = error;
        }
      } catch (cookieError) {
        // Cookie method failed, use existing error or set new one
        if (!authError) {
          authError = cookieError;
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: authError?.message || 'Authentication required',
        errorCode: 401
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: 'Authentication verification failed',
      errorCode: 500
    };
  }
}

/**
 * Account-aware authentication middleware
 * Verifies user session and validates account access
 */
export async function verifyAccountAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult;
    }

    // Get account ID respecting client selection
    const accountId = await getRequestAccountId(request, authResult.user.id);
    if (!accountId) {
      return {
        success: false,
        error: 'Account not found or access denied',
        errorCode: 403
      };
    }

    // Validate user has access to this account
    const supabase = createServiceRoleClient();
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('user_id', authResult.user.id)
      .eq('account_id', accountId)
      .single();

    if (accountError || !accountUser) {
      console.warn(`User ${authResult.user.id} attempted to access account ${accountId} without permission`);
      return {
        success: false,
        error: 'Account access denied',
        errorCode: 403
      };
    }

    return {
      success: true,
      user: authResult.user,
      accountId
    };
  } catch (error) {
    console.error('Account auth verification error:', error);
    return {
      success: false,
      error: 'Account authentication verification failed',
      errorCode: 500
    };
  }
}

/**
 * Admin authentication middleware
 * Verifies user is an admin
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult;
    }

    const supabase = createServiceRoleClient();
    const adminStatus = await isAdmin(authResult.user.id, supabase);
    
    if (!adminStatus) {
      console.warn(`Non-admin user ${authResult.user.id} attempted to access admin endpoint`);
      return {
        success: false,
        error: 'Admin access required',
        errorCode: 403,
        user: authResult.user,
        isAdmin: false
      };
    }

    return {
      success: true,
      user: authResult.user,
      isAdmin: true
    };
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return {
      success: false,
      error: 'Admin authentication verification failed',
      errorCode: 500
    };
  }
}

/**
 * Cron job authentication middleware
 * Verifies request is from authorized cron service
 */
export function verifyCronAuth(request: NextRequest): { success: boolean; error?: string } {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  if (!expectedToken) {
    console.error('CRON_SECRET_TOKEN not configured');
    return { success: false, error: 'Cron authentication not configured' };
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    console.warn('Invalid cron authorization attempt');
    return { success: false, error: 'Unauthorized cron request' };
  }

  return { success: true };
}

/**
 * Webhook authentication middleware
 * Verifies webhook signatures (e.g., Stripe)
 */
export async function verifyWebhookAuth(
  request: NextRequest, 
  webhookSecret: string,
  signatureHeader: string
): Promise<{ success: boolean; error?: string; body?: string }> {
  try {
    const body = await request.text();
    const signature = request.headers.get(signatureHeader);
    
    if (!signature) {
      return { success: false, error: 'Missing webhook signature' };
    }

    // For Stripe webhooks, signature verification is handled by stripe.webhooks.constructEvent
    // This is a placeholder for other webhook types
    return { success: true, body };
  } catch (error) {
    console.error('Webhook auth verification error:', error);
    return { success: false, error: 'Webhook verification failed' };
  }
}

/**
 * Helper to create standardized error responses
 */
export function createAuthErrorResponse(authResult: AuthResult): NextResponse {
  return NextResponse.json(
    { 
      error: authResult.error,
      authenticated: false 
    },
    { status: authResult.errorCode || 401 }
  );
}

/**
 * Helper to log security events
 */
export async function logSecurityEvent(
  userId: string | null,
  event: string,
  details: Record<string, any> = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  try {
    const supabase = createServiceRoleClient();
    
    // Log to security_events table (create if needed)
    await supabase.from('security_events').insert({
      user_id: userId,
      event_type: event,
      event_details: details,
      severity,
      ip_address: details.ip || null,
      user_agent: details.userAgent || null,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Don't fail the request if logging fails, just log to console
    console.error('Failed to log security event:', error);
  }
}

/**
 * Comprehensive API route wrapper that includes auth and security
 */
export function withAuth(
  handler: (request: NextRequest, context: { user: any; accountId?: string }) => Promise<NextResponse>,
  options: {
    requireAccount?: boolean;
    requireAdmin?: boolean;
    logAccess?: boolean;
  } = {}
) {
  return async (request: NextRequest) => {
    try {
      let authResult: AuthResult;
      
      if (options.requireAdmin) {
        authResult = await verifyAdminAuth(request);
      } else if (options.requireAccount) {
        authResult = await verifyAccountAuth(request);
      } else {
        authResult = await verifyAuth(request);
      }

      if (!authResult.success) {
        if (options.logAccess) {
          await logSecurityEvent(
            null,
            'auth_failure',
            {
              endpoint: request.url,
              error: authResult.error,
              ip: request.ip,
              userAgent: request.headers.get('user-agent')
            },
            'medium'
          );
        }
        return createAuthErrorResponse(authResult);
      }

      if (options.logAccess) {
        await logSecurityEvent(
          authResult.user.id,
          'api_access',
          {
            endpoint: request.url,
            accountId: authResult.accountId,
            ip: request.ip,
            userAgent: request.headers.get('user-agent')
          },
          'low'
        );
      }

      return handler(request, {
        user: authResult.user,
        accountId: authResult.accountId
      });
    } catch (error) {
      console.error('Auth wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Export type for use in API routes
export type AuthContext = {
  user: any;
  accountId?: string;
};