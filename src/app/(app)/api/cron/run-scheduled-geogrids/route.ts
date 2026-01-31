/**
 * Cron Job: Run Scheduled Geo-Grid Checks
 *
 * Runs every hour to execute scheduled geo-grid rank checks.
 * Uses two-phase scheduling:
 *
 * Phase 1: Config-level scheduling (keywords with schedule_mode = 'inherit')
 *   - Queries configs where next_scheduled_at <= NOW()
 *   - Runs all inherited keywords for each config as a batch
 *
 * Phase 2: Per-keyword scheduling (keywords with schedule_mode = 'custom')
 *   - Queries keywords where next_scheduled_at <= NOW()
 *   - Runs individual keyword checks
 *
 * Security: Uses CRON_SECRET for authorization.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import { runRankChecks } from '@/features/geo-grid/services/rank-checker';
import { generateDailySummary } from '@/features/geo-grid/services/summary-aggregator';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
import {
  calculateGeogridCost,
  debit,
  refundFeature,
  ensureBalanceExists,
  getBalance,
} from '@/lib/credits';
import { sendNotificationToAccount } from '@/utils/notifications';
import { computeGeoGridStats, mergeBatchStats, type BatchCompletionStats } from '@/utils/batchCompletionStats';

// Cost limit per check run (safety measure)
const MAX_COST_PER_RUN_USD = 5.0;

interface ProcessResult {
  configId: string;
  keywordId?: string;
  accountId: string;
  creditsUsed: number;
  checksPerformed: number;
  status: 'success' | 'skipped' | 'insufficient_credits' | 'error';
  error?: string;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('run-scheduled-geogrids', async () => {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    const results = {
      phase1: {
        processed: 0,
        skipped: 0,
        insufficientCredits: 0,
        errors: 0,
      },
      phase2: {
        processed: 0,
        skipped: 0,
        insufficientCredits: 0,
        errors: 0,
      },
      details: [] as ProcessResult[],
    };

    // Accumulate stats per account for batch completion notifications
    const accountStatsMap = new Map<string, BatchCompletionStats>();

    // ========================================
    // PHASE 1: Config-level scheduling
    // Process configs where keywords inherit the config schedule
    // ========================================
    console.log('📋 [Scheduled GeoGrids] Phase 1: Config-level scheduling');

    const { data: dueConfigs, error: configsError } = await supabase
      .from('gg_configs')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .or(`next_scheduled_at.lte.${now},next_scheduled_at.is.null`);

    if (configsError) {
      throw new Error('Failed to fetch configurations');
    }

    console.log(`   Found ${dueConfigs?.length || 0} configs due to run`);

    for (const configRow of dueConfigs || []) {
      const accountId = configRow.account_id;
      const configId = configRow.id;

      try {
        // Validate config has target
        if (!configRow.target_place_id) {
          console.log(`   ⏭️ Config ${configId} has no target Place ID, skipping`);
          results.phase1.skipped++;
          results.details.push({
            configId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'No target Place ID',
          });
          continue;
        }

        const config = transformConfigToResponse(configRow);

        // Count inherited keywords (schedule_mode = 'inherit' or NULL for backward compatibility)
        const { data: inheritedKeywords, count: keywordCount } = await supabase
          .from('gg_tracked_keywords')
          .select('keyword_id', { count: 'exact' })
          .eq('config_id', configId)
          .eq('is_enabled', true)
          .or('schedule_mode.is.null,schedule_mode.eq.inherit');

        if (!keywordCount || keywordCount === 0) {
          console.log(`   ⏭️ Config ${configId} has no inherited keywords, skipping`);
          results.phase1.skipped++;
          results.details.push({
            configId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'No inherited keywords',
          });

          // Still update last_scheduled_run_at to advance the schedule
          await supabase
            .from('gg_configs')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', configId);

          continue;
        }

        // Calculate credit cost (simplified: just grid points)
        const pointCount = config.checkPoints.length;
        const creditCost = calculateGeogridCost(pointCount);

        // Ensure balance record exists
        await ensureBalanceExists(supabase, accountId);

        // Check credit balance
        const balance = await getBalance(supabase, accountId);
        if (balance.totalCredits < creditCost) {
          console.log(`   💸 Insufficient credits for ${accountId}: need ${creditCost}, have ${balance.totalCredits}`);

          // Send notification about skipped check
          await sendNotificationToAccount(accountId, 'credit_check_skipped', {
            required: creditCost,
            available: balance.totalCredits,
            feature: 'geo_grid',
          });

          // Update last_scheduled_run_at to advance the schedule
          await supabase
            .from('gg_configs')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', configId);

          results.phase1.insufficientCredits++;
          results.details.push({
            configId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'insufficient_credits',
            error: `Need ${creditCost}, have ${balance.totalCredits}`,
          });
          continue;
        }

        // Check estimated API cost
        const estimatedCalls = keywordCount * pointCount;
        const estimatedApiCost = estimatedCalls * 0.002;

        if (estimatedApiCost > MAX_COST_PER_RUN_USD) {
          console.log(`   ⏭️ API cost too high for ${configId}: $${estimatedApiCost.toFixed(2)}`);
          results.phase1.skipped++;
          results.details.push({
            configId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: `API cost too high: $${estimatedApiCost.toFixed(2)}`,
          });

          await supabase
            .from('gg_configs')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', configId);

          continue;
        }

        // Generate idempotency key
        const checkId = `scheduled-config-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const idempotencyKey = `geo_grid:${accountId}:${checkId}`;

        // Debit credits
        console.log(`   💳 Debiting ${creditCost} credits for ${accountId}`);
        await debit(supabase, accountId, creditCost, {
          featureType: 'geo_grid',
          featureMetadata: {
            pointCount,
            keywordCount,
            checkId,
            scheduled: true,
            phase: 'config',
          },
          idempotencyKey,
          description: `Scheduled geo grid: ${pointCount} points, ${keywordCount} keywords`,
        });

        // Get keyword IDs for inherited keywords only
        const keywordIds = (inheritedKeywords || []).map((k: any) => k.keyword_id);

        // Run the checks
        console.log(`   🔍 Running checks for config ${configId}`);
        let result;
        try {
          result = await runRankChecks(config, supabase, { keywordIds });
        } catch (runError) {
          // Refund on failure
          console.error(`   ❌ Check failed for ${configId}, refunding`);
          await refundFeature(supabase, accountId, creditCost, idempotencyKey, {
            featureType: 'geo_grid',
            featureMetadata: { reason: 'scheduled_check_failed', error: String(runError) },
            description: 'Refund: Scheduled geo grid check failed',
          });
          throw runError;
        }

        // Generate daily summary
        if (result.checksPerformed > 0) {
          await generateDailySummary(configId, accountId, supabase, { force: true });
        }

        // Update last_scheduled_run_at (trigger will calculate next_scheduled_at)
        await supabase
          .from('gg_configs')
          .update({ last_scheduled_run_at: new Date().toISOString() })
          .eq('id', configId);

        // Compute stats for batch completion notification
        try {
          const stats = await computeGeoGridStats(supabase, accountId, configId, keywordIds, now);
          const existing = accountStatsMap.get(accountId);
          accountStatsMap.set(accountId, existing ? mergeBatchStats(existing, stats) : stats);
        } catch (statsError) {
          console.error(`   ⚠️ Failed to compute geo-grid stats for ${configId}:`, statsError);
        }

        console.log(`   ✅ Completed ${configId}: ${result.checksPerformed} checks`);

        results.phase1.processed++;
        results.details.push({
          configId,
          accountId,
          creditsUsed: creditCost,
          checksPerformed: result.checksPerformed,
          status: 'success',
        });

        // Small delay between configs to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`   ❌ Error processing ${configId}:`, error);
        results.phase1.errors++;
        results.details.push({
          configId,
          accountId,
          creditsUsed: 0,
          checksPerformed: 0,
          status: 'error',
          error: error.message,
        });

        // Still advance schedule so we don't retry immediately
        await supabase
          .from('gg_configs')
          .update({ last_scheduled_run_at: new Date().toISOString() })
          .eq('id', configId);
      }
    }

    // ========================================
    // PHASE 2: Per-keyword scheduling
    // Process keywords with custom schedules
    // ========================================
    console.log('📋 [Scheduled GeoGrids] Phase 2: Per-keyword scheduling');

    const { data: dueKeywords, error: keywordsError } = await supabase
      .from('gg_tracked_keywords')
      .select(`
        id,
        keyword_id,
        config_id,
        account_id,
        gg_configs!inner (
          id,
          account_id,
          center_lat,
          center_lng,
          radius_miles,
          check_points,
          target_place_id,
          is_enabled,
          location_name,
          google_business_location_id,
          last_checked_at,
          created_at,
          updated_at,
          schedule_frequency,
          schedule_day_of_week,
          schedule_day_of_month,
          schedule_hour,
          next_scheduled_at,
          last_scheduled_run_at
        )
      `)
      .eq('schedule_mode', 'custom')
      .eq('is_enabled', true)
      .or(`next_scheduled_at.lte.${now},next_scheduled_at.is.null`);

    if (keywordsError) {
      console.error('Failed to fetch custom-scheduled keywords:', keywordsError);
    } else {
      console.log(`   Found ${dueKeywords?.length || 0} custom-scheduled keywords due to run`);

      for (const keywordRow of dueKeywords || []) {
        const accountId = keywordRow.account_id;
        const configId = keywordRow.config_id;
        const keywordId = keywordRow.keyword_id;
        const trackedKeywordId = keywordRow.id;
        const configData = (keywordRow as any).gg_configs;

        try {
          // Validate config
          if (!configData?.target_place_id) {
            console.log(`   ⏭️ Keyword ${keywordId} config has no target Place ID, skipping`);
            results.phase2.skipped++;
            results.details.push({
              configId,
              keywordId,
              accountId,
              creditsUsed: 0,
              checksPerformed: 0,
              status: 'skipped',
              error: 'No target Place ID',
            });
            continue;
          }

          if (!configData.is_enabled) {
            console.log(`   ⏭️ Keyword ${keywordId} config is disabled, skipping`);
            results.phase2.skipped++;
            results.details.push({
              configId,
              keywordId,
              accountId,
              creditsUsed: 0,
              checksPerformed: 0,
              status: 'skipped',
              error: 'Config is disabled',
            });
            continue;
          }

          const config = transformConfigToResponse(configData);

          // Calculate credit cost for single keyword (just grid points)
          const pointCount = config.checkPoints.length;
          const creditCost = calculateGeogridCost(pointCount);

          // Ensure balance record exists
          await ensureBalanceExists(supabase, accountId);

          // Check credit balance
          const balance = await getBalance(supabase, accountId);
          if (balance.totalCredits < creditCost) {
            console.log(`   💸 Insufficient credits for keyword ${keywordId}: need ${creditCost}, have ${balance.totalCredits}`);

            // Update last_scheduled_run_at to advance the schedule
            await supabase
              .from('gg_tracked_keywords')
              .update({ last_scheduled_run_at: new Date().toISOString() })
              .eq('id', trackedKeywordId);

            results.phase2.insufficientCredits++;
            results.details.push({
              configId,
              keywordId,
              accountId,
              creditsUsed: 0,
              checksPerformed: 0,
              status: 'insufficient_credits',
              error: `Need ${creditCost}, have ${balance.totalCredits}`,
            });
            continue;
          }

          // Generate idempotency key
          const checkId = `scheduled-kw-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const idempotencyKey = `geo_grid:${accountId}:${checkId}`;

          // Debit credits
          console.log(`   💳 Debiting ${creditCost} credits for keyword ${keywordId}`);
          await debit(supabase, accountId, creditCost, {
            featureType: 'geo_grid',
            featureMetadata: {
              pointCount,
              keywordCount: 1,
              keywordId,
              checkId,
              scheduled: true,
              phase: 'keyword',
            },
            idempotencyKey,
            description: `Scheduled geo grid: ${pointCount} points, 1 keyword`,
          });

          // Run the check for single keyword
          console.log(`   🔍 Running check for keyword ${keywordId}`);
          let result;
          try {
            result = await runRankChecks(config, supabase, { keywordIds: [keywordId] });
          } catch (runError) {
            console.error(`   ❌ Check failed for keyword ${keywordId}, refunding`);
            await refundFeature(supabase, accountId, creditCost, idempotencyKey, {
              featureType: 'geo_grid',
              featureMetadata: { reason: 'scheduled_check_failed', error: String(runError) },
              description: 'Refund: Scheduled geo grid check failed',
            });
            throw runError;
          }

          // Generate daily summary
          if (result.checksPerformed > 0) {
            await generateDailySummary(configId, accountId, supabase, { force: true });
          }

          // Update last_scheduled_run_at (trigger will calculate next_scheduled_at)
          await supabase
            .from('gg_tracked_keywords')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', trackedKeywordId);

          // Compute stats for batch completion notification
          try {
            const stats = await computeGeoGridStats(supabase, accountId, configId, [keywordId], now);
            const existing = accountStatsMap.get(accountId);
            accountStatsMap.set(accountId, existing ? mergeBatchStats(existing, stats) : stats);
          } catch (statsError) {
            console.error(`   ⚠️ Failed to compute geo-grid stats for keyword ${keywordId}:`, statsError);
          }

          console.log(`   ✅ Completed keyword ${keywordId}: ${result.checksPerformed} checks`);

          results.phase2.processed++;
          results.details.push({
            configId,
            keywordId,
            accountId,
            creditsUsed: creditCost,
            checksPerformed: result.checksPerformed,
            status: 'success',
          });

          // Small delay between keywords to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));

        } catch (error: any) {
          console.error(`   ❌ Error processing keyword ${keywordId}:`, error);
          results.phase2.errors++;
          results.details.push({
            configId,
            keywordId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'error',
            error: error.message,
          });

          // Still advance schedule so we don't retry immediately
          await supabase
            .from('gg_tracked_keywords')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', trackedKeywordId);
        }
      }
    }

    // Send aggregated batch completion notifications per account
    for (const [acctId, stats] of accountStatsMap) {
      try {
        await sendNotificationToAccount(acctId, 'batch_run_completed', { ...stats });
      } catch (notifError) {
        console.error(`[ScheduledGeoGrids] Failed to send completion notification for account ${acctId}:`, notifError);
      }
    }

    return {
      success: true,
      summary: {
        phase1: {
          total: dueConfigs?.length || 0,
          processed: results.phase1.processed,
          skipped: results.phase1.skipped,
          insufficientCredits: results.phase1.insufficientCredits,
          errors: results.phase1.errors,
        },
        phase2: {
          total: dueKeywords?.length || 0,
          processed: results.phase2.processed,
          skipped: results.phase2.skipped,
          insufficientCredits: results.phase2.insufficientCredits,
          errors: results.phase2.errors,
        },
      },
    };
  });
}
