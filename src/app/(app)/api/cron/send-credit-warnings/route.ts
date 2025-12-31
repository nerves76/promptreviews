/**
 * Cron Job: Send Credit Warnings
 *
 * Runs daily at 8am UTC to:
 * 1. Warn users with low credit balance (< 20% of monthly allocation)
 * 2. Warn about upcoming scheduled checks that may fail due to insufficient credits
 *
 * Security: Uses CRON_SECRET_TOKEN for authorization.
 *
 * Features checked:
 * - Low balance warning (max 2 per billing period)
 * - Geo-grid checks
 * - Rank tracking checks
 * - LLM visibility checks
 * - Concept schedule checks
 * - Backlink checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateGeogridCost,
  getBalance,
  ensureBalanceExists,
  getTierCredits,
} from '@/lib/credits';
import { calculateRankCheckCost } from '@/features/rank-tracking';
import { calculateLLMCheckCost } from '@/features/llm-visibility/services/credits';
import { calculateConceptScheduleCost } from '@/features/concept-schedule/services/credits';
import { BACKLINK_CREDIT_COSTS } from '@/features/backlinks/utils/types';
import { sendNotificationToAccount } from '@/utils/notifications';

// Only send one warning per 24 hours per feature
const WARNING_COOLDOWN_HOURS = 24;
// Max low balance warnings per billing period
const MAX_LOW_BALANCE_WARNINGS = 2;
// Low balance threshold percentage
const LOW_BALANCE_THRESHOLD_PERCENT = 0.20;

interface WarningResult {
  accountId: string;
  feature: string;
  configId?: string;
  required: number;
  available: number;
  status: 'warning_sent' | 'sufficient' | 'cooldown' | 'error' | 'max_warnings' | 'free_account';
  scheduledFor?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔔 [Credit Warnings] Starting credit warning job');

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
      console.error('❌ [Credit Warnings] Invalid cron authorization token');
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

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const cooldownTime = new Date(now.getTime() - WARNING_COOLDOWN_HOURS * 60 * 60 * 1000);

    const results = {
      lowBalanceWarnings: 0,
      upcomingWarnings: 0,
      sufficientCredits: 0,
      skippedCooldown: 0,
      skippedMaxWarnings: 0,
      skippedFreeAccount: 0,
      errors: 0,
      details: [] as WarningResult[],
    };

    // =========================================================================
    // SECTION 1: Low Balance Warnings
    // =========================================================================
    console.log('📊 [Credit Warnings] Checking low balance warnings...');

    // Get all accounts with active schedules (any feature)
    const { data: accountsWithSchedules } = await supabase
      .from('accounts')
      .select('id, plan, is_free_account, low_balance_warning_count')
      .or(`
        id.in.(select account_id from gg_configs where is_enabled = true and schedule_frequency is not null),
        id.in.(select account_id from rank_keyword_groups where is_enabled = true and schedule_frequency is not null),
        id.in.(select account_id from llm_visibility_schedules where is_enabled = true and schedule_frequency is not null),
        id.in.(select account_id from concept_schedules where is_enabled = true and schedule_frequency is not null),
        id.in.(select account_id from backlink_domains where is_enabled = true and schedule_frequency is not null)
      `);

    // Get unique accounts with any active schedule
    const uniqueAccountIds = new Set<string>();

    // Query each table separately for accounts with active schedules
    const [ggAccounts, rankAccounts, llmAccounts, conceptAccounts, backlinkAccounts] = await Promise.all([
      supabase.from('gg_configs').select('account_id').eq('is_enabled', true).not('schedule_frequency', 'is', null),
      supabase.from('rank_keyword_groups').select('account_id').eq('is_enabled', true).not('schedule_frequency', 'is', null),
      supabase.from('llm_visibility_schedules').select('account_id').eq('is_enabled', true).not('schedule_frequency', 'is', null),
      supabase.from('concept_schedules').select('account_id').eq('is_enabled', true).not('schedule_frequency', 'is', null),
      supabase.from('backlink_domains').select('account_id').eq('is_enabled', true).not('schedule_frequency', 'is', null),
    ]);

    [ggAccounts.data, rankAccounts.data, llmAccounts.data, conceptAccounts.data, backlinkAccounts.data]
      .forEach(accounts => accounts?.forEach(a => uniqueAccountIds.add(a.account_id)));

    console.log(`📊 [Credit Warnings] Found ${uniqueAccountIds.size} accounts with active schedules`);

    // Check each account for low balance
    for (const accountId of uniqueAccountIds) {
      try {
        // Get account details
        const { data: account } = await supabase
          .from('accounts')
          .select('id, plan, is_free_account, low_balance_warning_count')
          .eq('id', accountId)
          .single();

        if (!account) continue;

        // Skip free accounts
        if (account.is_free_account) {
          results.skippedFreeAccount++;
          results.details.push({
            accountId,
            feature: 'low_balance',
            required: 0,
            available: 0,
            status: 'free_account',
          });
          continue;
        }

        // Check if max warnings already sent this billing period
        const warningCount = account.low_balance_warning_count || 0;
        if (warningCount >= MAX_LOW_BALANCE_WARNINGS) {
          results.skippedMaxWarnings++;
          results.details.push({
            accountId,
            feature: 'low_balance',
            required: 0,
            available: 0,
            status: 'max_warnings',
          });
          continue;
        }

        // Get current balance first
        await ensureBalanceExists(supabase, accountId);
        const balance = await getBalance(supabase, accountId);

        // Get monthly credits for this tier
        const monthlyCredits = await getTierCredits(supabase, account.plan || 'free');

        // Calculate base amount = monthly allocation + purchased credits
        // This way, users who buy credits have a proportionally higher threshold
        const baseAmount = monthlyCredits + balance.purchasedCredits;

        // Skip if no credits to track (free plan with no purchases)
        if (baseAmount === 0) continue;

        // Calculate threshold as 20% of base amount
        const threshold = Math.floor(baseAmount * LOW_BALANCE_THRESHOLD_PERCENT);

        // Check if below threshold
        if (balance.totalCredits >= threshold) {
          results.sufficientCredits++;
          continue;
        }

        // Send low balance warning
        console.log(`⚠️ [Credit Warnings] Low balance for ${accountId}: ${balance.totalCredits}/${threshold} threshold (base: ${baseAmount})`);

        await sendNotificationToAccount(accountId, 'credit_balance_low', {
          available: balance.totalCredits,
          monthlyCredits,
          purchasedCredits: balance.purchasedCredits,
          threshold,
        });

        // Increment warning count
        await supabase
          .from('accounts')
          .update({ low_balance_warning_count: warningCount + 1 })
          .eq('id', accountId);

        results.lowBalanceWarnings++;
        results.details.push({
          accountId,
          feature: 'low_balance',
          required: threshold,
          available: balance.totalCredits,
          status: 'warning_sent',
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ [Credit Warnings] Error checking low balance for ${accountId}:`, error);
        results.errors++;
      }
    }

    // =========================================================================
    // SECTION 2: Geo-Grid Upcoming Checks
    // =========================================================================
    console.log('📍 [Credit Warnings] Checking geo-grid upcoming checks...');

    const { data: upcomingGeoGrids } = await supabase
      .from('gg_configs')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .gte('next_scheduled_at', now.toISOString())
      .lte('next_scheduled_at', in24Hours.toISOString());

    for (const config of upcomingGeoGrids || []) {
      try {
        // Skip if warned recently
        if (config.last_credit_warning_sent_at && new Date(config.last_credit_warning_sent_at) > cooldownTime) {
          results.skippedCooldown++;
          continue;
        }

        // Count keywords
        const { count: keywordCount } = await supabase
          .from('gg_tracked_keywords')
          .select('*', { count: 'exact', head: true })
          .eq('config_id', config.id)
          .eq('is_enabled', true);

        if (!keywordCount) continue;

        // Calculate cost
        const pointCount = config.check_points?.length || 1;
        const gridSize = Math.sqrt(pointCount);
        const requiredCredits = calculateGeogridCost(gridSize, keywordCount);

        // Check balance
        await ensureBalanceExists(supabase, config.account_id);
        const balance = await getBalance(supabase, config.account_id);

        if (balance.totalCredits >= requiredCredits) {
          results.sufficientCredits++;
          continue;
        }

        // Format scheduled time
        const scheduledFor = new Date(config.next_scheduled_at).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        });

        // Send warning
        console.log(`⚠️ [Credit Warnings] Geo-grid warning for ${config.account_id}`);
        await sendNotificationToAccount(config.account_id, 'credit_warning_upcoming', {
          required: requiredCredits,
          available: balance.totalCredits,
          scheduledFor,
          feature: 'geo_grid',
        });

        // Update timestamp
        await supabase
          .from('gg_configs')
          .update({ last_credit_warning_sent_at: now.toISOString() })
          .eq('id', config.id);

        results.upcomingWarnings++;
        results.details.push({
          accountId: config.account_id,
          feature: 'geo_grid',
          configId: config.id,
          required: requiredCredits,
          available: balance.totalCredits,
          status: 'warning_sent',
          scheduledFor,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ [Credit Warnings] Error processing geo-grid ${config.id}:`, error);
        results.errors++;
      }
    }

    // =========================================================================
    // SECTION 3: Rank Tracking Upcoming Checks
    // =========================================================================
    console.log('📈 [Credit Warnings] Checking rank tracking upcoming checks...');

    const { data: upcomingRankGroups } = await supabase
      .from('rank_keyword_groups')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .gte('next_scheduled_at', now.toISOString())
      .lte('next_scheduled_at', in24Hours.toISOString());

    for (const group of upcomingRankGroups || []) {
      try {
        // Skip if warned recently
        if (group.last_credit_warning_sent_at && new Date(group.last_credit_warning_sent_at) > cooldownTime) {
          results.skippedCooldown++;
          continue;
        }

        // Count keywords
        const { count: keywordCount } = await supabase
          .from('rank_group_keywords')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('is_enabled', true);

        if (!keywordCount) continue;

        // Calculate cost
        const requiredCredits = calculateRankCheckCost(keywordCount);

        // Check balance
        await ensureBalanceExists(supabase, group.account_id);
        const balance = await getBalance(supabase, group.account_id);

        if (balance.totalCredits >= requiredCredits) {
          results.sufficientCredits++;
          continue;
        }

        // Format scheduled time
        const scheduledFor = new Date(group.next_scheduled_at).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        });

        // Send warning
        console.log(`⚠️ [Credit Warnings] Rank tracking warning for ${group.account_id}`);
        await sendNotificationToAccount(group.account_id, 'credit_warning_upcoming', {
          required: requiredCredits,
          available: balance.totalCredits,
          scheduledFor,
          feature: 'rank_tracking',
        });

        // Update timestamp
        await supabase
          .from('rank_keyword_groups')
          .update({ last_credit_warning_sent_at: now.toISOString() })
          .eq('id', group.id);

        results.upcomingWarnings++;
        results.details.push({
          accountId: group.account_id,
          feature: 'rank_tracking',
          configId: group.id,
          required: requiredCredits,
          available: balance.totalCredits,
          status: 'warning_sent',
          scheduledFor,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ [Credit Warnings] Error processing rank group ${group.id}:`, error);
        results.errors++;
      }
    }

    // =========================================================================
    // SECTION 4: LLM Visibility Upcoming Checks
    // =========================================================================
    console.log('🤖 [Credit Warnings] Checking LLM visibility upcoming checks...');

    const { data: upcomingLLMSchedules } = await supabase
      .from('llm_visibility_schedules')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .gte('next_scheduled_at', now.toISOString())
      .lte('next_scheduled_at', in24Hours.toISOString());

    for (const schedule of upcomingLLMSchedules || []) {
      try {
        // Skip if warned recently
        if (schedule.last_credit_warning_sent_at && new Date(schedule.last_credit_warning_sent_at) > cooldownTime) {
          results.skippedCooldown++;
          continue;
        }

        // Get keyword with questions
        const { data: keyword } = await supabase
          .from('keywords')
          .select('related_questions')
          .eq('id', schedule.keyword_id)
          .single();

        const questionCount = keyword?.related_questions?.length || 0;
        if (!questionCount) continue;

        // Calculate cost
        const providers = schedule.providers || [];
        const requiredCredits = calculateLLMCheckCost(questionCount, providers);

        // Check balance
        await ensureBalanceExists(supabase, schedule.account_id);
        const balance = await getBalance(supabase, schedule.account_id);

        if (balance.totalCredits >= requiredCredits) {
          results.sufficientCredits++;
          continue;
        }

        // Format scheduled time
        const scheduledFor = new Date(schedule.next_scheduled_at).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        });

        // Send warning
        console.log(`⚠️ [Credit Warnings] LLM visibility warning for ${schedule.account_id}`);
        await sendNotificationToAccount(schedule.account_id, 'credit_warning_upcoming', {
          required: requiredCredits,
          available: balance.totalCredits,
          scheduledFor,
          feature: 'llm_visibility',
        });

        // Update timestamp
        await supabase
          .from('llm_visibility_schedules')
          .update({ last_credit_warning_sent_at: now.toISOString() })
          .eq('id', schedule.id);

        results.upcomingWarnings++;
        results.details.push({
          accountId: schedule.account_id,
          feature: 'llm_visibility',
          configId: schedule.id,
          required: requiredCredits,
          available: balance.totalCredits,
          status: 'warning_sent',
          scheduledFor,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ [Credit Warnings] Error processing LLM schedule ${schedule.id}:`, error);
        results.errors++;
      }
    }

    // =========================================================================
    // SECTION 5: Concept Schedule Upcoming Checks
    // =========================================================================
    console.log('📋 [Credit Warnings] Checking concept schedule upcoming checks...');

    const { data: upcomingConcepts } = await supabase
      .from('concept_schedules')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .gte('next_scheduled_at', now.toISOString())
      .lte('next_scheduled_at', in24Hours.toISOString());

    for (const schedule of upcomingConcepts || []) {
      try {
        // Skip if warned recently
        if (schedule.last_credit_warning_sent_at && new Date(schedule.last_credit_warning_sent_at) > cooldownTime) {
          results.skippedCooldown++;
          continue;
        }

        // Calculate cost
        const costBreakdown = await calculateConceptScheduleCost(
          supabase,
          schedule.account_id,
          schedule.keyword_id,
          {
            searchRankEnabled: schedule.search_rank_enabled,
            geoGridEnabled: schedule.geo_grid_enabled,
            llmVisibilityEnabled: schedule.llm_visibility_enabled,
            llmProviders: schedule.llm_providers,
            reviewMatchingEnabled: schedule.review_matching_enabled,
          }
        );

        const requiredCredits = costBreakdown.total;
        if (!requiredCredits) continue;

        // Check balance
        await ensureBalanceExists(supabase, schedule.account_id);
        const balance = await getBalance(supabase, schedule.account_id);

        if (balance.totalCredits >= requiredCredits) {
          results.sufficientCredits++;
          continue;
        }

        // Format scheduled time
        const scheduledFor = new Date(schedule.next_scheduled_at).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        });

        // Send warning
        console.log(`⚠️ [Credit Warnings] Concept schedule warning for ${schedule.account_id}`);
        await sendNotificationToAccount(schedule.account_id, 'credit_warning_upcoming', {
          required: requiredCredits,
          available: balance.totalCredits,
          scheduledFor,
          feature: 'concept_schedule',
        });

        // Update timestamp
        await supabase
          .from('concept_schedules')
          .update({ last_credit_warning_sent_at: now.toISOString() })
          .eq('id', schedule.id);

        results.upcomingWarnings++;
        results.details.push({
          accountId: schedule.account_id,
          feature: 'concept_schedule',
          configId: schedule.id,
          required: requiredCredits,
          available: balance.totalCredits,
          status: 'warning_sent',
          scheduledFor,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ [Credit Warnings] Error processing concept schedule ${schedule.id}:`, error);
        results.errors++;
      }
    }

    // =========================================================================
    // SECTION 6: Backlink Upcoming Checks
    // =========================================================================
    console.log('🔗 [Credit Warnings] Checking backlink upcoming checks...');

    const { data: upcomingBacklinks } = await supabase
      .from('backlink_domains')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .gte('next_scheduled_at', now.toISOString())
      .lte('next_scheduled_at', in24Hours.toISOString());

    for (const domain of upcomingBacklinks || []) {
      try {
        // Skip if warned recently
        if (domain.last_credit_warning_sent_at && new Date(domain.last_credit_warning_sent_at) > cooldownTime) {
          results.skippedCooldown++;
          continue;
        }

        // Fixed cost for backlink checks
        const requiredCredits = BACKLINK_CREDIT_COSTS.full;

        // Check balance
        await ensureBalanceExists(supabase, domain.account_id);
        const balance = await getBalance(supabase, domain.account_id);

        if (balance.totalCredits >= requiredCredits) {
          results.sufficientCredits++;
          continue;
        }

        // Format scheduled time
        const scheduledFor = new Date(domain.next_scheduled_at).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        });

        // Send warning
        console.log(`⚠️ [Credit Warnings] Backlink warning for ${domain.account_id}`);
        await sendNotificationToAccount(domain.account_id, 'credit_warning_upcoming', {
          required: requiredCredits,
          available: balance.totalCredits,
          scheduledFor,
          feature: 'backlinks',
        });

        // Update timestamp
        await supabase
          .from('backlink_domains')
          .update({ last_credit_warning_sent_at: now.toISOString() })
          .eq('id', domain.id);

        results.upcomingWarnings++;
        results.details.push({
          accountId: domain.account_id,
          feature: 'backlinks',
          configId: domain.id,
          required: requiredCredits,
          available: balance.totalCredits,
          status: 'warning_sent',
          scheduledFor,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ [Credit Warnings] Error processing backlink domain ${domain.id}:`, error);
        results.errors++;
      }
    }

    // =========================================================================
    // SUMMARY
    // =========================================================================
    const duration = Date.now() - startTime;
    console.log(`✅ [Credit Warnings] Job complete in ${duration}ms`);
    console.log(`   Low balance warnings: ${results.lowBalanceWarnings}`);
    console.log(`   Upcoming warnings: ${results.upcomingWarnings}`);
    console.log(`   Sufficient credits: ${results.sufficientCredits}`);
    console.log(`   Skipped (cooldown): ${results.skippedCooldown}`);
    console.log(`   Skipped (max warnings): ${results.skippedMaxWarnings}`);
    console.log(`   Skipped (free account): ${results.skippedFreeAccount}`);
    console.log(`   Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      summary: {
        lowBalanceWarnings: results.lowBalanceWarnings,
        upcomingWarnings: results.upcomingWarnings,
        sufficientCredits: results.sufficientCredits,
        skippedCooldown: results.skippedCooldown,
        skippedMaxWarnings: results.skippedMaxWarnings,
        skippedFreeAccount: results.skippedFreeAccount,
        errors: results.errors,
      },
      details: results.details,
    });
  } catch (error) {
    console.error('❌ [Credit Warnings] Fatal error in cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
