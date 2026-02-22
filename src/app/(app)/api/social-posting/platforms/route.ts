/**
 * API Route: GET /api/social-posting/platforms
 * Returns the status of connected social media platforms
 * Uses browser session authentication with cookies
 * 
 * DISCONNECT UI UPDATE FIX (2025-08-12):
 * - Added validation to check both access_token AND refresh_token exist
 * - Handles case where database row exists but tokens are null
 * - This prevents false positive "connected" status after disconnect
 * - See handleDisconnect in dashboard/google-business/page.tsx for client-side fix
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { decryptGbpToken, encryptGbpToken } from '@/lib/crypto/gbpTokenHelpers';

/**
 * API Route: GET /api/social-posting/platforms
 * Returns the status of connected social media platforms
 */
export async function GET(request: NextRequest) {
  try {
    
    // Debug cookie information
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(cookie => cookie.name.startsWith('sb-'));
    
    
    // Create server-side Supabase client that handles session cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const value = cookieStore.get(name)?.value;
            return value;
          },
          set: () => {},
          remove: () => {},
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
      return NextResponse.json({
        error: 'Account not found',
        details: 'Unable to resolve an account for this user',
      }, { status: 404 });
    }

    const { data: accountRecord, error: accountError } = await supabase
      .from('accounts')
      .select('id, plan, first_name, last_name, max_gbp_locations')
      .eq('id', accountId)
      .maybeSingle();

    if (accountError || !accountRecord) {
      console.error('❌ Error loading account record:', accountError);
      return NextResponse.json({
        error: 'Account lookup failed',
        details: accountError?.message || 'Account not found',
      }, { status: 404 });
    }


    /**
     * Check for Google Business Profile connection and validate tokens
     * 
     * CRITICAL: Use maybeSingle() to handle case where no tokens exist
     * This prevents errors when checking after disconnect
     * 
     * Additional verification:
     * - Check if tokens actually exist (not just the row)
     * - Validate both access_token and refresh_token are present
     * - Log detailed status for debugging disconnect issues
     */
    const { data: googleTokens, error: googleError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();
    

    let isGoogleConnected = false;
    let googleConnectionError = null;

    if (googleError) {
      console.error('❌ Error fetching Google tokens:', {
        error: googleError.message,
        code: googleError.code,
        details: googleError.details,
        hint: googleError.hint
      });
    } else if (googleTokens && googleTokens.access_token && googleTokens.refresh_token) {
      /**
       * CRITICAL: Only consider connected if BOTH tokens exist
       * Sometimes a row exists but tokens are null after failed operations
       * This additional check prevents false positive connections
       */
      
      // Check if tokens exist and are not expired (database-only check)
      try {
        const expiresAt = googleTokens.expires_at ? new Date(googleTokens.expires_at).getTime() : Date.now() + 3600000;
        const now = Date.now();
        
        if (expiresAt > now) {
          const remainingTime = Math.floor((expiresAt - now) / 1000 / 60);
          isGoogleConnected = true;
        } else {
          const expiredTime = Math.floor((now - expiresAt) / 1000 / 60);
          console.warn(`⚠️ Google tokens expired ${expiredTime} minutes ago`);
          
          // Try to refresh the token automatically if we have a refresh token
          if (googleTokens.refresh_token) {
            try {
              // Import the client dynamically to avoid circular dependencies
              const { GoogleBusinessProfileClient } = await import('@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient');
              
              const client = new GoogleBusinessProfileClient({
                accessToken: decryptGbpToken(googleTokens.access_token),
                refreshToken: decryptGbpToken(googleTokens.refresh_token),
                expiresAt: expiresAt,
                accountId,
              });
              
              const newTokens = await client.refreshAccessToken();

              if (newTokens && newTokens.access_token) {
                // Token storage is now handled by the server-side refresh endpoint
                // (encrypted and stored automatically)
                isGoogleConnected = true;
                googleConnectionError = null;
              } else {
                googleConnectionError = `Google Business Profile tokens expired ${expiredTime} minutes ago. Please reconnect to continue.`;
                isGoogleConnected = false;
              }
            } catch (refreshError: any) {
              console.error('❌ Token refresh failed:', refreshError.message);
              googleConnectionError = `Google Business Profile tokens expired. Automatic refresh failed. Please reconnect.`;
              isGoogleConnected = false;
            }
          } else {
            googleConnectionError = `Google Business Profile tokens expired ${expiredTime} minutes ago. Please reconnect to continue.`;
            isGoogleConnected = false;
          }
        }
      } catch (error: any) {
        console.error('❌ Error checking Google token expiry:', error);
        googleConnectionError = 'Error checking Google Business Profile connection.';
        isGoogleConnected = false;
      }
    } else if (googleTokens) {
      /**
       * Row exists but tokens are missing/null
       * This can happen after partial operations or corrupted data
       * Treat as disconnected
       */
    } else {
    }

    // Check for Google Business Profile locations (only if connected)
    let locations: any[] = [];
    let hasSelectedLocations = false;
    let allLocationsCount = 0;

    // When source=dashboard, use selected_gbp_locations so the dashboard
    // can gate access until the user explicitly picks locations.
    const source = request.nextUrl.searchParams.get('source');
    const useDashboardMode = source === 'dashboard';

    if (isGoogleConnected && accountId) {
      // Calculate the max locations limit from account settings or plan defaults
      const maxLocations = accountRecord.max_gbp_locations ||
        (accountRecord.plan === 'maven' ? 10 :
         accountRecord.plan === 'builder' ? 5 :
         accountRecord.plan === 'grower' ? 1 : 0);

      // Always fetch total count of fetched locations for dashboard mode
      const { count: totalCount } = await supabase
        .from('google_business_locations')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId);

      allLocationsCount = totalCount ?? 0;

      if (useDashboardMode) {
        // Dashboard mode: only return locations the user has explicitly selected
        const { data: selectedLocationData, error: selectedError } = await supabase
          .from('selected_gbp_locations')
          .select('*')
          .eq('account_id', accountId);

        if (selectedError) {
          console.error('❌ Error fetching selected locations:', selectedError);
          locations = [];
        } else if (selectedLocationData && selectedLocationData.length > 0) {
          hasSelectedLocations = true;
          // Map selected locations to the expected format
          locations = selectedLocationData.map((loc: any) => ({
            location_id: loc.location_id,
            location_name: loc.location_name,
            address: loc.address,
            user_id: user.id
          }));
        } else {
          // No selected locations yet — return empty to prompt selection
          hasSelectedLocations = false;
          locations = [];
        }
      } else {
        // Non-dashboard callers (review-import, social posting, etc.) — return all fetched locations
        const { data: locationData, error: locationsError } = await supabase
          .from('google_business_locations')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: true })
          .limit(maxLocations > 0 ? maxLocations : 100);

        if (locationsError) {
          console.error('❌ Error fetching locations:', {
            error: locationsError.message,
            code: locationsError.code,
            userId: user.id,
            maxLocations
          });
        } else {
          if (locationData && locationData.length > 0) {
            console.log(`✅ Fetched ${locationData.length} locations (max: ${maxLocations})`);
          }
          locations = locationData || [];
        }
      }
    }

    // Check for Bluesky connection
    const { data: blueskyConnection, error: blueskyError } = await supabase
      .from('social_platform_connections')
      .select('id, platform, status, metadata, error_message')
      .eq('account_id', accountId)
      .eq('platform', 'bluesky')
      .maybeSingle();

    let isBlueskyConnected = false;
    let blueskyConnectionError = null;
    let blueskyHandle = null;

    if (!blueskyError && blueskyConnection) {
      isBlueskyConnected = blueskyConnection.status === 'active';
      blueskyHandle = blueskyConnection.metadata?.handle || null;
      if (blueskyConnection.status === 'error') {
        blueskyConnectionError = blueskyConnection.error_message;
      }
    }

    // Calculate max locations for response
    const maxLocations = accountRecord.max_gbp_locations ||
      (accountRecord.plan === 'maven' ? 10 :
       accountRecord.plan === 'builder' ? 5 :
       accountRecord.plan === 'grower' ? 1 : 0);

    const platforms = [
      {
        id: 'google-business-profile',
        name: 'Google Business Profile',
        connected: isGoogleConnected,
        locations: locations,
        maxLocations: maxLocations, // Include limit so frontend knows the cap
        hasSelectedLocations, // Whether user has rows in selected_gbp_locations
        allLocationsCount,    // Total fetched locations (google_business_locations)
        status: isGoogleConnected ? 'connected' : 'disconnected',
        connectedEmail: googleTokens?.google_email || null, // Show which Google account is connected
        ...(googleConnectionError && { error: googleConnectionError })
      },
      {
        id: 'bluesky',
        name: 'Bluesky',
        connected: isBlueskyConnected,
        status: isBlueskyConnected ? 'connected' : 'disconnected',
        handle: blueskyHandle,
        ...(blueskyConnectionError && { error: blueskyConnectionError })
      }
    ];

    return NextResponse.json({ platforms });

  } catch (error) {
    console.error('❌ Social posting platforms API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platformId, action } = await request.json();
    
    // TODO: Implement platform management with postManager adapter
    return NextResponse.json({
      success: false,
      error: 'Platform management not yet implemented'
    }, { status: 501 });
  } catch (error) {
    console.error('Error managing platform:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage platform' },
      { status: 500 }
    );
  }
} 
