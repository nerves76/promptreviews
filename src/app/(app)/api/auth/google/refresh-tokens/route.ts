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
    
    const { refreshToken } = await request.json();
    
    if (!refreshToken) {
      console.log('❌ No refresh token provided in request');
      return NextResponse.json({ 
        error: 'Refresh token is required',
        requiresReauth: true 
      }, { status: 400 });
    }
    
    // Create service client to bypass RLS and find user by refresh token
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    );
    
    console.log('🔍 Looking up user by refresh token...');

    // Find the user by refresh token (using service role to bypass RLS)
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('user_id, access_token, refresh_token, expires_at')
      .eq('refresh_token', refreshToken)
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ No matching refresh token found:', tokenError?.message);
      return NextResponse.json({ 
        error: 'Invalid refresh token',
        requiresReauth: true 
      }, { status: 401 });
    }

    console.log('✅ Found matching refresh token for user:', tokenData.user_id);

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
    console.log('🔑 Using client ID:', clientId?.substring(0, 10) + '...');

    // Exchange refresh token for new access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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

    const refreshData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Token refresh failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: refreshData.error,
        errorDescription: refreshData.error_description,
        refreshData
      });
      
      // If refresh token is invalid, user needs to re-authenticate
      if (refreshData.error === 'invalid_grant') {
        return NextResponse.json({ 
          error: 'Refresh token expired',
          requiresReauth: true 
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: `Token refresh failed: ${refreshData.error_description || refreshData.error}`,
        requiresReauth: refreshData.error === 'invalid_grant'
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
      .eq('user_id', tokenData.user_id);

    if (updateError) {
      console.error('❌ Failed to update tokens in database:', updateError);
      return NextResponse.json({ 
        error: 'Failed to save refreshed tokens' 
      }, { status: 500 });
    }

    console.log('✅ Tokens refreshed and saved to database');

    return NextResponse.json({
      success: true,
      accessToken: refreshData.access_token,
      expiresIn: refreshData.expires_in,
      refreshToken: refreshToken, // Return the same refresh token
      message: 'Tokens refreshed successfully'
    });

  } catch (error) {
    console.error('❌ Error in refresh-tokens API:', error);
    return NextResponse.json({ 
      error: 'Internal server error during token refresh' 
    }, { status: 500 });
  }
} 