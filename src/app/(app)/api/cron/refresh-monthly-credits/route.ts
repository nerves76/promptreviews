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
 * Credit tiers:
 * - free: 0 credits (skipped)
 * - grower: 100 credits
 * - builder: 200 credits
 * - maven: 400 credits
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

    // Get all non-free, non-deleted accounts with active subscriptions
    // Free accounts and accounts without a paid plan get 0 credits
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, plan, email, business_name, is_free_account, subscription_status')
      .is('deleted_at', null)
      .in('plan', ['grower', 'builder', 'maven'])
      .eq('is_free_account', false);

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

    // Process each account
    for (const account of accounts || []) {
      try {
        // Get tier credits for this plan
        const monthlyCredits = await getTierCredits(supabase, account.plan);

        if (monthlyCredits === 0) {
          // This shouldn't happen with our filter, but handle it
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
