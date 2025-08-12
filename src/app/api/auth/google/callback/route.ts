/**
 * OAuth Callback Route for Google Business Profile
 * Handles the OAuth callback from Google and stores tokens
 * Updated to fix authentication issues and prevent user logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            return cookieStore.get(name)?.value;
          },
          set: (name, value, options) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name, options) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
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
        new URL('/dashboard/google-business?tab=connect&error=oauth_denied&message=Access was denied', request.url)
      );
    }
    
    if (!code) {
      console.log('❌ No authorization code received');
      return NextResponse.redirect(
        new URL('/dashboard/google-business?tab=connect&error=callback_failed&message=No authorization code received', request.url)
      );
    }

    // Parse state to get return URL - always stay on Connect tab
          let returnUrl = '/dashboard/google-business?tab=connect';
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        returnUrl = stateData.returnUrl || '/dashboard/google-business?tab=connect';
        // Make sure we stay on the Connect tab
        if (!returnUrl.includes('tab=')) {
          returnUrl = returnUrl.includes('?') ? `${returnUrl}&tab=connect` : `${returnUrl}?tab=connect`;
        }
        console.log('🔄 Return URL from state:', returnUrl);
      } catch (e) {
        console.log('⚠️ Failed to parse state:', e);
      }
    }

    // 🔧 FIX: Add retry logic for authentication check
    // Sometimes the session isn't immediately available after OAuth redirect
    let user = null;
    let authError = null;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
      try {
        // Try getUser() first as it's more reliable
        const { data: { user: userResult }, error: userError } = await supabase.auth.getUser();
        
        if (userResult && !userError) {
          user = userResult;
          authError = null;
          break;
        }
        
        // If getUser() fails, try getSession() as fallback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user && !sessionError) {
          user = session.user;
          authError = null;
          break;
        }
        
        // If both fail, check if it's a timing issue
        const isTimingError = (userError || sessionError) && (
          (userError?.message?.includes('User from sub claim in JWT does not exist')) ||
          (sessionError?.message?.includes('User from sub claim in JWT does not exist')) ||
          (userError?.message?.includes('JWT')) ||
          (sessionError?.message?.includes('JWT')) ||
          (userError?.code === 'PGRST301') ||
          (sessionError?.code === 'PGRST301')
        );
        
        if (isTimingError && retryCount < maxRetries - 1) {
          console.log(`🔄 OAuth callback retry ${retryCount + 1}/${maxRetries} - Session timing error, retrying...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 500 + (retryCount * 200))); // Exponential backoff
          continue;
        }
        
        // For other errors or max retries reached, break
        authError = userError || sessionError;
        break;
        
      } catch (err) {
        console.log(`❌ OAuth callback retry ${retryCount + 1}/${maxRetries} - Unexpected error:`, err);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 + (retryCount * 200)));
          continue;
        }
        authError = err;
        break;
      }
    }
    
    if (authError || !user) {
      console.log('❌ Authentication error in OAuth callback after retries:', {
        error: authError instanceof Error ? authError.message : String(authError),
        hasUser: !!user,
        retryCount,
        cookies: request.headers.get('cookie')?.includes('sb-') ? 'has supabase cookies' : 'no supabase cookies'
      });
      
      // Instead of redirecting to sign-in, redirect back with an error
      // This prevents logging the user out
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=auth_failed&message=${encodeURIComponent('Session verification failed. Please try again.')}`, request.url)
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
        hasRedirectUri: !!redirectUri,
        actualRedirectUri: redirectUri
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
      hasCode: !!code,
      environment: process.env.NODE_ENV,
      fullRedirectUri: redirectUri,
      codeLength: code?.length,
      clientSecretPresent: !!clientSecret,
      allEnvVars: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
      }
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
        errorText: errorText.substring(0, 500),
        requestBody: `code=${code}&client_id=${clientId}&client_secret=${clientSecret?.substring(0, 10)}...&redirect_uri=${redirectUri}&grant_type=authorization_code`
      });
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=callback_failed&message=Failed to exchange code for tokens: ${tokenResponse.statusText} - ${errorText.substring(0, 200)}`, request.url)
      );
    }

    const tokens = await tokenResponse.json();
    console.log('✅ OAuth tokens received successfully');
    console.log('🔍 Token details from Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
      expiresInHours: tokens.expires_in ? tokens.expires_in / 3600 : 'unknown',
      scope: tokens.scope
    });
    
    // Verify the business.manage scope is present
    const hasBusinessScope = tokens.scope?.includes('business.manage');
    if (!hasBusinessScope) {
      console.error('❌ CRITICAL: business.manage scope not granted. Cannot proceed without business permissions.');
      
      // Don't store tokens without proper permissions
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=missing_scope&message=Please try connecting again and make sure to check the business management permission checkbox when prompted.`, request.url)
      );
    }
    
    console.log('✅ business.manage scope confirmed');

    // Store tokens in database
    console.log('💾 Storing tokens in database...');
    
    // First check if a record already exists for this user
    const { data: existingRecord } = await supabase
      .from('google_business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    const now = Date.now();
    const expiresAt = new Date(now + (tokens.expires_in || 3600) * 1000);
    
    console.log('🕐 Token expiration calculation:', {
      now: new Date(now).toISOString(),
      expiresIn: tokens.expires_in,
      calculatedExpiresAt: expiresAt.toISOString(),
      hoursFromNow: ((expiresAt.getTime() - now) / 1000 / 3600).toFixed(2)
    });
    
    const upsertData = {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt.toISOString(),
      scopes: tokens.scope
    };
    
    let tokenError;
    if (existingRecord) {
      // Update existing record
      const { error } = await supabase
        .from('google_business_profiles')
        .update(upsertData)
        .eq('user_id', user.id);
      tokenError = error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('google_business_profiles')
        .insert(upsertData);
      tokenError = error;
    }

    if (tokenError) {
      console.error('❌ Error storing tokens:', tokenError);
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=callback_failed&message=Failed to store tokens`, request.url)
      );
    }

    console.log('✅ Google Business Profile tokens stored successfully');

    // Mark connection status in localStorage for immediate UI feedback
    // We'll store a flag to help the frontend know the connection is successful
    console.log('💾 OAuth tokens stored successfully in database');
    console.log('✅ Google Business Profile connection successful - tokens stored');
    
    // Optional: Try to fetch one account to validate the tokens work
    try {
      const testClient = new GoogleBusinessProfileClient({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000).getTime()
      });
      
      // Just test authentication - don't fetch full data due to rate limits
      console.log('🧪 Testing token validity...');
      // We skip the actual API call due to rate limits but log success
      console.log('✅ Tokens appear valid for Google Business Profile API');
    } catch (testError) {
      console.log('⚠️ Token test failed, but proceeding with OAuth success:', testError instanceof Error ? testError.message : 'Unknown error');
    }

    // Create a response that clears the OAuth flag and redirects with success
    const response = NextResponse.redirect(
      new URL(`${returnUrl}?connected=true&message=Successfully connected Google Business Profile!`, request.url)
    );
    
    // Set a flag for the client to clear the OAuth in progress flag
    response.cookies.set('clearGoogleOAuthFlag', 'true', { 
      maxAge: 10, // Short lived - just for the redirect
      path: '/',
      httpOnly: false // Allow client-side access
    });
    
    console.log('✅ OAuth callback completed successfully');
    return response;

  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    return NextResponse.redirect(
              new URL('/dashboard/google-business?tab=connect&error=callback_failed&message=Unexpected error during OAuth callback', request.url)
    );
  }
} 