/**
 * API Route: POST /api/auth/google/refresh-tokens
 * Server-side token refresh for Google Business Profile
 *
 * SECURITY: Tokens are never returned to the client. The route:
 *   1. Looks up the account's encrypted tokens from the database
 *   2. Decrypts the refresh token
 *   3. Exchanges it with Google for a new access token
 *   4. Encrypts and stores the new access token (+ rotated refresh token if provided)
 *   5. Returns only { success, expiresIn } to the caller
 *
 * ERROR CODES returned to clients:
 *   - TOKEN_EXPIRED  — refresh token revoked/expired, user must re-authenticate
 *   - REFRESH_FAILED — temporary Google-side failure, caller may retry later
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { encryptGbpToken, decryptGbpToken } from '@/lib/crypto/gbpTokenHelpers';

/** Max number of retry attempts for the Google token exchange */
const MAX_RETRIES = 1;
/** Delay between retries in milliseconds */
const RETRY_DELAY_MS = 1000;

/**
 * Calls Google's OAuth2 token endpoint to exchange a refresh token for a new access token.
 * Returns the parsed JSON body and the HTTP status.
 */
async function exchangeRefreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ data: Record<string, any>; status: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return { data, status: response.status };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept accountId as the primary lookup key.
    // Also accept refreshToken for backward compatibility during migration,
    // but it is no longer returned in the response.
    const { accountId, refreshToken: legacyRefreshToken } = body;

    if (!accountId && !legacyRefreshToken) {
      return NextResponse.json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Account ID is required',
        requiresReauth: true
      }, { status: 400 });
    }

    // Create service client to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Look up the GBP profile by accountId (preferred) or legacy refresh token
    let tokenData: {
      user_id: string;
      account_id: string;
      access_token: string;
      refresh_token: string;
      expires_at: string;
    } | null = null;

    if (accountId) {
      const { data, error } = await supabase
        .from('google_business_profiles')
        .select('user_id, account_id, access_token, refresh_token, expires_at')
        .eq('account_id', accountId)
        .single();

      if (error || !data) {
        return NextResponse.json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'No Google Business Profile found for this account',
          requiresReauth: true
        }, { status: 401 });
      }
      tokenData = data;
    } else {
      // Legacy path: look up by refresh token value.
      // This handles both plain-text tokens (pre-encryption migration)
      // and is a fallback for older client code.
      const { data, error } = await supabase
        .from('google_business_profiles')
        .select('user_id, account_id, access_token, refresh_token, expires_at')
        .eq('refresh_token', legacyRefreshToken)
        .single();

      if (error || !data) {
        return NextResponse.json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Invalid refresh token',
          requiresReauth: true
        }, { status: 401 });
      }
      tokenData = data;
    }

    // Decrypt the refresh token from the database
    const decryptedRefreshToken = decryptGbpToken(tokenData.refresh_token);

    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth environment variables');
      return NextResponse.json({
        success: false,
        error: 'REFRESH_FAILED',
        message: 'Server configuration error'
      }, { status: 500 });
    }

    // Exchange refresh token for new access token — with retry
    let lastResult: { data: Record<string, any>; status: number } | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        console.warn(`[refresh-tokens] Retrying Google token exchange (attempt ${attempt + 1})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }

      lastResult = await exchangeRefreshToken(decryptedRefreshToken, clientId, clientSecret);

      // Success — break out of retry loop
      if (lastResult.status >= 200 && lastResult.status < 300) {
        break;
      }

      // Non-retryable errors: invalid_grant means the token is permanently revoked
      if (lastResult.data.error === 'invalid_grant') {
        console.error('[refresh-tokens] Token permanently revoked (invalid_grant):', {
          accountId: tokenData.account_id,
          errorDescription: lastResult.data.error_description,
        });
        return NextResponse.json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Google refresh token has been revoked or expired. Please reconnect your Google account.',
          requiresReauth: true
        }, { status: 401 });
      }

      // Log the failed attempt
      console.error(`[refresh-tokens] Google token exchange failed (attempt ${attempt + 1}):`, {
        status: lastResult.status,
        error: lastResult.data.error,
        errorDescription: lastResult.data.error_description,
        accountId: tokenData.account_id,
      });
    }

    // After all retries exhausted, check if we succeeded
    if (!lastResult || lastResult.status < 200 || lastResult.status >= 300) {
      console.error('[refresh-tokens] Token refresh failed after all retries:', {
        accountId: tokenData.account_id,
        lastStatus: lastResult?.status,
        lastError: lastResult?.data?.error,
      });

      return NextResponse.json({
        success: false,
        error: 'REFRESH_FAILED',
        message: `Token refresh failed: ${lastResult?.data?.error_description || lastResult?.data?.error || 'Unknown error'}. Please try again later.`,
        requiresReauth: false
      }, { status: 502 });
    }

    const refreshData = lastResult.data;

    // Build the database update payload
    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
    const updatePayload: Record<string, string> = {
      access_token: encryptGbpToken(refreshData.access_token),
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    };

    // Token rotation: if Google returns a new refresh_token, encrypt and save it
    if (refreshData.refresh_token) {
      console.log('[refresh-tokens] Google returned a rotated refresh token — saving it.');
      updatePayload.refresh_token = encryptGbpToken(refreshData.refresh_token);
    }

    const { error: updateError } = await supabase
      .from('google_business_profiles')
      .update(updatePayload)
      .eq('account_id', tokenData.account_id);

    if (updateError) {
      console.error('Failed to update tokens in database:', updateError);
      return NextResponse.json({
        success: false,
        error: 'REFRESH_FAILED',
        message: 'Failed to save refreshed tokens'
      }, { status: 500 });
    }

    // SECURITY: Return only success status and expiry — never raw tokens
    return NextResponse.json({
      success: true,
      expiresIn: refreshData.expires_in,
      message: 'Tokens refreshed successfully'
    });

  } catch (error) {
    console.error('Error in refresh-tokens API:', error);
    return NextResponse.json({
      success: false,
      error: 'REFRESH_FAILED',
      message: 'Internal server error during token refresh'
    }, { status: 500 });
  }
}
