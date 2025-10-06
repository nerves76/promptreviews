import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import { createStripeClient, BILLING_URLS, PORTAL_CONFIG } from "@/lib/billing/config";


export async function POST(req: NextRequest) {
  const stripe = createStripeClient();
  // CSRF Protection - Check origin for billing management
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(req);
  if (csrfError) return csrfError;
  
  try {
    // Create Supabase server client with cookies from the request
    const supabase = await createServerSupabaseClient();
    
    // For debugging - let's see what's happening
    
    // Get the current session (works better in API routes)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    
    if (sessionError || !session?.user) {
      console.error("❌ Portal API: Authentication failed:", sessionError?.message);
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const user = session.user;

    // Get the user's account using the proper utility function
    // This handles multiple account_user records correctly
    const accountId = await getRequestAccountId(req, user.id, supabase);

    if (!accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get the account to find the Stripe customer ID
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("stripe_customer_id, is_free_account, free_plan_level")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if this is a free account
    if (account.is_free_account) {
      return NextResponse.json({ 
        error: "FREE_ACCOUNT", 
        message: "Free accounts cannot access the billing portal. Your account has been configured with free access.",
        free_plan_level: account.free_plan_level 
      }, { status: 400 });
    }

    if (!account.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer ID found. Please contact support." }, { status: 400 });
    }

    // Add success parameter to return URL so we can show a message when user returns
    // from managing their subscription in Stripe portal
    const returnUrl = BILLING_URLS.PORTAL_RETURN_URL;
    
    // Create portal session with Prompt Reviews-specific configuration
    // This ensures users only see options relevant to their Prompt Reviews subscription
    const portalConfig = PORTAL_CONFIG.CURRENT;
    
    const sessionParams: any = {
      customer: account.stripe_customer_id,
      return_url: returnUrl,
    };
    
    // Only add configuration if we have one (for live mode, needs to be set in env)
    if (portalConfig) {
      sessionParams.configuration = portalConfig;
    } else {
      console.warn('⚠️ Portal API: No configuration specified, using default');
    }
    
    const stripeSession = await stripe.billingPortal.sessions.create(sessionParams);

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Error creating Stripe portal session:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
