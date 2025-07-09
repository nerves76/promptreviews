import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
const stripe = new Stripe(stripeSecretKey);

const builderPriceId = process.env.STRIPE_PRICE_ID_BUILDER!;
const mavenPriceId = process.env.STRIPE_PRICE_ID_MAVEN!;
const growerPriceId = process.env.STRIPE_PRICE_ID_GROWER!;
if (!builderPriceId || !mavenPriceId || !growerPriceId) {
  throw new Error("Stripe price IDs are not set");
}

const PRICE_IDS: Record<string, string> = {
  grower: growerPriceId,
  builder: builderPriceId,
  maven: mavenPriceId,
};

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, currentPlan } = await req.json();
    
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
      .select("stripe_customer_id, plan, email")
      .eq("id", userId)
      .single();
      
    if (error || !account) {
      console.error("Error fetching account for upgrade:", error);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
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

    // Update the subscription to the new plan
    const updatedSubscription = await stripe.subscriptions.update(
      activeSubscription.id,
      {
        items: [
          {
            id: subscriptionItem.id,
            price: PRICE_IDS[plan],
          },
        ],
        // Prorate the difference
        proration_behavior: "always_invoice",
      }
    );

    // Update the plan in our database
    await supabase
      .from("accounts")
      .update({ plan: plan })
      .eq("id", userId);

    return NextResponse.json({ 
      success: true, 
      subscriptionId: updatedSubscription.id,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1&change=upgrade&plan=${plan}`
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