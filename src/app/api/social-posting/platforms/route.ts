/**
 * API Route: GET /api/social-posting/platforms
 * Returns the status of connected social media platforms
 * Simplified authentication to match widgets API pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAccountIdForUser } from '@/utils/accountUtils';

// Initialize Supabase client with service key for privileged operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API Route: GET /api/social-posting/platforms
 * Returns the status of connected social media platforms
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Social posting platforms API called');
    
    // Get user from request headers (same pattern as widgets API)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'No authorization header provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify user token using service client
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log('❌ Authentication error:', authError?.message || 'No user found');
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'Invalid token'
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get account ID for user
    const accountId = await getAccountIdForUser(user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ 
        error: 'Account not found',
        details: 'No account found for user'
      }, { status: 404 });
    }

    // Check for Google Business Profile connection using service role
    const { data: googleTokens, error: googleError } = await supabase
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
    const { data: locations, error: locationsError } = await supabase
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