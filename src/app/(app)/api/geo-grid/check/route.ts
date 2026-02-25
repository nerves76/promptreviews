export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
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
 * Fire-and-forget: trigger the background processor immediately.
 * Falls back to the every-minute cron if this fails.
 */
function fireProcessGeogridQueue() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
  const cronSecret = process.env.CRON_SECRET || '';

  fetch(`${baseUrl}/api/cron/process-geogrid-queue`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${cronSecret}` },
    signal: AbortSignal.timeout(5000),
  }).catch(() => {
    // Swallow errors — the cron will pick it up within a minute
  });
}

/**
 * POST /api/geo-grid/check
 * Queue a manual rank check for the account's geo grid.
 *
 * Body (optional):
 * - configId: string - Specific config to check (default: first config)
 * - keywordIds: string[] - Specific keywords to check (default: all tracked)
 *
 * This endpoint validates, debits credits, creates a background job,
 * and returns immediately. The actual checks are processed by
 * /api/cron/process-geogrid-queue.
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

    // Calculate credit cost from check points × keywords
    const pointCount = config.checkPoints.length;
    const actualKeywordCount = keywordIds?.length || keywordCount;
    const creditCost = calculateGeogridCost(pointCount, actualKeywordCount);

    // Ensure balance record exists for this account
    await ensureBalanceExists(serviceSupabase, accountId);

    // Check if account has sufficient credits
    const creditCheck = await checkGeogridCredits(serviceSupabase, accountId, pointCount, actualKeywordCount);

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

    // Debit credits before creating the job
    console.log(`💳 [GeoGrid] Debiting ${creditCost} credits for account ${accountId} (${pointCount} points, ${actualKeywordCount} keywords)`);
    try {
      await debit(serviceSupabase, accountId, creditCost, {
        featureType: 'geo_grid',
        featureMetadata: {
          pointCount,
          keywordCount: actualKeywordCount,
          checkId,
        },
        idempotencyKey,
        description: `Geo grid check: ${pointCount} points, ${actualKeywordCount} keywords`,
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
        featureMetadata: { reason: 'api_cost_exceeded', pointCount },
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

    // Create background job
    console.log(`📋 [GeoGrid] Queuing check job for account ${accountId}: ${actualKeywordCount} keywords, ${pointCount} points`);
    const { data: job, error: jobError } = await serviceSupabase
      .from('gg_check_jobs')
      .insert({
        account_id: accountId,
        config_id: config.id,
        keyword_ids: keywordIds || [],
        status: 'pending',
        credits_used: creditCost,
        credits_idempotency_key: idempotencyKey,
      })
      .select('id')
      .single();

    if (jobError || !job) {
      // Refund credits if job creation fails
      console.error('❌ [GeoGrid] Failed to create check job:', jobError);
      await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
        featureType: 'geo_grid',
        featureMetadata: { reason: 'job_creation_failed' },
        description: 'Refund: Failed to create check job',
      });
      return NextResponse.json(
        { error: 'Failed to queue check job' },
        { status: 500 }
      );
    }

    // Fire-and-forget: trigger processor immediately (cron is fallback)
    fireProcessGeogridQueue();

    return NextResponse.json({
      queued: true,
      jobId: job.id,
      creditsUsed: creditCost,
      message: 'Check queued. Processing will begin shortly.',
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Check POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
