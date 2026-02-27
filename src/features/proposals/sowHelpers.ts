/**
 * SOW (Statement of Work) number helpers
 *
 * Each account has a numeric prefix (e.g. "031") set once and locked after the first contract.
 * Each non-template proposal gets a sequential sow_number (1, 2, 3...).
 * Display format: {prefix}{number} → "0311", "0312", "031345"
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get the next SOW sequence number for an account.
 * Returns MAX(sow_number) + 1, or 1 if no contracts exist yet.
 */
export async function getNextSowNumber(
  supabase: SupabaseClient,
  accountId: string
): Promise<number> {
  const { data } = await supabase
    .from('proposals')
    .select('sow_number')
    .eq('account_id', accountId)
    .eq('is_template', false)
    .not('sow_number', 'is', null)
    .order('sow_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.sow_number ?? 0) + 1;
}

/**
 * Format the display SOW number: prefix + sequence.
 * e.g. prefix "031", number 5 → "0315"
 */
export function formatSowNumber(prefix: string, number: number): string {
  return `${prefix}${number}`;
}
