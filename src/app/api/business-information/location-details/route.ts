/**
 * API Route: Get Location Details
 * 
 * Fetches detailed information about a specific Google Business Profile location
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Location details API called');
    
    const body = await request.json();
    const { locationId } = body;
    
    console.log('📥 Location details request:', { 
      locationId,
      accountName: body.accountName || 'accounts/unknown'
    });

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client that handles session cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Authentication error:', authError?.message || 'No user found');
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'User not authenticated'
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get Google Business Profile tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ No Google tokens found:', tokenError?.message);
      return NextResponse.json({
        error: 'Google Business Profile not connected',
        details: 'Please connect your Google Business Profile first'
      }, { status: 401 });
    }

    // Create Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : Date.now() + 3600000
    });

    try {
      // Get location details
      const locationDetails = await gbpClient.getLocationDetails(locationId);
      
      console.log('✅ Location details fetched successfully');
      return NextResponse.json({
        success: true,
        location: locationDetails
      });

    } catch (error) {
      console.error('❌ Failed to get location details:', error);
      return NextResponse.json({
        error: 'Failed to fetch location details',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Location details API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 