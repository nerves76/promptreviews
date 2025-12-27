import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getBalance, debit } from '@/lib/credits';
import { runBacklinkCheck, calculateBacklinkCheckCost } from '@/features/backlinks/services';
import { BACKLINK_CREDIT_COSTS } from '@/features/backlinks/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/backlinks/check
 * Run a manual backlink check for a domain.
 *
 * Body:
 * - domainId: string (required) - ID of the tracked domain
 * - checkType: 'summary' | 'full' (optional, default 'full')
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

    const body = await request.json();
    const { domainId, checkType = 'full' } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    if (!['summary', 'full'].includes(checkType)) {
      return NextResponse.json(
        { error: 'checkType must be "summary" or "full"' },
        { status: 400 }
      );
    }

    // Get domain and verify ownership
    const { data: domain, error: domainError } = await serviceSupabase
      .from('backlink_domains')
      .select('*')
      .eq('id', domainId)
      .eq('account_id', accountId)
      .single();

    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Calculate credit cost
    const creditCost = checkType === 'full'
      ? BACKLINK_CREDIT_COSTS.full
      : BACKLINK_CREDIT_COSTS.summary;

    // Check credit balance
    const balance = await getBalance(serviceSupabase, accountId);

    if (balance.totalCredits < creditCost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditCost,
          available: balance.totalCredits,
        },
        { status: 402 }
      );
    }

    // Generate idempotency key
    const idempotencyKey = `backlinks:${accountId}:${domainId}:${Date.now()}`;

    // Debit credits
    await debit(serviceSupabase, accountId, creditCost, {
      featureType: 'backlinks',
      featureMetadata: {
        domainId: domain.id,
        domain: domain.domain,
        checkType,
      },
      idempotencyKey,
      description: `Backlink check: ${domain.domain} (${checkType})`,
    });

    console.log(`🔗 [Backlinks] Starting ${checkType} check for ${domain.domain} (${creditCost} credits)`);

    // Run the check
    const result = await runBacklinkCheck(
      {
        id: domain.id,
        accountId: domain.account_id,
        domain: domain.domain,
        scheduleFrequency: domain.schedule_frequency,
        scheduleDayOfWeek: domain.schedule_day_of_week,
        scheduleDayOfMonth: domain.schedule_day_of_month,
        scheduleHour: domain.schedule_hour,
        nextScheduledAt: domain.next_scheduled_at ? new Date(domain.next_scheduled_at) : null,
        lastScheduledRunAt: domain.last_scheduled_run_at ? new Date(domain.last_scheduled_run_at) : null,
        isEnabled: domain.is_enabled,
        lastCheckedAt: domain.last_checked_at ? new Date(domain.last_checked_at) : null,
        lastCreditWarningSentAt: domain.last_credit_warning_sent_at ? new Date(domain.last_credit_warning_sent_at) : null,
        createdAt: new Date(domain.created_at),
        updatedAt: new Date(domain.updated_at),
      },
      serviceSupabase,
      {
        checkType,
        includeAnchors: checkType === 'full',
        includeReferringDomains: checkType === 'full',
        includeNewLost: checkType === 'full',
      }
    );

    if (!result.success) {
      // Note: In a production system, you might want to refund credits here
      console.error('❌ [Backlinks] Check failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Check failed' },
        { status: 500 }
      );
    }

    console.log(`✅ [Backlinks] Check complete for ${domain.domain}`);

    return NextResponse.json({
      success: true,
      checkId: result.checkId,
      summary: result.summary ? {
        backlinksTotal: result.summary.backlinksTotal,
        referringDomainsTotal: result.summary.referringDomainsTotal,
        rank: result.summary.rank,
        backlinksFollow: result.summary.backlinksFollow,
        backlinksNofollow: result.summary.backlinksNofollow,
        checkedAt: result.summary.checkedAt,
      } : null,
      creditsUsed: creditCost,
      apiCost: result.totalCost,
    });
  } catch (error) {
    console.error('❌ [Backlinks] Check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
