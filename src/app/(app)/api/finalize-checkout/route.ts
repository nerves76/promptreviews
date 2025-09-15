import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createStripeClient, SUPABASE_CONFIG, PRICE_IDS } from "@/lib/billing/config";

const stripe = createStripeClient();

// Finalize a Stripe Checkout by session_id and update the account immediately.
// This is especially helpful in local dev where webhooks may not be running.
export async function POST(req: NextRequest) {
  try {
    const { session_id, userId } = await req.json();

    if (!session_id || !userId) {
      return NextResponse.json({ error: "session_id and userId are required" }, { status: 400 });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session || !session.subscription) {
      return NextResponse.json({ error: "Invalid or incomplete checkout session" }, { status: 400 });
    }

    // Retrieve subscription to determine price/plan/billing
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const item = subscription.items?.data?.[0];
    const priceId = item?.price?.id || null;
    if (!priceId) {
      return NextResponse.json({ error: "Missing price on subscription" }, { status: 400 });
    }

    // Determine actual plan and billing from configured price IDs
    let actualPlan: string | null = null;
    let actualBilling: 'monthly' | 'annual' | null = null;
    for (const [planKey, prices] of Object.entries(PRICE_IDS)) {
      if (priceId === prices.annual) {
        actualPlan = planKey;
        actualBilling = 'annual';
        break;
      }
      if (priceId === prices.monthly) {
        actualPlan = planKey;
        actualBilling = 'monthly';
        break;
      }
    }

    if (!actualPlan || !actualBilling) {
      return NextResponse.json({ error: "Could not map Stripe price to plan" }, { status: 400 });
    }

    const customerId = (subscription.customer as string) || (session.customer as string) || null;
    if (!customerId) {
      return NextResponse.json({ error: "Missing Stripe customer id" }, { status: 400 });
    }

    // Update account immediately
    const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_ROLE_KEY);
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        plan: actualPlan,
        billing_period: actualBilling,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: subscription.status || 'active',
        has_had_paid_plan: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ finalize-checkout update error:', updateError);
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      plan: actualPlan,
      billing_period: actualBilling,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status || 'active',
    });
  } catch (error: any) {
    console.error('❌ finalize-checkout error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with { session_id, userId }' }, { status: 405 });
}

