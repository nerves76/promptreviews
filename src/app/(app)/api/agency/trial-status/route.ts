/**
 * Agency Trial Status API Route
 *
 * GET - Check the agency trial status and requirements
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';

export type AgencyTrialStatus = 'active' | 'expired' | 'converted' | 'not_agency';

interface TrialStatusResponse {
  status: AgencyTrialStatus;
  is_agncy: boolean;
  is_free_account?: boolean;
  trial_start?: string;
  trial_end?: string;
  days_remaining?: number;
  has_paying_client: boolean;
  paying_clients_count: number;
  requires_plan_selection: boolean;
  message: string;
}

/**
 * GET - Check agency trial status
 */
export async function GET(request: NextRequest): Promise<NextResponse<TrialStatusResponse | { error: string }>> {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

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
        has_had_paid_plan,
        is_free_account
      `)
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Not an agency account
    if (!account.is_agncy) {
      return NextResponse.json({
        status: 'not_agency',
        is_agncy: false,
        has_paying_client: false,
        paying_clients_count: 0,
        requires_plan_selection: false,
        message: 'This account is not an agency.',
      });
    }

    // Count all clients
    const { count: totalClientsCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('managing_agncy_id', accountId)
      .is('deleted_at', null);

    // Count paying clients
    const { count: payingClientsCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('managing_agncy_id', accountId)
      .eq('subscription_status', 'active')
      .is('deleted_at', null);

    const hasPayingClient = (payingClientsCount || 0) > 0;

    // Calculate trial status
    const now = new Date();
    const trialEnd = account.agncy_trial_end ? new Date(account.agncy_trial_end) : null;
    const trialStart = account.agncy_trial_start ? new Date(account.agncy_trial_start) : null;

    let status: AgencyTrialStatus;
    let daysRemaining: number | undefined;
    let requiresPlanSelection = false;
    let message: string;

    // Has the agency already converted (has their own paid plan)?
    const hasOwnPlan = account.plan && account.plan !== 'no_plan' && account.subscription_status === 'active';
    const isFreeAccount = account.is_free_account === true;

    if (isFreeAccount) {
      // Free account - unlimited agency access, no trial limit, but can still manage client billing
      status = 'active';
      daysRemaining = undefined; // No countdown for free accounts
      message = hasPayingClient
        ? `Free agency account. You have ${payingClientsCount} paying client(s).`
        : 'Free agency account. Add clients to manage their billing.';
    } else if (hasOwnPlan || account.has_had_paid_plan) {
      // Agency has converted to paid
      status = 'converted';
      message = 'Agency trial completed. You have an active plan.';
    } else if (!trialEnd) {
      // No trial set (shouldn't happen for agency accounts)
      status = 'expired';
      requiresPlanSelection = !hasPayingClient;
      message = 'Agency trial not configured. Please contact support.';
    } else if (trialEnd > now) {
      // Trial is active
      status = 'active';
      daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      message = hasPayingClient
        ? `Agency trial active. ${daysRemaining} days remaining. You have ${payingClientsCount} paying client(s).`
        : `Agency trial active. ${daysRemaining} days remaining. Activate at least 1 paying client to keep agency features.`;
    } else {
      // Trial has expired
      status = 'expired';

      if (hasPayingClient) {
        // Has paying clients, so agency features continue (free workspace incentive)
        message = 'Agency trial ended but you have paying clients. Your agency workspace is free while you maintain at least 1 paying client.';
      } else {
        // No paying clients, must select a plan
        requiresPlanSelection = true;
        message = 'Agency trial expired. Select a plan to continue using agency features.';
      }
    }

    return NextResponse.json({
      status,
      is_agncy: true,
      is_free_account: isFreeAccount,
      trial_start: account.agncy_trial_start || undefined,
      trial_end: account.agncy_trial_end || undefined,
      days_remaining: daysRemaining,
      has_paying_client: hasPayingClient,
      paying_clients_count: payingClientsCount || 0,
      total_clients_count: totalClientsCount || 0,
      requires_plan_selection: requiresPlanSelection,
      message,
    });
  } catch (error) {
    console.error('Agency trial status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
