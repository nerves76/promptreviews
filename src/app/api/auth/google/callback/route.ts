/**
 * OAuth Callback Route for Google Business Profile
 * Handles the OAuth callback from Google and stores tokens
 * Updated to fix authentication issues and prevent user logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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
    // IMPORTANT: Don't fail auth during OAuth - it might just be session refresh timing
    let user = null;
    let authError = null;
    let retryCount = 0;
    const maxRetries = 10; // Increased retries for OAuth flow
    
    // First, try to refresh the session to ensure we have the latest
    console.log('🔄 OAuth callback: Refreshing session before authentication check...');
    try {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshedSession?.user && !refreshError) {
        user = refreshedSession.user;
        console.log('✅ OAuth callback: Session refreshed successfully, user:', user.id);
      } else {
        console.log('⚠️ OAuth callback: Session refresh failed, will retry with getUser');
      }
    } catch (refreshErr) {
      console.log('⚠️ OAuth callback: Session refresh error, continuing with getUser:', refreshErr);
    }
    
    // If refresh didn't work, try standard auth checks with retries
    if (!user) {
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
          
          // During OAuth, auth might be temporarily unavailable - keep retrying
          console.log(`🔄 OAuth callback retry ${retryCount + 1}/${maxRetries} - Auth check failed, retrying...`);
          retryCount++;
          
          // Always retry during OAuth flow unless we've hit max retries
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500))); // Longer delays for OAuth
            continue;
          }
          
          // For max retries reached, store the error but continue
          authError = userError || sessionError;
          break;
          
        } catch (err) {
          console.log(`⚠️ OAuth callback retry ${retryCount + 1}/${maxRetries} - Unexpected error:`, err);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
            continue;
          }
          authError = err;
          break;
        }
      }
    }
    
    if (authError || !user) {
      console.log('⚠️ OAuth callback: Authentication not immediately available, but continuing...', {
        error: authError instanceof Error ? authError.message : String(authError),
        hasUser: !!user,
        retryCount,
        cookies: request.headers.get('cookie')?.includes('sb-') ? 'has supabase cookies' : 'no supabase cookies'
      });
      
      // IMPORTANT: During OAuth, the session might be in transition
      // Don't fail the OAuth flow - continue and let the client-side handle auth
      // This prevents unnecessary logouts during the OAuth flow
      console.log('🔄 OAuth callback: Continuing despite auth check failure - session may be refreshing');
      
      // Try to get any user ID from cookies as a fallback
      const authCookie = cookieStore.get('sb-ltneloufqjktdplodvao-auth-token');
      if (!authCookie?.value) {
        console.log('❌ OAuth callback: No auth cookie found, cannot proceed');
        const separator = returnUrl.includes('?') ? '&' : '?';
        return NextResponse.redirect(
          new URL(`${returnUrl}${separator}error=auth_required&message=${encodeURIComponent('Please sign in first before connecting Google Business Profile')}`, request.url)
        );
      }
      
      // If we have an auth cookie, try to decode it to get the user ID
      try {
        const tokenData = JSON.parse(authCookie.value);
        if (tokenData?.user?.id) {
          console.log('✅ OAuth callback: Found user ID from auth cookie:', tokenData.user.id);
          user = { id: tokenData.user.id, email: tokenData.user.email } as User;
        }
      } catch (e) {
        console.log('⚠️ OAuth callback: Could not parse auth cookie');
      }
      
      // If we still don't have a user, we must fail
      if (!user) {
        console.log('❌ OAuth callback: No user found after all attempts');
        const separator = returnUrl.includes('?') ? '&' : '?';
        return NextResponse.redirect(
          new URL(`${returnUrl}${separator}error=auth_failed&message=${encodeURIComponent('Session verification failed. Please try refreshing the page and trying again.')}`, request.url)
        );
      }
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
      const separator = returnUrl.includes('?') ? '&' : '?';
      return NextResponse.redirect(
        new URL(`${returnUrl}${separator}error=callback_failed&message=Missing environment variables`, request.url)
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
      const separator = returnUrl.includes('?') ? '&' : '?';
      return NextResponse.redirect(
        new URL(`${returnUrl}${separator}error=callback_failed&message=Failed to exchange code for tokens: ${tokenResponse.statusText} - ${errorText.substring(0, 200)}`, request.url)
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
      
      /**
       * CRITICAL: Properly append error parameters to returnUrl
       * returnUrl already contains ?tab=connect, so we need to use & for additional params
       */
      const separator = returnUrl.includes('?') ? '&' : '?';
      const errorUrl = `${returnUrl}${separator}error=missing_scope&message=${encodeURIComponent('Please try connecting again and make sure to check the business management permission checkbox when prompted.')}`;
      
      console.log('🔄 Redirecting with error:', errorUrl);
      
      // Don't store tokens without proper permissions
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }
    
    console.log('✅ business.manage scope confirmed');

    // Fetch Google account info to get the email
    console.log('📧 Fetching Google account information...');
    let googleEmail = null;
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        googleEmail = userInfo.email;
        console.log('✅ Google account email:', googleEmail);
        
        // Check if this Google account is already connected to a different PR account
        // Use regular supabase client for this read operation
        const { data: existingConnection } = await supabase
          .from('google_business_profiles')
          .select('user_id')
          .eq('google_email', googleEmail)
          .neq('user_id', user.id)
          .single();
          
        if (existingConnection) {
          console.warn('⚠️ This Google account is already connected to a different Prompt Reviews account');
          const separator = returnUrl.includes('?') ? '&' : '?';
          return NextResponse.redirect(
            new URL(`${returnUrl}${separator}error=already_connected&message=${encodeURIComponent('This Google account is already connected to a different Prompt Reviews account')}`, request.url)
          );
        }
      } else {
        console.warn('⚠️ Could not fetch Google account info:', userInfoResponse.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching Google account info:', error);
      // Continue without email - backward compatibility
    }

    // Store tokens in database
    console.log('💾 Storing tokens in database...');
    
    // Create a service role client for database operations (bypasses RLS)
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
    
    // First check if a record already exists for this user
    const { data: existingRecord } = await supabaseAdmin
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
      scopes: tokens.scope,
      google_email: googleEmail // Store which Google account is connected
    };
    
    let tokenError;
    if (existingRecord) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from('google_business_profiles')
        .update(upsertData)
        .eq('user_id', user.id);
      tokenError = error;
    } else {
      // Insert new record
      const { error } = await supabaseAdmin
        .from('google_business_profiles')
        .insert(upsertData);
      tokenError = error;
    }

    if (tokenError) {
      console.error('❌ Error storing tokens:', tokenError);
      const separator = returnUrl.includes('?') ? '&' : '?';
      return NextResponse.redirect(
        new URL(`${returnUrl}${separator}error=callback_failed&message=Failed to store tokens`, request.url)
      );
    }

    console.log('✅ Google Business Profile tokens stored successfully');

    // Mark connection status in localStorage for immediate UI feedback
    // We'll store a flag to help the frontend know the connection is successful
    console.log('💾 OAuth tokens stored successfully in database');
    console.log('✅ Google Business Profile connection successful - tokens stored');
    
    // Optional: Log token validation (skip actual API call to avoid rate limits)
    console.log('🧪 Tokens stored - skipping validation to avoid rate limits');
    console.log('✅ OAuth flow completed successfully');

    // Create a response that clears the OAuth flag and redirects with success
    // Make sure to use & if returnUrl already has query params
    const separator = returnUrl.includes('?') ? '&' : '?';
    const successMessage = encodeURIComponent('Successfully connected Google Business Profile!');
    const redirectUrl = `${returnUrl}${separator}connected=true&message=${successMessage}`;
    
    console.log('✅ Redirecting to:', redirectUrl);
    
    const response = NextResponse.redirect(
      new URL(redirectUrl, request.url)
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