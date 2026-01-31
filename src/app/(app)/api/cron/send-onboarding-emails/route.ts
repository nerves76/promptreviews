/**
 * Onboarding Emails Cron Job
 *
 * Sends onboarding sequence emails (Day 1/2/4 after signup) and
 * post-expiration drip emails (1 week, 1 month after trial expired).
 *
 * Added to the daily-8am-dispatcher.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronSecret, logCronExecution } from '@/lib/cronLogger';
import {
  processOnboardingSequence,
  processPostExpirationDrip,
} from '@/lib/onboarding-emails';

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-onboarding-emails', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Process onboarding sequence (Day 1, 2, 4)
    const onboarding = await processOnboardingSequence(supabase);

    // Process post-expiration drip (1 week, 1 month)
    const postExpiration = await processPostExpirationDrip(supabase);

    const totalSent = onboarding.sent + postExpiration.sent;
    const totalFailed = onboarding.failed + postExpiration.failed;

    return {
      success: totalFailed === 0,
      summary: {
        onboarding: {
          sent: onboarding.sent,
          skipped: onboarding.skipped,
          failed: onboarding.failed,
        },
        postExpiration: {
          sent: postExpiration.sent,
          skipped: postExpiration.skipped,
          failed: postExpiration.failed,
        },
        totalSent,
        totalFailed,
      },
    };
  });
}
