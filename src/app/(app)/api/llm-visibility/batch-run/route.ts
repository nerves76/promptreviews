/**
 * LLM Visibility Batch Run API
 *
 * Queues a batch run of LLM visibility checks across ALL keywords/questions.
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
  refundFeature,
} from '@/lib/credits';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_CREDIT_COSTS,
} from '@/features/llm-visibility/utils/types';
import { calculateLLMCheckCost } from '@/features/llm-visibility/services/credits';
import { extractQuestionText } from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BatchRunRequest {
  providers: LLMProvider[];
  scheduledFor?: string; // ISO timestamp for when to start the run
  retryFailedFromRunId?: string; // If provided, only retry failed items from this run
  groupId?: string; // If provided, only check questions in this group (or "ungrouped" for null group_id)
}

interface QuestionItem {
  keywordId: string;
  question: string;
  questionIndex: number;
}

/**
 * POST /api/llm-visibility/batch-run
 * Queue batch LLM visibility checks for all questions across all keywords.
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

    const body: BatchRunRequest = await request.json();
    const { providers, scheduledFor, retryFailedFromRunId, groupId } = body;

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

    // Validate providers
    const validProviders = (providers || []).filter(p => LLM_PROVIDERS.includes(p));
    if (validProviders.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid provider is required' },
        { status: 400 }
      );
    }

    // Check if there's already a pending/processing batch run for this group scope
    // Exclude future scheduled runs so users can still run immediate checks
    const now = new Date().toISOString();
    const existingRunQuery = serviceSupabase
      .from('llm_batch_runs')
      .select('id, status')
      .eq('account_id', accountId)
      .in('status', ['pending', 'processing'])
      .or(`scheduled_for.is.null,scheduled_for.lte.${now}`);

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

    // Build questions list - either from failed items or all questions
    let allQuestions: QuestionItem[] = [];
    let isRetry = false;

    if (retryFailedFromRunId) {
      // Retry mode: fetch failed items from the previous run
      isRetry = true;

      // Verify the run belongs to this account
      const { data: previousRun, error: prevRunError } = await serviceSupabase
        .from('llm_batch_runs')
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

      // Fetch failed items from that run
      const { data: failedItems, error: failedError } = await serviceSupabase
        .from('llm_batch_run_items')
        .select('keyword_id, question, question_index')
        .eq('batch_run_id', retryFailedFromRunId)
        .eq('status', 'failed');

      if (failedError) {
        console.error('❌ [LLMBatchRun] Failed to fetch failed items:', failedError);
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

      allQuestions = failedItems.map(item => ({
        keywordId: item.keyword_id,
        question: item.question,
        questionIndex: item.question_index,
      }));

      console.log(`🔄 [LLMBatchRun] Retrying ${allQuestions.length} failed items from run ${retryFailedFromRunId}`);
    } else if (groupId) {
      // Group mode: fetch questions from keyword_questions filtered by group
      // First get account's keyword IDs
      const { data: accountKeywords, error: kwError } = await serviceSupabase
        .from('keywords')
        .select('id')
        .eq('account_id', accountId);

      if (kwError) {
        console.error('❌ [LLMBatchRun] Failed to fetch account keywords:', kwError);
        return NextResponse.json(
          { error: 'Failed to fetch keywords' },
          { status: 500 }
        );
      }

      const keywordIds = (accountKeywords || []).map(k => k.id);
      if (keywordIds.length > 0) {
        const questionsQuery = serviceSupabase
          .from('keyword_questions')
          .select('keyword_id, question')
          .in('keyword_id', keywordIds);

        if (groupId === 'ungrouped') {
          questionsQuery.is('group_id', null);
        } else {
          questionsQuery.eq('group_id', groupId);
        }

        const { data: questions, error: questionsError } = await questionsQuery;

        if (questionsError) {
          console.error('❌ [LLMBatchRun] Failed to fetch group questions:', questionsError);
          return NextResponse.json(
            { error: 'Failed to fetch group questions' },
            { status: 500 }
          );
        }

        (questions || []).forEach((q, index) => {
          allQuestions.push({
            keywordId: q.keyword_id,
            question: q.question,
            questionIndex: index,
          });
        });
      }
    } else {
      // Normal mode: fetch all keywords with related_questions for this account
      const { data: keywords, error: keywordsError } = await serviceSupabase
        .from('keywords')
        .select('id, phrase, related_questions')
        .eq('account_id', accountId)
        .not('related_questions', 'is', null);

      if (keywordsError) {
        console.error('❌ [LLMBatchRun] Failed to fetch keywords:', keywordsError);
        return NextResponse.json(
          { error: 'Failed to fetch keywords' },
          { status: 500 }
        );
      }

      // Extract all questions
      for (const keyword of keywords || []) {
        const relatedQuestions = keyword.related_questions || [];
        relatedQuestions.forEach((q: { question: string } | string, index: number) => {
          const questionText = extractQuestionText(q);
          if (questionText) {
            allQuestions.push({
              keywordId: keyword.id,
              question: questionText,
              questionIndex: index,
            });
          }
        });
      }
    }

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: isRetry ? 'No failed items to retry' : 'No questions found. Add questions to your keyword concepts first.' },
        { status: 400 }
      );
    }

    // Calculate total credit cost
    const totalCredits = calculateLLMCheckCost(allQuestions.length, validProviders);

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
          questionCount: allQuestions.length,
          providers: validProviders,
        },
        { status: 402 }
      );
    }

    // Generate idempotency key
    const batchId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = `llm_batch:${accountId}:${batchId}`;

    // Look up group name if groupId provided
    let groupName: string | null = null;
    if (groupId && groupId !== 'ungrouped') {
      const { data: group } = await serviceSupabase
        .from('ai_search_query_groups')
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
      `💳 [LLMBatchRun] Debiting ${totalCredits} credits for account ${accountId} ` +
      `(${allQuestions.length} questions × ${validProviders.length} providers)${groupLabel}`
    );

    try {
      await debit(serviceSupabase, accountId, totalCredits, {
        featureType: 'llm_visibility',
        featureMetadata: {
          batchRun: true,
          questionCount: allQuestions.length,
          providers: validProviders,
          batchId,
          ...(groupId && { groupId, groupName }),
        },
        idempotencyKey,
        description: `LLM batch run${groupLabel}: ${allQuestions.length} questions × ${validProviders.length} providers`,
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

    // Create the batch run record
    const { data: batchRun, error: runError } = await serviceSupabase
      .from('llm_batch_runs')
      .insert({
        account_id: accountId,
        status: 'pending',
        providers: validProviders,
        total_questions: allQuestions.length,
        processed_questions: 0,
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
      console.error('❌ [LLMBatchRun] Failed to create batch run:', runError);
      return NextResponse.json(
        { error: 'Failed to queue batch run' },
        { status: 500 }
      );
    }

    // Create batch run items for each question
    const itemsToInsert = allQuestions.map(q => ({
      batch_run_id: batchRun.id,
      keyword_id: q.keywordId,
      question: q.question,
      question_index: q.questionIndex,
      status: 'pending',
    }));

    const { error: itemsError } = await serviceSupabase
      .from('llm_batch_run_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('❌ [LLMBatchRun] Failed to create batch run items:', itemsError);
      // Mark batch run as failed
      await serviceSupabase
        .from('llm_batch_runs')
        .update({ status: 'failed', error_message: 'Failed to create run items' })
        .eq('id', batchRun.id);
      return NextResponse.json(
        { error: 'Failed to queue batch run items' },
        { status: 500 }
      );
    }

    console.log(
      `✅ [LLMBatchRun] Created batch run ${batchRun.id} with ${allQuestions.length} items`
    );

    // Get updated balance
    const updatedBalance = await getBalance(serviceSupabase, accountId);

    return NextResponse.json({
      success: true,
      queued: true,
      scheduled: !!scheduledForDate,
      scheduledFor: scheduledForDate?.toISOString() || null,
      runId: batchRun.id,
      totalQuestions: allQuestions.length,
      providers: validProviders,
      estimatedCredits: totalCredits,
      creditBalance: updatedBalance.totalCredits,
      message: scheduledForDate
        ? `Batch run scheduled for ${scheduledForDate.toLocaleString()}`
        : 'Batch run queued successfully. Results will be available shortly.',
    });

  } catch (error) {
    console.error('❌ [LLMBatchRun] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/llm-visibility/batch-run
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

    // Get requested providers and groupId from query params
    const { searchParams } = new URL(request.url);
    const providersParam = searchParams.get('providers');
    const groupId = searchParams.get('groupId');
    const providers: LLMProvider[] = providersParam
      ? (providersParam.split(',') as LLMProvider[]).filter(p => LLM_PROVIDERS.includes(p))
      : LLM_PROVIDERS;

    let totalQuestions = 0;
    let keywordCount = 0;

    if (groupId) {
      // Group mode: count questions from keyword_questions filtered by group
      const { data: accountKeywords } = await serviceSupabase
        .from('keywords')
        .select('id')
        .eq('account_id', accountId);

      const keywordIds = (accountKeywords || []).map(k => k.id);
      if (keywordIds.length > 0) {
        const questionsQuery = serviceSupabase
          .from('keyword_questions')
          .select('keyword_id, question')
          .in('keyword_id', keywordIds);

        if (groupId === 'ungrouped') {
          questionsQuery.is('group_id', null);
        } else {
          questionsQuery.eq('group_id', groupId);
        }

        const { data: questions, error: questionsError } = await questionsQuery;

        if (questionsError) {
          return NextResponse.json(
            { error: 'Failed to fetch group questions' },
            { status: 500 }
          );
        }

        totalQuestions = questions?.length || 0;
        keywordCount = new Set(questions?.map(q => q.keyword_id) || []).size;
      }
    } else {
      // Normal mode: count all questions
      const { data: keywords, error: keywordsError } = await serviceSupabase
        .from('keywords')
        .select('id, phrase, related_questions')
        .eq('account_id', accountId)
        .not('related_questions', 'is', null);

      if (keywordsError) {
        return NextResponse.json(
          { error: 'Failed to fetch keywords' },
          { status: 500 }
        );
      }

      keywordCount = keywords?.length || 0;
      for (const keyword of keywords || []) {
        const relatedQuestions = keyword.related_questions || [];
        totalQuestions += relatedQuestions.filter((q: { question: string } | string) => {
          const questionText = extractQuestionText(q);
          return !!questionText;
        }).length;
      }
    }

    // Calculate costs
    const totalCredits = calculateLLMCheckCost(totalQuestions, providers);
    const costPerProvider = Object.fromEntries(
      providers.map(p => [p, LLM_CREDIT_COSTS[p] * totalQuestions])
    );

    // Get balance
    await ensureBalanceExists(serviceSupabase, accountId);
    const balance = await getBalance(serviceSupabase, accountId);

    // Check for existing active run in the same group scope
    // Exclude future scheduled runs from activeRun (they're not actually running)
    const now = new Date().toISOString();
    const activeRunQuery = serviceSupabase
      .from('llm_batch_runs')
      .select('id, status, processed_questions, total_questions')
      .eq('account_id', accountId)
      .in('status', ['pending', 'processing'])
      .or(`scheduled_for.is.null,scheduled_for.lte.${now}`);

    if (groupId) {
      activeRunQuery.eq('group_id', groupId);
    } else {
      activeRunQuery.is('group_id', null);
    }

    const { data: activeRun } = await activeRunQuery.single();

    // Check for future scheduled run in the same group scope
    const scheduledRunQuery = serviceSupabase
      .from('llm_batch_runs')
      .select('id, status, total_questions, scheduled_for, estimated_credits')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .not('scheduled_for', 'is', null)
      .gt('scheduled_for', now);

    if (groupId) {
      scheduledRunQuery.eq('group_id', groupId);
    } else {
      scheduledRunQuery.is('group_id', null);
    }

    const { data: scheduledRun } = await scheduledRunQuery.single();

    return NextResponse.json({
      totalQuestions,
      keywordCount,
      providers,
      totalCredits,
      costPerProvider,
      creditBalance: balance.totalCredits,
      hasCredits: balance.totalCredits >= totalCredits,
      activeRun: activeRun ? {
        runId: activeRun.id,
        status: activeRun.status,
        progress: activeRun.processed_questions,
        total: activeRun.total_questions,
      } : null,
      scheduledRun: scheduledRun ? {
        runId: scheduledRun.id,
        scheduledFor: scheduledRun.scheduled_for,
        totalQuestions: scheduledRun.total_questions,
        estimatedCredits: scheduledRun.estimated_credits,
      } : null,
    });

  } catch (error) {
    console.error('❌ [LLMBatchRun] Preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llm-visibility/batch-run?runId=...
 * Cancel a future scheduled batch run and refund credits.
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    // Verify run belongs to account, is pending, and is scheduled for the future
    const { data: run, error: runError } = await serviceSupabase
      .from('llm_batch_runs')
      .select('id, account_id, status, scheduled_for, estimated_credits, idempotency_key')
      .eq('id', runId)
      .eq('account_id', accountId)
      .single();

    if (runError || !run) {
      return NextResponse.json({ error: 'Batch run not found' }, { status: 404 });
    }

    if (run.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending runs can be cancelled' },
        { status: 400 }
      );
    }

    if (!run.scheduled_for || new Date(run.scheduled_for) <= new Date()) {
      return NextResponse.json(
        { error: 'Only future scheduled runs can be cancelled' },
        { status: 400 }
      );
    }

    // Delete batch run items first (foreign key constraint)
    const { error: itemsDeleteError } = await serviceSupabase
      .from('llm_batch_run_items')
      .delete()
      .eq('batch_run_id', runId);

    if (itemsDeleteError) {
      console.error('❌ [LLMBatchRun] Failed to delete run items:', itemsDeleteError);
      return NextResponse.json(
        { error: 'Failed to cancel batch run' },
        { status: 500 }
      );
    }

    // Delete the batch run
    const { error: runDeleteError } = await serviceSupabase
      .from('llm_batch_runs')
      .delete()
      .eq('id', runId);

    if (runDeleteError) {
      console.error('❌ [LLMBatchRun] Failed to delete run:', runDeleteError);
      return NextResponse.json(
        { error: 'Failed to cancel batch run' },
        { status: 500 }
      );
    }

    // Refund credits
    let creditsRefunded = 0;
    if (run.estimated_credits > 0 && run.idempotency_key) {
      try {
        await refundFeature(
          serviceSupabase,
          accountId,
          run.estimated_credits,
          run.idempotency_key,
          {
            featureType: 'llm_visibility',
            description: `Cancelled scheduled LLM batch run`,
            createdBy: user.id,
          }
        );
        creditsRefunded = run.estimated_credits;
        console.log(
          `💰 [LLMBatchRun] Refunded ${creditsRefunded} credits for cancelled run ${runId}`
        );
      } catch (refundError) {
        console.error('❌ [LLMBatchRun] Refund failed:', refundError);
        // Run is already deleted, log error but return success
      }
    }

    return NextResponse.json({
      success: true,
      creditsRefunded,
    });

  } catch (error) {
    console.error('❌ [LLMBatchRun] Cancel error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
