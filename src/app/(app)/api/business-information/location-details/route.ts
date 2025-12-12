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
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service role client for bypassing RLS when reading tokens
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'User not authenticated'
      }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }


    // Get Google Business Profile tokens using service role to bypass RLS
    const { data: tokenData, error: tokenError } = await serviceSupabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('account_id', accountId)
      .maybeSingle();

    if (tokenError || !tokenData) {
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
      
      const accounts = await gbpClient.listAccounts();
      
      let foundLocation = null;
      
      // Search through all accounts to find the location
      for (const account of accounts) {
        try {
          const locations = await gbpClient.listLocations(account.name);
          
          // Find the matching location
          
          foundLocation = locations.find(loc => {
            const matches = loc.name === locationId;
            return matches;
          });
          
          if (foundLocation) {
            break;
          } else {
            
            // Try alternative matching approaches
            const cleanLocationId = locationId.replace('locations/', '');
            const altFound = locations.find(loc => {
              const cleanLocName = loc.name.replace('locations/', '');
              const altMatches = cleanLocName === cleanLocationId;
              return altMatches;
            });
            
            if (altFound) {
              foundLocation = altFound;
              break;
            }
          }
        } catch (accountError) {
          // Continue with other accounts
        }
      }
      
      if (foundLocation) {
        
        // If categories are missing, try to fetch the individual location with full details
        if (!foundLocation.categories && !foundLocation.primaryCategory) {
          try {
            // Use the getLocationDetails method which might return more complete data
            const detailedLocation = await gbpClient.getLocationDetails(foundLocation.name);
            
            // Merge the detailed data with the list data
            foundLocation = { ...foundLocation, ...detailedLocation };
          } catch (detailError) {
            // Continue with the data we have
          }
        }
        
        return NextResponse.json({
          success: true,
          location: foundLocation
        });
      } else {
        
        // Collect all available location IDs for debugging
        let allLocationIds = [];
        for (const account of accounts) {
          try {
            const locations = await gbpClient.listLocations(account.name);
            allLocationIds.push(...locations.map(loc => loc.name));
          } catch (err) {
          }
        }
        
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
