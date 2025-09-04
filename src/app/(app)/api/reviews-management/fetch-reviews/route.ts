/**
 * API Route: Fetch Reviews
 * 
 * Fetches reviews for a specific Google Business Profile location
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { locationId } = body;

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
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }


    // Get Google Business Profile tokens for the user
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ No Google Business Profile tokens found:', tokenError);
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }


    // Create Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : Date.now() + 3600000
    });

    // Fetch reviews for the location
    const reviews = await gbpClient.getReviews(locationId);


    return NextResponse.json({
      reviews,
      success: true
    });

  } catch (error) {
    console.error('💥 Error in fetch reviews API:', error);
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Google Business Profile authorization expired. Please reconnect.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return NextResponse.json(
          { error: 'Access denied. Please check your Google Business Profile permissions.' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Location not found or no longer accessible.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch reviews. Please try again.' },
      { status: 500 }
    );
  }
} 