/**
 * Onboarding Email System
 *
 * Utility functions for sending onboarding, lifecycle, and milestone emails.
 * Uses the onboarding_email_logs table for duplicate prevention.
 */

import { createClient } from '@supabase/supabase-js';
import { sendTemplatedEmail } from '@/utils/emailTemplates';

// Lazy initialization to avoid build-time env var access
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =============================================================
// Types
// =============================================================

interface OnboardingAccount {
  id: string;
  email: string;
  first_name: string | null;
  plan: string;
  created_at: string;
  trial_end: string | null;
  is_client_account: boolean | null;
}

// =============================================================
// Duplicate Prevention
// =============================================================

/**
 * Check if an onboarding email has already been successfully sent
 */
async function alreadySent(
  accountId: string,
  emailType: string,
  supabase?: ReturnType<typeof getServiceClient>
): Promise<boolean> {
  const client = supabase || getServiceClient();
  const { data } = await client
    .from('onboarding_email_logs')
    .select('id')
    .eq('account_id', accountId)
    .eq('email_type', emailType)
    .eq('success', true)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Log an onboarding email send attempt
 */
async function logEmailSend(
  accountId: string,
  emailType: string,
  email: string,
  success: boolean,
  errorMessage?: string,
  supabase?: ReturnType<typeof getServiceClient>
): Promise<void> {
  const client = supabase || getServiceClient();
  await client
    .from('onboarding_email_logs')
    .insert({
      account_id: accountId,
      email_type: emailType,
      email,
      success,
      error_message: errorMessage || null,
    });
}

// =============================================================
// Generic Send Helper
// =============================================================

/**
 * Send an onboarding email with automatic duplicate prevention and logging.
 * Returns true if sent, false if skipped or failed.
 */
export async function sendOnboardingEmail(
  accountId: string,
  email: string,
  emailType: string,
  variables: Record<string, string>,
  supabase?: ReturnType<typeof getServiceClient>
): Promise<boolean> {
  const client = supabase || getServiceClient();

  // Check for duplicate
  const sent = await alreadySent(accountId, emailType, client);
  if (sent) {
    return false;
  }

  // Send
  const result = await sendTemplatedEmail(emailType, email, variables);

  // Log attempt
  await logEmailSend(
    accountId,
    emailType,
    email,
    result.success,
    result.error,
    client
  );

  if (!result.success) {
    console.error(`[onboarding-emails] Failed to send ${emailType} to ${email}:`, result.error);
  }

  return result.success;
}

// =============================================================
// Activation Check Functions
// =============================================================

async function hasPromptPage(
  accountId: string,
  supabase: ReturnType<typeof getServiceClient>
): Promise<boolean> {
  const { count } = await supabase
    .from('prompt_pages')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId);

  return (count ?? 0) > 0;
}

async function hasGoogleConnection(
  accountId: string,
  supabase: ReturnType<typeof getServiceClient>
): Promise<boolean> {
  const { count } = await supabase
    .from('google_business_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId);

  return (count ?? 0) > 0;
}

async function hasWidget(
  accountId: string,
  supabase: ReturnType<typeof getServiceClient>
): Promise<boolean> {
  const { count } = await supabase
    .from('widgets')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId);

  return (count ?? 0) > 0;
}

// =============================================================
// Batch Processors (for cron)
// =============================================================

/**
 * Process onboarding sequence emails (Day 1, 2, 4 after signup).
 * Only sends to trial accounts that haven't completed the relevant action.
 */
export async function processOnboardingSequence(
  supabase: ReturnType<typeof getServiceClient>
): Promise<{ sent: number; skipped: number; failed: number }> {
  const now = new Date();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Day 1: prompt page reminder (accounts created 1 day ago)
  const day1Start = new Date(now);
  day1Start.setDate(day1Start.getDate() - 1);
  day1Start.setHours(0, 0, 0, 0);
  const day1End = new Date(day1Start);
  day1End.setHours(23, 59, 59, 999);

  // Day 2: Google connection (accounts created 2 days ago)
  const day2Start = new Date(now);
  day2Start.setDate(day2Start.getDate() - 2);
  day2Start.setHours(0, 0, 0, 0);
  const day2End = new Date(day2Start);
  day2End.setHours(23, 59, 59, 999);

  // Day 4: widget reminder (accounts created 4 days ago)
  const day4Start = new Date(now);
  day4Start.setDate(day4Start.getDate() - 4);
  day4Start.setHours(0, 0, 0, 0);
  const day4End = new Date(day4Start);
  day4End.setHours(23, 59, 59, 999);

  // Fetch all candidate accounts (created 1-4 days ago, trial plan, not client accounts)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, email, first_name, plan, created_at, trial_end, is_client_account')
    .eq('plan', 'grower')
    .neq('is_client_account', true)
    .is('deleted_at', null)
    .not('email', 'is', null)
    .gte('created_at', day4Start.toISOString())
    .lte('created_at', day1End.toISOString());

  if (!accounts?.length) return { sent, skipped, failed };

  for (const account of accounts) {
    const createdAt = new Date(account.created_at);
    const firstName = account.first_name || 'there';

    // Day 1: Setup prompt page
    if (createdAt >= day1Start && createdAt <= day1End) {
      const hasPage = await hasPromptPage(account.id, supabase);
      if (hasPage) {
        skipped++;
      } else {
        const didSend = await sendOnboardingEmail(
          account.id, account.email, 'onboarding_setup_prompt_page',
          { firstName }, supabase
        );
        didSend ? sent++ : (await alreadySent(account.id, 'onboarding_setup_prompt_page', supabase) ? skipped++ : failed++);
      }
    }

    // Day 2: Connect Google
    if (createdAt >= day2Start && createdAt <= day2End) {
      const hasGoogle = await hasGoogleConnection(account.id, supabase);
      if (hasGoogle) {
        skipped++;
      } else {
        const didSend = await sendOnboardingEmail(
          account.id, account.email, 'onboarding_connect_google',
          { firstName }, supabase
        );
        didSend ? sent++ : (await alreadySent(account.id, 'onboarding_connect_google', supabase) ? skipped++ : failed++);
      }
    }

    // Day 4: Add widget
    if (createdAt >= day4Start && createdAt <= day4End) {
      const hasW = await hasWidget(account.id, supabase);
      if (hasW) {
        skipped++;
      } else {
        const didSend = await sendOnboardingEmail(
          account.id, account.email, 'onboarding_add_widget',
          { firstName }, supabase
        );
        didSend ? sent++ : (await alreadySent(account.id, 'onboarding_add_widget', supabase) ? skipped++ : failed++);
      }
    }

    // Rate limit: 500ms between sends
    if (sent > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { sent, skipped, failed };
}

/**
 * Process post-expiration drip emails (1 week, 1 month after trial expired).
 */
export async function processPostExpirationDrip(
  supabase: ReturnType<typeof getServiceClient>
): Promise<{ sent: number; skipped: number; failed: number }> {
  const now = new Date();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // 1 week after expiration
  const oneWeekAgoStart = new Date(now);
  oneWeekAgoStart.setDate(oneWeekAgoStart.getDate() - 7);
  oneWeekAgoStart.setHours(0, 0, 0, 0);
  const oneWeekAgoEnd = new Date(oneWeekAgoStart);
  oneWeekAgoEnd.setHours(23, 59, 59, 999);

  // 1 month after expiration
  const oneMonthAgoStart = new Date(now);
  oneMonthAgoStart.setMonth(oneMonthAgoStart.getMonth() - 1);
  oneMonthAgoStart.setHours(0, 0, 0, 0);
  const oneMonthAgoEnd = new Date(oneMonthAgoStart);
  oneMonthAgoEnd.setHours(23, 59, 59, 999);

  // Fetch expired trial accounts
  const { data: weekAccounts } = await supabase
    .from('accounts')
    .select('id, email, first_name, plan, created_at, trial_end, is_client_account')
    .eq('plan', 'grower')
    .neq('is_client_account', true)
    .is('deleted_at', null)
    .not('email', 'is', null)
    .not('trial_end', 'is', null)
    .gte('trial_end', oneWeekAgoStart.toISOString())
    .lte('trial_end', oneWeekAgoEnd.toISOString());

  const { data: monthAccounts } = await supabase
    .from('accounts')
    .select('id, email, first_name, plan, created_at, trial_end, is_client_account')
    .eq('plan', 'grower')
    .neq('is_client_account', true)
    .is('deleted_at', null)
    .not('email', 'is', null)
    .not('trial_end', 'is', null)
    .gte('trial_end', oneMonthAgoStart.toISOString())
    .lte('trial_end', oneMonthAgoEnd.toISOString());

  // 1-week post-expiration
  for (const account of weekAccounts || []) {
    const firstName = account.first_name || 'there';
    const didSend = await sendOnboardingEmail(
      account.id, account.email, 'post_expiration_1_week',
      { firstName }, supabase
    );
    didSend ? sent++ : (await alreadySent(account.id, 'post_expiration_1_week', supabase) ? skipped++ : failed++);

    if (sent > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 1-month post-expiration
  for (const account of monthAccounts || []) {
    const firstName = account.first_name || 'there';
    const didSend = await sendOnboardingEmail(
      account.id, account.email, 'post_expiration_1_month',
      { firstName }, supabase
    );
    didSend ? sent++ : (await alreadySent(account.id, 'post_expiration_1_month', supabase) ? skipped++ : failed++);

    if (sent > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { sent, skipped, failed };
}

// =============================================================
// Event-Driven Email Wrappers
// =============================================================

/**
 * Send subscription activated email (after trial converts to paid).
 */
export async function sendSubscriptionActivatedEmail(
  accountId: string,
  email: string,
  firstName: string,
  planName: string
): Promise<boolean> {
  return sendOnboardingEmail(accountId, email, 'subscription_activated', {
    firstName,
    planName,
  });
}

/**
 * Send payment failure email (first failure, reminder, final warning, restricted, recovered).
 */
export async function sendPaymentEmail(
  accountId: string,
  templateKey: string,
  variables: Record<string, string>
): Promise<boolean> {
  const supabase = getServiceClient();

  // Look up account email
  const { data: account } = await supabase
    .from('accounts')
    .select('email, first_name')
    .eq('id', accountId)
    .single();

  if (!account?.email) {
    console.error(`[onboarding-emails] No email found for account ${accountId}`);
    return false;
  }

  // Map template keys from payment-retry config to email template names
  const templateMap: Record<string, string> = {
    FIRST_FAILURE: 'payment_failed_first',
    REMINDER: 'payment_failed_reminder',
    FINAL_WARNING: 'payment_failed_final',
    ACCESS_RESTRICTED: 'payment_access_restricted',
    PAYMENT_RECOVERED: 'payment_recovered',
  };

  const emailType = templateMap[templateKey] || templateKey;

  return sendOnboardingEmail(accountId, account.email, emailType, {
    firstName: account.first_name || 'there',
    ...variables,
  }, supabase);
}

/**
 * Send cancellation feedback email.
 */
export async function sendCancellationEmail(
  accountId: string,
  email: string,
  firstName: string
): Promise<boolean> {
  return sendOnboardingEmail(accountId, email, 'cancellation_feedback', {
    firstName,
  });
}

/**
 * Send team member welcome email.
 */
export async function sendTeamWelcomeEmail(
  accountId: string,
  email: string,
  firstName: string,
  businessName: string,
  role: string
): Promise<boolean> {
  return sendOnboardingEmail(accountId, email, 'team_member_welcome', {
    firstName,
    businessName,
    role,
  });
}

/**
 * Send first review milestone email.
 */
export async function sendFirstReviewMilestoneEmail(
  accountId: string,
  email: string,
  firstName: string
): Promise<boolean> {
  return sendOnboardingEmail(accountId, email, 'milestone_first_review', {
    firstName,
  });
}
