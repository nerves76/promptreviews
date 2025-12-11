/**
 * Credit System Module
 *
 * Provides account-based credit management for metered features.
 *
 * Usage:
 * ```typescript
 * import { getBalance, debit, calculateGeogridCost } from '@/lib/credits';
 *
 * // Check balance
 * const balance = await getBalance(supabase, accountId);
 *
 * // Calculate cost for a 5x5 geo grid
 * const cost = calculateGeogridCost(5); // 35 credits
 *
 * // Debit credits
 * await debit(supabase, accountId, cost, {
 *   featureType: 'geo_grid',
 *   featureMetadata: { gridSize: 5, checkId: 'xyz' },
 *   idempotencyKey: `geo_grid:${checkId}`,
 * });
 * ```
 */

export * from './types';
export * from './service';
