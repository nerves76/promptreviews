/**
 * Agency Client Detail API Route
 *
 * GET - Get details about a specific client
 * DELETE - Disconnect agency from client
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/**
 * GET - Get details about a specific client managed by this agency
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const agencyAccountId = await getRequestAccountId(request, user.id, supabase);

    if (!agencyAccountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify this is an agency account
    const { data: agencyAccount, error: agencyError } = await supabase
      .from('accounts')
      .select('id, is_agncy')
      .eq('id', agencyAccountId)
      .single();

    if (agencyError || !agencyAccount?.is_agncy) {
      return NextResponse.json(
        { error: 'This account is not an agency' },
        { status: 403 }
      );
    }

    // Get client account details
    const { data: clientAccount, error: clientError } = await supabase
      .from('accounts')
      .select(`
        id,
        business_name,
        first_name,
        last_name,
        email,
        plan,
        subscription_status,
        trial_start,
        trial_end,
        agncy_billing_owner,
        managing_agncy_id,
        created_at
      `)
      .eq('id', clientId)
      .is('deleted_at', null)
      .single();

    if (clientError || !clientAccount) {
      return NextResponse.json(
        { error: 'Client account not found' },
        { status: 404 }
      );
    }

    // Verify this client is managed by the agency
    if (clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json(
        { error: 'This client is not managed by your agency' },
        { status: 403 }
      );
    }

    // Get agency access details
    const { data: accessRecord, error: accessError } = await supabase
      .from('agncy_client_access')
      .select('*')
      .eq('agency_account_id', agencyAccountId)
      .eq('client_account_id', clientId)
      .eq('user_id', user.id)
      .maybeSingle();

    // Get basic metrics for the client
    // Reviews count
    const { count: reviewsCount } = await supabase
      .from('widget_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', clientId);

    // Review submissions count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentSubmissions } = await supabase
      .from('review_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', clientId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Calculate status
    let status: string;
    if (clientAccount.subscription_status === 'active') {
      status = 'active';
    } else if (clientAccount.subscription_status === 'trialing' || clientAccount.trial_end) {
      const trialEnd = clientAccount.trial_end ? new Date(clientAccount.trial_end) : null;
      if (trialEnd && trialEnd > new Date()) {
        status = 'trial';
      } else {
        status = 'needs_billing';
      }
    } else if (clientAccount.subscription_status === 'canceled') {
      status = 'canceled';
    } else if (!clientAccount.plan || clientAccount.plan === 'no_plan') {
      status = 'needs_billing';
    } else {
      status = 'active';
    }

    return NextResponse.json({
      client: {
        id: clientAccount.id,
        business_name: clientAccount.business_name,
        contact_name: `${clientAccount.first_name || ''} ${clientAccount.last_name || ''}`.trim() || null,
        email: clientAccount.email,
        plan: clientAccount.plan,
        status,
        billing_owner: clientAccount.agncy_billing_owner,
        created_at: clientAccount.created_at,
      },
      access: accessRecord ? {
        role: accessRecord.role,
        status: accessRecord.status,
        connected_at: accessRecord.accepted_at,
      } : null,
      metrics: {
        total_reviews: reviewsCount || 0,
        recent_submissions: recentSubmissions || 0,
      },
    });
  } catch (error) {
    console.error('Agency client GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Disconnect agency from client
 * If agency was billing owner, schedules downgrade
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const agencyAccountId = await getRequestAccountId(request, user.id, supabase);

    if (!agencyAccountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify user is owner of agency
    const { data: agencyUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', agencyAccountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !agencyUser || agencyUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only agency owners can disconnect from clients' },
        { status: 403 }
      );
    }

    // Get client account and verify relationship
    const { data: clientAccount, error: clientError } = await supabase
      .from('accounts')
      .select('id, business_name, managing_agncy_id, agncy_billing_owner')
      .eq('id', clientId)
      .single();

    if (clientError || !clientAccount) {
      return NextResponse.json(
        { error: 'Client account not found' },
        { status: 404 }
      );
    }

    if (clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json(
        { error: 'This client is not managed by your agency' },
        { status: 403 }
      );
    }

    const wasAgencyBilling = clientAccount.agncy_billing_owner === 'agency';

    // Mark all agency access records as removed
    const { error: accessUpdateError } = await supabaseAdmin
      .from('agncy_client_access')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        removed_by: user.id,
      })
      .eq('agency_account_id', agencyAccountId)
      .eq('client_account_id', clientId);

    if (accessUpdateError) {
      console.error('Error updating access records:', accessUpdateError);
    }

    // Remove agency users from client's account_users
    const { data: agencyUsers, error: agencyUsersError } = await supabaseAdmin
      .from('agncy_client_access')
      .select('user_id')
      .eq('agency_account_id', agencyAccountId)
      .eq('client_account_id', clientId);

    if (agencyUsers) {
      for (const agencyUser of agencyUsers) {
        await supabaseAdmin
          .from('account_users')
          .delete()
          .eq('account_id', clientId)
          .eq('user_id', agencyUser.user_id)
          .in('role', ['agency_manager', 'agency_billing_manager']);
      }
    }

    // Clear agency relationship on client account
    const { error: clearRelationError } = await supabaseAdmin
      .from('accounts')
      .update({
        managing_agncy_id: null,
        agncy_billing_owner: 'client',
      })
      .eq('id', clientId);

    if (clearRelationError) {
      console.error('Error clearing agency relationship:', clearRelationError);
      return NextResponse.json(
        { error: 'Failed to disconnect from client' },
        { status: 500 }
      );
    }

    // Log the event
    await supabaseAdmin.from('account_events').insert({
      account_id: clientId,
      event_type: 'agency_disconnected',
      event_data: {
        agency_account_id: agencyAccountId,
        disconnected_by: user.id,
        was_agency_billing: wasAgencyBilling,
        initiated_by: 'agency',
      },
    });

    // If agency was billing, schedule downgrade
    let billingNote = null;
    if (wasAgencyBilling) {
      // TODO: Implement actual Stripe subscription cancellation
      // For now, just mark for downgrade
      await supabaseAdmin
        .from('accounts')
        .update({
          subscription_status: 'canceling',
        })
        .eq('id', clientId);

      billingNote = 'Client will be downgraded to free tier when current billing period ends.';
    }

    return NextResponse.json({
      message: 'Disconnected from client successfully',
      client_id: clientId,
      was_agency_billing: wasAgencyBilling,
      billing_note: billingNote,
    });
  } catch (error) {
    console.error('Agency client DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
