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
      .select('id, plan, first_name, last_name')
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
                accessToken: googleTokens.access_token,
                refreshToken: googleTokens.refresh_token,
                expiresAt: expiresAt
              });
              
              const newTokens = await client.refreshAccessToken();
              
              if (newTokens && newTokens.access_token) {
                
                // Update tokens in database
                const { error: updateError } = await supabase
                  .from('google_business_profiles')
                  .update({
                    access_token: newTokens.access_token,
                    expires_at: new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('account_id', accountId);
                
                if (!updateError) {
                  isGoogleConnected = true;
                  googleConnectionError = null;
                } else {
                  console.error('❌ Failed to update tokens in database:', updateError);
                  googleConnectionError = `Token refresh failed. Please reconnect to continue.`;
                  isGoogleConnected = false;
                }
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
    let locations = [];
    if (isGoogleConnected) {
      // First get the account ID for the user
      if (accountId) {
        // For now, skip selected locations and just fetch all
        // TODO: Re-enable once selected_gbp_locations table is created
        const skipSelectedLocations = true;
        
        if (skipSelectedLocations) {
          // Temporarily fetch all locations
          const { data: locationData, error: locationsError } = await supabase
            .from('google_business_locations')
            .select('*')
            .eq('account_id', accountId);

          if (locationsError) {
            console.error('❌ Error fetching locations:', {
              error: locationsError.message,
              code: locationsError.code,
              userId: user.id
            });
          } else {
            if (locationData && locationData.length > 0) {
            }
            locations = locationData || [];
          }
        } else {
          // Fetch selected locations from database
          const { data: selectedLocationData, error: selectedError } = await supabase
            .from('selected_gbp_locations')
            .select('*')
            .eq('account_id', accountId);

          if (selectedError) {
            console.error('❌ Error fetching selected locations:', selectedError);
            locations = [];
          } else if (selectedLocationData && selectedLocationData.length > 0) {
            // Map selected locations to the expected format
            locations = selectedLocationData.map((loc: any) => ({
              location_id: loc.location_id,
              location_name: loc.location_name,
              address: loc.address,
              user_id: user.id
            }));
          } else {
            // No selected locations yet - return empty array to prompt selection
            locations = [];
          }
        }
      } else {
        // No account found, fallback to all locations
        const { data: locationData, error: locationsError } = await supabase
          .from('google_business_locations')
          .select('*')
          .eq('account_id', accountId);

        if (locationsError) {
          console.error('❌ Error fetching locations for account:', locationsError);
        } else {
          locations = locationData || [];
        }
      }
    }

    const platforms = [
      {
        id: 'google-business-profile',
        name: 'Google Business Profile',
        connected: isGoogleConnected,
        locations: locations,
        status: isGoogleConnected ? 'connected' : 'disconnected',
        connectedEmail: googleTokens?.google_email || null, // Show which Google account is connected
        ...(googleConnectionError && { error: googleConnectionError })
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
    
    // TODO: Implement postManager
    // const adapter = postManager.getAdapter(platformId);
    // if (!adapter) {
    //   return NextResponse.json(
    //     { success: false, error: 'Platform not found' },
    //     { status: 404 }
    //   );
    // }
    
    // TODO: Implement adapter functionality
    // let result = false;
    
    // switch (action) {
    //   case 'connect':
    //     result = await adapter.authenticate();
    //     break;
    //   case 'disconnect':
    //     // TODO: Implement disconnect logic
    //     break;
    //   case 'refresh':
    //     result = await adapter.refreshAuth();
    //     break;
    //   default:
    //     return NextResponse.json(
    //       { success: false, error: 'Invalid action' },
    //       { status: 400 }
    //     );
    // }
    
    // return NextResponse.json({
    //   success: result,
    //   data: {
    //     platformId,
    //     action,
    //     isConnected: adapter.isAuthenticated()
    //   }
    // });
    
    // Temporary response until adapter is implemented
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
