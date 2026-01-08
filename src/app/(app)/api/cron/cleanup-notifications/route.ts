/**
 * Cron Job: Cleanup Old Notifications
 *
 * Removes old notifications to prevent database bloat:
 * - Notifications older than 30 days that are read OR dismissed
 * - Notifications older than 90 days regardless of status
 *
 * Runs daily at 3 AM UTC (off-peak hours).
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('cleanup-notifications', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { count: deletedReadCount, error: readError } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('created_at', thirtyDaysAgo.toISOString())
      .or('read.eq.true,dismissed.eq.true');

    if (readError) {
      console.error('Error deleting read notifications:', readError);
    }

    const { count: deletedOldCount, error: oldError } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (oldError) {
      console.error('Error deleting old notifications:', oldError);
    }

    const totalDeleted = (deletedReadCount || 0) + (deletedOldCount || 0);

    return {
      success: !readError && !oldError,
      summary: {
        deletedReadDismissed: deletedReadCount || 0,
        deletedVeryOld: deletedOldCount || 0,
        totalDeleted
      }
    };
  });
}
