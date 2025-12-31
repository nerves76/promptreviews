/**
 * RSS Feeds API - List and Create
 * GET /api/rss-feeds - List all feeds for the account
 * POST /api/rss-feeds - Create a new feed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformFeedSource } from '@/features/rss-feeds/services/feedProcessor';
import {
  CreateFeedRequest,
  RSS_LIMITS,
  RssFeedSource,
} from '@/features/rss-feeds/types';

/**
 * GET /api/rss-feeds
 * List all RSS feeds for the current account
 */
export async function GET(request: NextRequest) {
  try {
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

    // Fetch all feeds for this account
    const { data: feeds, error } = await supabase
      .from('rss_feed_sources')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[RSS Feeds] Error fetching feeds:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feeds' },
        { status: 500 }
      );
    }

    const transformedFeeds: RssFeedSource[] = (feeds || []).map(transformFeedSource);

    return NextResponse.json({
      success: true,
      feeds: transformedFeeds,
    });
  } catch (error) {
    console.error('[RSS Feeds] Unexpected error in POST:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rss-feeds
 * Create a new RSS feed source
 */
export async function POST(request: NextRequest) {
  try {
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
    const body: CreateFeedRequest = await request.json();

    // Validate required fields
    if (!body.feedUrl) {
      return NextResponse.json(
        { error: 'Feed URL is required' },
        { status: 400 }
      );
    }

    if (!body.feedName) {
      return NextResponse.json(
        { error: 'Feed name is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      const url = new URL(body.feedUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return NextResponse.json(
          { error: 'Feed URL must use HTTP or HTTPS' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid feed URL format' },
        { status: 400 }
      );
    }

    // Check feed limit per account
    const { count: existingCount } = await supabase
      .from('rss_feed_sources')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if ((existingCount || 0) >= RSS_LIMITS.MAX_FEEDS_PER_ACCOUNT) {
      return NextResponse.json(
        {
          error: `Maximum ${RSS_LIMITS.MAX_FEEDS_PER_ACCOUNT} feeds allowed per account`,
        },
        { status: 400 }
      );
    }

    // Validate target locations or Bluesky is configured
    const hasGbpLocations = body.targetLocations && body.targetLocations.length > 0;
    const hasBluesky = body.additionalPlatforms?.bluesky?.enabled;

    if (!hasGbpLocations && !hasBluesky) {
      return NextResponse.json(
        { error: 'At least one target platform (GBP location or Bluesky) is required' },
        { status: 400 }
      );
    }

    // Validate polling interval
    const pollingInterval = body.pollingIntervalMinutes || 60;
    if (pollingInterval < RSS_LIMITS.MIN_POLLING_INTERVAL_MINUTES) {
      return NextResponse.json(
        {
          error: `Minimum polling interval is ${RSS_LIMITS.MIN_POLLING_INTERVAL_MINUTES} minutes`,
        },
        { status: 400 }
      );
    }

    // Create the feed
    const insertPayload = {
      account_id: accountId,
      feed_url: body.feedUrl,
      feed_name: body.feedName,
      polling_interval_minutes: pollingInterval,
      post_template: body.postTemplate || '{title}\n\n{description}',
      include_link: body.includeLink ?? true,
      max_content_length: body.maxContentLength || 1500,
      target_locations: body.targetLocations || [],
      additional_platforms: body.additionalPlatforms || {},
      is_active: body.isActive ?? true,
    };

    console.log('[RSS Feeds] Creating feed with payload:', JSON.stringify(insertPayload, null, 2));

    const { data: feed, error } = await supabase
      .from('rss_feed_sources')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[RSS Feeds] Error creating feed:', error);
      console.error('[RSS Feeds] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { error: `Failed to create feed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        feed: transformFeedSource(feed),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[RSS Feeds] Unexpected error in POST:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
