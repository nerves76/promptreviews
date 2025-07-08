import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-06-30.basil" });

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
    const { plan, userId, email } = await req.json();
    
    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Fetch current account info including current plan
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    let stripeCustomerId: string | undefined = undefined;
    let currentPlan: string | undefined = undefined;
    
    if (userId) {
      const { data: account, error } = await supabase
        .from("accounts")
        .select("stripe_customer_id, plan, email")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("Error fetching account for checkout:", error);
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
      if (account) {
        stripeCustomerId = account.stripe_customer_id;
        currentPlan = account.plan;
        
        // CRITICAL FIX: If no stripe_customer_id exists, create one now
        if (!stripeCustomerId) {
          console.log("🔧 Creating Stripe customer for user:", userId);
          try {
            const customer = await stripe.customers.create({
              email: account.email,
              metadata: { userId: userId }
            });
            stripeCustomerId = customer.id;
            
            // Update account with new customer ID
            const { error: updateError } = await supabase
              .from("accounts")
              .update({ stripe_customer_id: stripeCustomerId })
              .eq("id", userId);
            
            if (updateError) {
              console.error("Error updating account with customer ID:", updateError);
              // Continue anyway - webhook can handle it
            } else {
              console.log("✅ Account updated with customer ID:", stripeCustomerId);
            }
          } catch (customerError) {
            console.error("Error creating Stripe customer:", customerError);
            // Continue with email-based checkout
          }
        }
        
        // Prevent multiple active subscriptions
        if (stripeCustomerId) {
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
        }
      }
    }

    // Determine if this is an upgrade or downgrade
    const planOrder = { free: 0, grower: 1, builder: 2, maven: 3 };
    const currentPlanOrder = planOrder[currentPlan as keyof typeof planOrder] || 0;
    const targetPlanOrder = planOrder[plan as keyof typeof planOrder] || 0;
    
    let changeType = "new";
    if (currentPlan) {
      if (targetPlanOrder > currentPlanOrder) {
        changeType = "upgrade";
      } else if (targetPlanOrder < currentPlanOrder) {
        changeType = "downgrade";
      } else {
        changeType = "same";
      }
    }

    console.log("🛒 Creating checkout session:");
    console.log("  Customer ID:", stripeCustomerId);
    console.log("  Plan:", plan);
    console.log("  Change Type:", changeType);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: email }),
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      metadata: { 
        userId, 
        plan,
        userEmail: email // Add email to metadata for webhook fallback
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1&change=${changeType}&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=1`,
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
