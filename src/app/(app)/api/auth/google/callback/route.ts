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
    
    
    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL('/dashboard/google-business?tab=connect&error=oauth_denied&message=Access was denied', request.url)
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/google-business?tab=connect&error=callback_failed&message=No authorization code received', request.url)
      );
    }

    // Parse state to check if this is an embed flow
    let returnUrl = '/dashboard/google-business?tab=connect';
    let isEmbed = false;
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        returnUrl = stateData.returnUrl || '/dashboard/google-business?tab=connect';
        isEmbed = stateData.embed === true;

        // If this is an embed flow, redirect to the embed-specific callback
        if (isEmbed) {
          // Forward to embed-specific callback with all params
          const embedCallbackUrl = new URL('/api/embed/auth/google-business/callback', request.url);
          embedCallbackUrl.searchParams.set('code', code);
          embedCallbackUrl.searchParams.set('state', state);
          if (error) embedCallbackUrl.searchParams.set('error', error);
          return NextResponse.redirect(embedCallbackUrl);
        }

        // Only add tab=connect for non-embed dashboard pages
        if (!returnUrl.includes('tab=') && returnUrl.includes('/dashboard/google-business')) {
          returnUrl = returnUrl.includes('?') ? `${returnUrl}&tab=connect` : `${returnUrl}?tab=connect`;
        }
      } catch (e) {
      }
    }

    // 🔧 FIX: Add retry logic for authentication check (skip for embeds)
    // Sometimes the session isn't immediately available after OAuth redirect
    // IMPORTANT: Don't fail auth during OAuth - it might just be session refresh timing
    let user = null;
    let authError = null;
    let retryCount = 0;
    const maxRetries = 10; // Increased retries for OAuth flow
    
    // Skip auth check for embed flows
    if (!isEmbed) {
      // First, try to refresh the session to ensure we have the latest
      try {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshedSession?.user && !refreshError) {
        user = refreshedSession.user;
      } else {
      }
    } catch (refreshErr) {
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
    } // End if (!isEmbed)

    if (!isEmbed && (authError || !user)) {
      
      // IMPORTANT: During OAuth, the session might be in transition
      // Don't fail the OAuth flow - continue and let the client-side handle auth
      // This prevents unnecessary logouts during the OAuth flow
      
      // Try to get any user ID from cookies as a fallback
      const authCookie = cookieStore.get('sb-ltneloufqjktdplodvao-auth-token');
      if (!authCookie?.value) {
        const separator = returnUrl.includes('?') ? '&' : '?';
        return NextResponse.redirect(
          new URL(`${returnUrl}${separator}error=auth_required&message=${encodeURIComponent('Please sign in first before connecting Google Business Profile')}`, request.url)
        );
      }
      
      // If we have an auth cookie, try to decode it to get the user ID
      try {
        const tokenData = JSON.parse(authCookie.value);
        if (tokenData?.user?.id) {
          user = { id: tokenData.user.id, email: tokenData.user.email } as User;
        }
      } catch (e) {
      }
      
      // If we still don't have a user, we must fail
      if (!user) {
        const separator = returnUrl.includes('?') ? '&' : '?';
        return NextResponse.redirect(
          new URL(`${returnUrl}${separator}error=auth_failed&message=${encodeURIComponent('Session verification failed. Please try refreshing the page and trying again.')}`, request.url)
        );
      }
    }

    // At this point, user is guaranteed to be non-null
    if (!user) {
      const separator = returnUrl.includes('?') ? '&' : '?';
      return NextResponse.redirect(
        new URL(`${returnUrl}${separator}error=auth_failed&message=${encodeURIComponent('User authentication failed')}`, request.url)
      );
    }

    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      const separator = returnUrl.includes('?') ? '&' : '?';
      return NextResponse.redirect(
        new URL(`${returnUrl}${separator}error=callback_failed&message=Missing environment variables`, request.url)
      );
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
      const separator = returnUrl.includes('?') ? '&' : '?';
      return NextResponse.redirect(
        new URL(`${returnUrl}${separator}error=callback_failed&message=Failed to exchange code for tokens: ${tokenResponse.statusText} - ${errorText.substring(0, 200)}`, request.url)
      );
    }

    const tokens = await tokenResponse.json();
    
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
      
      
      // Don't store tokens without proper permissions
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }
    

    // Fetch Google account info to get the email
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
    // Use maybeSingle() to handle 0 or 1 records gracefully
    const { data: existingRecord } = await supabaseAdmin
      .from('google_business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const now = Date.now();
    const expiresAt = new Date(now + (tokens.expires_in || 3600) * 1000);
    
    
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


    // Mark connection status in localStorage for immediate UI feedback
    // We'll store a flag to help the frontend know the connection is successful
    
    // Optional: Log token validation (skip actual API call to avoid rate limits)

    // Create a response that clears the OAuth flag and redirects with success
    // Make sure to use & if returnUrl already has query params
    const separator = returnUrl.includes('?') ? '&' : '?';
    const successMessage = encodeURIComponent('Successfully connected Google Business Profile!');
    const redirectUrl = `${returnUrl}${separator}connected=true&message=${successMessage}`;
    
    
    const response = NextResponse.redirect(
      new URL(redirectUrl, request.url)
    );
    
    // Set a flag for the client to clear the OAuth in progress flag
    response.cookies.set('clearGoogleOAuthFlag', 'true', { 
      maxAge: 10, // Short lived - just for the redirect
      path: '/',
      httpOnly: false // Allow client-side access
    });
    
    return response;

  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    return NextResponse.redirect(
              new URL('/dashboard/google-business?tab=connect&error=callback_failed&message=Unexpected error during OAuth callback', request.url)
    );
  }
} 