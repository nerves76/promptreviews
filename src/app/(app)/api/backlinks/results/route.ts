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
 * GET /api/backlinks/results
 * Get check history for a domain.
 *
 * Query params:
 * - domainId: string (required) - ID of the tracked domain
 * - limit: number (optional, default 30) - Number of results to return
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

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    // Verify domain belongs to account
    const { data: domain } = await serviceSupabase
      .from('backlink_domains')
      .select('id, domain')
      .eq('id', domainId)
      .eq('account_id', accountId)
      .single();

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Get check history
    const { data: checks, error: checksError } = await serviceSupabase
      .from('backlink_checks')
      .select('*')
      .eq('domain_id', domainId)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (checksError) {
      console.error('❌ [Backlinks] Failed to fetch results:', checksError);
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedChecks = (checks || []).map((check) => ({
      id: check.id,
      domainId: check.domain_id,
      backlinksTotal: check.backlinks_total,
      referringDomainsTotal: check.referring_domains_total,
      referringDomainsNofollow: check.referring_domains_nofollow,
      referringMainDomains: check.referring_main_domains,
      referringIps: check.referring_ips,
      referringSubnets: check.referring_subnets,
      rank: check.rank,
      backlinksFollow: check.backlinks_follow,
      backlinksNofollow: check.backlinks_nofollow,
      backlinksText: check.backlinks_text,
      backlinksImage: check.backlinks_image,
      backlinksRedirect: check.backlinks_redirect,
      backlinksForm: check.backlinks_form,
      backlinksFrame: check.backlinks_frame,
      referringPages: check.referring_pages,
      apiCostUsd: check.api_cost_usd,
      checkedAt: check.checked_at,
      createdAt: check.created_at,
    }));

    // Calculate trend data (changes between checks)
    const trend = transformedChecks.map((check, index) => {
      const previous = transformedChecks[index + 1];
      return {
        date: check.checkedAt,
        backlinksTotal: check.backlinksTotal,
        referringDomainsTotal: check.referringDomainsTotal,
        rank: check.rank,
        backlinksChange: previous ? check.backlinksTotal - previous.backlinksTotal : 0,
        referringDomainsChange: previous ? check.referringDomainsTotal - previous.referringDomainsTotal : 0,
        rankChange: previous && previous.rank && check.rank ? check.rank - previous.rank : 0,
      };
    });

    return NextResponse.json({
      domain: domain.domain,
      checks: transformedChecks,
      trend: trend.reverse(), // Chronological order for charts
    });
  } catch (error) {
    console.error('❌ [Backlinks] Results GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
