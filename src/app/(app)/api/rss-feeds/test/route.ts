/**
 * RSS Feed Test API
 * POST /api/rss-feeds/test - Validate and preview a feed URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { validateFeed } from '@/features/rss-feeds/services/rssParser';
import { TestFeedRequest, TestFeedResponse } from '@/features/rss-feeds/types';

/**
 * POST /api/rss-feeds/test
 * Validate a feed URL and return preview of items
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

    // Parse request body
    const body: TestFeedRequest = await request.json();

    if (!body.feedUrl) {
      return NextResponse.json(
        { error: 'Feed URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format first
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
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate and parse the feed
    const result = await validateFeed(body.feedUrl);

    if (!result.valid || !result.feed) {
      const response: TestFeedResponse = {
        success: false,
        feed: {
          title: undefined,
          description: undefined,
          itemCount: 0,
        },
        items: [],
        error: result.error || 'Failed to parse feed',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Return preview (limit to 10 items)
    const previewItems = result.feed.items.slice(0, 10);

    const response: TestFeedResponse = {
      success: true,
      feed: {
        title: result.feed.title,
        description: result.feed.description,
        itemCount: result.feed.items.length,
      },
      items: previewItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[RSS Feeds Test] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
