/**
 * RSS Feed Schedule Items API
 * POST /api/rss-feeds/[id]/schedule-items - Schedule selected items with spacing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformFeedSource } from '@/features/rss-feeds/services/feedProcessor';
import { getBalance, debit, InsufficientCreditsError } from '@/lib/credits';
import { RssFeedSource, ParsedFeedItem } from '@/features/rss-feeds/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ScheduleItemsRequest {
  items: Array<{
    guid: string;
    title: string;
    description: string;
    link: string;
    imageUrl: string | null;
  }>;
  startDate: string; // YYYY-MM-DD
  intervalDays: number; // 1-14
  timezone: string;
}

/**
 * Apply template to generate post content
 */
function applyTemplate(
  template: string,
  item: { title: string; description: string; link: string },
  feedSource: RssFeedSource
): string {
  let content = template
    .replace(/{title}/g, item.title || '')
    .replace(/{description}/g, item.description || '');

  // Auto-append link at the end if includeLink is enabled
  if (feedSource.includeLink && item.link) {
    content = content.trim() + '\n\n' + item.link;
  }

  // Trim to max length
  if (content.length > feedSource.maxContentLength) {
    content = content.substring(0, feedSource.maxContentLength - 3) + '...';
  }

  return content.trim();
}

/**
 * POST /api/rss-feeds/[id]/schedule-items
 * Schedule multiple items with spaced dates
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

    // Parse request body
    const body: ScheduleItemsRequest = await request.json();

    // Validate
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    if (!body.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
      return NextResponse.json(
        { error: 'Invalid start date format (expected YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (!body.intervalDays || body.intervalDays < 1 || body.intervalDays > 14) {
      return NextResponse.json(
        { error: 'Interval must be between 1 and 14 days' },
        { status: 400 }
      );
    }

    // Fetch the feed source
    const { data: feedRow, error: feedError } = await supabase
      .from('rss_feed_sources')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (feedError || !feedRow) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    const feedSource = transformFeedSource(feedRow);

    // Check if feed has target platforms configured
    const hasGbp = feedSource.targetLocations.length > 0;
    const hasBluesky = feedSource.additionalPlatforms?.bluesky?.enabled;

    if (!hasGbp && !hasBluesky) {
      return NextResponse.json(
        { error: 'Feed has no target platforms configured' },
        { status: 400 }
      );
    }

    // Check credits
    const creditsNeeded = body.items.length;
    const balance = await getBalance(supabase, accountId);

    if (balance.totalCredits < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          details: `Need ${creditsNeeded} credits, have ${balance.totalCredits}`,
        },
        { status: 402 }
      );
    }

    // Get account user for post attribution
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('user_id')
      .eq('account_id', accountId)
      .limit(1)
      .single();

    if (!accountUser) {
      return NextResponse.json(
        { error: 'No user found for account' },
        { status: 500 }
      );
    }

    // Schedule each item
    const scheduledPosts: Array<{ guid: string; postId: string; scheduledDate: string }> = [];
    const errors: Array<{ guid: string; error: string }> = [];

    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];

      // Calculate scheduled date (start date + interval * index)
      const scheduledDate = new Date(body.startDate);
      scheduledDate.setDate(scheduledDate.getDate() + (body.intervalDays * i));
      const scheduledDateStr = scheduledDate.toISOString().split('T')[0];

      try {
        // Generate content using template
        const content = applyTemplate(feedSource.postTemplate, item, feedSource);

        // Prepare media paths if image is available
        let mediaPaths: Array<{
          bucket: string;
          path: string;
          publicUrl: string;
          mime: string;
          size: number;
        }> = [];

        if (item.imageUrl) {
          mediaPaths = [{
            bucket: 'external',
            path: item.imageUrl,
            publicUrl: item.imageUrl,
            mime: 'image/jpeg',
            size: 0,
          }];
        }

        // Create scheduled post
        const { data: post, error: postError } = await supabase
          .from('google_business_scheduled_posts')
          .insert({
            account_id: accountId,
            user_id: accountUser.user_id,
            post_kind: 'post',
            post_type: 'WHATS_NEW',
            content: {
              summary: content,
              metadata: {
                source: 'rss_feed_manual',
                feedId: feedSource.id,
                feedName: feedSource.feedName,
                itemGuid: item.guid,
                itemUrl: item.link,
              },
            },
            scheduled_date: scheduledDateStr,
            timezone: body.timezone || 'UTC',
            selected_locations: feedSource.targetLocations,
            media_paths: mediaPaths.length > 0 ? mediaPaths : [],
            additional_platforms: feedSource.additionalPlatforms || {},
            status: 'pending',
          })
          .select('id')
          .single();

        if (postError || !post) {
          throw new Error(postError?.message || 'Failed to create post');
        }

        // Create result rows for each location
        for (const location of feedSource.targetLocations) {
          await supabase
            .from('google_business_scheduled_post_results')
            .insert({
              scheduled_post_id: post.id,
              location_id: location.id,
              location_name: location.name || null,
              status: 'pending',
              platform: 'google',
            });
        }

        // Create result row for Bluesky if enabled
        if (feedSource.additionalPlatforms?.bluesky?.enabled && feedSource.targetLocations[0]) {
          await supabase
            .from('google_business_scheduled_post_results')
            .insert({
              scheduled_post_id: post.id,
              location_id: feedSource.targetLocations[0].id,
              location_name: 'Bluesky',
              status: 'pending',
              platform: 'bluesky',
            });
        }

        // Record item in rss_feed_items
        await supabase.from('rss_feed_items').upsert(
          {
            feed_source_id: id,
            item_guid: item.guid,
            item_url: item.link,
            title: item.title,
            description: item.description?.substring(0, 500),
            image_url: item.imageUrl,
            status: 'scheduled',
            scheduled_post_id: post.id,
            processed_at: new Date().toISOString(),
          },
          {
            onConflict: 'feed_source_id,item_guid',
          }
        );

        // Debit credit
        const idempotencyKey = `rss_manual_post:${id}:${item.guid}:${scheduledDateStr}`;
        try {
          await debit(supabase, accountId, 1, {
            featureType: 'rss_manual_post',
            idempotencyKey,
            metadata: {
              feedId: id,
              feedName: feedSource.feedName,
              itemGuid: item.guid,
              scheduledDate: scheduledDateStr,
            },
          });
        } catch (creditError) {
          // If credit debit fails, delete the scheduled post
          await supabase
            .from('google_business_scheduled_posts')
            .delete()
            .eq('id', post.id);

          if (creditError instanceof InsufficientCreditsError) {
            throw new Error('Insufficient credits');
          }
          // Idempotency errors are OK - item was already scheduled
        }

        scheduledPosts.push({
          guid: item.guid,
          postId: post.id,
          scheduledDate: scheduledDateStr,
        });
      } catch (itemError) {
        errors.push({
          guid: item.guid,
          error: itemError instanceof Error ? itemError.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      scheduledCount: scheduledPosts.length,
      posts: scheduledPosts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[RSS Schedule Items] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
