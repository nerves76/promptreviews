/**
 * Cron Job: Process Rank Batch Runs
 *
 * Processes queued rank batch runs, checking a limited number of keywords
 * per execution to stay within timeout limits. Runs every minute.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import { checkRankForDomain } from '@/features/rank-tracking/api/dataforseo-serp-client';
import { refundFeature } from '@/lib/credits';
import { sendNotificationToAccount, sendAdminAlert } from '@/utils/notifications';
import { shouldRetry } from '@/utils/retryHelpers';

// Extend timeout for this route
export const maxDuration = 300; // 5 minutes

// Process up to N keywords per execution (each has 2 API calls: desktop + mobile)
// With 5-minute timeout and ~10-15s per keyword, we can safely do 15-20
const ITEMS_PER_EXECUTION = 15;

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BatchRunRow {
  id: string;
  account_id: string;
  status: string;
  total_keywords: number;
  processed_keywords: number;
  successful_checks: number;
  failed_checks: number;
  started_at: string | null;
  idempotency_key: string | null;
}

interface BatchRunItemRow {
  id: string;
  batch_run_id: string;
  keyword_id: string;
  search_term: string;
  location_code: number | null;
  desktop_status: string;
  mobile_status: string;
  retry_count: number;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('process-rank-batch', async () => {
    // First, clean up any stuck runs (processing for > 2 hours)
    // With ~15 keywords/minute, even 1800 keywords would complete in 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: stuckRuns } = await serviceSupabase
      .from('rank_batch_runs')
      .select('id, account_id, idempotency_key, estimated_credits, processed_keywords, total_keywords')
      .eq('status', 'processing')
      .lt('started_at', twoHoursAgo);

    if (stuckRuns && stuckRuns.length > 0) {
      console.log(`📋 [RankBatch] Found ${stuckRuns.length} stuck runs, marking as failed`);
      for (const stuckRun of stuckRuns) {
        // Count how many checks were NOT completed (each keyword = 2 checks)
        const { data: items } = await serviceSupabase
          .from('rank_batch_run_items')
          .select('desktop_status, mobile_status')
          .eq('batch_run_id', stuckRun.id);

        let failedCheckCount = 0;
        let completedCheckCount = 0;
        if (items) {
          for (const item of items) {
            if (item.desktop_status === 'completed') completedCheckCount++;
            else failedCheckCount++;
            if (item.mobile_status === 'completed') completedCheckCount++;
            else failedCheckCount++;
          }
        }

        await serviceSupabase
          .from('rank_batch_runs')
          .update({
            status: 'failed',
            error_message: 'Run timed out after 2 hours',
            completed_at: new Date().toISOString(),
            total_credits_used: completedCheckCount,
          })
          .eq('id', stuckRun.id);

        // Refund credits for uncompleted checks
        if (failedCheckCount > 0 && stuckRun.idempotency_key) {
          try {
            await refundFeature(
              serviceSupabase,
              stuckRun.account_id,
              failedCheckCount,
              stuckRun.idempotency_key,
              {
                featureType: 'rank_tracking',
                featureMetadata: {
                  batchRunId: stuckRun.id,
                  failedChecks: failedCheckCount,
                  reason: 'timeout',
                },
                description: `Refund for ${failedCheckCount} uncompleted rank checks (batch timed out)`,
              }
            );
            console.log(`💰 [RankBatch] Refunded ${failedCheckCount} credits for timed out batch ${stuckRun.id}`);

            // Send notification about the refund
            await sendNotificationToAccount(stuckRun.account_id, 'credit_refund', {
              feature: 'rank_tracking',
              creditsRefunded: failedCheckCount,
              failedChecks: failedCheckCount,
              batchRunId: stuckRun.id,
            });
          } catch (refundError) {
            console.error(`❌ [RankBatch] Failed to refund credits for timed out batch ${stuckRun.id}:`, refundError);
          }
        }
      }
    }

    // Find oldest pending or processing batch run
    // Only process runs where scheduled_for is NULL (immediate) or in the past
    const now = new Date().toISOString();
    const { data: batchRun, error: runError } = await serviceSupabase
      .from('rank_batch_runs')
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
    console.log(`📋 [RankBatch] Processing batch run ${run.id}`);

    try {
      // Mark as processing if pending
      if (run.status === 'pending') {
        await serviceSupabase
          .from('rank_batch_runs')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', run.id);
      }

      // Get business data for domain
      const { data: business } = await serviceSupabase
        .from('businesses')
        .select('id, business_website')
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

      // Get next batch of items that need processing
      // An item needs processing if desktop_status or mobile_status is 'pending'
      const { data: pendingItems, error: itemsError } = await serviceSupabase
        .from('rank_batch_run_items')
        .select('*')
        .eq('batch_run_id', run.id)
        .or('desktop_status.eq.pending,mobile_status.eq.pending')
        .order('created_at', { ascending: true })
        .limit(ITEMS_PER_EXECUTION);

      if (itemsError) {
        console.error('❌ [RankBatch] Failed to fetch pending items:', itemsError);
        return { success: false, error: 'Failed to fetch pending items' };
      }

      const items = (pendingItems || []) as BatchRunItemRow[];

      if (items.length === 0) {
        // No more pending items - check if all are done
        await checkAndCompleteBatch(run.id, run.account_id, run.idempotency_key);
        return { success: true, summary: { message: 'No pending items, checked completion' } };
      }

      console.log(`   Processing ${items.length} items...`);

      let successCount = 0;
      let failCount = 0;

      // Process each item
      for (const item of items) {
        const locationCode = item.location_code || 2840; // Default to USA
        console.log(`   → Keyword: "${item.search_term}"`);

        // Track whether retry_count was already incremented for this item in this pass
        let retryIncrementedThisPass = false;

        // Process desktop if pending
        if (item.desktop_status === 'pending') {
          await serviceSupabase
            .from('rank_batch_run_items')
            .update({ desktop_status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', item.id);

          try {
            const result = await checkRankForDomain({
              keyword: item.search_term,
              locationCode,
              targetDomain,
              device: 'desktop',
            });

            // Store result
            await serviceSupabase.from('rank_checks').insert({
              account_id: run.account_id,
              keyword_id: item.keyword_id,
              search_query_used: item.search_term,
              location_code: locationCode,
              device: 'desktop',
              position: result.position,
              found_url: result.url,
              checked_at: new Date().toISOString(),
            });

            await serviceSupabase
              .from('rank_batch_run_items')
              .update({ desktop_status: 'completed', updated_at: new Date().toISOString() })
              .eq('id', item.id);
            successCount++;
            console.log(`   ✓ Desktop: ${result.found ? `#${result.position}` : 'Not found'}`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            if (shouldRetry(item.retry_count, errorMsg)) {
              // Transient error — set desktop back to pending for retry
              const newRetryCount = item.retry_count + 1;
              await serviceSupabase
                .from('rank_batch_run_items')
                .update({
                  desktop_status: 'pending',
                  retry_count: newRetryCount,
                  error_message: null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id);
              retryIncrementedThisPass = true;
              console.log(`   ↻ Desktop retrying (attempt ${newRetryCount + 1}/3): ${errorMsg}`);
            } else {
              await serviceSupabase
                .from('rank_batch_run_items')
                .update({
                  desktop_status: 'failed',
                  error_message: `Desktop: ${errorMsg}`,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id);
              failCount++;
              console.error(`   ✗ Desktop error: ${errorMsg}`);
            }
          }

          // Small delay between API calls
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Process mobile if pending
        if (item.mobile_status === 'pending') {
          await serviceSupabase
            .from('rank_batch_run_items')
            .update({ mobile_status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', item.id);

          try {
            const result = await checkRankForDomain({
              keyword: item.search_term,
              locationCode,
              targetDomain,
              device: 'mobile',
            });

            // Store result
            await serviceSupabase.from('rank_checks').insert({
              account_id: run.account_id,
              keyword_id: item.keyword_id,
              search_query_used: item.search_term,
              location_code: locationCode,
              device: 'mobile',
              position: result.position,
              found_url: result.url,
              checked_at: new Date().toISOString(),
            });

            await serviceSupabase
              .from('rank_batch_run_items')
              .update({ mobile_status: 'completed', updated_at: new Date().toISOString() })
              .eq('id', item.id);
            successCount++;
            console.log(`   ✓ Mobile: ${result.found ? `#${result.position}` : 'Not found'}`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            if (shouldRetry(item.retry_count, errorMsg)) {
              // Transient error — set mobile back to pending for retry
              // Only increment retry_count once per item per pass
              const newRetryCount = item.retry_count + 1;
              await serviceSupabase
                .from('rank_batch_run_items')
                .update({
                  mobile_status: 'pending',
                  ...(!retryIncrementedThisPass ? { retry_count: newRetryCount } : {}),
                  error_message: null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id);
              retryIncrementedThisPass = true;
              console.log(`   ↻ Mobile retrying (attempt ${newRetryCount + 1}/3): ${errorMsg}`);
            } else {
              await serviceSupabase
                .from('rank_batch_run_items')
                .update({
                  mobile_status: 'failed',
                  error_message: `Mobile: ${errorMsg}`,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id);
              failCount++;
              console.error(`   ✗ Mobile error: ${errorMsg}`);
            }
          }

          // Small delay between API calls
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Update batch run progress
      // Count how many items are fully processed
      const { data: allItems } = await serviceSupabase
        .from('rank_batch_run_items')
        .select('desktop_status, mobile_status')
        .eq('batch_run_id', run.id);

      const processedCount = (allItems || []).filter(
        i => ['completed', 'failed'].includes(i.desktop_status) &&
             ['completed', 'failed'].includes(i.mobile_status)
      ).length;

      const successfulCount = (allItems || []).filter(
        i => i.desktop_status === 'completed' && i.mobile_status === 'completed'
      ).length;

      const failedCount = (allItems || []).filter(
        i => i.desktop_status === 'failed' || i.mobile_status === 'failed'
      ).length;

      await serviceSupabase
        .from('rank_batch_runs')
        .update({
          processed_keywords: processedCount,
          successful_checks: successfulCount,
          failed_checks: failedCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', run.id);

      // Check if batch is complete
      await checkAndCompleteBatch(run.id, run.account_id, run.idempotency_key);

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
      console.error(`❌ [RankBatch] Error processing batch ${run.id}:`, error);
      await markBatchFailed(run.id, errorMessage);
      return { success: false, error: errorMessage };
    }
  });
}

async function checkAndCompleteBatch(
  runId: string,
  accountId: string,
  idempotencyKey: string | null
): Promise<void> {
  // Get counts of item statuses
  const { data: items } = await serviceSupabase
    .from('rank_batch_run_items')
    .select('desktop_status, mobile_status, error_message')
    .eq('batch_run_id', runId);

  if (!items) return;

  // Check if all items are fully processed (both desktop and mobile)
  const allComplete = items.every(
    i => ['completed', 'failed', 'skipped'].includes(i.desktop_status) &&
         ['completed', 'failed', 'skipped'].includes(i.mobile_status)
  );

  if (allComplete) {
    const totalItems = items.length;
    const successfulItems = items.filter(
      i => i.desktop_status === 'completed' && i.mobile_status === 'completed'
    ).length;
    const failedItems = items.filter(
      i => i.desktop_status === 'failed' || i.mobile_status === 'failed'
    ).length;

    // Count individual failed checks (each desktop/mobile is 1 credit)
    let failedCheckCount = 0;
    for (const item of items) {
      if (item.desktop_status === 'failed') failedCheckCount++;
      if (item.mobile_status === 'failed') failedCheckCount++;
    }

    const status = failedItems === totalItems ? 'failed' : 'completed';
    const errorMessage = failedItems > 0 ? `${failedItems} of ${totalItems} keywords had errors` : null;

    // Calculate actual credits used (only count successful checks)
    const creditsUsed = (totalItems * 2) - failedCheckCount;

    await serviceSupabase
      .from('rank_batch_runs')
      .update({
        status,
        processed_keywords: totalItems,
        successful_checks: successfulItems,
        failed_checks: failedItems,
        total_credits_used: creditsUsed,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    console.log(`📋 [RankBatch] Batch ${runId} ${status}: ${successfulItems} completed, ${failedItems} failed`);

    // Refund credits for failed checks
    if (failedCheckCount > 0 && idempotencyKey) {
      try {
        await refundFeature(
          serviceSupabase,
          accountId,
          failedCheckCount,
          idempotencyKey,
          {
            featureType: 'rank_tracking',
            featureMetadata: {
              batchRunId: runId,
              failedChecks: failedCheckCount,
            },
            description: `Refund for ${failedCheckCount} failed rank checks in batch ${runId}`,
          }
        );
        console.log(`💰 [RankBatch] Refunded ${failedCheckCount} credits for failed checks in batch ${runId}`);

        // Send notification about the refund
        await sendNotificationToAccount(accountId, 'credit_refund', {
          feature: 'rank_tracking',
          creditsRefunded: failedCheckCount,
          failedChecks: failedCheckCount,
          batchRunId: runId,
        });
      } catch (refundError) {
        // Log but don't fail - the batch is complete, just couldn't refund
        console.error(`❌ [RankBatch] Failed to refund credits for batch ${runId}:`, refundError);
      }
    }

    // Detect 100% failure with same root cause → alert admin
    if (failedItems === totalItems && totalItems > 0) {
      const errorMessages = items
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
            message: `All ${totalItems} keywords in rank batch ${runId} failed. DataForSEO account may need attention.`,
            data: {
              feature: 'rank_tracking',
              batchRunId: runId,
              errorSample: firstError.substring(0, 200),
            },
          });
          console.log(`🚨 [RankBatch] Admin alert sent for 100% failure in batch ${runId}`);
        } catch (alertError) {
          console.error(`❌ [RankBatch] Failed to send admin alert for batch ${runId}:`, alertError);
        }
      }
    }
  }
}

async function markBatchFailed(runId: string, errorMessage: string): Promise<void> {
  await serviceSupabase
    .from('rank_batch_runs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId);
}
