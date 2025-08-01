/**
 * Review Response Generator
 * 
 * AI-powered review response generation for Google Business Profile.
 * Creates brand-appropriate responses for different review sentiments.
 */

import { AIBrandContext, ReviewResponseResult, createBrandVoiceInstructions, validateGeneratedContent } from './googleBusinessProfileHelpers';

/**
 * Determine review sentiment and appropriate response tone
 */
export function analyzeReviewSentiment(reviewText: string, starRating: number): {
  sentiment: 'positive' | 'neutral' | 'negative';
  tone: 'professional' | 'friendly' | 'apologetic';
} {
  let sentiment: 'positive' | 'neutral' | 'negative';
  let tone: 'professional' | 'friendly' | 'apologetic';
  
  // Determine sentiment based on star rating and content
  if (starRating >= 4) {
    sentiment = 'positive';
    tone = 'friendly';
  } else if (starRating === 3) {
    sentiment = 'neutral';
    tone = 'professional';
  } else {
    sentiment = 'negative';
    tone = 'apologetic';
  }
  
  // Analyze text for additional sentiment cues
  const lowerText = reviewText.toLowerCase();
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'outstanding'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointed', 'frustrated', 'angry'];
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  // Adjust sentiment based on text analysis
  if (negativeCount > positiveCount && starRating >= 3) {
    sentiment = 'neutral';
    tone = 'professional';
  } else if (positiveCount > negativeCount && starRating <= 3) {
    sentiment = 'neutral';
    tone = 'professional';
  }
  
  return { sentiment, tone };
}

/**
 * Generate AI prompt for review responses
 */
export function createReviewResponsePrompt(
  reviewText: string,
  starRating: number,
  brandContext: AIBrandContext,
  reviewerName?: string
): string {
  const brandInstructions = createBrandVoiceInstructions(brandContext);
  const { sentiment, tone } = analyzeReviewSentiment(reviewText, starRating);
  
  const reviewerGreeting = reviewerName ? `Hi ${reviewerName.split(' ')[0]},` : 'Hi there,';
  
  const responseGuidelines = {
    positive: {
      approach: 'Express genuine gratitude and reinforce positive aspects',
      elements: ['Thank them specifically', 'Mention what they appreciated', 'Invite them back', 'Encourage others']
    },
    neutral: {
      approach: 'Acknowledge feedback professionally and address any concerns',
      elements: ['Thank them for feedback', 'Address specific points', 'Show commitment to improvement', 'Invite further discussion']
    },
    negative: {
      approach: 'Apologize sincerely and offer to resolve issues',
      elements: ['Apologize for the experience', 'Take responsibility', 'Offer to discuss privately', 'Show commitment to improvement']
    }
  };
  
  const guidance = responseGuidelines[sentiment];
  
  return `You are a seasoned local SEO expert writing Google Business Profile review responses that build trust and encourage future customers.

${brandInstructions}

REVIEW TO RESPOND TO:
Rating: ${starRating}/5 stars
Review: "${reviewText}"

RESPONSE REQUIREMENTS:
- Tone: ${tone} and authentic
- Approach: ${guidance.approach}
- Include these elements: ${guidance.elements.join(', ')}
- Start with: "${reviewerGreeting}"
- Length: 50-150 words
- Professional but human, not corporate-speak

GOOGLE BUSINESS PROFILE BEST PRACTICES:
- Always thank the reviewer first
- Address specific points they mentioned when possible
- Include your business name naturally
- ${sentiment === 'negative' ? 'Offer to resolve issues privately (phone/email)' : 'Subtly encourage others to visit'}
- End on a positive, forward-looking note
- NO generic templates - make it specific to this review

${sentiment === 'negative' ? 'NEGATIVE REVIEW STRATEGY:\n- Acknowledge their frustration\n- Take responsibility without making excuses\n- Offer specific next steps\n- Move conversation offline when appropriate' : ''}

${sentiment === 'positive' ? 'POSITIVE REVIEW STRATEGY:\n- Highlight specific aspects they loved\n- Reinforce your business strengths\n- Welcome them back\n- Encourage others subtly' : ''}

Return ONLY the response text, no quotes or formatting.`;
}

/**
 * Generate review response using AI
 */
export async function generateReviewResponse(
  reviewText: string,
  starRating: number,
  brandContext: AIBrandContext,
  reviewerName?: string
): Promise<ReviewResponseResult> {
  const prompt = createReviewResponsePrompt(reviewText, starRating, brandContext, reviewerName);
  const { sentiment, tone } = analyzeReviewSentiment(reviewText, starRating);
  
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
      throw new Error('No response generated');
    }
    
    const cleanedResponse = validateGeneratedContent(data.text, 800); // Max ~150 words
    
    return {
      response: cleanedResponse,
      tone
    };
  } catch (error) {
    console.error('Error generating review response:', error);
    
    // Fallback response
    return {
      response: getFallbackResponse(reviewText, starRating, brandContext, reviewerName),
      tone
    };
  }
}

/**
 * Fallback review responses when AI fails
 */
function getFallbackResponse(
  reviewText: string,
  starRating: number,
  brandContext: AIBrandContext,
  reviewerName?: string
): string {
  const greeting = reviewerName ? `Hi ${reviewerName.split(' ')[0]},` : 'Hi there,';
  const businessName = brandContext.businessName;
  
  if (starRating >= 4) {
    return `${greeting} Thank you so much for taking the time to leave such a wonderful review! We're thrilled that you had a great experience with ${businessName}. Your feedback means the world to us and motivates our team to keep delivering excellent service. We look forward to serving you again soon!`;
  } else if (starRating === 3) {
    return `${greeting} Thank you for your feedback about your experience with ${businessName}. We appreciate you taking the time to share your thoughts. We're always working to improve our service and would love to discuss your experience further. Please feel free to contact us directly so we can address any concerns.`;
  } else {
    return `${greeting} We sincerely apologize for not meeting your expectations during your experience with ${businessName}. Your feedback is important to us, and we take it seriously. We would like the opportunity to discuss this matter with you directly and work toward a resolution. Please contact us at your convenience so we can make things right.`;
  }
}

/**
 * Validate and optimize review response
 */
export function optimizeReviewResponse(
  response: string,
  reviewText: string,
  brandContext: AIBrandContext,
  maxWords: number = 150
): string {
  let optimized = validateGeneratedContent(response);
  
  // Ensure response includes business name
  if (!optimized.toLowerCase().includes(brandContext.businessName.toLowerCase())) {
    optimized = optimized.replace(/\b(we|our|us)\b/i, `${brandContext.businessName}`);
  }
  
  // Check word count and trim if necessary
  const words = optimized.split(/\s+/);
  if (words.length > maxWords) {
    // Find the last complete sentence within word limit
    const sentences = optimized.split(/[.!?]+/).filter(s => s.trim());
    let trimmed = '';
    let wordCount = 0;
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length;
      if (wordCount + sentenceWords <= maxWords) {
        trimmed += (trimmed ? '. ' : '') + sentence.trim();
        wordCount += sentenceWords;
      } else {
        break;
      }
    }
    
    if (trimmed) {
      optimized = trimmed + '.';
    } else {
      // If even first sentence is too long, truncate
      optimized = words.slice(0, maxWords).join(' ') + '...';
    }
  }
  
  return optimized;
}

/**
 * Extract key themes from review for response personalization
 */
export function extractReviewThemes(reviewText: string): {
  mentions: string[];
  emotions: string[];
  specificIssues: string[];
} {
  const lowerText = reviewText.toLowerCase();
  
  // Common service/business aspects
  const serviceAspects = ['service', 'staff', 'team', 'product', 'quality', 'price', 'location', 'atmosphere', 'food', 'experience'];
  const mentions = serviceAspects.filter(aspect => lowerText.includes(aspect));
  
  // Emotional indicators
  const emotionWords = ['happy', 'satisfied', 'pleased', 'disappointed', 'frustrated', 'angry', 'excited', 'impressed'];
  const emotions = emotionWords.filter(emotion => lowerText.includes(emotion));
  
  // Specific issues or complaints
  const issueIndicators = ['wait', 'slow', 'rude', 'expensive', 'dirty', 'cold', 'broken', 'wrong', 'mistake'];
  const specificIssues = issueIndicators.filter(issue => lowerText.includes(issue));
  
  return {
    mentions,
    emotions,
    specificIssues
  };
}

/**
 * Get response template suggestions based on review analysis
 */
export function getResponseTemplate(
  starRating: number,
  reviewThemes: ReturnType<typeof extractReviewThemes>
): {
  template: string;
  placeholders: string[];
} {
  if (starRating >= 4) {
    return {
      template: "Hi {name}, Thank you for the {rating}-star review! We're so glad you enjoyed {specific_mention}. {personal_touch} We look forward to seeing you again at {business_name}!",
      placeholders: ['name', 'rating', 'specific_mention', 'personal_touch', 'business_name']
    };
  } else if (starRating === 3) {
    return {
      template: "Hi {name}, Thank you for your honest feedback about {business_name}. We appreciate you taking the time to share your experience. {address_concerns} Please feel free to contact us directly to discuss further.",
      placeholders: ['name', 'business_name', 'address_concerns']
    };
  } else {
    return {
      template: "Hi {name}, We sincerely apologize for your disappointing experience with {business_name}. {acknowledge_issue} We would like to make this right. Please contact us directly so we can resolve this matter.",
      placeholders: ['name', 'business_name', 'acknowledge_issue']
    };
  }
} 