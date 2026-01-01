/**
 * RSS Feed API - Single Feed Operations
 * GET /api/rss-feeds/[id] - Get feed details with recent items
 * PATCH /api/rss-feeds/[id] - Update feed settings
 * DELETE /api/rss-feeds/[id] - Delete a feed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformFeedSource } from '@/features/rss-feeds/services/feedProcessor';
import { UpdateFeedRequest, RSS_LIMITS, RssFeedItem } from '@/features/rss-feeds/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/rss-feeds/[id]
 * Get feed details with recent items
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

    // Fetch the feed
    const { data: feed, error: feedError } = await supabase
      .from('rss_feed_sources')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (feedError || !feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Fetch all items for this feed (up to 200)
    const { data: items } = await supabase
      .from('rss_feed_items')
      .select('*')
      .eq('feed_source_id', id)
      .order('discovered_at', { ascending: false })
      .limit(200);

    const recentItems: RssFeedItem[] = (items || []).map((item) => ({
      id: item.id,
      feedSourceId: item.feed_source_id,
      itemGuid: item.item_guid,
      itemUrl: item.item_url,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      publishedAt: item.published_at,
      status: item.status,
      scheduledPostId: item.scheduled_post_id,
      skipReason: item.skip_reason,
      errorMessage: item.error_message,
      discoveredAt: item.discovered_at,
      processedAt: item.processed_at,
    }));

    return NextResponse.json({
      success: true,
      feed: transformFeedSource(feed),
      recentItems,
    });
  } catch (error) {
    console.error('[RSS Feeds] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rss-feeds/[id]
 * Update feed settings
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { data: existing } = await supabase
      .from('rss_feed_sources')
      .select('id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Parse request body
    const body: UpdateFeedRequest = await request.json();

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.feedName !== undefined) {
      updates.feed_name = body.feedName;
    }

    if (body.pollingIntervalMinutes !== undefined) {
      if (body.pollingIntervalMinutes < RSS_LIMITS.MIN_POLLING_INTERVAL_MINUTES) {
        return NextResponse.json(
          {
            error: `Minimum polling interval is ${RSS_LIMITS.MIN_POLLING_INTERVAL_MINUTES} minutes`,
          },
          { status: 400 }
        );
      }
      updates.polling_interval_minutes = body.pollingIntervalMinutes;
    }

    if (body.postTemplate !== undefined) {
      updates.post_template = body.postTemplate;
    }

    if (body.includeLink !== undefined) {
      updates.include_link = body.includeLink;
    }

    if (body.maxContentLength !== undefined) {
      if (body.maxContentLength < 100 || body.maxContentLength > 4096) {
        return NextResponse.json(
          { error: 'Max content length must be between 100 and 4096' },
          { status: 400 }
        );
      }
      updates.max_content_length = body.maxContentLength;
    }

    if (body.targetLocations !== undefined) {
      updates.target_locations = body.targetLocations;
    }

    if (body.additionalPlatforms !== undefined) {
      updates.additional_platforms = body.additionalPlatforms;
    }

    if (body.isActive !== undefined) {
      updates.is_active = body.isActive;
    }

    if (body.autoPost !== undefined) {
      updates.auto_post = body.autoPost;
    }

    if (body.autoPostIntervalDays !== undefined) {
      if (body.autoPostIntervalDays < 1 || body.autoPostIntervalDays > 30) {
        return NextResponse.json(
          { error: 'Auto-post interval must be between 1 and 30 days' },
          { status: 400 }
        );
      }
      updates.auto_post_interval_days = body.autoPostIntervalDays;
    }

    // Validate at least one platform if locations or platforms are being updated
    if (body.targetLocations !== undefined || body.additionalPlatforms !== undefined) {
      const targetLocations = body.targetLocations ?? [];
      const hasBluesky = body.additionalPlatforms?.bluesky?.enabled;

      // Need to check current state if only one is being updated
      if (body.targetLocations === undefined || body.additionalPlatforms === undefined) {
        const { data: current } = await supabase
          .from('rss_feed_sources')
          .select('target_locations, additional_platforms')
          .eq('id', id)
          .single();

        if (current) {
          const finalLocations = body.targetLocations ?? current.target_locations ?? [];
          const finalPlatforms = body.additionalPlatforms ?? current.additional_platforms ?? {};
          const finalHasGbp = finalLocations.length > 0;
          const finalHasBluesky = (finalPlatforms as { bluesky?: { enabled: boolean } })?.bluesky?.enabled;

          if (!finalHasGbp && !finalHasBluesky) {
            return NextResponse.json(
              { error: 'At least one target platform is required' },
              { status: 400 }
            );
          }
        }
      } else if (targetLocations.length === 0 && !hasBluesky) {
        return NextResponse.json(
          { error: 'At least one target platform is required' },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Apply updates
    const { data: feed, error } = await supabase
      .from('rss_feed_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[RSS Feeds] Error updating feed:', error);
      return NextResponse.json(
        { error: 'Failed to update feed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feed: transformFeedSource(feed),
    });
  } catch (error) {
    console.error('[RSS Feeds] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rss-feeds/[id]
 * Delete a feed and all its items
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

    // Verify ownership and delete
    const { error } = await supabase
      .from('rss_feed_sources')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) {
      console.error('[RSS Feeds] Error deleting feed:', error);
      return NextResponse.json(
        { error: 'Failed to delete feed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RSS Feeds] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
