/**
 * Agency Incentive Logic
 *
 * Handles the free workspace incentive for agencies.
 * Agency gets one free workspace for themselves while they have 1+ active paying clients.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { hasActivePayingClient } from './agencyTrial';

export interface AgencyIncentiveStatus {
  isEligible: boolean;
  hasFreeWorkspace: boolean;
  payingClientsCount: number;
  reason: string;
}

/**
 * Check if agency is eligible for free workspace
 */
export async function checkAgencyFreeWorkspaceEligibility(
  supabase: SupabaseClient,
  agencyAccountId: string
): Promise<AgencyIncentiveStatus> {
  // Get account details
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select(`
      id,
      is_agncy,
      is_free_account,
      free_plan_level,
      plan,
      subscription_status
    `)
    .eq('id', agencyAccountId)
    .single();

  if (accountError || !account) {
    return {
      isEligible: false,
      hasFreeWorkspace: false,
      payingClientsCount: 0,
      reason: 'Account not found',
    };
  }

  if (!account.is_agncy) {
    return {
      isEligible: false,
      hasFreeWorkspace: false,
      payingClientsCount: 0,
      reason: 'Account is not an agency',
    };
  }

  // Check paying clients
  const { hasPayingClient, count } = await hasActivePayingClient(supabase, agencyAccountId);

  if (!hasPayingClient) {
    return {
      isEligible: false,
      hasFreeWorkspace: false,
      payingClientsCount: 0,
      reason: 'Agency needs at least 1 paying client for free workspace',
    };
  }

  // Check if already has free workspace
  const hasFreeWorkspace = account.is_free_account === true && account.free_plan_level === 'agency_incentive';

  return {
    isEligible: true,
    hasFreeWorkspace,
    payingClientsCount: count,
    reason: hasFreeWorkspace
      ? 'Agency has free workspace incentive active'
      : 'Agency is eligible for free workspace',
  };
}

/**
 * Activate free workspace for agency
 * Called when agency gets their first paying client
 */
export async function activateAgencyFreeWorkspace(
  supabase: SupabaseClient,
  agencyAccountId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify eligibility first
  const eligibility = await checkAgencyFreeWorkspaceEligibility(supabase, agencyAccountId);

  if (!eligibility.isEligible) {
    return { success: false, error: eligibility.reason };
  }

  if (eligibility.hasFreeWorkspace) {
    return { success: true }; // Already active
  }

  // Get current account status
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('plan, subscription_status, stripe_subscription_id')
    .eq('id', agencyAccountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: 'Account not found' };
  }

  // If agency has an active paid subscription, we need to handle it
  // For now, just mark as free (actual Stripe cancellation would be Phase 2)
  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      is_free_account: true,
      free_plan_level: 'agency_incentive',
      // Keep the plan level for feature access
      plan: account.plan || 'grower',
    })
    .eq('id', agencyAccountId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log the event
  await supabase.from('account_events').insert({
    account_id: agencyAccountId,
    event_type: 'agency_free_workspace_activated',
    event_data: {
      paying_clients_count: eligibility.payingClientsCount,
      previous_plan: account.plan,
    },
  });

  return { success: true };
}

/**
 * Deactivate free workspace for agency
 * Called when agency loses their last paying client
 */
export async function deactivateAgencyFreeWorkspace(
  supabase: SupabaseClient,
  agencyAccountId: string
): Promise<{ success: boolean; error?: string }> {
  // Check current status
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('is_free_account, free_plan_level')
    .eq('id', agencyAccountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: 'Account not found' };
  }

  // Only deactivate if currently on agency incentive
  if (account.free_plan_level !== 'agency_incentive') {
    return { success: true }; // Not on incentive plan
  }

  // Remove free workspace status
  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      is_free_account: false,
      free_plan_level: null,
    })
    .eq('id', agencyAccountId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log the event
  await supabase.from('account_events').insert({
    account_id: agencyAccountId,
    event_type: 'agency_free_workspace_deactivated',
    event_data: {
      reason: 'No paying clients remaining',
    },
  });

  return { success: true };
}

/**
 * Sync agency free workspace status
 * Should be called after any client subscription change
 */
export async function syncAgencyFreeWorkspace(
  supabase: SupabaseClient,
  agencyAccountId: string
): Promise<{ action: 'activated' | 'deactivated' | 'unchanged'; error?: string }> {
  const eligibility = await checkAgencyFreeWorkspaceEligibility(supabase, agencyAccountId);

  if (!eligibility.isEligible && eligibility.hasFreeWorkspace) {
    // Should deactivate
    const result = await deactivateAgencyFreeWorkspace(supabase, agencyAccountId);
    if (!result.success) {
      return { action: 'unchanged', error: result.error };
    }
    return { action: 'deactivated' };
  }

  if (eligibility.isEligible && !eligibility.hasFreeWorkspace) {
    // Should activate
    const result = await activateAgencyFreeWorkspace(supabase, agencyAccountId);
    if (!result.success) {
      return { action: 'unchanged', error: result.error };
    }
    return { action: 'activated' };
  }

  return { action: 'unchanged' };
}

/**
 * Get all agencies that should have their incentive synced
 * (e.g., after a client subscription changes)
 */
export async function getAgenciesForClient(
  supabase: SupabaseClient,
  clientAccountId: string
): Promise<string[]> {
  const { data: account, error } = await supabase
    .from('accounts')
    .select('managing_agncy_id')
    .eq('id', clientAccountId)
    .single();

  if (error || !account?.managing_agncy_id) {
    return [];
  }

  return [account.managing_agncy_id];
}
