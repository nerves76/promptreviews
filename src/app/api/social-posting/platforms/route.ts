/**
 * API Route: GET /api/social-posting/platforms
 * Returns the status of connected social media platforms
 * Fixed to handle cookies properly in Next.js 15
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user using getUser() for better reliability
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Authentication error:', userError?.message || 'No user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Check for Google Business Profile connection - use correct table name
    const { data: googleTokens, error: googleError } = await supabase
      .from('google_business_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (googleError && googleError.code !== 'PGRST116') {
      console.log('❌ Error fetching Google tokens:', googleError);
    }

    // Check for Google Business Profile locations
    const { data: locations, error: locationsError } = await supabase
      .from('google_business_locations')
      .select('*')
      .eq('user_id', user.id);

    if (locationsError) {
      console.log('❌ Error fetching locations:', locationsError);
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
    
    const adapter = postManager.getAdapter(platformId);
    if (!adapter) {
      return NextResponse.json(
        { success: false, error: 'Platform not found' },
        { status: 404 }
      );
    }
    
    let result = false;
    
    switch (action) {
      case 'connect':
        result = await adapter.authenticate();
        break;
      case 'disconnect':
        // TODO: Implement disconnect logic
        break;
      case 'refresh':
        result = await adapter.refreshAuth();
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: result,
      data: {
        platformId,
        action,
        isConnected: adapter.isAuthenticated()
      }
    });
  } catch (error) {
    console.error('Error managing platform:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage platform' },
      { status: 500 }
    );
  }
} 