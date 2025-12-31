/**
 * Feed Processor Service
 * Processes RSS feeds and creates scheduled posts for GBP/Bluesky
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { parseFeed } from './rssParser';
import {
  RssFeedSource,
  RssFeedItem,
  ParsedFeedItem,
  ProcessFeedResult,
  RSS_LIMITS,
  RSS_CREDITS,
} from '../types';
import { debit, getBalance } from '@/lib/credits/service';
import { InsufficientCreditsError } from '@/lib/credits/types';

/**
 * Process a single RSS feed source
 *
 * 1. Fetch and parse the feed
 * 2. Find new items not yet processed
 * 3. Create scheduled posts for new items
 * 4. Update feed source status
 */
export async function processFeed(
  supabase: SupabaseClient,
  feedSource: RssFeedSource
): Promise<ProcessFeedResult> {
  const result: ProcessFeedResult = {
    feedId: feedSource.id,
    feedName: feedSource.feedName,
    itemsDiscovered: 0,
    itemsScheduled: 0,
    itemsSkipped: 0,
    itemsFailed: 0,
    errors: [],
  };

  try {
    // Check if we've hit the daily limit
    const postsRemaining = await getPostsRemainingToday(supabase, feedSource);
    if (postsRemaining <= 0) {
      result.errors.push('Daily post limit reached');
      await updateFeedLastPolled(supabase, feedSource.id, null);
      return result;
    }

    // Fetch and parse the feed
    const feed = await parseFeed(feedSource.feedUrl);
    result.itemsDiscovered = feed.items.length;

    // Get existing item guids to avoid duplicates
    const existingGuids = await getExistingItemGuids(supabase, feedSource.id);

    // Filter to only new items
    const newItems = feed.items.filter(
      (item) => !existingGuids.has(item.guid)
    );

    // Process each new item (limited by daily quota)
    let processedCount = 0;
    for (const item of newItems) {
      if (processedCount >= postsRemaining) {
        result.itemsSkipped++;
        await createFeedItem(supabase, feedSource.id, item, 'skipped', 'daily_limit_reached');
        continue;
      }

      try {
        const itemResult = await processItem(supabase, feedSource, item);
        if (itemResult.status === 'scheduled') {
          result.itemsScheduled++;
          processedCount++;
        } else {
          result.itemsSkipped++;
        }
      } catch (error) {
        result.itemsFailed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Item "${item.title}": ${message}`);
        await createFeedItem(supabase, feedSource.id, item, 'failed', null, message);
      }
    }

    // Update feed source - success
    await updateFeedLastPolled(supabase, feedSource.id, null);
    await incrementPostsToday(supabase, feedSource.id, result.itemsScheduled);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Feed error: ${message}`);
    await updateFeedLastPolled(supabase, feedSource.id, message);
  }

  return result;
}

/**
 * Process a single RSS item - check credits, create scheduled post
 */
async function processItem(
  supabase: SupabaseClient,
  feedSource: RssFeedSource,
  item: ParsedFeedItem
): Promise<{ status: 'scheduled' | 'skipped'; skipReason?: string }> {
  // Check if we have any target platforms configured
  const hasGbpLocations = feedSource.targetLocations.length > 0;
  const hasBluesky = feedSource.additionalPlatforms?.bluesky?.enabled;

  if (!hasGbpLocations && !hasBluesky) {
    await createFeedItem(supabase, feedSource.id, item, 'skipped', 'no_platforms_configured');
    return { status: 'skipped', skipReason: 'no_platforms_configured' };
  }

  // Check credit balance
  const balance = await getBalance(supabase, feedSource.accountId);
  if (balance.totalCredits < RSS_CREDITS.COST_PER_POST) {
    await createFeedItem(supabase, feedSource.id, item, 'skipped', 'insufficient_credits');
    return { status: 'skipped', skipReason: 'insufficient_credits' };
  }

  // Generate post content from template
  const content = applyTemplate(feedSource.postTemplate, item, feedSource);

  // Create the scheduled post
  const scheduledPostId = await createScheduledPost(supabase, feedSource, item, content);

  // Debit credits
  const idempotencyKey = `rss_post:${feedSource.id}:${item.guid}`;
  try {
    await debit(supabase, feedSource.accountId, RSS_CREDITS.COST_PER_POST, {
      featureType: RSS_CREDITS.FEATURE_NAME,
      idempotencyKey,
      featureMetadata: {
        feedId: feedSource.id,
        feedName: feedSource.feedName,
        itemGuid: item.guid,
        itemTitle: item.title,
        scheduledPostId,
      },
      description: `RSS auto-post: ${item.title.substring(0, 50)}`,
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      // Delete the scheduled post we just created
      await supabase
        .from('google_business_scheduled_posts')
        .delete()
        .eq('id', scheduledPostId);

      await createFeedItem(supabase, feedSource.id, item, 'skipped', 'insufficient_credits');
      return { status: 'skipped', skipReason: 'insufficient_credits' };
    }
    throw error;
  }

  // Create feed item record
  await createFeedItem(supabase, feedSource.id, item, 'scheduled', null, null, scheduledPostId);

  return { status: 'scheduled' };
}

/**
 * Apply template to generate post content
 */
function applyTemplate(
  template: string,
  item: ParsedFeedItem,
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
 * Create a scheduled post in google_business_scheduled_posts
 */
async function createScheduledPost(
  supabase: SupabaseClient,
  feedSource: RssFeedSource,
  item: ParsedFeedItem,
  content: string
): Promise<string> {
  // Get the account's user_id (needed for scheduled posts)
  const { data: accountUser } = await supabase
    .from('account_users')
    .select('user_id')
    .eq('account_id', feedSource.accountId)
    .limit(1)
    .single();

  if (!accountUser) {
    throw new Error('No user found for account');
  }

  // Prepare media paths if image is available
  let mediaPaths: Array<{
    bucket: string;
    path: string;
    publicUrl: string;
    mime: string;
    size: number;
  }> = [];

  if (item.imageUrl) {
    // For RSS images, we use the external URL directly
    // The GBP posting cron will handle downloading if needed
    mediaPaths = [{
      bucket: 'external',
      path: item.imageUrl,
      publicUrl: item.imageUrl,
      mime: 'image/jpeg', // Assume JPEG, actual type determined at posting time
      size: 0,
    }];
  }

  // Schedule for today (will be picked up by next daily cron)
  const today = new Date().toISOString().split('T')[0];

  const insertPayload = {
    account_id: feedSource.accountId,
    user_id: accountUser.user_id,
    post_kind: 'post',
    post_type: 'WHATS_NEW',
    content: {
      summary: content,
      metadata: {
        source: 'rss_feed',
        feedId: feedSource.id,
        feedName: feedSource.feedName,
        itemGuid: item.guid,
        itemUrl: item.link,
      },
    },
    scheduled_date: today,
    timezone: 'UTC', // Use UTC for simplicity
    selected_locations: feedSource.targetLocations,
    media_paths: mediaPaths.length > 0 ? mediaPaths : [],
    additional_platforms: feedSource.additionalPlatforms || {},
    status: 'pending' as const,
  };

  console.log('[RSS] Creating scheduled post with payload:', JSON.stringify(insertPayload, null, 2));

  const { data: post, error } = await supabase
    .from('google_business_scheduled_posts')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    console.error('[RSS] Insert error:', error);
    throw new Error(`Failed to create scheduled post: ${error.message}`);
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
        location_id: feedSource.targetLocations[0].id, // Use first location as placeholder
        location_name: 'Bluesky',
        status: 'pending',
        platform: 'bluesky',
      });
  }

  return post.id;
}

/**
 * Create a feed item record
 */
async function createFeedItem(
  supabase: SupabaseClient,
  feedSourceId: string,
  item: ParsedFeedItem,
  status: 'pending' | 'scheduled' | 'skipped' | 'failed',
  skipReason: string | null = null,
  errorMessage: string | null = null,
  scheduledPostId: string | null = null
): Promise<void> {
  await supabase.from('rss_feed_items').upsert(
    {
      feed_source_id: feedSourceId,
      item_guid: item.guid,
      item_url: item.link,
      title: item.title,
      description: item.description?.substring(0, 500), // Truncate for storage
      image_url: item.imageUrl,
      published_at: item.pubDate?.toISOString() || null,
      status,
      skip_reason: skipReason,
      error_message: errorMessage,
      scheduled_post_id: scheduledPostId,
      processed_at: status !== 'pending' ? new Date().toISOString() : null,
    },
    {
      onConflict: 'feed_source_id,item_guid',
    }
  );
}

/**
 * Get existing item guids for a feed source
 */
async function getExistingItemGuids(
  supabase: SupabaseClient,
  feedSourceId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('rss_feed_items')
    .select('item_guid')
    .eq('feed_source_id', feedSourceId);

  return new Set((data || []).map((row) => row.item_guid));
}

/**
 * Get remaining posts allowed today
 */
async function getPostsRemainingToday(
  supabase: SupabaseClient,
  feedSource: RssFeedSource
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  // Check if we need to reset the counter
  if (feedSource.postsTodayResetAt !== today) {
    await supabase
      .from('rss_feed_sources')
      .update({
        posts_today: 0,
        posts_today_reset_at: today,
      })
      .eq('id', feedSource.id);
    return RSS_LIMITS.MAX_POSTS_PER_DAY;
  }

  return RSS_LIMITS.MAX_POSTS_PER_DAY - feedSource.postsToday;
}

/**
 * Increment posts_today counter
 */
async function incrementPostsToday(
  supabase: SupabaseClient,
  feedSourceId: string,
  count: number
): Promise<void> {
  if (count <= 0) return;

  await supabase.rpc('increment_rss_posts_today', {
    feed_id: feedSourceId,
    increment_by: count,
  });
}

/**
 * Update feed source last_polled_at and error status
 */
async function updateFeedLastPolled(
  supabase: SupabaseClient,
  feedSourceId: string,
  error: string | null
): Promise<void> {
  const updates: Record<string, unknown> = {
    last_polled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (error) {
    // Increment error count, set last error
    const { data: current } = await supabase
      .from('rss_feed_sources')
      .select('error_count')
      .eq('id', feedSourceId)
      .single();

    updates.error_count = (current?.error_count || 0) + 1;
    updates.last_error = error;
  } else {
    // Success - reset error count, update successful poll time
    updates.error_count = 0;
    updates.last_error = null;
    updates.last_successful_poll_at = new Date().toISOString();
  }

  await supabase
    .from('rss_feed_sources')
    .update(updates)
    .eq('id', feedSourceId);
}

/**
 * Get feeds that are due for polling
 */
export async function getFeedsDueForPolling(
  supabase: SupabaseClient,
  limit: number = 10
): Promise<RssFeedSource[]> {
  const now = new Date();

  const { data, error } = await supabase
    .from('rss_feed_sources')
    .select('*')
    .eq('is_active', true)
    .or(
      `last_polled_at.is.null,last_polled_at.lt.${new Date(
        now.getTime() - 15 * 60 * 1000 // At least 15 minutes since last poll
      ).toISOString()}`
    )
    .order('last_polled_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get feeds due for polling: ${error.message}`);
  }

  // Filter by actual polling interval
  return (data || [])
    .map(transformFeedSource)
    .filter((feed) => {
      if (!feed.lastPolledAt) return true;
      const lastPolled = new Date(feed.lastPolledAt);
      const intervalMs = feed.pollingIntervalMinutes * 60 * 1000;
      return now.getTime() - lastPolled.getTime() >= intervalMs;
    });
}

/**
 * Transform database row to typed RssFeedSource
 */
export function transformFeedSource(row: Record<string, unknown>): RssFeedSource {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    feedUrl: row.feed_url as string,
    feedName: row.feed_name as string,
    pollingIntervalMinutes: row.polling_interval_minutes as number,
    lastPolledAt: row.last_polled_at as string | null,
    lastSuccessfulPollAt: row.last_successful_poll_at as string | null,
    postTemplate: row.post_template as string,
    includeLink: row.include_link as boolean,
    maxContentLength: row.max_content_length as number,
    targetLocations: (row.target_locations || []) as RssFeedSource['targetLocations'],
    additionalPlatforms: (row.additional_platforms || {}) as RssFeedSource['additionalPlatforms'],
    isActive: row.is_active as boolean,
    errorCount: row.error_count as number,
    lastError: row.last_error as string | null,
    postsToday: row.posts_today as number,
    postsTodayResetAt: row.posts_today_reset_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
