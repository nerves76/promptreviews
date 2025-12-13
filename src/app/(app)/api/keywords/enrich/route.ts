import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getKeywordMetrics } from '@/features/rank-tracking/api/dataforseo-serp-client';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/keywords/enrich
 *
 * Fetches SEO metrics (difficulty, intent, volume, etc.) from DataForSEO
 * for specified keywords and stores them in the database.
 *
 * Body:
 * - keywordIds: string[] (optional) - Specific keywords to enrich. If empty, enriches all.
 * - locationCode: number (optional) - Location for metrics lookup (default: 2840 = USA)
 * - forceRefresh: boolean (optional) - Re-fetch even if metrics exist (default: false)
 *
 * Returns:
 * - enriched: number - Count of keywords enriched
 * - skipped: number - Count skipped (already have recent metrics)
 * - failed: number - Count of failures
 * - cost: number - Estimated API cost
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      keywordIds = [],
      locationCode = 2840,
      forceRefresh = false,
    } = body;

    // Build query to get keywords
    let query = serviceSupabase
      .from('keywords')
      .select('id, phrase, search_query, metrics_updated_at')
      .eq('account_id', accountId)
      .eq('status', 'active');

    if (keywordIds.length > 0) {
      query = query.in('id', keywordIds);
    }

    // If not forcing refresh, skip keywords updated in the last 7 days
    if (!forceRefresh) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.or(`metrics_updated_at.is.null,metrics_updated_at.lt.${sevenDaysAgo.toISOString()}`);
    }

    const { data: keywords, error: fetchError } = await query.limit(50); // Max 50 at a time to avoid timeout

    if (fetchError) {
      console.error('❌ [Keywords] Failed to fetch keywords for enrichment:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: 500 }
      );
    }

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({
        enriched: 0,
        skipped: 0,
        failed: 0,
        message: 'No keywords need enrichment',
      });
    }

    console.log(`🔄 [Keywords] Enriching ${keywords.length} keywords with SEO metrics`);

    // Use search_query if available, otherwise use phrase
    const keywordPhrases = keywords.map((k) => k.search_query || k.phrase);

    // Fetch metrics from DataForSEO
    const metricsMap = await getKeywordMetrics({
      keywords: keywordPhrases,
      locationCode,
    });

    let enriched = 0;
    let failed = 0;

    // Update each keyword with its metrics
    for (const keyword of keywords) {
      const searchTerm = (keyword.search_query || keyword.phrase).toLowerCase();
      const metrics = metricsMap.get(searchTerm);

      if (metrics) {
        const { error: updateError } = await serviceSupabase
          .from('keywords')
          .update({
            search_intent: metrics.searchIntent,
            keyword_difficulty: metrics.keywordDifficulty,
            search_volume: metrics.searchVolume,
            cpc: metrics.cpc,
            competition_level: metrics.competitionLevel,
            low_top_of_page_bid: metrics.lowTopOfPageBid,
            high_top_of_page_bid: metrics.highTopOfPageBid,
            categories: metrics.categories,
            search_volume_trend: metrics.searchVolumeTrend,
            metrics_updated_at: new Date().toISOString(),
          })
          .eq('id', keyword.id);

        if (updateError) {
          console.error(`❌ [Keywords] Failed to update metrics for "${keyword.phrase}":`, updateError);
          failed++;
        } else {
          enriched++;
        }
      } else {
        console.log(`⚠️ [Keywords] No metrics found for "${keyword.phrase}"`);
        failed++;
      }
    }

    console.log(`✅ [Keywords] Enrichment complete: ${enriched} enriched, ${failed} failed`);

    return NextResponse.json({
      enriched,
      skipped: keywords.length - enriched - failed,
      failed,
      total: keywords.length,
    });
  } catch (error) {
    console.error('❌ [Keywords] Enrich POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/keywords/enrich
 *
 * Get count of keywords that need enrichment
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

    // Count keywords without recent metrics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: needsEnrichment } = await serviceSupabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('status', 'active')
      .or(`metrics_updated_at.is.null,metrics_updated_at.lt.${sevenDaysAgo.toISOString()}`);

    const { count: total } = await serviceSupabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('status', 'active');

    return NextResponse.json({
      needsEnrichment: needsEnrichment || 0,
      total: total || 0,
      hasMetrics: (total || 0) - (needsEnrichment || 0),
    });
  } catch (error) {
    console.error('❌ [Keywords] Enrich GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
