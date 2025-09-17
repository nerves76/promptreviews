import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/providers/supabase";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all accounts for this user
    const { data: userAccounts, error: accountsError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('user_id', user.id);

    if (accountsError) {
      return NextResponse.json({ error: "Failed to fetch user accounts" }, { status: 500 });
    }

    const accountIds = userAccounts?.map(a => a.account_id) || [];

    // Get account details including the new column
    const { data: accounts, error: detailsError } = await supabase
      .from('accounts')
      .select('id, plan, is_free_account, business_creation_complete, business_name, created_at')
      .in('id', accountIds);

    if (detailsError) {
      return NextResponse.json({ error: "Failed to fetch account details" }, { status: 500 });
    }

    // Check for businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, account_id, name')
      .in('account_id', accountIds);

    // Get stored selection
    const searchParams = req.nextUrl.searchParams;
    const checkStoredSelection = searchParams.get('checkStorage') === 'true';

    let storedSelection = null;
    if (checkStoredSelection && typeof window !== 'undefined') {
      storedSelection = localStorage.getItem(`promptreviews_selected_account_${user.id}`);
    }

    return NextResponse.json({
      user_id: user.id,
      user_email: user.email,
      accounts: accounts?.map(acc => ({
        ...acc,
        has_business: businesses?.some(b => b.account_id === acc.id) || false,
        should_show_pricing_modal: !acc.is_free_account &&
                                   acc.plan === 'no_plan' &&
                                   acc.business_creation_complete,
        should_redirect_to_create_business: !acc.is_free_account &&
                                            acc.plan === 'no_plan' &&
                                            !acc.business_creation_complete
      })),
      stored_selection: storedSelection,
      businesses: businesses
    });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}