/**
 * Admin Credits API
 *
 * GET: Search accounts by business name or email (uses service role for full access)
 * POST: Add credits to an account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { isAdmin } from '@/utils/admin';

/**
 * GET /api/admin/credits?search=<query>
 * Search accounts by business name or email
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const adminStatus = await isAdmin(user.id, supabase);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchQuery = request.nextUrl.searchParams.get('search');
    if (!searchQuery?.trim()) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // Use service role for database operations (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Search accounts directly by business_name or email
    const { data: directMatches, error: searchError } = await serviceSupabase
      .from('accounts')
      .select(`
        id,
        email,
        business_name,
        plan,
        is_client_account,
        monthly_credit_allocation,
        credit_balances (
          included_credits,
          purchased_credits
        )
      `)
      .or(`business_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .is('deleted_at', null)
      .limit(10);

    if (searchError) throw searchError;

    // Also search in the businesses table
    const { data: businessMatches, error: businessError } = await serviceSupabase
      .from('businesses')
      .select('account_id, name')
      .ilike('name', `%${searchQuery}%`)
      .limit(10);

    if (businessError) throw businessError;

    // Get account IDs from business matches that aren't already in direct matches
    const directIds = new Set((directMatches || []).map((a: any) => a.id));
    const additionalAccountIds = (businessMatches || [])
      .map((b: any) => b.account_id)
      .filter((id: string) => id && !directIds.has(id));

    let additionalAccounts: any[] = [];
    if (additionalAccountIds.length > 0) {
      const { data: moreAccounts, error: moreError } = await serviceSupabase
        .from('accounts')
        .select(`
          id,
          email,
          business_name,
          plan,
          is_client_account,
          monthly_credit_allocation,
          credit_balances (
            included_credits,
            purchased_credits
          )
        `)
        .in('id', additionalAccountIds)
        .is('deleted_at', null);

      if (moreError) throw moreError;

      // Attach the matching business name for display
      additionalAccounts = (moreAccounts || []).map((account: any) => {
        const matchingBusiness = businessMatches?.find((b: any) => b.account_id === account.id);
        return {
          ...account,
          business_name: account.business_name || matchingBusiness?.name || null,
        };
      });
    }

    // Fetch tier defaults for reference
    const { data: tierDefaults } = await serviceSupabase
      .from('credit_included_by_tier')
      .select('tier, monthly_credits');

    const tierCreditsMap: Record<string, number> = {};
    (tierDefaults || []).forEach((t: any) => {
      tierCreditsMap[t.tier] = t.monthly_credits;
    });

    // Combine and transform results
    const allResults = [...(directMatches || []), ...additionalAccounts];
    const transformed = allResults.map((account: any) => {
      const planDefault = tierCreditsMap[account.plan] || 0;
      return {
        id: account.id,
        email: account.email,
        business_name: account.business_name,
        plan: account.plan,
        is_client_account: account.is_client_account,
        monthly_credit_allocation: account.monthly_credit_allocation,
        plan_default_credits: planDefault,
        effective_monthly_credits: account.monthly_credit_allocation ?? planDefault,
        credit_balance: account.credit_balances?.[0] || null,
      };
    });

    return NextResponse.json({ accounts: transformed, tierDefaults: tierCreditsMap });
  } catch (error: any) {
    console.error('Admin credits search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const adminStatus = await isAdmin(user.id, supabase);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { accountId, amount } = await request.json();

    if (!accountId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid request. Requires accountId and positive amount.' },
        { status: 400 }
      );
    }

    // Use service role for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify account exists
    const { data: account, error: accountError } = await serviceSupabase
      .from('accounts')
      .select('id, email, business_name')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Ensure credit_balances record exists
    const { data: existingBalance } = await serviceSupabase
      .from('credit_balances')
      .select('id, included_credits, purchased_credits')
      .eq('account_id', accountId)
      .single();

    if (!existingBalance) {
      // Create new balance record
      const { error: insertError } = await serviceSupabase
        .from('credit_balances')
        .insert({
          account_id: accountId,
          included_credits: amount,
          purchased_credits: 0,
        });

      if (insertError) {
        console.error('Failed to create credit balance:', insertError);
        return NextResponse.json({ error: 'Failed to create credit balance' }, { status: 500 });
      }
    } else {
      // Update existing balance
      const { error: updateError } = await serviceSupabase
        .from('credit_balances')
        .update({
          included_credits: existingBalance.included_credits + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('account_id', accountId);

      if (updateError) {
        console.error('Failed to update credit balance:', updateError);
        return NextResponse.json({ error: 'Failed to update credit balance' }, { status: 500 });
      }
    }

    // Log the transaction in credit_ledger
    const newBalance = (existingBalance?.included_credits || 0) + amount + (existingBalance?.purchased_credits || 0);

    const { error: ledgerError } = await serviceSupabase
      .from('credit_ledger')
      .insert({
        account_id: accountId,
        amount: amount,
        balance_after: newBalance,
        credit_type: 'included',
        transaction_type: 'manual_adjust',
        description: `Admin granted ${amount} credits`,
        created_by: user.id,
        idempotency_key: `admin_grant:${accountId}:${Date.now()}`,
      });

    if (ledgerError) {
      console.error('Failed to log credit transaction:', ledgerError);
      // Don't fail the request, credits were still added
    }

    console.log(`[Admin Credits] Added ${amount} credits to account ${accountId} (${account.email})`);

    return NextResponse.json({
      success: true,
      message: `Added ${amount} credits to ${account.business_name || account.email}`,
      newBalance,
    });
  } catch (error: any) {
    console.error('Admin credits API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
