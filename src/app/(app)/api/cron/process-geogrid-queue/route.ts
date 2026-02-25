/**
 * Cron Processor: Process Geo-Grid Check Queue
 *
 * Picks up pending jobs from gg_check_jobs and runs rank checks.
 * Dispatched by process-all-batches every minute, and also triggered
 * fire-and-forget by the check endpoint for immediate processing.
 *
 * Each invocation processes all pending jobs sequentially with a
 * generous time budget (4 minutes out of the 5-minute serverless limit).
 */

export const maxDuration = 300;

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import { runRankChecks } from '@/features/geo-grid/services/rank-checker';
import { generateDailySummary } from '@/features/geo-grid/services/summary-aggregator';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
import { refundFeature } from '@/lib/credits';

// Time budget for the entire invocation — leave 60s headroom for cleanup
const INVOCATION_BUDGET_MS = 240_000;

// Time budget per job — generous for background processing
const PER_JOB_BUDGET_MS = 210_000;

// Mark jobs as stale if stuck in 'processing' for over 10 minutes
const STALE_JOB_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('process-geogrid-queue', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const invocationDeadline = Date.now() + INVOCATION_BUDGET_MS;

    // First, clean up stale 'processing' jobs (e.g. from a crashed invocation)
    const staleThreshold = new Date(Date.now() - STALE_JOB_MS).toISOString();
    const { data: staleJobs } = await supabase
      .from('gg_check_jobs')
      .select('id, account_id, config_id, started_at')
      .eq('status', 'processing')
      .lt('started_at', staleThreshold)
      .limit(10);

    for (const stale of staleJobs || []) {
      console.log(`🧹 [GeoGridQueue] Marking stale job ${stale.id} as failed`);
      await supabase
        .from('gg_check_jobs')
        .update({
          status: 'failed',
          error: 'Processing timed out (stale job cleanup)',
          completed_at: new Date().toISOString(),
        })
        .eq('id', stale.id);
    }

    // Get pending jobs ordered by creation time
    const { data: pendingJobs, error: fetchError } = await supabase
      .from('gg_check_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);

    if (fetchError) {
      throw new Error(`Failed to fetch pending jobs: ${fetchError.message}`);
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return { success: true, summary: { message: 'No pending jobs', processed: 0 } };
    }

    console.log(`📋 [GeoGridQueue] Found ${pendingJobs.length} pending jobs`);

    let processed = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      // Check invocation time budget
      if (Date.now() >= invocationDeadline) {
        console.warn(`⏱️ [GeoGridQueue] Invocation time budget reached after ${processed} jobs`);
        break;
      }

      const jobId = job.id;
      const accountId = job.account_id;
      const configId = job.config_id;
      const keywordIds: string[] = job.keyword_ids || [];

      console.log(`🔍 [GeoGridQueue] Processing job ${jobId} for account ${accountId}`);

      // Mark as processing
      await supabase
        .from('gg_check_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId);

      try {
        // Fetch config
        const { data: configRow, error: configError } = await supabase
          .from('gg_configs')
          .select('*')
          .eq('id', configId)
          .eq('account_id', accountId)
          .single();

        if (configError || !configRow) {
          throw new Error(`Config not found: ${configError?.message || 'missing'}`);
        }

        const config = transformConfigToResponse(configRow);

        if (!config.targetPlaceId) {
          throw new Error('Config is missing target Place ID');
        }

        // Run rank checks with generous time budget for background processing
        const result = await runRankChecks(config, supabase, {
          keywordIds: keywordIds.length > 0 ? keywordIds : undefined,
          maxExecutionMs: PER_JOB_BUDGET_MS,
        });

        // Generate daily summary
        if (result.checksPerformed > 0) {
          try {
            await generateDailySummary(configId, accountId, supabase, { force: true });
          } catch (summaryErr) {
            console.error(`⚠️ [GeoGridQueue] Summary generation failed for job ${jobId}:`, summaryErr);
          }
        }

        // Mark job as complete
        await supabase
          .from('gg_check_jobs')
          .update({
            status: 'complete',
            checks_performed: result.checksPerformed,
            total_checks: result.totalChecks,
            total_cost: result.totalCost,
            error: result.errors.length > 0 ? result.errors.join('; ') : null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        console.log(`✅ [GeoGridQueue] Job ${jobId} complete: ${result.checksPerformed}/${result.totalChecks} checks`);
        processed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ [GeoGridQueue] Job ${jobId} failed:`, errorMsg);

        // Refund credits on total failure
        if (job.credits_idempotency_key && job.credits_used > 0) {
          try {
            await refundFeature(supabase, accountId, job.credits_used, job.credits_idempotency_key, {
              featureType: 'geo_grid',
              featureMetadata: { reason: 'queue_job_failed', error: errorMsg },
              description: 'Refund: Geo grid queue job failed',
            });
            console.log(`💸 [GeoGridQueue] Refunded ${job.credits_used} credits for job ${jobId}`);
          } catch (refundErr) {
            console.error(`⚠️ [GeoGridQueue] Refund failed for job ${jobId}:`, refundErr);
          }
        }

        await supabase
          .from('gg_check_jobs')
          .update({
            status: 'failed',
            error: errorMsg,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        failed++;
      }
    }

    return {
      success: true,
      summary: {
        pending: pendingJobs.length,
        processed,
        failed,
        staleCleanedUp: staleJobs?.length || 0,
      },
    };
  });
}
