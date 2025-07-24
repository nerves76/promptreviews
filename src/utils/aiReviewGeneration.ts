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
  years_in_business?: number;
  industries_served?: string;
  tagline?: string;
  team_founder_info?: string;
  keywords?: string;
  industry?: string[];
  industry_other?: string;
  ai_dos?: string;
  ai_donts?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
}

interface PromptPageData {
  project_type?: string;
  review_type?: string;
  product_description?: string;
  outcomes?: string;
}

interface ReviewerData {
  firstName?: string;
  lastName?: string;
  role?: string;
}

/**
 * Transform raw business profile data into AI generation format
 */
function createBusinessProfileForAI(businessProfile: BusinessProfile) {
  return {
    business_name: businessProfile.business_name || businessProfile.name || "Business",
    features_or_benefits: businessProfile.services_offered ? [businessProfile.services_offered] : [],
    company_values: businessProfile.company_values || "",
    differentiators: businessProfile.differentiators || "",
    years_in_business: businessProfile.years_in_business || 0,
    industries_served: businessProfile.industries_served || "",
    taglines: businessProfile.tagline || "",
    team_founder_info: businessProfile.team_founder_info || "",
    keywords: businessProfile.keywords || "",
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
 * Transform prompt page and reviewer data into AI generation format
 */
function createPromptPageDataForAI(
  promptPage: PromptPageData, 
  reviewer: ReviewerData
) {
  return {
    first_name: reviewer.firstName || "",
    last_name: reviewer.lastName || "",
    role: reviewer.role || "",
    project_type: promptPage.project_type || promptPage.review_type || "service",
    product_description: promptPage.product_description || promptPage.outcomes || "great experience",
  };
}

/**
 * Generate AI review with proper business context
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
  const businessProfileForAI = createBusinessProfileForAI(businessProfile);
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