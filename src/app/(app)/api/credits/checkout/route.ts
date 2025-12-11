/**
 * POST /api/credits/checkout
 *
 * Create a Stripe Checkout session for purchasing credit packs.
 *
 * Body:
 * - packId: string - The credit pack ID to purchase
 * - recurring: boolean (optional) - If true, set up monthly auto-topup
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getCreditPacks } from '@/lib/credits';
import { createClient } from '@supabase/supabase-js';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(stripeSecretKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Parse body
    const body = await request.json();
    const { packId, recurring = false } = body;

    if (!packId) {
      return NextResponse.json(
        { error: 'packId is required' },
        { status: 400 }
      );
    }

    // Get available packs
    const packs = await getCreditPacks(serviceSupabase);
    const pack = packs.find((p) => p.id === packId);

    if (!pack) {
      return NextResponse.json(
        { error: 'Invalid pack ID' },
        { status: 400 }
      );
    }

    // Determine which Stripe price ID to use
    const priceId = recurring ? pack.stripePriceIdRecurring : pack.stripePriceId;

    if (!priceId) {
      return NextResponse.json(
        {
          error: 'Stripe price not configured for this pack',
          message: 'Please contact support to complete your purchase.',
        },
        { status: 500 }
      );
    }

    // Get account info for customer lookup/creation
    const { data: account } = await serviceSupabase
      .from('accounts')
      .select('stripe_customer_id, email, business_name')
      .eq('id', accountId)
      .single();

    const stripe = getStripeClient();

    // Get or create Stripe customer
    let customerId = account?.stripe_customer_id;

    if (!customerId && account?.email) {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: account.email,
        name: account.business_name || undefined,
        metadata: {
          accountId,
        },
      });
      customerId = customer.id;

      // Save customer ID to account
      await serviceSupabase
        .from('accounts')
        .update({ stripe_customer_id: customerId })
        .eq('id', accountId);
    }

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: recurring ? 'subscription' : 'payment',
      customer: customerId || undefined,
      customer_email: customerId ? undefined : account?.email || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        accountId,
        credits: String(pack.credits),
        pack_type: recurring ? 'auto_topup' : 'one_time',
        packId: pack.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?success=1&credits=${pack.credits}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?canceled=1`,
    };

    // For payment mode, set payment_intent_data to copy metadata to charge
    if (!recurring) {
      sessionConfig.payment_intent_data = {
        metadata: {
          accountId,
          credits: String(pack.credits),
          pack_type: 'one_time',
        },
      };
    } else {
      // For subscription mode, copy metadata to the subscription for renewal processing
      sessionConfig.subscription_data = {
        metadata: {
          accountId,
          credits: String(pack.credits),
          pack_type: 'auto_topup',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`💳 [Credits] Created checkout session ${session.id} for account ${accountId}`);
    console.log(`   Pack: ${pack.name} (${pack.credits} credits)`);
    console.log(`   Recurring: ${recurring}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ [Credits] Checkout POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
