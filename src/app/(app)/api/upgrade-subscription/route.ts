import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  createStripeClient, 
  PRICE_IDS, 
  SUPABASE_CONFIG,
  getPlanChangeType,
  isValidPlan,
  getPriceId,
  BILLING_URLS
} from "@/lib/billing/config";
import { logPlanChange } from "@/lib/billing/audit";


export async function POST(req: NextRequest) {
  const stripe = createStripeClient();
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(req);
  if (csrfError) return csrfError;

  try {
    const {
      plan,
      userId,
      currentPlan,
      billingPeriod = 'monthly',
      successPath,
    }: {
      plan: string;
      userId: string;
      currentPlan: string;
      billingPeriod?: 'monthly' | 'annual';
      successPath?: string;
    } = await req.json();
    
    if (!plan || !isValidPlan(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch current account info including Stripe customer ID
    const supabase = createClient(
      SUPABASE_CONFIG.URL,
      SUPABASE_CONFIG.SERVICE_ROLE_KEY,
    );
    
    const { data: account, error } = await supabase
      .from("accounts")
      .select("stripe_customer_id, plan, email, is_free_account, free_plan_level, billing_period")
      .eq("id", userId)
      .single();
      
    if (error || !account) {
      console.error("Error fetching account for upgrade:", error);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if this is a free account
    if (account.is_free_account) {
      return NextResponse.json({ 
        error: "FREE_ACCOUNT", 
        message: "Free accounts cannot upgrade subscriptions. Your account has been configured with free access.",
        free_plan_level: account.free_plan_level 
      }, { status: 400 });
    }

    // Check if user is on free trial (only users without Stripe customer ID are on free trial)
    // Users on grower plan with a stripe_customer_id are paying customers, not trial users
    const isFreeTrialUser = !account.stripe_customer_id;
    
    if (isFreeTrialUser) {
      // For free trial users (no stripe customer), redirect them to create a checkout session
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

    // Get the correct price ID
    const targetPriceId = getPriceId(plan, billingPeriod) || '';
    
    
    // Prepare update configuration
    const updateConfig = {
      items: [
        {
          id: subscriptionItem.id,
          price: targetPriceId,
        },
      ],
      // Prorate the difference
      proration_behavior: "always_invoice" as const,
    };
    
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

    // Log the plan change
    await logPlanChange({
      accountId: userId,
      oldPlan: currentPlan || account.plan,
      newPlan: plan,
      oldBilling: account.billing_period,
      newBilling: billingPeriod,
      source: 'api',
      stripeSubscriptionId: updatedSubscription.id,
      metadata: {
        stripe_price_id: targetPriceId,
        proration_behavior: 'always_invoice',
      }
    });

    // Determine if this was an upgrade or downgrade
    const changeType = currentPlan ? getPlanChangeType(currentPlan, plan) : 'new';
    const finalChangeType = changeType === 'same' ? 'billing_period' : changeType;
    
    const resolvePath = (candidate?: string | null, fallback = '/dashboard') => {
      if (!candidate || typeof candidate !== 'string') return fallback;
      const trimmed = candidate.trim();
      if (!trimmed.startsWith('/')) return fallback;
      if (trimmed.startsWith('//')) return fallback;
      return trimmed;
    };

    const appUrl = BILLING_URLS.APP_URL;
    const basePath = resolvePath(successPath, '/dashboard');
    const [pathOnly, existingQuery] = basePath.split('?');
    const params = new URLSearchParams(existingQuery || '');
    params.set('success', '1');
    params.set('change', finalChangeType);
    params.set('plan', plan);
    params.set('billing', billingPeriod);
    const redirectUrl = `${appUrl}${pathOnly}?${params.toString()}`;
    
    
    return NextResponse.json({ 
      success: true, 
      subscriptionId: updatedSubscription.id,
      redirectUrl
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
