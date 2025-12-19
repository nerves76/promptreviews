/**
 * Sentiment Analyzer Credit Service
 *
 * Handles credit checking and deduction for sentiment analysis operations.
 * Integrates with the centralized credit service.
 *
 * Pricing is tiered based on the number of reviews analyzed.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getBalance, debit } from '@/lib/credits/service';
import type { CreditBalance } from '@/lib/credits/types';

// ============================================
// Pricing Tiers
// ============================================

/**
 * Sentiment analysis pricing tiers
 *
 * Priced based on OpenAI API costs with margin:
 * - GPT-4 costs ~$0.01-0.03 per 1K tokens
 * - Average review ~100 tokens = ~$0.001-0.003
 * - Batch processing reduces per-review cost
 * - Pricing includes phrase discovery
 */
export const SENTIMENT_ANALYSIS_TIERS = [
  { maxReviews: 50, credits: 5 },
  { maxReviews: 100, credits: 10 },
  { maxReviews: 500, credits: 20 },
  { maxReviews: 1000, credits: 35 },
  { maxReviews: 5000, credits: 75 },
  { maxReviews: 10000, credits: 125 },
  { maxReviews: Infinity, credits: 150 },
] as const;

// ============================================
// Credit Calculations
// ============================================

/**
 * Calculate sentiment analysis cost based on review count
 *
 * Uses tiered pricing where larger batches get better per-review rates.
 *
 * Examples:
 * - 25 reviews: 5 credits
 * - 75 reviews: 10 credits
 * - 250 reviews: 20 credits
 * - 750 reviews: 35 credits
 * - 2500 reviews: 75 credits
 * - 7500 reviews: 125 credits
 * - 15000 reviews: 150 credits
 *
 * @param reviewCount - Number of reviews to analyze
 * @returns Credit cost
 */
export function calculateSentimentAnalysisCost(reviewCount: number): number {
  if (reviewCount <= 0) {
    return 0;
  }

  for (const tier of SENTIMENT_ANALYSIS_TIERS) {
    if (reviewCount <= tier.maxReviews) {
      return tier.credits;
    }
  }

  // Fallback to max tier (should never reach here due to Infinity)
  return SENTIMENT_ANALYSIS_TIERS[SENTIMENT_ANALYSIS_TIERS.length - 1].credits;
}

/**
 * Get the pricing tier label for display
 */
export function getTierLabel(reviewCount: number): string {
  for (const tier of SENTIMENT_ANALYSIS_TIERS) {
    if (reviewCount <= tier.maxReviews) {
      if (tier.maxReviews === Infinity) {
        return 'Over 10,000 reviews';
      }
      return `Up to ${tier.maxReviews.toLocaleString()} reviews`;
    }
  }
  return 'Over 10,000 reviews';
}

/**
 * Get the per-review cost for display
 */
export function getPerReviewCost(reviewCount: number): number {
  const credits = calculateSentimentAnalysisCost(reviewCount);
  return reviewCount > 0 ? credits / reviewCount : 0;
}

// ============================================
// Credit Checking
// ============================================

/**
 * Check if an account has sufficient credits for sentiment analysis
 *
 * Returns credit availability information without debiting.
 *
 * @param serviceSupabase - Supabase client with service role
 * @param accountId - Account ID
 * @param reviewCount - Number of reviews to analyze
 * @returns Credit availability information
 */
export async function checkSentimentAnalysisCredits(
  serviceSupabase: SupabaseClient,
  accountId: string,
  reviewCount: number
): Promise<{
  hasCredits: boolean;
  required: number;
  available: number;
  balance: CreditBalance;
  tierLabel: string;
}> {
  const required = calculateSentimentAnalysisCost(reviewCount);
  const balance = await getBalance(serviceSupabase, accountId);
  const tierLabel = getTierLabel(reviewCount);

  return {
    hasCredits: balance.totalCredits >= required,
    required,
    available: balance.totalCredits,
    balance,
    tierLabel,
  };
}

// ============================================
// Credit Deduction
// ============================================

/**
 * Debit credits for a sentiment analysis operation
 *
 * Uses the centralized credit service with proper idempotency.
 *
 * @param serviceSupabase - Supabase client with service role
 * @param accountId - Account ID
 * @param reviewCount - Number of reviews analyzed
 * @param analysisId - Unique analysis ID for tracking
 * @param idempotencyKey - Unique key for this operation
 * @returns Ledger entries created
 */
export async function debitSentimentAnalysisCredits(
  serviceSupabase: SupabaseClient,
  accountId: string,
  reviewCount: number,
  analysisId: string,
  idempotencyKey: string
) {
  const amount = calculateSentimentAnalysisCost(reviewCount);

  return debit(serviceSupabase, accountId, amount, {
    featureType: 'sentiment_analysis',
    featureMetadata: {
      analysisId,
      reviewCount,
      tierLabel: getTierLabel(reviewCount),
    },
    idempotencyKey,
    description: `Sentiment analysis: ${reviewCount.toLocaleString()} review${reviewCount === 1 ? '' : 's'}`,
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
 * Get all pricing tiers for display
 */
export function getPricingTiersDisplay(): Array<{
  label: string;
  credits: number;
  perReview: string;
}> {
  return SENTIMENT_ANALYSIS_TIERS.filter(tier => tier.maxReviews !== Infinity).map(tier => ({
    label: `Up to ${tier.maxReviews.toLocaleString()} reviews`,
    credits: tier.credits,
    perReview: (tier.credits / tier.maxReviews).toFixed(3),
  })).concat([{
    label: 'Over 10,000 reviews',
    credits: 150,
    perReview: '< 0.015',
  }]);
}

// ============================================
// Exports
// ============================================

export const sentimentAnalysisCredits = {
  calculateSentimentAnalysisCost,
  getTierLabel,
  getPerReviewCost,
  checkSentimentAnalysisCredits,
  debitSentimentAnalysisCredits,
  formatCreditCost,
  getPricingTiersDisplay,
  SENTIMENT_ANALYSIS_TIERS,
};

export default sentimentAnalysisCredits;
