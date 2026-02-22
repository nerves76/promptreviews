import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import { createStripeClient, PRICE_IDS } from "@/lib/billing/config";
import { handleApiError } from "@/app/(app)/api/utils/errorResponse";


export async function POST(req: NextRequest) {
  const stripe = createStripeClient();
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(req, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: "No valid account found" }, { status: 403 });
    }

    // Get account with Stripe info
    const { data: account, error } = await supabaseAdmin
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!account.stripe_subscription_id) {
      return NextResponse.json({
        message: "No subscription to sync",
        currentPlan: account.plan,
        currentBilling: account.billing_period
      });
    }

    // Get subscription from Stripe
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
    } catch (err) {
      console.error("Failed to retrieve subscription:", err);
      return NextResponse.json({ error: "Failed to retrieve subscription from Stripe" }, { status: 400 });
    }

    if (!subscription.items?.data?.[0]) {
      return NextResponse.json({ error: "Invalid subscription structure" }, { status: 400 });
    }

    const currentStripePrice = subscription.items.data[0].price.id;

    // Determine actual plan and billing from Stripe price
    let actualPlan = null;
    let actualBilling = null;

    for (const [planKey, prices] of Object.entries(PRICE_IDS)) {
      if (currentStripePrice === prices.annual) {
        actualPlan = planKey;
        actualBilling = 'annual';
        break;
      } else if (currentStripePrice === prices.monthly) {
        actualPlan = planKey;
        actualBilling = 'monthly';
        break;
      }
    }

    if (!actualPlan || !actualBilling) {
      return NextResponse.json({
        error: "Could not determine plan from Stripe price",
        stripePriceId: currentStripePrice
      }, { status: 400 });
    }

    // Check if update is needed
    const needsUpdate = account.plan !== actualPlan || account.billing_period !== actualBilling;

    if (needsUpdate) {
      // Update database to match Stripe
      const { error: updateError } = await supabaseAdmin
        .from("accounts")
        .update({
          plan: actualPlan,
          billing_period: actualBilling,
          updated_at: new Date().toISOString()
        })
        .eq("id", accountId);

      if (updateError) {
        console.error("Failed to update account:", updateError);
        return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Subscription synced with Stripe",
        previousPlan: account.plan,
        previousBilling: account.billing_period,
        currentPlan: actualPlan,
        currentBilling: actualBilling,
        stripePriceId: currentStripePrice
      });
    }

    return NextResponse.json({
      success: true,
      message: "Subscription already in sync",
      currentPlan: actualPlan,
      currentBilling: actualBilling,
      stripePriceId: currentStripePrice
    });

  } catch (error: unknown) {
    return handleApiError(error, 'sync-subscription');
  }
}
