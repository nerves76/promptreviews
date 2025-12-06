import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
import { runRankChecks } from '@/features/geo-grid/services/rank-checker';
import { generateDailySummary } from '@/features/geo-grid/services/summary-aggregator';

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
    let keywordIds: string[] | undefined;
    try {
      const body = await request.json();
      keywordIds = body.keywordIds;
    } catch {
      // Empty body is fine
    }

    // Get config for this account
    const { data: configRow, error: configError } = await serviceSupabase
      .from('gg_configs')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      console.error('❌ [GeoGrid] Failed to fetch config:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
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

    // Estimate cost (rough estimate: $0.002 per API call)
    const pointCount = config.checkPoints.length;
    const estimatedCalls = (keywordIds?.length || keywordCount) * pointCount;
    const estimatedCost = estimatedCalls * 0.002;

    if (estimatedCost > MAX_COST_PER_RUN_USD) {
      return NextResponse.json(
        {
          error: `Estimated cost ($${estimatedCost.toFixed(2)}) exceeds limit ($${MAX_COST_PER_RUN_USD}). Reduce keywords or check points.`,
          estimatedCost,
          estimatedCalls,
        },
        { status: 400 }
      );
    }

    // Run rank checks
    console.log(`🔍 [GeoGrid] Starting rank checks for account ${accountId}`);
    console.log(`   Keywords: ${keywordIds?.length || keywordCount}, Points: ${pointCount}`);
    console.log(`   Estimated calls: ${estimatedCalls}, Est. cost: $${estimatedCost.toFixed(4)}`);

    const result = await runRankChecks(config, serviceSupabase, { keywordIds });

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

    return NextResponse.json({
      success: result.success,
      checksPerformed: result.checksPerformed,
      totalCost: result.totalCost,
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
