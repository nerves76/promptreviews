/**
 * LLM Visibility Checker Service
 *
 * Orchestrates LLM visibility checks for keyword questions.
 * Stores results in the database and updates summaries.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  LLMProvider,
  LLMCheckResult,
  LLMCheckBatchResult,
  LLMVisibilityCheck,
  LLMVisibilitySummary,
  LLMVisibilityCheckRow,
  LLMVisibilitySummaryRow,
  ProviderStats,
  ProviderStat,
} from '../utils/types';
import { checkMultipleProviders } from '../api/dataforseo-ai-client';
import { captureError } from '@/utils/sentry';

// Use generic SupabaseClient type to avoid strict typing issues
type ServiceSupabase = SupabaseClient<any, any, any>;

// ============================================
// Transform Helpers
// ============================================

function transformCheckRowToResponse(row: LLMVisibilityCheckRow): LLMVisibilityCheck {
  return {
    id: row.id,
    accountId: row.account_id,
    keywordId: row.keyword_id,
    question: row.question,
    llmProvider: row.llm_provider,
    domainCited: row.domain_cited,
    citationPosition: row.citation_position,
    citationUrl: row.citation_url,
    totalCitations: row.total_citations,
    responseSnippet: row.response_snippet,
    citations: row.citations,
    apiCostUsd: row.api_cost_usd,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
  };
}

function transformSummaryRowToResponse(row: LLMVisibilitySummaryRow): LLMVisibilitySummary {
  return {
    id: row.id,
    accountId: row.account_id,
    keywordId: row.keyword_id,
    totalQuestions: row.total_questions,
    questionsWithCitation: row.questions_with_citation,
    visibilityScore: row.visibility_score,
    providerStats: row.provider_stats || {},
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// Main Check Function
// ============================================

export interface RunLLMChecksOptions {
  providers?: LLMProvider[];
  questionIndices?: number[];
}

/**
 * Run LLM visibility checks for a keyword's questions
 *
 * This is the main entry point for running LLM visibility checks.
 * It queries each question against selected LLM providers and
 * stores results in the database.
 *
 * @param keywordId - The keyword ID
 * @param accountId - The account ID
 * @param questions - Array of questions to check (from keywords.related_questions)
 * @param targetDomain - The domain to check visibility for
 * @param serviceSupabase - Supabase client with service role
 * @param options - Optional configuration
 */
export async function runLLMChecks(
  keywordId: string,
  accountId: string,
  questions: string[],
  targetDomain: string,
  serviceSupabase: ServiceSupabase,
  options: RunLLMChecksOptions = {}
): Promise<LLMCheckBatchResult> {
  const {
    providers = ['chatgpt'],
    questionIndices,
  } = options;

  const errors: string[] = [];
  const allResults: LLMCheckResult[] = [];
  let totalCost = 0;
  let totalCredits = 0;

  console.log(`🤖 [LLMVisibility] Starting checks for keyword: ${keywordId}`);
  console.log(`   Questions: ${questions.length}, Providers: ${providers.join(', ')}`);

  try {
    // Filter questions if specific indices provided
    let questionsToCheck = questions;
    if (questionIndices && questionIndices.length > 0) {
      questionsToCheck = questionIndices
        .filter(i => i >= 0 && i < questions.length)
        .map(i => questions[i]);
    }

    if (questionsToCheck.length === 0) {
      return {
        success: false,
        checksPerformed: 0,
        totalCost: 0,
        totalCreditsUsed: 0,
        results: [],
        errors: ['No questions to check. Add related questions to the keyword first.'],
      };
    }

    const checksToInsert: Array<{
      account_id: string;
      keyword_id: string;
      question: string;
      llm_provider: LLMProvider;
      domain_cited: boolean;
      citation_position: number | null;
      citation_url: string | null;
      total_citations: number;
      response_snippet: string | null;
      citations: object | null;
      api_cost_usd: number;
      checked_at: string;
    }> = [];

    const checkedAt = new Date().toISOString();
    let checkCount = 0;
    const totalChecks = questionsToCheck.length * providers.length;

    // Process each question
    for (let qIdx = 0; qIdx < questionsToCheck.length; qIdx++) {
      const question = questionsToCheck[qIdx];
      console.log(`   [Question ${qIdx + 1}/${questionsToCheck.length}] "${question.substring(0, 50)}..."`);

      try {
        // Check all providers for this question
        const results = await checkMultipleProviders({
          question,
          targetDomain,
          providers,
        });

        for (const result of results) {
          checkCount++;
          allResults.push(result);
          totalCost += result.cost;

          if (result.success) {
            checksToInsert.push({
              account_id: accountId,
              keyword_id: keywordId,
              question,
              llm_provider: result.provider,
              domain_cited: result.domainCited,
              citation_position: result.citationPosition,
              citation_url: result.citationUrl,
              total_citations: result.totalCitations,
              response_snippet: result.responseSnippet,
              citations: result.citations.length > 0 ? result.citations : null,
              api_cost_usd: result.cost,
              checked_at: checkedAt,
            });

            console.log(
              `      [${checkCount}/${totalChecks}] ${result.provider}: ` +
              `${result.domainCited ? '✓ CITED' : '✗ not cited'} ` +
              `(${result.totalCitations} total citations)`
            );
          } else {
            console.error(`      [${checkCount}/${totalChecks}] ${result.provider}: Error - ${result.error}`);
            errors.push(`${result.provider} failed for "${question.substring(0, 30)}...": ${result.error}`);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`   [Question ${qIdx + 1}] Error: ${errorMsg}`);
        errors.push(`Failed to check question "${question.substring(0, 30)}...": ${errorMsg}`);
        if (error instanceof Error) {
          captureError(error, { feature: 'llm-visibility', keywordId, question });
        }
      }
    }

    // Insert results into database
    if (checksToInsert.length > 0) {
      const { error: insertError } = await serviceSupabase
        .from('llm_visibility_checks')
        .insert(checksToInsert);

      if (insertError) {
        errors.push(`Failed to save check results: ${insertError.message}`);
        captureError(new Error(insertError.message), { feature: 'llm-visibility', keywordId });
      }
    }

    // Track cost in ai_usage table
    if (totalCost > 0) {
      await serviceSupabase.from('ai_usage').insert({
        account_id: accountId,
        feature_type: 'llm_visibility',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost_usd: totalCost,
        created_at: checkedAt,
      });
    }

    // Update summary
    await updateSummary(keywordId, accountId, serviceSupabase);

    const successCount = allResults.filter(r => r.success).length;
    console.log(`🤖 [LLMVisibility] Complete: ${successCount}/${totalChecks} successful, cost: $${totalCost.toFixed(4)}`);

    return {
      success: errors.length === 0,
      checksPerformed: checksToInsert.length,
      totalCost,
      totalCreditsUsed: totalCredits,
      results: allResults,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`🤖 [LLMVisibility] Fatal error: ${errorMsg}`);
    if (error instanceof Error) {
      captureError(error, { feature: 'llm-visibility', keywordId });
    }
    return {
      success: false,
      checksPerformed: 0,
      totalCost,
      totalCreditsUsed: 0,
      results: allResults,
      errors: [errorMsg],
    };
  }
}

// ============================================
// Summary Functions
// ============================================

/**
 * Update the visibility summary for a keyword
 *
 * Recalculates aggregated stats from all checks.
 */
export async function updateSummary(
  keywordId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase
): Promise<LLMVisibilitySummary | null> {
  try {
    // Get all checks for this keyword (most recent per question per provider)
    const { data: checks, error: fetchError } = await serviceSupabase
      .from('llm_visibility_checks')
      .select('*')
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .order('checked_at', { ascending: false });

    if (fetchError) {
      console.error('[LLMVisibility] Error fetching checks for summary:', fetchError);
      return null;
    }

    if (!checks || checks.length === 0) {
      return null;
    }

    // Group by question + provider, keeping only most recent
    const latestChecks = new Map<string, LLMVisibilityCheckRow>();
    for (const check of checks as LLMVisibilityCheckRow[]) {
      const key = `${check.question}:${check.llm_provider}`;
      if (!latestChecks.has(key)) {
        latestChecks.set(key, check);
      }
    }

    // Calculate stats
    const uniqueQuestions = new Set<string>();
    const questionsWithCitation = new Set<string>();
    const providerStats: ProviderStats = {};
    let lastCheckedAt: string | null = null;

    for (const check of latestChecks.values()) {
      uniqueQuestions.add(check.question);

      if (check.domain_cited) {
        questionsWithCitation.add(check.question);
      }

      // Track per-provider stats
      const provider = check.llm_provider;
      if (!providerStats[provider]) {
        providerStats[provider] = {
          checked: 0,
          cited: 0,
          avgPosition: null,
          lastCheckedAt: null,
        };
      }

      const stat = providerStats[provider]!;
      stat.checked++;
      if (check.domain_cited) {
        stat.cited++;
      }
      if (!stat.lastCheckedAt || check.checked_at > stat.lastCheckedAt) {
        stat.lastCheckedAt = check.checked_at;
      }

      if (!lastCheckedAt || check.checked_at > lastCheckedAt) {
        lastCheckedAt = check.checked_at;
      }
    }

    // Calculate average positions for providers where we're cited
    for (const provider of Object.keys(providerStats) as LLMProvider[]) {
      const stat = providerStats[provider]!;
      const citedChecks = Array.from(latestChecks.values()).filter(
        c => c.llm_provider === provider && c.domain_cited && c.citation_position !== null
      );
      if (citedChecks.length > 0) {
        const avgPos = citedChecks.reduce((sum, c) => sum + (c.citation_position || 0), 0) / citedChecks.length;
        stat.avgPosition = Math.round(avgPos * 10) / 10;
      }
    }

    const totalQuestions = uniqueQuestions.size;
    const citedCount = questionsWithCitation.size;
    const visibilityScore = totalQuestions > 0
      ? Math.round((citedCount / totalQuestions) * 100 * 100) / 100
      : null;

    // Upsert summary
    const summaryData = {
      account_id: accountId,
      keyword_id: keywordId,
      total_questions: totalQuestions,
      questions_with_citation: citedCount,
      visibility_score: visibilityScore,
      provider_stats: providerStats,
      last_checked_at: lastCheckedAt,
      updated_at: new Date().toISOString(),
    };

    const { data: upsertedSummary, error: upsertError } = await serviceSupabase
      .from('llm_visibility_summary')
      .upsert(summaryData, {
        onConflict: 'account_id,keyword_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[LLMVisibility] Error upserting summary:', upsertError);
      return null;
    }

    return transformSummaryRowToResponse(upsertedSummary as LLMVisibilitySummaryRow);
  } catch (error) {
    console.error('[LLMVisibility] Error updating summary:', error);
    return null;
  }
}

// ============================================
// Query Functions
// ============================================

/**
 * Get the latest check results for a keyword
 */
export async function getLatestResults(
  keywordId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase,
  options: { provider?: LLMProvider; limit?: number } = {}
): Promise<LLMVisibilityCheck[]> {
  const { provider, limit = 50 } = options;

  let query = serviceSupabase
    .from('llm_visibility_checks')
    .select('*')
    .eq('keyword_id', keywordId)
    .eq('account_id', accountId)
    .order('checked_at', { ascending: false })
    .limit(limit);

  if (provider) {
    query = query.eq('llm_provider', provider);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[LLMVisibility] Error fetching results:', error);
    return [];
  }

  return (data as LLMVisibilityCheckRow[]).map(transformCheckRowToResponse);
}

/**
 * Get the summary for a keyword
 */
export async function getSummary(
  keywordId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase
): Promise<LLMVisibilitySummary | null> {
  const { data, error } = await serviceSupabase
    .from('llm_visibility_summary')
    .select('*')
    .eq('keyword_id', keywordId)
    .eq('account_id', accountId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Not found is OK
      console.error('[LLMVisibility] Error fetching summary:', error);
    }
    return null;
  }

  return transformSummaryRowToResponse(data as LLMVisibilitySummaryRow);
}

/**
 * Get summaries for multiple keywords (for dashboard)
 */
export async function getAccountSummaries(
  accountId: string,
  serviceSupabase: ServiceSupabase,
  options: { limit?: number; minScore?: number } = {}
): Promise<LLMVisibilitySummary[]> {
  const { limit = 100, minScore } = options;

  let query = serviceSupabase
    .from('llm_visibility_summary')
    .select('*')
    .eq('account_id', accountId)
    .order('visibility_score', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (minScore !== undefined) {
    query = query.gte('visibility_score', minScore);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[LLMVisibility] Error fetching account summaries:', error);
    return [];
  }

  return (data as LLMVisibilitySummaryRow[]).map(transformSummaryRowToResponse);
}

// ============================================
// Exports
// ============================================

export const llmChecker = {
  runLLMChecks,
  updateSummary,
  getLatestResults,
  getSummary,
  getAccountSummaries,
};

export default llmChecker;
