import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/providers/supabase";
import { getAccountIdForUser } from "@/auth/utils/accounts";

/**
 * Check if the current account requires payment/plan selection
 * This centralizes the logic for determining when to show the pricing modal
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the account ID from query params or use the user's selected account
    const searchParams = req.nextUrl.searchParams;
    const requestedAccountId = searchParams.get('accountId');

    // Get the account to check - either the requested one or the user's current selection
    const accountId = requestedAccountId || await getAccountIdForUser(user.id);

    if (!accountId) {
      return NextResponse.json({
        requiresPayment: false,
        reason: "No account found"
      });
    }

    // Verify user has access to this account
    const { data: membership, error: memberError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Access denied to account" }, { status: 403 });
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if account has any businesses
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('account_id', accountId)
      .limit(1);

    const hasBusiness = !bizError && businesses && businesses.length > 0;

    // Determine if payment is required
    let requiresPayment = false;
    let reason = null;

    const now = new Date();
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    const plan = account.plan;
    const hasStripeCustomer = !!account.stripe_customer_id;
    const subscriptionStatus = account.subscription_status;
    const isFreeAccount = account.is_free_account || plan === 'free';

    // Business logic for payment requirement
    if (isFreeAccount) {
      // Free accounts never require payment
      requiresPayment = false;
      reason = "Free account";
    } else if (!hasBusiness) {
      // No business yet, don't require payment
      requiresPayment = false;
      reason = "No business created";
    } else if (subscriptionStatus === 'active') {
      // Active subscription never requires payment
      requiresPayment = false;
      reason = "Active subscription";
    } else if (plan === 'grower') {
      const trialActive = trialEnd && now <= trialEnd && !hasStripeCustomer;
      if (trialActive) {
        requiresPayment = false;
        reason = "Trial active";
      } else if (hasStripeCustomer) {
        // Paying grower but not active -> needs attention/payment
        requiresPayment = subscriptionStatus !== 'active';
        reason = "Subscription not active";
      } else {
        // Not paying grower: require payment only after trial expires
        requiresPayment = !!trialEnd && now > trialEnd;
        reason = trialEnd && now > trialEnd ? "Trial expired" : "Trial active";
      }
    } else if (plan === 'builder' || plan === 'maven') {
      // Paid plans require active subscription
      requiresPayment = subscriptionStatus !== 'active';
      reason = requiresPayment ? "Paid plan requires active subscription" : "Subscription active";
    } else if (!plan || plan === 'no_plan' || plan === 'NULL') {
      // No plan selected but business exists -> require plan selection
      requiresPayment = hasBusiness;
      reason = hasBusiness ? "Business exists but no plan selected" : "No business";
    }

    // Additional info for debugging
    const debugInfo = process.env.NODE_ENV === 'development' ? {
      accountId,
      plan,
      isFreeAccount,
      hasBusiness,
      hasStripeCustomer,
      subscriptionStatus,
      trialEnd: trialEnd?.toISOString(),
      now: now.toISOString()
    } : undefined;

    return NextResponse.json({
      requiresPayment,
      reason,
      accountId,
      ...(debugInfo && { debug: debugInfo })
    });

  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}