import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
import { runRankChecks } from '@/features/geo-grid/services/rank-checker';
import { generateDailySummary } from '@/features/geo-grid/services/summary-aggregator';
import {
  calculateGeogridCost,
  checkGeogridCredits,
  debit,
  refundFeature,
  ensureBalanceExists,
  InsufficientCreditsError,
} from '@/lib/credits';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cost limit per check run (safety measure)
const MAX_COST_PER_RUN_USD = 5.0;

/**
 * POST /api/geo-grid/check
 * Trigger a manual rank check for the account's geo grid.
 *
 * Body (optional):
 * - configId: string - Specific config to check (default: first config)
 * - keywordIds: string[] - Specific keywords to check (default: all tracked)
 *
 * This endpoint:
 * 1. Validates the config exists and has a target Place ID
 * 2. Runs rank checks for all tracked keywords at all grid points
 * 3. Stores results in gg_checks table
 * 4. Tracks API cost in ai_usage table
 * 5. Generates a daily summary
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

    // Parse optional body
    let configId: string | undefined;
    let keywordIds: string[] | undefined;
    try {
      const body = await request.json();
      configId = body.configId;
      keywordIds = body.keywordIds;
    } catch {
      // Empty body is fine
    }

    // Get config - by ID if provided, otherwise first config for account
    let configRow: any = null;

    if (configId) {
      const { data, error } = await serviceSupabase
        .from('gg_configs')
        .select('*')
        .eq('id', configId)
        .eq('account_id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [GeoGrid] Failed to fetch config:', error);
        return NextResponse.json(
          { error: 'Failed to fetch configuration' },
          { status: 500 }
        );
      }
      configRow = data;
    } else {
      // Backwards compatibility: get first config for account
      const { data, error } = await serviceSupabase
        .from('gg_configs')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [GeoGrid] Failed to fetch config:', error);
        return NextResponse.json(
          { error: 'Failed to fetch configuration' },
          { status: 500 }
        );
      }
      configRow = data;
    }

    if (!configRow) {
      return NextResponse.json(
        { error: 'No geo grid configuration found. Set up your config first.' },
        { status: 400 }
      );
    }

    if (!configRow.is_enabled) {
      return NextResponse.json(
        { error: 'Geo grid tracking is disabled for this account.' },
        { status: 400 }
      );
    }

    const config = transformConfigToResponse(configRow);

    if (!config.targetPlaceId) {
      return NextResponse.json(
        { error: 'No target Place ID configured. Connect a Google Business location first.' },
        { status: 400 }
      );
    }

    // Check how many keywords will be checked
    const { count: keywordCount } = await serviceSupabase
      .from('gg_tracked_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('config_id', config.id)
      .eq('is_enabled', true);

    if (!keywordCount || keywordCount === 0) {
      return NextResponse.json(
        { error: 'No tracked keywords found. Add keywords to track first.' },
        { status: 400 }
      );
    }

    // Calculate grid size from check points
    const pointCount = config.checkPoints.length;
    const gridSize = Math.sqrt(pointCount);

    // Determine actual keyword count to check
    const actualKeywordCount = keywordIds?.length || keywordCount;

    // Calculate credit cost: 10 base + 1 per cell + 1 per keyword
    const creditCost = calculateGeogridCost(gridSize, actualKeywordCount);

    // Ensure balance record exists for this account
    await ensureBalanceExists(serviceSupabase, accountId);

    // Check if account has sufficient credits
    const creditCheck = await checkGeogridCredits(serviceSupabase, accountId, gridSize, actualKeywordCount);

    if (!creditCheck.hasCredits) {
      console.log(`❌ [GeoGrid] Insufficient credits for account ${accountId}: need ${creditCheck.required}, have ${creditCheck.available}`);
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: `This geo grid check requires ${creditCheck.required} credits. You have ${creditCheck.available} credits available.`,
          required: creditCheck.required,
          available: creditCheck.available,
          balance: {
            included: creditCheck.balance.includedCredits,
            purchased: creditCheck.balance.purchasedCredits,
            total: creditCheck.balance.totalCredits,
          },
        },
        { status: 402 } // Payment Required
      );
    }

    // Generate unique check ID for idempotency
    const checkId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = `geo_grid:${accountId}:${checkId}`;

    // Debit credits before running the check
    console.log(`💳 [GeoGrid] Debiting ${creditCost} credits for account ${accountId} (${gridSize}x${gridSize} grid, ${actualKeywordCount} keywords)`);
    try {
      await debit(serviceSupabase, accountId, creditCost, {
        featureType: 'geo_grid',
        featureMetadata: {
          gridSize,
          pointCount,
          keywordCount: actualKeywordCount,
          checkId,
        },
        idempotencyKey,
        description: `Geo grid check: ${gridSize}x${gridSize} grid, ${actualKeywordCount} keywords`,
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            message: `This geo grid check requires ${error.required} credits. You have ${error.available} credits available.`,
            required: error.required,
            available: error.available,
          },
          { status: 402 }
        );
      }
      throw error;
    }

    // Estimate API cost (for logging/monitoring - separate from credit cost)
    const estimatedCalls = (keywordIds?.length || keywordCount) * pointCount;
    const estimatedApiCost = estimatedCalls * 0.002;

    if (estimatedApiCost > MAX_COST_PER_RUN_USD) {
      // Refund credits since we're not running the check
      await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
        featureType: 'geo_grid',
        featureMetadata: { reason: 'api_cost_exceeded', gridSize, pointCount },
        description: 'Refund: API cost exceeded limit',
      });

      return NextResponse.json(
        {
          error: `Estimated API cost ($${estimatedApiCost.toFixed(2)}) exceeds limit ($${MAX_COST_PER_RUN_USD}). Reduce keywords or check points.`,
          estimatedApiCost,
          estimatedCalls,
          creditsRefunded: creditCost,
        },
        { status: 400 }
      );
    }

    // Run rank checks
    console.log(`🔍 [GeoGrid] Starting rank checks for account ${accountId}`);
    console.log(`   Keywords: ${keywordIds?.length || keywordCount}, Points: ${pointCount}`);
    console.log(`   Credit cost: ${creditCost}, Est. API cost: $${estimatedApiCost.toFixed(4)}`);

    let result;
    try {
      result = await runRankChecks(config, serviceSupabase, { keywordIds });
    } catch (runError) {
      // Refund credits on failure
      console.error(`❌ [GeoGrid] Rank check failed, refunding ${creditCost} credits`);
      await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
        featureType: 'geo_grid',
        featureMetadata: { reason: 'check_failed', error: String(runError) },
        description: 'Refund: Geo grid check failed',
      });
      throw runError;
    }

    console.log(`✅ [GeoGrid] Rank checks complete. Checks: ${result.checksPerformed}, Cost: $${result.totalCost.toFixed(4)}`);

    // Generate daily summary
    if (result.checksPerformed > 0) {
      const summaryResult = await generateDailySummary(
        config.id,
        accountId,
        serviceSupabase,
        { force: true }
      );

      if (!summaryResult.success && !summaryResult.alreadyExists) {
        console.error('❌ [GeoGrid] Failed to generate daily summary:', summaryResult.error);
      }
    }

    // Get updated balance after debit
    const updatedCreditCheck = await checkGeogridCredits(serviceSupabase, accountId, gridSize, actualKeywordCount);

    return NextResponse.json({
      success: result.success,
      checksPerformed: result.checksPerformed,
      totalCost: result.totalCost,
      creditsUsed: creditCost,
      creditsRemaining: updatedCreditCheck.balance.totalCredits,
      results: result.results,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Check POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
