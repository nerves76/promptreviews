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
    console.log("🚀 Checkout session request started");
    
    // Enhanced environment variable logging
    console.log("🔧 Environment check:");
    console.log("  STRIPE_SECRET_KEY:", stripeSecretKey ? "✅ Present" : "❌ Missing");
    console.log("  STRIPE_PRICE_ID_GROWER:", growerPriceId ? "✅ Present" : "❌ Missing");
    console.log("  STRIPE_PRICE_ID_BUILDER:", builderPriceId ? "✅ Present" : "❌ Missing");
    console.log("  STRIPE_PRICE_ID_MAVEN:", mavenPriceId ? "✅ Present" : "❌ Missing");
    console.log("  NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Present" : "❌ Missing");
    console.log("  SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Present" : "❌ Missing");
    console.log("  NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL ? "✅ Present" : "❌ Missing");
    
    const { plan, userId, email } = await req.json();
    console.log("📊 Request data:", { plan, userId, email: email ? "provided" : "missing" });
    
    if (!plan || !PRICE_IDS[plan]) {
      console.error("❌ Invalid plan provided:", plan);
      console.error("Available plans:", Object.keys(PRICE_IDS));
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!userId) {
      console.error("❌ Missing userId in request");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Fetch current account info including current plan
    console.log("🔍 Creating Supabase client");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    let stripeCustomerId: string | undefined = undefined;
    let currentPlan: string | undefined = undefined;
    let userEmail: string | undefined = email;
    
    if (userId) {
      console.log("🔍 Fetching account data for userId:", userId);
      const { data: account, error } = await supabase
        .from("accounts")
        .select("stripe_customer_id, plan, email")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("❌ Error fetching account for checkout:", error);
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
      if (account) {
        stripeCustomerId = account.stripe_customer_id;
        currentPlan = account.plan;
        userEmail = account.email || email; // Use account email if available
        
        console.log("📋 Account data:");
        console.log("  Stripe Customer ID:", stripeCustomerId ? "✅ Present" : "❌ Missing");
        console.log("  Current Plan:", currentPlan);
        console.log("  Email:", userEmail ? "✅ Present" : "❌ Missing");
        
        // Ensure we have an email for checkout
        if (!userEmail) {
          console.error("❌ No email available for checkout");
          return NextResponse.json({ error: "Email required for checkout" }, { status: 400 });
        }
        
        // CRITICAL FIX: If no stripe_customer_id exists, create one now
        if (!stripeCustomerId) {
          console.log("🔧 Creating Stripe customer for user:", userId);
          try {
            const customer = await stripe.customers.create({
              email: userEmail,
              metadata: { userId: userId }
            });
            stripeCustomerId = customer.id;
            console.log("✅ Stripe customer created:", stripeCustomerId);
            
            // Update account with new customer ID
            const { error: updateError } = await supabase
              .from("accounts")
              .update({ stripe_customer_id: stripeCustomerId })
              .eq("id", userId);
            
            if (updateError) {
              console.error("⚠️ Error updating account with customer ID:", updateError);
              // Continue anyway - webhook can handle it
            } else {
              console.log("✅ Account updated with customer ID:", stripeCustomerId);
            }
          } catch (customerError: any) {
            console.error("❌ Error creating Stripe customer:", customerError);
            console.error("Customer Error Details:", {
              message: customerError.message,
              type: customerError.type,
              code: customerError.code
            });
            // Continue with email-based checkout
          }
        }
        
        // Prevent multiple active subscriptions (but allow free trial upgrades)
        if (stripeCustomerId) {
          console.log("🔍 Checking existing subscriptions for customer:", stripeCustomerId);
          try {
            const subscriptions = await stripe.subscriptions.list({
              customer: stripeCustomerId,
              status: "all",
              limit: 10,
            });
            
            const activeSubscriptions = subscriptions.data.filter((sub) =>
              ["active", "trialing", "past_due", "unpaid"].includes(sub.status)
            );
            
            console.log("🔍 Active subscriptions found:", activeSubscriptions.length);
            console.log("🔍 Current plan:", currentPlan);
            console.log("🔍 Target plan:", plan);
            
            // Allow upgrades from free trial plans (grower) even if there's a subscription
            const isFreeTrial = currentPlan === "grower" || currentPlan === "free";
            const hasActiveNonTrial = activeSubscriptions.some((sub) => 
              sub.status === "active" && !sub.status.includes("trial")
            );
            
            if (activeSubscriptions.length > 0 && !isFreeTrial) {
              console.log("❌ Blocking upgrade: active subscription exists for non-trial plan");
              return NextResponse.json(
                {
                  error:
                    "You already have an active subscription. Please manage your plan in the billing portal.",
                },
                { status: 400 },
              );
            }
            
            if (isFreeTrial && activeSubscriptions.length > 0) {
              console.log("✅ Allowing trial upgrade: free trial → paid plan");
            }
          } catch (subscriptionError: any) {
            console.error("❌ Error checking subscriptions:", subscriptionError);
            console.error("Subscription Error Details:", {
              message: subscriptionError.message,
              type: subscriptionError.type,
              code: subscriptionError.code
            });
            // Continue with checkout anyway
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
    console.log("  Price ID:", PRICE_IDS[plan]);
    console.log("  User Email:", userEmail);
    console.log("  Success URL:", `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1&change=${changeType}&plan=${plan}`);

    try {
      const sessionConfig = {
        payment_method_types: ["card"],
        mode: "subscription" as const,
        ...(stripeCustomerId
          ? { customer: stripeCustomerId }
          : { customer_email: userEmail }),
        line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
        metadata: { 
          userId, 
          plan,
          userEmail: userEmail // Add email to metadata for webhook fallback
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1&change=${changeType}&plan=${plan}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=1`,
      };
      
      console.log("🔧 Checkout session config:", JSON.stringify(sessionConfig, null, 2));
      
      const session = await stripe.checkout.sessions.create(sessionConfig);

      console.log("✅ Checkout session created successfully:", session.id);
      console.log("✅ Session URL:", session.url);
      return NextResponse.json({ url: session.url });
    } catch (stripeError: any) {
      console.error("❌ Stripe API Error:", stripeError);
      console.error("Stripe Error Details:", {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
        param: stripeError.param,
        decline_code: stripeError.decline_code
      });
      
      // More specific error handling
      let errorMessage = "Stripe checkout failed";
      if (stripeError.type === "StripeInvalidRequestError") {
        errorMessage = `Stripe validation error: ${stripeError.message}`;
      } else if (stripeError.type === "StripeAPIError") {
        errorMessage = "Stripe service temporarily unavailable";
      } else if (stripeError.type === "StripeAuthenticationError") {
        errorMessage = "Stripe authentication failed";
      } else if (stripeError.message) {
        errorMessage = `Stripe error: ${stripeError.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("❌ Stripe checkout error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: error.type,
      code: error.code
    });
    
    // Provide more specific error messages
    let errorMessage = "Internal server error";
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = `Stripe validation error: ${error.message}`;
    } else if (error.type === "StripeAPIError") {
      errorMessage = "Stripe service temporarily unavailable";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
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
