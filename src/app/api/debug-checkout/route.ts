import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Starting debug checkout endpoint");
    
    // Check environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const builderPriceId = process.env.STRIPE_PRICE_ID_BUILDER;
    const mavenPriceId = process.env.STRIPE_PRICE_ID_MAVEN;
    const growerPriceId = process.env.STRIPE_PRICE_ID_GROWER;

    const envCheck = {
      stripeSecretKey: !!stripeSecretKey,
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      appUrl: !!appUrl,
      builderPriceId: !!builderPriceId,
      mavenPriceId: !!mavenPriceId,
      growerPriceId: !!growerPriceId
    };

    console.log("📋 Environment check:", envCheck);

    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    // Try to initialize Stripe
    try {
      const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-06-30.basil" });
      console.log("✅ Stripe initialized successfully");
      
      // Try to retrieve a simple list to test connection
      try {
        const prices = await stripe.prices.list({ limit: 1 });
        console.log("✅ Stripe API call successful");
        
        return NextResponse.json({
          success: true,
          envCheck,
          stripeConnectionTest: "success",
          priceCount: prices.data.length,
          message: "Debug checkout endpoint working correctly"
        });
      } catch (apiError: any) {
        console.error("❌ Stripe API error:", apiError);
        return NextResponse.json({
          success: false,
          envCheck,
          stripeConnectionTest: "failed",
          stripeApiError: apiError.message,
          message: "Stripe API call failed"
        }, { status: 500 });
      }
    } catch (stripeError: any) {
      console.error("❌ Stripe initialization error:", stripeError);
      return NextResponse.json({
        success: false,
        envCheck,
        stripeInitError: stripeError.message,
        message: "Stripe initialization failed"
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("❌ Debug checkout error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Debug checkout endpoint failed"
    }, { status: 500 });
  }
}

// Add POST method to test account lookup
export async function POST(req: NextRequest) {
  try {
    console.log("🔍 Testing account lookup");
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { userId } = requestBody;
    console.log("📊 Request:", { userId });
    
    if (!userId) {
      console.error("❌ Missing userId");
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
    }

    // Initialize Supabase client (same as checkout API)
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (supabaseError) {
      console.error("❌ Failed to create Supabase client:", supabaseError);
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Test account lookup (same as checkout API)
    console.log("🔍 Fetching account data");
    try {
      const { data: account, error } = await supabase
        .from("accounts")
        .select("stripe_customer_id, plan, email")
        .eq("id", userId)
        .single();
      
      if (error) {
        console.error("❌ Account query error:", error);
        return NextResponse.json({ 
          error: "Account not found", 
          details: error.message,
          code: error.code 
        }, { status: 404 });
      }
      
      if (!account) {
        console.error("❌ Account not found - no data returned");
        return NextResponse.json({ error: "Account not found - no data" }, { status: 404 });
      }
      
      console.log("✅ Account found:", account);
      
      return NextResponse.json({
        success: true,
        account: {
          hasStripeCustomer: !!account.stripe_customer_id,
          currentPlan: account.plan,
          hasEmail: !!account.email
        },
        message: "Account lookup successful"
      });
      
    } catch (accountError: any) {
      console.error("❌ Error fetching account:", accountError);
      return NextResponse.json({ 
        error: "Failed to fetch account data", 
        details: accountError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("❌ Debug account lookup error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Debug account lookup failed"
    }, { status: 500 });
  }
} 