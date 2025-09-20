import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-05-28.basil" });

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
    const { plan, userId, email, billingPeriod = 'monthly' } = await req.json();

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Fetch stripe_customer_id from accounts table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    let stripeCustomerId: string | undefined = undefined;
    if (userId) {
      const { data: account, error } = await supabase
        .from("accounts")
        .select("stripe_customer_id, email")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("Error fetching account for checkout:", error);
      }
      if (account && account.stripe_customer_id) {
        stripeCustomerId = account.stripe_customer_id;
        // Prevent multiple active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: "all",
          limit: 10,
        });
        const hasActive = subscriptions.data.some((sub) =>
          ["active", "trialing", "past_due", "unpaid"].includes(sub.status),
        );
        if (hasActive) {
          return NextResponse.json(
            {
              error:
                "You already have an active subscription. Please manage your plan in the billing portal.",
            },
            { status: 400 },
          );
        }
      } else if (account && account.email) {
        // No customer id yet – create one up front so future webhooks can match
        try {
          const customer = await stripe.customers.create({
            email: account.email,
            metadata: { userId }
          });
          stripeCustomerId = customer.id;
          await supabase
            .from('accounts')
            .update({ stripe_customer_id: customer.id })
            .eq('id', userId);
        } catch (customerError) {
          console.error('Failed to create Stripe customer:', customerError);
        }
      }
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plan?success=1&change=upgrade&plan=${plan}&billing=${billingPeriod}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plan?canceled=1&plan=${plan}&billing=${billingPeriod}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: email }),
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      metadata: { userId: userId || '', plan, billingPeriod },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
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
