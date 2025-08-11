import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
const stripe = new Stripe(stripeSecretKey);

export async function POST(req: NextRequest) {
  console.log("🔔 Webhook endpoint called"); // Debug: confirm webhook is being called
  
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET is not set");
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  // Stripe requires the raw body for signature verification
  const rawBody = await req.text();
  console.log("📋 Webhook body length:", rawBody.length); // Debug: confirm body received

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret!);
    console.log("🔔 Received Stripe event:", event.type);
    console.log("📋 Event ID:", event.id);
  } catch (err: any) {
    console.error("❌ Stripe webhook signature verification failed:", err);
    console.error("❌ Received signature:", sig?.substring(0, 50) + "...");
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }

  // Connect to Supabase (no cookies needed for webhooks)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Handle subscription events
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.trial_will_end" ||
    event.type === "customer.subscription.paused" ||
    event.type === "customer.subscription.resumed"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    // Use the Stripe price lookup_key for plan logic (e.g., 'maven_100' -> 'maven')
    const lookupKey =
      subscription.items.data[0]?.price.lookup_key?.toLowerCase() ||
      "builder_35";
    const plan = lookupKey.split("_")[0]; // e.g., 'maven_100' -> 'maven'
    const status = subscription.status;

    // Enhanced debug logging
    console.log("📋 Webhook processing details:");
    console.log("  Customer ID:", customerId);
    console.log("  Subscription ID:", subscription.id);
    console.log("  Price ID:", subscription.items.data[0]?.price.id);
    console.log("  Lookup Key:", lookupKey);
    console.log("  Extracted Plan:", plan);
    console.log("  Status:", status);

    // Determine if this is a paid plan
    const isPaidPlan = plan === "builder" || plan === "maven";
    
    // Determine max users based on plan
    let maxUsers = 1; // Default for grower/free
    if (plan === "builder") {
      maxUsers = 3;
    } else if (plan === "maven") {
      maxUsers = 5;
    }

    // Determine max locations based on plan
    let maxLocations = 0; // Default for grower/builder/free
    if (plan === "maven") {
      maxLocations = 10;
    }

    // Determine billing period from subscription interval
    const billingPeriod = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly';
    console.log("  Billing Period:", billingPeriod);

    // Update the user's account in Supabase by customerId
    console.log("🔄 Attempting to update account by customer ID:", customerId);
    console.log("  Setting max_users to:", maxUsers);
    let updateResult = await supabase
      .from("accounts")
      .update({
        plan,
        plan_lookup_key: lookupKey,
        stripe_subscription_id: subscription.id,
        subscription_status: status,
        billing_period: billingPeriod,
        max_users: maxUsers,
        max_locations: maxLocations,
        ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
      })
      .eq("stripe_customer_id", customerId)
      .select();
    console.log("✅ Primary update result:", updateResult.data?.length || 0, "rows updated");

    // Enhanced fallback: try multiple methods to find the account
    if (!updateResult.data || updateResult.data.length === 0) {
      console.log("⚠️  Primary update failed, trying fallback methods...");
      
      // Method 1: Try to get email from checkout session metadata
      let email = subscription.metadata?.userEmail || subscription.metadata?.email || null;
      
      // Method 2: Fetch customer from Stripe if email is missing
      if (!email) {
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (
            typeof customer === "object" &&
            "email" in customer &&
            customer.email
          ) {
            email = customer.email;
            console.log("📧 Fetched email from Stripe customer:", email);
          } else {
            console.log("❌ No email found on Stripe customer object.");
          }
        } catch (fetchErr) {
          console.error("❌ Error fetching customer from Stripe:", fetchErr);
        }
      }
      
      // Method 3: Try to find by userId from metadata
      const userId = subscription.metadata?.userId;
      if (!email && userId) {
        console.log("🔍 Trying to find account by userId from metadata:", userId);
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("email")
          .eq("id", userId)
          .single();
        
        if (accountData && !accountError) {
          email = accountData.email;
          console.log("📧 Found email from userId lookup:", email);
        } else {
          console.log("❌ Could not find account by userId:", userId);
        }
      }
      
      // Method 4: Update by email if found
      if (email) {
        console.log("🔄 Fallback: updating account by email:", email);
        updateResult = await supabase
          .from("accounts")
          .update({
            plan,
            plan_lookup_key: lookupKey,
            stripe_subscription_id: subscription.id,
            subscription_status: status,
            stripe_customer_id: customerId, // CRITICAL: always set this for future events
            billing_period: billingPeriod,
            max_users: maxUsers,
            max_locations: maxLocations,
            ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
          })
          .eq("email", email)
          .select();
        console.log("✅ Fallback update result:", updateResult.data?.length || 0, "rows updated");
        
        if (updateResult.data && updateResult.data.length > 0) {
          console.log("🎉 Account successfully updated via email fallback!");
        }
      }
      
      // Method 5: Try by userId if email failed
      if ((!updateResult.data || updateResult.data.length === 0) && userId) {
        console.log("🔄 Last resort: updating account by userId:", userId);
        updateResult = await supabase
          .from("accounts")
          .update({
            plan,
            plan_lookup_key: lookupKey,
            stripe_subscription_id: subscription.id,
            subscription_status: status,
            stripe_customer_id: customerId, // CRITICAL: always set this for future events
            billing_period: billingPeriod,
            max_users: maxUsers,
            max_locations: maxLocations,
            ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
          })
          .eq("id", userId)
          .select();
        console.log("✅ UserId fallback update result:", updateResult.data?.length || 0, "rows updated");
        
        if (updateResult.data && updateResult.data.length > 0) {
          console.log("🎉 Account successfully updated via userId fallback!");
        }
      }
      
      // CRITICAL: Alert if all methods failed
      if (!updateResult.data || updateResult.data.length === 0) {
        console.error("🚨 CRITICAL: All update methods failed!");
        console.error("  Customer ID:", customerId);
        console.error("  Email:", email);
        console.error("  User ID:", userId);
        console.error("  Plan:", plan);
        console.error("  Subscription ID:", subscription.id);
        
        // TODO: Add monitoring/alerting here (e.g., Sentry, email notification)
        // This should trigger immediate investigation
      }
    }
    
    if (updateResult.error) {
      console.error("Supabase update error:", updateResult.error.message);
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 },
      );
    }
  } else if (
    event.type === "invoice.payment_succeeded" ||
    event.type === "invoice.payment_failed"
  ) {
    // Handle invoice/payment events
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    const subscriptionId = typeof (invoice as any).subscription === 'string' 
      ? (invoice as any).subscription 
      : (invoice as any).subscription?.id || null;
    
    console.log("💳 Processing payment event:", event.type);
    console.log("  Customer ID:", customerId);
    console.log("  Subscription ID:", subscriptionId);
    console.log("  Invoice ID:", invoice.id);
    console.log("  Amount:", invoice.amount_paid / 100, "USD");
    console.log("  Status:", invoice.status);
    
    // Update payment status in our database
    const paymentSucceeded = event.type === "invoice.payment_succeeded";
    const subscriptionUpdateData = {
      subscription_status: paymentSucceeded ? 'active' : 'past_due',
      // We could add more payment-specific fields here
      updated_at: new Date().toISOString(),
    };
    
    // Update account by customer ID
    console.log("🔄 Updating payment status for customer:", customerId);
    const updateResult = await supabase
      .from("accounts")
      .update(subscriptionUpdateData)
      .eq("stripe_customer_id", customerId)
      .select();
    
    console.log("✅ Payment status update result:", updateResult.data?.length || 0, "rows updated");
    
    if (updateResult.error) {
      console.error("Supabase payment update error:", updateResult.error.message);
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 },
      );
    }
    
    // If payment succeeded and this was a past_due subscription, mark as reactivated
    if (paymentSucceeded && subscriptionId) {
      console.log("🎉 Payment succeeded - account reactivated!");
    }
  } else {
    console.log("ℹ️  Received non-handled event:", event.type, "- ignoring");
  }

  // Respond to Stripe
  return NextResponse.json({ received: true });
}
