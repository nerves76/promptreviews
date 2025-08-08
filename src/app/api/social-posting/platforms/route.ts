/**
 * API Route: GET /api/social-posting/platforms
 * Returns the status of connected social media platforms
 * Uses browser session authentication with cookies
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
    
    // Simple test to verify the route is working
    return NextResponse.json({ 
      message: 'API route is working',
      timestamp: new Date().toISOString(),
      platforms: []
    });
    
    // Temporarily disable authentication for debugging
    /*
    console.log('📝 Request cookies:', request.headers.get('cookie')?.includes('sb-') ? 'has supabase cookies' : 'no supabase cookies');
    
    // Create server-side Supabase client that handles session cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value;
            console.log(`🍪 Cookie ${name}: ${value ? 'exists' : 'missing'}`);
            return value;
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
    
    let { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Fallback: try authorization header if cookie-based auth fails
    if ((authError || !user) && request.headers.get('authorization')) {
      console.log('🔄 Cookie auth failed, trying Authorization header...');
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        // Create a new Supabase client with the token
        const tokenBasedSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return cookieStore.get(name)?.value;
              },
              set: (name, value, options) => {
                cookieStore.set({ name, value, ...options });
              },
              remove: (name, options) => {
                cookieStore.set({ name, value: '', ...options });
              },
            },
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        );
        
        const tokenResult = await tokenBasedSupabase.auth.getUser();
        user = tokenResult.data.user;
        authError = tokenResult.error;
        console.log('🔄 Authorization header result:', user ? 'success' : 'failed');
      }
    }
    
    if (authError || !user) {
      console.log('❌ Authentication error:', authError?.message || 'No user found');
      console.log('🍪 Available cookies:', Object.keys(Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value]))));
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'User not authenticated'
      }, { status: 401 });
    }
    */

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

    // Check for Google Business Profile connection and validate tokens
    const { data: googleTokens, error: googleError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let isGoogleConnected = false;
    let googleConnectionError = null;

    if (googleError) {
      console.log('❌ Error fetching Google tokens:', googleError);
    } else if (googleTokens) {
      console.log('✅ Found Google Business Profile tokens for user:', user.id);
      
      // Check if tokens exist and are not expired (database-only check)
      try {
        const expiresAt = googleTokens.expires_at ? new Date(googleTokens.expires_at).getTime() : Date.now() + 3600000;
        const now = Date.now();
        
        if (expiresAt > now) {
          console.log('✅ Google tokens appear valid based on expiry time');
          isGoogleConnected = true;
        } else {
          console.log('⚠️ Google tokens appear expired based on expiry time');
          googleConnectionError = 'Google Business Profile tokens may be expired. Try reconnecting if posting fails.';
          isGoogleConnected = true; // Still show as connected, but with warning
        }
      } catch (error: any) {
        console.error('❌ Error checking Google token expiry:', error);
        googleConnectionError = 'Error checking Google Business Profile connection.';
        isGoogleConnected = false;
      }
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
        console.log('❌ Error fetching locations:', locationsError);
      } else {
        console.log(`✅ Found ${locationData?.length || 0} locations for user:`, user.id);
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