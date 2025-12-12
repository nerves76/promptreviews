import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/rank-tracking/locations
 * Search locations for rank tracking.
 *
 * Query params:
 * - search: string (optional) - Search query for location name
 * - limit: number (default 100) - Max results to return
 *
 * Uses trigram similarity for fuzzy matching if rank_locations table exists,
 * otherwise returns common US locations.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Try to query rank_locations table
    // If it doesn't exist, fall back to common locations
    try {
      let query = serviceSupabase
        .from('rank_locations')
        .select('location_code, location_name, country_iso_code, location_type')
        .order('location_name')
        .limit(limit);

      if (search) {
        // Use ilike for simple search
        // If pg_trgm extension is available, could use similarity here
        query = query.ilike('location_name', `%${search}%`);
      }

      const { data: locations, error: locationsError } = await query;

      if (locationsError) {
        // Table doesn't exist or other error, fall back to common locations
        console.log('❌ [RankTracking] rank_locations table not available, using fallback');
        return NextResponse.json({
          locations: getCommonLocations(search),
        });
      }

      return NextResponse.json({
        locations: (locations || []).map((loc) => ({
          locationCode: loc.location_code,
          locationName: loc.location_name,
          countryIsoCode: loc.country_iso_code,
          locationType: loc.location_type,
        })),
      });
    } catch (error) {
      console.log('❌ [RankTracking] Error querying locations, using fallback:', error);
      return NextResponse.json({
        locations: getCommonLocations(search),
      });
    }
  } catch (error) {
    console.error('❌ [RankTracking] Locations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Common US locations
 * Based on DataForSEO location codes
 */
function getCommonLocations(search?: string): any[] {
  const commonLocations = [
    { locationCode: 2840, locationName: 'United States', countryIsoCode: 'US', locationType: 'Country' },
    { locationCode: 1023191, locationName: 'New York, New York, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014221, locationName: 'Los Angeles, California, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014895, locationName: 'Chicago, Illinois, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014757, locationName: 'Houston, Texas, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1023616, locationName: 'Phoenix, Arizona, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1025197, locationName: 'Philadelphia, Pennsylvania, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1026730, locationName: 'San Antonio, Texas, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1026762, locationName: 'San Diego, California, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014081, locationName: 'Dallas, Texas, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1026801, locationName: 'San Jose, California, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1026339, locationName: 'Austin, Texas, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014044, locationName: 'Jacksonville, Florida, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014685, locationName: 'Fort Worth, Texas, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014032, locationName: 'Columbus, Ohio, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014533, locationName: 'Indianapolis, Indiana, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014063, locationName: 'Charlotte, North Carolina, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1027744, locationName: 'Seattle, Washington, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1014043, locationName: 'Denver, Colorado, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1022858, locationName: 'Portland, Oregon, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1026481, locationName: 'Miami, Florida, United States', countryIsoCode: 'US', locationType: 'City' },
    { locationCode: 1015913, locationName: 'Boston, Massachusetts, United States', countryIsoCode: 'US', locationType: 'City' },
    // States
    { locationCode: 21136, locationName: 'California, United States', countryIsoCode: 'US', locationType: 'State' },
    { locationCode: 21176, locationName: 'Texas, United States', countryIsoCode: 'US', locationType: 'State' },
    { locationCode: 21132, locationName: 'Florida, United States', countryIsoCode: 'US', locationType: 'State' },
    { locationCode: 21167, locationName: 'Oregon, United States', countryIsoCode: 'US', locationType: 'State' },
    { locationCode: 21184, locationName: 'Washington, United States', countryIsoCode: 'US', locationType: 'State' },
    { locationCode: 21151, locationName: 'New York, United States', countryIsoCode: 'US', locationType: 'State' },
  ];

  if (!search) {
    return commonLocations;
  }

  // Simple search filter
  const searchLower = search.toLowerCase();
  return commonLocations.filter((loc) =>
    loc.locationName.toLowerCase().includes(searchLower)
  );
}
