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
 * GET /api/backlinks/new-lost
 * Get new and lost backlinks for a domain.
 *
 * Query params:
 * - domainId: string (required) - ID of the tracked domain
 * - type: 'new' | 'lost' | 'all' (optional, default 'all')
 * - limit: number (optional, default 50) - Number of backlinks to return
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
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    if (!['new', 'lost', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be "new", "lost", or "all"' },
        { status: 400 }
      );
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

    // Build query
    let query = serviceSupabase
      .from('backlink_new_lost')
      .select('*')
      .eq('domain_id', domainId)
      .eq('account_id', accountId)
      .order('detected_at', { ascending: false })
      .limit(limit);

    // Filter by type if specified
    if (type !== 'all') {
      query = query.eq('change_type', type);
    }

    const { data: backlinks, error: backlinksError } = await query;

    if (backlinksError) {
      console.error('❌ [Backlinks] Failed to fetch new/lost backlinks:', backlinksError);
      return NextResponse.json(
        { error: 'Failed to fetch backlinks' },
        { status: 500 }
      );
    }

    // Get counts by type
    const newCount = (backlinks || []).filter((b) => b.change_type === 'new').length;
    const lostCount = (backlinks || []).filter((b) => b.change_type === 'lost').length;

    // Transform to camelCase
    const transformedBacklinks = (backlinks || []).map((bl) => ({
      id: bl.id,
      changeType: bl.change_type,
      sourceUrl: bl.source_url,
      sourceDomain: bl.source_domain,
      targetUrl: bl.target_url,
      anchorText: bl.anchor_text,
      linkType: bl.link_type,
      isFollow: bl.is_follow,
      firstSeen: bl.first_seen,
      lastSeen: bl.last_seen,
      sourceRank: bl.source_rank,
      detectedAt: bl.detected_at,
    }));

    return NextResponse.json({
      domain: domain.domain,
      backlinks: transformedBacklinks,
      total: transformedBacklinks.length,
      newCount,
      lostCount,
    });
  } catch (error) {
    console.error('❌ [Backlinks] New/lost GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
