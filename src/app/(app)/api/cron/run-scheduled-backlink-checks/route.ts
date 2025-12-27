/**
 * Cron Job: Run Scheduled Backlink Checks
 *
 * Runs every hour to execute scheduled backlink checks.
 * Queries domains where next_scheduled_at <= NOW() and runs the checks.
 *
 * Security: Uses CRON_SECRET_TOKEN for authorization.
 *
 * Flow:
 * 1. Find all domains due to run
 * 2. For each domain:
 *    a. Check credit balance
 *    b. If insufficient: skip and update warning timestamp
 *    c. If sufficient: run check, update timestamps
 * 3. Return summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runBacklinkCheck, calculateBacklinkCheckCost } from '@/features/backlinks/services';
import { getBalance, debit } from '@/lib/credits';
import { BACKLINK_CREDIT_COSTS } from '@/features/backlinks/utils/types';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔄 [Scheduled BacklinkChecks] Starting scheduled check job');

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
      console.error('❌ [Scheduled BacklinkChecks] Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all domains that are due to run
    const { data: dueDomains, error: domainsError } = await supabase
      .from('backlink_domains')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .lte('next_scheduled_at', new Date().toISOString());

    if (domainsError) {
      console.error('❌ [Scheduled BacklinkChecks] Failed to fetch domains:', domainsError);
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    console.log(`📋 [Scheduled BacklinkChecks] Found ${dueDomains?.length || 0} domains due to run`);

    const results = {
      processed: 0,
      skipped: 0,
      insufficientCredits: 0,
      errors: 0,
      details: [] as Array<{
        domainId: string;
        domain: string;
        accountId: string;
        creditsUsed: number;
        status: 'success' | 'skipped' | 'insufficient_credits' | 'error';
        error?: string;
      }>,
    };

    // Process each domain
    for (const domainRow of dueDomains || []) {
      const accountId = domainRow.account_id;
      const domainId = domainRow.id;
      const domain = domainRow.domain;

      console.log(`\n📊 [Scheduled BacklinkChecks] Processing ${domain} (${domainId})`);

      try {
        // Calculate credit cost (full check for scheduled)
        const creditCost = BACKLINK_CREDIT_COSTS.full;

        // Check credit balance
        const balance = await getBalance(supabase, accountId);

        if (balance.totalCredits < creditCost) {
          console.log(`⚠️ [Scheduled BacklinkChecks] Insufficient credits for ${domain} (need ${creditCost}, have ${balance.totalCredits})`);

          // Update warning timestamp to avoid spamming
          const lastWarning = domainRow.last_credit_warning_sent_at;
          const hoursSinceWarning = lastWarning
            ? (Date.now() - new Date(lastWarning).getTime()) / (1000 * 60 * 60)
            : 24;

          if (hoursSinceWarning >= 24) {
            // Update warning timestamp
            await supabase
              .from('backlink_domains')
              .update({ last_credit_warning_sent_at: new Date().toISOString() })
              .eq('id', domainId);
          }

          results.insufficientCredits++;
          results.details.push({
            domainId,
            domain,
            accountId,
            creditsUsed: 0,
            status: 'insufficient_credits',
            error: `Need ${creditCost} credits, have ${balance.totalCredits}`,
          });
          continue;
        }

        // Debit credits
        const idempotencyKey = `backlinks:scheduled:${domainId}:${Date.now()}`;
        await debit(supabase, accountId, creditCost, {
          featureType: 'backlinks',
          featureMetadata: {
            domainId,
            domain,
            checkType: 'full',
            scheduled: true,
          },
          idempotencyKey,
          description: `Scheduled backlink check: ${domain}`,
        });

        // Run the check
        const checkResult = await runBacklinkCheck(
          {
            id: domainRow.id,
            accountId: domainRow.account_id,
            domain: domainRow.domain,
            scheduleFrequency: domainRow.schedule_frequency,
            scheduleDayOfWeek: domainRow.schedule_day_of_week,
            scheduleDayOfMonth: domainRow.schedule_day_of_month,
            scheduleHour: domainRow.schedule_hour,
            nextScheduledAt: domainRow.next_scheduled_at ? new Date(domainRow.next_scheduled_at) : null,
            lastScheduledRunAt: domainRow.last_scheduled_run_at ? new Date(domainRow.last_scheduled_run_at) : null,
            isEnabled: domainRow.is_enabled,
            lastCheckedAt: domainRow.last_checked_at ? new Date(domainRow.last_checked_at) : null,
            lastCreditWarningSentAt: domainRow.last_credit_warning_sent_at ? new Date(domainRow.last_credit_warning_sent_at) : null,
            createdAt: new Date(domainRow.created_at),
            updatedAt: new Date(domainRow.updated_at),
          },
          supabase,
          { checkType: 'full' }
        );

        if (checkResult.success) {
          // Update last_scheduled_run_at (trigger will update next_scheduled_at)
          await supabase
            .from('backlink_domains')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', domainId);

          console.log(`✅ [Scheduled BacklinkChecks] Successfully checked ${domain}`);

          results.processed++;
          results.details.push({
            domainId,
            domain,
            accountId,
            creditsUsed: creditCost,
            status: 'success',
          });
        } else {
          console.error(`❌ [Scheduled BacklinkChecks] Check failed for ${domain}:`, checkResult.error);

          results.errors++;
          results.details.push({
            domainId,
            domain,
            accountId,
            creditsUsed: creditCost,
            status: 'error',
            error: checkResult.error,
          });
        }

        // Small delay between checks to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ [Scheduled BacklinkChecks] Error processing ${domain}:`, error);

        results.errors++;
        results.details.push({
          domainId,
          domain,
          accountId,
          creditsUsed: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const elapsed = Date.now() - startTime;

    console.log(`\n✅ [Scheduled BacklinkChecks] Job completed in ${elapsed}ms`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Insufficient Credits: ${results.insufficientCredits}`);
    console.log(`   Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      elapsed,
      summary: {
        processed: results.processed,
        skipped: results.skipped,
        insufficientCredits: results.insufficientCredits,
        errors: results.errors,
      },
      details: results.details,
    });
  } catch (error) {
    console.error('❌ [Scheduled BacklinkChecks] Critical error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
