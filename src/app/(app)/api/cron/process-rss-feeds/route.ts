/**
 * RSS Feeds Processing Cron Job
 *
 * Schedule: Every hour at minute 0
 * Purpose: Poll RSS feeds and create scheduled posts for new items
 *
 * Flow:
 * 1. Authenticate with CRON_SECRET_TOKEN
 * 2. Get feeds due for polling
 * 3. Process each feed (with rate limiting)
 * 4. Return summary with counts and errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import {
  processFeed,
  getFeedsDueForPolling,
} from '@/features/rss-feeds/services/feedProcessor';
import { ProcessFeedResult, ProcessAllFeedsResult } from '@/features/rss-feeds/types';

// Configuration
const MAX_FEEDS_PER_RUN = 10;
const RATE_DELAY_MS = 2000; // 2 seconds between feeds

/**
 * Helper to sleep for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate with cron secret
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET;

  if (!expectedToken) {
    console.error('[RSS Cron] CRON_SECRET_TOKEN not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    console.warn('[RSS Cron] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🔄 [RSS Cron] Starting RSS feed processing...');

  const result: ProcessAllFeedsResult = {
    processed: 0,
    skipped: 0,
    errors: 0,
    results: [],
  };

  try {
    const supabase = createServiceRoleClient();

    // Get feeds that are due for polling
    const feedsDue = await getFeedsDueForPolling(supabase, MAX_FEEDS_PER_RUN);
    console.log(`📋 [RSS Cron] Found ${feedsDue.length} feeds due for polling`);

    if (feedsDue.length === 0) {
      console.log('✅ [RSS Cron] No feeds to process');
      return NextResponse.json({
        success: true,
        message: 'No feeds due for processing',
        duration: `${Date.now() - startTime}ms`,
        ...result,
      });
    }

    // Process each feed
    for (const feedSource of feedsDue) {
      console.log(`🔄 [RSS Cron] Processing feed: ${feedSource.feedName}`);

      try {
        const feedResult = await processFeed(supabase, feedSource);
        result.results.push(feedResult);
        result.processed++;

        if (feedResult.errors.length > 0) {
          result.errors++;
        }

        console.log(
          `✅ [RSS Cron] Feed "${feedSource.feedName}": ` +
            `discovered=${feedResult.itemsDiscovered}, ` +
            `scheduled=${feedResult.itemsScheduled}, ` +
            `skipped=${feedResult.itemsSkipped}, ` +
            `failed=${feedResult.itemsFailed}`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `❌ [RSS Cron] Failed to process feed "${feedSource.feedName}":`,
          message
        );

        result.errors++;
        result.results.push({
          feedId: feedSource.id,
          feedName: feedSource.feedName,
          itemsDiscovered: 0,
          itemsScheduled: 0,
          itemsSkipped: 0,
          itemsFailed: 0,
          errors: [message],
        });
      }

      // Rate limiting between feeds
      if (feedsDue.indexOf(feedSource) < feedsDue.length - 1) {
        await sleep(RATE_DELAY_MS);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ [RSS Cron] Completed: processed=${result.processed}, ` +
        `errors=${result.errors}, duration=${duration}ms`
    );

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [RSS Cron] Fatal error:', message);

    return NextResponse.json(
      {
        success: false,
        error: message,
        duration: `${Date.now() - startTime}ms`,
        ...result,
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
