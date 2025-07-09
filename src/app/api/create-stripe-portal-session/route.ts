import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/utils/supabaseClient";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
const stripe = new Stripe(stripeSecretKey);

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

    // Get the user's account through account_users table
    const { data: accountUser, error: accountUserError } = await supabase
      .from("account_users")
      .select("account_id")
      .eq("user_id", user.id)
      .single();

    if (accountUserError || !accountUser) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get the account to find the Stripe customer ID
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("stripe_customer_id, is_free_account, free_plan_level")
      .eq("id", accountUser.account_id)
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

    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url:
        process.env.NEXT_PUBLIC_PORTAL_RETURN_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Error creating Stripe portal session:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
