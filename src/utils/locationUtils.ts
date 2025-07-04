/**
 * Business Location Utilities
 * 
 * Helper functions for managing business locations, tier enforcement,
 * and location-aware data operations
 */

import { BusinessLocation, BusinessProfile, LOCATION_LIMITS } from '@/types/business';

/**
 * Check if an account can create a new business location
 * @param plan - The account's plan tier
 * @param currentCount - Current number of locations
 * @returns boolean - Whether the account can create a new location
 */
export function canCreateLocation(plan: string, currentCount: number): boolean {
  const limit = LOCATION_LIMITS[plan] || 0;
  return currentCount < limit;
}

/**
 * Get the maximum number of locations allowed for a plan tier
 * @param plan - The account's plan tier
 * @returns number - Maximum locations allowed
 */
export function getLocationLimit(plan: string): number {
  return LOCATION_LIMITS[plan] || 0;
}

/**
 * Check if a plan has access to business locations feature
 * @param plan - The account's plan tier
 * @returns boolean - Whether the plan supports locations
 */
export function hasLocationAccess(plan: string): boolean {
  return getLocationLimit(plan) > 0;
}

/**
 * Generate a slug for a location-specific universal prompt page
 * @param locationName - The location name
 * @returns string - Generated slug
 */
export function generateLocationSlug(locationName: string): string {
  const baseSlug = locationName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${baseSlug}-universal`;
}

/**
 * Merge business profile data with location-specific overrides
 * @param businessProfile - The account's business profile
 * @param location - The specific business location
 * @returns Merged business data with location overrides
 */
export function mergeBusinessWithLocation(
  businessProfile: BusinessProfile, 
  location: BusinessLocation
): BusinessProfile & { location_context: BusinessLocation } {
  return {
    ...businessProfile,
    // Override business profile fields with location-specific data
    name: location.business_name || businessProfile.name,
    address_street: location.address_street || businessProfile.address_street,
    address_city: location.address_city || businessProfile.address_city,
    address_state: location.address_state || businessProfile.address_state,
    address_zip: location.address_zip || businessProfile.address_zip,
    address_country: location.address_country || businessProfile.address_country,
    logo_url: location.logo_url || businessProfile.logo_url,
    primary_color: location.primary_color || businessProfile.primary_color,
    secondary_color: location.secondary_color || businessProfile.secondary_color,
    // Add location context for AI generation
    location_context: location
  };
}

/**
 * Get effective AI training data with location overrides
 * @param businessProfile - The account's business profile
 * @param location - The specific business location
 * @returns Object with effective AI dos and don'ts
 */
export function getEffectiveAITraining(
  businessProfile: BusinessProfile & { ai_dos?: string; ai_donts?: string },
  location?: BusinessLocation
) {
  return {
    ai_dos: location?.ai_dos || businessProfile.ai_dos || '',
    ai_donts: location?.ai_donts || businessProfile.ai_donts || '',
    business_description: location?.business_description || '',
    unique_aspects: location?.unique_aspects || ''
  };
}

/**
 * Validate location creation data
 * @param data - Location creation data
 * @returns Object with validation result and errors
 */
export function validateLocationData(data: any): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  // Required fields
  if (!data.name || !data.name.trim()) {
    errors.push('Location name is required');
  }

  // Validate email format if provided
  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate phone format if provided (basic validation)
  if (data.phone && data.phone.trim()) {
    const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push('Invalid phone number format');
    }
  }

  // Validate website URL if provided
  if (data.website_url && data.website_url.trim()) {
    try {
      new URL(data.website_url);
    } catch {
      errors.push('Invalid website URL format');
    }
  }

  // Validate color format if provided (hex colors)
  const validateHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  if (data.primary_color && !validateHexColor(data.primary_color)) {
    errors.push('Primary color must be a valid hex color (e.g., #FF0000)');
  }

  if (data.secondary_color && !validateHexColor(data.secondary_color)) {
    errors.push('Secondary color must be a valid hex color (e.g., #FF0000)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format location display name with address
 * @param location - The business location
 * @returns string - Formatted display name
 */
export function formatLocationDisplay(location: BusinessLocation): string {
  let display = location.name;
  
  if (location.address_city && location.address_state) {
    display += ` - ${location.address_city}, ${location.address_state}`;
  } else if (location.address_city) {
    display += ` - ${location.address_city}`;
  } else if (location.address_state) {
    display += ` - ${location.address_state}`;
  }
  
  return display;
}

/**
 * Sort locations by name alphabetically
 * @param locations - Array of business locations
 * @returns Sorted array of locations
 */
export function sortLocationsByName(locations: BusinessLocation[]): BusinessLocation[] {
  return [...locations].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter active locations
 * @param locations - Array of business locations
 * @returns Array of active locations only
 */
export function getActiveLocations(locations: BusinessLocation[]): BusinessLocation[] {
  return locations.filter(location => location.is_active);
}

/**
 * Check if location data has changed (for optimistic updates)
 * @param original - Original location data
 * @param updated - Updated location data
 * @returns boolean - Whether the data has changed
 */
export function hasLocationChanged(
  original: BusinessLocation, 
  updated: Partial<BusinessLocation>
): boolean {
  const fieldsToCheck = [
    'name', 'business_name', 'address_street', 'address_city', 'address_state',
    'address_zip', 'address_country', 'business_description', 'unique_aspects',
    'phone', 'email', 'website_url', 'ai_dos', 'ai_donts'
  ];

  return fieldsToCheck.some(field => {
    const key = field as keyof BusinessLocation;
    return updated[key] !== undefined && updated[key] !== original[key];
  });
}