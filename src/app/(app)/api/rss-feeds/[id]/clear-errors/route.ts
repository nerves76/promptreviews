/**
 * RSS Feed Clear Errors API
 * POST /api/rss-feeds/[id]/clear-errors - Clear failed items to allow retry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/rss-feeds/[id]/clear-errors
 * Delete all failed items so they can be retried
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify ownership
    const { data: feed } = await supabase
      .from('rss_feed_sources')
      .select('id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Delete all failed items for this feed
    const { data: deleted, error } = await supabase
      .from('rss_feed_items')
      .delete()
      .eq('feed_source_id', id)
      .eq('status', 'failed')
      .select('id');

    if (error) {
      console.error('[RSS Clear Errors] Error:', error);
      return NextResponse.json(
        { error: 'Failed to clear errors' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cleared: deleted?.length || 0,
    });
  } catch (error) {
    console.error('[RSS Clear Errors] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
