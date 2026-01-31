/**
 * Rank Tracking Batch Run API
 *
 * Queues a batch run of rank tracking checks across ALL keywords.
 * Always checks both desktop and mobile (2 credits per keyword).
 * Returns immediately with a run ID - checks execute in background via cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
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

// 2 credits per keyword (desktop + mobile)
const CREDITS_PER_KEYWORD = 2;

interface BatchRunRequest {
  scheduledFor?: string; // ISO timestamp for when to start the run
  retryFailedFromRunId?: string; // If provided, only retry failed items from this run
  groupId?: string; // If provided, only check keywords in this group (or "ungrouped" for null group_id)
}

interface KeywordItem {
  keywordId: string;
  searchTerm: string;
  locationCode: number | null;
}

/**
 * POST /api/rank-tracking/batch-run
 * Queue batch rank tracking checks for all keywords.
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

    const body: BatchRunRequest = await request.json().catch(() => ({}));
    const { scheduledFor, retryFailedFromRunId, groupId } = body;

    // Parse scheduled time if provided
    let scheduledForDate: Date | null = null;
    if (scheduledFor) {
      scheduledForDate = new Date(scheduledFor);
      if (isNaN(scheduledForDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduledFor timestamp' },
          { status: 400 }
        );
      }
    }

    // Check if there's already a pending/processing batch run for this group scope
    const existingRunQuery = serviceSupabase
      .from('rank_batch_runs')
      .select('id, status')
      .eq('account_id', accountId)
      .in('status', ['pending', 'processing']);

    if (groupId) {
      existingRunQuery.eq('group_id', groupId);
    } else {
      existingRunQuery.is('group_id', null);
    }

    const { data: existingRun } = await existingRunQuery.single();

    if (existingRun) {
      return NextResponse.json(
        {
          error: 'A batch run is already in progress',
          runId: existingRun.id,
          status: existingRun.status,
        },
        { status: 409 }
      );
    }

    // Get business data for default location
    const { data: business } = await serviceSupabase
      .from('businesses')
      .select('location_code')
      .eq('account_id', accountId)
      .single();

    const defaultLocationCode = business?.location_code || 2840; // USA default

    // Build keywords list - either from failed items or all keywords
    let allKeywords: KeywordItem[] = [];
    let isRetry = false;

    if (retryFailedFromRunId) {
      // Retry mode: fetch failed items from the previous run
      isRetry = true;

      // Verify the run belongs to this account
      const { data: previousRun, error: prevRunError } = await serviceSupabase
        .from('rank_batch_runs')
        .select('id, account_id, status')
        .eq('id', retryFailedFromRunId)
        .eq('account_id', accountId)
        .single();

      if (prevRunError || !previousRun) {
        return NextResponse.json(
          { error: 'Previous batch run not found' },
          { status: 404 }
        );
      }

      // Fetch failed items from that run (items where desktop OR mobile failed)
      const { data: failedItems, error: failedError } = await serviceSupabase
        .from('rank_batch_run_items')
        .select('keyword_id, search_term, location_code, desktop_status, mobile_status')
        .eq('batch_run_id', retryFailedFromRunId)
        .or('desktop_status.eq.failed,mobile_status.eq.failed');

      if (failedError) {
        console.error('❌ [RankBatchRun] Failed to fetch failed items:', failedError);
        return NextResponse.json(
          { error: 'Failed to fetch failed items' },
          { status: 500 }
        );
      }

      if (!failedItems || failedItems.length === 0) {
        return NextResponse.json(
          { error: 'No failed items found to retry' },
          { status: 400 }
        );
      }

      allKeywords = failedItems.map(item => ({
        keywordId: item.keyword_id,
        searchTerm: item.search_term,
        locationCode: item.location_code,
      }));

      console.log(`🔄 [RankBatchRun] Retrying ${allKeywords.length} failed items from run ${retryFailedFromRunId}`);
    } else if (groupId) {
      // Group mode: fetch terms from rank_tracking_terms filtered by group
      const termsQuery = serviceSupabase
        .from('rank_tracking_terms')
        .select('keyword_id, term')
        .eq('account_id', accountId);

      if (groupId === 'ungrouped') {
        termsQuery.is('group_id', null);
      } else {
        termsQuery.eq('group_id', groupId);
      }

      const { data: terms, error: termsError } = await termsQuery;

      if (termsError) {
        console.error('❌ [RankBatchRun] Failed to fetch group terms:', termsError);
        return NextResponse.json(
          { error: 'Failed to fetch group terms' },
          { status: 500 }
        );
      }

      if (terms && terms.length > 0) {
        // Get location codes from keywords table
        const keywordIds = [...new Set(terms.map(t => t.keyword_id))];
        const { data: keywords } = await serviceSupabase
          .from('keywords')
          .select('id, search_volume_location_code')
          .in('id', keywordIds);

        const locationCodeMap = new Map<string, number>();
        for (const kw of keywords || []) {
          locationCodeMap.set(kw.id, kw.search_volume_location_code || defaultLocationCode);
        }

        for (const t of terms) {
          allKeywords.push({
            keywordId: t.keyword_id,
            searchTerm: t.term,
            locationCode: locationCodeMap.get(t.keyword_id) || defaultLocationCode,
          });
        }
      }
    } else {
      // Normal mode: fetch all keywords with search terms for this account
      const { data: keywords, error: keywordsError } = await serviceSupabase
        .from('keywords')
        .select('id, phrase, search_terms, search_volume_location_code')
        .eq('account_id', accountId);

      if (keywordsError) {
        console.error('❌ [RankBatchRun] Failed to fetch keywords:', keywordsError);
        return NextResponse.json(
          { error: 'Failed to fetch keywords' },
          { status: 500 }
        );
      }

      // Extract all search terms from keywords
      for (const keyword of keywords || []) {
        const searchTerms = keyword.search_terms || [];
        const locationCode = keyword.search_volume_location_code || defaultLocationCode;

        // If no search terms, use the phrase itself
        if (searchTerms.length === 0) {
          allKeywords.push({
            keywordId: keyword.id,
            searchTerm: keyword.phrase,
            locationCode,
          });
        } else {
          // Add each search term
          for (const termObj of searchTerms) {
            const term = typeof termObj === 'string' ? termObj : termObj.term;
            if (term) {
              allKeywords.push({
                keywordId: keyword.id,
                searchTerm: term,
                locationCode,
              });
            }
          }
        }
      }
    }

    if (allKeywords.length === 0) {
      return NextResponse.json(
        { error: isRetry ? 'No failed items to retry' : 'No keywords found. Add keywords to your account first.' },
        { status: 400 }
      );
    }

    // Calculate total credit cost (2 per keyword: desktop + mobile)
    const totalCredits = allKeywords.length * CREDITS_PER_KEYWORD;

    // Ensure balance record exists
    await ensureBalanceExists(serviceSupabase, accountId);

    // Check credit balance
    const balance = await getBalance(serviceSupabase, accountId);
    if (balance.totalCredits < totalCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: totalCredits,
          available: balance.totalCredits,
          keywordCount: allKeywords.length,
        },
        { status: 402 }
      );
    }

    // Generate idempotency key
    const batchId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = `rank_batch:${accountId}:${batchId}`;

    // Look up group name if groupId provided
    let groupName: string | null = null;
    if (groupId && groupId !== 'ungrouped') {
      const { data: group } = await serviceSupabase
        .from('rank_tracking_term_groups')
        .select('name')
        .eq('id', groupId)
        .single();
      groupName = group?.name || null;
    } else if (groupId === 'ungrouped') {
      groupName = 'Ungrouped';
    }

    // Debit credits upfront
    const groupLabel = groupName ? ` [${groupName}]` : '';
    console.log(
      `💳 [RankBatchRun] Debiting ${totalCredits} credits for account ${accountId} ` +
      `(${allKeywords.length} keywords × 2 devices)${groupLabel}`
    );

    try {
      await debit(serviceSupabase, accountId, totalCredits, {
        featureType: 'rank_tracking',
        featureMetadata: {
          batchRun: true,
          keywordCount: allKeywords.length,
          batchId,
          ...(groupId && { groupId, groupName }),
        },
        idempotencyKey,
        description: `Rank batch run${groupLabel}: ${allKeywords.length} keywords × 2 devices`,
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

    // Create the batch run record (store idempotency key for potential refunds)
    const { data: batchRun, error: runError } = await serviceSupabase
      .from('rank_batch_runs')
      .insert({
        account_id: accountId,
        status: 'pending',
        total_keywords: allKeywords.length,
        processed_keywords: 0,
        successful_checks: 0,
        failed_checks: 0,
        estimated_credits: totalCredits,
        total_credits_used: totalCredits,
        triggered_by: user.id,
        scheduled_for: scheduledForDate?.toISOString() || null,
        idempotency_key: idempotencyKey,
        group_id: groupId || null,
      })
      .select()
      .single();

    if (runError || !batchRun) {
      console.error('❌ [RankBatchRun] Failed to create batch run:', runError);
      return NextResponse.json(
        { error: 'Failed to queue batch run' },
        { status: 500 }
      );
    }

    // Create batch run items for each keyword
    const itemsToInsert = allKeywords.map(k => ({
      batch_run_id: batchRun.id,
      keyword_id: k.keywordId,
      search_term: k.searchTerm,
      location_code: k.locationCode,
      desktop_status: 'pending',
      mobile_status: 'pending',
    }));

    const { error: itemsError } = await serviceSupabase
      .from('rank_batch_run_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('❌ [RankBatchRun] Failed to create batch run items:', itemsError);
      // Mark batch run as failed
      await serviceSupabase
        .from('rank_batch_runs')
        .update({ status: 'failed', error_message: 'Failed to create run items' })
        .eq('id', batchRun.id);
      return NextResponse.json(
        { error: 'Failed to queue batch run items' },
        { status: 500 }
      );
    }

    console.log(
      `✅ [RankBatchRun] Created batch run ${batchRun.id} with ${allKeywords.length} items`
    );

    // Get updated balance
    const updatedBalance = await getBalance(serviceSupabase, accountId);

    return NextResponse.json({
      success: true,
      queued: true,
      scheduled: !!scheduledForDate,
      scheduledFor: scheduledForDate?.toISOString() || null,
      runId: batchRun.id,
      totalKeywords: allKeywords.length,
      estimatedCredits: totalCredits,
      creditBalance: updatedBalance.totalCredits,
      message: scheduledForDate
        ? `Batch run scheduled for ${scheduledForDate.toLocaleString()}`
        : 'Batch run queued successfully. Results will be available shortly.',
    });

  } catch (error) {
    console.error('❌ [RankBatchRun] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rank-tracking/batch-run
 * Get cost preview for batch run without executing.
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

    // Read groupId from query params
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    // Get business data for default location
    const { data: business } = await serviceSupabase
      .from('businesses')
      .select('location_code')
      .eq('account_id', accountId)
      .single();

    const defaultLocationCode = business?.location_code || 2840;

    let totalKeywords = 0;
    let conceptCount = 0;

    if (groupId) {
      // Group mode: count terms from rank_tracking_terms filtered by group
      const termsQuery = serviceSupabase
        .from('rank_tracking_terms')
        .select('keyword_id, term')
        .eq('account_id', accountId);

      if (groupId === 'ungrouped') {
        termsQuery.is('group_id', null);
      } else {
        termsQuery.eq('group_id', groupId);
      }

      const { data: terms, error: termsError } = await termsQuery;

      if (termsError) {
        return NextResponse.json(
          { error: 'Failed to fetch group terms' },
          { status: 500 }
        );
      }

      totalKeywords = terms?.length || 0;
      conceptCount = new Set(terms?.map(t => t.keyword_id) || []).size;
    } else {
      // Normal mode: count all keywords
      const { data: keywords, error: keywordsError } = await serviceSupabase
        .from('keywords')
        .select('id, phrase, search_terms')
        .eq('account_id', accountId);

      if (keywordsError) {
        return NextResponse.json(
          { error: 'Failed to fetch keywords' },
          { status: 500 }
        );
      }

      conceptCount = keywords?.length || 0;
      for (const keyword of keywords || []) {
        const searchTerms = keyword.search_terms || [];
        if (searchTerms.length === 0) {
          totalKeywords++; // Use phrase if no search terms
        } else {
          totalKeywords += searchTerms.length;
        }
      }
    }

    // Calculate cost
    const totalCredits = totalKeywords * CREDITS_PER_KEYWORD;

    // Get balance
    await ensureBalanceExists(serviceSupabase, accountId);
    const balance = await getBalance(serviceSupabase, accountId);

    // Check for existing active run in the same group scope
    const activeRunQuery = serviceSupabase
      .from('rank_batch_runs')
      .select('id, status, processed_keywords, total_keywords')
      .eq('account_id', accountId)
      .in('status', ['pending', 'processing']);

    if (groupId) {
      activeRunQuery.eq('group_id', groupId);
    } else {
      activeRunQuery.is('group_id', null);
    }

    const { data: activeRun } = await activeRunQuery.single();

    return NextResponse.json({
      totalKeywords,
      conceptCount,
      totalCredits,
      creditBalance: balance.totalCredits,
      hasCredits: balance.totalCredits >= totalCredits,
      activeRun: activeRun ? {
        runId: activeRun.id,
        status: activeRun.status,
        progress: activeRun.processed_keywords,
        total: activeRun.total_keywords,
      } : null,
    });

  } catch (error) {
    console.error('❌ [RankBatchRun] Preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
