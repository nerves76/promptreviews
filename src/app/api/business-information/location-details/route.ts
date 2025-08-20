/**
 * API Route: Get Location Details
 * 
 * Fetches detailed information about a specific Google Business Profile location
 * including categories and services data.
 * 
 * This route works around the 404 issue with Google's individual location endpoint
 * by fetching all locations from all accounts and finding the specific location.
 * The location data includes categories, services, and other detailed information
 * needed for the Business Info Editor.
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
      locationIdType: typeof locationId,
      locationIdLength: locationId?.length,
      locationIdCharCodes: locationId ? (Array.from(locationId) as string[]).map(c => c.charCodeAt(0)) : null,
      accountName: body.accountName || 'accounts/unknown',
      fullBody: body
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
      // Get location details by fetching all locations and finding the specific one
      // This works around the 404 issue with the individual location endpoint
      console.log('🔍 Fetching accounts to find location details...');
      
      const accounts = await gbpClient.listAccounts();
      console.log(`✅ Found ${accounts.length} accounts`);
      
      let foundLocation = null;
      
      // Search through all accounts to find the location
      for (const account of accounts) {
        try {
          console.log(`🔍 Checking account: ${account.name}`);
          const locations = await gbpClient.listLocations(account.name);
          console.log(`📍 Account ${account.name} has ${locations.length} locations:`, 
            locations.map(loc => ({ name: loc.name, title: loc.title })));
          
          // Find the matching location
          console.log(`🔍 Searching for location ID: "${locationId}" (type: ${typeof locationId})`);
          console.log(`🔍 Available location names in this account:`, locations.map(loc => `"${loc.name}" (type: ${typeof loc.name})`));
          
          foundLocation = locations.find(loc => {
            const matches = loc.name === locationId;
            console.log(`🔍 Comparing "${loc.name}" === "${locationId}" = ${matches}`);
            return matches;
          });
          
          if (foundLocation) {
            console.log('✅ Found location with detailed data:', foundLocation.name);
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
              break;
            }
          }
        } catch (accountError) {
          console.log(`⚠️ Error checking account ${account.name}:`, accountError);
          // Continue with other accounts
        }
      }
      
      if (foundLocation) {
        console.log('✅ Location details fetched successfully');
        console.log('🔍 Location data structure:', {
          hasCategories: !!foundLocation.categories,
          categoriesType: typeof foundLocation.categories,
          categoriesKeys: foundLocation.categories ? Object.keys(foundLocation.categories) : [],
          hasPrimaryCategory: !!foundLocation.primaryCategory,
          primaryCategoryType: typeof foundLocation.primaryCategory,
          fullLocationKeys: Object.keys(foundLocation)
        });
        
        // If categories are missing, try to fetch the individual location with full details
        if (!foundLocation.categories && !foundLocation.primaryCategory) {
          console.log('⚠️ Categories missing from list response, fetching individual location details...');
          try {
            // Use the getLocationDetails method which might return more complete data
            const detailedLocation = await gbpClient.getLocationDetails(foundLocation.name);
            console.log('✅ Fetched detailed location data');
            console.log('🔍 Detailed location categories:', {
              hasCategories: !!detailedLocation.categories,
              categories: detailedLocation.categories,
              hasPrimaryCategory: !!detailedLocation.primaryCategory,
              primaryCategory: detailedLocation.primaryCategory
            });
            
            // Merge the detailed data with the list data
            foundLocation = { ...foundLocation, ...detailedLocation };
          } catch (detailError) {
            console.log('⚠️ Could not fetch detailed location data:', detailError);
            // Continue with the data we have
          }
        }
        
        return NextResponse.json({
          success: true,
          location: foundLocation
        });
      } else {
        console.log('❌ Location not found in any account');
        console.log('🔍 Requested location ID:', locationId);
        
        // Collect all available location IDs for debugging
        let allLocationIds = [];
        for (const account of accounts) {
          try {
            const locations = await gbpClient.listLocations(account.name);
            allLocationIds.push(...locations.map(loc => loc.name));
          } catch (err) {
            console.log(`Error getting locations for debug: ${err}`);
          }
        }
        console.log('🔍 All available location IDs:', allLocationIds);
        
        return NextResponse.json({
          success: false,
          error: 'Location not found',
          message: `The requested location "${locationId}" was not found in your Google Business Profile accounts. Available locations: ${allLocationIds.join(', ')}`
        }, { status: 404 });
      }

    } catch (error: any) {
      console.error('❌ Failed to get location details:', error);
      
      // Handle specific Google re-authentication errors
      if (error.message?.includes('GOOGLE_REAUTH_REQUIRED')) {
        return NextResponse.json({
          error: 'Google Business Profile connection expired. Please reconnect your account.',
          requiresReauth: true,
          details: 'Your Google Business Profile tokens have expired. Please disconnect and reconnect your Google account.'
        }, { status: 401 });
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to get location details',
          details: error.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Location details API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 