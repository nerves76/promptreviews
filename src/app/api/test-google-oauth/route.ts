import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify Google OAuth configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      return NextResponse.json({
        success: false,
        error: `OAuth error: ${error}`,
        description: 'The OAuth flow failed'
      });
    }

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'No authorization code received',
        description: 'The OAuth flow did not return an authorization code'
      });
    }

    // Test token exchange
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return NextResponse.json({
          success: false,
          error: `Token exchange failed: ${tokenResponse.status}`,
          details: errorText,
          description: 'Failed to exchange authorization code for tokens'
        });
      }

      const tokens = await tokenResponse.json();

      return NextResponse.json({
        success: true,
        message: 'OAuth flow completed successfully',
        tokens: {
          access_token: tokens.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'missing',
          refresh_token: tokens.refresh_token ? 'present' : 'missing',
          expires_in: tokens.expires_in,
          token_type: tokens.token_type,
          scope: tokens.scope
        },
        description: 'Successfully exchanged authorization code for tokens'
      });

    } catch (tokenError) {
      return NextResponse.json({
        success: false,
        error: 'Token exchange error',
        details: tokenError instanceof Error ? tokenError.message : 'Unknown error',
        description: 'Error occurred during token exchange'
      });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      description: 'Unexpected error occurred'
    }, { status: 500 });
  }
} 