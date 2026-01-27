/**
 * Cron Job: Send Mid-Trial Check-In Emails
 *
 * Sends check-in emails to users who are 7 days into their trial (7 days left).
 * This endpoint is called by Vercel's cron service daily at 9 AM UTC.
 *
 * Security: Uses a secret token to ensure only Vercel can call this endpoint.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMidTrialCheckInEmail } from '@/utils/emailTemplates';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel cron
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-mid-trial-checkins', async () => {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate the date 7 days from now (for users whose trial ends in 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysFromNowISO = sevenDaysFromNow.toISOString();

    // Find users whose trial expires in 7 days
    // Only send to 'grower' plan accounts (not free, not paid plans, not client accounts)
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, trial_end, first_name, email, plan, is_client_account')
      .eq('plan', 'grower')
      .neq('is_client_account', true)
      .not('trial_end', 'is', null)
      .not('email', 'is', null)
      .gte('trial_end', sevenDaysFromNowISO)
      .lt('trial_end', new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching accounts for mid-trial check-ins:', error);
      return { success: false, error: 'Failed to fetch accounts' };
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Send check-in emails
    for (const account of accounts || []) {
      try {
        // Skip if no email
        if (!account.email) {
          continue;
        }

        // Double-check: skip free plans and client accounts (defensive)
        if (account.plan === 'free' || account.is_client_account) {
          console.log(`[Mid-Trial Check-In] Skipping ${account.email}: plan=${account.plan}, is_client=${account.is_client_account}`);
          skippedCount++;
          continue;
        }

        // Check if we've already sent a mid-trial check-in for this account
        const { data: existingReminders } = await supabase
          .from('trial_reminder_logs')
          .select('id')
          .eq('account_id', account.id)
          .eq('reminder_type', 'mid_trial_checkin')
          .limit(1);

        if (existingReminders && existingReminders.length > 0) {
          skippedCount++;
          continue;
        }

        const result = await sendMidTrialCheckInEmail(
          account.email,
          account.first_name || 'there'
        );

        // Log the reminder attempt
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: account.email,
            reminder_type: 'mid_trial_checkin',
            success: result.success,
            error_message: result.error || null
          });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;

        // Log the error
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: account.email || 'unknown',
            reminder_type: 'mid_trial_checkin',
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
      }
    }

    return {
      success: errorCount === 0,
      summary: {
        total: accounts?.length || 0,
        sent: successCount,
        failed: errorCount,
        skipped: skippedCount
      }
    };
  });
}
