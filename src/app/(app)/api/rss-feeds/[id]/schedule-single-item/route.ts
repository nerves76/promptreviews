/**
 * RSS Feed Schedule Single Item API
 * POST /api/rss-feeds/[id]/schedule-single-item - Schedule one item with a specific date
 * Handles both: initial_sync items (creates new post) and queued items (promotes draft to pending)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformFeedSource } from '@/features/rss-feeds/services/feedProcessor';
import { getBalance, debit, InsufficientCreditsError } from '@/lib/credits';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ScheduleSingleItemRequest {
  itemId: string;
  scheduledDate: string; // YYYY-MM-DD
  timezone: string;
}

function applyTemplate(
  template: string,
  item: { title: string; description: string; link: string },
  feedSource: { includeLink: boolean; maxContentLength: number }
): string {
  let content = template
    .replace(/{title}/g, item.title || '')
    .replace(/{description}/g, item.description || '');

  if (feedSource.includeLink && item.link) {
    content = content.trim() + '\n\n' + item.link;
  }

  if (content.length > feedSource.maxContentLength) {
    content = content.substring(0, feedSource.maxContentLength - 3) + '...';
  }

  return content.trim();
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body: ScheduleSingleItemRequest = await request.json();

    if (!body.itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    if (!body.scheduledDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.scheduledDate)) {
      return NextResponse.json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 });
    }

    // Fetch feed source
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

    // Fetch the RSS item
    const { data: rssItem, error: itemError } = await supabase
      .from('rss_feed_items')
      .select('*')
      .eq('id', body.itemId)
      .eq('feed_source_id', id)
      .single();

    if (itemError || !rssItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (rssItem.status !== 'initial_sync' && rssItem.status !== 'queued') {
      return NextResponse.json({ error: 'Item is not available for scheduling' }, { status: 400 });
    }

    // Check platforms
    const hasGbp = feedSource.targetLocations.length > 0;
    const hasBluesky = feedSource.additionalPlatforms?.bluesky?.enabled;
    if (!hasGbp && !hasBluesky) {
      return NextResponse.json({ error: 'Feed has no target platforms configured' }, { status: 400 });
    }

    // If the item already has a draft post (queued), promote it to pending
    if (rssItem.scheduled_post_id && rssItem.status === 'queued') {
      // Check credits
      const balance = await getBalance(supabase, accountId);
      if (balance.totalCredits < 1) {
        return NextResponse.json(
          { error: 'Insufficient credits', details: `Need 1 credit, have ${balance.totalCredits}` },
          { status: 402 }
        );
      }

      // Update draft → pending with scheduled date
      const { error: updateError } = await supabase
        .from('google_business_scheduled_posts')
        .update({
          status: 'pending',
          scheduled_date: body.scheduledDate,
          timezone: body.timezone || 'UTC',
          updated_at: new Date().toISOString(),
        })
        .eq('id', rssItem.scheduled_post_id)
        .eq('status', 'draft');

      if (updateError) {
        console.error('[RSS Schedule Single] Failed to update draft:', updateError);
        return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 });
      }

      // Ensure result rows exist for this post
      const { data: existingResults } = await supabase
        .from('google_business_scheduled_post_results')
        .select('id')
        .eq('scheduled_post_id', rssItem.scheduled_post_id)
        .limit(1);

      if (!existingResults || existingResults.length === 0) {
        for (const location of feedSource.targetLocations) {
          await supabase.from('google_business_scheduled_post_results').insert({
            scheduled_post_id: rssItem.scheduled_post_id,
            location_id: location.id,
            location_name: location.name || null,
            status: 'pending',
            platform: 'google',
          });
        }

        if (feedSource.additionalPlatforms?.bluesky?.enabled && feedSource.targetLocations[0]) {
          await supabase.from('google_business_scheduled_post_results').insert({
            scheduled_post_id: rssItem.scheduled_post_id,
            location_id: feedSource.targetLocations[0].id,
            location_name: 'Bluesky',
            status: 'pending',
            platform: 'bluesky',
          });
        }
      }

      // Update RSS item status
      await supabase.from('rss_feed_items').update({
        status: 'scheduled',
        processed_at: new Date().toISOString(),
      }).eq('id', body.itemId);

      // Debit credit
      const idempotencyKey = `rss_single_schedule:${id}:${rssItem.item_guid}:${body.scheduledDate}`;
      try {
        await debit(supabase, accountId, 1, {
          featureType: 'rss_manual_post',
          idempotencyKey,
          featureMetadata: {
            feedId: id,
            feedName: feedSource.feedName,
            itemGuid: rssItem.item_guid,
            scheduledDate: body.scheduledDate,
          },
        });
      } catch (creditError) {
        if (creditError instanceof InsufficientCreditsError) {
          // Revert to draft
          await supabase.from('google_business_scheduled_posts').update({
            status: 'draft',
            scheduled_date: null,
          }).eq('id', rssItem.scheduled_post_id);
          await supabase.from('rss_feed_items').update({ status: 'queued' }).eq('id', body.itemId);
          return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }
      }

      return NextResponse.json({
        success: true,
        postId: rssItem.scheduled_post_id,
        scheduledDate: body.scheduledDate,
      });
    }

    // For initial_sync items: create a new scheduled post
    const balance = await getBalance(supabase, accountId);
    if (balance.totalCredits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits', details: `Need 1 credit, have ${balance.totalCredits}` },
        { status: 402 }
      );
    }

    const { data: accountUser } = await supabase
      .from('account_users')
      .select('user_id')
      .eq('account_id', accountId)
      .limit(1)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'No user found for account' }, { status: 500 });
    }

    const content = applyTemplate(
      feedSource.postTemplate,
      { title: rssItem.title || '', description: rssItem.description || '', link: rssItem.item_url || '' },
      feedSource
    );

    let mediaPaths: Array<{ bucket: string; path: string; publicUrl: string; mime: string; size: number }> = [];
    if (rssItem.image_url) {
      mediaPaths = [{
        bucket: 'external',
        path: rssItem.image_url,
        publicUrl: rssItem.image_url,
        mime: 'image/jpeg',
        size: 0,
      }];
    }

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
            source: 'rss_feed_single',
            feedId: feedSource.id,
            feedName: feedSource.feedName,
            itemGuid: rssItem.item_guid,
            itemUrl: rssItem.item_url,
          },
        },
        scheduled_date: body.scheduledDate,
        timezone: body.timezone || 'UTC',
        selected_locations: feedSource.targetLocations,
        media_paths: mediaPaths.length > 0 ? mediaPaths : [],
        additional_platforms: feedSource.additionalPlatforms || {},
        status: 'pending',
        source_type: 'rss_manual',
      })
      .select('id')
      .single();

    if (postError || !post) {
      console.error('[RSS Schedule Single] Failed to create post:', postError);
      return NextResponse.json({ error: 'Failed to create scheduled post' }, { status: 500 });
    }

    // Create result rows
    for (const location of feedSource.targetLocations) {
      await supabase.from('google_business_scheduled_post_results').insert({
        scheduled_post_id: post.id,
        location_id: location.id,
        location_name: location.name || null,
        status: 'pending',
        platform: 'google',
      });
    }

    if (feedSource.additionalPlatforms?.bluesky?.enabled && feedSource.targetLocations[0]) {
      await supabase.from('google_business_scheduled_post_results').insert({
        scheduled_post_id: post.id,
        location_id: feedSource.targetLocations[0].id,
        location_name: 'Bluesky',
        status: 'pending',
        platform: 'bluesky',
      });
    }

    // Update RSS item
    await supabase.from('rss_feed_items').upsert({
      feed_source_id: id,
      item_guid: rssItem.item_guid,
      item_url: rssItem.item_url,
      title: rssItem.title,
      description: rssItem.description?.substring(0, 500),
      image_url: rssItem.image_url,
      status: 'scheduled',
      scheduled_post_id: post.id,
      processed_at: new Date().toISOString(),
    }, { onConflict: 'feed_source_id,item_guid' });

    // Debit credit
    const idempotencyKey = `rss_single_post:${id}:${rssItem.item_guid}:${body.scheduledDate}`;
    try {
      await debit(supabase, accountId, 1, {
        featureType: 'rss_manual_post',
        idempotencyKey,
        featureMetadata: {
          feedId: id,
          feedName: feedSource.feedName,
          itemGuid: rssItem.item_guid,
          scheduledDate: body.scheduledDate,
        },
      });
    } catch (creditError) {
      if (creditError instanceof InsufficientCreditsError) {
        await supabase.from('google_business_scheduled_posts').delete().eq('id', post.id);
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
      }
    }

    return NextResponse.json({
      success: true,
      postId: post.id,
      scheduledDate: body.scheduledDate,
    });
  } catch (error) {
    console.error('[RSS Schedule Single] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
