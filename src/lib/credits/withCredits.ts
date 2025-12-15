/**
 * Credit-Gated Feature Helper
 *
 * A reusable utility for API routes that require credits.
 * Handles credit checking, debiting, and automatic refunds on failure.
 *
 * Usage:
 * ```ts
 * const result = await withCredits({
 *   supabase,
 *   accountId,
 *   userId,
 *   featureType: 'keyword_enrichment',
 *   creditCost: 1,
 *   idempotencyKey: `keyword-enrich-${accountId}-${Date.now()}`,
 *   description: 'AI keyword enrichment',
 *   operation: async () => {
 *     // Your feature logic here
 *     return { success: true, data: ... };
 *   },
 * });
 * ```
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { FeatureType, InsufficientCreditsError } from './types';
import { getBalance, debit, refundFeature } from './service';

export interface WithCreditsOptions<T> {
  supabase: SupabaseClient;
  accountId: string;
  userId?: string;
  featureType: FeatureType;
  creditCost: number;
  idempotencyKey: string;
  description?: string;
  featureMetadata?: Record<string, unknown>;
  operation: () => Promise<T>;
}

export interface WithCreditsResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: number;
  creditsDebited?: number;
  creditsRemaining?: number;
}

/**
 * Execute a credit-gated operation with automatic debit and refund handling
 */
export async function withCredits<T>({
  supabase,
  accountId,
  userId,
  featureType,
  creditCost,
  idempotencyKey,
  description,
  featureMetadata,
  operation,
}: WithCreditsOptions<T>): Promise<WithCreditsResult<T>> {
  // Check balance first
  const balance = await getBalance(supabase, accountId);

  if (balance.totalCredits < creditCost) {
    return {
      success: false,
      error: `Insufficient credits. Required: ${creditCost}, Available: ${balance.totalCredits}`,
      errorCode: 402,
      creditsRemaining: balance.totalCredits,
    };
  }

  // Debit credits
  try {
    await debit(supabase, accountId, creditCost, {
      featureType,
      featureMetadata: featureMetadata || {},
      idempotencyKey,
      description: description || `${featureType} usage`,
      createdBy: userId,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return {
        success: false,
        error: `Insufficient credits. Required: ${creditCost}, Available: ${err.available}`,
        errorCode: 402,
        creditsRemaining: err.available,
      };
    }
    throw err;
  }

  // Execute the operation
  try {
    const result = await operation();

    // Get updated balance
    const newBalance = await getBalance(supabase, accountId);

    return {
      success: true,
      data: result,
      creditsDebited: creditCost,
      creditsRemaining: newBalance.totalCredits,
    };
  } catch (operationError) {
    // Operation failed - refund the credits
    console.error(`[withCredits] Operation failed for ${featureType}, refunding ${creditCost} credits:`, operationError);

    try {
      await refundFeature(supabase, accountId, creditCost, idempotencyKey, {
        featureType,
        featureMetadata,
        description: `Refund: ${description || featureType} failed`,
        createdBy: userId,
      });
    } catch (refundError) {
      // Log refund error but don't throw - the original error is more important
      console.error(`[withCredits] Failed to refund credits:`, refundError);
    }

    throw operationError;
  }
}

/**
 * Check if an account has enough credits for a feature
 * Useful for UI to show/hide features or display warnings
 */
export async function checkCredits(
  supabase: SupabaseClient,
  accountId: string,
  creditCost: number
): Promise<{
  hasCredits: boolean;
  required: number;
  available: number;
}> {
  const balance = await getBalance(supabase, accountId);

  return {
    hasCredits: balance.totalCredits >= creditCost,
    required: creditCost,
    available: balance.totalCredits,
  };
}

/**
 * Get the cost for a feature from pricing rules
 * Falls back to provided default if no rule found
 */
export async function getFeatureCost(
  supabase: SupabaseClient,
  featureType: FeatureType,
  ruleKey: string = 'default',
  defaultCost: number = 1
): Promise<number> {
  const { data } = await supabase
    .from('credit_pricing_rules')
    .select('credit_cost')
    .eq('feature_type', featureType)
    .eq('rule_key', ruleKey)
    .eq('is_active', true)
    .single();

  return data?.credit_cost ?? defaultCost;
}
