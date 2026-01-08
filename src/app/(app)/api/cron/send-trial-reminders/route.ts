/**
 * Cron Job: Send Trial Reminders
 *
 * Automatically sends reminder emails to users whose trial expires in 3 days.
 * This endpoint is called by Vercel's cron service daily at 9 AM UTC.
 *
 * Security: Uses a secret token to ensure only Vercel can call this endpoint.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTrialReminderEmail } from '@/utils/emailTemplates';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel cron
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-trial-reminders', async () => {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate the date 3 days from now
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysFromNowISO = threeDaysFromNow.toISOString();

    // Find users whose trial expires in 3 days
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        id,
        trial_end,
        profiles!inner(
          first_name,
          email
        )
      `)
      .eq('plan', 'grower')
      .not('trial_end', 'is', null)
      .gte('trial_end', threeDaysFromNowISO)
      .lt('trial_end', new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching accounts for trial reminders:', error);
      return { success: false, error: 'Failed to fetch accounts' };
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Send reminder emails
    for (const account of accounts || []) {
      try {
        // Handle the profiles array from inner join
        const profile = Array.isArray(account.profiles) ? account.profiles[0] : account.profiles;
        if (!profile) {
          continue;
        }

        // Check if we've already sent a reminder for this account today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: existingReminders } = await supabase
          .from('trial_reminder_logs')
          .select('id')
          .eq('account_id', account.id)
          .eq('reminder_type', 'trial_reminder')
          .gte('sent_at', today.toISOString())
          .limit(1);

        if (existingReminders && existingReminders.length > 0) {
          skippedCount++;
          continue;
        }

        const result = await sendTrialReminderEmail(
          profile.email,
          profile.first_name || 'there'
        );

        // Log the reminder attempt
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: profile.email,
            reminder_type: 'trial_reminder',
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

        // Handle the profiles array from inner join
        const profile = Array.isArray(account.profiles) ? account.profiles[0] : account.profiles;
        const email = profile?.email || 'unknown';

        // Log the error
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: email,
            reminder_type: 'trial_reminder',
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
