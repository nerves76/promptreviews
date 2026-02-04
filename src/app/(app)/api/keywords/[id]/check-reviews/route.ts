/**
 * API: Check Reviews for Keyword Matches
 *
 * Scans all reviews for matches against a specific keyword (concept).
 * Updates the keyword's review_usage_count and alias_match_count.
 *
 * Cost: 1 credit per check (flat rate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getBalance, debit, refundFeature } from '@/lib/credits/service';
import { KeywordMatchService } from '@/features/keywords/keywordMatchService';
import { syncKeywordUsageCounts } from '@/features/keywords/reprocessKeywordMatches';
import type { SyncedReviewRecord } from '@/features/google-reviews/reviewSyncService';

// Cost per review matching check
const REVIEW_MATCHING_CREDIT_COST = 1;

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: keywordId } = await params;

    // Auth check
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID from request
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Create service client for operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify keyword belongs to this account
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id, name, phrase, normalized_phrase, aliases')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Check credit balance
    const balance = await getBalance(serviceSupabase, accountId);
    if (balance.totalCredits < REVIEW_MATCHING_CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: REVIEW_MATCHING_CREDIT_COST,
          available: balance.totalCredits,
        },
        { status: 402 }
      );
    }

    // Generate idempotency key
    const checkId = `review-match-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = `review_matching:${accountId}:${keywordId}:${checkId}`;

    // Debit credits
    await debit(serviceSupabase, accountId, REVIEW_MATCHING_CREDIT_COST, {
      featureType: 'review_matching',
      featureMetadata: {
        keywordId,
        keywordName: keyword.name,
        checkId,
      },
      idempotencyKey,
      description: `Review matching check: ${keyword.name}`,
    });

    try {
      // Fetch all reviews for this account
      const { data: reviews, error: reviewsError } = await serviceSupabase
        .from('review_submissions')
        .select(`
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
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
      }

      // Clear existing matches for this keyword only
      await serviceSupabase
        .from('keyword_review_matches_v2')
        .delete()
        .eq('keyword_id', keywordId);

      // Convert reviews to SyncedReviewRecord format
      const records: SyncedReviewRecord[] = (reviews || [])
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

      // Run keyword matching
      const matcher = new KeywordMatchService(serviceSupabase, accountId);
      await matcher.process(records);

      // Sync usage counts for this keyword
      await syncKeywordUsageCounts(serviceSupabase, accountId);

      // Get updated keyword stats
      const { data: updatedKeyword } = await serviceSupabase
        .from('keywords')
        .select('review_usage_count, alias_match_count, last_used_in_review_at')
        .eq('id', keywordId)
        .single();

      // Get updated balance
      const newBalance = await getBalance(serviceSupabase, accountId);

      return NextResponse.json({
        success: true,
        keyword: keyword.name,
        reviewsScanned: records.length,
        matchesFound: (updatedKeyword?.review_usage_count || 0) + (updatedKeyword?.alias_match_count || 0),
        exactMatches: updatedKeyword?.review_usage_count || 0,
        aliasMatches: updatedKeyword?.alias_match_count || 0,
        lastMatchedAt: updatedKeyword?.last_used_in_review_at,
        creditsUsed: REVIEW_MATCHING_CREDIT_COST,
        creditsRemaining: newBalance.totalCredits,
      });
    } catch (error) {
      // Refund on failure
      console.error('❌ Review matching failed, issuing refund:', error);
      await refundFeature(serviceSupabase, accountId, REVIEW_MATCHING_CREDIT_COST, idempotencyKey, {
        featureType: 'review_matching',
        featureMetadata: { reason: 'check_failed', keywordId },
        description: 'Refund: Review matching check failed',
      });

      throw error;
    }
  } catch (error) {
    console.error('❌ [CheckReviews] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get current review match stats for a keyword
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: keywordId } = await params;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get keyword stats
    const { data: keyword, error } = await serviceSupabase
      .from('keywords')
      .select('id, name, review_usage_count, alias_match_count, last_used_in_review_at')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (error || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Get recent matches
    const { data: recentMatches } = await serviceSupabase
      .from('keyword_review_matches_v2')
      .select(`
        id,
        match_type,
        matched_phrase,
        matched_at,
        review_submissions (
          id,
          reviewer_name,
          review_content,
          star_rating,
          created_at
        )
      `)
      .eq('keyword_id', keywordId)
      .order('matched_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      keyword: keyword.name,
      exactMatches: keyword.review_usage_count || 0,
      aliasMatches: keyword.alias_match_count || 0,
      totalMatches: (keyword.review_usage_count || 0) + (keyword.alias_match_count || 0),
      lastMatchedAt: keyword.last_used_in_review_at,
      recentMatches: recentMatches || [],
      creditCost: REVIEW_MATCHING_CREDIT_COST,
    });
  } catch (error) {
    console.error('❌ [CheckReviews GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
