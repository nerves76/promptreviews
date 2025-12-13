import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { checkRankForDomain } from '@/features/rank-tracking/api/dataforseo-serp-client';
import {
  getBalance,
  debit,
  refundFeature,
  ensureBalanceExists,
  InsufficientCreditsError,
} from '@/lib/credits';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Credit cost per keyword check (simple: 1 credit per keyword)
const CREDIT_COST_PER_KEYWORD = 1;

/**
 * POST /api/rank-tracking/check
 * Run manual rank check for a group.
 *
 * Body:
 * - groupId: string (required) - Group to check
 *
 * Flow:
 * 1. Auth + account isolation
 * 2. Get group + keywords
 * 3. Get target domain from account/business
 * 4. Calculate credit cost
 * 5. Check balance (402 if insufficient)
 * 6. Debit with idempotency key
 * 7. Call DataForSEO for each keyword
 * 8. Store results
 * 9. Refund on failure
 * 10. Return results + updated balance
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
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Get group details
    const { data: group, error: groupError } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('*')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (groupError || !group) {
      console.error('❌ [RankTracking] Failed to fetch group:', groupError);
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (!group.is_enabled) {
      return NextResponse.json(
        { error: 'Rank tracking is disabled for this group' },
        { status: 400 }
      );
    }

    // Get keywords to check
    const { data: groupKeywords, error: keywordsError } = await serviceSupabase
      .from('rank_group_keywords')
      .select(`
        *,
        keywords (
          id,
          phrase,
          search_query
        )
      `)
      .eq('group_id', groupId)
      .eq('is_enabled', true);

    if (keywordsError) {
      console.error('❌ [RankTracking] Failed to fetch keywords:', keywordsError);
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: 500 }
      );
    }

    if (!groupKeywords || groupKeywords.length === 0) {
      return NextResponse.json(
        { error: 'No keywords found. Add keywords to track first.' },
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

    // Calculate credit cost
    const keywordCount = groupKeywords.length;
    const creditCost = keywordCount * CREDIT_COST_PER_KEYWORD;

    // Ensure balance record exists
    await ensureBalanceExists(serviceSupabase, accountId);

    // Check if account has sufficient credits
    const balance = await getBalance(serviceSupabase, accountId);

    if (balance.totalCredits < creditCost) {
      console.log(
        `❌ [RankTracking] Insufficient credits for account ${accountId}: need ${creditCost}, have ${balance.totalCredits}`
      );
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditCost,
          available: balance.totalCredits,
        },
        { status: 402 } // Payment Required
      );
    }

    // Generate unique check ID for idempotency
    const checkId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = `rank_tracking:${accountId}:${checkId}`;

    // Debit credits before running checks
    console.log(
      `💳 [RankTracking] Debiting ${creditCost} credits for account ${accountId} (${keywordCount} keywords)`
    );
    try {
      await debit(serviceSupabase, accountId, creditCost, {
        featureType: 'rank_tracking',
        featureMetadata: {
          groupId,
          keywordCount,
          checkId,
        },
        idempotencyKey,
        description: `Rank tracking check: ${group.name}, ${keywordCount} keywords`,
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

    // Run rank checks
    console.log(`🔄 [RankTracking] Starting check for group: ${group.name} (${groupId})`);
    console.log(`   Keywords: ${keywordCount}, Domain: ${targetDomain}`);
    console.log(`   Location: ${group.location_name} (${group.location_code}), Device: ${group.device}`);

    const results: any[] = [];
    const errors: string[] = [];
    let totalApiCost = 0;
    let checksPerformed = 0;

    for (const gk of groupKeywords) {
      const keyword = gk.keywords as any;
      const searchQuery = keyword.search_query || keyword.phrase;

      try {
        console.log(`   🔍 Checking "${searchQuery}"...`);

        const rankResult = await checkRankForDomain({
          keyword: searchQuery,
          locationCode: group.location_code,
          targetDomain,
          device: group.device as 'desktop' | 'mobile',
          depth: 100,
        });

        totalApiCost += rankResult.cost;

        // Check if found URL matches target URL (if specified)
        let matchedTargetUrl = null;
        if (gk.target_url && rankResult.url) {
          matchedTargetUrl = normalizeUrl(rankResult.url) === normalizeUrl(gk.target_url);
        }

        // Store result in database
        const { data: check, error: insertError } = await serviceSupabase
          .from('rank_checks')
          .insert({
            account_id: accountId,
            group_id: groupId,
            keyword_id: gk.keyword_id,
            search_query_used: searchQuery,
            position: rankResult.position,
            found_url: rankResult.url,
            matched_target_url: matchedTargetUrl,
            serp_features: extractSerpFeatures(rankResult.topCompetitors),
            top_competitors: rankResult.topCompetitors.map((c) => ({
              domain: c.domain,
              position: c.position,
              url: c.url,
              title: c.title,
            })),
            api_cost_usd: rankResult.cost,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`   ❌ Failed to store check for "${searchQuery}":`, insertError);
          errors.push(`Failed to store check for "${searchQuery}"`);
        } else {
          checksPerformed++;
          results.push({
            keywordId: gk.keyword_id,
            phrase: keyword.phrase,
            searchQuery,
            position: rankResult.position,
            foundUrl: rankResult.url,
            found: rankResult.found,
            matchedTargetUrl,
          });

          console.log(
            `   ${rankResult.found ? '✅' : '❌'} "${searchQuery}": ${
              rankResult.found ? `#${rankResult.position}` : 'not found'
            }`
          );
        }
      } catch (error) {
        console.error(`   ❌ Error checking "${searchQuery}":`, error);
        errors.push(`Error checking "${searchQuery}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update group's last_checked_at
    await serviceSupabase
      .from('rank_keyword_groups')
      .update({
        last_checked_at: new Date().toISOString(),
        last_scheduled_run_at: new Date().toISOString(),
      })
      .eq('id', groupId);

    console.log(
      `✅ [RankTracking] Check complete. ${checksPerformed} keywords checked, API cost: $${totalApiCost.toFixed(4)}`
    );

    // Get updated balance
    const updatedBalance = await getBalance(serviceSupabase, accountId);

    return NextResponse.json({
      success: true,
      checksPerformed,
      totalApiCost,
      creditsUsed: creditCost,
      creditsRemaining: updatedBalance.totalCredits,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ [RankTracking] Check POST error:', error);
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

function normalizeUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
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
