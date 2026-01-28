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
import { sendNotificationToAccount } from '@/utils/notifications';
import type { LLMProvider } from '@/features/llm-visibility/utils/types';

// Extend timeout for this route
export const maxDuration = 300; // 5 minutes

// Process up to N questions per execution to stay within timeout
// With 5-minute timeout and ~10-15s per question, we can safely do 15-20
const ITEMS_PER_EXECUTION = 15;

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

        const providerCount = (stuckRun.providers as LLMProvider[])?.length || 1;
        let completedCount = 0;
        let failedCount = 0;
        if (items) {
          for (const item of items) {
            if (item.status === 'completed') {
              completedCount += providerCount;
            } else {
              failedCount += providerCount;
            }
          }
        }

        // Calculate credits used (only completed checks)
        const creditsUsed = completedCount;

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
        if (failedCount > 0 && stuckRun.idempotency_key) {
          try {
            await refundFeature(
              serviceSupabase,
              stuckRun.account_id,
              failedCount,
              stuckRun.idempotency_key,
              {
                featureType: 'llm_visibility',
                featureMetadata: {
                  batchRunId: stuckRun.id,
                  failedChecks: failedCount,
                  reason: 'timeout',
                },
                description: `Refund for ${failedCount} uncompleted LLM checks (batch timed out)`,
              }
            );
            console.log(`💰 [LLMBatch] Refunded ${failedCount} credits for timed out batch ${stuckRun.id}`);

            // Send notification about the refund
            await sendNotificationToAccount(stuckRun.account_id, 'credit_refund', {
              feature: 'llm_visibility',
              creditsRefunded: failedCount,
              failedChecks: failedCount,
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
            // Mark item as failed
            const errorMsg = result.errors.join('; ') || 'No checks performed';
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

          // Update summary for this keyword
          await updateSummary(item.keyword_id, run.account_id, serviceSupabase);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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
    .select('status')
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

    // Calculate credits: each question costs N credits (one per provider)
    const providerCount = providers?.length || 1;
    const failedCheckCount = failed * providerCount;
    const creditsUsed = completed * providerCount;

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

    // Refund credits for failed checks
    if (failedCheckCount > 0 && idempotencyKey) {
      try {
        await refundFeature(
          serviceSupabase,
          accountId,
          failedCheckCount,
          idempotencyKey,
          {
            featureType: 'llm_visibility',
            featureMetadata: {
              batchRunId: runId,
              failedChecks: failedCheckCount,
            },
            description: `Refund for ${failedCheckCount} failed LLM checks in batch ${runId}`,
          }
        );
        console.log(`💰 [LLMBatch] Refunded ${failedCheckCount} credits for failed checks in batch ${runId}`);

        // Send notification about the refund
        await sendNotificationToAccount(accountId, 'credit_refund', {
          feature: 'llm_visibility',
          creditsRefunded: failedCheckCount,
          failedChecks: failedCheckCount,
          batchRunId: runId,
        });
      } catch (refundError) {
        // Log but don't fail - the batch is complete, just couldn't refund
        console.error(`❌ [LLMBatch] Failed to refund credits for batch ${runId}:`, refundError);
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
