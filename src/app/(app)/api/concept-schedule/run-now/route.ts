/**
 * Concept Schedule Run Now API
 *
 * Triggers an immediate run of selected check types for a keyword concept.
 * This creates pending check records that will be processed by the background workers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  calculateConceptScheduleCost,
  checkConceptScheduleCredits,
} from '@/features/concept-schedule/services/credits';
import { getBalance, debit } from '@/lib/credits/service';
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

    // Verify keyword belongs to account
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, account_id, search_terms, related_questions')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
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

    // Debit credits
    const debitResult = await debit(serviceSupabase, accountId, costBreakdown.total, {
      featureType: 'concept_schedule',
      featureMetadata: {
        keywordId,
        keywordPhrase: keyword.phrase,
        searchRankEnabled,
        geoGridEnabled,
        llmVisibilityEnabled,
        reviewMatchingEnabled,
        costBreakdown: {
          searchRank: costBreakdown.searchRank.cost,
          geoGrid: costBreakdown.geoGrid.cost,
          llmVisibility: costBreakdown.llmVisibility.cost,
          reviewMatching: costBreakdown.reviewMatching.cost,
          total: costBreakdown.total,
        },
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

    // Queue the checks by creating pending records
    const checksQueued: string[] = [];

    // Queue search rank checks
    if (searchRankEnabled && costBreakdown.searchRank.cost > 0) {
      // Create a manual check run record
      await serviceSupabase.from('rank_check_runs').insert({
        keyword_id: keywordId,
        account_id: accountId,
        status: 'pending',
        triggered_by: 'manual',
        created_at: new Date().toISOString(),
      });
      checksQueued.push('search_rank');
    }

    // Queue geo-grid checks
    if (geoGridEnabled && costBreakdown.geoGrid.cost > 0) {
      await serviceSupabase.from('geo_grid_runs').insert({
        keyword_id: keywordId,
        account_id: accountId,
        status: 'pending',
        triggered_by: 'manual',
        created_at: new Date().toISOString(),
      });
      checksQueued.push('geo_grid');
    }

    // Queue LLM visibility checks
    if (llmVisibilityEnabled && costBreakdown.llmVisibility.cost > 0) {
      await serviceSupabase.from('llm_visibility_runs').insert({
        keyword_id: keywordId,
        account_id: accountId,
        providers: llmProviders,
        status: 'pending',
        triggered_by: 'manual',
        created_at: new Date().toISOString(),
      });
      checksQueued.push('llm_visibility');
    }

    // Queue review matching
    if (reviewMatchingEnabled && costBreakdown.reviewMatching.cost > 0) {
      await serviceSupabase.from('review_matching_runs').insert({
        keyword_id: keywordId,
        account_id: accountId,
        status: 'pending',
        triggered_by: 'manual',
        created_at: new Date().toISOString(),
      });
      checksQueued.push('review_matching');
    }

    // Get updated balance
    const updatedBalance = await getBalance(serviceSupabase, accountId);

    return NextResponse.json({
      success: true,
      message: 'Checks queued successfully',
      checksQueued,
      totalCreditsUsed: costBreakdown.total,
      creditBalance: updatedBalance.totalCredits,
    });

  } catch (error) {
    console.error('❌ [RunNow] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
