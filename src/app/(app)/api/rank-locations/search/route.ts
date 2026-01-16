import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';

// Only include these location types in search results
// Excludes University, Airport, and other non-geographic targeting types
const ALLOWED_LOCATION_TYPES = ['Country', 'State', 'City', 'DMA Region', 'Province'];

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

    // Search for locations using two queries to ensure countries/states appear first
    // Query 1: Get exact or starts-with matches on location_name (prioritizes countries/states)
    const { data: exactMatches, error: exactError } = await supabase
      .from('rank_locations')
      .select('location_code, canonical_name, location_type, location_name')
      .or(`location_name.ilike.${query},location_name.ilike.${query}%`)
      .in('location_type', ALLOWED_LOCATION_TYPES)
      .limit(10);

    // Query 2: Get matches on canonical_name for cities (fuzzy match)
    const { data: fuzzyMatches, error: fuzzyError } = await supabase
      .from('rank_locations')
      .select('location_code, canonical_name, location_type, location_name')
      .ilike('canonical_name', `%${query}%`)
      .in('location_type', ALLOWED_LOCATION_TYPES)
      .order('canonical_name', { ascending: true })
      .limit(30);

    const error = exactError || fuzzyError;

    // Combine and dedupe results, prioritizing exact matches
    const seenCodes = new Set<number>();
    const locations: typeof exactMatches = [];

    // Add exact matches first
    (exactMatches || []).forEach(loc => {
      if (!seenCodes.has(loc.location_code)) {
        seenCodes.add(loc.location_code);
        locations.push(loc);
      }
    });

    // Add fuzzy matches
    (fuzzyMatches || []).forEach(loc => {
      if (!seenCodes.has(loc.location_code)) {
        seenCodes.add(loc.location_code);
        locations.push(loc);
      }
    });

    if (error) {
      console.error('Error searching rank_locations:', error);
      return NextResponse.json({ error: 'Failed to search locations' }, { status: 500 });
    }

    // Type priority: Country > State/Province > DMA Region > City
    const getTypePriority = (type: string): number => {
      switch (type) {
        case 'Country': return 0;
        case 'State': return 1;
        case 'Province': return 1;
        case 'DMA Region': return 2;
        case 'City': return 3;
        default: return 4;
      }
    };

    // Sort results to prioritize:
    // 1. Exact name matches (e.g., "United States" when searching "United States")
    // 2. Location type (Country > State > City)
    // 3. Name starts with query (e.g., "Portland" when searching "Port")
    // 4. Everything else alphabetically
    const sortedLocations = (locations || []).sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aNameLower = a.location_name.toLowerCase();
      const bNameLower = b.location_name.toLowerCase();
      const aCanonicalLower = a.canonical_name.toLowerCase();
      const bCanonicalLower = b.canonical_name.toLowerCase();

      // Exact name match gets highest priority
      const aExact = aNameLower === queryLower;
      const bExact = bNameLower === queryLower;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;

      // Name starts with query gets next priority
      const aStarts = aNameLower.startsWith(queryLower);
      const bStarts = bNameLower.startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      // Type priority (Country > State > City)
      const aTypePriority = getTypePriority(a.location_type);
      const bTypePriority = getTypePriority(b.location_type);
      if (aTypePriority !== bTypePriority) return aTypePriority - bTypePriority;

      // Canonical name starts with query
      const aCanonicalStarts = aCanonicalLower.startsWith(queryLower);
      const bCanonicalStarts = bCanonicalLower.startsWith(queryLower);
      if (aCanonicalStarts && !bCanonicalStarts) return -1;
      if (bCanonicalStarts && !aCanonicalStarts) return 1;

      // Fall back to alphabetical order
      return a.canonical_name.localeCompare(b.canonical_name);
    });

    return NextResponse.json({
      locations: sortedLocations.slice(0, 15).map(loc => ({
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
