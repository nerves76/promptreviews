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

  console.log('[BusinessValidation] Validating business:', business);

  // Normalize and check business name
  if (!business.name || business.name.trim() === '') {
    console.log('[BusinessValidation] ❌ Missing: Business Name');
    missingFields.push('Business Name');
  } else {
    console.log('[BusinessValidation] ✅ Has: Business Name =', business.name);
  }

  // Check industry array OR industries_other/industry_other field (both singular and plural for compatibility)
  const hasIndustry = (Array.isArray(business.industry) && business.industry.length > 0 && business.industry.some(i => i && i.trim())) ||
                      (business.industries_other && business.industries_other.trim() !== '') ||
                      (business.industry_other && business.industry_other.trim() !== '');

  if (!hasIndustry) {
    console.log('[BusinessValidation] ❌ Missing: Business Type/Industry', {
      industry: business.industry,
      industries_other: business.industries_other,
      industry_other: business.industry_other
    });
    missingFields.push('Business Type/Industry');
  } else {
    console.log('[BusinessValidation] ✅ Has: Business Type/Industry');
  }

  if (!business.address_city || business.address_city.trim() === '') {
    console.log('[BusinessValidation] ❌ Missing: City');
    missingFields.push('City');
  } else {
    console.log('[BusinessValidation] ✅ Has: City =', business.address_city);
  }

  if (!business.address_state || business.address_state.trim() === '') {
    console.log('[BusinessValidation] ❌ Missing: State');
    missingFields.push('State');
  } else {
    console.log('[BusinessValidation] ✅ Has: State =', business.address_state);
  }

  if (!business.about_us || business.about_us.trim() === '') {
    console.log('[BusinessValidation] ❌ Missing: About Us');
    missingFields.push('About Us');
  } else {
    console.log('[BusinessValidation] ✅ Has: About Us');
  }

  if (!business.differentiators || business.differentiators.trim() === '') {
    console.log('[BusinessValidation] ❌ Missing: Differentiators');
    missingFields.push('Differentiators');
  } else {
    console.log('[BusinessValidation] ✅ Has: Differentiators');
  }

  // More robust years check - handle string, number, null, undefined
  const yearsValue = business.years_in_business;
  const yearsInt = yearsValue ? parseInt(String(yearsValue)) : 0;
  if (!yearsValue || String(yearsValue).trim() === '' || isNaN(yearsInt) || yearsInt <= 0) {
    console.log('[BusinessValidation] ❌ Missing: Years in Business', { yearsValue, yearsInt });
    missingFields.push('Years in Business');
  } else {
    console.log('[BusinessValidation] ✅ Has: Years in Business =', yearsValue);
  }

  // More robust services check - handle array, null, undefined, empty array
  if (!Array.isArray(business.services_offered) || business.services_offered.length === 0 || !business.services_offered.some(s => s && s.trim())) {
    console.log('[BusinessValidation] ❌ Missing: Services Offered', { services_offered: business.services_offered });
    missingFields.push('Services Offered');
  } else {
    console.log('[BusinessValidation] ✅ Has: Services Offered =', business.services_offered);
  }

  console.log('[BusinessValidation] Result:', { isValid: missingFields.length === 0, missingFields });

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
