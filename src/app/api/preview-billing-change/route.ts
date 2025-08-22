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
    const { plan, userId, billingPeriod = 'monthly' }: { 
      plan: string; 
      userId: string; 
      billingPeriod?: 'monthly' | 'annual' 
    } = await req.json();
    
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
      .select("stripe_customer_id, stripe_subscription_id, plan, billing_period")
      .eq("id", userId)
      .single();
      
    if (error || !account) {
      console.error("Error fetching account:", error);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!account.stripe_customer_id || !account.stripe_subscription_id) {
      return NextResponse.json({ 
        error: "No active subscription",
        message: "No subscription found to modify" 
      }, { status: 400 });
    }

    // Fetch the current subscription
    const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
    
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
    
    // Preview the upcoming invoice with the changes
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
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
    return NextResponse.json(
      { error: error.message || "Failed to preview billing change" },
      { status: 500 }
    );
  }
}