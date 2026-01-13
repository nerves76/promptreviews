/**
 * Agency Convert API Route
 *
 * Converts an existing account to an agency account.
 * Requires agency metadata to be provided.
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';
import { AgencyMetadata } from '@/auth/types/auth.types';

interface ConvertToAgencyRequest {
  metadata: AgencyMetadata;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const body: ConvertToAgencyRequest = await request.json();

    // Validate required fields
    if (!body.metadata?.agncy_type || !body.metadata?.agncy_employee_count ||
        !body.metadata?.agncy_expected_clients || !body.metadata?.agncy_multi_location_pct) {
      return NextResponse.json(
        { error: 'All agency metadata fields are required' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the selected account
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify user is owner of this account
    const { data: accountUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !accountUser) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can convert to agency' },
        { status: 403 }
      );
    }

    // Get current account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, is_agncy, agncy_trial_end')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if already an agency
    if (account.is_agncy) {
      return NextResponse.json(
        {
          error: 'Account is already an agency',
          agncy_trial_end: account.agncy_trial_end,
        },
        { status: 400 }
      );
    }

    // Calculate 30-day agency trial end
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);

    // Update the account to be an agency
    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({
        is_agncy: true,
        agncy_trial_start: now.toISOString(),
        agncy_trial_end: trialEnd.toISOString(),
        agncy_type: body.metadata.agncy_type,
        agncy_employee_count: body.metadata.agncy_employee_count,
        agncy_expected_clients: body.metadata.agncy_expected_clients,
        agncy_multi_location_pct: body.metadata.agncy_multi_location_pct,
        // Ensure agency accounts can access dashboard without business creation
        business_creation_complete: true,
      })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) {
      console.error('Error converting to agency:', updateError);
      return NextResponse.json(
        { error: 'Failed to convert account to agency', details: updateError.message },
        { status: 500 }
      );
    }

    // Log the event
    await supabase.from('account_events').insert({
      account_id: accountId,
      event_type: 'agency_converted',
      event_data: {
        user_id: user.id,
        agncy_type: body.metadata.agncy_type,
        trial_end: trialEnd.toISOString(),
      },
    });

    return NextResponse.json({
      message: 'Account converted to agency successfully',
      account: {
        id: updatedAccount.id,
        business_name: updatedAccount.business_name,
        is_agncy: updatedAccount.is_agncy,
        agncy_trial_end: updatedAccount.agncy_trial_end,
        agncy_type: updatedAccount.agncy_type,
      },
      trial: {
        starts: now.toISOString(),
        ends: trialEnd.toISOString(),
        days_remaining: 30,
      },
    });
  } catch (error) {
    console.error('Agency convert API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check if current account can be converted to agency
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the selected account
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
        business_name,
        is_agncy,
        agncy_trial_start,
        agncy_trial_end,
        agncy_type,
        agncy_employee_count,
        agncy_expected_clients,
        agncy_multi_location_pct
      `)
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if user is owner
    const { data: accountUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    const isOwner = accountUser?.role === 'owner';

    return NextResponse.json({
      can_convert: !account.is_agncy && isOwner,
      is_agncy: account.is_agncy,
      is_owner: isOwner,
      account: account.is_agncy ? {
        agncy_type: account.agncy_type,
        agncy_employee_count: account.agncy_employee_count,
        agncy_expected_clients: account.agncy_expected_clients,
        agncy_multi_location_pct: account.agncy_multi_location_pct,
        agncy_trial_start: account.agncy_trial_start,
        agncy_trial_end: account.agncy_trial_end,
      } : null,
    });
  } catch (error) {
    console.error('Agency convert check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
