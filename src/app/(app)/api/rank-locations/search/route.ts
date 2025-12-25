import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';

/**
 * Search rank_locations table for typeahead autocomplete
 * GET /api/rank-locations/search?q=portland
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ locations: [] });
    }

    // Search canonical_name with ILIKE for fuzzy matching
    // Order by: Cities first, then by relevance (shorter names tend to be more specific)
    const { data: locations, error } = await supabase
      .from('rank_locations')
      .select('location_code, canonical_name, location_type')
      .ilike('canonical_name', `%${query}%`)
      .order('location_type', { ascending: false }) // City > State > Country
      .order('canonical_name', { ascending: true })
      .limit(15);

    if (error) {
      console.error('Error searching rank_locations:', error);
      return NextResponse.json({ error: 'Failed to search locations' }, { status: 500 });
    }

    return NextResponse.json({
      locations: locations.map(loc => ({
        locationCode: loc.location_code,
        locationName: loc.canonical_name,
        locationType: loc.location_type,
      }))
    });
  } catch (error) {
    console.error('Error in rank-locations search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
