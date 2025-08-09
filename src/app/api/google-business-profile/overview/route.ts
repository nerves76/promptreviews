/**
 * Google Business Profile Overview API Route
 * 
 * Aggregates data from multiple Google Business Profile APIs to provide
 * comprehensive overview metrics for the dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
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

    // Get authenticated user using proper server client
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ GMB Overview API: Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ GMB Overview API: User authenticated:', user.id);

    // Create service role client for accessing OAuth tokens (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get Google Business Profile tokens using the correct table
    const { data: tokens, error: tokenError } = await serviceSupabase
      .from('google_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokenError || !tokens) {
      console.error('❌ GMB Overview API: No Google Business Profile tokens found:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Google Business Profile not connected' },
        { status: 404 }
      );
    }

    console.log('✅ GMB Overview API: Found Google Business Profile tokens');

    // Check if we have valid credentials
    if (!tokens.access_token) {
      console.error('❌ GMB Overview API: Invalid access token');
      return NextResponse.json(
        { success: false, error: 'Invalid Google Business Profile credentials' },
        { status: 400 }
      );
    }

    // Initialize Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expires_at).getTime()
    });

    console.log('🔧 GMB Overview API: Client initialized, fetching overview data...');

    // Get business data from Google APIs (same pattern as Business Info tab)
    try {
      // Use the same successful pattern as business-information/location-details
      console.log('🔍 Fetching accounts to find location details...');
      
      const accounts = await gbpClient.listAccounts();
      console.log(`✅ Found ${accounts.length} accounts`);
      
      let foundLocation = null;
      
      let foundAccount = null;
      
      // Search through all accounts to find the location (same as Business Info)
      for (const account of accounts) {
        try {
          console.log(`🔍 Checking account: ${account.name}`);
          const locations = await gbpClient.listLocations(account.name);
          console.log(`📍 Account ${account.name} has ${locations.length} locations:`, 
            locations.map(loc => ({ name: loc.name, title: loc.title })));
          
          // Find the matching location
          console.log(`🔍 Searching for location ID: "${locationId}"`);
          console.log(`🔍 Available location names in this account:`, locations.map(loc => `"${loc.name}"`));
          
          foundLocation = locations.find(loc => {
            const matches = loc.name === locationId;
            console.log(`🔍 Comparing "${loc.name}" === "${locationId}" = ${matches}`);
            return matches;
          });
          
          if (foundLocation) {
            console.log('✅ Found location with complete Google data:', foundLocation.name);
            foundAccount = account;
            break;
          } else {
            console.log(`⚠️ Location ${locationId} not found in account ${account.name}`);
            
            // Try alternative matching approaches
            const cleanLocationId = locationId.replace('locations/', '');
            const altFound = locations.find(loc => {
              const cleanLocName = loc.name.replace('locations/', '');
              const altMatches = cleanLocName === cleanLocationId;
              console.log(`🔍 Alternative match: "${cleanLocName}" === "${cleanLocationId}" = ${altMatches}`);
              return altMatches;
            });
            
            if (altFound) {
              console.log('✅ Found location with alternative matching:', altFound.name);
              foundLocation = altFound;
              foundAccount = account;
              break;
            }
          }
        } catch (accountError) {
          console.log(`⚠️ Error checking account ${account.name}:`, accountError);
          // Continue with other accounts
        }
      }

      const locationData = foundLocation;
      console.log('📍 Final location data:', locationData ? 'Complete Google object found' : 'Not found');

      // Extract account and location IDs for API calls
      const accountId = foundAccount ? foundAccount.name.replace('accounts/', '') : '';
      const cleanLocationId = locationId.replace('locations/', '');

      // Fetch data from multiple APIs in parallel
      const [reviewsResult, photosResult, postsResult, insightsResult] = await Promise.allSettled([
        gbpClient.getReviews(locationId),
        gbpClient.getMedia(locationId),
        accountId ? gbpClient.listLocalPosts(accountId, cleanLocationId) : Promise.resolve([]),
        gbpClient.getLocationInsights(locationId, 'THIRTY_DAYS')
      ]);

      // Process results with error logging
      const reviewsData = reviewsResult.status === 'fulfilled' ? reviewsResult.value : [];
      const photosData = photosResult.status === 'fulfilled' ? photosResult.value : [];
      const postsData = postsResult.status === 'fulfilled' ? postsResult.value : [];
      const insightsData = insightsResult.status === 'fulfilled' ? insightsResult.value : [];

      // Log API call results
      console.log('📊 API Results Summary:');
      console.log(`  Reviews: ${reviewsResult.status} - ${reviewsData.length} items`);
      console.log(`  Photos: ${photosResult.status} - ${photosData.length} items`);
      console.log(`  Posts: ${postsResult.status} - ${postsData.length} items`);
      console.log(`  Insights: ${insightsResult.status} - ${insightsData.length} metrics`);
      
      if (reviewsResult.status === 'rejected') console.log('  Reviews error:', reviewsResult.reason);
      if (photosResult.status === 'rejected') console.log('  Photos error:', photosResult.reason);
      if (postsResult.status === 'rejected') console.log('  Posts error:', postsResult.reason);
      if (insightsResult.status === 'rejected') console.log('  Insights error:', insightsResult.reason);

      // Process the data using helper functions
      const { 
        calculateProfileCompleteness, 
        processReviewTrends, 
        identifyOptimizationOpportunities,
        formatPerformanceData 
      } = await import('@/utils/googleBusinessProfile/overviewDataHelpers');

      // Use complete Google location data for profile completeness (same as Business Info)
      const profileData = locationData ? 
        calculateProfileCompleteness(locationData, [], []) : 
        { categoriesUsed: 0, maxCategories: 10, servicesCount: 0, servicesWithDescriptions: 0, businessDescriptionLength: 0, businessDescriptionMaxLength: 750, seoScore: 0, photosByCategory: {} };

      console.log('📊 Categories structure debug:', {
        hasCategories: !!locationData.categories,
        hasPrimaryCategory: !!locationData.primaryCategory,
        hasAdditionalCategories: !!locationData.additionalCategories,
        categoriesObject: locationData.categories ? {
          hasPrimary: !!locationData.categories.primaryCategory,
          hasAdditional: !!locationData.categories.additionalCategories,
          additionalCount: locationData.categories.additionalCategories?.length || 0
        } : null,
        directCategories: {
          primaryExists: !!locationData.primaryCategory,
          additionalCount: locationData.additionalCategories?.length || 0
        }
      });

      console.log('📊 Profile completeness calculated:', {
        categoriesUsed: profileData.categoriesUsed,
        servicesCount: profileData.servicesCount,
        servicesWithDescriptions: profileData.servicesWithDescriptions,
        descriptionLength: profileData.businessDescriptionLength,
        seoScore: profileData.seoScore
      });

      if (!locationData) {
        console.log('❌ Location not found in any account');
        console.log('🔍 Requested location ID:', locationId);
        
        return NextResponse.json({
          success: false,
          error: 'Location not found',
          message: `The requested location "${locationId}" was not found in your Google Business Profile accounts.`
        }, { status: 404 });
      }

      const reviewTrends = processReviewTrends(reviewsData);

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentPhotos = photosData.filter((photo: any) => {
        if (!photo.createTime) return false;
        const photoDate = new Date(photo.createTime);
        return photoDate >= thirtyDaysAgo;
      });

      const recentPostsData = postsData.filter((post: any) => {
        if (!post.createTime) return false;
        const postDate = new Date(post.createTime);
        return postDate >= thirtyDaysAgo;
      });

      // Find most recent dates
      const getLatestDate = (items: any[], dateField: string) => {
        if (items.length === 0) return undefined;
        const dates = items
          .map(item => item[dateField])
          .filter(date => date)
          .map(date => new Date(date))
          .sort((a, b) => b.getTime() - a.getTime());
        return dates.length > 0 ? dates[0].toISOString() : undefined;
      };

      const engagementData = {
        unrespondedReviews: reviewsData.filter((review: any) => !review.reviewReply).length,
        totalQuestions: 0, // Would need Q&A API
        unansweredQuestions: 0, // Would need Q&A API  
        recentPosts: recentPostsData.length,
        recentPhotos: recentPhotos.length,
        lastPostDate: getLatestDate(postsData, 'createTime'),
        lastPhotoDate: getLatestDate(photosData, 'createTime')
      };

      console.log('📊 Activity metrics:', {
        recentPhotos: recentPhotos.length,
        recentPosts: recentPostsData.length,
        totalPhotos: photosData.length,
        totalPosts: postsData.length
      });

      // Process real Google Business Profile performance data
      const performanceData = formatPerformanceData(insightsData, []);
      
      console.log('📈 Performance data processed:', {
        monthlyViews: performanceData.monthlyViews,
        viewsTrend: performanceData.viewsTrend,
        topSearchQueries: performanceData.topSearchQueries?.length,
        customerActions: performanceData.customerActions
      });

      const optimizationOpportunities = identifyOptimizationOpportunities(locationData, profileData, engagementData, []);

      const overviewData = {
        profileData,
        engagementData,
        performanceData,
        reviewTrends,
        optimizationOpportunities
      };
      
      console.log('✅ GMB Overview API: Successfully fetched overview data');
      console.log('📊 API Response - Review Trends:', overviewData.reviewTrends);
      console.log('📊 API Response - Profile Data:', overviewData.profileData);
      console.log('📊 API Response - Performance Data:', overviewData.performanceData);

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