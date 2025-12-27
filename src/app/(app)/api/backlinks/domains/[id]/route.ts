import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/backlinks/domains/[id]
 * Get details for a specific tracked domain.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: domainId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get domain
    const { data: domain, error: domainError } = await serviceSupabase
      .from('backlink_domains')
      .select('*')
      .eq('id', domainId)
      .eq('account_id', accountId)
      .single();

    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Get latest check
    const { data: latestCheck } = await serviceSupabase
      .from('backlink_checks')
      .select('*')
      .eq('domain_id', domainId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      domain: {
        id: domain.id,
        accountId: domain.account_id,
        domain: domain.domain,
        scheduleFrequency: domain.schedule_frequency,
        scheduleDayOfWeek: domain.schedule_day_of_week,
        scheduleDayOfMonth: domain.schedule_day_of_month,
        scheduleHour: domain.schedule_hour,
        nextScheduledAt: domain.next_scheduled_at,
        lastScheduledRunAt: domain.last_scheduled_run_at,
        lastCheckedAt: domain.last_checked_at,
        isEnabled: domain.is_enabled,
        createdAt: domain.created_at,
        updatedAt: domain.updated_at,
        lastCheck: latestCheck ? {
          id: latestCheck.id,
          backlinksTotal: latestCheck.backlinks_total,
          referringDomainsTotal: latestCheck.referring_domains_total,
          referringDomainsNofollow: latestCheck.referring_domains_nofollow,
          referringMainDomains: latestCheck.referring_main_domains,
          referringIps: latestCheck.referring_ips,
          referringSubnets: latestCheck.referring_subnets,
          rank: latestCheck.rank,
          backlinksFollow: latestCheck.backlinks_follow,
          backlinksNofollow: latestCheck.backlinks_nofollow,
          backlinksText: latestCheck.backlinks_text,
          backlinksImage: latestCheck.backlinks_image,
          backlinksRedirect: latestCheck.backlinks_redirect,
          backlinksForm: latestCheck.backlinks_form,
          backlinksFrame: latestCheck.backlinks_frame,
          referringPages: latestCheck.referring_pages,
          apiCostUsd: latestCheck.api_cost_usd,
          checkedAt: latestCheck.checked_at,
        } : null,
      },
    });
  } catch (error) {
    console.error('❌ [Backlinks] Domain GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/backlinks/domains/[id]
 * Update a tracked domain's settings.
 *
 * Body:
 * - scheduleFrequency: 'daily' | 'weekly' | 'monthly' | null
 * - scheduleDayOfWeek: number (0-6)
 * - scheduleDayOfMonth: number (1-28)
 * - scheduleHour: number (0-23)
 * - isEnabled: boolean
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: domainId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify domain belongs to account
    const { data: existingDomain } = await serviceSupabase
      .from('backlink_domains')
      .select('id')
      .eq('id', domainId)
      .eq('account_id', accountId)
      .single();

    if (!existingDomain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      scheduleFrequency,
      scheduleDayOfWeek,
      scheduleDayOfMonth,
      scheduleHour,
      isEnabled,
    } = body;

    // Build update object
    const updates: Record<string, any> = {};

    if (scheduleFrequency !== undefined) {
      if (scheduleFrequency !== null && !['daily', 'weekly', 'monthly'].includes(scheduleFrequency)) {
        return NextResponse.json(
          { error: 'scheduleFrequency must be "daily", "weekly", "monthly", or null' },
          { status: 400 }
        );
      }
      updates.schedule_frequency = scheduleFrequency;
    }

    if (scheduleDayOfWeek !== undefined) {
      updates.schedule_day_of_week = scheduleDayOfWeek;
    }

    if (scheduleDayOfMonth !== undefined) {
      updates.schedule_day_of_month = scheduleDayOfMonth;
    }

    if (scheduleHour !== undefined) {
      if (scheduleHour < 0 || scheduleHour > 23) {
        return NextResponse.json(
          { error: 'scheduleHour must be between 0 and 23' },
          { status: 400 }
        );
      }
      updates.schedule_hour = scheduleHour;
    }

    if (isEnabled !== undefined) {
      updates.is_enabled = isEnabled;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Update domain
    const { data: domain, error: updateError } = await serviceSupabase
      .from('backlink_domains')
      .update(updates)
      .eq('id', domainId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [Backlinks] Failed to update domain:', updateError);
      return NextResponse.json(
        { error: 'Failed to update domain' },
        { status: 500 }
      );
    }

    console.log(`✅ [Backlinks] Updated domain: ${domain.domain} (${domain.id})`);

    return NextResponse.json({
      domain: {
        id: domain.id,
        accountId: domain.account_id,
        domain: domain.domain,
        scheduleFrequency: domain.schedule_frequency,
        scheduleDayOfWeek: domain.schedule_day_of_week,
        scheduleDayOfMonth: domain.schedule_day_of_month,
        scheduleHour: domain.schedule_hour,
        nextScheduledAt: domain.next_scheduled_at,
        lastScheduledRunAt: domain.last_scheduled_run_at,
        lastCheckedAt: domain.last_checked_at,
        isEnabled: domain.is_enabled,
        createdAt: domain.created_at,
        updatedAt: domain.updated_at,
      },
      updated: true,
    });
  } catch (error) {
    console.error('❌ [Backlinks] Domain PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/backlinks/domains/[id]
 * Remove a tracked domain and all its data.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: domainId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify domain belongs to account
    const { data: existingDomain } = await serviceSupabase
      .from('backlink_domains')
      .select('id, domain')
      .eq('id', domainId)
      .eq('account_id', accountId)
      .single();

    if (!existingDomain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Delete domain (cascades to checks, anchors, etc.)
    const { error: deleteError } = await serviceSupabase
      .from('backlink_domains')
      .delete()
      .eq('id', domainId);

    if (deleteError) {
      console.error('❌ [Backlinks] Failed to delete domain:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete domain' },
        { status: 500 }
      );
    }

    console.log(`✅ [Backlinks] Deleted domain: ${existingDomain.domain} (${domainId})`);

    return NextResponse.json({
      deleted: true,
      domain: existingDomain.domain,
    });
  } catch (error) {
    console.error('❌ [Backlinks] Domain DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
