/**
 * LLM Visibility Credit Service
 *
 * Handles credit checking and deduction for LLM visibility checks.
 * Integrates with the centralized credit service.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getBalance, debit } from '@/lib/credits/service';
import type { CreditBalance } from '@/lib/credits/types';
import { LLMProvider, LLM_CREDIT_COSTS, LLM_ALL_PROVIDERS_COST } from '../utils/types';

// ============================================
// Credit Calculations
// ============================================

/**
 * Calculate LLM visibility check cost
 *
 * Cost varies by provider (priced for 100%+ margin):
 * - ChatGPT: 3 credits (~$0.004 API cost → $0.006 revenue)
 * - Claude: 3 credits (~$0.003 API cost → $0.006 revenue)
 * - Gemini: 2 credits (~$0.002 API cost → $0.004 revenue)
 * - Perplexity: 3 credits (~$0.003 API cost → $0.006 revenue)
 *
 * Examples (per question):
 * - ChatGPT only: 3 credits
 * - All 4 providers: 11 credits
 * - 5 questions × all providers: 55 credits
 *
 * @param questionCount - Number of questions to check
 * @param providers - Which LLM providers to check
 * @returns Credit cost
 */
export function calculateLLMCheckCost(
  questionCount: number,
  providers: LLMProvider[]
): number {
  const costPerQuestion = providers.reduce(
    (sum, provider) => sum + LLM_CREDIT_COSTS[provider],
    0
  );
  return questionCount * costPerQuestion;
}

/**
 * Get cost breakdown by provider
 */
export function getCostBreakdown(
  questionCount: number,
  providers: LLMProvider[]
): { provider: LLMProvider; cost: number }[] {
  return providers.map(provider => ({
    provider,
    cost: questionCount * LLM_CREDIT_COSTS[provider],
  }));
}

/**
 * Calculate cost for all providers (convenience function)
 */
export function calculateAllProvidersCost(questionCount: number): number {
  return questionCount * LLM_ALL_PROVIDERS_COST;
}

// ============================================
// Credit Checking
// ============================================

/**
 * Check if an account has sufficient credits for LLM visibility checks
 *
 * Returns credit availability information without debiting.
 *
 * @param serviceSupabase - Supabase client with service role
 * @param accountId - Account ID
 * @param questionCount - Number of questions to check
 * @param providers - Which LLM providers to check
 * @returns Credit availability information
 */
export async function checkLLMVisibilityCredits(
  serviceSupabase: SupabaseClient,
  accountId: string,
  questionCount: number,
  providers: LLMProvider[]
): Promise<{
  hasCredits: boolean;
  required: number;
  available: number;
  balance: CreditBalance;
  breakdown: { provider: LLMProvider; cost: number }[];
}> {
  const required = calculateLLMCheckCost(questionCount, providers);
  const balance = await getBalance(serviceSupabase, accountId);
  const breakdown = getCostBreakdown(questionCount, providers);

  return {
    hasCredits: balance.totalCredits >= required,
    required,
    available: balance.totalCredits,
    balance,
    breakdown,
  };
}

// ============================================
// Credit Deduction
// ============================================

/**
 * Debit credits for an LLM visibility check operation
 *
 * Uses the centralized credit service with proper idempotency.
 *
 * @param serviceSupabase - Supabase client with service role
 * @param accountId - Account ID
 * @param questionCount - Number of questions checked
 * @param providers - Which LLM providers were checked
 * @param keywordId - Keyword ID for metadata
 * @param idempotencyKey - Unique key for this operation
 * @returns Ledger entries created
 */
export async function debitLLMCheckCredits(
  serviceSupabase: SupabaseClient,
  accountId: string,
  questionCount: number,
  providers: LLMProvider[],
  keywordId: string,
  idempotencyKey: string
) {
  const amount = calculateLLMCheckCost(questionCount, providers);

  return debit(serviceSupabase, accountId, amount, {
    featureType: 'llm_visibility',
    featureMetadata: {
      keywordId,
      questionCount,
      providers,
    },
    idempotencyKey,
    description: `LLM visibility check: ${questionCount} question${questionCount === 1 ? '' : 's'} × ${providers.length} provider${providers.length === 1 ? '' : 's'}`,
    createdBy: 'system',
  });
}

// ============================================
// Cost Display Helpers
// ============================================

/**
 * Format credit cost for display
 */
export function formatCreditCost(credits: number): string {
  return `${credits} credit${credits === 1 ? '' : 's'}`;
}

/**
 * Get human-readable provider cost summary
 */
export function getProviderCostSummary(providers: LLMProvider[]): string {
  const costs = providers.map(p => `${p}: ${LLM_CREDIT_COSTS[p]}`);
  return costs.join(', ');
}

// ============================================
// Exports
// ============================================

export const llmVisibilityCredits = {
  calculateLLMCheckCost,
  getCostBreakdown,
  calculateAllProvidersCost,
  checkLLMVisibilityCredits,
  debitLLMCheckCredits,
  formatCreditCost,
  getProviderCostSummary,
  LLM_CREDIT_COSTS,
};

export default llmVisibilityCredits;
