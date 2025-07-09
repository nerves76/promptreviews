import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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