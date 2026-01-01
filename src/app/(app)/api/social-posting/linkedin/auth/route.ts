/**
 * LinkedIn OAuth Authorization Route
 *
 * Initiates the LinkedIn OAuth flow for connecting a user's LinkedIn account
 * to enable social posting functionality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * GET /api/social-posting/linkedin/auth
 *
 * Initiates LinkedIn OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[LinkedIn Auth] Starting OAuth authorization flow');

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[LinkedIn Auth] Authentication failed:', {
        error: userError?.message || 'No user session found'
      });
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: 'You must be logged in to connect LinkedIn'
        },
        { status: 401 }
      );
    }

    // Get account ID from header (set by apiClient for account isolation)
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      console.warn('[LinkedIn Auth] No valid account found for user:', user.id);
      return NextResponse.json(
        {
          error: 'Account not found',
          details: 'No valid account found for this user'
        },
        { status: 403 }
      );
    }

    // Check for required environment variables
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/social-posting/linkedin/callback`;

    if (!clientId) {
      console.error('[LinkedIn Auth] Missing LINKEDIN_CLIENT_ID environment variable');
      return NextResponse.json(
        {
          error: 'Configuration error',
          details: 'LinkedIn integration is not properly configured'
        },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection
    // Include accountId for proper account isolation and nonce for security
    const nonce = crypto.randomBytes(16).toString('hex');
    const stateData = {
      accountId,
      nonce,
      timestamp: Date.now()
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Store state in cookie for validation on callback
    const cookieStore = await cookies();
    cookieStore.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });

    // Build LinkedIn authorization URL
    const scopes = ['openid', 'profile', 'w_member_social'];
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scopes.join(' '));

    console.log('[LinkedIn Auth] Redirecting to LinkedIn authorization:', {
      accountId,
      redirectUri,
      scopes: scopes.join(' ')
    });

    // Return the authorization URL for the client to redirect to
    return NextResponse.json({
      authUrl: authUrl.toString()
    });
  } catch (error) {
    console.error('[LinkedIn Auth] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
