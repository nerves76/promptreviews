/**
 * Trustpilot Reviews adapter for DataForSEO
 *
 * Normalizes DataForSEO Trustpilot review fields to our common format.
 * API docs: https://docs.dataforseo.com/v3/business_data/trustpilot/reviews/
 */

import type { ReviewPlatformAdapter, NormalizedReview, PlatformSearchInput, SearchFieldConfig } from '../types';

function mapSentiment(starRating: number): 'positive' | 'neutral' | 'negative' {
  if (starRating <= 2) return 'negative';
  if (starRating === 3) return 'neutral';
  return 'positive';
}

/** Strip protocol, www, trailing slashes, and paths from a domain input */
function cleanDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.replace(/\/.*$/, '');
  return d;
}

export const trustpilotAdapter: ReviewPlatformAdapter = {
  platformId: 'trustpilot',
  platformDisplayName: 'Trustpilot',

  normalize(raw: Record<string, any>): NormalizedReview {
    const starRating = raw.rating?.value ?? raw.rating ?? 0;
    const reviewDate = raw.timestamp || raw.datetime || new Date().toISOString();

    return {
      externalReviewId: raw.review_id || raw.id || raw.url || '',
      externalPlatform: 'trustpilot',
      reviewerName: raw.user_profile?.name || raw.profile_name || 'Trustpilot User',
      reviewerUrl: raw.user_profile?.url || raw.profile_url || null,
      reviewerImageUrl: raw.user_profile?.image_url || raw.profile_image_url || null,
      reviewContent: raw.review_text || raw.text || '',
      starRating: typeof starRating === 'number' ? starRating : parseInt(starRating, 10) || 0,
      sentiment: mapSentiment(typeof starRating === 'number' ? starRating : parseInt(starRating, 10) || 0),
      reviewDate: typeof reviewDate === 'string' ? reviewDate : new Date(reviewDate).toISOString(),
      platformDisplayName: 'Trustpilot',
      title: raw.title || null,
      ownerResponse: raw.response?.text || raw.owner_answer || null,
    };
  },

  getSearchFields(): SearchFieldConfig[] {
    return [
      {
        key: 'domain',
        label: 'Trustpilot domain',
        placeholder: 'e.g. example.com',
        required: true,
        helpText: 'This is usually just your website, or whatever you told Trustpilot your website address is.',
      },
    ];
  },

  validateInput(input: PlatformSearchInput): string | null {
    if (!input.domain) {
      return 'Please provide the Trustpilot domain for the business.';
    }
    return null;
  },

  buildTaskPayload(input: PlatformSearchInput): Record<string, any> {
    return {
      domain: cleanDomain(input.domain || ''),
      depth: input.depth || 10,
      sort_by: input.sortBy || 'recency',
    };
  },
};
