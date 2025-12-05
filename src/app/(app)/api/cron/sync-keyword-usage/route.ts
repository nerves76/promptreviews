/**
 * Cron Job: Sync Keyword Usage Counts
 *
 * Runs daily to sync the review_usage_count and last_used_in_review_at
 * fields on the keywords table based on keyword_review_matches_v2.
 *
 * This is a lightweight operation that:
 * 1. Gets all accounts with keywords
 * 2. For each account, counts matches per keyword
 * 3. Updates the denormalized usage count on keywords table
 *
 * Endpoint: GET /api/cron/sync-keyword-usage
 * Authorization: Bearer token (CRON_SECRET_TOKEN)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncAllKeywordUsageCounts } from '@/features/keywords/reprocessKeywordMatches';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('🔄 Starting keyword usage sync...');
    const startTime = Date.now();

    const result = await syncAllKeywordUsageCounts(supabaseAdmin);

    const duration = Date.now() - startTime;
    console.log(
      `✅ Keyword usage sync complete: ${result.accountsProcessed} accounts, ${result.totalUpdated} keywords updated in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      accountsProcessed: result.accountsProcessed,
      keywordsUpdated: result.totalUpdated,
      durationMs: duration,
    });
  } catch (error) {
    console.error('❌ Error in sync-keyword-usage cron:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
