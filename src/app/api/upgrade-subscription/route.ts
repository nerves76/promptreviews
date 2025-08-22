/**
 * ⚠️ TEMPORARY LIVE MODE ADMIN DISCOUNT ENABLED ⚠️
 * Remove || isLiveMode from line 128 before production
 * This currently applies 99% discount for admin accounts in both test and live modes
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-06-30.basil" });

const builderPriceId = process.env.STRIPE_PRICE_ID_BUILDER!;
const mavenPriceId = process.env.STRIPE_PRICE_ID_MAVEN!;
const growerPriceId = process.env.STRIPE_PRICE_ID_GROWER!;
const builderAnnualPriceId = process.env.STRIPE_PRICE_ID_BUILDER_ANNUAL;
const mavenAnnualPriceId = process.env.STRIPE_PRICE_ID_MAVEN_ANNUAL;
const growerAnnualPriceId = process.env.STRIPE_PRICE_ID_GROWER_ANNUAL;

if (!builderPriceId || !mavenPriceId || !growerPriceId) {
  throw new Error("Stripe price IDs are not set");
}

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  grower: {
    monthly: growerPriceId,
    annual: growerAnnualPriceId || growerPriceId,
  },
  builder: {
    monthly: builderPriceId,
    annual: builderAnnualPriceId || builderPriceId,
  },
  maven: {
    monthly: mavenPriceId,
    annual: mavenAnnualPriceId || mavenPriceId,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, currentPlan, billingPeriod = 'monthly' }: { plan: string; userId: string; currentPlan: string; billingPeriod?: 'monthly' | 'annual' } = await req.json();
    
    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch current account info including Stripe customer ID
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    
    const { data: account, error } = await supabase
      .from("accounts")
      .select("stripe_customer_id, plan, email, is_free_account, free_plan_level")
      .eq("id", userId)
      .single();
      
    if (error || !account) {
      console.error("Error fetching account for upgrade:", error);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if this is a free account
    if (account.is_free_account) {
      console.log("🆓 Free account detected, blocking subscription upgrade");
      return NextResponse.json({ 
        error: "FREE_ACCOUNT", 
        message: "Free accounts cannot upgrade subscriptions. Your account has been configured with free access.",
        free_plan_level: account.free_plan_level 
      }, { status: 400 });
    }

    // Check if user is on free trial or doesn't have a Stripe customer ID
    const isFreeTrialUser = !account.stripe_customer_id || account.plan === "grower";
    
    if (isFreeTrialUser) {
      // For free trial users, redirect them to create a checkout session
      // This should be handled by the frontend, but as a fallback, we'll return an error
      // that tells the frontend to use the checkout session API instead
      return NextResponse.json({ 
        error: "FREE_TRIAL_USER", 
        message: "Free trial users should use checkout session API",
        redirectToCheckout: true 
      }, { status: 400 });
    }

    // Find the active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: account.stripe_customer_id,
      status: "active",
      limit: 10,
    });

    const activeSubscription = subscriptions.data[0];
    if (!activeSubscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Get the current subscription item
    const subscriptionItem = activeSubscription.items.data[0];
    if (!subscriptionItem) {
      return NextResponse.json({ error: "No subscription item found" }, { status: 404 });
    }

    // Check if admin account should get testing discount
    const { isTestingAccount } = await import('@/lib/testing-mode');
    const isAdmin = await isTestingAccount(account.email);
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    
    // Prepare update configuration
    let updateConfig: any = {
      items: [
        {
          id: subscriptionItem.id,
          price: PRICE_IDS[plan]?.[billingPeriod] || PRICE_IDS[plan]?.monthly || '',
        },
      ],
      // Prorate the difference
      proration_behavior: "always_invoice",
    };
    
    // TEMPORARY: Apply testing discount for admins in both test AND live modes
    // WARNING: Remove || isLiveMode before production
    if (isAdmin && (isTestMode || isLiveMode)) {
      console.log('🧪 Admin testing mode: Applying 99% discount to subscription update');
      console.log(`📍 Mode: ${isTestMode ? 'TEST' : 'LIVE'} - Admin discount enabled for upgrade/downgrade`);
      updateConfig.discounts = [{
        coupon: 'TESTDEV_99'
      }];
    }
    
    // Update the subscription to the new plan
    const updatedSubscription = await stripe.subscriptions.update(
      activeSubscription.id,
      updateConfig
    );

    // Update the plan and billing period in our database
    await supabase
      .from("accounts")
      .update({ 
        plan: plan,
        billing_period: billingPeriod 
      })
      .eq("id", userId);

    return NextResponse.json({ 
      success: true, 
      subscriptionId: updatedSubscription.id,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plan?success=1&change=upgrade&plan=${plan}&billing=${billingPeriod}`
    });
  } catch (error: any) {
    console.error("Stripe upgrade error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "GET not supported for this endpoint. Use POST." },
    { status: 405 },
  );
} 