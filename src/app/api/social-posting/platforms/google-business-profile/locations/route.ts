/**
 * API Route: GET /api/social-posting/platforms/google-business-profile/locations
 * Returns Google Business Profile locations from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Authentication error in locations API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Google Business Profile tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('google_business_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokens) {
      return NextResponse.json({ 
        error: 'Google Business Profile not connected',
        locations: []
      });
    }

    // Get locations from database
    const { data: locations, error: locationError } = await supabase
      .from('google_business_locations')
      .select('*')
      .eq('user_id', user.id);

    if (locationError) {
      console.error('Error fetching locations:', locationError);
      return NextResponse.json({ 
        error: 'Failed to fetch locations',
        locations: []
      });
    }

    return NextResponse.json({
      data: {
        locations: locations || []
      }
    });

  } catch (error) {
    console.error('Error in locations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 