import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
const stripe = new Stripe(stripeSecretKey);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  // Stripe requires the raw body for signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret!);
    console.log("Received Stripe event:", event.type);
  } catch (err: any) {
    console.error("Stripe webhook error:", err);
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

    // Debug logging
    console.log("Stripe customerId from event:", customerId);

    // Determine if this is a paid plan
    const isPaidPlan = plan === "builder" || plan === "maven";

    // Update the user's account in Supabase by customerId
    let updateResult = await supabase
      .from("accounts")
      .update({
        plan,
        plan_lookup_key: lookupKey,
        stripe_subscription_id: subscription.id,
        subscription_status: status,
        ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
      })
      .eq("stripe_customer_id", customerId)
      .select();
    console.log("Supabase update result:", updateResult);

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
        console.log(
          "No account matched by customerId, trying fallback update by email:",
          email,
        );
        updateResult = await supabase
          .from("accounts")
          .update({
            plan,
            plan_lookup_key: lookupKey,
            stripe_subscription_id: subscription.id,
            subscription_status: status,
            stripe_customer_id: customerId, // always set this for future events
            ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
          })
          .eq("email", email)
          .select();
        console.log("Supabase fallback update result:", updateResult);
      } else {
        console.log(
          "No account matched by customerId and no email found for fallback.",
        );
      }
    }
    if (updateResult.error) {
      console.error("Supabase update error:", updateResult.error.message);
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 },
      );
    }
  }

  // Respond to Stripe
  return NextResponse.json({ received: true });
}
