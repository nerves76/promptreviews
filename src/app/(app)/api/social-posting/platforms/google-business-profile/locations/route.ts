/**
 * API Route: GET /api/social-posting/platforms/google-business-profile/locations
 * Returns Google Business Profile locations from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found', locations: [] }, { status: 404 });
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
      .eq('account_id', accountId)
      .maybeSingle();

    if (tokenError || !tokens) {
      return NextResponse.json({ 
        error: 'Google Business Profile not connected',
        locations: []
      });
    }


    // Get locations from database using service role
    // Include google_place_id, lat, lng for geo-grid tracking
    const { data: locations, error: locationError } = await serviceSupabase
      .from('google_business_locations')
      .select('id, user_id, location_id, location_name, account_name, address, status, primary_phone, website_uri, google_place_id, lat, lng, created_at, updated_at')
      .eq('account_id', accountId);

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
