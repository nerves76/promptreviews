import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createStripeClient, PRICE_IDS, SUPABASE_CONFIG } from "@/lib/billing/config";


export async function POST(req: NextRequest) {
  const stripe = createStripeClient();
  try {
    const body = await req.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabase = createClient(
      SUPABASE_CONFIG.URL,
      SUPABASE_CONFIG.SERVICE_ROLE_KEY,
    );
    
    // Get account with Stripe info
    const { data: account, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (error || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!account.stripe_subscription_id) {
      return NextResponse.json({ 
        message: "No subscription to sync",
        currentPlan: account.plan,
        currentBilling: account.billing_period 
      });
    }

    // Get subscription from Stripe
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
    } catch (err) {
      console.error("Failed to retrieve subscription:", err);
      return NextResponse.json({ error: "Failed to retrieve subscription from Stripe" }, { status: 400 });
    }

    if (!subscription.items?.data?.[0]) {
      return NextResponse.json({ error: "Invalid subscription structure" }, { status: 400 });
    }

    const currentStripePrice = subscription.items.data[0].price.id;
    
    // Determine actual plan and billing from Stripe price
    let actualPlan = null;
    let actualBilling = null;
    
    for (const [planKey, prices] of Object.entries(PRICE_IDS)) {
      if (currentStripePrice === prices.annual) {
        actualPlan = planKey;
        actualBilling = 'annual';
        break;
      } else if (currentStripePrice === prices.monthly) {
        actualPlan = planKey;
        actualBilling = 'monthly';
        break;
      }
    }

    if (!actualPlan || !actualBilling) {
      return NextResponse.json({ 
        error: "Could not determine plan from Stripe price",
        stripePriceId: currentStripePrice 
      }, { status: 400 });
    }

    // Check if update is needed
    const needsUpdate = account.plan !== actualPlan || account.billing_period !== actualBilling;
    
    if (needsUpdate) {
      // Update database to match Stripe
      const { error: updateError } = await supabase
        .from("accounts")
        .update({
          plan: actualPlan,
          billing_period: actualBilling,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);
        
      if (updateError) {
        console.error("Failed to update account:", updateError);
        return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: "Subscription synced with Stripe",
        previousPlan: account.plan,
        previousBilling: account.billing_period,
        currentPlan: actualPlan,
        currentBilling: actualBilling,
        stripePriceId: currentStripePrice
      });
    }

    return NextResponse.json({
      success: true,
      message: "Subscription already in sync",
      currentPlan: actualPlan,
      currentBilling: actualBilling,
      stripePriceId: currentStripePrice
    });

  } catch (error: any) {
    console.error("Error syncing subscription:", error);
    return NextResponse.json(
      { error: "Server error", message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}