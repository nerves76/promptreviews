/**
 * Concept Schedule Run Now API
 *
 * Triggers an immediate run of selected check types for a keyword concept.
 * This performs the checks directly (not queued) and returns results.
 */

// Extend timeout for this route since LLM and geo-grid checks can take a while
export const maxDuration = 300; // 5 minutes (requires Vercel Pro plan)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  calculateConceptScheduleCost,
  checkConceptScheduleCredits,
} from '@/features/concept-schedule/services/credits';
import { getBalance, debit } from '@/lib/credits/service';
import { checkRankForDomain } from '@/features/rank-tracking/api/dataforseo-serp-client';
import { runLLMChecks } from '@/features/llm-visibility/services/llm-checker';
import { runRankChecks } from '@/features/geo-grid/services/rank-checker';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
import type { LLMProvider } from '@/features/llm-visibility/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RunNowRequest {
  keywordId: string;
  searchRankEnabled: boolean;
  geoGridEnabled: boolean;
  llmVisibilityEnabled: boolean;
  llmProviders: LLMProvider[];
  reviewMatchingEnabled: boolean;
}

interface CheckResult {
  type: string;
  success: boolean;
  error?: string;
  creditsUsed: number;
  details?: Record<string, unknown>;
}

/**
 * POST /api/concept-schedule/run-now
 * Run checks immediately for a keyword concept.
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

    const body: RunNowRequest = await request.json();
    const {
      keywordId,
      searchRankEnabled,
      geoGridEnabled,
      llmVisibilityEnabled,
      llmProviders,
      reviewMatchingEnabled,
    } = body;

    if (!keywordId) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    // Verify at least one check type is enabled
    if (!searchRankEnabled && !geoGridEnabled && !llmVisibilityEnabled && !reviewMatchingEnabled) {
      return NextResponse.json({ error: 'At least one check type must be enabled' }, { status: 400 });
    }

    // Verify keyword belongs to account and get its data
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, account_id, search_terms, related_questions, search_volume_location_code, search_volume_location_name')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Get business for domain
    const { data: business } = await serviceSupabase
      .from('businesses')
      .select('id, name, business_website, location_code, location_name')
      .eq('account_id', accountId)
      .single();

    if (!business?.business_website) {
      return NextResponse.json({ error: 'Business website URL is required for rank checks' }, { status: 400 });
    }

    // Calculate cost
    const costBreakdown = await calculateConceptScheduleCost(
      serviceSupabase,
      accountId,
      keywordId,
      {
        searchRankEnabled,
        geoGridEnabled,
        llmVisibilityEnabled,
        llmProviders,
        reviewMatchingEnabled,
      }
    );

    if (costBreakdown.total === 0) {
      return NextResponse.json({
        error: 'No items to check. Add search terms or questions first.',
      }, { status: 400 });
    }

    // Check credit balance
    const creditCheck = await checkConceptScheduleCredits(serviceSupabase, accountId, costBreakdown);

    if (!creditCheck.hasCredits) {
      return NextResponse.json({
        error: `Insufficient credits. Need ${creditCheck.required}, have ${creditCheck.available}.`,
        required: creditCheck.required,
        available: creditCheck.available,
      }, { status: 402 });
    }

    // Generate idempotency key
    const idempotencyKey = `run-now-${keywordId}-${Date.now()}`;

    // Debit credits upfront
    const debitResult = await debit(serviceSupabase, accountId, costBreakdown.total, {
      featureType: 'concept_schedule',
      featureMetadata: {
        keywordId,
        keywordPhrase: keyword.phrase,
        runType: 'manual',
        searchRankEnabled,
        geoGridEnabled,
        llmVisibilityEnabled,
        reviewMatchingEnabled,
      },
      idempotencyKey,
      description: `Manual check run for "${keyword.phrase}"`,
      createdBy: user.id,
    });

    if (!debitResult || debitResult.length === 0) {
      return NextResponse.json({
        error: 'Failed to debit credits',
      }, { status: 500 });
    }

    // Perform checks
    const results: CheckResult[] = [];
    const searchTerms: Array<{ term: string }> = keyword.search_terms || [];
    const questions: Array<{ question: string; funnelStage: string }> = keyword.related_questions || [];
    const locationCode = keyword.search_volume_location_code || business.location_code || 2840;

    // Extract domain from website URL
    let targetDomain = business.business_website;
    try {
      const url = new URL(business.business_website.startsWith('http') ? business.business_website : `https://${business.business_website}`);
      targetDomain = url.hostname.replace(/^www\./, '');
    } catch {
      // Use as-is if URL parsing fails
    }

    // 1. Search Rank Checks
    if (searchRankEnabled && searchTerms.length > 0) {
      for (const termObj of searchTerms) {
        try {
          // Check both desktop and mobile
          for (const device of ['desktop', 'mobile'] as const) {
            const result = await checkRankForDomain({
              keyword: termObj.term,
              targetDomain,
              locationCode,
              device,
            });

            // Save result to database
            await serviceSupabase.from('rank_checks').insert({
              account_id: accountId,
              keyword_id: keywordId,
              search_query: termObj.term,
              location_code: locationCode,
              device,
              position: result.position,
              found: result.found,
              found_url: result.url,
              checked_at: new Date().toISOString(),
              triggered_by: 'manual',
            });
          }

          results.push({
            type: 'search_rank',
            success: true,
            creditsUsed: 2, // 1 per device
            details: { term: termObj.term },
          });
        } catch (err) {
          results.push({
            type: 'search_rank',
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            creditsUsed: 0,
            details: { term: termObj.term },
          });
        }
      }
    }

    // 2. LLM Visibility Checks
    if (llmVisibilityEnabled && questions.length > 0 && llmProviders.length > 0) {
      try {
        // Extract question strings from the question objects
        const questionStrings = questions.map(q =>
          typeof q === 'string' ? q : q.question
        );

        const llmResult = await runLLMChecks(
          keywordId,
          accountId,
          questionStrings,
          targetDomain,
          serviceSupabase,
          {
            providers: llmProviders,
            businessName: business.name || null,
          }
        );

        results.push({
          type: 'llm_visibility',
          success: llmResult.success,
          error: llmResult.errors.length > 0 ? llmResult.errors.join(', ') : undefined,
          creditsUsed: costBreakdown.llmVisibility.cost,
          details: {
            checksPerformed: llmResult.checksPerformed,
            questionCount: questionStrings.length,
            providerCount: llmProviders.length,
            resultCount: llmResult.results.length,
          },
        });
      } catch (err) {
        results.push({
          type: 'llm_visibility',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          creditsUsed: 0,
        });
      }
    }

    // 3. Geo-Grid Checks
    if (geoGridEnabled) {
      try {
        // Get the geo-grid config for this account
        const { data: ggConfigRow, error: ggConfigError } = await serviceSupabase
          .from('gg_configs')
          .select('*')
          .eq('account_id', accountId)
          .single();

        if (ggConfigError || !ggConfigRow) {
          results.push({
            type: 'geo_grid',
            success: false,
            error: 'No geo-grid configuration found. Set up Local Ranking Grid first.',
            creditsUsed: 0,
          });
        } else if (!ggConfigRow.target_place_id) {
          results.push({
            type: 'geo_grid',
            success: false,
            error: 'Geo-grid config is missing target Place ID. Connect a Google Business location first.',
            creditsUsed: 0,
          });
        } else {
          // Transform the config row to the expected format
          const ggConfig = transformConfigToResponse(ggConfigRow);

          // Run the geo-grid checks for this specific keyword
          const ggResult = await runRankChecks(ggConfig, serviceSupabase, {
            keywordIds: [keywordId],
          });

          results.push({
            type: 'geo_grid',
            success: ggResult.success,
            error: ggResult.errors.length > 0 ? ggResult.errors.join(', ') : undefined,
            creditsUsed: costBreakdown.geoGrid.cost,
            details: {
              checksPerformed: ggResult.checksPerformed,
              checkPoints: ggConfig.checkPoints.length,
              resultCount: ggResult.results.length,
            },
          });
        }
      } catch (err) {
        results.push({
          type: 'geo_grid',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          creditsUsed: 0,
        });
      }
    }

    // 4. Review Matching
    if (reviewMatchingEnabled) {
      try {
        // Call the review matching endpoint
        const matchResult = await serviceSupabase.rpc('match_keyword_to_reviews', {
          p_keyword_id: keywordId,
          p_account_id: accountId,
        });

        results.push({
          type: 'review_matching',
          success: true,
          creditsUsed: 1,
          details: matchResult.data || {},
        });
      } catch (err) {
        results.push({
          type: 'review_matching',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          creditsUsed: 0,
        });
      }
    }

    // Get updated balance
    const updatedBalance = await getBalance(serviceSupabase, accountId);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      partial: failureCount > 0 && successCount > 0,
      results,
      totalCreditsUsed: costBreakdown.total,
      creditBalance: updatedBalance.totalCredits,
      message: failureCount === 0
        ? 'All checks completed successfully'
        : `${successCount} checks completed, ${failureCount} failed`,
    });

  } catch (error) {
    console.error('❌ [RunNow] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
