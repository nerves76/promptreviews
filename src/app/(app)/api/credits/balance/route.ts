/**
 * GET /api/credits/balance
 *
 * Get the current credit balance for the authenticated account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getBalance, ensureBalanceExists, getTierCredits } from '@/lib/credits';
import { createClient } from '@supabase/supabase-js';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Ensure balance record exists
    await ensureBalanceExists(serviceSupabase, accountId);

    // Get balance
    const balance = await getBalance(serviceSupabase, accountId);

    // Get account plan for tier information
    const { data: account } = await serviceSupabase
      .from('accounts')
      .select('plan, is_free_account')
      .eq('id', accountId)
      .single();

    const plan = account?.plan || 'free';
    const isFreeAccount = account?.is_free_account || false;

    // Get monthly credits for this tier
    const monthlyCredits = isFreeAccount ? 0 : await getTierCredits(serviceSupabase, plan);

    return NextResponse.json({
      accountId,
      plan,
      isFreeAccount,
      balance: {
        included: balance.includedCredits,
        purchased: balance.purchasedCredits,
        total: balance.totalCredits,
      },
      monthlyCredits,
      includedCreditsExpireAt: balance.includedCreditsExpireAt?.toISOString() || null,
      lastMonthlyGrantAt: balance.lastMonthlyGrantAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('❌ [Credits] Balance GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
