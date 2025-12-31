/**
 * Cron Job: Refresh Monthly Credits
 *
 * Runs at 23:00 UTC on days 28-31 of each month.
 * Only processes if today is the LAST day of the month.
 * This ensures credits are refreshed BEFORE the 1st, so scheduled
 * geo-grid checks on the 1st have credits available.
 *
 * Actions:
 * 1. Expire remaining included credits from the current month
 * 2. Grant new monthly included credits based on account tier
 *
 * Security: Uses CRON_SECRET_TOKEN for authorization.
 *
 * Credit allocation (in priority order):
 * 1. monthly_credit_allocation (if set) - custom per-account override
 * 2. Plan tier default:
 *    - free: 0 credits (skipped, unless is_client_account)
 *    - grower: 100 credits
 *    - builder: 200 credits
 *    - maven: 400 credits
 * 3. Client accounts (is_client_account=true): 100 credits default
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  credit,
  getTierCredits,
  ensureBalanceExists,
} from '@/lib/credits';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔄 [Monthly Credits] Starting credit refresh job');

  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('❌ [Monthly Credits] Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if today is the last day of the month
    // This cron runs on days 28-31, but we only process on the actual last day
    const now = new Date();
    const today = now.getUTCDate();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    // Get the last day of the current month
    const lastDayOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

    if (today !== lastDayOfMonth) {
      console.log(`⏭️ [Monthly Credits] Today is ${today}, last day is ${lastDayOfMonth}. Skipping.`);
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Not the last day of the month (today: ${today}, last: ${lastDayOfMonth})`,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`📅 [Monthly Credits] Today is the last day of the month (${today})`);

    // Calculate next month for idempotency key (since we're granting credits for next month)
    const nextMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
    const monthKey = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}`;
    console.log(`🔑 [Monthly Credits] Using month key: ${monthKey}`);

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all eligible accounts:
    // 1. Paid plans (grower, builder, maven) that aren't free test accounts
    // 2. Client accounts (is_client_account=true) regardless of plan
    // 3. Accounts with custom monthly_credit_allocation set
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, plan, email, business_name, is_free_account, is_client_account, monthly_credit_allocation, subscription_status')
      .is('deleted_at', null)
      .or('and(plan.in.(grower,builder,maven),is_free_account.eq.false),is_client_account.eq.true,monthly_credit_allocation.not.is.null');

    if (accountsError) {
      console.error('❌ [Monthly Credits] Failed to fetch accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    console.log(`📋 [Monthly Credits] Found ${accounts?.length || 0} eligible accounts`);

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        accountId: string;
        plan: string;
        creditsGranted: number;
        creditsExpired: number;
        status: 'success' | 'skipped' | 'error';
        error?: string;
      }>,
    };

    // Default credits for client accounts without custom allocation
    const DEFAULT_CLIENT_CREDITS = 100;

    // Process each account
    for (const account of accounts || []) {
      try {
        // Determine monthly credits in priority order:
        // 1. Custom allocation (if set)
        // 2. Plan tier default
        // 3. Client account default
        let monthlyCredits: number;
        let creditSource: string;

        if (account.monthly_credit_allocation !== null && account.monthly_credit_allocation !== undefined) {
          // Custom allocation set - use it
          monthlyCredits = account.monthly_credit_allocation;
          creditSource = 'custom';
        } else if (['grower', 'builder', 'maven'].includes(account.plan) && !account.is_free_account) {
          // Paid plan - use tier default
          monthlyCredits = await getTierCredits(supabase, account.plan);
          creditSource = 'plan';
        } else if (account.is_client_account) {
          // Client account - use client default
          monthlyCredits = DEFAULT_CLIENT_CREDITS;
          creditSource = 'client';
        } else {
          // No credits for this account
          monthlyCredits = 0;
          creditSource = 'none';
        }

        if (monthlyCredits === 0) {
          results.skipped++;
          results.details.push({
            accountId: account.id,
            plan: account.plan,
            creditsGranted: 0,
            creditsExpired: 0,
            status: 'skipped',
          });
          continue;
        }

        console.log(`📊 [Monthly Credits] ${account.id}: ${monthlyCredits} credits (source: ${creditSource})`);

        // Ensure balance record exists
        await ensureBalanceExists(supabase, account.id);

        // Get current balance to see how many included credits to expire
        const { data: currentBalance } = await supabase
          .from('credit_balances')
          .select('included_credits, purchased_credits, last_monthly_grant_at')
          .eq('account_id', account.id)
          .single();

        const includedCreditsToExpire = currentBalance?.included_credits || 0;

        // Check if we already processed this account this month (idempotency)
        // monthKey is calculated at the top to use next month's key
        const idempotencyKey = `monthly_grant:${account.id}:${monthKey}`;

        // Check if this grant already exists
        const { data: existingGrant } = await supabase
          .from('credit_ledger')
          .select('id')
          .eq('idempotency_key', idempotencyKey)
          .single();

        if (existingGrant) {
          console.log(`⏭️ [Monthly Credits] Already processed ${account.id} this month`);
          results.skipped++;
          results.details.push({
            accountId: account.id,
            plan: account.plan,
            creditsGranted: 0,
            creditsExpired: 0,
            status: 'skipped',
          });
          continue;
        }

        // Step 1: Expire remaining included credits (if any)
        if (includedCreditsToExpire > 0) {
          const expireIdempotencyKey = `monthly_expire:${account.id}:${monthKey}`;

          // Get balance for after calculation
          const purchasedCredits = currentBalance?.purchased_credits || 0;
          const balanceAfterExpire = purchasedCredits; // Only purchased remain

          await supabase.from('credit_ledger').insert({
            account_id: account.id,
            amount: -includedCreditsToExpire,
            balance_after: balanceAfterExpire,
            credit_type: 'included',
            transaction_type: 'monthly_expire',
            idempotency_key: expireIdempotencyKey,
            description: `Monthly expiration: ${includedCreditsToExpire} included credits expired`,
          });

          // Update balance to remove included credits
          await supabase
            .from('credit_balances')
            .update({
              included_credits: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('account_id', account.id);

          console.log(`💨 [Monthly Credits] Expired ${includedCreditsToExpire} credits for ${account.id}`);
        }

        // Step 2: Grant new monthly included credits
        // Calculate expiration date (end of next month, since we're granting for next month)
        const endOfNextMonth = new Date(Date.UTC(currentYear, currentMonth + 2, 1));

        await credit(supabase, account.id, monthlyCredits, {
          creditType: 'included',
          transactionType: 'monthly_grant',
          idempotencyKey,
          description: `Monthly grant: ${monthlyCredits} credits for ${account.plan} plan`,
        });

        // Update expiration date
        await supabase
          .from('credit_balances')
          .update({
            included_credits_expire_at: endOfNextMonth.toISOString(),
            last_monthly_grant_at: new Date().toISOString(),
          })
          .eq('account_id', account.id);

        // Reset low balance warning count for new billing period
        await supabase
          .from('accounts')
          .update({ low_balance_warning_count: 0 })
          .eq('id', account.id);

        console.log(`✅ [Monthly Credits] Granted ${monthlyCredits} credits to ${account.id} (${account.plan})`);

        results.processed++;
        results.details.push({
          accountId: account.id,
          plan: account.plan,
          creditsGranted: monthlyCredits,
          creditsExpired: includedCreditsToExpire,
          status: 'success',
        });
      } catch (error: any) {
        console.error(`❌ [Monthly Credits] Error processing ${account.id}:`, error);

        // Check for idempotency error (already processed)
        if (error.name === 'IdempotencyError') {
          results.skipped++;
          results.details.push({
            accountId: account.id,
            plan: account.plan,
            creditsGranted: 0,
            creditsExpired: 0,
            status: 'skipped',
          });
        } else {
          results.errors++;
          results.details.push({
            accountId: account.id,
            plan: account.plan,
            creditsGranted: 0,
            creditsExpired: 0,
            status: 'error',
            error: error.message,
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [Monthly Credits] Job complete in ${duration}ms`);
    console.log(`   Processed: ${results.processed}, Skipped: ${results.skipped}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      summary: {
        total: accounts?.length || 0,
        processed: results.processed,
        skipped: results.skipped,
        errors: results.errors,
      },
      details: results.details,
    });
  } catch (error) {
    console.error('❌ [Monthly Credits] Fatal error in cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
