/**
 * POST /api/review-import/gbp-import
 *
 * Imports confirmed GBP reviews into review_submissions.
 * No credits charged — GBP uses the user's own OAuth.
 *
 * Body: { locationId, locationName, reviews: NormalizedReview[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { sendNotificationToAccount } from '@/utils/notifications';
import type { NormalizedReview } from '@/features/review-import/types';

const VALID_SENTIMENTS = ['positive', 'neutral', 'negative'];

function validateReviewObject(review: Record<string, unknown>): string | null {
  if (!review.externalReviewId || typeof review.externalReviewId !== 'string') {
    return 'externalReviewId is required and must be a string';
  }
  if (!review.reviewerName || typeof review.reviewerName !== 'string') {
    return 'reviewerName is required';
  }
  if (typeof review.starRating !== 'number' || review.starRating < 1 || review.starRating > 5) {
    return 'starRating must be a number between 1 and 5';
  }
  if (typeof review.reviewContent !== 'string') {
    return 'reviewContent must be a string';
  }
  if (!review.sentiment || !VALID_SENTIMENTS.includes(review.sentiment as string)) {
    return 'sentiment must be "positive", "neutral", or "negative"';
  }
  if (!review.reviewDate || typeof review.reviewDate !== 'string') {
    return 'reviewDate is required';
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();
    const { locationId, locationName, reviews } = body as {
      locationId: string;
      locationName: string;
      reviews: NormalizedReview[];
    };

    if (!locationId || !locationName) {
      return NextResponse.json({ error: 'locationId and locationName are required' }, { status: 400 });
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({
        success: true,
        importedCount: 0,
        skippedCount: 0,
        totalFetched: 0,
        cost: 0,
        errors: [],
      });
    }

    // Validate each review
    for (let i = 0; i < reviews.length; i++) {
      const validationError = validateReviewObject(reviews[i] as unknown as Record<string, unknown>);
      if (validationError) {
        return NextResponse.json(
          { error: `Invalid review at index ${i}: ${validationError}` },
          { status: 400 }
        );
      }
    }

    // Get business for account
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'No business found for this account.' },
        { status: 400 }
      );
    }

    // Fresh dedup check
    const { data: existingRows } = await supabase
      .from('review_submissions')
      .select('external_review_id')
      .eq('account_id', accountId)
      .eq('external_platform', 'google')
      .not('external_review_id', 'is', null);

    const existingIds = new Set(
      (existingRows || [])
        .map((r: { external_review_id: string | null }) => r.external_review_id || '')
        .filter(Boolean)
    );

    const newReviews = reviews.filter((r) => !existingIds.has(r.externalReviewId));
    const skippedCount = reviews.length - newReviews.length;

    if (newReviews.length === 0) {
      return NextResponse.json({
        success: true,
        importedCount: 0,
        skippedCount,
        totalFetched: reviews.length,
        cost: 0,
        errors: [],
      });
    }

    // Insert new reviews
    let importedCount = 0;
    const insertErrors: string[] = [];

    for (const review of newReviews) {
      try {
        // Create contact for reviewer
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            account_id: accountId,
            first_name: review.reviewerName,
            last_name: '',
            email: '',
            phone: '',
            notes: 'Contact created from Google Business Profile review import',
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (contactError || !contact) {
          throw new Error(`Failed to create contact: ${contactError?.message || 'Unknown error'}`);
        }

        // Insert review submission
        const { error: reviewError } = await supabase
          .from('review_submissions')
          .insert({
            account_id: accountId,
            business_id: business.id,
            contact_id: contact.id,
            first_name: review.reviewerName,
            last_name: '',
            reviewer_name: review.reviewerName,
            review_content: review.reviewContent,
            review_text_copy: review.reviewContent,
            platform: 'Google Business Profile',
            star_rating: review.starRating,
            emoji_sentiment_selection: review.sentiment,
            review_type: 'review',
            created_at: review.reviewDate,
            submitted_at: review.reviewDate,
            external_review_id: review.externalReviewId,
            external_platform: 'google',
            google_review_id: review.externalReviewId,
            imported_from_google: true,
            google_location_id: locationId,
            google_location_name: locationName,
            verified: true,
            verified_at: review.reviewDate,
            status: 'submitted',
            source_channel: 'gbp_import',
          });

        if (reviewError) {
          // Handle duplicate key (race condition)
          if (reviewError.code === '23505') {
            existingIds.add(review.externalReviewId);
            continue;
          }
          throw new Error(`Failed to insert review: ${reviewError.message} (code: ${reviewError.code})`);
        }

        importedCount++;
        existingIds.add(review.externalReviewId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to insert review';
        insertErrors.push(msg);
        console.error(`[gbp-import] Insert error for ${review.externalReviewId}:`, err);
      }
    }

    // Fire-and-forget notification
    if (importedCount > 0) {
      sendNotificationToAccount(accountId, 'review_import_completed', {
        platform: 'google_business_profile',
        platformDisplayName: 'Google Business Profile',
        importedCount,
        skippedCount: skippedCount + (newReviews.length - importedCount - insertErrors.length),
        totalFetched: reviews.length,
      }).catch((err) => console.error('[gbp-import] Notification error:', err));
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount: skippedCount + (newReviews.length - importedCount - insertErrors.length),
      totalFetched: reviews.length,
      cost: 0,
      errors: insertErrors,
    });
  } catch (error) {
    console.error('[review-import/gbp-import] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import GBP reviews' },
      { status: 500 }
    );
  }
}
