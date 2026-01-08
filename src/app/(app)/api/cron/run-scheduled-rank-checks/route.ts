/**
 * Cron Job: Run Scheduled Rank Checks
 *
 * Runs every hour to execute scheduled SERP rank checks.
 * Queries groups where next_scheduled_at <= NOW() and runs the checks.
 *
 * Security: Uses CRON_SECRET for authorization.
 *
 * Flow:
 * 1. Find all groups due to run
 * 2. For each group:
 *    a. Check credit balance
 *    b. If insufficient: skip and send notification
 *    c. If sufficient: run checks, update timestamps
 * 3. Return summary
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import {
  runRankChecks,
  transformGroupToResponse,
  calculateRankCheckCost,
  checkRankTrackingCredits,
} from '@/features/rank-tracking';
import {
  debit,
  refundFeature,
  ensureBalanceExists,
} from '@/lib/credits';
import { sendNotificationToAccount } from '@/utils/notifications';
import { checkRankForDomain } from '@/features/rank-tracking/api/dataforseo-serp-client';

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('run-scheduled-rank-checks', async () => {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all groups that are due to run
    const { data: dueGroups, error: groupsError } = await supabase
      .from('rank_keyword_groups')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .lte('next_scheduled_at', new Date().toISOString());

    if (groupsError) {
      throw new Error('Failed to fetch configurations');
    }

    console.log(`📋 [Scheduled RankChecks] Found ${dueGroups?.length || 0} groups due to run`);

    const results = {
      processed: 0,
      skipped: 0,
      insufficientCredits: 0,
      errors: 0,
      details: [] as Array<{
        groupId: string;
        accountId: string;
        creditsUsed: number;
        checksPerformed: number;
        status: 'success' | 'skipped' | 'insufficient_credits' | 'error';
        error?: string;
      }>,
    };

    // Process each group
    for (const groupRow of dueGroups || []) {
      const accountId = groupRow.account_id;
      const groupId = groupRow.id;

      try {
        const group = transformGroupToResponse(groupRow);

        // Count tracked keywords
        const { count: keywordCount } = await supabase
          .from('rank_group_keywords')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('is_enabled', true);

        if (!keywordCount || keywordCount === 0) {
          console.log(`⏭️ [Scheduled RankChecks] Group ${groupId} has no keywords, skipping`);
          results.skipped++;
          results.details.push({
            groupId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'No tracked keywords',
          });

          // Still update last_scheduled_run_at to advance the schedule
          await supabase
            .from('rank_keyword_groups')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', groupId);

          continue;
        }

        // Get target domain from business
        const { data: business } = await supabase
          .from('businesses')
          .select('business_website')
          .eq('account_id', accountId)
          .single();

        if (!business?.business_website) {
          console.log(`⏭️ [Scheduled RankChecks] Group ${groupId} has no business website, skipping`);
          results.skipped++;
          results.details.push({
            groupId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'No business website configured',
          });

          await supabase
            .from('rank_keyword_groups')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', groupId);

          continue;
        }

        // Extract domain from website URL
        const targetDomain = extractDomain(business.business_website);

        // Calculate credit cost (1 per keyword)
        const creditCost = calculateRankCheckCost(keywordCount);

        // Ensure balance record exists
        await ensureBalanceExists(supabase, accountId);

        // Check credit balance
        const creditCheck = await checkRankTrackingCredits(supabase, accountId, keywordCount);

        if (!creditCheck.hasCredits) {
          console.log(`💸 [Scheduled RankChecks] Insufficient credits for ${accountId}: need ${creditCheck.required}, have ${creditCheck.available}`);

          // Send notification about skipped check
          await sendNotificationToAccount(accountId, 'credit_check_skipped', {
            required: creditCheck.required,
            available: creditCheck.available,
            feature: 'rank_tracking',
          });

          // Update last_scheduled_run_at to advance the schedule
          await supabase
            .from('rank_keyword_groups')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', groupId);

          results.insufficientCredits++;
          results.details.push({
            groupId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'insufficient_credits',
            error: `Need ${creditCheck.required}, have ${creditCheck.available}`,
          });
          continue;
        }

        // Generate idempotency key
        const checkId = `scheduled-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const idempotencyKey = `rank_tracking:${accountId}:${groupId}:${checkId}`;

        // Debit credits
        console.log(`💳 [Scheduled RankChecks] Debiting ${creditCost} credits for ${accountId}`);
        await debit(supabase, accountId, creditCost, {
          featureType: 'rank_tracking',
          featureMetadata: {
            groupId,
            keywordCount,
            checkId,
            scheduled: true,
          },
          idempotencyKey,
          description: `Scheduled rank check: ${keywordCount} keywords`,
        });

        // Get keywords with their search queries
        const { data: keywords } = await supabase
          .from('rank_group_keywords')
          .select(`
            id,
            keyword_id,
            target_url,
            keywords (
              id,
              phrase,
              search_query
            )
          `)
          .eq('group_id', groupId)
          .eq('is_enabled', true);

        // Run the checks
        console.log(`🔍 [Scheduled RankChecks] Running checks for group ${groupId}`);
        let checksPerformed = 0;
        let totalApiCost = 0;

        try {
          for (const keyword of keywords || []) {
            const kw = keyword.keywords as any;
            const searchQuery = kw?.search_query || kw?.phrase;

            if (!searchQuery) continue;

            try {
              const result = await checkRankForDomain({
                keyword: searchQuery,
                locationCode: group.locationCode,
                targetDomain,
                device: group.device,
                depth: 100,
              });

              // Extract SERP visibility metrics
              const paa = result.serpFeatures.peopleAlsoAsk;
              const ai = result.serpFeatures.aiOverview;
              const fs = result.serpFeatures.featuredSnippet;

              // Store result
              await supabase
                .from('rank_checks')
                .insert({
                  account_id: accountId,
                  group_id: groupId,
                  keyword_id: keyword.keyword_id,
                  search_query_used: searchQuery,
                  position: result.position,
                  found_url: result.url,
                  matched_target_url: keyword.target_url
                    ? result.url?.includes(keyword.target_url)
                    : null,
                  serp_features: result.serpFeatures,
                  top_competitors: result.topCompetitors,
                  api_cost_usd: result.cost,
                  checked_at: new Date().toISOString(),
                  // SERP visibility summary columns
                  paa_question_count: paa.questions.length,
                  paa_ours_count: paa.ourQuestionCount,
                  ai_overview_present: ai.present,
                  ai_overview_ours_cited: ai.isOursCited,
                  ai_overview_citation_count: ai.citations.length,
                  featured_snippet_present: fs.present,
                  featured_snippet_ours: fs.isOurs,
                });

              checksPerformed++;
              totalApiCost += result.cost;

              // Small delay between API calls
              await new Promise((resolve) => setTimeout(resolve, 200));

            } catch (keywordError) {
              console.error(`❌ [Scheduled RankChecks] Error checking keyword ${kw?.phrase}:`, keywordError);
            }
          }
        } catch (runError) {
          // Refund on complete failure
          console.error(`❌ [Scheduled RankChecks] Check failed for ${groupId}, refunding`);
          await refundFeature(supabase, accountId, creditCost, idempotencyKey, {
            featureType: 'rank_tracking',
            featureMetadata: { reason: 'scheduled_check_failed', error: String(runError) },
            description: 'Refund: Scheduled rank check failed',
          });
          throw runError;
        }

        // Update timestamps
        await supabase
          .from('rank_keyword_groups')
          .update({
            last_scheduled_run_at: new Date().toISOString(),
            last_checked_at: new Date().toISOString(),
          })
          .eq('id', groupId);

        // Track API usage
        await supabase
          .from('ai_usage')
          .insert({
            account_id: accountId,
            feature: 'rank_tracking',
            tokens_used: checksPerformed,
            cost_usd: totalApiCost,
            metadata: { groupId, scheduled: true },
          });

        console.log(`✅ [Scheduled RankChecks] Completed ${groupId}: ${checksPerformed} checks`);

        results.processed++;
        results.details.push({
          groupId,
          accountId,
          creditsUsed: creditCost,
          checksPerformed,
          status: 'success',
        });

        // Small delay between groups
        await new Promise((resolve) => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`❌ [Scheduled RankChecks] Error processing ${groupId}:`, error);
        results.errors++;
        results.details.push({
          groupId,
          accountId,
          creditsUsed: 0,
          checksPerformed: 0,
          status: 'error',
          error: error.message,
        });

        // Still advance schedule so we don't retry immediately
        await supabase
          .from('rank_keyword_groups')
          .update({ last_scheduled_run_at: new Date().toISOString() })
          .eq('id', groupId);
      }
    }

    return {
      success: true,
      summary: {
        total: dueGroups?.length || 0,
        processed: results.processed,
        skipped: results.skipped,
        insufficientCredits: results.insufficientCredits,
        errors: results.errors,
      },
    };
  });
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    let domain = url.toLowerCase();

    // Remove protocol
    domain = domain.replace(/^https?:\/\//, '');

    // Remove www
    domain = domain.replace(/^www\./, '');

    // Remove path and query
    domain = domain.split('/')[0];
    domain = domain.split('?')[0];

    return domain;
  } catch {
    return url;
  }
}
