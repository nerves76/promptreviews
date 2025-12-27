import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/backlinks/domains
 * List all tracked domains for the current account.
 */
export async function GET(request: NextRequest) {
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

    // Get all domains for this account with latest check
    const { data: domains, error: domainsError } = await serviceSupabase
      .from('backlink_domains')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (domainsError) {
      console.error('❌ [Backlinks] Failed to fetch domains:', domainsError);
      return NextResponse.json(
        { error: 'Failed to fetch domains' },
        { status: 500 }
      );
    }

    // Get latest check for each domain
    const domainIds = (domains || []).map((d) => d.id);
    let latestChecks: Record<string, any> = {};

    if (domainIds.length > 0) {
      // Get the most recent check for each domain using a subquery approach
      const { data: checks } = await serviceSupabase
        .from('backlink_checks')
        .select('*')
        .in('domain_id', domainIds)
        .order('checked_at', { ascending: false });

      // Group by domain_id and take the first (latest) for each
      if (checks) {
        for (const check of checks) {
          if (!latestChecks[check.domain_id]) {
            latestChecks[check.domain_id] = check;
          }
        }
      }
    }

    // Transform to camelCase with latest check data
    const transformedDomains = (domains || []).map((domain) => {
      const latestCheck = latestChecks[domain.id];
      return {
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
          rank: latestCheck.rank,
          checkedAt: latestCheck.checked_at,
        } : null,
      };
    });

    return NextResponse.json({ domains: transformedDomains });
  } catch (error) {
    console.error('❌ [Backlinks] Domains GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backlinks/domains
 * Add a new domain to track.
 *
 * Body:
 * - domain: string (required) - Domain to track (e.g., "example.com")
 * - scheduleFrequency: 'daily' | 'weekly' | 'monthly' (optional)
 * - scheduleDayOfWeek: number (0-6, for weekly)
 * - scheduleDayOfMonth: number (1-28, for monthly)
 * - scheduleHour: number (0-23, default 9)
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
    const {
      domain,
      scheduleFrequency,
      scheduleDayOfWeek,
      scheduleDayOfMonth,
      scheduleHour = 9,
    } = body;

    // Validate required fields
    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    // Normalize domain (remove protocol, www, trailing slash)
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();

    // Validate domain format
    const domainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]*(\.[a-z0-9][a-z0-9-]*[a-z0-9]*)+$/;
    if (!domainRegex.test(normalizedDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Check if domain already exists for this account
    const { data: existing } = await serviceSupabase
      .from('backlink_domains')
      .select('id')
      .eq('account_id', accountId)
      .eq('domain', normalizedDomain)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Domain is already being tracked' },
        { status: 409 }
      );
    }

    // Validate schedule frequency
    if (scheduleFrequency && !['daily', 'weekly', 'monthly'].includes(scheduleFrequency)) {
      return NextResponse.json(
        { error: 'scheduleFrequency must be "daily", "weekly", or "monthly"' },
        { status: 400 }
      );
    }

    // Create domain record
    const { data: domainRecord, error: createError } = await serviceSupabase
      .from('backlink_domains')
      .insert({
        account_id: accountId,
        domain: normalizedDomain,
        schedule_frequency: scheduleFrequency || null,
        schedule_day_of_week: scheduleDayOfWeek ?? null,
        schedule_day_of_month: scheduleDayOfMonth ?? null,
        schedule_hour: scheduleHour,
        is_enabled: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [Backlinks] Failed to create domain:', createError);
      return NextResponse.json(
        { error: 'Failed to add domain' },
        { status: 500 }
      );
    }

    console.log(`✅ [Backlinks] Added domain: ${normalizedDomain} (${domainRecord.id})`);

    return NextResponse.json({
      domain: {
        id: domainRecord.id,
        accountId: domainRecord.account_id,
        domain: domainRecord.domain,
        scheduleFrequency: domainRecord.schedule_frequency,
        scheduleDayOfWeek: domainRecord.schedule_day_of_week,
        scheduleDayOfMonth: domainRecord.schedule_day_of_month,
        scheduleHour: domainRecord.schedule_hour,
        nextScheduledAt: domainRecord.next_scheduled_at,
        lastScheduledRunAt: domainRecord.last_scheduled_run_at,
        lastCheckedAt: domainRecord.last_checked_at,
        isEnabled: domainRecord.is_enabled,
        createdAt: domainRecord.created_at,
        updatedAt: domainRecord.updated_at,
        lastCheck: null,
      },
      created: true,
    });
  } catch (error) {
    console.error('❌ [Backlinks] Domains POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
