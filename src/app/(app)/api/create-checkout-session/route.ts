import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createStripeClient,
  PRICE_IDS,
  SUPABASE_CONFIG,
  isValidPlan,
  getPriceId,
  getPlanChangeType
} from "@/lib/billing/config";
import {
  deriveTrialMetadata,
  evaluateTrialEligibility,
} from "@/lib/billing/trialEligibility";


export async function POST(req: NextRequest) {
  const stripe = createStripeClient();
  // CSRF Protection - Check origin for payment operations
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(req);
  if (csrfError) return csrfError;
  
  try {
    
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
      reactivationOffer = null,
      isAdditionalAccount: isAdditionalAccountOverride = undefined,
      successPath,
      cancelPath,
    }: {
      plan: string;
      userId: string;
      email?: string;
      billingPeriod?: 'monthly' | 'annual';
      isReactivation?: boolean;
      reactivationOffer?: any;
      isAdditionalAccount?: boolean;
      successPath?: string;
      cancelPath?: string;
    } = requestBody;
    
    // Validate required fields
    if (!plan || !isValidPlan(plan)) {
      return NextResponse.json({ error: "Invalid plan specified" }, { status: 400 });
    }

    if (!userId) {
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
    let accountData;
    try {
      const { data: account, error } = await supabase
        .from("accounts")
        .select("stripe_customer_id, plan, email, is_free_account, free_plan_level, trial_start, trial_end, has_had_paid_plan, is_additional_account")
        .eq("id", userId)
        .single();
      
      if (error || !account) {
        console.error("❌ Account not found:", error);
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
      
      // Allow free accounts to upgrade if they choose to
      if (account.is_free_account) {
        // Free accounts can upgrade to paid plans
      }
      
      accountData = account;
    } catch (accountError) {
      console.error("❌ Error fetching account:", accountError);
      return NextResponse.json({ error: "Failed to fetch account data" }, { status: 500 });
    }

    const {
      stripe_customer_id,
      plan: currentPlan,
      email: accountEmail,
      is_additional_account: accountIsAdditional,
    } = accountData;
    const userEmail = accountEmail || email;
    
    if (!userEmail) {
      return NextResponse.json({ error: "Email is required for checkout" }, { status: 400 });
    }


    // Handle free trial upgrade logic
    if (currentPlan === "grower" && plan !== "grower") {
    }

    // Determine change type - properly detect new accounts vs upgrades
    const isAdditionalAccount =
      accountIsAdditional === true || isAdditionalAccountOverride === true;

    let changeType = (!currentPlan || currentPlan === 'no_plan')
      ? 'new'
      : getPlanChangeType(currentPlan, plan);

    if (changeType === 'new' && isAdditionalAccount) {
      changeType = 'new_additional_account';
    }

    // Create checkout session

    // Check if existing customer ID is valid in current Stripe mode
    let validCustomerId = null;
    if (stripe_customer_id) {
      try {
        await stripe.customers.retrieve(stripe_customer_id);
        validCustomerId = stripe_customer_id;
      } catch (customerError: any) {
      }
    }

    // If no valid Stripe customer exists yet, create one now and persist it
    if (!validCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId }
        });
        validCustomerId = customer.id;
        await supabase
          .from('accounts')
          .update({ stripe_customer_id: customer.id })
          .eq('id', userId);
      } catch (customerError: any) {
        console.error('❌ Failed to create Stripe customer:', customerError);
      }
    }

    // Debug configuration
    const priceId = getPriceId(plan, billingPeriod);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan configuration" }, { status: 400 });
    }

    // Check if user already had a trial
    const trialEvaluation = evaluateTrialEligibility(accountData);
    const trialMeta = deriveTrialMetadata(trialEvaluation);

    const hadPreviousTrial = trialMeta.hasConsumedTrial;

    // Configure session - add trial period only for grower plan if user hasn't had a trial
    const shouldGetTrial =
      plan === 'grower' &&
      trialEvaluation.eligible &&
      (!currentPlan || currentPlan === 'no_plan');

    const resolvePath = (candidate: string | undefined | null, fallback: string) => {
      if (!candidate || typeof candidate !== "string") return fallback;
      const trimmed = candidate.trim();
      if (!trimmed.startsWith("/")) return fallback;
      if (trimmed.startsWith("//")) return fallback;
      return trimmed;
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const baseSuccessPath = resolvePath(successPath, "/dashboard");
    const baseCancelPath = resolvePath(cancelPath, "/dashboard");

    const parseBasePath = (path: string) => {
      const [pathOnly, existingQuery] = path.split("?");
      return {
        pathOnly,
        params: new URLSearchParams(existingQuery || ""),
      };
    };

    const successBase = parseBasePath(baseSuccessPath);
    successBase.params.set("success", "1");
    if (changeType) {
      successBase.params.set("change", changeType);
    }
    successBase.params.set("plan", plan);
    if (billingPeriod) {
      successBase.params.set("billing", billingPeriod);
    }
    if (isAdditionalAccount) {
      successBase.params.set("additional", "1");
    }

    const successQuery = successBase.params.toString();
    const successUrl = `${appUrl}${successBase.pathOnly}?${successQuery}${successQuery ? "&" : ""}session_id={CHECKOUT_SESSION_ID}`;

    const cancelBase = parseBasePath(baseCancelPath);
    cancelBase.params.set("canceled", "1");
    cancelBase.params.set("plan", plan);
    if (billingPeriod) {
      cancelBase.params.set("billing", billingPeriod);
    }
    const cancelQuery = cancelBase.params.toString();
    const cancelUrl = `${appUrl}${cancelBase.pathOnly}?${cancelQuery}`;

    console.log('🔗 Checkout success URL:', successUrl);
    console.log('📊 Change type:', changeType, 'Plan:', plan);

    let sessionConfig: any = {
      payment_method_types: ["card" as const],
      mode: "subscription" as const,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { 
        userId,
        plan,
        billingPeriod,
        userEmail: userEmail || "",
        changeType,
        isAdditionalAccount: isAdditionalAccount ? 'true' : 'false',
        isReactivation: isReactivation ? 'true' : 'false',
        hadPreviousTrial: hadPreviousTrial ? 'true' : 'false'
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Use valid customer ID if available, otherwise use email
      ...(validCustomerId 
        ? { customer: validCustomerId }
        : { customer_email: userEmail }
      )
    };

    // Add trial period for grower plan if eligible
    if (shouldGetTrial) {
      sessionConfig.subscription_data = {
        trial_period_days: 14
      };
    } else if (plan === 'grower' && hadPreviousTrial) {
    }

    // ============================================
    // CRITICAL: Apply reactivation offer if eligible (Simplified)
    // ============================================
    if (isReactivation) {
      
      try {
        const { applyReactivationOffer } = await import('@/lib/stripe-reactivation-offers');
        
        // Apply the appropriate offer based on billing period
        sessionConfig = await applyReactivationOffer(
          sessionConfig,
          userId,
          isReactivation,
          billingPeriod
        );
        
      } catch (offerError) {
        console.error('⚠️ Could not apply reactivation offer:', offerError);
        // Continue without offer - don't block checkout
      }
    }



    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create(sessionConfig);
      
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
