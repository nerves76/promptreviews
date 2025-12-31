/**
 * Cron Job: Run Scheduled Concept Checks
 *
 * Runs every hour to execute concept-level scheduled checks.
 * Each concept schedule can include:
 * - Search rank tracking (desktop + mobile)
 * - Geo-grid local ranking
 * - LLM visibility checks
 *
 * Security: Uses CRON_SECRET_TOKEN for authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateConceptScheduleCost,
  checkConceptScheduleCredits,
  debitConceptScheduleCredits,
} from '@/features/concept-schedule/services/credits';
import { transformConceptScheduleRow } from '@/features/concept-schedule/utils/types';
import type { ConceptScheduleRow, ConceptCheckResult, ConceptCronSummary } from '@/features/concept-schedule/utils/types';
import type { LLMProvider } from '@/features/llm-visibility/utils/types';
import { sendNotificationToAccount } from '@/utils/notifications';
import { refundFeature, ensureBalanceExists } from '@/lib/credits';
import { KeywordMatchService } from '@/features/keywords/keywordMatchService';
import { syncKeywordUsageCounts } from '@/features/keywords/reprocessKeywordMatches';
import type { SyncedReviewRecord } from '@/features/google-reviews/reviewSyncService';

// Cost limit per check run (safety measure)
const MAX_COST_PER_RUN_USD = 10.0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔄 [Scheduled Concepts] Starting scheduled concept check job');

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
      console.error('❌ [Scheduled Concepts] Invalid cron authorization token');
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

    // Get all concept schedules that are due to run
    const { data: dueSchedules, error: schedulesError } = await supabase
      .from('concept_schedules')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .lte('next_scheduled_at', new Date().toISOString());

    if (schedulesError) {
      console.error('❌ [Scheduled Concepts] Failed to fetch schedules:', schedulesError);
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }

    console.log(`📋 [Scheduled Concepts] Found ${dueSchedules?.length || 0} concept schedules due to run`);

    const results: ConceptCronSummary = {
      processed: 0,
      successful: 0,
      partial: 0,
      skipped: 0,
      insufficientCredits: 0,
      errors: 0,
      totalCreditsUsed: 0,
      details: [],
    };

    // Process each schedule
    for (const scheduleRow of dueSchedules || []) {
      const schedule = transformConceptScheduleRow(scheduleRow as ConceptScheduleRow);
      const { accountId, keywordId, id: scheduleId } = schedule;

      const result: ConceptCheckResult = {
        scheduleId,
        keywordId,
        accountId,
        status: 'error',
        creditsUsed: 0,
      };

      try {
        // Check if any check types are enabled
        if (!schedule.searchRankEnabled && !schedule.geoGridEnabled && !schedule.llmVisibilityEnabled && !schedule.reviewMatchingEnabled) {
          console.log(`⏭️ [Scheduled Concepts] Schedule ${scheduleId} has no check types enabled, skipping`);
          result.status = 'skipped';
          result.error = 'No check types enabled';
          results.skipped++;
          results.details.push(result);

          // Still advance schedule
          await advanceSchedule(supabase, scheduleId);
          continue;
        }

        // Calculate cost
        const costBreakdown = await calculateConceptScheduleCost(
          supabase,
          accountId,
          keywordId,
          {
            searchRankEnabled: schedule.searchRankEnabled,
            geoGridEnabled: schedule.geoGridEnabled,
            llmVisibilityEnabled: schedule.llmVisibilityEnabled,
            llmProviders: schedule.llmProviders,
            reviewMatchingEnabled: schedule.reviewMatchingEnabled,
          }
        );

        // Check if there's anything to check
        if (costBreakdown.total === 0) {
          console.log(`⏭️ [Scheduled Concepts] Schedule ${scheduleId} has no items to check (0 cost), skipping`);
          result.status = 'skipped';
          result.error = 'No search terms or questions to check';
          results.skipped++;
          results.details.push(result);

          await advanceSchedule(supabase, scheduleId);
          continue;
        }

        // Ensure balance record exists
        await ensureBalanceExists(supabase, accountId);

        // Check credit balance
        const creditCheck = await checkConceptScheduleCredits(supabase, accountId, costBreakdown);

        if (!creditCheck.hasCredits) {
          console.log(`💸 [Scheduled Concepts] Insufficient credits for ${accountId}: need ${creditCheck.required}, have ${creditCheck.available}`);

          // Send notification
          await sendNotificationToAccount(accountId, 'credit_check_skipped', {
            required: creditCheck.required,
            available: creditCheck.available,
            feature: 'concept_schedule',
          });

          result.status = 'insufficient_credits';
          result.error = `Need ${creditCheck.required}, have ${creditCheck.available}`;
          results.insufficientCredits++;
          results.details.push(result);

          await advanceSchedule(supabase, scheduleId);
          continue;
        }

        // Generate idempotency key
        const checkId = `concept-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const idempotencyKey = `concept_schedule:${accountId}:${scheduleId}:${checkId}`;

        // Debit credits
        console.log(`💳 [Scheduled Concepts] Debiting ${costBreakdown.total} credits for ${accountId}`);
        await debitConceptScheduleCredits(
          supabase,
          accountId,
          costBreakdown,
          scheduleId,
          keywordId,
          idempotencyKey
        );

        result.creditsUsed = costBreakdown.total;

        // Run each enabled check type
        let hasAnySuccess = false;
        let hasAnyFailure = false;

        // 1. Search Rank Tracking
        if (schedule.searchRankEnabled && costBreakdown.searchRank.searchTermCount > 0) {
          try {
            const searchRankResult = await runSearchRankChecks(
              supabase,
              accountId,
              keywordId,
              checkId
            );
            result.searchRankResult = searchRankResult;
            if (searchRankResult.success) hasAnySuccess = true;
            else hasAnyFailure = true;
          } catch (error) {
            result.searchRankResult = {
              success: false,
              checksPerformed: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            hasAnyFailure = true;
          }
        }

        // 2. Geo-Grid Checks
        if (schedule.geoGridEnabled && costBreakdown.geoGrid.searchTermCount > 0) {
          try {
            const geoGridResult = await runGeoGridChecks(
              supabase,
              accountId,
              keywordId,
              checkId
            );
            result.geoGridResult = geoGridResult;
            if (geoGridResult.success) hasAnySuccess = true;
            else hasAnyFailure = true;
          } catch (error) {
            result.geoGridResult = {
              success: false,
              checksPerformed: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            hasAnyFailure = true;
          }
        }

        // 3. LLM Visibility Checks
        if (schedule.llmVisibilityEnabled && costBreakdown.llmVisibility.questionCount > 0) {
          try {
            const llmResult = await runLLMVisibilityChecks(
              supabase,
              accountId,
              keywordId,
              schedule.llmProviders,
              checkId
            );
            result.llmVisibilityResult = llmResult;
            if (llmResult.success) hasAnySuccess = true;
            else hasAnyFailure = true;
          } catch (error) {
            result.llmVisibilityResult = {
              success: false,
              checksPerformed: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            hasAnyFailure = true;
          }
        }

        // 4. Review Matching Checks
        if (schedule.reviewMatchingEnabled) {
          try {
            const reviewMatchResult = await runReviewMatchingChecks(
              supabase,
              accountId,
              keywordId,
              checkId
            );
            result.reviewMatchingResult = reviewMatchResult;
            if (reviewMatchResult.success) hasAnySuccess = true;
            else hasAnyFailure = true;
          } catch (error) {
            result.reviewMatchingResult = {
              success: false,
              reviewsScanned: 0,
              matchesFound: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            hasAnyFailure = true;
          }
        }

        // Determine overall status
        if (hasAnySuccess && !hasAnyFailure) {
          result.status = 'success';
          results.successful++;
        } else if (hasAnySuccess && hasAnyFailure) {
          result.status = 'partial';
          results.partial++;
        } else {
          result.status = 'error';
          results.errors++;

          // Refund on complete failure
          console.log(`❌ [Scheduled Concepts] All checks failed for ${scheduleId}, issuing refund`);
          await refundFeature(supabase, accountId, costBreakdown.total, idempotencyKey, {
            featureType: 'concept_schedule',
            featureMetadata: { reason: 'all_checks_failed', scheduleId },
            description: 'Refund: All concept schedule checks failed',
          });
          result.creditsUsed = 0;
        }

        results.totalCreditsUsed += result.creditsUsed;
        results.details.push(result);
        results.processed++;

        // Update schedule timestamps
        await advanceSchedule(supabase, scheduleId);

        console.log(`✅ [Scheduled Concepts] Completed ${scheduleId}: status=${result.status}`);

        // Small delay between schedules to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`❌ [Scheduled Concepts] Error processing ${scheduleId}:`, error);
        result.status = 'error';
        result.error = error.message;
        results.errors++;
        results.details.push(result);

        // Still advance schedule so we don't retry immediately
        await advanceSchedule(supabase, scheduleId);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [Scheduled Concepts] Job complete in ${duration}ms`);
    console.log(`   Processed: ${results.processed}, Successful: ${results.successful}, Partial: ${results.partial}, Skipped: ${results.skipped}, Insufficient: ${results.insufficientCredits}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      summary: {
        total: dueSchedules?.length || 0,
        processed: results.processed,
        successful: results.successful,
        partial: results.partial,
        skipped: results.skipped,
        insufficientCredits: results.insufficientCredits,
        errors: results.errors,
        totalCreditsUsed: results.totalCreditsUsed,
      },
      details: results.details,
    });
  } catch (error) {
    console.error('❌ [Scheduled Concepts] Fatal error in cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Advance the schedule to the next run time
 */
async function advanceSchedule(supabase: any, scheduleId: string) {
  await supabase
    .from('concept_schedules')
    .update({ last_scheduled_run_at: new Date().toISOString() })
    .eq('id', scheduleId);
}

/**
 * Run search rank tracking checks for all search terms under a keyword
 */
async function runSearchRankChecks(
  supabase: any,
  accountId: string,
  keywordId: string,
  checkId: string
): Promise<{ success: boolean; checksPerformed: number; error?: string }> {
  // Get keyword with search terms
  const { data: keyword, error: keywordError } = await supabase
    .from('keywords')
    .select('phrase, search_terms')
    .eq('id', keywordId)
    .single();

  if (keywordError || !keyword) {
    return { success: false, checksPerformed: 0, error: 'Keyword not found' };
  }

  const searchTerms = keyword.search_terms || [];
  if (searchTerms.length === 0) {
    // Use main phrase if no search terms
    searchTerms.push({ term: keyword.phrase, isCanonical: true });
  }

  // Get business for target domain
  const { data: business } = await supabase
    .from('businesses')
    .select('website')
    .eq('account_id', accountId)
    .single();

  const targetDomain = business?.website
    ? new URL(business.website.startsWith('http') ? business.website : `https://${business.website}`).hostname
    : null;

  if (!targetDomain) {
    return { success: false, checksPerformed: 0, error: 'No target website configured' };
  }

  let checksPerformed = 0;

  // Run rank checks for each term (desktop + mobile)
  for (const termObj of searchTerms) {
    const term = typeof termObj === 'string' ? termObj : termObj.term;

    for (const device of ['desktop', 'mobile']) {
      try {
        // TODO: Integrate with DataForSEO or existing rank checking service
        // For now, just log and store a placeholder
        console.log(`  🔍 Rank check: "${term}" (${device})`);

        // Store rank check result (placeholder - actual implementation would call DataForSEO)
        await supabase.from('rank_checks').insert({
          account_id: accountId,
          keyword_id: keywordId,
          search_query_used: term,
          device,
          position: null, // Would be populated by actual check
          checked_at: new Date().toISOString(),
        });

        checksPerformed++;
      } catch (error) {
        console.error(`  ❌ Rank check failed for "${term}" (${device}):`, error);
      }
    }
  }

  return {
    success: checksPerformed > 0,
    checksPerformed,
  };
}

/**
 * Run geo-grid checks for all search terms under a keyword
 */
async function runGeoGridChecks(
  supabase: any,
  accountId: string,
  keywordId: string,
  checkId: string
): Promise<{ success: boolean; checksPerformed: number; error?: string }> {
  // Get geo-grid config for this account
  const { data: config, error: configError } = await supabase
    .from('gg_configs')
    .select('*')
    .eq('account_id', accountId)
    .eq('is_enabled', true)
    .single();

  if (configError || !config) {
    return { success: false, checksPerformed: 0, error: 'No geo-grid config found' };
  }

  if (!config.target_place_id) {
    return { success: false, checksPerformed: 0, error: 'No target Place ID configured' };
  }

  // Get keyword with search terms
  const { data: keyword } = await supabase
    .from('keywords')
    .select('phrase, search_terms')
    .eq('id', keywordId)
    .single();

  if (!keyword) {
    return { success: false, checksPerformed: 0, error: 'Keyword not found' };
  }

  const searchTerms = keyword.search_terms || [];
  if (searchTerms.length === 0) {
    searchTerms.push({ term: keyword.phrase, isCanonical: true });
  }

  let checksPerformed = 0;

  // Run geo-grid checks for each term at each point
  for (const termObj of searchTerms) {
    const term = typeof termObj === 'string' ? termObj : termObj.term;

    for (const point of config.check_points || ['center']) {
      try {
        // TODO: Integrate with existing geo-grid rank checker service
        // For now, just log
        console.log(`  📍 Grid check: "${term}" at ${point}`);

        // Store check result (placeholder)
        await supabase.from('gg_checks').insert({
          account_id: accountId,
          config_id: config.id,
          keyword_id: keywordId,
          search_query: term,
          grid_point: point,
          position: null,
          checked_at: new Date().toISOString(),
        });

        checksPerformed++;
      } catch (error) {
        console.error(`  ❌ Grid check failed for "${term}" at ${point}:`, error);
      }
    }
  }

  return {
    success: checksPerformed > 0,
    checksPerformed,
  };
}

/**
 * Run LLM visibility checks for all questions under a keyword
 */
async function runLLMVisibilityChecks(
  supabase: any,
  accountId: string,
  keywordId: string,
  providers: LLMProvider[],
  checkId: string
): Promise<{ success: boolean; checksPerformed: number; error?: string }> {
  // Get keyword with related questions
  const { data: keyword } = await supabase
    .from('keywords')
    .select('related_questions')
    .eq('id', keywordId)
    .single();

  if (!keyword) {
    return { success: false, checksPerformed: 0, error: 'Keyword not found' };
  }

  const questions = keyword.related_questions || [];
  if (questions.length === 0) {
    return { success: false, checksPerformed: 0, error: 'No related questions' };
  }

  // Get business for target domain
  const { data: business } = await supabase
    .from('businesses')
    .select('website')
    .eq('account_id', accountId)
    .single();

  const targetDomain = business?.website
    ? new URL(business.website.startsWith('http') ? business.website : `https://${business.website}`).hostname
    : null;

  if (!targetDomain) {
    return { success: false, checksPerformed: 0, error: 'No target website configured' };
  }

  let checksPerformed = 0;

  // Run LLM checks for each question × provider
  for (const questionObj of questions) {
    const question = typeof questionObj === 'string' ? questionObj : questionObj.question;

    for (const provider of providers) {
      try {
        // TODO: Integrate with existing LLM visibility check service (DataForSEO)
        // For now, just log
        console.log(`  🤖 LLM check: "${question}" (${provider})`);

        // Store check result (placeholder)
        await supabase.from('llm_visibility_checks').insert({
          account_id: accountId,
          keyword_id: keywordId,
          question,
          llm_provider: provider,
          domain_cited: false,
          total_citations: 0,
          checked_at: new Date().toISOString(),
        });

        checksPerformed++;
      } catch (error) {
        console.error(`  ❌ LLM check failed for "${question}" (${provider}):`, error);
      }
    }
  }

  return {
    success: checksPerformed > 0,
    checksPerformed,
  };
}

/**
 * Derive sentiment from star rating
 */
const SENTIMENT_MAP: Record<number, 'positive' | 'neutral' | 'negative'> = {
  1: 'negative',
  2: 'negative',
  3: 'neutral',
  4: 'positive',
  5: 'positive',
};

function deriveSentiment(rating?: number | null): 'positive' | 'neutral' | 'negative' {
  if (!rating || rating < 1) return 'positive';
  return SENTIMENT_MAP[rating] || 'positive';
}

/**
 * Run review matching checks for a keyword
 * Scans all reviews for the account and matches against the keyword
 */
async function runReviewMatchingChecks(
  supabase: any,
  accountId: string,
  keywordId: string,
  checkId: string
): Promise<{ success: boolean; reviewsScanned: number; matchesFound: number; error?: string }> {
  try {
    console.log(`  📝 Review matching check for keyword ${keywordId}`);

    // Fetch all reviews for this account
    const { data: reviews, error: reviewsError } = await supabase
      .from('review_submissions')
      .select(`
        id,
        review_content,
        review_text_copy,
        reviewer_name,
        first_name,
        last_name,
        google_review_id,
        google_location_id,
        google_location_name,
        google_business_location_id,
        star_rating,
        created_at
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
    }

    // Clear existing matches for this keyword only
    await supabase
      .from('keyword_review_matches_v2')
      .delete()
      .eq('keyword_id', keywordId);

    // Convert reviews to SyncedReviewRecord format
    const records: SyncedReviewRecord[] = (reviews || [])
      .map((row: any) => {
        const body = row.review_content || row.review_text_copy || '';
        if (!body.trim()) return null;

        const name =
          row.reviewer_name ||
          [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
          'Customer';

        return {
          reviewSubmissionId: row.id,
          googleReviewId: row.google_review_id || row.id,
          reviewerName: name,
          reviewText: body,
          starRating: row.star_rating || 0,
          sentiment: deriveSentiment(row.star_rating),
          submittedAt: row.created_at || new Date().toISOString(),
          locationId: row.google_location_id || row.google_business_location_id || row.id,
          locationName: row.google_location_name || undefined,
          googleBusinessLocationId: row.google_business_location_id || null,
          accountId,
        };
      })
      .filter(Boolean) as SyncedReviewRecord[];

    // Run keyword matching
    const matcher = new KeywordMatchService(supabase, accountId);
    await matcher.process(records);

    // Sync usage counts
    await syncKeywordUsageCounts(supabase, accountId);

    // Get updated keyword stats
    const { data: keyword } = await supabase
      .from('keywords')
      .select('review_usage_count, alias_match_count')
      .eq('id', keywordId)
      .single();

    const matchesFound = (keyword?.review_usage_count || 0) + (keyword?.alias_match_count || 0);

    console.log(`  ✅ Review matching complete: ${records.length} reviews scanned, ${matchesFound} matches found`);

    return {
      success: true,
      reviewsScanned: records.length,
      matchesFound,
    };
  } catch (error) {
    console.error(`  ❌ Review matching failed:`, error);
    return {
      success: false,
      reviewsScanned: 0,
      matchesFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
