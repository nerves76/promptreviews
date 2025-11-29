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
 */
export async function reprocessKeywordMatchesForAccount(
  supabase: SupabaseServiceClient,
  accountId: string,
) {
  const matcher = new KeywordMatchService(supabase, accountId);
  const pageSize = 250;
  let offset = 0;

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
    }

    if (data.length < pageSize) {
      break;
    }

    offset += pageSize;
  }
}
