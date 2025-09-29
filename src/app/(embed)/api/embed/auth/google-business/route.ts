/**
 * Google OAuth Initiation Route for Optimizer Embed
 * Starts the OAuth flow for connecting Google Business Profile in the embed context
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔐 Starting embed Google OAuth flow with account selector');
  try {
    const { searchParams } = new URL(request.url);
    let sessionToken = searchParams.get('token');
    let leadId = searchParams.get('leadId');

    // Capture tracking parameters and embed context
    const source = searchParams.get('source');
    const embedUrl = searchParams.get('embed_url');
    const embedDomain = searchParams.get('embed_domain');
    const embedPath = searchParams.get('embed_path');
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    // Session token is optional - we'll get lead info from Google OAuth

    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    // Use the main redirect URI since it's registered with Google
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // Prepare OAuth state with embed context and tracking params
    const state = encodeURIComponent(JSON.stringify({
      embed: true,
      sessionToken,
      leadId,
      returnUrl: '/embed/google-business-optimizer',
      tracking: {
        source,
        embedUrl,
        embedDomain,
        embedPath,
        utmSource,
        utmMedium,
        utmCampaign
      }
    }));

    // Google OAuth scopes needed for Business Profile API
    // Use the correct scope - business.manage gives full access to business accounts
    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/business.manage openid email profile'
    );

    // Build OAuth URL - force account selection to ensure user picks the right Google account
    // CRITICAL: User must select the Google account that has access to all 9 business profiles
    // Add max_auth_age=0 to force re-authentication
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=select_account%20consent&` +
      `include_granted_scopes=false&` +
      `max_auth_age=0&` +
      `state=${state}`;

    console.log('🔗 OAuth URL being used:', googleAuthUrl);
    console.log('📋 OAuth prompt parameter: select_account consent (should force account selector)');

    // Redirect to Google OAuth
    return NextResponse.redirect(googleAuthUrl);

  } catch (error) {
    console.error('Error initiating Google OAuth for embed:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}