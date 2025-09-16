/**
 * Google Business Profile AI Helpers
 * 
 * Shared utilities and types for AI-powered Google Business Profile features.
 * Provides brand context extraction and common helper functions.
 */

// Types for AI brand context (minimal data for brand voice)
export interface AIBrandContext {
  businessName: string;
  city: string;
  industry: string[];
  companyValues?: string;
  differentiators?: string;
  aiDos?: string;
  aiDonts?: string;
  taglines?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  regularHours?: string;
  specialHours?: string;
}

// Types for service description generation
export interface ServiceDescriptionOptions {
  short: string;   // ~50 words
  medium: string;  // ~100 words
  long: string;    // ~150 words
}

// Types for business description analysis
export interface DescriptionAnalysis {
  seoScore: number;        // 1-10
  characterCount: number;
  improvements: string[];
  keywordSuggestions: string[];
  optimizedDescription: string;
}

// Types for review response generation
export interface ReviewResponseResult {
  response: string;
  tone: 'professional' | 'friendly' | 'apologetic';
}

/**
 * Extract minimal brand context from business profile data
 */
export function extractBrandContext(businessProfile: any): AIBrandContext {
  return {
    businessName: businessProfile?.name || businessProfile?.business_name || 'Your Business',
    city: businessProfile?.address_city || '',
    industry: Array.isArray(businessProfile?.industry) 
      ? businessProfile.industry 
      : businessProfile?.industry ? [businessProfile.industry] : [],
    companyValues: businessProfile?.company_values?.trim() || undefined,
    differentiators: businessProfile?.differentiators?.trim() || undefined,
    aiDos: businessProfile?.ai_dos?.trim() || undefined,
    aiDonts: businessProfile?.ai_donts?.trim() || undefined,
    taglines: businessProfile?.taglines?.trim() || undefined,
  };
}

/**
 * Create brand voice instructions for AI prompts
 */
export function createBrandVoiceInstructions(brandContext: AIBrandContext): string {
  let instructions = `Business: ${brandContext.businessName}`;
  
  if (brandContext.city) {
    instructions += ` in ${brandContext.city}`;
  }
  
  if (brandContext.industry.length > 0) {
    instructions += `\nIndustry: ${brandContext.industry.join(', ')}`;
  }
  
  if (brandContext.companyValues) {
    instructions += `\nCompany Values: ${brandContext.companyValues}`;
  }
  
  if (brandContext.differentiators) {
    instructions += `\nWhat makes us unique: ${brandContext.differentiators}`;
  }
  
  if (brandContext.taglines) {
    instructions += `\nTaglines: ${brandContext.taglines}`;
  }
  
  if (brandContext.aiDos) {
    instructions += `\nAI Dos (always include): ${brandContext.aiDos}`;
  }
  
  if (brandContext.aiDonts) {
    instructions += `\nAI Don'ts (never mention): ${brandContext.aiDonts}`;
  }
  
  return instructions;
}

/**
 * Get local SEO keywords based on business context
 */
export function generateLocalKeywords(brandContext: AIBrandContext, serviceType?: string): string[] {
  const keywords: string[] = [];
  
  if (brandContext.city) {
    if (serviceType) {
      keywords.push(`${serviceType} in ${brandContext.city}`);
      keywords.push(`${brandContext.city} ${serviceType}`);
    }
    keywords.push(`${brandContext.businessName} ${brandContext.city}`);
  }
  
  // Add industry-specific keywords
  brandContext.industry.forEach(industry => {
    if (brandContext.city) {
      keywords.push(`${industry} ${brandContext.city}`);
    }
    if (serviceType) {
      keywords.push(`${industry} ${serviceType}`);
    }
  });
  
  return keywords;
}

/**
 * Validate and clean generated content
 */
export function validateGeneratedContent(content: string, maxLength?: number): string {
  if (!content || content.trim().length === 0) {
    throw new Error('Generated content is empty');
  }
  
  let cleaned = content.trim();
  
  // Remove excessive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Ensure proper sentence endings
  if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.';
  }
  
  // Smart truncation if too long
  if (maxLength && cleaned.length > maxLength) {
    // Try to truncate at sentence boundary first
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim());
    let truncated = '';
    
    for (const sentence of sentences) {
      const withSentence = truncated + sentence + '.';
      if (withSentence.length <= maxLength) {
        truncated = withSentence;
      } else {
        break;
      }
    }
    
    // If we have at least one complete sentence, use it
    if (truncated.length > 0) {
      cleaned = truncated;
    } else {
      // Fallback to character truncation without ellipsis for cleaner endings
      cleaned = cleaned.substring(0, maxLength);
      // Try to end at a word boundary
      const lastSpace = cleaned.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.8) { // Only if we don't lose too much content
        cleaned = cleaned.substring(0, lastSpace) + '.';
      } else if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
        cleaned = cleaned.substring(0, maxLength - 1) + '.';
      }
    }
  }
  
  return cleaned;
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate SEO score based on description analysis
 */
export function calculateSEOScore(description: string, brandContext: AIBrandContext): number {
  let score = 0;
  const length = description.length;
  const words = countWords(description);
  
  // Length score (0-3 points)
  if (length >= 150 && length <= 500) score += 3;
  else if (length >= 100 && length <= 600) score += 2;
  else if (length >= 50) score += 1;
  
  // Local keywords (0-2 points)
  const lowerDesc = description.toLowerCase();
  if (brandContext.city && lowerDesc.includes(brandContext.city.toLowerCase())) score += 1;
  if (brandContext.businessName && lowerDesc.includes(brandContext.businessName.toLowerCase())) score += 1;
  
  // Industry keywords (0-2 points)
  const industryMatches = brandContext.industry.filter(industry => 
    lowerDesc.includes(industry.toLowerCase())
  );
  if (industryMatches.length > 0) score += Math.min(2, industryMatches.length);
  
  // Readability (0-2 points)
  const avgWordsPerSentence = words / (description.split(/[.!?]+/).filter(s => s.trim()).length);
  if (avgWordsPerSentence <= 20) score += 2;
  else if (avgWordsPerSentence <= 30) score += 1;
  
  // Call to action (0-1 point)
  const ctaWords = ['contact', 'call', 'visit', 'book', 'schedule', 'get', 'learn more'];
  if (ctaWords.some(word => lowerDesc.includes(word))) score += 1;
  
  return Math.min(10, score);
} 