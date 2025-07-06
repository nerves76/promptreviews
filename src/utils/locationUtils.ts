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
 * Generate a unique slug for a location's prompt page
 */
export function generateLocationPromptPageSlug(locationName: string): string {
  return generateLocationSlug(locationName);
}

/**
 * Generate a unique slug for a location, checking database for conflicts
 * Adds numbers (e.g., -2, -3) if the base slug already exists
 */
export async function generateUniqueLocationSlug(
  locationName: string, 
  accountId: string,
  supabaseClient: any
): Promise<string> {
  const baseSlug = generateLocationSlug(locationName);
  
  // Check if the base slug already exists
  const { data: existingPage } = await supabaseClient
    .from('prompt_pages')
    .select('slug')
    .eq('account_id', accountId)
    .eq('slug', baseSlug)
    .single();
  
  // If no conflict, return the base slug
  if (!existingPage) {
    return baseSlug;
  }
  
  // If there's a conflict, try adding numbers
  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (true) {
    const { data: conflictingPage } = await supabaseClient
      .from('prompt_pages')
      .select('slug')
      .eq('account_id', accountId)
      .eq('slug', uniqueSlug)
      .single();
    
    if (!conflictingPage) {
      return uniqueSlug;
    }
    
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
    
    // Safety valve to prevent infinite loops
    if (counter > 100) {
      // Fallback to timestamp-based uniqueness
      return `${baseSlug}-${Date.now()}`;
    }
  }
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
  // Emoji sentiment fields
  emoji_sentiment_enabled?: boolean;
  emoji_sentiment_question?: string;
  emoji_feedback_message?: string;
  emoji_thank_you_message?: string;
  emoji_labels?: string[];
  // Other module fields
  falling_enabled?: boolean;
  falling_icon?: string;
  offer_enabled?: boolean;
  offer_title?: string;
  offer_body?: string;
  offer_url?: string;
  ai_review_enabled?: boolean;
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
    // Emoji sentiment fields - disabled by default as requested
    // emoji_sentiment_enabled: location.emoji_sentiment_enabled ?? false, // TODO: Re-enable after schema cache refresh
    // emoji_sentiment_question: location.emoji_sentiment_question || 'How was your experience?', // TODO: Re-enable after schema cache refresh
    // emoji_feedback_message: location.emoji_feedback_message || 'How can we improve?', // TODO: Re-enable after schema cache refresh
    // emoji_thank_you_message: location.emoji_thank_you_message || 'Thank you for your feedback. It\'s important to us.', // TODO: Re-enable after schema cache refresh
    // emoji_labels: location.emoji_labels || ['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'], // TODO: Re-enable after schema cache refresh
    // Other module fields
    // falling_enabled: location.falling_enabled ?? false, // TODO: Re-enable after schema cache refresh
    // falling_icon: location.falling_icon || 'star', // TODO: Re-enable after schema cache refresh
    // offer_enabled: location.offer_enabled ?? false, // TODO: Re-enable after schema cache refresh
    // offer_title: location.offer_title || '', // TODO: Re-enable after schema cache refresh
    // offer_body: location.offer_body || '', // TODO: Re-enable after schema cache refresh
    // offer_url: location.offer_url || '', // TODO: Re-enable after schema cache refresh
    ai_review_enabled: location.ai_review_enabled !== false,
  };
} 