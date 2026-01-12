/**
 * Agency Billing Release API Route
 *
 * POST - Agency releases billing responsibility back to client
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

interface ReleaseRequest {
  client_account_id: string;
  immediate?: boolean; // If true, cancel immediately. Otherwise, at period end.
}

/**
 * POST - Agency releases billing for a client back to them
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const body: ReleaseRequest = await request.json();
    const { client_account_id, immediate = false } = body;

    if (!client_account_id) {
      return NextResponse.json(
        { error: 'client_account_id is required' },
        { status: 400 }
      );
    }

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
      .select('id, is_agncy, business_name')
      .eq('id', agencyAccountId)
      .single();

    if (agencyError || !agencyAccount?.is_agncy) {
      return NextResponse.json(
        { error: 'This account is not an agency' },
        { status: 403 }
      );
    }

    // Verify user is owner
    const { data: agencyUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', agencyAccountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !agencyUser || agencyUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only agency owners can release client billing' },
        { status: 403 }
      );
    }

    // Get client account
    const { data: clientAccount, error: clientError } = await supabase
      .from('accounts')
      .select(`
        id,
        business_name,
        managing_agncy_id,
        agncy_billing_owner,
        stripe_subscription_id,
        subscription_status,
        plan,
        billing_period
      `)
      .eq('id', client_account_id)
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

    if (clientAccount.agncy_billing_owner !== 'agency') {
      return NextResponse.json(
        { error: 'Agency is not the billing owner for this client' },
        { status: 400 }
      );
    }

    // Handle Stripe subscription
    let subscriptionEndDate: string | null = null;

    if (clientAccount.stripe_subscription_id) {
      try {
        if (immediate) {
          // Cancel immediately
          await stripe.subscriptions.cancel(clientAccount.stripe_subscription_id);
        } else {
          // Cancel at period end
          const subscription = await stripe.subscriptions.update(
            clientAccount.stripe_subscription_id,
            { cancel_at_period_end: true }
          );
          subscriptionEndDate = (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000).toISOString()
            : null;
        }
      } catch (stripeError) {
        console.error('Error handling subscription:', stripeError);
        // Continue anyway - update the database
      }
    }

    // Update client account
    const updateData: Record<string, any> = {
      agncy_billing_owner: 'client',
    };

    if (immediate) {
      // Immediate release - clear subscription data and downgrade
      updateData.stripe_subscription_id = null;
      updateData.subscription_status = 'canceled';
      updateData.plan = 'no_plan';
    } else {
      // At period end - mark as canceling
      updateData.subscription_status = 'canceling';
    }

    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update(updateData)
      .eq('id', client_account_id);

    if (updateError) {
      console.error('Error updating client account:', updateError);
      return NextResponse.json(
        { error: 'Failed to update client account' },
        { status: 500 }
      );
    }

    // Log the event
    await supabaseAdmin.from('account_events').insert({
      account_id: client_account_id,
      event_type: 'agency_billing_released',
      event_data: {
        agency_account_id: agencyAccountId,
        agency_name: agencyAccount.business_name,
        released_by: user.id,
        immediate,
        subscription_end_date: subscriptionEndDate,
        previous_plan: clientAccount.plan,
      },
    });

    // Also log in billing audit
    await supabaseAdmin.from('billing_audit_log').insert({
      account_id: client_account_id,
      user_id: user.id,
      event_type: 'agency_billing_released',
      event_source: 'api',
      description: `Agency ${agencyAccount.business_name} released billing`,
      metadata: {
        agency_account_id: agencyAccountId,
        immediate,
        subscription_end_date: subscriptionEndDate,
      },
      stripe_subscription_id: clientAccount.stripe_subscription_id,
      old_plan: clientAccount.plan,
      new_plan: immediate ? 'no_plan' : clientAccount.plan,
    });

    return NextResponse.json({
      message: immediate
        ? 'Agency billing released immediately'
        : 'Agency billing will be released at end of current period',
      client_account_id,
      billing_owner: 'client',
      immediate,
      subscription_end_date: subscriptionEndDate,
      next_steps: immediate
        ? 'Client has been downgraded to free tier. They need to add a payment method to restore their plan.'
        : 'Client will be downgraded to free tier when the current period ends unless they add a payment method.',
    });
  } catch (error) {
    console.error('Agency billing release error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check billing status for a client
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const clientAccountId = searchParams.get('client_account_id');

    if (!clientAccountId) {
      return NextResponse.json(
        { error: 'client_account_id query parameter is required' },
        { status: 400 }
      );
    }

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

    // Get client account
    const { data: clientAccount, error: clientError } = await supabase
      .from('accounts')
      .select(`
        id,
        business_name,
        managing_agncy_id,
        agncy_billing_owner,
        stripe_subscription_id,
        subscription_status,
        plan,
        billing_period
      `)
      .eq('id', clientAccountId)
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

    // Get subscription details from Stripe if available
    let subscriptionDetails = null;
    if (clientAccount.stripe_subscription_id && clientAccount.agncy_billing_owner === 'agency') {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          clientAccount.stripe_subscription_id
        );
        subscriptionDetails = {
          status: subscription.status,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        };
      } catch (stripeError) {
        console.error('Error fetching subscription:', stripeError);
      }
    }

    return NextResponse.json({
      client_account_id: clientAccountId,
      business_name: clientAccount.business_name,
      billing_owner: clientAccount.agncy_billing_owner,
      plan: clientAccount.plan,
      billing_period: clientAccount.billing_period,
      subscription_status: clientAccount.subscription_status,
      stripe_subscription: subscriptionDetails,
      can_take_over: clientAccount.agncy_billing_owner === 'client',
      can_release: clientAccount.agncy_billing_owner === 'agency',
    });
  } catch (error) {
    console.error('Agency billing status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
