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
 * GET /api/backlinks/referring-domains
 * Get top referring domains for a domain's latest check.
 *
 * Query params:
 * - domainId: string (required) - ID of the tracked domain
 * - checkId: string (optional) - Specific check ID (defaults to latest)
 * - limit: number (optional, default 50) - Number of domains to return
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
    let checkId = searchParams.get('checkId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

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

    // If no checkId provided, get the latest check
    if (!checkId) {
      const { data: latestCheck } = await serviceSupabase
        .from('backlink_checks')
        .select('id')
        .eq('domain_id', domainId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestCheck) {
        return NextResponse.json({
          domain: domain.domain,
          referringDomains: [],
          total: 0,
        });
      }

      checkId = latestCheck.id;
    }

    // Get referring domains for the check
    const { data: referringDomains, error: domainsError } = await serviceSupabase
      .from('backlink_referring_domains')
      .select('*')
      .eq('check_id', checkId)
      .eq('account_id', accountId)
      .order('rank', { ascending: false })
      .limit(limit);

    if (domainsError) {
      console.error('❌ [Backlinks] Failed to fetch referring domains:', domainsError);
      return NextResponse.json(
        { error: 'Failed to fetch referring domains' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedDomains = (referringDomains || []).map((rd) => ({
      id: rd.id,
      referringDomain: rd.referring_domain,
      backlinksCount: rd.backlinks_count,
      rank: rd.rank,
      spamScore: rd.backlinks_spam_score,
      firstSeen: rd.first_seen,
      lastSeen: rd.last_seen,
      isFollow: rd.is_follow,
    }));

    return NextResponse.json({
      domain: domain.domain,
      checkId,
      referringDomains: transformedDomains,
      total: transformedDomains.length,
    });
  } catch (error) {
    console.error('❌ [Backlinks] Referring domains GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
