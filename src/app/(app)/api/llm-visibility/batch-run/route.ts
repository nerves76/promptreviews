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
} from '@/lib/credits';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_CREDIT_COSTS,
} from '@/features/llm-visibility/utils/types';
import { calculateLLMCheckCost } from '@/features/llm-visibility/services/credits';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BatchRunRequest {
  providers: LLMProvider[];
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
    const { providers } = body;

    // Validate providers
    const validProviders = (providers || []).filter(p => LLM_PROVIDERS.includes(p));
    if (validProviders.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid provider is required' },
        { status: 400 }
      );
    }

    // Check if there's already a pending/processing batch run
    const { data: existingRun } = await serviceSupabase
      .from('llm_batch_runs')
      .select('id, status')
      .eq('account_id', accountId)
      .in('status', ['pending', 'processing'])
      .single();

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

    // Fetch all keywords with related_questions for this account
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
    const allQuestions: QuestionItem[] = [];
    for (const keyword of keywords || []) {
      const relatedQuestions = keyword.related_questions || [];
      relatedQuestions.forEach((q: { question: string } | string, index: number) => {
        const questionText = typeof q === 'string' ? q : q.question;
        if (questionText) {
          allQuestions.push({
            keywordId: keyword.id,
            question: questionText,
            questionIndex: index,
          });
        }
      });
    }

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found. Add questions to your keyword concepts first.' },
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

    // Debit credits upfront
    console.log(
      `💳 [LLMBatchRun] Debiting ${totalCredits} credits for account ${accountId} ` +
      `(${allQuestions.length} questions × ${validProviders.length} providers)`
    );

    try {
      await debit(serviceSupabase, accountId, totalCredits, {
        featureType: 'llm_batch_run',
        featureMetadata: {
          questionCount: allQuestions.length,
          providers: validProviders,
          batchId,
        },
        idempotencyKey,
        description: `LLM batch run: ${allQuestions.length} questions × ${validProviders.length} providers`,
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
      runId: batchRun.id,
      totalQuestions: allQuestions.length,
      providers: validProviders,
      estimatedCredits: totalCredits,
      creditBalance: updatedBalance.totalCredits,
      message: 'Batch run queued successfully. Results will be available shortly.',
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

    // Get requested providers from query params
    const { searchParams } = new URL(request.url);
    const providersParam = searchParams.get('providers');
    const providers: LLMProvider[] = providersParam
      ? (providersParam.split(',') as LLMProvider[]).filter(p => LLM_PROVIDERS.includes(p))
      : LLM_PROVIDERS;

    // Fetch all keywords with related_questions
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

    // Count questions
    let totalQuestions = 0;
    for (const keyword of keywords || []) {
      const relatedQuestions = keyword.related_questions || [];
      totalQuestions += relatedQuestions.filter((q: { question: string } | string) => {
        const questionText = typeof q === 'string' ? q : q.question;
        return !!questionText;
      }).length;
    }

    // Calculate costs
    const totalCredits = calculateLLMCheckCost(totalQuestions, providers);
    const costPerProvider = Object.fromEntries(
      providers.map(p => [p, LLM_CREDIT_COSTS[p] * totalQuestions])
    );

    // Get balance
    await ensureBalanceExists(serviceSupabase, accountId);
    const balance = await getBalance(serviceSupabase, accountId);

    // Check for existing active run
    const { data: activeRun } = await serviceSupabase
      .from('llm_batch_runs')
      .select('id, status, processed_questions, total_questions')
      .eq('account_id', accountId)
      .in('status', ['pending', 'processing'])
      .single();

    return NextResponse.json({
      totalQuestions,
      keywordCount: keywords?.length || 0,
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
    });

  } catch (error) {
    console.error('❌ [LLMBatchRun] Preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
