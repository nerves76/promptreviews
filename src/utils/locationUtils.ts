// -----------------------------------------------------------------------------
// Location Utilities
// This file provides utility functions for managing business locations,
// including tier checking, slug generation, and location management.
// -----------------------------------------------------------------------------

import { LOCATION_LIMITS_BY_PLAN, AccountPlan } from '@/types/business';

/**
 * Check if an account can create more locations based on their plan
 */
export function canCreateLocation(account: { plan: string; location_count: number; max_locations: number }): boolean {
  return account.location_count < account.max_locations;
}

/**
 * Get the location limit for a specific plan tier
 */
export function getTierLocationLimit(plan: string): number {
  const planKey = plan?.toLowerCase() as AccountPlan;
  return LOCATION_LIMITS_BY_PLAN[planKey] || 0;
}

/**
 * Generate a URL-safe slug from a location name
 */
export function generateLocationSlug(name: string, accountSlug?: string): string {
  if (!name) return '';
  
  // Convert to lowercase and replace spaces/special chars with hyphens
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // If account slug provided, prepend it
  if (accountSlug) {
    slug = `${accountSlug}-${slug}`;
  }
  
  // Append '-location' to make it clear this is a location page
  return `${slug}-location`;
}

/**
 * Generate a unique slug for a location's universal prompt page
 */
export function generateLocationPromptPageSlug(locationName: string): string {
  const slug = generateLocationSlug(locationName);
  return `${slug}-universal`;
}

/**
 * Format location address for display
 */
export function formatLocationAddress(location: {
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
}): string {
  const parts = [
    location.address_street,
    location.address_city,
    location.address_state,
    location.address_zip,
    location.address_country
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Get display name for a location
 */
export function getLocationDisplayName(location: {
  name: string;
}): string {
  return location.name;
}

/**
 * Check if a user has access to location features
 */
export function hasLocationAccess(plan?: string): boolean {
  if (!plan) return false;
  return getTierLocationLimit(plan) > 0;
}

/**
 * Create the initial data for a location's universal prompt page
 */
export function createLocationPromptPageData(location: {
  id: string;
  account_id: string;
  name: string;
  business_description?: string;
  unique_aspects?: string;
  ai_dos?: string;
  ai_donts?: string;
  review_platforms?: any[];
}) {
  return {
    account_id: location.account_id,
    business_location_id: location.id,
    is_universal: false,
    review_type: 'general',
    client_name: `Leave a Review for ${getLocationDisplayName(location)}`,
    // Don't set friendly_note from unique_aspects - that should be a separate popup feature
    // friendly_note: location.unique_aspects || '',
    review_platforms: location.review_platforms || [],
    slug: generateLocationPromptPageSlug(location.name),
    status: 'complete' as const,
  };
} 