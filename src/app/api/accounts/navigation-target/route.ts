import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";

/**
 * Determine where to navigate an account based on its setup status
 * Used by BusinessGuard and other navigation logic
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        target: '/auth/sign-in',
        reason: "Not authenticated"
      });
    }

    // Get the account ID from query params or use the user's selected account
    const searchParams = req.nextUrl.searchParams;
    const requestedAccountId = searchParams.get('accountId');
    const accountId = requestedAccountId || await getRequestAccountId(req, user.id, supabase);

    if (!accountId) {
      // No account exists - need to create business (which will create account)
      return NextResponse.json({
        target: '/dashboard/create-business',
        reason: "No account found - need to create business"
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
      return NextResponse.json({
        target: '/dashboard',
        reason: "No access to requested account"
      });
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({
        target: '/dashboard',
        reason: "Account not found"
      });
    }

    // Determine navigation based on account state
    const plan = account.plan;
    const businessCreationComplete = account.business_creation_complete || false;
    const isFreeAccount = account.is_free_account || plan === 'free';

    // Logic for navigation
    if (!businessCreationComplete && (!plan || plan === 'no_plan')) {
      // Business not created yet - go to create business
      return NextResponse.json({
        target: '/dashboard/create-business',
        reason: "Business creation not complete",
        accountId
      });
    } else if (businessCreationComplete && (!plan || plan === 'no_plan') && !isFreeAccount) {
      // Business created but no plan selected - go to dashboard (pricing modal will show)
      return NextResponse.json({
        target: '/dashboard',
        reason: "Business complete but no plan selected - need pricing modal",
        showPricingModal: true,
        accountId
      });
    } else {
      // All good - go to dashboard
      return NextResponse.json({
        target: '/dashboard',
        reason: "Account setup complete",
        accountId
      });
    }

  } catch (error: any) {
    console.error('Error checking navigation target:', error);
    return NextResponse.json(
      {
        target: '/dashboard',
        reason: error?.message || "Error determining navigation"
      }
    );
  }
}