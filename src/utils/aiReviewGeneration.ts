/**
 * Centralized AI Review Generation Utilities
 * 
 * This file contains functions to generate AI reviews and testimonials
 * with proper business context, ensuring consistency across the app.
 */

import { generateAIReview } from './ai';

interface BusinessProfile {
  business_name?: string;
  name?: string;
  services_offered?: string;
  company_values?: string;
  differentiators?: string;
  years_in_business?: number | string;
  industries_served?: string;
  tagline?: string;
  team_founder_info?: string;
  keywords?: string | string[]; // Can be string (legacy) or array (new format)
  industry?: (string | null)[];
  industry_other?: string | null;
  industries_other?: string | null;
  ai_dos?: string;
  ai_donts?: string;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  // Allow additional properties from business profile
  [key: string]: unknown;
}

interface PromptPageData {
  // Common fields
  project_type?: string;
  review_type?: string;
  product_description?: string;
  outcomes?: string;
  location?: string;
  client_name?: string;

  // Universal page fields
  is_universal?: boolean;
  friendly_note?: string;

  // Product page fields
  product_name?: string;
  product_subcopy?: string;
  features_or_benefits?: string[];
  category?: string;

  // Photo page fields
  photo_context?: string;
  photo_description?: string;

  // Location page fields
  location_name?: string;
  business_location_id?: string;

  // Service page fields
  service_name?: string;
  service_description?: string;

  // Additional context fields
  date_completed?: string;
  team_member?: string;
  assigned_team_members?: string;

  // Page-level keywords (takes precedence over business keywords)
  keywords?: string | string[];
}

interface ReviewerData {
  firstName?: string;
  lastName?: string;
  role?: string;
}

/**
 * Transform raw business profile data into AI generation format
 * Note: Keywords can be overridden by page-level keywords
 */
function createBusinessProfileForAI(businessProfile: BusinessProfile, pageKeywords?: string | string[]) {
  // Use page-level keywords if provided, otherwise fall back to business profile keywords
  let keywords = "";
  if (pageKeywords) {
    keywords = Array.isArray(pageKeywords) ? pageKeywords.join(", ") : pageKeywords;
  } else if (businessProfile.keywords) {
    keywords = Array.isArray(businessProfile.keywords)
      ? businessProfile.keywords.join(", ")
      : businessProfile.keywords;
  }

  return {
    business_name: businessProfile.business_name || businessProfile.name || "Business",
    features_or_benefits: businessProfile.services_offered ? [businessProfile.services_offered] : [],
    company_values: businessProfile.company_values || "",
    differentiators: businessProfile.differentiators || "",
    years_in_business: businessProfile.years_in_business || 0,
    industries_served: businessProfile.industries_served || "",
    taglines: businessProfile.tagline || "",
    team_founder_info: businessProfile.team_founder_info || "",
    keywords: keywords,
    industry: businessProfile.industry || [],
    industry_other: businessProfile.industry_other || "",
    ai_dos: businessProfile.ai_dos || "",
    ai_donts: businessProfile.ai_donts || "",
    address_city: businessProfile.address_city || "",
    address_state: businessProfile.address_state || "",
    address_zip: businessProfile.address_zip || "",
  };
}

/**
 * Transform prompt page and reviewer data into AI generation format with page-specific context
 */
function createPromptPageDataForAI(
  promptPage: PromptPageData, 
  reviewer: ReviewerData
) {
  let projectType = promptPage.project_type || promptPage.review_type || "service";
  let productDescription = promptPage.product_description || promptPage.outcomes || "great experience";
  
  // Enhance context based on page type
  if (promptPage.review_type === 'product' && promptPage.product_name) {
    projectType = `${promptPage.product_name} - ${projectType}`;
    if (promptPage.product_subcopy) {
      productDescription = `${promptPage.product_subcopy}. ${productDescription}`;
    }
    if (promptPage.features_or_benefits && promptPage.features_or_benefits.length > 0) {
      productDescription += ` Key features: ${promptPage.features_or_benefits.join(', ')}.`;
    }
  }
  
  if (promptPage.review_type === 'service' && promptPage.service_name) {
    projectType = `${promptPage.service_name} - ${projectType}`;
    if (promptPage.service_description) {
      productDescription = `${promptPage.service_description}. ${productDescription}`;
    }
  }
  
  if (promptPage.location_name) {
    productDescription += ` Location: ${promptPage.location_name}.`;
  }
  
  if (promptPage.location) {
    productDescription += ` Service area: ${promptPage.location}.`;
  }
  
  if (promptPage.date_completed) {
    productDescription += ` Completed: ${promptPage.date_completed}.`;
  }
  
  if (promptPage.team_member || promptPage.assigned_team_members) {
    const teamInfo = promptPage.team_member || promptPage.assigned_team_members;
    productDescription += ` Team member(s): ${teamInfo}.`;
  }
  
  if (promptPage.photo_context) {
    productDescription += ` Photo context: ${promptPage.photo_context}.`;
  }
  
  if (promptPage.friendly_note) {
    productDescription += ` Additional context: ${promptPage.friendly_note}.`;
  }
  
  return {
    first_name: reviewer.firstName || "",
    last_name: reviewer.lastName || "",
    role: reviewer.role || "",
    project_type: projectType,
    product_description: productDescription,
  };
}

/**
 * Generate AI review with proper business context for any prompt page type
 * Uses page-level keywords if available, otherwise falls back to business profile keywords
 */
export async function generateContextualReview(
  businessProfile: BusinessProfile,
  promptPage: PromptPageData,
  reviewer: ReviewerData,
  platform: string,
  wordLimit: number = 150,
  customInstructions: string = "",
  reviewerType: "customer" | "client" | "customer or client" = "customer",
  additionalDos: string = "",
  additionalDonts: string = ""
): Promise<string> {
  // Pass page-level keywords to override business profile keywords
  const businessProfileForAI = createBusinessProfileForAI(businessProfile, promptPage.keywords);
  const promptPageDataForAI = createPromptPageDataForAI(promptPage, reviewer);

  return await generateAIReview(
    businessProfileForAI,
    promptPageDataForAI,
    platform,
    wordLimit,
    customInstructions,
    reviewerType,
    additionalDos,
    additionalDonts
  );
}

/**
 * Generate AI testimonial (shorter form for photo testimonials)
 */
export async function generateContextualTestimonial(
  businessProfile: BusinessProfile,
  promptPage: PromptPageData,
  reviewer: ReviewerData,
  customInstructions: string = ""
): Promise<string> {
  return await generateContextualReview(
    businessProfile,
    promptPage,
    reviewer,
    "testimonial",
    100, // Shorter word limit for testimonials
    customInstructions,
    "customer"
  );
}

/**
 * Parse reviewer name into first/last name components
 */
export function parseReviewerName(fullName: string): { firstName: string; lastName: string } {
  const nameParts = fullName.trim().split(' ');
  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(' ') || ""
  };
} 