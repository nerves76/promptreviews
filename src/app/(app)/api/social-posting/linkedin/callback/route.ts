/**
 * LinkedIn OAuth Callback Route
 *
 * Handles the callback from LinkedIn OAuth authorization.
 * Exchanges the authorization code for tokens and stores the connection.
 *
 * Flow:
 * 1. Verify state parameter matches (CSRF protection)
 * 2. Extract accountId from state
 * 3. Exchange authorization code for tokens
 * 4. Get LinkedIn profile information
 * 5. Store connection in social_platform_connections table
 * 6. Redirect back to settings page with success/error status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';

// LinkedIn API endpoints
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

interface LinkedInUserInfo {
  sub: string; // LinkedIn member ID
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

/**
 * GET /api/social-posting/linkedin/callback
 *
 * Handles LinkedIn OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('[LinkedIn Callback] Received callback:', {
      hasCode: !!code,
      hasState: !!state,
      error,
      errorDescription
    });

    // Handle OAuth errors from LinkedIn
    if (error) {
      console.error('[LinkedIn Callback] OAuth error from LinkedIn:', {
        error,
        errorDescription
      });
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?linkedin_error=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[LinkedIn Callback] Missing required parameters:', {
        hasCode: !!code,
        hasState: !!state
      });
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=Missing+required+parameters', request.url)
      );
    }

    // Validate state parameter against cookie
    const cookieStore = await cookies();
    const storedState = cookieStore.get('linkedin_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      console.error('[LinkedIn Callback] State mismatch - possible CSRF attack:', {
        storedState: storedState ? 'present' : 'missing',
        receivedState: state ? 'present' : 'missing',
        match: storedState === state
      });
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=Invalid+state+parameter', request.url)
      );
    }

    // Clear the state cookie
    cookieStore.delete('linkedin_oauth_state');

    // Decode state to get accountId
    let stateData: { accountId: string; nonce: string; timestamp: number };
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf-8');
      stateData = JSON.parse(decoded);
    } catch {
      console.error('[LinkedIn Callback] Failed to decode state parameter');
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=Invalid+state+format', request.url)
      );
    }

    // Check state timestamp (expire after 10 minutes)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 10 * 60 * 1000) {
      console.error('[LinkedIn Callback] State expired:', { ageMs: stateAge });
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=Authorization+expired', request.url)
      );
    }

    // Verify user is authenticated
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[LinkedIn Callback] User not authenticated:', userError?.message);
      return NextResponse.redirect(
        new URL('/auth/sign-in?redirect=/dashboard/integrations', request.url)
      );
    }

    // Get environment variables
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/social-posting/linkedin/callback`;

    if (!clientId || !clientSecret) {
      console.error('[LinkedIn Callback] Missing LinkedIn credentials');
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=LinkedIn+integration+not+configured', request.url)
      );
    }

    // Exchange code for tokens
    console.log('[LinkedIn Callback] Exchanging code for tokens...');
    const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[LinkedIn Callback] Token exchange failed:', {
        status: tokenResponse.status,
        error: errorText
      });
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=Failed+to+exchange+authorization+code', request.url)
      );
    }

    const tokens: LinkedInTokenResponse = await tokenResponse.json();
    console.log('[LinkedIn Callback] Token exchange successful:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in
    });

    // Get user profile using OpenID Connect userinfo endpoint
    console.log('[LinkedIn Callback] Fetching user profile...');
    const profileResponse = await fetch(LINKEDIN_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('[LinkedIn Callback] Profile fetch failed:', {
        status: profileResponse.status,
        error: errorText
      });
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=Failed+to+fetch+profile', request.url)
      );
    }

    const profile: LinkedInUserInfo = await profileResponse.json();
    console.log('[LinkedIn Callback] Profile fetched:', {
      sub: profile.sub,
      name: profile.name
    });

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Verify user has access to this account using service role
    const supabaseAdmin = createServiceRoleClient();
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', stateData.accountId)
      .single();

    if (!accountUser) {
      console.error('[LinkedIn Callback] User does not have access to account:', {
        userId: user.id,
        accountId: stateData.accountId
      });
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=You+do+not+have+access+to+this+account', request.url)
      );
    }

    // Store connection in database using service role to bypass RLS
    const { data: connection, error: insertError } = await supabaseAdmin
      .from('social_platform_connections')
      .upsert(
        {
          account_id: stateData.accountId,
          user_id: user.id,
          platform: 'linkedin',
          credentials: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt: expiresAt,
            linkedinId: profile.sub
          },
          metadata: {
            name: profile.name,
            handle: profile.name,
            linkedinId: profile.sub,
            picture: profile.picture || null,
            email: profile.email || null
          },
          status: 'active',
          last_validated_at: new Date().toISOString()
        },
        {
          onConflict: 'account_id,platform',
          ignoreDuplicates: false
        }
      )
      .select('id')
      .single();

    if (insertError) {
      console.error('[LinkedIn Callback] Database error:', insertError);
      return NextResponse.redirect(
        new URL('/dashboard/integrations?linkedin_error=Failed+to+save+connection', request.url)
      );
    }

    console.log('[LinkedIn Callback] Connection saved successfully:', {
      connectionId: connection.id,
      accountId: stateData.accountId,
      profileName: profile.name
    });

    // Redirect back to integrations page with success message
    return NextResponse.redirect(
      new URL('/dashboard/integrations?linkedin=connected', request.url)
    );
  } catch (error) {
    console.error('[LinkedIn Callback] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.redirect(
      new URL('/dashboard/integrations?linkedin_error=An+unexpected+error+occurred', request.url)
    );
  }
}
