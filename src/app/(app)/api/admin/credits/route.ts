/**
 * Admin Credits API
 *
 * POST: Add credits to an account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { isAdmin } from '@/utils/admin';

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
