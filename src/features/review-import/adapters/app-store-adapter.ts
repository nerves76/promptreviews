/**
 * Apple App Store Reviews adapter for DataForSEO
 *
 * Normalizes DataForSEO Apple App Store review fields to our common format.
 * API docs: https://docs.dataforseo.com/v3/app_data/apple/app_reviews/
 */

import type { ReviewPlatformAdapter, NormalizedReview, PlatformSearchInput, SearchFieldConfig } from '../types';

function mapSentiment(starRating: number): 'positive' | 'neutral' | 'negative' {
  if (starRating <= 2) return 'negative';
  if (starRating === 3) return 'neutral';
  return 'positive';
}

export const appStoreAdapter: ReviewPlatformAdapter = {
  platformId: 'app_store',
  platformDisplayName: 'App Store',

  normalize(raw: Record<string, any>): NormalizedReview {
    const starRating = raw.rating?.value ?? raw.rating ?? 0;
    const reviewDate = raw.timestamp || raw.datetime || new Date().toISOString();

    return {
      externalReviewId: raw.review_id || raw.id || '',
      externalPlatform: 'app_store',
      reviewerName: raw.user_profile?.profile_name || raw.profile_name || 'App Store User',
      reviewerUrl: null,
      reviewerImageUrl: raw.user_profile?.profile_image_url || raw.profile_image_url || null,
      reviewContent: raw.review_text || raw.text || '',
      starRating: typeof starRating === 'number' ? starRating : parseInt(starRating, 10) || 0,
      sentiment: mapSentiment(typeof starRating === 'number' ? starRating : parseInt(starRating, 10) || 0),
      reviewDate: typeof reviewDate === 'string' ? reviewDate : new Date(reviewDate).toISOString(),
      platformDisplayName: 'App Store',
      title: raw.title || null,
      ownerResponse: null,
    };
  },

  getSearchFields(): SearchFieldConfig[] {
    return [
      {
        key: 'appId',
        label: 'App ID',
        placeholder: 'e.g. 686449807',
        required: true,
        helpText: 'The numeric app ID from the App Store URL (the number after /id).',
      },
    ];
  },

  validateInput(input: PlatformSearchInput): string | null {
    if (!input.appId?.trim()) {
      return 'Please provide the App Store app ID.';
    }
    return null;
  },

  buildTaskPayload(input: PlatformSearchInput): Record<string, any> {
    return {
      app_id: input.appId?.trim(),
      depth: input.depth || 50,
      sort_by: 'most_recent',
      language_code: input.languageCode || 'en',
      location_code: input.locationCode || 2840,
    };
  },
};
