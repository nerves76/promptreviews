/**
 * Cron Job: Run Scheduled LLM Visibility Checks
 *
 * Runs every hour to execute scheduled LLM visibility checks.
 * Queries keywords where next_scheduled_at <= NOW() and runs the checks.
 *
 * Security: Uses CRON_SECRET for authorization.
 *
 * Flow:
 * 1. Find all scheduled keywords due to run
 * 2. For each schedule:
 *    a. Check credit balance
 *    b. If insufficient: skip and send notification
 *    c. If sufficient: run checks, update timestamps
 * 3. Return summary
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import {
  LLMProvider,
  LLMVisibilityScheduleRow,
} from '@/features/llm-visibility/utils/types';
import {
  calculateLLMCheckCost,
  checkLLMVisibilityCredits,
} from '@/features/llm-visibility/services/credits';
import { runLLMChecks } from '@/features/llm-visibility/services/llm-checker';
import {
  debit,
  refundFeature,
  ensureBalanceExists,
} from '@/lib/credits';
import { sendNotificationToAccount } from '@/utils/notifications';

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('run-scheduled-llm-checks', async () => {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all schedules that are due to run
    const { data: dueSchedules, error: schedulesError } = await supabase
      .from('llm_visibility_schedules')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .lte('next_scheduled_at', new Date().toISOString());

    if (schedulesError) {
      throw new Error('Failed to fetch schedules');
    }

    console.log(`📋 [Scheduled LLMChecks] Found ${dueSchedules?.length || 0} schedules due to run`);

    const results = {
      processed: 0,
      skipped: 0,
      insufficientCredits: 0,
      errors: 0,
      details: [] as Array<{
        scheduleId: string;
        keywordId: string;
        accountId: string;
        creditsUsed: number;
        checksPerformed: number;
        status: 'success' | 'skipped' | 'insufficient_credits' | 'error';
        error?: string;
      }>,
    };

    // Process each schedule
    for (const scheduleRow of (dueSchedules || []) as LLMVisibilityScheduleRow[]) {
      const accountId = scheduleRow.account_id;
      const keywordId = scheduleRow.keyword_id;
      const scheduleId = scheduleRow.id;
      const providers = scheduleRow.providers as LLMProvider[];

      try {
        // Get keyword with related questions
        const { data: keyword, error: keywordError } = await supabase
          .from('keywords')
          .select('id, phrase, related_questions')
          .eq('id', keywordId)
          .eq('account_id', accountId)
          .single();

        if (keywordError || !keyword) {
          console.log(`⏭️ [Scheduled LLMChecks] Keyword ${keywordId} not found, skipping`);
          results.skipped++;
          results.details.push({
            scheduleId,
            keywordId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'Keyword not found',
          });

          // Update last_scheduled_run_at to advance the schedule
          await supabase
            .from('llm_visibility_schedules')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', scheduleId);

          continue;
        }

        // Extract question strings from related_questions (JSONB with { question, funnelStage, addedAt })
        const relatedQuestions = keyword.related_questions || [];
        const questions: string[] = relatedQuestions.map((q: { question: string } | string) =>
          typeof q === 'string' ? q : q.question
        ).filter(Boolean);

        if (questions.length === 0) {
          console.log(`⏭️ [Scheduled LLMChecks] Keyword ${keywordId} has no questions, skipping`);
          results.skipped++;
          results.details.push({
            scheduleId,
            keywordId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'No related questions',
          });

          await supabase
            .from('llm_visibility_schedules')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', scheduleId);

          continue;
        }

        // Get target domain from business
        const { data: business } = await supabase
          .from('businesses')
          .select('business_website')
          .eq('account_id', accountId)
          .single();

        if (!business?.business_website) {
          console.log(`⏭️ [Scheduled LLMChecks] Account ${accountId} has no business website, skipping`);
          results.skipped++;
          results.details.push({
            scheduleId,
            keywordId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'No business website configured',
          });

          await supabase
            .from('llm_visibility_schedules')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', scheduleId);

          continue;
        }

        // Extract domain from website URL
        const targetDomain = extractDomain(business.business_website);
        if (!targetDomain) {
          console.log(`⏭️ [Scheduled LLMChecks] Invalid business website for account ${accountId}`);
          results.skipped++;
          results.details.push({
            scheduleId,
            keywordId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'skipped',
            error: 'Invalid business website URL',
          });

          await supabase
            .from('llm_visibility_schedules')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', scheduleId);

          continue;
        }

        // Calculate credit cost
        const creditCost = calculateLLMCheckCost(questions.length, providers);

        // Ensure balance record exists
        await ensureBalanceExists(supabase, accountId);

        // Check credit balance
        const creditCheck = await checkLLMVisibilityCredits(
          supabase,
          accountId,
          questions.length,
          providers
        );

        if (!creditCheck.hasCredits) {
          console.log(
            `💸 [Scheduled LLMChecks] Insufficient credits for ${accountId}: ` +
            `need ${creditCheck.required}, have ${creditCheck.available}`
          );

          // Send notification about skipped check
          await sendNotificationToAccount(accountId, 'credit_check_skipped', {
            required: creditCheck.required,
            available: creditCheck.available,
            feature: 'llm_visibility',
          });

          // Update timestamps
          await supabase
            .from('llm_visibility_schedules')
            .update({
              last_scheduled_run_at: new Date().toISOString(),
              last_credit_warning_sent_at: new Date().toISOString(),
            })
            .eq('id', scheduleId);

          results.insufficientCredits++;
          results.details.push({
            scheduleId,
            keywordId,
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
        const idempotencyKey = `llm_visibility:${accountId}:${keywordId}:${checkId}`;

        // Debit credits
        console.log(`💳 [Scheduled LLMChecks] Debiting ${creditCost} credits for ${accountId}`);
        await debit(supabase, accountId, creditCost, {
          featureType: 'llm_visibility',
          featureMetadata: {
            keywordId,
            questionCount: questions.length,
            providers,
            checkId,
            scheduled: true,
          },
          idempotencyKey,
          description: `Scheduled LLM check: ${questions.length} questions × ${providers.length} providers`,
        });

        // Run the checks
        console.log(`🤖 [Scheduled LLMChecks] Running checks for keyword ${keywordId}`);

        try {
          const result = await runLLMChecks(
            keywordId,
            accountId,
            questions,
            targetDomain,
            supabase,
            { providers }
          );

          // Update schedule timestamps
          await supabase
            .from('llm_visibility_schedules')
            .update({ last_scheduled_run_at: new Date().toISOString() })
            .eq('id', scheduleId);

          if (result.checksPerformed === 0 && result.errors.length > 0) {
            // All checks failed - refund
            console.log(`❌ [Scheduled LLMChecks] All checks failed for ${keywordId}, refunding`);
            await refundFeature(supabase, accountId, creditCost, idempotencyKey, {
              featureType: 'llm_visibility',
              featureMetadata: { keywordId, reason: 'all_checks_failed', scheduled: true },
              description: 'Refund: Scheduled LLM checks failed',
            });

            results.errors++;
            results.details.push({
              scheduleId,
              keywordId,
              accountId,
              creditsUsed: 0,
              checksPerformed: 0,
              status: 'error',
              error: result.errors.join('; '),
            });
          } else {
            results.processed++;
            results.details.push({
              scheduleId,
              keywordId,
              accountId,
              creditsUsed: creditCost,
              checksPerformed: result.checksPerformed,
              status: 'success',
            });
          }
        } catch (runError) {
          // Refund on complete failure
          console.error(`❌ [Scheduled LLMChecks] Check failed for ${keywordId}, refunding`);
          await refundFeature(supabase, accountId, creditCost, idempotencyKey, {
            featureType: 'llm_visibility',
            featureMetadata: {
              keywordId,
              reason: 'run_error',
              error: String(runError),
              scheduled: true,
            },
            description: 'Refund: Scheduled LLM check failed',
          });

          results.errors++;
          results.details.push({
            scheduleId,
            keywordId,
            accountId,
            creditsUsed: 0,
            checksPerformed: 0,
            status: 'error',
            error: runError instanceof Error ? runError.message : 'Unknown error',
          });
        }
      } catch (scheduleError) {
        console.error(`❌ [Scheduled LLMChecks] Error processing schedule ${scheduleId}:`, scheduleError);
        results.errors++;
        results.details.push({
          scheduleId,
          keywordId,
          accountId,
          creditsUsed: 0,
          checksPerformed: 0,
          status: 'error',
          error: scheduleError instanceof Error ? scheduleError.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      summary: {
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
function extractDomain(url: string): string | null {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
