import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-06-30.basil" });

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  grower: {
    monthly: process.env.STRIPE_PRICE_ID_GROWER!,
    annual: process.env.STRIPE_PRICE_ID_GROWER_ANNUAL || process.env.STRIPE_PRICE_ID_GROWER!,
  },
  builder: {
    monthly: process.env.STRIPE_PRICE_ID_BUILDER!,
    annual: process.env.STRIPE_PRICE_ID_BUILDER_ANNUAL || process.env.STRIPE_PRICE_ID_BUILDER!,
  },
  maven: {
    monthly: process.env.STRIPE_PRICE_ID_MAVEN!,
    annual: process.env.STRIPE_PRICE_ID_MAVEN_ANNUAL || process.env.STRIPE_PRICE_ID_MAVEN!,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📊 Preview billing change request:', body);
    
    const { plan, userId, billingPeriod = 'monthly' }: { 
      plan: string; 
      userId: string; 
      billingPeriod?: 'monthly' | 'annual' 
    } = body;
    
    if (!plan || !PRICE_IDS[plan]) {
      console.error('Invalid plan:', plan, 'Available plans:', Object.keys(PRICE_IDS));
      return NextResponse.json({ error: "Invalid plan", message: `Plan "${plan}" is not valid` }, { status: 400 });
    }

    if (!userId) {
      console.error('No user ID provided');
      return NextResponse.json({ error: "User ID is required", message: "User ID is required" }, { status: 400 });
    }

    // Fetch current account info including Stripe customer ID
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    
    const { data: account, error } = await supabase
      .from("accounts")
      .select("stripe_customer_id, stripe_subscription_id, plan, billing_period")
      .eq("id", userId)
      .single();
      
    if (error || !account) {
      console.error("Error fetching account:", error);
      return NextResponse.json({ 
        error: "Account not found", 
        message: "Unable to find your account information" 
      }, { status: 404 });
    }

    console.log('📊 Account found:', {
      hasStripeCustomer: !!account.stripe_customer_id,
      hasSubscription: !!account.stripe_subscription_id,
      currentPlan: account.plan,
      currentBilling: account.billing_period
    });

    if (!account.stripe_customer_id || !account.stripe_subscription_id) {
      console.error('No active subscription:', {
        stripe_customer_id: account.stripe_customer_id,
        stripe_subscription_id: account.stripe_subscription_id
      });
      return NextResponse.json({ 
        error: "No active subscription",
        message: "No subscription found to modify. Please contact support if you believe this is an error." 
      }, { status: 400 });
    }

    // Fetch the current subscription
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
      console.log('📊 Subscription retrieved:', {
        id: subscription.id,
        status: subscription.status,
        itemCount: subscription.items?.data?.length || 0
      });
    } catch (stripeError: any) {
      console.error("Failed to retrieve subscription from Stripe:", stripeError);
      return NextResponse.json({ 
        error: "Subscription not found",
        message: "Unable to retrieve your subscription. It may have been canceled or is invalid." 
      }, { status: 400 });
    }
    
    // Check if subscription has items
    if (!subscription.items || !subscription.items.data || subscription.items.data.length === 0) {
      console.error("Subscription has no items:", subscription.id);
      return NextResponse.json({ 
        error: "Invalid subscription state",
        message: "Your subscription appears to be in an invalid state. Please contact support." 
      }, { status: 400 });
    }
    
    // Get the new price ID
    const newPriceId = PRICE_IDS[plan]?.[billingPeriod] || PRICE_IDS[plan]?.monthly;
    
    if (!newPriceId) {
      console.error("Invalid price ID for plan:", plan, billingPeriod);
      return NextResponse.json({ 
        error: "Invalid plan configuration",
        message: "The selected plan is not properly configured. Please try again or contact support." 
      }, { status: 400 });
    }
    
    // Create a preview of the proration
    const proration_date = Math.floor(Date.now() / 1000);
    
    console.log('📊 Attempting to preview invoice with:', {
      customer: account.stripe_customer_id,
      subscription: subscription.id,
      currentItemId: subscription.items.data[0].id,
      currentPrice: subscription.items.data[0].price.id,
      newPrice: newPriceId,
      proration_date
    });
    
    // Debug: Check what methods are available
    console.log('📊 Available invoice methods:', Object.keys(stripe.invoices));
    
    // Preview the upcoming invoice with the changes
    let upcomingInvoice;
    try {
      // Try using retrieveUpcoming for older Stripe versions
      upcomingInvoice = await (stripe.invoices as any).retrieveUpcoming({
        customer: account.stripe_customer_id,
        subscription: subscription.id,
        subscription_items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        subscription_proration_date: proration_date,
      });
    } catch (stripeError: any) {
      console.error("Failed to retrieve upcoming invoice from Stripe:", stripeError);
      
      // Check if it's because the prices are the same
      if (stripeError.message?.includes('no change') || stripeError.message?.includes('same price')) {
        return NextResponse.json({
          preview: {
            currentPlan: `${account.plan} (${account.billing_period})`,
            newPlan: `${plan} (${billingPeriod})`,
            creditAmount: "0.00",
            chargeAmount: "0.00",
            netAmount: "0.00",
            isCredit: false,
            message: "No price change. You're already on this plan.",
            timeline: "No changes will be made.",
            stripeEmail: null,
            processingFeeNote: null
          }
        });
      }
      
      return NextResponse.json({ 
        error: "Unable to calculate billing",
        message: `Unable to preview billing changes: ${stripeError.message || 'Unknown error'}` 
      }, { status: 400 });
    }

    // Calculate the credit/charge
    const currentAmount = upcomingInvoice.lines.data
      .filter(line => line.amount < 0)
      .reduce((sum, line) => sum + Math.abs(line.amount), 0);
    
    const newAmount = upcomingInvoice.lines.data
      .filter(line => line.amount > 0)
      .reduce((sum, line) => sum + line.amount, 0);

    const creditAmount = currentAmount / 100; // Convert from cents
    const chargeAmount = newAmount / 100; // Convert from cents
    const netAmount = (newAmount - currentAmount) / 100; // What they'll actually pay/receive

    // Determine if this is a downgrade (results in credit) or upgrade (results in charge)
    const isDowngrade = account.billing_period === 'annual' && billingPeriod === 'monthly';
    const isUpgrade = account.billing_period === 'monthly' && billingPeriod === 'annual';

    return NextResponse.json({
      preview: {
        currentPlan: `${account.plan} (${account.billing_period})`,
        newPlan: `${plan} (${billingPeriod})`,
        creditAmount: creditAmount.toFixed(2),
        chargeAmount: chargeAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        isCredit: netAmount < 0,
        message: netAmount < 0 
          ? `You'll receive a credit of $${Math.abs(netAmount).toFixed(2)} for the unused time on your current plan. This credit will be applied to future invoices.`
          : netAmount > 0
          ? `You'll be charged $${netAmount.toFixed(2)} for the prorated difference.`
          : `No additional charge. The plans are the same price.`,
        timeline: netAmount < 0
          ? "The credit will appear on your account immediately and will be automatically applied to your next invoice."
          : "The charge will be processed immediately.",
        stripeEmail: netAmount < 0
          ? "You'll receive an email receipt from Stripe confirming the credit."
          : "You'll receive an email receipt from Stripe confirming the charge.",
        // Note about processing fees - important for transparency
        processingFeeNote: netAmount < 0
          ? "Note: This is the full credit amount you'll receive. Stripe's original processing fees are non-refundable per their policy."
          : null
      }
    });

  } catch (error: any) {
    console.error("Error previewing billing change:", error);
    console.error("Error stack:", error.stack);
    
    // Check for specific error types
    if (error.message?.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: "Configuration error", message: "Stripe is not properly configured. Please contact support." },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('SUPABASE')) {
      return NextResponse.json(
        { error: "Database error", message: "Unable to access account information. Please try again." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Server error", 
        message: error.message || "An unexpected error occurred while previewing billing changes. Please try again." 
      },
      { status: 500 }
    );
  }
}