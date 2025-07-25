/**
 * Business Description Analyzer
 * 
 * AI-powered analysis and optimization of Google Business Profile descriptions.
 * Provides SEO scoring, keyword suggestions, and optimized descriptions.
 */

import { AIBrandContext, DescriptionAnalysis, createBrandVoiceInstructions, generateLocalKeywords, validateGeneratedContent, calculateSEOScore, countWords } from './googleBusinessProfileHelpers';

/**
 * Analyze business description for SEO optimization
 */
export function analyzeBusinessDescription(
  description: string,
  brandContext: AIBrandContext
): Omit<DescriptionAnalysis, 'optimizedDescription'> {
  const seoScore = calculateSEOScore(description, brandContext);
  const characterCount = description.length;
  const wordCount = countWords(description);
  
  const improvements: string[] = [];
  const keywordSuggestions = generateLocalKeywords(brandContext);
  
  // Character count analysis
  if (characterCount < 150) {
    improvements.push("Your description is too short. Aim for 150-500 characters to provide more detail about your business.");
  } else if (characterCount > 750) {
    improvements.push("Your description exceeds Google's 750-character limit. Consider condensing your message.");
  }
  
  // Keyword analysis
  const lowerDesc = description.toLowerCase();
  if (!brandContext.city || !lowerDesc.includes(brandContext.city.toLowerCase())) {
    improvements.push(`Include your location (${brandContext.city}) to improve local search visibility.`);
  }
  
  if (!lowerDesc.includes(brandContext.businessName.toLowerCase())) {
    improvements.push("Include your business name naturally in the description for better brand recognition.");
  }
  
  // Industry keywords
  const hasIndustryKeywords = brandContext.industry.some(industry => 
    lowerDesc.includes(industry.toLowerCase())
  );
  if (!hasIndustryKeywords && brandContext.industry.length > 0) {
    improvements.push(`Include industry-relevant keywords like "${brandContext.industry[0]}" to help customers find you.`);
  }
  
  // Call to action analysis
  const ctaWords = ['contact', 'call', 'visit', 'book', 'schedule', 'get', 'learn more'];
  const hasCallToAction = ctaWords.some(word => lowerDesc.includes(word));
  if (!hasCallToAction) {
    improvements.push("Add a call-to-action to encourage customers to contact or visit you.");
  }
  
  // Readability analysis
  const sentences = description.split(/[.!?]+/).filter(s => s.trim());
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
  if (avgWordsPerSentence > 25) {
    improvements.push("Break up long sentences to improve readability. Aim for 15-20 words per sentence.");
  }
  
  // Value proposition analysis
  const valueWords = ['best', 'quality', 'professional', 'experienced', 'expert', 'certified', 'award', 'trusted'];
  const hasValueProps = valueWords.some(word => lowerDesc.includes(word));
  if (!hasValueProps) {
    improvements.push("Highlight what makes your business unique or trustworthy (e.g., 'experienced,' 'certified,' 'award-winning').");
  }
  
  // Service specificity
  if (description.length > 100 && !lowerDesc.includes('service') && !lowerDesc.includes('provide')) {
    improvements.push("Be more specific about the services you provide to help customers understand what you offer.");
  }
  
  return {
    seoScore,
    characterCount,
    improvements,
    keywordSuggestions: keywordSuggestions.slice(0, 5) // Limit to top 5 suggestions
  };
}

/**
 * Generate AI prompt for business description optimization
 */
export function createBusinessDescriptionOptimizationPrompt(
  currentDescription: string,
  brandContext: AIBrandContext,
  analysis: Omit<DescriptionAnalysis, 'optimizedDescription'>
): string {
  const brandInstructions = createBrandVoiceInstructions(brandContext);
  const keywords = analysis.keywordSuggestions.slice(0, 3);
  
  return `You are a seasoned local SEO expert optimizing Google Business Profile descriptions for maximum visibility and conversions.

${brandInstructions}

CURRENT DESCRIPTION:
"${currentDescription}"

SEO ANALYSIS:
- Current SEO Score: ${analysis.seoScore}/10
- Character Count: ${analysis.characterCount}/750
- Key Issues: ${analysis.improvements.join('; ')}

OPTIMIZATION TASK:
Rewrite this business description to achieve a 9-10 SEO score while maintaining authenticity and brand voice.

REQUIREMENTS:
- Length: 150-500 characters (optimal for Google Business Profile)
- Include business location naturally: ${brandContext.city}
- Include primary services/industry: ${brandContext.industry.join(', ')}
- Add a clear call-to-action
- Professional yet approachable tone
- Highlight unique value proposition

${keywords.length > 0 ? `SUGGESTED KEYWORDS (use naturally): ${keywords.join(', ')}` : ''}

GOOGLE BUSINESS PROFILE BEST PRACTICES:
- Start with what you do and who you serve
- Include specific services or products
- Mention years of experience, certifications, or awards if applicable
- Add location-specific details
- End with how customers can take action
- NO keyword stuffing - keep it natural and customer-focused
- Use active voice and confident language

STRUCTURE GUIDANCE:
1. Opening: What you do + who you serve
2. Middle: Key services/products + unique value
3. Closing: Location + call-to-action

Return ONLY the optimized description text, no quotes or formatting.`;
}

/**
 * Generate optimized business description using AI
 */
export async function generateOptimizedDescription(
  currentDescription: string,
  brandContext: AIBrandContext
): Promise<DescriptionAnalysis> {
  // First analyze the current description
  const analysis = analyzeBusinessDescription(currentDescription, brandContext);
  
  // If score is already high, return current description with minor optimization
  if (analysis.seoScore >= 8) {
    return {
      ...analysis,
      optimizedDescription: optimizeDescriptionFormat(currentDescription, brandContext)
    };
  }
  
  const prompt = createBusinessDescriptionOptimizationPrompt(currentDescription, brandContext, analysis);
  
  try {
    const response = await fetch('/api/generate-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt,
        user_id: null // This will be handled by the API endpoint
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.text) {
      throw new Error('No optimized description generated');
    }
    
    let optimizedDescription = validateGeneratedContent(data.text, 750);
    optimizedDescription = optimizeDescriptionFormat(optimizedDescription, brandContext);
    
    // Re-analyze the optimized description
    const optimizedAnalysis = analyzeBusinessDescription(optimizedDescription, brandContext);
    
    return {
      ...optimizedAnalysis,
      optimizedDescription
    };
  } catch (error) {
    console.error('Error generating optimized description:', error);
    
    // Fallback to manual optimization
    const fallbackDescription = createFallbackOptimizedDescription(currentDescription, brandContext);
    const fallbackAnalysis = analyzeBusinessDescription(fallbackDescription, brandContext);
    
    return {
      ...fallbackAnalysis,
      optimizedDescription: fallbackDescription
    };
  }
}

/**
 * Create fallback optimized description when AI fails
 */
function createFallbackOptimizedDescription(
  currentDescription: string,
  brandContext: AIBrandContext
): string {
  const location = brandContext.city ? ` in ${brandContext.city}` : '';
  const industry = brandContext.industry.length > 0 ? brandContext.industry[0] : 'business';
  
  // If current description is too short, expand it
  if (currentDescription.length < 100) {
    return `${brandContext.businessName} provides professional ${industry.toLowerCase()} services${location}. We specialize in delivering quality results with personalized customer service. Our experienced team is committed to exceeding your expectations. Contact us today to learn how we can help you.`;
  }
  
  // If current description is decent but needs optimization, enhance it
  let optimized = currentDescription;
  
  // Ensure location is mentioned
  if (brandContext.city && !optimized.toLowerCase().includes(brandContext.city.toLowerCase())) {
    optimized = optimized.replace(/\.$/, ` in ${brandContext.city}.`);
  }
  
  // Ensure business name is included
  if (!optimized.toLowerCase().includes(brandContext.businessName.toLowerCase())) {
    optimized = `${brandContext.businessName} - ${optimized}`;
  }
  
  // Add call to action if missing
  const ctaWords = ['contact', 'call', 'visit', 'book', 'schedule'];
  const hasCallToAction = ctaWords.some(word => optimized.toLowerCase().includes(word));
  if (!hasCallToAction) {
    optimized = optimized.replace(/\.$/, '. Contact us today to get started.');
  }
  
  return optimized;
}

/**
 * Optimize description formatting and structure
 */
function optimizeDescriptionFormat(description: string, brandContext: AIBrandContext): string {
  let optimized = description.trim();
  
  // Ensure proper capitalization
  optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);
  
  // Ensure proper ending punctuation
  if (!optimized.endsWith('.') && !optimized.endsWith('!') && !optimized.endsWith('?')) {
    optimized += '.';
  }
  
  // Remove excessive spaces
  optimized = optimized.replace(/\s+/g, ' ');
  
  // Ensure business name capitalization is correct
  const businessNameRegex = new RegExp(brandContext.businessName, 'gi');
  optimized = optimized.replace(businessNameRegex, brandContext.businessName);
  
  return optimized;
}

/**
 * Compare two descriptions and provide improvement metrics
 */
export function compareDescriptions(
  originalDescription: string,
  optimizedDescription: string,
  brandContext: AIBrandContext
): {
  originalScore: number;
  optimizedScore: number;
  improvement: number;
  keyImprovements: string[];
} {
  const originalAnalysis = analyzeBusinessDescription(originalDescription, brandContext);
  const optimizedAnalysis = analyzeBusinessDescription(optimizedDescription, brandContext);
  
  const improvement = optimizedAnalysis.seoScore - originalAnalysis.seoScore;
  
  const keyImprovements: string[] = [];
  
  if (optimizedDescription.length > originalDescription.length) {
    keyImprovements.push(`Added ${optimizedDescription.length - originalDescription.length} characters of valuable content`);
  }
  
  if (originalAnalysis.improvements.length > optimizedAnalysis.improvements.length) {
    keyImprovements.push(`Resolved ${originalAnalysis.improvements.length - optimizedAnalysis.improvements.length} SEO issues`);
  }
  
  const originalKeywordCount = originalAnalysis.keywordSuggestions.filter(keyword => 
    originalDescription.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  
  const optimizedKeywordCount = optimizedAnalysis.keywordSuggestions.filter(keyword => 
    optimizedDescription.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  
  if (optimizedKeywordCount > originalKeywordCount) {
    keyImprovements.push(`Improved keyword optimization (+${optimizedKeywordCount - originalKeywordCount} keywords)`);
  }
  
  return {
    originalScore: originalAnalysis.seoScore,
    optimizedScore: optimizedAnalysis.seoScore,
    improvement,
    keyImprovements
  };
}

/**
 * Generate SEO improvement recommendations
 */
export function generateSEORecommendations(
  description: string,
  brandContext: AIBrandContext
): {
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  impact: string;
}[] {
  const analysis = analyzeBusinessDescription(description, brandContext);
  const recommendations = [];
  
  // High priority recommendations
  if (description.length < 150) {
    recommendations.push({
      priority: 'high' as const,
      category: 'Content Length',
      recommendation: 'Expand your description to 150-500 characters with specific service details',
      impact: 'Improves search visibility and provides more context to customers'
    });
  }
  
  if (!description.toLowerCase().includes(brandContext.city.toLowerCase())) {
    recommendations.push({
      priority: 'high' as const,
      category: 'Local SEO',
      recommendation: `Include "${brandContext.city}" naturally in your description`,
      impact: 'Significantly improves local search rankings'
    });
  }
  
  // Medium priority recommendations
  const ctaWords = ['contact', 'call', 'visit', 'book', 'schedule'];
  const hasCallToAction = ctaWords.some(word => description.toLowerCase().includes(word));
  if (!hasCallToAction) {
    recommendations.push({
      priority: 'medium' as const,
      category: 'Call to Action',
      recommendation: 'Add a clear call-to-action like "Contact us today" or "Visit our location"',
      impact: 'Encourages customer engagement and conversions'
    });
  }
  
  if (brandContext.industry.length > 0 && !brandContext.industry.some(industry => 
    description.toLowerCase().includes(industry.toLowerCase())
  )) {
    recommendations.push({
      priority: 'medium' as const,
      category: 'Industry Keywords',
      recommendation: `Include industry terms like "${brandContext.industry[0]}" to improve relevance`,
      impact: 'Helps customers understand your services and improves search matching'
    });
  }
  
  // Low priority recommendations
  const valueWords = ['professional', 'experienced', 'certified', 'award', 'trusted', 'quality'];
  const hasValueProps = valueWords.some(word => description.toLowerCase().includes(word));
  if (!hasValueProps) {
    recommendations.push({
      priority: 'low' as const,
      category: 'Value Proposition',
      recommendation: 'Highlight credentials or unique qualities (e.g., "experienced," "certified")',
      impact: 'Builds trust and differentiates from competitors'
    });
  }
  
  return recommendations;
} 