/**
 * Cron Job: Send Trial Expired Emails
 *
 * Sends "last chance" emails to users whose trial expired today.
 * This endpoint is called by Vercel's cron service daily at 9 AM UTC.
 *
 * Security: Uses a secret token to ensure only Vercel can call this endpoint.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTrialExpiredEmail } from '@/utils/emailTemplates';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel cron
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-trial-expired', async () => {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get today's date range (trials that expired today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const tomorrowISO = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Find users whose trial expired today
    // Only send to 'grower' plan accounts (not free, not paid plans, not client accounts)
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, trial_end, first_name, email, plan, is_client_account')
      .eq('plan', 'grower')
      .neq('is_client_account', true)
      .not('trial_end', 'is', null)
      .not('email', 'is', null)
      .gte('trial_end', todayISO)
      .lt('trial_end', tomorrowISO);

    if (error) {
      console.error('Error fetching accounts for trial expired emails:', error);
      return { success: false, error: 'Failed to fetch accounts' };
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Send trial expired emails
    for (const account of accounts || []) {
      try {
        // Skip if no email
        if (!account.email) {
          continue;
        }

        // Double-check: skip free plans and client accounts (defensive)
        if (account.plan === 'free' || account.is_client_account) {
          console.log(`[Trial Expired] Skipping ${account.email}: plan=${account.plan}, is_client=${account.is_client_account}`);
          skippedCount++;
          continue;
        }

        // Check if we've already sent a trial_expired email for this account
        const { data: existingReminders } = await supabase
          .from('trial_reminder_logs')
          .select('id')
          .eq('account_id', account.id)
          .eq('reminder_type', 'trial_expired')
          .limit(1);

        if (existingReminders && existingReminders.length > 0) {
          skippedCount++;
          continue;
        }

        const result = await sendTrialExpiredEmail(
          account.email,
          account.first_name || 'there'
        );

        // Log the reminder attempt
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: account.email,
            reminder_type: 'trial_expired',
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
            reminder_type: 'trial_expired',
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
