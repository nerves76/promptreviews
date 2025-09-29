/**
 * OAuth Callback Route for Google Business Profile in Embed Context
 * Handles the OAuth callback from Google and stores tokens for the embed session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession, createLead, createSession } from '@/lib/services/optimizerLeadService';
import { encryptAndPackToken } from '@/lib/crypto/googleTokenCipher';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const embedUrl = new URL('/embed/google-business-optimizer', request.url);
      embedUrl.searchParams.set('error', 'oauth_denied');
      embedUrl.searchParams.set('message', 'Google authentication was cancelled');
      return NextResponse.redirect(embedUrl);
    }

    if (!code) {
      const embedUrl = new URL('/embed/google-business-optimizer', request.url);
      embedUrl.searchParams.set('error', 'no_code');
      embedUrl.searchParams.set('message', 'No authorization code received');
      return NextResponse.redirect(embedUrl);
    }

    // Parse state to get session info and tracking parameters
    let sessionToken = '';
    let leadId = '';
    let sessionData: any = null;
    let trackingData: any = {};

    try {
      const stateData = JSON.parse(decodeURIComponent(state || '{}'));
      sessionToken = stateData.sessionToken;
      leadId = stateData.leadId;

      // Extract tracking parameters and embed context
      if (stateData.tracking) {
        trackingData = {
          source: stateData.tracking.source,
          embedUrl: stateData.tracking.embedUrl,
          embedDomain: stateData.tracking.embedDomain,
          embedPath: stateData.tracking.embedPath,
          utmSource: stateData.tracking.utmSource,
          utmMedium: stateData.tracking.utmMedium,
          utmCampaign: stateData.tracking.utmCampaign
        };
        console.log('🎯 Tracking parameters from OAuth state:', trackingData);
        console.log('📍 Embed context:', {
          url: trackingData.embedUrl,
          domain: trackingData.embedDomain,
          path: trackingData.embedPath
        });
      }
    } catch (e) {
      console.error('Failed to parse OAuth state:', e);
    }

    // Validate the session token if provided
    if (sessionToken) {
      try {
        sessionData = await validateSession(sessionToken);
      } catch (e) {
        console.log('Session validation failed, will create new session after OAuth');
        // Don't fail - we'll create a new session after getting Google data
      }
    }

    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // Use the main redirect URI since it's registered with Google
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      const embedUrl = new URL('/embed/google-business-optimizer', request.url);
      embedUrl.searchParams.set('error', 'config_error');
      embedUrl.searchParams.set('message', 'OAuth configuration missing');
      return NextResponse.redirect(embedUrl);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      const embedUrl = new URL('/embed/google-business-optimizer', request.url);
      embedUrl.searchParams.set('error', 'token_exchange_failed');
      embedUrl.searchParams.set('message', 'Failed to complete Google authentication');
      return NextResponse.redirect(embedUrl);
    }

    const tokens = await tokenResponse.json();

    // Verify the business.manage scope is present
    const hasBusinessScope = tokens.scope?.includes('business.manage');
    if (!hasBusinessScope) {
      const embedUrl = new URL('/embed/google-business-optimizer', request.url);
      embedUrl.searchParams.set('error', 'missing_scope');
      embedUrl.searchParams.set('message', 'Please grant business management permissions');
      return NextResponse.redirect(embedUrl);
    }

    // Fetch Google account info to get the email and business name
    let googleEmail = null;
    let businessName = null;
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        googleEmail = userInfo.email;
      }

      // Try to fetch business accounts
      const accountsResponse = await fetch(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        if (accountsData.accounts && accountsData.accounts.length > 0) {
          // Get the first account's locations
          const accountName = accountsData.accounts[0].name;
          const locationsResponse = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
            {
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
              }
            }
          );

          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json();
            if (locationsData.locations && locationsData.locations.length > 0) {
              businessName = locationsData.locations[0].title;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Google account info:', error);
      // Continue without email - not critical
    }

    // If we don't have a session yet, create lead and session from Google data
    if (!sessionData) {
      if (!googleEmail) {
        const embedUrl = new URL('/embed/google-business-optimizer', request.url);
        embedUrl.searchParams.set('error', 'no_email');
        embedUrl.searchParams.set('message', 'Could not retrieve email from Google account');
        return NextResponse.redirect(embedUrl);
      }

      // Create lead from Google data with tracking parameters and embed context
      const lead = await createLead({
        email: googleEmail,
        business_name: businessName,
        google_account_email: googleEmail,
        sourceBusiness: trackingData.source || 'google-business-optimizer-embed',
        sourceDomain: trackingData.embedDomain || request.headers.get('origin') || request.headers.get('referer') || undefined,
        utmSource: trackingData.utmSource,
        utmMedium: trackingData.utmMedium,
        utmCampaign: trackingData.utmCampaign,
        referrerUrl: trackingData.embedUrl, // Store the full embed URL
        additionalData: {
          embedPath: trackingData.embedPath,
          autoDetected: true
        }
      });

      leadId = lead.id;

      // Create session for the lead
      const session = await createSession({
        leadId: lead.id,
        email: googleEmail,
        scope: {
          googleConnected: true,
          businessName,
        }
      });

      sessionToken = session.token;
      sessionData = { sessionId: session.sessionId };
    }

    // Store tokens and business info in the optimizer_sessions table
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Calculate token expiry
    const now = Date.now();
    const expiresAt = new Date(now + (tokens.expires_in || 3600) * 1000);

    // Encrypt tokens before storing
    let encryptedAccessToken: string | null = null;
    let encryptedRefreshToken: string | null = null;

    try {
      if (process.env.GOOGLE_TOKEN_ENCRYPTION_KEY) {
        encryptedAccessToken = encryptAndPackToken(tokens.access_token);
        if (tokens.refresh_token) {
          encryptedRefreshToken = encryptAndPackToken(tokens.refresh_token);
        }
      } else {
        console.warn('⚠️ GOOGLE_TOKEN_ENCRYPTION_KEY not set - storing tokens without encryption (dev only)');
        // For development only - store tokens unencrypted
        encryptedAccessToken = tokens.access_token;
        encryptedRefreshToken = tokens.refresh_token;
      }
    } catch (encryptError) {
      console.error('Failed to encrypt tokens:', encryptError);
      const embedUrl = new URL('/embed/google-business-optimizer', request.url);
      embedUrl.searchParams.set('error', 'encryption_failed');
      embedUrl.searchParams.set('message', 'Failed to secure authentication data');
      return NextResponse.redirect(embedUrl);
    }

    // Update the session with encrypted Google tokens and business info
    const { error: updateError } = await supabaseAdmin
      .from('optimizer_sessions')
      .update({
        google_access_token_cipher: encryptedAccessToken,
        google_refresh_token_cipher: encryptedRefreshToken,
        google_token_key_version: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ? 'v1' : null,
        google_token_expires_at: expiresAt.toISOString(),
        session_scope: {
          googleConnected: true,
          googleEmail,
          businessName,
        }
      })
      .eq('id', sessionData.sessionId);

    if (updateError) {
      console.error('Failed to update session with Google tokens:', updateError);
    }

    // Update the lead with business info
    if (leadId && businessName) {
      await supabaseAdmin
        .from('optimizer_leads')
        .update({
          business_name: businessName,
          google_account_email: googleEmail,
        })
        .eq('id', leadId);
    }

    // Redirect back to embed with success
    // Remove any existing query params from the base URL to ensure clean redirect
    const baseUrl = new URL(request.url);
    baseUrl.pathname = '/embed/google-business-optimizer';
    baseUrl.search = ''; // Clear all query params

    const embedUrl = new URL(baseUrl);
    embedUrl.searchParams.set('token', sessionToken);
    embedUrl.searchParams.set('connected', 'true');
    embedUrl.searchParams.set('message', 'Successfully connected Google Business Profile');

    return NextResponse.redirect(embedUrl);

  } catch (error) {
    console.error('Error in OAuth callback for embed:', error);
    const embedUrl = new URL('/embed/google-business-optimizer', request.url);
    embedUrl.searchParams.set('error', 'callback_failed');
    embedUrl.searchParams.set('message', 'Unexpected error during authentication');
    return NextResponse.redirect(embedUrl);
  }
}