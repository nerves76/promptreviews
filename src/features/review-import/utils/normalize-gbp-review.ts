/**
 * Normalize a raw Google Business Profile review to our common NormalizedReview format.
 *
 * GBP reviews come from GoogleBusinessProfileClient.getReviews() which uses
 * the Google My Business API v4 and returns objects with fields like:
 *   reviewId, reviewer.displayName, starRating (string enum), comment,
 *   createTime, reviewReply.comment, etc.
 */

import type { NormalizedReview } from '../types';

/** Map GBP starRating string enum to a numeric 1-5 value */
const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

function mapSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating <= 2) return 'negative';
  if (rating === 3) return 'neutral';
  return 'positive';
}

export function normalizeGbpReview(raw: Record<string, any>): NormalizedReview {
  const starRating = STAR_RATING_MAP[raw.starRating] ?? 0;
  const reviewDate = raw.createTime || raw.updateTime || new Date().toISOString();

  return {
    externalReviewId: raw.reviewId || '',
    externalPlatform: 'google',
    reviewerName: raw.reviewer?.displayName || 'Google User',
    reviewerUrl: raw.reviewer?.profilePhotoUrl || null,
    reviewerImageUrl: raw.reviewer?.profilePhotoUrl || null,
    reviewContent: raw.comment || '',
    starRating,
    sentiment: mapSentiment(starRating),
    reviewDate: typeof reviewDate === 'string' ? reviewDate : new Date(reviewDate).toISOString(),
    platformDisplayName: 'Google Business Profile',
    ownerResponse: raw.reviewReply?.comment || null,
  };
}
