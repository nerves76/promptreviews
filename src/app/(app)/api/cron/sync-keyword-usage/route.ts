/**
 * Cron Job: Sync Keyword Usage Counts & Auto-Rotate
 *
 * Runs daily to sync the review_usage_count and last_used_in_review_at
 * fields on the keywords table based on keyword_review_matches_v2,
 * then automatically rotates overused keywords for pages with auto-rotate enabled.
 *
 * This operation:
 * 1. Gets all accounts with keywords
 * 2. For each account, counts matches per keyword
 * 3. Updates the denormalized usage count on keywords table
 * 4. For pages with auto-rotate enabled, rotates overused keywords out of active pool
 *
 * Endpoint: GET /api/cron/sync-keyword-usage
 * Authorization: Bearer token (CRON_SECRET_TOKEN)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncAllKeywordUsageCounts } from '@/features/keywords/reprocessKeywordMatches';
import { autoRotatePromptPage } from '@/features/keywords/keywordRotationService';

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

    const syncDuration = Date.now() - startTime;
    console.log(
      `✅ Keyword usage sync complete: ${result.accountsProcessed} accounts, ${result.totalUpdated} keywords updated in ${syncDuration}ms`
    );

    // Step 2: Auto-rotate keywords for pages with auto-rotate enabled
    console.log('🔄 Starting auto-rotation for eligible pages...');
    const rotationStartTime = Date.now();

    // Get all prompt pages with auto-rotate enabled
    const { data: eligiblePages, error: pagesError } = await supabaseAdmin
      .from('prompt_pages')
      .select('id, account_id, name')
      .eq('keyword_auto_rotate_enabled', true);

    if (pagesError) {
      console.error('❌ Failed to fetch eligible pages for rotation:', pagesError);
    }

    let totalRotations = 0;
    let pagesProcessed = 0;
    const rotationResults: Array<{ pageId: string; pageName: string; rotations: number }> = [];

    for (const page of eligiblePages || []) {
      try {
        const rotationResult = await autoRotatePromptPage(
          page.id,
          page.account_id,
          supabaseAdmin
        );

        const successfulRotations = rotationResult.rotations.filter(r => r.success).length;
        if (successfulRotations > 0) {
          rotationResults.push({
            pageId: page.id,
            pageName: page.name || 'Unnamed',
            rotations: successfulRotations,
          });
          totalRotations += successfulRotations;
        }
        pagesProcessed++;
      } catch (rotationError) {
        console.error(`❌ Failed to auto-rotate page ${page.id}:`, rotationError);
      }
    }

    const rotationDuration = Date.now() - rotationStartTime;
    const totalDuration = Date.now() - startTime;

    console.log(
      `✅ Auto-rotation complete: ${pagesProcessed} pages processed, ${totalRotations} keywords rotated in ${rotationDuration}ms`
    );

    return NextResponse.json({
      success: true,
      sync: {
        accountsProcessed: result.accountsProcessed,
        keywordsUpdated: result.totalUpdated,
        durationMs: syncDuration,
      },
      rotation: {
        pagesProcessed,
        totalRotations,
        rotationResults,
        durationMs: rotationDuration,
      },
      totalDurationMs: totalDuration,
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
