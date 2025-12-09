"use server";

import type { SupabaseClient } from '@supabase/supabase-js';
import { KeywordMatchService } from './keywordMatchService';
import type { SyncedReviewRecord } from '@/features/google-reviews/reviewSyncService';

type SupabaseServiceClient = SupabaseClient<any, 'public', any>;

const SENTIMENT_MAP: Record<number, 'positive' | 'neutral' | 'negative'> = {
  1: 'negative',
  2: 'negative',
  3: 'neutral',
  4: 'positive',
  5: 'positive',
};

const deriveSentiment = (rating?: number | null): 'positive' | 'neutral' | 'negative' => {
  if (!rating || rating < 1) return 'positive';
  return SENTIMENT_MAP[rating] || 'positive';
};

/**
 * Rebuilds keyword matches for all reviews in an account so existing reviews
 * (from any platform) immediately contribute to keyword stats.
 *
 * This function:
 * 1. Clears existing matches for the account (optional, via clearExisting param)
 * 2. Paginates through all reviews
 * 3. Runs keyword matching using the unified keywords table
 * 4. Updates usage counts on keywords table
 */
export async function reprocessKeywordMatchesForAccount(
  supabase: SupabaseServiceClient,
  accountId: string,
  options?: {
    clearExisting?: boolean;
    updateUsageCounts?: boolean;
  }
) {
  const { clearExisting = false, updateUsageCounts = true } = options || {};

  // Optionally clear existing matches first
  if (clearExisting) {
    const { error: deleteError } = await supabase
      .from('keyword_review_matches_v2')
      .delete()
      .eq('account_id', accountId);

    if (deleteError) {
      console.error('❌ Failed to clear existing keyword matches:', deleteError);
      throw deleteError;
    }
  }

  const matcher = new KeywordMatchService(supabase, accountId);
  const pageSize = 250;
  let offset = 0;
  let totalProcessed = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('review_submissions')
      .select(
        `
        id,
        review_content,
        review_text_copy,
        reviewer_name,
        first_name,
        last_name,
        google_review_id,
        google_location_id,
        google_location_name,
        google_business_location_id,
        star_rating,
        created_at
      `,
      )
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('❌ Failed to fetch reviews for keyword reprocess:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    const records: SyncedReviewRecord[] = data
      .map((row) => {
        const body = row.review_content || row.review_text_copy || '';
        if (!body.trim()) return null;

        const name =
          row.reviewer_name ||
          [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
          'Customer';

        return {
          reviewSubmissionId: row.id,
          googleReviewId: row.google_review_id || row.id,
          reviewerName: name,
          reviewText: body,
          starRating: row.star_rating || 0,
          sentiment: deriveSentiment(row.star_rating),
          submittedAt: row.created_at || new Date().toISOString(),
          locationId: row.google_location_id || row.google_business_location_id || row.id,
          locationName: row.google_location_name || undefined,
          googleBusinessLocationId: row.google_business_location_id || null,
          accountId,
        };
      })
      .filter(Boolean) as SyncedReviewRecord[];

    if (records.length > 0) {
      await matcher.process(records);
      totalProcessed += records.length;
    }

    if (data.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  // Update usage counts if requested
  if (updateUsageCounts) {
    await syncKeywordUsageCounts(supabase, accountId);
  }

  return { totalProcessed };
}

/**
 * Syncs the review_usage_count, alias_match_count, and last_used_in_review_at
 * fields for all keywords in an account based on the keyword_review_matches_v2 table.
 *
 * Important: review_usage_count only includes 'exact' matches (used for rotation).
 * alias_match_count only includes 'alias' matches (for SEO tracking, no rotation impact).
 *
 * This is designed to be run as a batch job or after reprocessing.
 */
export async function syncKeywordUsageCounts(
  supabase: SupabaseServiceClient,
  accountId: string
) {
  // Get all keywords for this account
  const { data: keywords, error: keywordsError } = await supabase
    .from('keywords')
    .select('id')
    .eq('account_id', accountId);

  if (keywordsError) {
    console.error('❌ Failed to fetch keywords for usage sync:', keywordsError);
    throw keywordsError;
  }

  if (!keywords || keywords.length === 0) {
    return { keywordsUpdated: 0 };
  }

  let keywordsUpdated = 0;

  // For each keyword, count matches by type and get last match time
  for (const keyword of keywords) {
    // Count exact matches (for rotation)
    const { count: exactCount, error: exactCountError } = await supabase
      .from('keyword_review_matches_v2')
      .select('*', { count: 'exact', head: true })
      .eq('keyword_id', keyword.id)
      .eq('match_type', 'exact');

    if (exactCountError) {
      console.error(`❌ Failed to count exact matches for keyword ${keyword.id}:`, exactCountError);
      continue;
    }

    // Count alias matches (for SEO tracking)
    const { count: aliasCount, error: aliasCountError } = await supabase
      .from('keyword_review_matches_v2')
      .select('*', { count: 'exact', head: true })
      .eq('keyword_id', keyword.id)
      .eq('match_type', 'alias');

    if (aliasCountError) {
      console.error(`❌ Failed to count alias matches for keyword ${keyword.id}:`, aliasCountError);
      continue;
    }

    // Get last match time (either type)
    const { data: lastMatch, error: lastMatchError } = await supabase
      .from('keyword_review_matches_v2')
      .select('matched_at')
      .eq('keyword_id', keyword.id)
      .order('matched_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMatchError) {
      console.error(`❌ Failed to get last match for keyword ${keyword.id}:`, lastMatchError);
      continue;
    }

    // Update keyword with separate counts
    const { error: updateError } = await supabase
      .from('keywords')
      .update({
        review_usage_count: exactCount || 0,
        alias_match_count: aliasCount || 0,
        last_used_in_review_at: lastMatch?.matched_at || null,
      })
      .eq('id', keyword.id);

    if (updateError) {
      console.error(`❌ Failed to update usage for keyword ${keyword.id}:`, updateError);
      continue;
    }

    keywordsUpdated++;
  }

  return { keywordsUpdated };
}

/**
 * Syncs usage counts for all accounts.
 * Useful for batch cron jobs.
 */
export async function syncAllKeywordUsageCounts(
  supabase: SupabaseServiceClient
) {
  // Get all accounts with keywords
  const { data: accounts, error: accountsError } = await supabase
    .from('keywords')
    .select('account_id')
    .limit(1000);

  if (accountsError) {
    console.error('❌ Failed to fetch accounts with keywords:', accountsError);
    throw accountsError;
  }

  const uniqueAccountIds = Array.from(new Set((accounts || []).map(a => a.account_id)));
  let totalUpdated = 0;

  for (const accountId of uniqueAccountIds) {
    const result = await syncKeywordUsageCounts(supabase, accountId);
    totalUpdated += result.keywordsUpdated;
  }

  return { accountsProcessed: uniqueAccountIds.length, totalUpdated };
}
