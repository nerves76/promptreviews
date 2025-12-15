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

    // Get keyword
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, search_query, account_id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { locationCode = 2840, includeSuggestions = true } = body;

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

    // Update keyword with volume data
    const { data: updatedKeyword, error: updateError } = await serviceSupabase
      .from('keywords')
      .update({
        search_volume: volumeData.searchVolume,
        cpc: volumeData.cpc,
        competition_level: volumeData.competitionLevel,
        search_volume_trend: trendData,
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
