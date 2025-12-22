import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { checkRankForDomain } from '@/features/rank-tracking/api/dataforseo-serp-client';
import {
  getBalance,
  debit,
  ensureBalanceExists,
  InsufficientCreditsError,
} from '@/lib/credits';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Credit cost per keyword check
const CREDIT_COST_PER_KEYWORD = 1;

/**
 * POST /api/rank-tracking/check-keyword
 * Run manual rank check for a single keyword.
 *
 * Body:
 * - keyword: string (required) - The search term to check
 * - keywordId: string (optional) - The keyword concept ID to associate result with
 * - locationCode: number (optional) - Google location code (default: 2840 = USA)
 * - device: 'desktop' | 'mobile' (optional) - Device type (default: desktop)
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
    const { keyword, keywordId, locationCode = 2840, device = 'desktop' } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Get target domain from business profile
    const { data: business, error: businessError } = await serviceSupabase
      .from('businesses')
      .select('business_website')
      .eq('account_id', accountId)
      .single();

    if (businessError || !business?.business_website) {
      console.error('❌ [RankTracking] No business website found:', businessError);
      return NextResponse.json(
        { error: 'No target website found. Please set up your business profile first.' },
        { status: 400 }
      );
    }

    // Extract domain from website URL
    const targetDomain = extractDomain(business.business_website);
    if (!targetDomain) {
      return NextResponse.json(
        { error: 'Invalid website URL in business profile' },
        { status: 400 }
      );
    }

    // Ensure balance record exists
    await ensureBalanceExists(serviceSupabase, accountId);

    // Check if account has sufficient credits
    const balance = await getBalance(serviceSupabase, accountId);

    if (balance.totalCredits < CREDIT_COST_PER_KEYWORD) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: CREDIT_COST_PER_KEYWORD,
          available: balance.totalCredits,
        },
        { status: 402 }
      );
    }

    // Generate unique check ID for idempotency
    const checkId = `single-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = `rank_tracking_single:${accountId}:${checkId}`;

    // Debit credits
    console.log(`💳 [RankTracking] Debiting 1 credit for keyword check: "${keyword}"`);
    try {
      await debit(serviceSupabase, accountId, CREDIT_COST_PER_KEYWORD, {
        featureType: 'rank_tracking',
        featureMetadata: {
          keyword,
          keywordId,
          checkId,
          single: true,
        },
        idempotencyKey,
        description: `Rank check: "${keyword}"`,
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: error.required,
            available: error.available,
          },
          { status: 402 }
        );
      }
      throw error;
    }

    // Run rank check
    console.log(`🔍 [RankTracking] Checking rank for "${keyword}" on ${targetDomain}`);

    const rankResult = await checkRankForDomain({
      keyword,
      locationCode,
      targetDomain,
      device: device as 'desktop' | 'mobile',
      depth: 100,
    });

    // Store result if we have a keywordId
    if (keywordId) {
      // Look up location name from the rank_locations table
      let locationName = 'Unknown';
      const { data: locationData } = await serviceSupabase
        .from('rank_locations')
        .select('canonical_name')
        .eq('location_code', locationCode)
        .single();
      if (locationData) {
        locationName = locationData.canonical_name;
      }

      const { error: insertError } = await serviceSupabase
        .from('rank_checks')
        .insert({
          account_id: accountId,
          keyword_id: keywordId,
          search_query_used: keyword,
          location_code: locationCode,
          location_name: locationName,
          device,
          position: rankResult.position,
          found_url: rankResult.url,
          serp_features: extractSerpFeatures(rankResult.topCompetitors),
          top_competitors: rankResult.topCompetitors.slice(0, 10).map((c) => ({
            domain: c.domain,
            position: c.position,
            url: c.url,
            title: c.title,
          })),
          api_cost_usd: rankResult.cost,
        });

      if (insertError) {
        console.error('❌ [RankTracking] Failed to store check:', insertError);
      }
    }

    console.log(
      `${rankResult.found ? '✅' : '❌'} [RankTracking] "${keyword}": ${
        rankResult.found ? `#${rankResult.position}` : 'not found in top 100'
      }`
    );

    // Get updated balance
    const updatedBalance = await getBalance(serviceSupabase, accountId);

    return NextResponse.json({
      success: true,
      keyword,
      position: rankResult.position,
      found: rankResult.found,
      foundUrl: rankResult.url,
      topCompetitors: rankResult.topCompetitors.slice(0, 5),
      creditsUsed: CREDIT_COST_PER_KEYWORD,
      creditsRemaining: updatedBalance.totalCredits,
    });
  } catch (error) {
    console.error('❌ [RankTracking] Check keyword error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function extractSerpFeatures(competitors: any[]): Record<string, boolean> {
  const features: Record<string, boolean> = {
    featuredSnippet: false,
    mapPack: false,
    faq: false,
    images: false,
    videos: false,
  };

  for (const comp of competitors) {
    if (comp.serpFeatures) {
      if (comp.serpFeatures.featuredSnippet) features.featuredSnippet = true;
      if (comp.serpFeatures.mapPack) features.mapPack = true;
      if (comp.serpFeatures.faq) features.faq = true;
      if (comp.serpFeatures.images) features.images = true;
      if (comp.serpFeatures.videos) features.videos = true;
    }
  }

  return features;
}
