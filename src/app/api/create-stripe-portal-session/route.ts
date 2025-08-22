import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import { createStripeClient, BILLING_URLS } from "@/lib/billing/config";

const stripe = createStripeClient();

export async function POST(req: NextRequest) {
  try {
    // Create Supabase server client with cookies from the request
    const supabase = await createServerSupabaseClient();
    
    // For debugging - let's see what's happening
    console.log("🔍 Portal API: Checking authentication...");
    
    // Get the current session (works better in API routes)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log("🔍 Portal API: Session check result:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      error: sessionError?.message
    });
    
    if (sessionError || !session?.user) {
      console.error("❌ Portal API: Authentication failed:", sessionError?.message);
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const user = session.user;
    console.log("✅ Portal API: User authenticated:", user.id);

    // Get the user's account using the proper utility function
    // This handles multiple account_user records correctly
    const accountId = await getAccountIdForUser(user.id, supabase);

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
    
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Error creating Stripe portal session:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
