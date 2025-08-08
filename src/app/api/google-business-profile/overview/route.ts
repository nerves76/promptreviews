/**
 * Google Business Profile Overview API Route
 * 
 * Aggregates data from multiple Google Business Profile APIs to provide
 * comprehensive overview metrics for the dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabaseClient';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { generateMockOverviewData } from '@/utils/googleBusinessProfile/overviewDataHelpers';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GMB Overview API: Starting overview data fetch');

    // Get location ID from query parameters
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const useMockData = searchParams.get('mock') === 'true';

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'Location ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 GMB Overview API: Location ID:', locationId);

    // If mock data is requested, return mock data
    if (useMockData) {
      console.log('📊 GMB Overview API: Using mock data');
      const mockData = generateMockOverviewData();
      
      return NextResponse.json({
        success: true,
        data: mockData,
        isMockData: true
      });
    }

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ GMB Overview API: Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ GMB Overview API: User authenticated:', user.id);

    // Get Google Business Profile credentials from database
    const { data: platforms, error: platformError } = await supabase
      .from('social_platforms')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform_id', 'google-business-profile')
      .eq('connected', true)
      .single();

    if (platformError || !platforms) {
      console.error('❌ GMB Overview API: No connected Google Business Profile found:', platformError);
      return NextResponse.json(
        { success: false, error: 'Google Business Profile not connected' },
        { status: 404 }
      );
    }

    console.log('✅ GMB Overview API: Found connected platform');

    // Decrypt credentials
    const credentials = platforms.credentials;
    if (!credentials?.access_token) {
      console.error('❌ GMB Overview API: Invalid credentials');
      return NextResponse.json(
        { success: false, error: 'Invalid Google Business Profile credentials' },
        { status: 400 }
      );
    }

    // Initialize Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token,
      expiresAt: credentials.expires_at
    });

    console.log('🔧 GMB Overview API: Client initialized, fetching overview data...');

    // Fetch overview data with timeout and error handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
    });

    const dataPromise = gbpClient.getOverviewData(locationId);

    try {
      const overviewData = await Promise.race([dataPromise, timeoutPromise]) as any;
      
      console.log('✅ GMB Overview API: Successfully fetched overview data');

      return NextResponse.json({
        success: true,
        data: overviewData,
        isMockData: false,
        fetchedAt: new Date().toISOString()
      });

    } catch (fetchError: any) {
      console.error('❌ GMB Overview API: Error fetching overview data:', fetchError);

      // If there's an API error, fall back to mock data with a warning
      if (fetchError.message?.includes('quota') || fetchError.message?.includes('rate limit')) {
        console.log('📊 GMB Overview API: Falling back to mock data due to rate limits');
        const mockData = generateMockOverviewData();
        
        return NextResponse.json({
          success: true,
          data: mockData,
          isMockData: true,
          warning: 'Using demo data due to Google API rate limits',
          fetchedAt: new Date().toISOString()
        });
      }

      throw fetchError; // Re-throw if it's not a rate limit error
    }

  } catch (error: any) {
    console.error('❌ GMB Overview API: Unexpected error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch overview data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}