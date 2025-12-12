/**
 * Rank Tracking Credit Service
 *
 * Handles credit checking and deduction for rank tracking operations.
 * Integrates with the centralized credit service.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  getBalance,
  debit,
} from '@/lib/credits/service';
import type { CreditBalance } from '@/lib/credits/types';

// ============================================
// Credit Calculations
// ============================================

/**
 * Calculate rank check cost
 *
 * Formula: 1 credit per keyword check
 *
 * Examples:
 * - 10 keywords = 10 credits
 * - 50 keywords = 50 credits
 * - 100 keywords = 100 credits
 *
 * @param keywordCount - Number of keywords to check
 * @returns Credit cost
 */
export function calculateRankCheckCost(keywordCount: number): number {
  return keywordCount * 1;
}

// ============================================
// Credit Checking
// ============================================

/**
 * Check if an account has sufficient credits for a rank check
 *
 * Returns credit availability information without debiting.
 *
 * @param serviceSupabase - Supabase client with service role
 * @param accountId - Account ID
 * @param keywordCount - Number of keywords to check
 * @returns Credit availability information
 */
export async function checkRankTrackingCredits(
  serviceSupabase: SupabaseClient,
  accountId: string,
  keywordCount: number
): Promise<{
  hasCredits: boolean;
  required: number;
  available: number;
  balance: CreditBalance;
}> {
  const required = calculateRankCheckCost(keywordCount);
  const balance = await getBalance(serviceSupabase, accountId);

  return {
    hasCredits: balance.totalCredits >= required,
    required,
    available: balance.totalCredits,
    balance,
  };
}

// ============================================
// Credit Deduction
// ============================================

/**
 * Debit credits for a rank check operation
 *
 * Uses the centralized credit service with proper idempotency.
 *
 * @param serviceSupabase - Supabase client with service role
 * @param accountId - Account ID
 * @param keywordCount - Number of keywords checked
 * @param groupId - Group ID for metadata
 * @param idempotencyKey - Unique key for this operation
 * @returns Ledger entries created
 */
export async function debitRankCheckCredits(
  serviceSupabase: SupabaseClient,
  accountId: string,
  keywordCount: number,
  groupId: string,
  idempotencyKey: string
) {
  const amount = calculateRankCheckCost(keywordCount);

  return debit(serviceSupabase, accountId, amount, {
    featureType: 'rank_tracking',
    featureMetadata: {
      groupId,
      keywordCount,
    },
    idempotencyKey,
    description: `Rank check for ${keywordCount} keyword${keywordCount === 1 ? '' : 's'}`,
    createdBy: 'system',
  });
}

// ============================================
// Exports
// ============================================

export const rankTrackingCredits = {
  calculateRankCheckCost,
  checkRankTrackingCredits,
  debitRankCheckCredits,
};

export default rankTrackingCredits;
