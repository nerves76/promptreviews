/**
 * Service Description Generator
 * 
 * AI-powered service description generation for Google Business Profile.
 * Creates SEO-optimized descriptions in 3 lengths (short, medium, long).
 */

import OpenAI from 'openai';
import { AIBrandContext, ServiceDescriptionOptions, createBrandVoiceInstructions, generateLocalKeywords, validateGeneratedContent, countWords } from './googleBusinessProfileHelpers';

/**
 * Generate AI prompt for service descriptions
 */
export function createServiceDescriptionPrompt(
  serviceName: string, 
  brandContext: AIBrandContext,
  length: 'short' | 'medium' | 'long'
): string {
  const brandInstructions = createBrandVoiceInstructions(brandContext);
  const localKeywords = generateLocalKeywords(brandContext, serviceName);
  
  const lengthSpecs = {
    short: { chars: '80-150', focus: 'core benefit and location' },
    medium: { chars: '150-250', focus: 'benefits, process, and unique value' },
    long: { chars: '250-300', focus: 'comprehensive overview, benefits, process, and call-to-action' }
  };
  
  const spec = lengthSpecs[length];
  
  return `You are a seasoned local SEO expert writing Google Business Profile service descriptions that drive conversions.

${brandInstructions}

TASK: Write a ${length} service description for "${serviceName}"

REQUIREMENTS:
- Target length: ${spec.chars} characters (MAXIMUM 300 characters - Google Business Profile limit)
- Focus on: ${spec.focus}
- Write as if you're speaking directly to potential customers
- Include natural local SEO keywords when relevant
- Professional yet approachable tone
- Highlight specific benefits, not just features
- NO keyword stuffing - keep it natural and helpful
- Be concise and impactful - every character counts!

${localKeywords.length > 0 ? `SUGGESTED LOCAL KEYWORDS (use naturally): ${localKeywords.slice(0, 3).join(', ')}` : ''}

WRITING STYLE:
- Start with a compelling benefit or outcome
- Use active voice and clear, confident language
- Include specific details about the service
- End with next steps or value proposition
- NO generic business jargon or fluff
- IMPORTANT: Instead of starting every sentence with "We," lead with action, benefits, or the customer's perspective
- Use strong verbs like Get, Experience, Build, Achieve to emphasize outcomes
- Or use audience-driven openers like "Your business", "Customers", "Teams" to keep focus on who benefits
- Mix verb-driven and customer-centric starters for engaging, varied, natural descriptions

Return ONLY the service description text, no quotes or formatting.`;
}

/**
 * Generate multiple service description options
 */
export async function generateServiceDescriptions(
  serviceName: string,
  brandContext: AIBrandContext
): Promise<ServiceDescriptionOptions> {
  const lengths: Array<'short' | 'medium' | 'long'> = ['short', 'medium', 'long'];
  
  const results = await Promise.all(
    lengths.map(async (length) => {
      const prompt = createServiceDescriptionPrompt(serviceName, brandContext, length);
      
      try {
        // Use OpenAI directly for better performance
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY is missing from environment variables');
        }

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional business copywriter specializing in Google Business Profile optimization. Write compelling, SEO-friendly service descriptions that convert prospects into customers. Avoid starting sentences with 'We' - instead use action verbs (Get, Experience, Build, Achieve) or customer-focused language (Your business, Customers, Teams) to create varied, engaging descriptions."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "gpt-3.5-turbo",
          max_tokens: length === 'short' ? 50 : length === 'medium' ? 80 : 100,
          temperature: 0.7
        });

        const generatedText = completion.choices[0]?.message?.content;
        if (!generatedText) {
          throw new Error('No description generated');
        }
        
        return {
          length,
          description: validateGeneratedContent(generatedText, 300) // Google Business Profile limit
        };
      } catch (error) {
        console.error(`Error generating ${length} description:`, error);
        return {
          length,
          description: getFallbackDescription(serviceName, brandContext, length)
        };
      }
    })
  );
  
  return {
    short: results.find(r => r.length === 'short')?.description || '',
    medium: results.find(r => r.length === 'medium')?.description || '',
    long: results.find(r => r.length === 'long')?.description || ''
  };
}

/**
 * Fallback service descriptions when AI fails
 */
function getFallbackDescription(
  serviceName: string,
  brandContext: AIBrandContext,
  length: 'short' | 'medium' | 'long'
): string {
  const location = brandContext.city ? ` in ${brandContext.city}` : '';
  
  switch (length) {
    case 'short':
      return `Professional ${serviceName.toLowerCase()} services${location}. Quality work, reliable service. Contact ${brandContext.businessName} today.`;
    
    case 'medium':
      return `${brandContext.businessName} provides professional ${serviceName.toLowerCase()} services${location}. Experienced team delivers quality results with attention to detail. Contact us today.`;
    
    case 'long':
      return `${brandContext.businessName} specializes in ${serviceName.toLowerCase()} services${location}. Our experienced team delivers exceptional results with personalized service. We understand every project is unique and provide tailored solutions. Contact us today to get started.`;
    
    default:
      return `Professional ${serviceName.toLowerCase()} services from ${brandContext.businessName}.`;
  }
}

/**
 * Validate and optimize generated descriptions
 */
export function optimizeServiceDescription(
  description: string,
  serviceName: string,
  brandContext: AIBrandContext,
  targetLength: 'short' | 'medium' | 'long'
): string {
  let optimized = validateGeneratedContent(description);
  const wordCount = countWords(optimized);
  
  const targetRanges = {
    short: { min: 40, max: 60 },
    medium: { min: 80, max: 120 },
    long: { min: 120, max: 180 }
  };
  
  const target = targetRanges[targetLength];
  
  // If too long, try to trim while preserving meaning
  if (wordCount > target.max) {
    const sentences = optimized.split(/[.!?]+/).filter(s => s.trim());
    const wordsPerSentence = Math.ceil(wordCount / sentences.length);
    const targetSentences = Math.floor(target.max / wordsPerSentence);
    
    if (targetSentences < sentences.length) {
      optimized = sentences.slice(0, targetSentences).join('. ') + '.';
    }
  }
  
  // Ensure service name is mentioned
  if (!optimized.toLowerCase().includes(serviceName.toLowerCase())) {
    optimized = optimized.replace(/^/, `${serviceName} - `);
  }
  
  // Ensure business name is mentioned for branding
  if (!optimized.toLowerCase().includes(brandContext.businessName.toLowerCase())) {
    optimized = optimized.replace(/\.$/, ` from ${brandContext.businessName}.`);
  }
  
  return optimized;
}

/**
 * Get word count analysis for descriptions
 */
export function analyzeDescriptionLength(descriptions: ServiceDescriptionOptions): {
  short: { words: number; status: 'optimal' | 'too_short' | 'too_long' };
  medium: { words: number; status: 'optimal' | 'too_short' | 'too_long' };
  long: { words: number; status: 'optimal' | 'too_short' | 'too_long' };
} {
  const analyze = (text: string, min: number, max: number) => {
    const words = countWords(text);
    let status: 'optimal' | 'too_short' | 'too_long';
    
    if (words < min) status = 'too_short';
    else if (words > max) status = 'too_long';
    else status = 'optimal';
    
    return { words, status };
  };
  
  return {
    short: analyze(descriptions.short, 40, 60),
    medium: analyze(descriptions.medium, 80, 120),
    long: analyze(descriptions.long, 120, 180),
  };
} 