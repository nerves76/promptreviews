/**
 * RSS Feed Process API
 * POST /api/rss-feeds/[id]/process - Manually trigger feed processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  processFeed,
  transformFeedSource,
} from '@/features/rss-feeds/services/feedProcessor';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/rss-feeds/[id]/process
 * Manually trigger processing for a single feed
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

    // Fetch the feed and verify ownership
    const { data: feed, error: feedError } = await supabase
      .from('rss_feed_sources')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (feedError || !feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    if (!feed.is_active) {
      return NextResponse.json(
        { error: 'Feed is paused. Activate it before processing.' },
        { status: 400 }
      );
    }

    // Use service role client for processing (needed for creating scheduled posts)
    const serviceSupabase = createServiceRoleClient();
    const feedSource = transformFeedSource(feed);

    // Process the feed
    const result = await processFeed(serviceSupabase, feedSource);

    return NextResponse.json({
      success: true,
      result: {
        feedId: result.feedId,
        feedName: result.feedName,
        itemsDiscovered: result.itemsDiscovered,
        itemsScheduled: result.itemsScheduled,
        itemsSkipped: result.itemsSkipped,
        itemsFailed: result.itemsFailed,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('[RSS Feeds Process] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
