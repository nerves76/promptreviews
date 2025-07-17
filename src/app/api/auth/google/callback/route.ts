/**
 * OAuth Callback Route for Google Business Profile
 * Handles the OAuth callback from Google and stores tokens
 * Updated to fix authentication issues and prevent user logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

/**
 * OAuth Callback Route for Google Business Profile
 * Handles the OAuth callback from Google and stores tokens
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔗 OAuth callback started');
    
    // Get cookies properly for Next.js 15
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('📝 OAuth callback parameters:', { 
      hasCode: !!code, 
      hasState: !!state, 
      hasError: !!error,
      error 
    });
    
    // Handle OAuth errors
    if (error) {
      console.log('❌ OAuth error received:', error);
      return NextResponse.redirect(
        new URL('/dashboard/social-posting?error=oauth_denied&message=Access was denied', request.url)
      );
    }
    
    if (!code) {
      console.log('❌ No authorization code received');
      return NextResponse.redirect(
        new URL('/dashboard/social-posting?error=callback_failed&message=No authorization code received', request.url)
      );
    }

    // Parse state to get return URL
    let returnUrl = '/dashboard/social-posting';
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        returnUrl = stateData.returnUrl || '/dashboard/social-posting';
        console.log('🔄 Return URL from state:', returnUrl);
      } catch (e) {
        console.log('⚠️ Failed to parse state:', e);
      }
    }

    // Get current user - use getUser() instead of getSession() for better reliability
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication error in OAuth callback:', authError);
      return NextResponse.redirect(
        new URL(`/auth/sign-in?message=Please sign in to connect Google Business Profile`, request.url)
      );
    }
    
    if (!user) {
      console.log('❌ No user found in OAuth callback');
      return NextResponse.redirect(
        new URL(`/auth/sign-in?message=Please sign in to connect Google Business Profile`, request.url)
      );
    }

    console.log('✅ OAuth callback - User authenticated:', user.id);

    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.log('❌ Missing environment variables:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri
      });
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=callback_failed&message=Missing environment variables`, request.url)
      );
    }

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    console.log('📝 Token exchange parameters:', {
      clientId: clientId.substring(0, 10) + '...',
      redirectUri,
      hasCode: !!code
    });

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

    console.log('📊 Token response status:', tokenResponse.status, tokenResponse.statusText);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('❌ Failed to exchange code for tokens:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorText: errorText.substring(0, 500)
      });
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=callback_failed&message=Failed to exchange code for tokens: ${tokenResponse.statusText}`, request.url)
      );
    }

    const tokens = await tokenResponse.json();
    console.log('✅ OAuth tokens received successfully');

    // Store tokens in database
    console.log('💾 Storing tokens in database...');
    const { error: tokenError } = await supabase
      .from('google_business_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        token_type: tokens.token_type,
        scope: tokens.scope
      });

    if (tokenError) {
      console.error('❌ Error storing tokens:', tokenError);
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=callback_failed&message=Failed to store tokens`, request.url)
      );
    }

    console.log('✅ Google Business Profile tokens stored successfully');

    // Try to fetch business locations (but don't fail if this doesn't work)
    try {
      console.log('🔍 Fetching Google Business Profile accounts...');
      const client = new GoogleBusinessProfileClient({
        credentials: {
          clientId,
          clientSecret,
          redirectUri
        },
        auth: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + (tokens.expires_in * 1000),
          scope: tokens.scope?.split(' ') || []
        }
      });

      const accounts = await client.listAccounts();
      console.log('✅ Found Google Business Profile accounts:', accounts.length);
      
      // Store account information for later use
      if (accounts.length > 0) {
        for (const account of accounts) {
          try {
            const locations = await client.listLocations(account.name);
            console.log(`✅ Found ${locations.length} locations for account ${account.name}`);
            
            // Store locations in database
            for (const location of locations) {
              await supabase
                .from('google_business_locations')
                .upsert({
                  user_id: user.id,
                  location_id: location.name,
                  location_name: location.title || location.name,
                  address: location.address?.formattedAddress,
                  primary_phone: location.phoneNumbers?.primaryPhone,
                  website_uri: location.websiteUri,
                  status: location.verificationStatus || 'UNKNOWN'
                });
            }
          } catch (locationError) {
            console.log('⚠️ Error fetching locations for account:', account.name, locationError);
          }
        }
      }
    } catch (apiError) {
      console.log('⚠️ Error fetching business data (non-critical):', apiError);
      // Don't fail the OAuth flow if API calls fail - the user can still connect
    }

    // Redirect with success message
    console.log('✅ OAuth callback completed successfully');
    return NextResponse.redirect(
      new URL(`${returnUrl}?connected=true&message=Successfully connected Google Business Profile!`, request.url)
    );

  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/social-posting?error=callback_failed&message=Unexpected error during OAuth callback', request.url)
    );
  }
} 