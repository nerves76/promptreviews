/**
 * Cron Job: Process Concept Check Runs
 *
 * Processes queued concept check runs one at a time.
 * Each check type is run sequentially to avoid timeouts.
 * Runs every minute to pick up new queued checks.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import { checkRankForDomain } from '@/features/rank-tracking/api/dataforseo-serp-client';
import { runLLMChecks } from '@/features/llm-visibility/services/llm-checker';
import { runRankChecks } from '@/features/geo-grid/services/rank-checker';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
import type { LLMProvider } from '@/features/llm-visibility/utils/types';

// Extend timeout for this route
export const maxDuration = 300; // 5 minutes

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('process-concept-checks', async () => {
    // Find oldest pending or processing run
    const { data: run, error: runError } = await serviceSupabase
      .from('concept_check_runs')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (runError || !run) {
      return { success: true, message: 'No pending runs to process' };
    }

    console.log(`📋 [ConceptChecks] Processing run ${run.id} for keyword ${run.keyword_id}`);

    // Mark as processing
    if (run.status === 'pending') {
      await serviceSupabase
        .from('concept_check_runs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', run.id);
    }

    // Get keyword data
    const { data: keyword } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, search_terms, related_questions, search_volume_location_code')
      .eq('id', run.keyword_id)
      .single();

    if (!keyword) {
      await markRunFailed(run.id, 'Keyword not found');
      return { success: false, error: 'Keyword not found' };
    }

    // Get business data
    const { data: business } = await serviceSupabase
      .from('businesses')
      .select('id, name, business_website, location_code')
      .eq('account_id', run.account_id)
      .single();

    if (!business?.business_website) {
      await markRunFailed(run.id, 'Business website URL not configured');
      return { success: false, error: 'Business website URL not configured' };
    }

    // Extract domain
    let targetDomain = business.business_website;
    try {
      const url = new URL(business.business_website.startsWith('http') ? business.business_website : `https://${business.business_website}`);
      targetDomain = url.hostname.replace(/^www\./, '');
    } catch {
      // Use as-is
    }

    const locationCode = keyword.search_volume_location_code || business.location_code || 2840;
    const errors: string[] = [];

    // Process each check type that's pending
    // 1. Search Rank
    if (run.search_rank_enabled && run.search_rank_status === 'pending') {
      console.log('  → Processing search rank checks');
      await updateCheckStatus(run.id, 'search_rank_status', 'processing');

      try {
        const searchTerms: Array<{ term: string }> = keyword.search_terms || [];
        for (const termObj of searchTerms) {
          for (const device of ['desktop', 'mobile'] as const) {
            const result = await checkRankForDomain({
              keyword: termObj.term,
              targetDomain,
              locationCode,
              device,
            });

            await serviceSupabase.from('rank_checks').insert({
              account_id: run.account_id,
              keyword_id: run.keyword_id,
              search_query_used: termObj.term,
              location_code: locationCode,
              device,
              position: result.position,
              found_url: result.url,
              checked_at: new Date().toISOString(),
            });
          }
        }
        await updateCheckStatus(run.id, 'search_rank_status', 'completed');
        console.log('  ✓ Search rank checks completed');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Search rank: ${msg}`);
        await updateCheckStatus(run.id, 'search_rank_status', 'failed');
        console.error('  ✗ Search rank checks failed:', msg);
      }
    }

    // 2. LLM Visibility
    if (run.llm_visibility_enabled && run.llm_visibility_status === 'pending') {
      console.log('  → Processing LLM visibility checks');
      await updateCheckStatus(run.id, 'llm_visibility_status', 'processing');

      try {
        const questions: Array<{ question: string }> = keyword.related_questions || [];
        const questionStrings = questions.map(q => typeof q === 'string' ? q : q.question);
        const providers = (run.llm_providers || ['chatgpt']) as LLMProvider[];

        if (questionStrings.length > 0 && providers.length > 0) {
          await runLLMChecks(
            run.keyword_id,
            run.account_id,
            questionStrings,
            targetDomain,
            serviceSupabase,
            {
              providers,
              businessName: business.name || null,
            }
          );
        }
        await updateCheckStatus(run.id, 'llm_visibility_status', 'completed');
        console.log('  ✓ LLM visibility checks completed');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`LLM visibility: ${msg}`);
        await updateCheckStatus(run.id, 'llm_visibility_status', 'failed');
        console.error('  ✗ LLM visibility checks failed:', msg);
      }
    }

    // 3. Geo-Grid
    if (run.geo_grid_enabled && run.geo_grid_status === 'pending') {
      console.log('  → Processing geo-grid checks');
      await updateCheckStatus(run.id, 'geo_grid_status', 'processing');

      try {
        // Get geo-grid config
        const { data: ggConfigRow } = await serviceSupabase
          .from('gg_configs')
          .select('*')
          .eq('account_id', run.account_id)
          .single();

        if (!ggConfigRow) {
          throw new Error('No geo-grid configuration found');
        }
        if (!ggConfigRow.target_place_id) {
          throw new Error('Geo-grid missing target Place ID');
        }

        // Ensure keyword is tracked
        const { data: trackedKeyword } = await serviceSupabase
          .from('gg_tracked_keywords')
          .select('id, is_enabled')
          .eq('config_id', ggConfigRow.id)
          .eq('keyword_id', run.keyword_id)
          .single();

        if (!trackedKeyword) {
          await serviceSupabase
            .from('gg_tracked_keywords')
            .insert({
              config_id: ggConfigRow.id,
              keyword_id: run.keyword_id,
              account_id: run.account_id,
              is_enabled: true,
            });
        } else if (!trackedKeyword.is_enabled) {
          await serviceSupabase
            .from('gg_tracked_keywords')
            .update({ is_enabled: true })
            .eq('id', trackedKeyword.id);
        }

        const ggConfig = transformConfigToResponse(ggConfigRow);
        await runRankChecks(ggConfig, serviceSupabase, {
          keywordIds: [run.keyword_id],
        });

        await updateCheckStatus(run.id, 'geo_grid_status', 'completed');
        console.log('  ✓ Geo-grid checks completed');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Geo-grid: ${msg}`);
        await updateCheckStatus(run.id, 'geo_grid_status', 'failed');
        console.error('  ✗ Geo-grid checks failed:', msg);
      }
    }

    // 4. Review Matching
    if (run.review_matching_enabled && run.review_matching_status === 'pending') {
      console.log('  → Processing review matching');
      await updateCheckStatus(run.id, 'review_matching_status', 'processing');

      try {
        await serviceSupabase.rpc('match_keyword_to_reviews', {
          p_keyword_id: run.keyword_id,
          p_account_id: run.account_id,
        });
        await updateCheckStatus(run.id, 'review_matching_status', 'completed');
        console.log('  ✓ Review matching completed');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Review matching: ${msg}`);
        await updateCheckStatus(run.id, 'review_matching_status', 'failed');
        console.error('  ✗ Review matching failed:', msg);
      }
    }

    // Check if all checks are done
    const { data: updatedRun } = await serviceSupabase
      .from('concept_check_runs')
      .select('*')
      .eq('id', run.id)
      .single();

    if (updatedRun) {
      const allDone =
        (!updatedRun.search_rank_enabled || ['completed', 'failed'].includes(updatedRun.search_rank_status)) &&
        (!updatedRun.llm_visibility_enabled || ['completed', 'failed'].includes(updatedRun.llm_visibility_status)) &&
        (!updatedRun.geo_grid_enabled || ['completed', 'failed'].includes(updatedRun.geo_grid_status)) &&
        (!updatedRun.review_matching_enabled || ['completed', 'failed'].includes(updatedRun.review_matching_status));

      if (allDone) {
        const hasErrors = errors.length > 0;
        await serviceSupabase
          .from('concept_check_runs')
          .update({
            status: hasErrors ? 'failed' : 'completed',
            error_message: hasErrors ? errors.join('; ') : null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', run.id);

        console.log(`📋 [ConceptChecks] Run ${run.id} ${hasErrors ? 'completed with errors' : 'completed successfully'}`);
      }
    }

    return {
      success: true,
      runId: run.id,
      errors: errors.length > 0 ? errors : undefined,
    };
  });
}

async function updateCheckStatus(runId: string, field: string, status: string) {
  await serviceSupabase
    .from('concept_check_runs')
    .update({ [field]: status, updated_at: new Date().toISOString() })
    .eq('id', runId);
}

async function markRunFailed(runId: string, errorMessage: string) {
  await serviceSupabase
    .from('concept_check_runs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);
}
