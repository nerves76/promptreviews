/**
 * Cron Job: Run Scheduled Geo-Grid Checks
 *
 * Runs every hour to execute scheduled geo-grid rank checks.
 * Queries configs where next_scheduled_at <= NOW() and runs the checks.
 *
 * Security: Uses CRON_SECRET_TOKEN for authorization.
 *
 * Flow:
 * 1. Find all configs due to run
 * 2. For each config:
 *    a. Check credit balance
 *    b. If insufficient: skip and send notification
 *    c. If sufficient: run checks, update timestamps
 * 3. Return summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runRankChecks } from '@/features/geo-grid/services/rank-checker';
import { generateDailySummary } from '@/features/geo-grid/services/summary-aggregator';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
import {
  calculateGeogridCost,
  checkGeogridCredits,
  debit,
  refundFeature,
  ensureBalanceExists,
  getBalance,
} from '@/lib/credits';
import { sendNotificationToAccount } from '@/utils/notifications';

// Cost limit per check run (safety measure)
const MAX_COST_PER_RUN_USD = 5.0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔄 [Scheduled GeoGrids] Starting scheduled check job');

  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('❌ [Scheduled GeoGrids] Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all configs that are due to run
    const { data: dueConfigs, error: configsError } = await supabase
      .from('gg_configs')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .lte('next_scheduled_at', new Date().toISOString());

    if (configsError) {
      console.error('❌ [Scheduled GeoGrids] Failed to fetch configs:', configsError);
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    console.log(`📋 [Scheduled GeoGrids] Found ${dueConfigs?.length || 0} configs due to run`);

    const results = {
      processed: 0,
      skipped: 0,
      insufficientCredits: 0,
      errors: 0,
      details: [] as Array<{
        configId: string;
        accountId: string;
        creditsUsed: number;
        checksPerformed: number;
        status: 'success' | 'skipped' | 'insufficient_credits' | 'error';
        error?: string;
      }>,
    };

    // Process each config
    for (const configRow of dueConfigs || []) {
      const accountId = configRow.account_id;
      const configId = configRow.id;

      try {
        // Validate config has target
        if (!configRow.target_place_id) {
          console.log(`⏭️ [Scheduled GeoGrids] Config ${configId} has no target Place ID, skipping`);
          results.skipped++;
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

        // Count tracked keywords
        const { count: keywordCount } = await supabase
          .from('gg_tracked_keywords')
          .select('*', { count: 'exact', head: true })
          .eq('config_id', configId)
          .eq('is_enabled', true);

        if (!keywordCount || keywordCount === 0) {
          console.log(`⏭️ [Scheduled GeoGrids] Config ${configId} has no keywords, skipping`);
          results.skipped++;
          results.details.push({
            configId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'No tracked keywords',
          });

          // Still update last_scheduled_run_at to advance the schedule
          await supabase
            .from('gg_configs')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', configId);

          continue;
        }

        // Calculate grid size and credit cost
        const pointCount = config.checkPoints.length;
        const gridSize = Math.sqrt(pointCount);
        const creditCost = calculateGeogridCost(gridSize, keywordCount);

        // Ensure balance record exists
        await ensureBalanceExists(supabase, accountId);

        // Check credit balance
        const creditCheck = await checkGeogridCredits(supabase, accountId, gridSize, keywordCount);

        if (!creditCheck.hasCredits) {
          console.log(`💸 [Scheduled GeoGrids] Insufficient credits for ${accountId}: need ${creditCheck.required}, have ${creditCheck.available}`);

          // Send notification about skipped check
          await sendNotificationToAccount(accountId, 'credit_check_skipped', {
            required: creditCheck.required,
            available: creditCheck.available,
          });

          // Update last_scheduled_run_at to advance the schedule (don't retry immediately)
          await supabase
            .from('gg_configs')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', configId);

          results.insufficientCredits++;
          results.details.push({
            configId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'insufficient_credits',
            error: `Need ${creditCheck.required}, have ${creditCheck.available}`,
          });
          continue;
        }

        // Check estimated API cost
        const estimatedCalls = keywordCount * pointCount;
        const estimatedApiCost = estimatedCalls * 0.002;

        if (estimatedApiCost > MAX_COST_PER_RUN_USD) {
          console.log(`⏭️ [Scheduled GeoGrids] API cost too high for ${configId}: $${estimatedApiCost.toFixed(2)}`);
          results.skipped++;
          results.details.push({
            configId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: `API cost too high: $${estimatedApiCost.toFixed(2)}`,
          });

          // Still advance schedule
          await supabase
            .from('gg_configs')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', configId);

          continue;
        }

        // Generate idempotency key
        const checkId = `scheduled-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const idempotencyKey = `geo_grid:${accountId}:${checkId}`;

        // Debit credits
        console.log(`💳 [Scheduled GeoGrids] Debiting ${creditCost} credits for ${accountId}`);
        await debit(supabase, accountId, creditCost, {
          featureType: 'geo_grid',
          featureMetadata: {
            gridSize,
            pointCount,
            keywordCount,
            checkId,
            scheduled: true,
          },
          idempotencyKey,
          description: `Scheduled geo grid: ${gridSize}x${gridSize}, ${keywordCount} keywords`,
        });

        // Run the checks
        console.log(`🔍 [Scheduled GeoGrids] Running checks for config ${configId}`);
        let result;
        try {
          result = await runRankChecks(config, supabase);
        } catch (runError) {
          // Refund on failure
          console.error(`❌ [Scheduled GeoGrids] Check failed for ${configId}, refunding`);
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

        console.log(`✅ [Scheduled GeoGrids] Completed ${configId}: ${result.checksPerformed} checks`);

        results.processed++;
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
        console.error(`❌ [Scheduled GeoGrids] Error processing ${configId}:`, error);
        results.errors++;
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

    const duration = Date.now() - startTime;
    console.log(`✅ [Scheduled GeoGrids] Job complete in ${duration}ms`);
    console.log(`   Processed: ${results.processed}, Skipped: ${results.skipped}, Insufficient: ${results.insufficientCredits}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      summary: {
        total: dueConfigs?.length || 0,
        processed: results.processed,
        skipped: results.skipped,
        insufficientCredits: results.insufficientCredits,
        errors: results.errors,
      },
      details: results.details,
    });
  } catch (error) {
    console.error('❌ [Scheduled GeoGrids] Fatal error in cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
