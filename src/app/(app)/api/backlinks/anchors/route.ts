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
 * GET /api/backlinks/anchors
 * Get anchor text distribution for a domain's latest check.
 *
 * Query params:
 * - domainId: string (required) - ID of the tracked domain
 * - checkId: string (optional) - Specific check ID (defaults to latest)
 * - limit: number (optional, default 50) - Number of anchors to return
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
          anchors: [],
          total: 0,
        });
      }

      checkId = latestCheck.id;
    }

    // Get anchors for the check
    const { data: anchors, error: anchorsError } = await serviceSupabase
      .from('backlink_anchors')
      .select('*')
      .eq('check_id', checkId)
      .eq('account_id', accountId)
      .order('backlinks_count', { ascending: false })
      .limit(limit);

    if (anchorsError) {
      console.error('❌ [Backlinks] Failed to fetch anchors:', anchorsError);
      return NextResponse.json(
        { error: 'Failed to fetch anchors' },
        { status: 500 }
      );
    }

    // Calculate total backlinks for percentage
    const totalBacklinks = (anchors || []).reduce(
      (sum, a) => sum + (a.backlinks_count || 0),
      0
    );

    // Transform to camelCase with percentage
    const transformedAnchors = (anchors || []).map((anchor) => ({
      id: anchor.id,
      anchorText: anchor.anchor_text,
      backlinksCount: anchor.backlinks_count,
      referringDomainsCount: anchor.referring_domains_count,
      percentage: totalBacklinks > 0
        ? ((anchor.backlinks_count / totalBacklinks) * 100).toFixed(1)
        : '0',
      firstSeen: anchor.first_seen,
      lastSeen: anchor.last_seen,
      rank: anchor.rank,
    }));

    return NextResponse.json({
      domain: domain.domain,
      checkId,
      anchors: transformedAnchors,
      total: transformedAnchors.length,
      totalBacklinks,
    });
  } catch (error) {
    console.error('❌ [Backlinks] Anchors GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
