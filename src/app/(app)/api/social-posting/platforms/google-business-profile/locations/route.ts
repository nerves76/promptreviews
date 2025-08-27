/**
 * API Route: GET /api/social-posting/platforms/google-business-profile/locations
 * Returns Google Business Profile locations from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Authentication error in locations API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Check if user has Google Business Profile tokens using service role
    const { data: tokens, error: tokenError } = await serviceSupabase
      .from('google_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokenError || !tokens) {
      console.log('Google Business Profile tokens not found for user:', user.id, tokenError);
      return NextResponse.json({ 
        error: 'Google Business Profile not connected',
        locations: []
      });
    }

    console.log('✅ Found Google Business Profile tokens for user:', user.id);

    // Get locations from database using service role
    const { data: locations, error: locationError } = await serviceSupabase
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