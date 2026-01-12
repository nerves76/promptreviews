/**
 * Agency Billing Take-Over API Route
 *
 * POST - Agency takes over billing responsibility for a client account
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

interface TakeOverRequest {
  client_account_id: string;
  plan?: string; // Optional: specify plan for the client
  billing_period?: 'monthly' | 'annual';
}

/**
 * POST - Agency takes over billing for a client
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const body: TakeOverRequest = await request.json();
    const { client_account_id, plan = 'grower', billing_period = 'monthly' } = body;

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
      .select('id, is_agncy, business_name, stripe_customer_id')
      .eq('id', agencyAccountId)
      .single();

    if (agencyError || !agencyAccount?.is_agncy) {
      return NextResponse.json(
        { error: 'This account is not an agency' },
        { status: 403 }
      );
    }

    // Verify user has billing_manager role for agency
    const { data: agencyUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', agencyAccountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !agencyUser || agencyUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only agency owners can take over client billing' },
        { status: 403 }
      );
    }

    // Verify client relationship exists and agency has billing_manager access
    const { data: clientAccount, error: clientError } = await supabase
      .from('accounts')
      .select(`
        id,
        business_name,
        managing_agncy_id,
        agncy_billing_owner,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_status,
        plan
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

    if (clientAccount.agncy_billing_owner === 'agency') {
      return NextResponse.json(
        { error: 'Agency is already the billing owner for this client' },
        { status: 400 }
      );
    }

    // Check if agency has a Stripe customer ID
    let agencyStripeCustomerId = agencyAccount.stripe_customer_id;

    if (!agencyStripeCustomerId) {
      // Create Stripe customer for agency
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: agencyAccount.business_name || undefined,
        metadata: {
          account_id: agencyAccountId,
          account_type: 'agency',
        },
      });
      agencyStripeCustomerId = customer.id;

      // Save to agency account
      await supabaseAdmin
        .from('accounts')
        .update({ stripe_customer_id: customer.id })
        .eq('id', agencyAccountId);
    }

    // If client has an existing subscription, we need to handle it
    // For MVP: Cancel client's subscription and create new one under agency
    if (clientAccount.stripe_subscription_id) {
      try {
        // Cancel client's subscription at period end
        await stripe.subscriptions.update(clientAccount.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch (stripeError) {
        console.error('Error canceling client subscription:', stripeError);
        // Continue anyway - client might not have active subscription
      }
    }

    // Get the price ID for the plan
    const priceId = getPriceId(plan, billing_period);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan or billing period' },
        { status: 400 }
      );
    }

    // Create new subscription under agency's customer
    const subscription = await stripe.subscriptions.create({
      customer: agencyStripeCustomerId,
      items: [{ price: priceId }],
      metadata: {
        account_id: client_account_id,
        agency_account_id: agencyAccountId,
        billing_owner: 'agency',
      },
    });

    // Update client account
    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({
        agncy_billing_owner: 'agency',
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        plan,
        billing_period,
      })
      .eq('id', client_account_id);

    if (updateError) {
      console.error('Error updating client account:', updateError);
      // Try to cancel the subscription we just created
      await stripe.subscriptions.cancel(subscription.id);
      return NextResponse.json(
        { error: 'Failed to update client account' },
        { status: 500 }
      );
    }

    // Log the event
    await supabaseAdmin.from('account_events').insert({
      account_id: client_account_id,
      event_type: 'agency_billing_takeover',
      event_data: {
        agency_account_id: agencyAccountId,
        agency_name: agencyAccount.business_name,
        initiated_by: user.id,
        plan,
        billing_period,
        subscription_id: subscription.id,
      },
    });

    // Also log in billing audit
    await supabaseAdmin.from('billing_audit_log').insert({
      account_id: client_account_id,
      user_id: user.id,
      event_type: 'agency_billing_takeover',
      event_source: 'api',
      description: `Agency ${agencyAccount.business_name} took over billing`,
      metadata: {
        agency_account_id: agencyAccountId,
        plan,
        billing_period,
      },
      stripe_subscription_id: subscription.id,
      new_plan: plan,
      new_billing_period: billing_period,
    });

    return NextResponse.json({
      message: 'Agency billing take-over successful',
      client_account_id,
      billing_owner: 'agency',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan,
        billing_period,
      },
    });
  } catch (error) {
    console.error('Agency billing take-over error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get Stripe price ID for plan and billing period
 */
function getPriceId(plan: string, billingPeriod: string): string | null {
  const priceMap: Record<string, Record<string, string | undefined>> = {
    grower: {
      monthly: process.env.STRIPE_PRICE_ID_GROWER,
      annual: process.env.STRIPE_PRICE_ID_GROWER_ANNUAL,
    },
    builder: {
      monthly: process.env.STRIPE_PRICE_ID_BUILDER,
      annual: process.env.STRIPE_PRICE_ID_BUILDER_ANNUAL,
    },
    maven: {
      monthly: process.env.STRIPE_PRICE_ID_MAVEN,
      annual: process.env.STRIPE_PRICE_ID_MAVEN_ANNUAL,
    },
  };

  return priceMap[plan]?.[billingPeriod] || null;
}
