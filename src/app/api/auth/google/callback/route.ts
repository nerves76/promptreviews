/**
 * Google OAuth Callback Route
 * Handles the OAuth callback from Google for Business Profile integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { createServerSupabaseClient, createServiceRoleClient } from '@/utils/supabaseClient';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-posting?error=oauth_failed&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-posting?error=no_code`);
  }

  try {
    // Use server client to properly read session cookies
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error('User not authenticated in OAuth callback:', sessionError);
      // Instead of redirecting to sign-in, redirect back to social posting with error
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-posting?error=not_authenticated&message=${encodeURIComponent('Please sign in to connect Google Business Profile')}`);
    }

    const user = session.user;
    console.log('OAuth callback - User authenticated:', user.id);

    // Initialize Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      credentials: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!
      }
    });

    // Exchange authorization code for tokens
    const auth = await gbpClient.exchangeCodeForTokens(code);
    console.log('OAuth tokens received successfully');

    // Set the auth on the client for subsequent API calls
    gbpClient.setAuth(auth);

    // Store the authentication tokens in the database
    const { error: insertError } = await supabase
      .from('google_business_profiles')
      .upsert({
        user_id: user.id,
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken,
        expires_at: new Date(auth.expiresAt).toISOString(),
        scopes: auth.scope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.error('Error storing Google Business Profile tokens:', insertError);
      throw new Error('Failed to store authentication tokens');
    }

    console.log('Google Business Profile tokens stored successfully');

    // Fetch and store business locations
    try {
      const accounts = await gbpClient.listAccounts();
      
      if (accounts.length > 0) {
        const firstAccount = accounts[0];
        const locations = await gbpClient.listLocations(firstAccount.name);
        
        console.log(`Found ${locations.length} business locations`);
        
        // Store locations in the database
        for (const location of locations) {
          await supabase
            .from('google_business_locations')
            .upsert({
              user_id: user.id,
              location_id: location.name,
              location_name: location.locationName,
              address: location.address ? 
                location.address.addressLines.join(', ') + 
                (location.address.locality ? `, ${location.address.locality}` : '') +
                (location.address.administrativeArea ? `, ${location.address.administrativeArea}` : '') : '',
              primary_phone: location.primaryPhone,
              website_uri: location.websiteUri,
              status: location.openInfo?.status || 'UNKNOWN',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,location_id'
            });
        }
      }
    } catch (locationError) {
      console.warn('Failed to fetch locations, but OAuth was successful:', locationError);
      // Don't fail the entire flow if location fetching fails
    }

    // Redirect back to social posting dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-posting?connected=true&message=${encodeURIComponent('Successfully connected Google Business Profile!')}`
    );

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-posting?error=callback_failed&message=${encodeURIComponent(errorMessage)}`
    );
  }
} 