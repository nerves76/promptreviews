/**
 * Business validation utilities for keyword generation and other AI features
 */

export interface BusinessValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export interface BusinessDetailsForValidation {
  name?: string;
  industry?: string[] | null;
  industries_other?: string; // Database column (plural)
  industry_other?: string; // Form field (singular) - for backward compatibility
  address_city?: string;
  address_state?: string;
  about_us?: string;
  differentiators?: string;
  years_in_business?: string | null;
  services_offered?: string[] | null;
  industries_served?: string; // Optional - helps AI but not required
}

/**
 * Validates if a business has the required information for keyword generation
 *
 * Required fields:
 * - Business name
 * - Business type/industry
 * - City
 * - State
 * - About us
 * - Differentiators
 * - Years in business
 * - Services or offerings
 */
export function validateBusinessForKeywordGeneration(
  business: BusinessDetailsForValidation
): BusinessValidationResult {
  const missingFields: string[] = [];

  if (!business.name || business.name.trim() === '') {
    missingFields.push('Business Name');
  }

  // Check industry array OR industries_other/industry_other field (both singular and plural for compatibility)
  const hasIndustry = (business.industry && business.industry.length > 0) ||
                      (business.industries_other && business.industries_other.trim() !== '') ||
                      (business.industry_other && business.industry_other.trim() !== '');

  if (!hasIndustry) {
    missingFields.push('Business Type/Industry');
  }

  if (!business.address_city || business.address_city.trim() === '') {
    missingFields.push('City');
  }

  if (!business.address_state || business.address_state.trim() === '') {
    missingFields.push('State');
  }

  if (!business.about_us || business.about_us.trim() === '') {
    missingFields.push('About Us');
  }

  if (!business.differentiators || business.differentiators.trim() === '') {
    missingFields.push('Differentiators');
  }

  if (!business.years_in_business || business.years_in_business.trim() === '' || parseInt(business.years_in_business) <= 0) {
    missingFields.push('Years in Business');
  }

  if (!business.services_offered || business.services_offered.length === 0) {
    missingFields.push('Services Offered');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Gets a user-friendly message about missing business details
 */
export function getMissingFieldsMessage(missingFields: string[]): string {
  if (missingFields.length === 0) {
    return '';
  }

  if (missingFields.length === 1) {
    return `Please add your ${missingFields[0]} in Your Business settings to enable keyword generation.`;
  }

  const lastField = missingFields[missingFields.length - 1];
  const otherFields = missingFields.slice(0, -1).join(', ');

  return `Please add your ${otherFields}, and ${lastField} in Your Business settings to enable keyword generation.`;
}
