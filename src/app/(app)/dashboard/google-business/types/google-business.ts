/**
 * Types for Google Business Page
 * Extracted from RefactoredGoogleBusinessPage.tsx for reuse across components/hooks.
 */

export interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
  status?: string; // Made optional and flexible since we don't use it
  _debug?: any; // Debug info from safe transformer (only in dev)
}

/**
 * Tab identifiers used in the Google Business dashboard
 */
export type GoogleBusinessTab =
  | 'connect'
  | 'overview'
  | 'create-post'
  | 'photos'
  | 'business-info'
  | 'services'
  | 'more'
  | 'protection'
  | 'reviews';

/**
 * Post types supported by Google Business Profile
 */
export type PostType = 'STANDARD' | 'EVENT' | 'OFFER' | 'PRODUCT';

/**
 * CTA (Call to Action) types for GBP posts
 */
export type CTAType =
  | 'LEARN_MORE'
  | 'BOOK'
  | 'ORDER'
  | 'SHOP'
  | 'SIGN_UP'
  | 'CALL'
  | 'NONE';

/**
 * Post result after attempting to post to a location
 */
export interface PostResult {
  success: boolean;
  message: string;
  locationResults?: Array<{
    locationId: string;
    locationName: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Overview data structure for analytics
 */
export interface OverviewData {
  lastUpdated: string;
  data: any; // TODO: Define proper structure when refactoring overview hook
}
