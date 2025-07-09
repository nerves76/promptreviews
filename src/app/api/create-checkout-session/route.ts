import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const builderPriceId = process.env.STRIPE_PRICE_ID_BUILDER;
const mavenPriceId = process.env.STRIPE_PRICE_ID_MAVEN;
const growerPriceId = process.env.STRIPE_PRICE_ID_GROWER;

if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !appUrl || !builderPriceId || !mavenPriceId || !growerPriceId) {
  console.error("❌ Missing required environment variables");
  console.error("Environment check:", {
    stripeSecretKey: !!stripeSecretKey,
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    appUrl: !!appUrl,
    builderPriceId: !!builderPriceId,
    mavenPriceId: !!mavenPriceId,
    growerPriceId: !!growerPriceId
  });
  throw new Error("Missing required environment variables");
}

// Assert types after validation
const validatedEnvVars = {
  stripeSecretKey: stripeSecretKey as string,
  supabaseUrl: supabaseUrl as string,
  supabaseServiceKey: supabaseServiceKey as string,
  appUrl: appUrl as string,
  builderPriceId: builderPriceId as string,
  mavenPriceId: mavenPriceId as string,
  growerPriceId: growerPriceId as string,
};

const stripe = new Stripe(validatedEnvVars.stripeSecretKey, { apiVersion: "2025-06-30.basil" });

const PRICE_IDS: Record<string, string> = {
  grower: validatedEnvVars.growerPriceId,
  builder: validatedEnvVars.builderPriceId,
  maven: validatedEnvVars.mavenPriceId,
};

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Processing checkout session request");
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { plan, userId, email } = requestBody;
    console.log("📊 Request:", { plan, userId, email: email ? "provided" : "missing" });
    
    // Validate required fields
    if (!plan || !PRICE_IDS[plan]) {
      console.error("❌ Invalid plan:", plan);
      return NextResponse.json({ error: "Invalid plan specified" }, { status: 400 });
    }

    if (!userId) {
      console.error("❌ Missing userId");
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Initialize Supabase client
    let supabase;
    try {
      supabase = createClient(validatedEnvVars.supabaseUrl, validatedEnvVars.supabaseServiceKey);
    } catch (supabaseError) {
      console.error("❌ Failed to create Supabase client:", supabaseError);
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Fetch account data
    console.log("🔍 Fetching account data");
    let accountData;
    try {
      const { data: account, error } = await supabase
        .from("accounts")
        .select("stripe_customer_id, plan, email, is_free_account, free_plan_level")
        .eq("id", userId)
        .single();
      
      if (error || !account) {
        console.error("❌ Account not found:", error);
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
      
      // Check if this is a free account
      if (account.is_free_account) {
        console.log("🆓 Free account detected, blocking checkout");
        return NextResponse.json({ 
          error: "FREE_ACCOUNT", 
          message: "Free accounts cannot create checkout sessions. Your account has been configured with free access.",
          free_plan_level: account.free_plan_level 
        }, { status: 400 });
      }
      
      accountData = account;
    } catch (accountError) {
      console.error("❌ Error fetching account:", accountError);
      return NextResponse.json({ error: "Failed to fetch account data" }, { status: 500 });
    }

    const { stripe_customer_id, plan: currentPlan, email: accountEmail } = accountData;
    const userEmail = accountEmail || email;
    
    if (!userEmail) {
      console.error("❌ No email available");
      return NextResponse.json({ error: "Email is required for checkout" }, { status: 400 });
    }

    console.log("📋 Account info:", { 
      hasStripeCustomer: !!stripe_customer_id, 
      currentPlan, 
      targetPlan: plan 
    });

    // Handle free trial upgrade logic
    if (currentPlan === "grower" && plan !== "grower") {
      console.log("✅ Processing free trial upgrade");
    }

    // Determine change type
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

    // Create checkout session
    console.log("🛒 Creating checkout session");
    
    // Check if existing customer ID is valid in current Stripe mode
    let validCustomerId = null;
    if (stripe_customer_id) {
      try {
        await stripe.customers.retrieve(stripe_customer_id);
        validCustomerId = stripe_customer_id;
        console.log("✅ Existing customer ID is valid:", stripe_customer_id);
      } catch (customerError: any) {
        console.log("⚠️ Existing customer ID is invalid in current mode:", stripe_customer_id);
        console.log("Will use email instead:", userEmail);
      }
    }
    
    // Debug configuration
    const sessionConfig = {
      payment_method_types: ["card" as const],
      mode: "subscription" as const,
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      metadata: { 
        userId, 
        plan,
        userEmail: userEmail || "",
        changeType
      },
      success_url: `${validatedEnvVars.appUrl}/dashboard?success=1&change=${changeType}&plan=${plan}`,
      cancel_url: `${validatedEnvVars.appUrl}/dashboard?canceled=1`,
      // Use valid customer ID if available, otherwise use email
      ...(validCustomerId 
        ? { customer: validCustomerId }
        : { customer_email: userEmail }
      )
    };

    console.log("📋 Session config:", {
      priceId: PRICE_IDS[plan],
      hasValidCustomer: !!validCustomerId,
      usingCustomerEmail: !validCustomerId,
      customerEmail: userEmail,
      metadata: sessionConfig.metadata
    });

    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create(sessionConfig);
      console.log("✅ Checkout session created:", checkoutSession.id);
      
    } catch (stripeError: any) {
      console.error("❌ Stripe checkout error:", stripeError);
      console.error("Stripe error details:", {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code
      });
      
      let errorMessage = "Payment setup failed";
      if (stripeError.type === "StripeInvalidRequestError") {
        errorMessage = `Invalid payment request: ${stripeError.message}`;
      } else if (stripeError.type === "StripeAPIError") {
        errorMessage = "Payment service temporarily unavailable";
      } else if (stripeError.message) {
        errorMessage = stripeError.message;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Return success response
    if (!checkoutSession.url) {
      console.error("❌ No URL returned from Stripe");
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    console.log("✅ Checkout session ready:", checkoutSession.url);
    return NextResponse.json({ url: checkoutSession.url });

  } catch (error: any) {
    console.error("❌ Unexpected error in checkout session:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { error: "An unexpected error occurred during checkout" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "GET not supported for this endpoint. Use POST." },
    { status: 405 }
  );
}
