/**
 * TripAdvisor Reviews adapter for DataForSEO
 *
 * Normalizes DataForSEO TripAdvisor review fields to our common format.
 * API docs: https://docs.dataforseo.com/v3/business_data/tripadvisor/reviews/
 */

import type { ReviewPlatformAdapter, NormalizedReview, PlatformSearchInput, SearchFieldConfig } from '../types';

function mapSentiment(starRating: number): 'positive' | 'neutral' | 'negative' {
  if (starRating <= 2) return 'negative';
  if (starRating === 3) return 'neutral';
  return 'positive';
}

export const tripadvisorAdapter: ReviewPlatformAdapter = {
  platformId: 'tripadvisor',
  platformDisplayName: 'TripAdvisor',

  normalize(raw: Record<string, any>): NormalizedReview {
    const starRating = raw.rating?.value ?? raw.rating ?? 0;
    const reviewDate = raw.timestamp || raw.datetime || new Date().toISOString();

    return {
      externalReviewId: raw.review_id || raw.id || raw.url || '',
      externalPlatform: 'tripadvisor',
      reviewerName: raw.user_profile?.name || raw.profile_name || 'TripAdvisor User',
      reviewerUrl: raw.user_profile?.url || raw.profile_url || null,
      reviewerImageUrl: raw.user_profile?.image_url || raw.profile_image_url || null,
      reviewContent: raw.review_text || raw.text || '',
      starRating: typeof starRating === 'number' ? starRating : parseInt(starRating, 10) || 0,
      sentiment: mapSentiment(typeof starRating === 'number' ? starRating : parseInt(starRating, 10) || 0),
      reviewDate: typeof reviewDate === 'string' ? reviewDate : new Date(reviewDate).toISOString(),
      platformDisplayName: 'TripAdvisor',
      title: raw.title || null,
      ownerResponse: raw.response?.text || raw.owner_answer || null,
    };
  },

  getSearchFields(): SearchFieldConfig[] {
    return [
      {
        key: 'urlPath',
        label: 'TripAdvisor URL path',
        placeholder: 'e.g. Restaurant_Review-g60763-d...',
        required: false,
        helpText: 'The URL path from TripAdvisor (the part after tripadvisor.com/).',
      },
      {
        key: 'keyword',
        label: 'Business name',
        placeholder: 'e.g. "The Best Restaurant"',
        required: false,
        helpText: 'Search by business name on TripAdvisor.',
      },
    ];
  },

  validateInput(input: PlatformSearchInput): string | null {
    if (!input.urlPath && !input.keyword) {
      return 'Please provide either a TripAdvisor URL path or a business name.';
    }
    return null;
  },

  buildTaskPayload(input: PlatformSearchInput): Record<string, any> {
    const payload: Record<string, any> = {
      depth: input.depth || 10,
      sort_by: input.sortBy || 'recency',
    };

    if (input.urlPath) payload.url_path = input.urlPath;
    if (input.keyword) payload.keyword = input.keyword;
    if (input.languageCode) payload.language_code = input.languageCode;

    return payload;
  },
};
