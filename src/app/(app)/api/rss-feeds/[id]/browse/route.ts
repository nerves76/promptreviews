/**
 * RSS Feed Browse API
 * GET /api/rss-feeds/[id]/browse - Fetch and parse feed items for browsing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { parseFeed } from '@/features/rss-feeds/services/rssParser';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface BrowseFeedItem {
  guid: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string | null;
  publishedAt: string | null;
  // More detailed status info
  existingStatus: 'scheduled' | 'initial_sync' | 'skipped' | 'failed' | null;
  alreadyScheduled: boolean; // Kept for backward compatibility
}

/**
 * GET /api/rss-feeds/[id]/browse
 * Fetch and parse the RSS feed, marking which items are already scheduled
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Fetch the feed source
    const { data: feedSource, error: feedError } = await supabase
      .from('rss_feed_sources')
      .select('id, feed_url, feed_name')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (feedError || !feedSource) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Parse the RSS feed
    let parsedFeed;
    try {
      parsedFeed = await parseFeed(feedSource.feed_url);
    } catch (parseError) {
      console.error('[RSS Browse] Error parsing feed:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse RSS feed' },
        { status: 502 }
      );
    }

    // Get existing items to mark their status
    const { data: existingItems } = await supabase
      .from('rss_feed_items')
      .select('item_guid, status')
      .eq('feed_source_id', id);

    // Create a map for quick lookup
    const statusMap = new Map(
      (existingItems || []).map((item) => [item.item_guid, item.status])
    );

    // Transform items with status info
    const items: BrowseFeedItem[] = parsedFeed.items.map((item) => {
      const status = statusMap.get(item.guid) as BrowseFeedItem['existingStatus'] | undefined;
      return {
        guid: item.guid,
        title: item.title,
        description: item.description,
        link: item.link,
        imageUrl: item.imageUrl,
        publishedAt: item.pubDate ? item.pubDate.toISOString() : null,
        existingStatus: status || null,
        alreadyScheduled: status === 'scheduled',
      };
    });

    // Sort by publish date (newest first)
    items.sort((a, b) => {
      if (!a.publishedAt && !b.publishedAt) return 0;
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return NextResponse.json({
      success: true,
      feedName: feedSource.feed_name,
      items,
    });
  } catch (error) {
    console.error('[RSS Browse] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
