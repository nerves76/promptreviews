/**
 * Google Business Profile Locations API
 * Fetches business locations for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabaseClient';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get stored Google Business Profile tokens
    const { data: gbpData, error: gbpError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (gbpError || !gbpData) {
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 404 }
      );
    }

    // Initialize Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      credentials: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!
      }
    });

    // Set authentication tokens
    gbpClient.setAuth({
      accessToken: gbpData.access_token,
      refreshToken: gbpData.refresh_token,
      expiresAt: new Date(gbpData.expires_at).getTime(),
      scope: gbpData.scopes?.split(' ') || []
    });

    // Fetch business locations from database first
    const { data: locations, error: locationsError } = await supabase
      .from('google_business_locations')
      .select('*')
      .eq('user_id', user.id);

    if (locationsError) {
      console.error('Error fetching locations from database:', locationsError);
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      );
    }

    // Transform locations to match expected format
    const transformedLocations = locations?.map(location => ({
      id: location.location_id,
      name: location.location_name,
      address: location.address,
      status: location.status || 'active'
    })) || [];

    return NextResponse.json({
      success: true,
      locations: transformedLocations
    });

  } catch (error) {
    console.error('Error fetching Google Business Profile locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 