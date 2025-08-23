import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createStripeClient,
  PRICE_IDS,
  SUPABASE_CONFIG,
  BILLING_URLS,
  isValidPlan,
  getPriceId,
  getPlanChangeType
} from "@/lib/billing/config";

const stripe = createStripeClient();

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

    const { 
      plan, 
      userId, 
      email, 
      billingPeriod = 'monthly',
      isReactivation = false,
      reactivationOffer = null
    }: { 
      plan: string; 
      userId: string; 
      email?: string; 
      billingPeriod?: 'monthly' | 'annual';
      isReactivation?: boolean;
      reactivationOffer?: any;
    } = requestBody;
    console.log("📊 Request:", { plan, userId, email: email ? "provided" : "missing", billingPeriod });
    
    // Validate required fields
    if (!plan || !isValidPlan(plan)) {
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
      supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_ROLE_KEY);
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
        .select("stripe_customer_id, plan, email, is_free_account, free_plan_level, trial_start, trial_end, has_had_paid_plan")
        .eq("id", userId)
        .single();
      
      if (error || !account) {
        console.error("❌ Account not found:", error);
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
      
      // Allow free accounts to upgrade if they choose to
      if (account.is_free_account) {
        console.log("🆓 Free account detected, allowing upgrade from free to paid");
        // Free accounts can upgrade to paid plans
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
    const changeType = currentPlan ? getPlanChangeType(currentPlan, plan) : 'new';

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
    const priceId = getPriceId(plan, billingPeriod);
    if (!priceId) {
      console.error("❌ No price ID found for plan:", plan, billingPeriod);
      return NextResponse.json({ error: "Invalid plan configuration" }, { status: 400 });
    }

    // Check if user already had a trial
    const hadPreviousTrial = accountData.trial_start && (accountData.has_had_paid_plan || currentPlan !== 'grower');
    
    // Configure session - add trial period only for grower plan if user hasn't had a trial
    const shouldGetTrial = plan === 'grower' && !hadPreviousTrial && !currentPlan;
    
    let sessionConfig: any = {
      payment_method_types: ["card" as const],
      mode: "subscription" as const,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { 
        userId, 
        plan,
        billingPeriod: billingPeriod || 'monthly',
        userEmail: userEmail || "",
        changeType,
        isReactivation: isReactivation ? 'true' : 'false',
        hadPreviousTrial: hadPreviousTrial ? 'true' : 'false'
      },
      success_url: BILLING_URLS.SUCCESS_URL(changeType, plan),
      cancel_url: BILLING_URLS.CANCEL_URL,
      // Use valid customer ID if available, otherwise use email
      ...(validCustomerId 
        ? { customer: validCustomerId }
        : { customer_email: userEmail }
      )
    };

    // Add trial period for grower plan if eligible
    if (shouldGetTrial) {
      console.log('🎁 Adding 14-day free trial for new grower plan subscriber');
      sessionConfig.subscription_data = {
        trial_period_days: 14
      };
    } else if (plan === 'grower' && hadPreviousTrial) {
      console.log('⚠️ User already had trial - grower plan will be charged immediately');
    }

    // ============================================
    // CRITICAL: Apply reactivation offer if eligible (Simplified)
    // ============================================
    if (isReactivation) {
      console.log('🎁 Applying reactivation offer for billing period:', billingPeriod);
      
      try {
        const { applyReactivationOffer } = await import('@/lib/stripe-reactivation-offers');
        
        // Apply the appropriate offer based on billing period
        sessionConfig = await applyReactivationOffer(
          sessionConfig,
          userId,
          isReactivation,
          billingPeriod
        );
        
        console.log('✅ Reactivation offer applied to checkout session');
      } catch (offerError) {
        console.error('⚠️ Could not apply reactivation offer:', offerError);
        // Continue without offer - don't block checkout
      }
    }


    console.log("📋 Session config:", {
      priceId: getPriceId(plan, billingPeriod),
      billingPeriod,
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
      
      // ============================================
      // IMPROVED: Use payment error handler for clear messages
      // ============================================
      const { formatPaymentErrorResponse, logPaymentError } = await import('@/lib/payment-errors');
      
      // Log for monitoring
      logPaymentError(stripeError, {
        userId,
        customerId: validCustomerId || undefined,
        action: 'create_checkout_session'
      });
      
      // Return user-friendly error
      const errorResponse = formatPaymentErrorResponse(stripeError);
      return NextResponse.json(errorResponse, { status: 400 });
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
