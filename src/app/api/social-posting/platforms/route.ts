/**
 * API Route: GET /api/social-posting/platforms
 * Returns the status of connected social media platforms
 * Fixed to handle cookies properly in Next.js 15
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
    
    // Get cookies properly for Next.js 15
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
    
    // 🔧 ENHANCED FIX: More robust authentication with session refresh
    let user = null;
    let userError = null;
    let retryCount = 0;
    const maxRetries = 8; // Increased retries for more reliability
    
    while (retryCount < maxRetries) {
      try {
        // Step 1: Try to refresh the session first to ensure it's valid
        const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshResult.session?.user && !refreshError) {
          user = refreshResult.session.user;
          console.log(`✅ Session refresh successful on attempt ${retryCount + 1}`);
          break;
        }
        
        // Step 2: Try getUser() if refresh didn't work
        const { data: { user: userResult }, error: authError } = await supabase.auth.getUser();
        
        if (userResult && !authError) {
          user = userResult;
          userError = null;
          console.log(`✅ Authentication successful on attempt ${retryCount + 1}`);
          break;
        }
        
        // Step 3: If getUser() fails, try getSession() as fallback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user && !sessionError) {
          user = session.user;
          userError = null;
          console.log(`✅ Session authentication successful on attempt ${retryCount + 1}`);
          break;
        }
        
        // Check for timing-related errors (common after OAuth redirects)
        const isTimingError = (authError || sessionError) && (
          (authError?.message?.includes('User from sub claim in JWT does not exist')) ||
          (sessionError?.message?.includes('User from sub claim in JWT does not exist')) ||
          (authError?.message?.includes('JWT')) ||
          (sessionError?.message?.includes('JWT')) ||
          (authError?.message?.includes('session')) ||
          (authError?.code === 'PGRST301') ||
          (sessionError?.code === 'PGRST301') ||
          !authError?.message // Sometimes the error is just empty
        );
        
        if ((isTimingError || retryCount < 6) && retryCount < maxRetries - 1) {
          console.log(`🔄 Social posting API retry ${retryCount + 1}/${maxRetries} - Post-OAuth session timing issue, retrying...`);
          retryCount++;
          // Progressive backoff with longer delays for OAuth scenarios
          const delay = retryCount <= 3 ? 800 : 1200 + (retryCount * 400);
          await new Promise(resolve => setTimeout(resolve, delay)); 
          continue;
        }
        
        // For other errors or max retries reached, break
        userError = authError || sessionError || refreshError;
        console.log(`❌ Authentication failed after ${retryCount + 1} attempts:`, userError?.message);
        break;
        
      } catch (err) {
        console.log(`❌ Social posting API retry ${retryCount + 1}/${maxRetries} - Unexpected error:`, err);
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = 800 + (retryCount * 400);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        userError = err;
        break;
      }
    }
    
    if (userError || !user) {
      console.log('❌ Authentication error:', (userError as any)?.message || 'No user found');
      return NextResponse.json({ 
        error: 'Authentication required',
        details: (userError as any)?.message,
        retryAfter: 3 // Suggest frontend retry after 3 seconds
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Create service role client for accessing OAuth tokens (bypasses RLS)
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Check for Google Business Profile connection using service role
    const { data: googleTokens, error: googleError } = await serviceSupabase
      .from('google_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (googleError) {
      console.log('❌ Error fetching Google tokens:', googleError);
    } else if (googleTokens) {
      console.log('✅ Found Google Business Profile tokens for user:', user.id);
    } else {
      console.log('ℹ️ No Google Business Profile tokens found for user:', user.id);
    }

    // Check for Google Business Profile locations using service role
    const { data: locations, error: locationsError } = await serviceSupabase
      .from('google_business_locations')
      .select('*')
      .eq('user_id', user.id);

    if (locationsError) {
      console.log('❌ Error fetching locations:', locationsError);
    } else {
      console.log(`✅ Found ${locations?.length || 0} locations for user:`, user.id);
    }

    const platforms = [
      {
        id: 'google-business-profile',
        name: 'Google Business Profile',
        connected: !!googleTokens,
        locations: locations || [],
        status: googleTokens ? 'connected' : 'disconnected'
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