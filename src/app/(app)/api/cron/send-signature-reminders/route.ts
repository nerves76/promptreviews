/**
 * Cron Job: Send Signature Reminders
 *
 * Sends a reminder notification to account holders when a contract
 * has been sent but not signed after 3 days. Sends at most one
 * reminder per contract (tracked via reminder_sent_at column).
 *
 * Schedule: Daily at 10 AM UTC
 */

import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { sendNotificationToAccount } from '@/utils/notifications';
import {
  logCronExecution,
  verifyCronSecret,
  hasCompletedToday,
  shouldExitEarly,
} from '@/lib/cronLogger';

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-signature-reminders', async () => {
    const alreadyRan = await hasCompletedToday('send-signature-reminders');
    if (alreadyRan) {
      return { success: true, summary: { skipped: true, reason: 'Already completed today' } };
    }

    const cronStartTime = Date.now();
    const supabase = createServiceRoleClient();

    // Find proposals sent 3+ days ago that haven't been signed or declined,
    // aren't expired/on_hold, and haven't already received a reminder
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: proposals, error: queryError } = await supabase
      .from('proposals')
      .select('id, account_id, title, client_first_name, client_last_name, sent_at')
      .not('sent_at', 'is', null)
      .is('accepted_at', null)
      .is('declined_at', null)
      .is('reminder_sent_at', null)
      .not('status', 'in', '("expired","on_hold")')
      .lte('sent_at', threeDaysAgo.toISOString())
      .eq('is_template', false)
      .limit(100);

    if (queryError) {
      console.error('[SignatureReminders] Query error:', queryError);
      return { success: false, error: queryError.message };
    }

    if (!proposals || proposals.length === 0) {
      return { success: true, summary: { total: 0, sent: 0 } };
    }

    let sent = 0;
    let failed = 0;

    for (const proposal of proposals) {
      if (shouldExitEarly(cronStartTime)) {
        return {
          success: true,
          summary: { exitedEarly: true, total: proposals.length, sent, failed },
        };
      }

      try {
        const clientName = [proposal.client_first_name, proposal.client_last_name]
          .filter(Boolean)
          .join(' ') || 'Your client';

        const daysSinceSent = Math.floor(
          (Date.now() - new Date(proposal.sent_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        await sendNotificationToAccount(proposal.account_id, 'proposal_unsigned_reminder', {
          clientName,
          proposalTitle: proposal.title,
          proposalId: proposal.id,
          daysSinceSent,
        });

        // Mark reminder as sent so we don't send again
        await supabase
          .from('proposals')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', proposal.id);

        sent++;
      } catch (err) {
        console.error(`[SignatureReminders] Failed for proposal ${proposal.id}:`, err);
        failed++;
      }
    }

    return {
      success: true,
      summary: { total: proposals.length, sent, failed },
    };
  });
}
