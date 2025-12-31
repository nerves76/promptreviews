/**
 * RSS Feed Clear Failed Items API
 * DELETE /api/rss-feeds/[id]/clear-failed - Remove failed items to allow re-processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/rss-feeds/[id]/clear-failed
 * Remove failed items from the feed so they can be re-processed
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verify feed ownership
    const { data: feed, error: feedError } = await supabase
      .from('rss_feed_sources')
      .select('id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (feedError || !feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Delete failed items
    const { data: deleted, error: deleteError } = await supabase
      .from('rss_feed_items')
      .delete()
      .eq('feed_source_id', id)
      .eq('status', 'failed')
      .select('id');

    if (deleteError) {
      console.error('[RSS Clear Failed] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to clear items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clearedCount: deleted?.length || 0,
    });
  } catch (error) {
    console.error('[RSS Clear Failed] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
