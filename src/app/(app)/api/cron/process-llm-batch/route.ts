/**
 * Cron Job: Process LLM Batch Runs
 *
 * Processes queued LLM batch runs, checking a limited number of questions
 * per execution to stay within timeout limits. Runs every minute.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import { runLLMChecks, updateSummary } from '@/features/llm-visibility/services/llm-checker';
import { refundFeature } from '@/lib/credits';
import { sendNotificationToAccount, sendAdminAlert } from '@/utils/notifications';
import { LLM_CREDIT_COSTS, type LLMProvider } from '@/features/llm-visibility/utils/types';
import { shouldRetry } from '@/utils/retryHelpers';
import { computeLlmBatchStats } from '@/utils/batchCompletionStats';

// Extend timeout for this route
export const maxDuration = 300; // 5 minutes

// Process up to N questions per execution to stay within timeout
// With 5-minute timeout, parallelized providers (~10-15s per question), we can do 20
const ITEMS_PER_EXECUTION = 20;

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BatchRunRow {
  id: string;
  account_id: string;
  status: string;
  providers: LLMProvider[];
  total_questions: number;
  processed_questions: number;
  successful_checks: number;
  failed_checks: number;
  started_at: string | null;
  idempotency_key: string | null;
  estimated_credits: number;
}

interface BatchRunItemRow {
  id: string;
  batch_run_id: string;
  keyword_id: string;
  question: string;
  question_index: number;
  status: string;
  retry_count: number;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('process-llm-batch', async () => {
    // First, clean up any stuck runs (processing for > 2 hours)
    // With ~15 questions/minute, even 1800 questions would complete in 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: stuckRuns } = await serviceSupabase
      .from('llm_batch_runs')
      .select('id, account_id, idempotency_key, estimated_credits, processed_questions, total_questions, providers')
      .eq('status', 'processing')
      .lt('started_at', twoHoursAgo);

    if (stuckRuns && stuckRuns.length > 0) {
      console.log(`📋 [LLMBatch] Found ${stuckRuns.length} stuck runs, marking as failed`);
      for (const stuckRun of stuckRuns) {
        // Count how many checks were NOT completed
        // Each question has N provider checks (e.g., 3 providers = 3 credits per question)
        const { data: items } = await serviceSupabase
          .from('llm_batch_run_items')
          .select('status')
          .eq('batch_run_id', stuckRun.id);

        const providers = (stuckRun.providers as LLMProvider[]) || [];
        const creditCostPerQuestion = providers.reduce(
          (sum, provider) => sum + (LLM_CREDIT_COSTS[provider] || 1),
          0
        ) || 1;
        let completedQuestions = 0;
        let failedQuestions = 0;
        if (items) {
          for (const item of items) {
            if (item.status === 'completed') {
              completedQuestions++;
            } else {
              failedQuestions++;
            }
          }
        }

        // Calculate credits used and to refund
        const creditsUsed = completedQuestions * creditCostPerQuestion;
        const failedCredits = failedQuestions * creditCostPerQuestion;

        await serviceSupabase
          .from('llm_batch_runs')
          .update({
            status: 'failed',
            error_message: 'Run timed out after 2 hours',
            completed_at: new Date().toISOString(),
            total_credits_used: creditsUsed,
          })
          .eq('id', stuckRun.id);

        // Refund credits for uncompleted checks
        if (failedCredits > 0 && stuckRun.idempotency_key) {
          try {
            await refundFeature(
              serviceSupabase,
              stuckRun.account_id,
              failedCredits,
              stuckRun.idempotency_key,
              {
                featureType: 'llm_visibility',
                featureMetadata: {
                  batchRunId: stuckRun.id,
                  failedQuestions: failedQuestions,
                  failedCredits: failedCredits,
                  reason: 'timeout',
                },
                description: `Refund for ${failedQuestions} uncompleted LLM questions (${failedCredits} credits, batch timed out)`,
              }
            );
            console.log(`💰 [LLMBatch] Refunded ${failedCredits} credits for ${failedQuestions} questions in timed out batch ${stuckRun.id}`);

            // Send notification about the refund
            await sendNotificationToAccount(stuckRun.account_id, 'credit_refund', {
              feature: 'llm_visibility',
              creditsRefunded: failedCredits,
              failedChecks: failedQuestions,
              batchRunId: stuckRun.id,
            });
          } catch (refundError) {
            console.error(`❌ [LLMBatch] Failed to refund credits for timed out batch ${stuckRun.id}:`, refundError);
          }
        }
      }
    }

    // Find oldest pending or processing batch run
    // Only process runs where scheduled_for is NULL (immediate) or in the past
    const now = new Date().toISOString();
    const { data: batchRun, error: runError } = await serviceSupabase
      .from('llm_batch_runs')
      .select('*')
      .in('status', ['pending', 'processing'])
      .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (runError || !batchRun) {
      return { success: true, summary: { message: 'No pending batch runs to process' } };
    }

    const run = batchRun as BatchRunRow;
    console.log(`📋 [LLMBatch] Processing batch run ${run.id}`);

    try {
      // Mark as processing if pending
      if (run.status === 'pending') {
        await serviceSupabase
          .from('llm_batch_runs')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', run.id);
      }

      // Get business data for domain
      const { data: business } = await serviceSupabase
        .from('businesses')
        .select('id, name, business_website')
        .eq('account_id', run.account_id)
        .single();

      if (!business?.business_website) {
        await markBatchFailed(run.id, 'Business website URL not configured');
        return { success: false, error: 'Business website URL not configured' };
      }

      // Extract domain
      let targetDomain = business.business_website;
      try {
        const url = new URL(
          business.business_website.startsWith('http')
            ? business.business_website
            : `https://${business.business_website}`
        );
        targetDomain = url.hostname.replace(/^www\./, '');
      } catch {
        // Use as-is
      }

      // Reset items stuck in 'processing' for > 10 minutes (function timeout is 5 min)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: stuckItems } = await serviceSupabase
        .from('llm_batch_run_items')
        .select('id')
        .eq('batch_run_id', run.id)
        .eq('status', 'processing')
        .lt('updated_at', tenMinutesAgo);

      if (stuckItems && stuckItems.length > 0) {
        console.log(`📋 [LLMBatch] Resetting ${stuckItems.length} stuck items to pending`);
        await serviceSupabase
          .from('llm_batch_run_items')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('batch_run_id', run.id)
          .eq('status', 'processing')
          .lt('updated_at', tenMinutesAgo);
      }

      // Get next batch of pending items
      const { data: pendingItems, error: itemsError } = await serviceSupabase
        .from('llm_batch_run_items')
        .select('*')
        .eq('batch_run_id', run.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(ITEMS_PER_EXECUTION);

      if (itemsError) {
        console.error('❌ [LLMBatch] Failed to fetch pending items:', itemsError);
        return { success: false, error: 'Failed to fetch pending items' };
      }

      const items = (pendingItems || []) as BatchRunItemRow[];

      if (items.length === 0) {
        // No more pending items - check if all are done
        await checkAndCompleteBatch(run.id, run.account_id, run.idempotency_key, run.providers);
        return { success: true, summary: { message: 'No pending items, checked completion' } };
      }

      console.log(`   Processing ${items.length} items...`);

      let successCount = 0;
      let failCount = 0;

      // Process each item
      for (const item of items) {
        console.log(`   → Question: "${item.question.substring(0, 50)}..."`);

        // Mark as processing
        await serviceSupabase
          .from('llm_batch_run_items')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', item.id);

        try {
          // Run LLM checks for this question
          const result = await runLLMChecks(
            item.keyword_id,
            run.account_id,
            [item.question],
            targetDomain,
            serviceSupabase,
            {
              providers: run.providers,
              businessName: business.name || null,
            }
          );

          if (result.success && result.checksPerformed > 0) {
            // Mark item as completed
            await serviceSupabase
              .from('llm_batch_run_items')
              .update({ status: 'completed', updated_at: new Date().toISOString() })
              .eq('id', item.id);
            successCount++;
            console.log(`   ✓ Completed (${result.checksPerformed} checks)`);
          } else {
            const errorMsg = result.errors.join('; ') || 'No checks performed';

            if (shouldRetry(item.retry_count, errorMsg)) {
              // Transient error — set back to pending for retry on next cron tick
              await serviceSupabase
                .from('llm_batch_run_items')
                .update({
                  status: 'pending',
                  retry_count: item.retry_count + 1,
                  error_message: null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id);
              console.log(`   ↻ Retrying (attempt ${item.retry_count + 2}/3): ${errorMsg}`);
            } else {
              // Permanent failure
              await serviceSupabase
                .from('llm_batch_run_items')
                .update({
                  status: 'failed',
                  error_message: errorMsg,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id);
              failCount++;
              console.log(`   ✗ Failed: ${errorMsg}`);
            }
          }

          // Update summary for this keyword
          await updateSummary(item.keyword_id, run.account_id, serviceSupabase);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';

          if (shouldRetry(item.retry_count, errorMsg)) {
            // Transient error — set back to pending for retry on next cron tick
            await serviceSupabase
              .from('llm_batch_run_items')
              .update({
                status: 'pending',
                retry_count: item.retry_count + 1,
                error_message: null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id);
            console.log(`   ↻ Retrying (attempt ${item.retry_count + 2}/3): ${errorMsg}`);
          } else {
            // Permanent failure
            await serviceSupabase
              .from('llm_batch_run_items')
              .update({
                status: 'failed',
                error_message: errorMsg,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id);
            failCount++;
            console.error(`   ✗ Error: ${errorMsg}`);
          }
        }

        // Update batch run progress
        await serviceSupabase
          .from('llm_batch_runs')
          .update({
            processed_questions: run.processed_questions + successCount + failCount,
            successful_checks: run.successful_checks + successCount,
            failed_checks: run.failed_checks + failCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', run.id);
      }

      // Check if batch is complete
      await checkAndCompleteBatch(run.id, run.account_id, run.idempotency_key, run.providers);

      return {
        success: true,
        summary: {
          runId: run.id,
          itemsProcessed: items.length,
          successCount,
          failCount,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
      console.error(`❌ [LLMBatch] Error processing batch ${run.id}:`, error);
      await markBatchFailed(run.id, errorMessage);
      return { success: false, error: errorMessage };
    }
  });
}

async function checkAndCompleteBatch(
  runId: string,
  accountId: string,
  idempotencyKey: string | null,
  providers: LLMProvider[]
): Promise<void> {
  // Get counts of item statuses
  const { data: items } = await serviceSupabase
    .from('llm_batch_run_items')
    .select('status, error_message')
    .eq('batch_run_id', runId);

  if (!items) return;

  const pending = items.filter(i => i.status === 'pending').length;
  const processing = items.filter(i => i.status === 'processing').length;
  const completed = items.filter(i => i.status === 'completed').length;
  const failed = items.filter(i => i.status === 'failed').length;

  // If no pending or processing items, mark batch as complete
  if (pending === 0 && processing === 0) {
    const status = failed === items.length ? 'failed' : 'completed';
    const errorMessage = failed > 0 ? `${failed} of ${items.length} questions failed` : null;

    // Calculate credits: each question costs sum of provider credits
    const creditCostPerQuestion = (providers || []).reduce(
      (sum, provider) => sum + (LLM_CREDIT_COSTS[provider] || 1),
      0
    ) || 1;
    const failedCredits = failed * creditCostPerQuestion;
    const creditsUsed = completed * creditCostPerQuestion;

    await serviceSupabase
      .from('llm_batch_runs')
      .update({
        status,
        processed_questions: items.length,
        successful_checks: completed,
        failed_checks: failed,
        total_credits_used: creditsUsed,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    console.log(`📋 [LLMBatch] Batch ${runId} ${status}: ${completed} completed, ${failed} failed`);

    // Send batch completion notification
    if (status === 'completed') {
      try {
        const stats = await computeLlmBatchStats(serviceSupabase, runId, accountId);
        await sendNotificationToAccount(accountId, 'batch_run_completed', { ...stats });
      } catch (notifError) {
        console.error(`[LLMBatch] Failed to send completion notification:`, notifError);
      }
    }

    // Refund credits for failed checks
    if (failedCredits > 0 && idempotencyKey) {
      try {
        await refundFeature(
          serviceSupabase,
          accountId,
          failedCredits,
          idempotencyKey,
          {
            featureType: 'llm_visibility',
            featureMetadata: {
              batchRunId: runId,
              failedQuestions: failed,
              failedCredits: failedCredits,
            },
            description: `Refund for ${failed} failed LLM questions (${failedCredits} credits) in batch ${runId}`,
          }
        );
        console.log(`💰 [LLMBatch] Refunded ${failedCredits} credits for ${failed} failed questions in batch ${runId}`);

        // Send notification about the refund
        await sendNotificationToAccount(accountId, 'credit_refund', {
          feature: 'llm_visibility',
          creditsRefunded: failedCredits,
          failedChecks: failed,
          batchRunId: runId,
        });
      } catch (refundError) {
        // Log but don't fail - the batch is complete, just couldn't refund
        console.error(`❌ [LLMBatch] Failed to refund credits for batch ${runId}:`, refundError);
      }
    }

    // Detect 100% failure with same root cause → alert admin
    if (failed > 0 && completed === 0) {
      const failedItems = items.filter(i => i.status === 'failed');
      const errorMessages = failedItems
        .map(i => (i as { error_message?: string }).error_message || '')
        .filter(Boolean);

      // Check if all errors share the same root cause (e.g., [DFS-402])
      const firstError = errorMessages[0] || '';
      const allSameError = errorMessages.length > 0 &&
        errorMessages.every(msg => msg === firstError);

      if (allSameError) {
        try {
          await sendAdminAlert({
            title: 'DataForSEO service issue detected',
            message: `All ${failed} checks in LLM batch ${runId} failed. DataForSEO account may need attention.`,
            data: {
              feature: 'llm_visibility',
              batchRunId: runId,
              errorSample: firstError.substring(0, 200),
            },
          });
          console.log(`🚨 [LLMBatch] Admin alert sent for 100% failure in batch ${runId}`);
        } catch (alertError) {
          console.error(`❌ [LLMBatch] Failed to send admin alert for batch ${runId}:`, alertError);
        }
      }
    }
  }
}

async function markBatchFailed(runId: string, errorMessage: string): Promise<void> {
  await serviceSupabase
    .from('llm_batch_runs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId);
}
