/**
 * Cron Job: Cleanup Old Notifications
 *
 * Removes old notifications to prevent database bloat:
 * - Notifications older than 30 days that are read OR dismissed
 * - Notifications older than 90 days regardless of status
 *
 * Runs daily at 3 AM UTC (off-peak hours).
 *
 * Security: Uses a secret token to ensure only Vercel can call this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

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

    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate cutoff dates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete old read/dismissed notifications (30+ days)
    const { count: deletedReadCount, error: readError } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('created_at', thirtyDaysAgo.toISOString())
      .or('read.eq.true,dismissed.eq.true');

    if (readError) {
      console.error('Error deleting read notifications:', readError);
    }

    // Delete very old notifications regardless of status (90+ days)
    const { count: deletedOldCount, error: oldError } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (oldError) {
      console.error('Error deleting old notifications:', oldError);
    }

    const totalDeleted = (deletedReadCount || 0) + (deletedOldCount || 0);
    const duration = Date.now() - startTime;

    console.log(`🧹 Notification cleanup complete in ${duration}ms`);
    console.log(`   Deleted read/dismissed (30+ days): ${deletedReadCount || 0}`);
    console.log(`   Deleted very old (90+ days): ${deletedOldCount || 0}`);
    console.log(`   Total deleted: ${totalDeleted}`);

    return NextResponse.json({
      success: true,
      summary: {
        deletedReadDismissed: deletedReadCount || 0,
        deletedVeryOld: deletedOldCount || 0,
        totalDeleted,
        durationMs: duration
      }
    });

  } catch (error) {
    console.error('Error in notification cleanup cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
