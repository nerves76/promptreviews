/**
 * Concept Schedule Credit Service
 *
 * Calculates combined credit cost for all enabled check types
 * (search rank, geo-grid, LLM visibility) at the concept level.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { calculateRankCheckCost } from '@/features/rank-tracking/services/credits';
import { calculateGeogridCost, getBalance, debit } from '@/lib/credits/service';
import {
  LLM_CREDIT_COSTS,
  type LLMProvider,
} from '@/features/llm-visibility/utils/types';
import type {
  ConceptCostBreakdown,
  SearchRankCostBreakdown,
  GeoGridCostBreakdown,
  LLMVisibilityCostBreakdown,
  ReviewMatchingCostBreakdown,
} from '../utils/types';
import type { CreditBalance } from '@/lib/credits/types';

// ============================================
// Cost Calculation Helpers
// ============================================

/**
 * Calculate LLM visibility check cost
 *
 * @param questionCount - Number of questions to check
 * @param providers - List of LLM providers to check
 * @returns Credit cost
 */
export function calculateLLMCheckCost(
  questionCount: number,
  providers: LLMProvider[]
): number {
  if (questionCount === 0 || providers.length === 0) return 0;

  const costPerQuestion = providers.reduce(
    (sum, provider) => sum + (LLM_CREDIT_COSTS[provider] || 0),
    0
  );

  return questionCount * costPerQuestion;
}

/**
 * Get LLM cost per question for given providers
 */
export function getLLMCostPerQuestion(providers: LLMProvider[]): number {
  return providers.reduce(
    (sum, provider) => sum + (LLM_CREDIT_COSTS[provider] || 0),
    0
  );
}

// ============================================
// Main Cost Calculation
// ============================================

// Cost for review matching (flat rate per check)
export const REVIEW_MATCHING_CREDIT_COST = 1;

interface CalculateCostOptions {
  searchRankEnabled: boolean;
  geoGridEnabled: boolean;
  llmVisibilityEnabled: boolean;
  llmProviders: LLMProvider[];
  reviewMatchingEnabled: boolean;
}

interface KeywordData {
  searchTerms: Array<{ term: string; isCanonical?: boolean }>;
  relatedQuestions: Array<{ question: string; funnelStage?: string }>;
}

interface GeoGridConfig {
  checkPoints: string[];
}

/**
 * Calculate total concept schedule cost
 *
 * @param supabase - Supabase client
 * @param accountId - Account ID
 * @param keywordId - Keyword (concept) ID
 * @param options - Which check types are enabled
 * @returns Detailed cost breakdown
 */
export async function calculateConceptScheduleCost(
  supabase: SupabaseClient,
  accountId: string,
  keywordId: string,
  options: CalculateCostOptions
): Promise<ConceptCostBreakdown> {
  // Fetch keyword data
  const { data: keyword } = await supabase
    .from('keywords')
    .select('search_terms, related_questions')
    .eq('id', keywordId)
    .single();

  const searchTerms: KeywordData['searchTerms'] = keyword?.search_terms || [];
  const relatedQuestions: KeywordData['relatedQuestions'] =
    keyword?.related_questions || [];

  // Count items
  const searchTermCount = Array.isArray(searchTerms) ? searchTerms.length : 0;
  const questionCount = Array.isArray(relatedQuestions)
    ? relatedQuestions.length
    : 0;

  // Fetch geo-grid config for this account (if geo-grid is enabled)
  let gridSize = 3; // Default 3x3
  let checkPointCount = 9;

  if (options.geoGridEnabled) {
    const { data: ggConfig } = await supabase
      .from('gg_configs')
      .select('check_points')
      .eq('account_id', accountId)
      .eq('is_enabled', true)
      .single();

    if (ggConfig?.check_points) {
      checkPointCount = ggConfig.check_points.length;
      gridSize = Math.ceil(Math.sqrt(checkPointCount));
    }
  }

  // Calculate search rank cost
  // Formula: 1 credit per term × 2 devices (desktop + mobile)
  const searchRankCost: SearchRankCostBreakdown = {
    enabled: options.searchRankEnabled,
    searchTermCount,
    devicesCount: 2,
    creditCostPerTerm: 1,
    cost: options.searchRankEnabled
      ? calculateRankCheckCost(searchTermCount * 2)
      : 0,
  };

  // Calculate geo-grid cost
  // Formula: 10 base + gridSize² cells + (searchTerms × 2)
  const baseCost = 10;
  const cellCost = gridSize * gridSize;
  const keywordCost = searchTermCount * 2;

  const geoGridCost: GeoGridCostBreakdown = {
    enabled: options.geoGridEnabled,
    gridSize,
    checkPointCount,
    searchTermCount,
    baseCost,
    cellCost,
    keywordCost,
    cost: options.geoGridEnabled
      ? calculateGeogridCost(gridSize, searchTermCount)
      : 0,
  };

  // Calculate LLM visibility cost
  // Formula: questionCount × sum(provider costs)
  const costPerQuestion = getLLMCostPerQuestion(options.llmProviders);

  const llmVisibilityCost: LLMVisibilityCostBreakdown = {
    enabled: options.llmVisibilityEnabled,
    questionCount,
    providers: options.llmProviders,
    costPerQuestion,
    cost: options.llmVisibilityEnabled
      ? calculateLLMCheckCost(questionCount, options.llmProviders)
      : 0,
  };

  // Calculate review matching cost
  // Flat rate per check
  const reviewMatchingCost: ReviewMatchingCostBreakdown = {
    enabled: options.reviewMatchingEnabled,
    cost: options.reviewMatchingEnabled ? REVIEW_MATCHING_CREDIT_COST : 0,
  };

  // Calculate total
  const total =
    searchRankCost.cost + geoGridCost.cost + llmVisibilityCost.cost + reviewMatchingCost.cost;

  return {
    searchRank: searchRankCost,
    geoGrid: geoGridCost,
    llmVisibility: llmVisibilityCost,
    reviewMatching: reviewMatchingCost,
    total,
  };
}

// ============================================
// Credit Checking
// ============================================

/**
 * Check if an account has sufficient credits for a concept schedule run
 */
export async function checkConceptScheduleCredits(
  supabase: SupabaseClient,
  accountId: string,
  costBreakdown: ConceptCostBreakdown
): Promise<{
  hasCredits: boolean;
  required: number;
  available: number;
  balance: CreditBalance;
}> {
  const balance = await getBalance(supabase, accountId);

  return {
    hasCredits: balance.totalCredits >= costBreakdown.total,
    required: costBreakdown.total,
    available: balance.totalCredits,
    balance,
  };
}

// ============================================
// Credit Deduction
// ============================================

/**
 * Debit credits for a concept schedule run
 */
export async function debitConceptScheduleCredits(
  supabase: SupabaseClient,
  accountId: string,
  costBreakdown: ConceptCostBreakdown,
  scheduleId: string,
  keywordId: string,
  idempotencyKey: string
) {
  return debit(supabase, accountId, costBreakdown.total, {
    featureType: 'concept_schedule',
    featureMetadata: {
      scheduleId,
      keywordId,
      searchRank: costBreakdown.searchRank.enabled
        ? {
            terms: costBreakdown.searchRank.searchTermCount,
            cost: costBreakdown.searchRank.cost,
          }
        : null,
      geoGrid: costBreakdown.geoGrid.enabled
        ? {
            gridSize: costBreakdown.geoGrid.gridSize,
            terms: costBreakdown.geoGrid.searchTermCount,
            cost: costBreakdown.geoGrid.cost,
          }
        : null,
      llmVisibility: costBreakdown.llmVisibility.enabled
        ? {
            questions: costBreakdown.llmVisibility.questionCount,
            providers: costBreakdown.llmVisibility.providers,
            cost: costBreakdown.llmVisibility.cost,
          }
        : null,
      reviewMatching: costBreakdown.reviewMatching.enabled
        ? { cost: costBreakdown.reviewMatching.cost }
        : null,
    },
    idempotencyKey,
    description: `Concept schedule check (${formatCostDescription(costBreakdown)})`,
    createdBy: 'system',
  });
}

/**
 * Format cost description for ledger entry
 */
function formatCostDescription(costBreakdown: ConceptCostBreakdown): string {
  const parts: string[] = [];

  if (costBreakdown.searchRank.enabled) {
    parts.push(`rank: ${costBreakdown.searchRank.searchTermCount} terms`);
  }
  if (costBreakdown.geoGrid.enabled) {
    parts.push(`grid: ${costBreakdown.geoGrid.gridSize}x${costBreakdown.geoGrid.gridSize}`);
  }
  if (costBreakdown.llmVisibility.enabled) {
    parts.push(`LLM: ${costBreakdown.llmVisibility.questionCount} questions`);
  }
  if (costBreakdown.reviewMatching.enabled) {
    parts.push('review matching');
  }

  return parts.join(', ') || 'no checks enabled';
}

// ============================================
// Exports
// ============================================

export const conceptScheduleCredits = {
  calculateConceptScheduleCost,
  checkConceptScheduleCredits,
  debitConceptScheduleCredits,
  calculateLLMCheckCost,
  getLLMCostPerQuestion,
  REVIEW_MATCHING_CREDIT_COST,
};

export default conceptScheduleCredits;
