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

/**
 * API Route: GET /api/social-posting/platforms
 * Returns the status of connected social media platforms
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Social posting platforms API called');
    
    // Debug cookie information
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(cookie => cookie.name.startsWith('sb-'));
    
    console.log('🍪 Debug cookies info:', {
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      supabaseCookieNames: supabaseCookies.map(c => c.name),
      hasAuthCookie: allCookies.some(c => c.name.includes('access-token') || c.name.includes('auth-token')),
      requestCookieHeader: request.headers.get('cookie')?.includes('sb-') ? 'has sb cookies' : 'no sb cookies'
    });
    
    // Create server-side Supabase client that handles session cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const value = cookieStore.get(name)?.value;
            console.log(`🍪 Cookie get: ${name} = ${value ? 'present' : 'missing'}`);
            return value;
          },
          set: () => {},
          remove: () => {},
        },
      }
    );
    
    console.log('🔑 Attempting to get user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔑 Auth result:', { hasUser: !!user, error: authError?.message });
    
    if (authError || !user) {
      console.log('❌ Authentication error:', authError?.message || 'No user found');
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'User not authenticated'
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get account selection for user using correct table name
    console.log('🔍 Account selection debug for user:', user.id);
    let { data: accountsData, error: accountsError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        role,
        accounts (
          plan,
          first_name,
          last_name
        )
      `)
      .eq('user_id', user.id);

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
      return NextResponse.json({ 
        error: 'Account lookup failed',
        details: accountsError.message
      }, { status: 500 });
    }

    if (!accountsData || accountsData.length === 0) {
      console.log('❌ No account_users records found for user:', user.id);
      // Try fallback: check if user has direct account record
      const { data: directAccount, error: directError } = await supabase
        .from('accounts')
        .select('id, plan, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (directError || !directAccount) {
        console.log('❌ No direct account found either for user:', user.id);
        return NextResponse.json({ 
          error: 'Account setup incomplete',
          details: 'Please complete your account setup in the dashboard'
        }, { status: 404 });
      }

      // Use direct account as fallback
      accountsData = [{
        account_id: directAccount.id,
        role: 'owner',
        accounts: [{
          plan: directAccount.plan,
          first_name: directAccount.first_name,
          last_name: directAccount.last_name
        }]
      }];

      console.log('✅ Using fallback account for user:', user.id);
    }

    console.log('🔍 Found accounts:', accountsData?.map(acc => ({
      account_id: acc.account_id,
      role: acc.role,
      plan: acc.accounts?.[0]?.plan,
      first_name: acc.accounts?.[0]?.first_name,
      last_name: acc.accounts?.[0]?.last_name
    })));

    // Use the first owned account or fallback to the first account
    const ownedAccount = accountsData?.find(acc => acc.role === 'owner');
    const selectedAccount = ownedAccount || accountsData?.[0];
    const accountId = selectedAccount?.account_id;
    const accountPlan = selectedAccount?.accounts?.[0]?.plan;

    console.log(`🎯 Using ${ownedAccount ? 'owned' : 'first available'} account with plan: ${accountPlan}`);

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
    console.log('🔍 Checking for Google Business Profile tokens for user:', user.id);
    const { data: googleTokens, error: googleError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('🔍 Token query result:', {
      hasTokens: !!googleTokens,
      hasAccessToken: !!googleTokens?.access_token,
      hasRefreshToken: !!googleTokens?.refresh_token,
      tokenId: googleTokens?.id,
      userId: user.id,
      error: googleError?.message,
      errorCode: googleError?.code,
      timestamp: new Date().toISOString()
    });

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
      console.log('✅ Found valid Google Business Profile tokens for user:', user.id);
      console.log('🔍 Token details:', {
        hasAccessToken: !!googleTokens.access_token,
        hasRefreshToken: !!googleTokens.refresh_token,
        expiresAt: googleTokens.expires_at,
        isExpired: googleTokens.expires_at ? new Date(googleTokens.expires_at) < new Date() : 'unknown',
        createdAt: googleTokens.created_at,
        updatedAt: googleTokens.updated_at
      });
      
      // Check if tokens exist and are not expired (database-only check)
      try {
        const expiresAt = googleTokens.expires_at ? new Date(googleTokens.expires_at).getTime() : Date.now() + 3600000;
        const now = Date.now();
        
        if (expiresAt > now) {
          const remainingTime = Math.floor((expiresAt - now) / 1000 / 60);
          console.log(`✅ Google tokens valid for ${remainingTime} more minutes`);
          isGoogleConnected = true;
        } else {
          const expiredTime = Math.floor((now - expiresAt) / 1000 / 60);
          console.warn(`⚠️ Google tokens expired ${expiredTime} minutes ago`);
          
          // Try to refresh the token automatically if we have a refresh token
          if (googleTokens.refresh_token) {
            console.log('🔄 Attempting automatic token refresh...');
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
                console.log('✅ Token refreshed successfully');
                
                // Update tokens in database
                const { error: updateError } = await supabase
                  .from('google_business_profiles')
                  .update({
                    access_token: newTokens.access_token,
                    expires_at: new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', user.id);
                
                if (!updateError) {
                  console.log('✅ Updated tokens in database');
                  isGoogleConnected = true;
                  googleConnectionError = null;
                } else {
                  console.error('❌ Failed to update tokens in database:', updateError);
                  googleConnectionError = `Token refresh failed. Please reconnect to continue.`;
                  isGoogleConnected = false;
                }
              } else {
                console.log('❌ Token refresh returned no tokens');
                googleConnectionError = `Google Business Profile tokens expired ${expiredTime} minutes ago. Please reconnect to continue.`;
                isGoogleConnected = false;
              }
            } catch (refreshError: any) {
              console.error('❌ Token refresh failed:', refreshError.message);
              googleConnectionError = `Google Business Profile tokens expired. Automatic refresh failed. Please reconnect.`;
              isGoogleConnected = false;
            }
          } else {
            console.log('❌ No refresh token available');
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
      console.log('⚠️ Google Business Profile row exists but tokens are missing:', {
        hasRow: true,
        hasAccessToken: !!googleTokens.access_token,
        hasRefreshToken: !!googleTokens.refresh_token,
        userId: user.id
      });
      console.log('❌ Treating as disconnected due to missing tokens');
    } else {
      console.log('ℹ️ No Google Business Profile tokens found for user:', user.id);
    }

    // Check for Google Business Profile locations (only if connected)
    let locations = [];
    if (isGoogleConnected) {
      const { data: locationData, error: locationsError } = await supabase
        .from('google_business_locations')
        .select('*')
        .eq('user_id', user.id);

      if (locationsError) {
        console.error('❌ Error fetching locations:', {
          error: locationsError.message,
          code: locationsError.code,
          userId: user.id
        });
      } else {
        console.log(`✅ Found ${locationData?.length || 0} locations for user:`, user.id);
        if (locationData && locationData.length > 0) {
          console.log('📍 Location details:', locationData.map(loc => ({
            id: loc.location_id,
            name: loc.location_name,
            status: loc.status,
            lastFetched: loc.updated_at
          })));
        }
        locations = locationData || [];
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

    console.log('✅ Returning platforms:', platforms);
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