/**
 * Google Play Reviews adapter for DataForSEO
 *
 * Normalizes DataForSEO Google Play app review fields to our common format.
 * API docs: https://docs.dataforseo.com/v3/app_data/google/app_reviews/
 */

import type { ReviewPlatformAdapter, NormalizedReview, PlatformSearchInput, SearchFieldConfig } from '../types';

function mapSentiment(starRating: number): 'positive' | 'neutral' | 'negative' {
  if (starRating <= 2) return 'negative';
  if (starRating === 3) return 'neutral';
  return 'positive';
}

export const googlePlayAdapter: ReviewPlatformAdapter = {
  platformId: 'google_play',
  platformDisplayName: 'Google Play',

  normalize(raw: Record<string, any>): NormalizedReview {
    const starRating = raw.rating?.value ?? raw.rating ?? 0;
    const reviewDate = raw.timestamp || raw.datetime || new Date().toISOString();

    return {
      externalReviewId: raw.review_id || raw.id || '',
      externalPlatform: 'google_play',
      reviewerName: raw.user_profile?.profile_name || raw.profile_name || 'Google Play User',
      reviewerUrl: null,
      reviewerImageUrl: raw.user_profile?.profile_image_url || raw.profile_image_url || null,
      reviewContent: raw.review_text || raw.text || '',
      starRating: typeof starRating === 'number' ? starRating : parseInt(starRating, 10) || 0,
      sentiment: mapSentiment(typeof starRating === 'number' ? starRating : parseInt(starRating, 10) || 0),
      reviewDate: typeof reviewDate === 'string' ? reviewDate : new Date(reviewDate).toISOString(),
      platformDisplayName: 'Google Play',
      title: undefined,
      ownerResponse: raw.responses?.[0]?.text || null,
    };
  },

  getSearchFields(): SearchFieldConfig[] {
    return [
      {
        key: 'appId',
        label: 'App ID',
        placeholder: 'e.g. com.example.app',
        required: true,
        helpText: 'The app ID from the Google Play URL (e.g. com.example.app).',
      },
    ];
  },

  validateInput(input: PlatformSearchInput): string | null {
    if (!input.appId?.trim()) {
      return 'Please provide the Google Play app ID.';
    }
    return null;
  },

  buildTaskPayload(input: PlatformSearchInput): Record<string, any> {
    return {
      app_id: input.appId?.trim(),
      depth: input.depth || 150,
      sort_by: input.sortBy || 'newest',
      language_code: input.languageCode || 'en',
      location_code: input.locationCode || 2840,
    };
  },
};
