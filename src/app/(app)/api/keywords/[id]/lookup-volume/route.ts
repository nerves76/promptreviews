import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  getKeywordVolume,
  getKeywordSuggestions,
} from '@/features/rank-tracking/api/dataforseo-serp-client';
import { transformKeywordToResponse } from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limit: 50 discovery requests per day per account
const DAILY_DISCOVERY_LIMIT = 50;

// US State to DataForSEO location code mapping
const US_STATE_LOCATION_CODES: Record<string, { code: number; name: string }> = {
  'AL': { code: 21114, name: 'Alabama, United States' },
  'AK': { code: 21113, name: 'Alaska, United States' },
  'AZ': { code: 21116, name: 'Arizona, United States' },
  'AR': { code: 21115, name: 'Arkansas, United States' },
  'CA': { code: 21136, name: 'California, United States' },
  'CO': { code: 21120, name: 'Colorado, United States' },
  'CT': { code: 21121, name: 'Connecticut, United States' },
  'DE': { code: 21124, name: 'Delaware, United States' },
  'FL': { code: 21132, name: 'Florida, United States' },
  'GA': { code: 21133, name: 'Georgia, United States' },
  'HI': { code: 21137, name: 'Hawaii, United States' },
  'ID': { code: 21138, name: 'Idaho, United States' },
  'IL': { code: 21139, name: 'Illinois, United States' },
  'IN': { code: 21140, name: 'Indiana, United States' },
  'IA': { code: 21141, name: 'Iowa, United States' },
  'KS': { code: 21142, name: 'Kansas, United States' },
  'KY': { code: 21143, name: 'Kentucky, United States' },
  'LA': { code: 21144, name: 'Louisiana, United States' },
  'ME': { code: 21146, name: 'Maine, United States' },
  'MD': { code: 21147, name: 'Maryland, United States' },
  'MA': { code: 21148, name: 'Massachusetts, United States' },
  'MI': { code: 21149, name: 'Michigan, United States' },
  'MN': { code: 21150, name: 'Minnesota, United States' },
  'MS': { code: 21152, name: 'Mississippi, United States' },
  'MO': { code: 21153, name: 'Missouri, United States' },
  'MT': { code: 21154, name: 'Montana, United States' },
  'NE': { code: 21158, name: 'Nebraska, United States' },
  'NV': { code: 21159, name: 'Nevada, United States' },
  'NH': { code: 21160, name: 'New Hampshire, United States' },
  'NJ': { code: 21161, name: 'New Jersey, United States' },
  'NM': { code: 21162, name: 'New Mexico, United States' },
  'NY': { code: 21151, name: 'New York, United States' },
  'NC': { code: 21163, name: 'North Carolina, United States' },
  'ND': { code: 21164, name: 'North Dakota, United States' },
  'OH': { code: 21165, name: 'Ohio, United States' },
  'OK': { code: 21166, name: 'Oklahoma, United States' },
  'OR': { code: 21167, name: 'Oregon, United States' },
  'PA': { code: 21168, name: 'Pennsylvania, United States' },
  'RI': { code: 21170, name: 'Rhode Island, United States' },
  'SC': { code: 21171, name: 'South Carolina, United States' },
  'SD': { code: 21172, name: 'South Dakota, United States' },
  'TN': { code: 21173, name: 'Tennessee, United States' },
  'TX': { code: 21176, name: 'Texas, United States' },
  'UT': { code: 21178, name: 'Utah, United States' },
  'VT': { code: 21179, name: 'Vermont, United States' },
  'VA': { code: 21180, name: 'Virginia, United States' },
  'WA': { code: 21184, name: 'Washington, United States' },
  'WV': { code: 21186, name: 'West Virginia, United States' },
  'WI': { code: 21187, name: 'Wisconsin, United States' },
  'WY': { code: 21188, name: 'Wyoming, United States' },
  'DC': { code: 21127, name: 'District of Columbia, United States' },
};

// Common country codes for non-US businesses
const COUNTRY_LOCATION_CODES: Record<string, { code: number; name: string }> = {
  'US': { code: 2840, name: 'United States' },
  'GB': { code: 2826, name: 'United Kingdom' },
  'CA': { code: 2124, name: 'Canada' },
  'AU': { code: 2036, name: 'Australia' },
  'DE': { code: 2276, name: 'Germany' },
  'FR': { code: 2250, name: 'France' },
  'NZ': { code: 2554, name: 'New Zealand' },
  'IE': { code: 2372, name: 'Ireland' },
};

/**
 * Get default location based on business address
 * Returns state-level location for US, country-level for others
 */
async function getDefaultLocation(accountId: string): Promise<{ code: number; name: string }> {
  try {
    // Get business address from account
    const { data: businesses } = await serviceSupabase
      .from('businesses')
      .select('address_state, address_country')
      .eq('account_id', accountId)
      .limit(1);

    const business = businesses?.[0];

    if (business?.address_state) {
      // Try to map state to location code
      const stateUpper = business.address_state.toUpperCase().trim();

      // Check if it's a state abbreviation (2 chars)
      if (stateUpper.length === 2 && US_STATE_LOCATION_CODES[stateUpper]) {
        return US_STATE_LOCATION_CODES[stateUpper];
      }

      // Check if it's a full state name
      const stateEntry = Object.entries(US_STATE_LOCATION_CODES).find(
        ([, value]) => value.name.toLowerCase().startsWith(stateUpper.toLowerCase())
      );
      if (stateEntry) {
        return stateEntry[1];
      }
    }

    // Check country
    if (business?.address_country) {
      const countryUpper = business.address_country.toUpperCase().trim();
      if (COUNTRY_LOCATION_CODES[countryUpper]) {
        return COUNTRY_LOCATION_CODES[countryUpper];
      }
    }

    // Default to USA
    return { code: 2840, name: 'United States' };
  } catch (error) {
    console.warn('Failed to get default location:', error);
    return { code: 2840, name: 'United States' };
  }
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/keywords/[id]/lookup-volume
 * Look up search volume for a keyword and save the results.
 *
 * Body:
 * - locationCode?: number (default: 2840 = USA)
 * - includeSuggestions?: boolean (default: true)
 *
 * Returns the updated keyword with search volume data and optionally related keywords.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get keyword with existing location data
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, search_query, account_id, search_volume_location_code, search_volume_location_name')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { includeSuggestions = true } = body;

    // Determine location to use (priority order):
    // 1. Concept's existing location (if set)
    // 2. Explicitly provided location in request
    // 3. Default from business address
    let locationCode: number;
    let locationName: string;

    if (keyword.search_volume_location_code && keyword.search_volume_location_name) {
      // Use concept's existing location
      locationCode = keyword.search_volume_location_code;
      locationName = keyword.search_volume_location_name;
      console.log(`📍 [Keywords] Using concept location: ${locationName} (${locationCode})`);
    } else if (body.locationCode && body.locationName) {
      // Use explicitly provided location
      locationCode = body.locationCode;
      locationName = body.locationName;
    } else {
      // Get default from business address (state level)
      const defaultLocation = await getDefaultLocation(accountId);
      locationCode = defaultLocation.code;
      locationName = defaultLocation.name;
    }

    console.log(`📍 [Keywords] Using location: ${locationName} (${locationCode})`);

    // Check rate limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const { data: usage } = await serviceSupabase
      .from('rank_discovery_usage')
      .select('*')
      .eq('account_id', accountId)
      .eq('usage_date', todayStr)
      .single();

    const currentUsage = usage?.request_count || 0;

    if (currentUsage >= DAILY_DISCOVERY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily keyword research limit reached. Try again tomorrow.',
          limit: DAILY_DISCOVERY_LIMIT,
          used: currentUsage,
          resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { status: 429 }
      );
    }

    // Use search_query if available, otherwise fall back to phrase
    const searchTerm = keyword.search_query || keyword.phrase;

    console.log(`🔍 [Keywords] Volume lookup for "${searchTerm}" (keyword: ${id})`);

    // Fetch volume data
    const volumeResults = await getKeywordVolume({
      keywords: [searchTerm],
      locationCode,
    });

    const volumeData = volumeResults[0] || {
      keyword: searchTerm,
      searchVolume: 0,
      cpc: null,
      competition: null,
      competitionLevel: null,
      monthlySearches: [],
    };

    // Build trend data from monthly searches
    let trendData: Record<string, unknown> | null = null;
    if (volumeData.monthlySearches && volumeData.monthlySearches.length > 0) {
      const monthlyData = volumeData.monthlySearches.map(m => ({
        month: m.month,
        year: m.year,
        volume: m.searchVolume,
      }));

      // Calculate trend percentages
      const recent3 = monthlyData.slice(-3);
      const older3 = monthlyData.slice(-6, -3);
      const older12 = monthlyData.slice(0, -3);

      const avgRecent = recent3.length > 0
        ? recent3.reduce((sum, m) => sum + m.volume, 0) / recent3.length
        : 0;
      const avgOlder3 = older3.length > 0
        ? older3.reduce((sum, m) => sum + m.volume, 0) / older3.length
        : avgRecent;
      const avgOlder12 = older12.length > 0
        ? older12.reduce((sum, m) => sum + m.volume, 0) / older12.length
        : avgRecent;

      trendData = {
        monthly: avgOlder3 > 0 ? Math.round(((avgRecent - avgOlder3) / avgOlder3) * 100) : 0,
        quarterly: avgOlder3 > 0 ? Math.round(((avgRecent - avgOlder3) / avgOlder3) * 100) : 0,
        yearly: avgOlder12 > 0 ? Math.round(((avgRecent - avgOlder12) / avgOlder12) * 100) : 0,
        monthlyData,
      };
    }

    // Update keyword with volume data and location
    const { data: updatedKeyword, error: updateError } = await serviceSupabase
      .from('keywords')
      .update({
        search_volume: volumeData.searchVolume,
        cpc: volumeData.cpc,
        competition_level: volumeData.competitionLevel,
        search_volume_trend: trendData,
        search_volume_location_code: locationCode,
        search_volume_location_name: locationName,
        metrics_updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        id,
        phrase,
        normalized_phrase,
        word_count,
        status,
        review_usage_count,
        last_used_in_review_at,
        group_id,
        created_at,
        updated_at,
        review_phrase,
        search_query,
        aliases,
        location_scope,
        ai_generated,
        ai_suggestions,
        related_questions,
        search_volume,
        cpc,
        competition_level,
        search_volume_trend,
        search_volume_location_code,
        search_volume_location_name,
        metrics_updated_at,
        keyword_groups (
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Failed to update keyword with volume:', updateError);
      return NextResponse.json(
        { error: 'Failed to save volume data' },
        { status: 500 }
      );
    }

    // Increment usage counter
    await serviceSupabase
      .from('rank_discovery_usage')
      .upsert(
        {
          account_id: accountId,
          usage_date: todayStr,
          request_count: currentUsage + 1,
        },
        { onConflict: 'account_id,usage_date' }
      );

    // Get suggestions if requested
    let suggestions: Array<{
      keyword: string;
      volume: number;
      cpc: number | null;
      competitionLevel: string | null;
    }> = [];

    if (includeSuggestions) {
      try {
        const suggestionsResult = await getKeywordSuggestions({
          seedKeyword: searchTerm,
          locationCode,
          limit: 10,
        });

        suggestions = suggestionsResult.map(s => ({
          keyword: s.keyword,
          volume: s.searchVolume,
          cpc: s.cpc,
          competitionLevel: s.competitionLevel,
        }));

        // Increment usage for suggestions call
        await serviceSupabase
          .from('rank_discovery_usage')
          .upsert(
            {
              account_id: accountId,
              usage_date: todayStr,
              request_count: currentUsage + 2,
            },
            { onConflict: 'account_id,usage_date' }
          );
      } catch (err) {
        console.warn('Failed to get suggestions:', err);
        // Continue without suggestions
      }
    }

    console.log(`✅ [Keywords] Volume lookup complete. Volume: ${volumeData.searchVolume}`);

    return NextResponse.json({
      keyword: transformKeywordToResponse(updatedKeyword, (updatedKeyword as any).keyword_groups?.name),
      suggestions,
      rateLimit: {
        limit: DAILY_DISCOVERY_LIMIT,
        used: currentUsage + (includeSuggestions ? 2 : 1),
        remaining: DAILY_DISCOVERY_LIMIT - currentUsage - (includeSuggestions ? 2 : 1),
      },
    });
  } catch (error: any) {
    console.error('❌ [Keywords] Volume lookup error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
