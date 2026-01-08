/**
 * RSS Feeds Processing Cron Job
 *
 * Schedule: Every hour at minute 0
 * Purpose: Poll RSS feeds and create scheduled posts for new items
 *
 * Flow:
 * 1. Authenticate with CRON_SECRET
 * 2. Get feeds due for polling
 * 3. Process each feed (with rate limiting)
 * 4. Return summary with counts and errors
 */

import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
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
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('process-rss-feeds', async () => {
    const result: ProcessAllFeedsResult = {
      processed: 0,
      skipped: 0,
      errors: 0,
      results: [],
    };

    const supabase = createServiceRoleClient();

    // Get feeds that are due for polling
    const feedsDue = await getFeedsDueForPolling(supabase, MAX_FEEDS_PER_RUN);

    if (feedsDue.length === 0) {
      return {
        success: true,
        summary: { message: 'No feeds due for processing', ...result },
      };
    }

    // Process each feed
    for (const feedSource of feedsDue) {
      try {
        const feedResult = await processFeed(supabase, feedSource);
        result.results.push(feedResult);
        result.processed++;

        if (feedResult.errors.length > 0) {
          result.errors++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

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

    return {
      success: true,
      summary: {
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors,
      },
    };
  });
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
