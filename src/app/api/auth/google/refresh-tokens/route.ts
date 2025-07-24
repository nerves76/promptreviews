/**
 * API Route: POST /api/auth/google/refresh-tokens
 * Server-side token refresh for Google Business Profile
 * Securely handles client secrets and token exchange
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Server-side token refresh initiated');
    
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ Authentication error in refresh-tokens API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated for token refresh:', user.id);

    // Get current Google tokens from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData || !tokenData.refresh_token) {
      console.log('❌ No refresh token found:', tokenError?.message);
      return NextResponse.json({ 
        error: 'No refresh token available',
        requiresReauth: true 
      }, { status: 400 });
    }

    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Missing Google OAuth environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 });
    }

    console.log('🔄 Exchanging refresh token for new access token...');

    // Exchange refresh token for new access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const refreshData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Token refresh failed:', refreshData);
      
      // If refresh token is invalid, user needs to re-authenticate
      if (refreshData.error === 'invalid_grant') {
        return NextResponse.json({ 
          error: 'Refresh token expired',
          requiresReauth: true 
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: `Token refresh failed: ${refreshData.error_description || refreshData.error}` 
      }, { status: 400 });
    }

    console.log('✅ New access token received');

    // Update tokens in database
    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
    
    const { error: updateError } = await supabase
      .from('google_business_profiles')
      .update({
        access_token: refreshData.access_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Failed to update tokens in database:', updateError);
      return NextResponse.json({ 
        error: 'Failed to save refreshed tokens' 
      }, { status: 500 });
    }

    console.log('✅ Tokens refreshed and saved to database');

    return NextResponse.json({
      success: true,
      access_token: refreshData.access_token,
      expires_at: newExpiresAt,
      message: 'Tokens refreshed successfully'
    });

  } catch (error) {
    console.error('❌ Error in refresh-tokens API:', error);
    return NextResponse.json({ 
      error: 'Internal server error during token refresh' 
    }, { status: 500 });
  }
} 