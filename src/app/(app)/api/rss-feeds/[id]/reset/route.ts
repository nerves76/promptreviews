/**
 * RSS Feed Reset API
 * POST /api/rss-feeds/[id]/reset - Clear all items and re-sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { parseFeed } from '@/features/rss-feeds/services/rssParser';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/rss-feeds/[id]/reset
 * Clear all items and re-sync from the RSS feed
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

    // Get feed and verify ownership
    const { data: feed, error: feedError } = await supabase
      .from('rss_feed_sources')
      .select('id, feed_url, feed_name')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (feedError || !feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Step 1: Get scheduled post IDs from items that will be deleted
    const { data: itemsWithPosts } = await supabase
      .from('rss_feed_items')
      .select('scheduled_post_id')
      .eq('feed_source_id', id)
      .not('scheduled_post_id', 'is', null);

    const scheduledPostIds = (itemsWithPosts || [])
      .map(item => item.scheduled_post_id)
      .filter(Boolean);

    // Step 2: Delete scheduled posts that are still pending
    if (scheduledPostIds.length > 0) {
      // First delete associated results
      await supabase
        .from('google_business_scheduled_post_results')
        .delete()
        .in('scheduled_post_id', scheduledPostIds);

      // Then delete the posts (only pending ones)
      await supabase
        .from('google_business_scheduled_posts')
        .delete()
        .in('id', scheduledPostIds)
        .eq('status', 'pending');
    }

    // Step 3: Delete all RSS items for this feed
    const { error: deleteError } = await supabase
      .from('rss_feed_items')
      .delete()
      .eq('feed_source_id', id);

    if (deleteError) {
      console.error('[RSS Reset] Error deleting items:', deleteError);
      return NextResponse.json(
        { error: 'Failed to clear items' },
        { status: 500 }
      );
    }

    // Step 4: Re-fetch and populate items
    let itemCount = 0;
    try {
      const parsedFeed = await parseFeed(feed.feed_url);

      if (parsedFeed.items.length > 0) {
        const itemsToInsert = parsedFeed.items.map((item) => ({
          feed_source_id: id,
          item_guid: item.guid,
          item_url: item.link,
          title: item.title,
          description: item.description?.substring(0, 500),
          image_url: item.imageUrl,
          published_at: item.pubDate?.toISOString() || null,
          status: 'initial_sync',
          skip_reason: 'reset_sync',
          discovered_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from('rss_feed_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error('[RSS Reset] Error inserting items:', insertError);
        } else {
          itemCount = itemsToInsert.length;
        }
      }

      // Update last_polled_at
      await supabase
        .from('rss_feed_sources')
        .update({ 
          last_polled_at: new Date().toISOString(),
          posts_today: 0,
          posts_today_reset_at: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

    } catch (fetchError) {
      console.error('[RSS Reset] Error fetching feed:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch RSS feed' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Feed reset successfully. ${itemCount} items available.`,
      itemCount,
      deletedScheduledPosts: scheduledPostIds.length,
    });
  } catch (error) {
    console.error('[RSS Reset] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
