import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createStripeClient, SUPABASE_CONFIG } from "@/lib/billing/config";


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
    
    // Get account
    const { data: account, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (error || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }


    // If no Stripe customer ID, try to find by email
    let customerId = account.stripe_customer_id;
    
    if (!customerId && account.email) {
      const customers = await stripe.customers.list({
        email: account.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }
    
    if (!customerId) {
      return NextResponse.json({ 
        error: "No Stripe customer found for this account",
        hint: "Complete checkout first" 
      }, { status: 404 });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });


    if (subscriptions.data.length === 0) {
      // Check for trialing subscriptions too
      const trialingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 10,
      });
      
      if (trialingSubs.data.length > 0) {
        subscriptions.data = trialingSubs.data;
      }
    }

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ 
        error: "No active subscriptions found",
        customerId 
      }, { status: 404 });
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    
    // Determine plan from price ID
    let plan = account.plan; // default to current
    let billingPeriod = 'monthly';
    
    // Map price IDs to plans
    const priceMap: { [key: string]: { plan: string, billing: 'monthly' | 'annual' } } = {
      'price_1RT6s7LqwlpgZPtwjv65Q3xa': { plan: 'builder', billing: 'monthly' },
      'price_1RT6sVLqwlpgZPtwEZLKBQo7': { plan: 'maven', billing: 'monthly' },
      // Add annual price IDs if you have them
    };
    
    if (priceMap[priceId]) {
      plan = priceMap[priceId].plan;
      billingPeriod = priceMap[priceId].billing;
    } else {
      // Try to determine from metadata or price nickname
      const priceNickname = subscription.items.data[0]?.price.nickname?.toLowerCase();
      if (priceNickname) {
        if (priceNickname.includes('maven')) plan = 'maven';
        else if (priceNickname.includes('builder')) plan = 'builder';
        else if (priceNickname.includes('grower')) plan = 'grower';
        
        if (priceNickname.includes('annual') || priceNickname.includes('yearly')) {
          billingPeriod = 'annual';
        }
      }
    }
    

    // Update the account
    const { data: updatedAccount, error: updateError } = await supabase
      .from("accounts")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan: plan,
        billing_period: billingPeriod,
        subscription_status: subscription.status,
        has_had_paid_plan: true,
      })
      .eq("id", userId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update account:", updateError);
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    
    return NextResponse.json({ 
      success: true,
      account: updatedAccount,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        priceId,
        plan,
        billingPeriod
      }
    });
    
  } catch (error: any) {
    console.error("Manual sync error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}