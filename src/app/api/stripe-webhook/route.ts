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
    event.type === "customer.subscription.deleted"
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
        max_users: maxUsers,
        max_locations: maxLocations,
        ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
      })
      .eq("stripe_customer_id", customerId)
      .select();
    console.log("✅ Primary update result:", updateResult.data?.length || 0, "rows updated");

    // Fallback: try to update by email if no row was updated
    if (!updateResult.data || updateResult.data.length === 0) {
      let email = subscription.metadata?.email || null;
      if (!email) {
        // Fetch customer from Stripe if email is missing
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (
            typeof customer === "object" &&
            "email" in customer &&
            customer.email
          ) {
            email = customer.email;
            console.log("Fetched email from Stripe customer:", email);
          } else {
            console.log("No email found on Stripe customer object.");
          }
        } catch (fetchErr) {
          console.error("Error fetching customer from Stripe:", fetchErr);
        }
      }
      if (email) {
        console.log("🔄 Fallback: updating account by email:", email);
        updateResult = await supabase
          .from("accounts")
          .update({
            plan,
            plan_lookup_key: lookupKey,
            stripe_subscription_id: subscription.id,
            subscription_status: status,
            stripe_customer_id: customerId, // always set this for future events
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
      } else {
        console.log("❌ No account matched by customerId and no email found for fallback.");
      }
    }
    if (updateResult.error) {
      console.error("Supabase update error:", updateResult.error.message);
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 },
      );
    }
  } else {
    console.log("ℹ️  Received non-subscription event:", event.type, "- ignoring");
  }

  // Respond to Stripe
  return NextResponse.json({ received: true });
}
