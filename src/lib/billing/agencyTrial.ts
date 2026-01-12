/**
 * Agency Trial Logic
 *
 * Handles 30-day agency trial period management.
 * Agencies must activate 1+ paying client to keep agency features after trial.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type AgencyTrialStatus = 'active' | 'expired' | 'converted' | 'not_agency';

export interface AgencyTrialInfo {
  status: AgencyTrialStatus;
  isAgency: boolean;
  trialStart: Date | null;
  trialEnd: Date | null;
  daysRemaining: number;
  hasPayingClient: boolean;
  payingClientsCount: number;
  requiresPlanSelection: boolean;
  hasFreeWorkspace: boolean;
}

/**
 * Check if an account has any paying clients
 */
export async function hasActivePayingClient(
  supabase: SupabaseClient,
  agencyAccountId: string
): Promise<{ hasPayingClient: boolean; count: number }> {
  const { count, error } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .eq('managing_agncy_id', agencyAccountId)
    .eq('subscription_status', 'active')
    .is('deleted_at', null);

  if (error) {
    console.error('Error checking paying clients:', error);
    return { hasPayingClient: false, count: 0 };
  }

  return {
    hasPayingClient: (count || 0) > 0,
    count: count || 0,
  };
}

/**
 * Get comprehensive agency trial status
 */
export async function getAgencyTrialStatus(
  supabase: SupabaseClient,
  accountId: string
): Promise<AgencyTrialInfo> {
  // Get account details
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select(`
      id,
      is_agncy,
      agncy_trial_start,
      agncy_trial_end,
      plan,
      subscription_status,
      has_had_paid_plan
    `)
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return {
      status: 'not_agency',
      isAgency: false,
      trialStart: null,
      trialEnd: null,
      daysRemaining: 0,
      hasPayingClient: false,
      payingClientsCount: 0,
      requiresPlanSelection: false,
      hasFreeWorkspace: false,
    };
  }

  // Not an agency
  if (!account.is_agncy) {
    return {
      status: 'not_agency',
      isAgency: false,
      trialStart: null,
      trialEnd: null,
      daysRemaining: 0,
      hasPayingClient: false,
      payingClientsCount: 0,
      requiresPlanSelection: false,
      hasFreeWorkspace: false,
    };
  }

  // Check paying clients
  const { hasPayingClient, count: payingClientsCount } = await hasActivePayingClient(
    supabase,
    accountId
  );

  const now = new Date();
  const trialStart = account.agncy_trial_start ? new Date(account.agncy_trial_start) : null;
  const trialEnd = account.agncy_trial_end ? new Date(account.agncy_trial_end) : null;

  // Calculate days remaining
  let daysRemaining = 0;
  if (trialEnd && trialEnd > now) {
    daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Determine status
  const hasOwnPlan = account.plan && account.plan !== 'no_plan' && account.subscription_status === 'active';

  let status: AgencyTrialStatus;
  let requiresPlanSelection = false;
  let hasFreeWorkspace = false;

  if (hasOwnPlan || account.has_had_paid_plan) {
    // Agency has their own paid plan
    status = 'converted';
  } else if (!trialEnd) {
    // No trial configured
    status = 'expired';
    requiresPlanSelection = !hasPayingClient;
  } else if (trialEnd > now) {
    // Trial is active
    status = 'active';
  } else {
    // Trial has expired
    status = 'expired';
    if (hasPayingClient) {
      // Has paying clients - free workspace incentive applies
      hasFreeWorkspace = true;
    } else {
      // No paying clients - must select a plan
      requiresPlanSelection = true;
    }
  }

  return {
    status,
    isAgency: true,
    trialStart,
    trialEnd,
    daysRemaining,
    hasPayingClient,
    payingClientsCount,
    requiresPlanSelection,
    hasFreeWorkspace,
  };
}

/**
 * Check if agency trial is active
 */
export async function isAgencyTrialActive(
  supabase: SupabaseClient,
  accountId: string
): Promise<boolean> {
  const info = await getAgencyTrialStatus(supabase, accountId);
  return info.status === 'active';
}

/**
 * Check if agency has access to agency features
 * (trial active OR has paying clients OR has own plan)
 */
export async function canAccessAgencyFeatures(
  supabase: SupabaseClient,
  accountId: string
): Promise<boolean> {
  const info = await getAgencyTrialStatus(supabase, accountId);

  if (!info.isAgency) {
    return false;
  }

  // Can access if:
  // 1. Trial is active
  // 2. Has converted (own plan)
  // 3. Has paying clients (free workspace incentive)
  return (
    info.status === 'active' ||
    info.status === 'converted' ||
    info.hasPayingClient
  );
}

/**
 * Extend agency trial (for support/admin use)
 */
export async function extendAgencyTrial(
  supabase: SupabaseClient,
  accountId: string,
  additionalDays: number
): Promise<{ success: boolean; newTrialEnd?: Date; error?: string }> {
  // Get current account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('is_agncy, agncy_trial_end')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: 'Account not found' };
  }

  if (!account.is_agncy) {
    return { success: false, error: 'Account is not an agency' };
  }

  // Calculate new trial end
  const currentEnd = account.agncy_trial_end ? new Date(account.agncy_trial_end) : new Date();
  const now = new Date();
  const baseDate = currentEnd > now ? currentEnd : now;
  const newTrialEnd = new Date(baseDate);
  newTrialEnd.setDate(newTrialEnd.getDate() + additionalDays);

  // Update account
  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      agncy_trial_end: newTrialEnd.toISOString(),
    })
    .eq('id', accountId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log the event
  await supabase.from('account_events').insert({
    account_id: accountId,
    event_type: 'agency_trial_extended',
    event_data: {
      additional_days: additionalDays,
      new_trial_end: newTrialEnd.toISOString(),
    },
  });

  return { success: true, newTrialEnd };
}

/**
 * Start agency trial for an account
 */
export async function startAgencyTrial(
  supabase: SupabaseClient,
  accountId: string,
  trialDays: number = 30
): Promise<{ success: boolean; trialEnd?: Date; error?: string }> {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + trialDays);

  const { error } = await supabase
    .from('accounts')
    .update({
      is_agncy: true,
      agncy_trial_start: now.toISOString(),
      agncy_trial_end: trialEnd.toISOString(),
    })
    .eq('id', accountId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, trialEnd };
}
