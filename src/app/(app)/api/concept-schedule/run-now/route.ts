/**
 * Concept Schedule Run Now API
 *
 * Queues an immediate run of selected check types for a keyword concept.
 * Returns immediately with a run ID - checks execute in background via cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  calculateConceptScheduleCost,
  checkConceptScheduleCredits,
} from '@/features/concept-schedule/services/credits';
import { debit } from '@/lib/credits/service';
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
 * Queue checks for immediate processing (async).
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
      .select('id, phrase, account_id')
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

    // Create the queued run record
    const { data: run, error: runError } = await serviceSupabase
      .from('concept_check_runs')
      .insert({
        account_id: accountId,
        keyword_id: keywordId,
        search_rank_enabled: searchRankEnabled,
        geo_grid_enabled: geoGridEnabled,
        llm_visibility_enabled: llmVisibilityEnabled,
        llm_providers: llmProviders,
        review_matching_enabled: reviewMatchingEnabled,
        status: 'pending',
        search_rank_status: searchRankEnabled ? 'pending' : null,
        geo_grid_status: geoGridEnabled ? 'pending' : null,
        llm_visibility_status: llmVisibilityEnabled ? 'pending' : null,
        review_matching_status: reviewMatchingEnabled ? 'pending' : null,
        total_credits_used: costBreakdown.total,
        triggered_by: user.id,
      })
      .select()
      .single();

    if (runError || !run) {
      console.error('Failed to create run record:', runError);
      return NextResponse.json({
        error: 'Failed to queue checks',
      }, { status: 500 });
    }

    // Return immediately - checks will be processed by cron
    return NextResponse.json({
      success: true,
      queued: true,
      runId: run.id,
      message: 'Checks queued successfully. Results will be available shortly.',
      totalCreditsUsed: costBreakdown.total,
      creditBalance: creditCheck.available - costBreakdown.total,
    });

  } catch (error) {
    console.error('❌ [RunNow] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
