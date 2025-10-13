/**
 * OpenAI Integration for Sentiment Analysis
 *
 * Handles AI-powered sentiment analysis of customer reviews using GPT-4-turbo.
 * Includes prompt templates, validation, error handling, and cost optimization.
 */

import OpenAI from 'openai';
import { captureError, captureMessage } from '@/utils/sentry';
import {
  SentimentAnalysisResult,
  ReviewForAnalysis,
  ValidationError,
  ValidatedAnalysisResult,
  OpenAIConfig,
  TokenUsage,
  AnalysisMetrics,
} from './types';

// OpenAI Configuration
const DEFAULT_CONFIG: OpenAIConfig = {
  model: 'gpt-4-turbo-preview', // Cost-effective, high-quality model
  temperature: 0.3, // Lower temperature for more consistent, focused analysis
  maxTokens: 2500, // Sufficient for detailed analysis response
  timeout: 60000, // 60 seconds timeout
};

// Token pricing for GPT-4-turbo (as of Q4 2024)
const TOKEN_PRICING = {
  input: 0.01 / 1000, // $0.01 per 1K input tokens
  output: 0.03 / 1000, // $0.03 per 1K output tokens
};

/**
 * System prompt for the AI analyst
 */
const SYSTEM_PROMPT = `You are an insights analyst who reviews customer feedback and produces concise,
actionable summaries. Stay within the provided schema, ground every claim in the
review data, and avoid guessing beyond the evidence. If the reviews do not
support an insight or improvement idea, leave it out or use the \`limitations\`
field to explain why.`;

/**
 * Create the analysis prompt with review data
 */
function createAnalysisPrompt(
  reviews: ReviewForAnalysis[],
  businessName: string,
  totalReviews: number
): string {
  const reviewCount = reviews.length;

  // Compress review data to minimize tokens
  const compressedReviews = reviews.map(r => ({
    id: r.id,
    content: r.content,
    rating: r.rating,
    date: r.created_at.split('T')[0], // Just the date, not full timestamp
    platform: r.platform || 'unknown',
    reviewer: r.reviewer_name || 'Anonymous',
  }));

  const reviewsJson = JSON.stringify(compressedReviews, null, 0); // No formatting to save tokens

  return `You are analyzing the ${reviewCount} most recent reviews (out of ${totalReviews} total)
for ${businessName}. Focus on what customers are praising and where they are
asking for improvements.

REVIEW DATA:
${reviewsJson}

TASKS:
1. Sentiment Summary:
   - Label overall sentiment as positive, mixed, or negative.
   - Count how many reviews are positive (rating 4-5), mixed (rating 3), and negative (rating 1-2).
   - Produce a 0-100 sentiment score where >66 is positive, 34-66 is mixed, <34 is negative.
   - Write a one-sentence summary grounded in the reviews.
   - Ensure the counts add up to ${reviewCount} and percentages reflect those counts.

2. Themes Spotlight:
   - Identify up to three recurring themes present in the reviews.
   - Mark each theme as either a strength or an improvement area.
   - Provide the mention count and up to two short supporting quotes (≤80 characters) with their review IDs.
   - Prioritize themes with the most mentions and clearest evidence.

3. Improvement Ideas:
   - Suggest up to three ideas that would improve customer experience.
   - Each idea must reference at least one of the themes and explain how it helps.
   - Make ideas specific and actionable, not generic advice.

4. Limitations:
   - If feedback volume is too small or signals conflict, use the \`limitations\`
     field to explain instead of guessing.

OUTPUT:
- Return ONLY valid JSON that exactly matches this structure:
{
  "sentimentSummary": {
    "overallLabel": "positive" | "mixed" | "negative",
    "sentimentScore": number (0-100),
    "breakdown": {
      "positive": { "count": number, "percentage": number },
      "mixed": { "count": number, "percentage": number },
      "negative": { "count": number, "percentage": number }
    },
    "shortSummary": "string (one sentence)"
  },
  "themes": [
    {
      "name": "string",
      "sentiment": "strength" | "improvement",
      "mentionCount": number,
      "supportingQuotes": [
        { "reviewId": "string", "excerpt": "string (≤80 chars)" }
      ]
    }
  ],
  "improvementIdeas": [
    {
      "title": "string",
      "description": "string (1-2 sentences)",
      "sourceThemes": ["string"]
    }
  ],
  "limitations": "string (optional)"
}

- Do not invent data or entities not evidenced in the reviews.
- If eligibility requirements are not met (e.g., <10 reviews), use limitations field.
- Ensure all review IDs in supportingQuotes are valid IDs from the provided reviews.
- Ensure all sourceThemes references are valid theme names from the themes array.`;
}

/**
 * Validate sentiment analysis result
 */
export function validateAnalysisResult(
  result: any,
  reviewCount: number
): ValidatedAnalysisResult {
  const errors: ValidationError[] = [];

  // Check if result exists and is an object
  if (!result || typeof result !== 'object') {
    errors.push({
      field: 'result',
      message: 'Analysis result must be an object',
      received: typeof result,
    });
    return { valid: false, errors };
  }

  // Validate sentimentSummary
  if (!result.sentimentSummary) {
    errors.push({
      field: 'sentimentSummary',
      message: 'Missing sentimentSummary field',
    });
  } else {
    const summary = result.sentimentSummary;

    // Validate overallLabel
    if (!['positive', 'mixed', 'negative'].includes(summary.overallLabel)) {
      errors.push({
        field: 'sentimentSummary.overallLabel',
        message: 'Invalid overallLabel value',
        expected: ['positive', 'mixed', 'negative'],
        received: summary.overallLabel,
      });
    }

    // Validate sentimentScore
    if (typeof summary.sentimentScore !== 'number' ||
        summary.sentimentScore < 0 ||
        summary.sentimentScore > 100) {
      errors.push({
        field: 'sentimentSummary.sentimentScore',
        message: 'sentimentScore must be between 0 and 100',
        received: summary.sentimentScore,
      });
    }

    // Validate breakdown counts sum to reviewCount
    if (summary.breakdown) {
      const totalCount =
        (summary.breakdown.positive?.count || 0) +
        (summary.breakdown.mixed?.count || 0) +
        (summary.breakdown.negative?.count || 0);

      if (totalCount !== reviewCount) {
        errors.push({
          field: 'sentimentSummary.breakdown',
          message: 'Sentiment breakdown counts must sum to reviewCount',
          expected: reviewCount,
          received: totalCount,
        });
      }

      // Validate percentages
      const totalPercentage =
        (summary.breakdown.positive?.percentage || 0) +
        (summary.breakdown.mixed?.percentage || 0) +
        (summary.breakdown.negative?.percentage || 0);

      // Allow small rounding differences (±1%)
      if (Math.abs(totalPercentage - 100) > 1) {
        errors.push({
          field: 'sentimentSummary.breakdown',
          message: 'Sentiment breakdown percentages must sum to ~100',
          expected: 100,
          received: totalPercentage,
        });
      }
    } else {
      errors.push({
        field: 'sentimentSummary.breakdown',
        message: 'Missing breakdown field',
      });
    }

    // Validate shortSummary
    if (!summary.shortSummary || typeof summary.shortSummary !== 'string') {
      errors.push({
        field: 'sentimentSummary.shortSummary',
        message: 'shortSummary must be a non-empty string',
      });
    }
  }

  // Validate themes
  if (!Array.isArray(result.themes)) {
    errors.push({
      field: 'themes',
      message: 'themes must be an array',
    });
  } else {
    if (result.themes.length === 0) {
      errors.push({
        field: 'themes',
        message: 'themes array should not be empty (unless using limitations)',
      });
    }

    if (result.themes.length > 3) {
      errors.push({
        field: 'themes',
        message: 'themes array should have at most 3 items',
        expected: 3,
        received: result.themes.length,
      });
    }

    // Validate each theme
    result.themes.forEach((theme: any, index: number) => {
      if (!theme.name || typeof theme.name !== 'string') {
        errors.push({
          field: `themes[${index}].name`,
          message: 'Theme name must be a non-empty string',
        });
      }

      if (!['strength', 'improvement'].includes(theme.sentiment)) {
        errors.push({
          field: `themes[${index}].sentiment`,
          message: 'Theme sentiment must be "strength" or "improvement"',
          received: theme.sentiment,
        });
      }

      if (!Array.isArray(theme.supportingQuotes) || theme.supportingQuotes.length === 0) {
        errors.push({
          field: `themes[${index}].supportingQuotes`,
          message: 'Theme must have at least one supporting quote',
        });
      } else if (theme.supportingQuotes.length > 2) {
        errors.push({
          field: `themes[${index}].supportingQuotes`,
          message: 'Theme should have at most 2 supporting quotes',
          expected: 2,
          received: theme.supportingQuotes.length,
        });
      }

      // Validate quotes
      theme.supportingQuotes?.forEach((quote: any, qIndex: number) => {
        if (!quote.reviewId) {
          errors.push({
            field: `themes[${index}].supportingQuotes[${qIndex}].reviewId`,
            message: 'Quote must have a reviewId',
          });
        }

        if (!quote.excerpt || quote.excerpt.length > 80) {
          errors.push({
            field: `themes[${index}].supportingQuotes[${qIndex}].excerpt`,
            message: 'Quote excerpt must be 1-80 characters',
            received: quote.excerpt?.length || 0,
          });
        }
      });
    });
  }

  // Validate improvementIdeas
  if (!Array.isArray(result.improvementIdeas)) {
    errors.push({
      field: 'improvementIdeas',
      message: 'improvementIdeas must be an array',
    });
  } else {
    if (result.improvementIdeas.length > 3) {
      errors.push({
        field: 'improvementIdeas',
        message: 'improvementIdeas array should have at most 3 items',
        expected: 3,
        received: result.improvementIdeas.length,
      });
    }

    // Validate each idea
    result.improvementIdeas.forEach((idea: any, index: number) => {
      if (!idea.title || typeof idea.title !== 'string') {
        errors.push({
          field: `improvementIdeas[${index}].title`,
          message: 'Idea title must be a non-empty string',
        });
      }

      if (!idea.description || typeof idea.description !== 'string') {
        errors.push({
          field: `improvementIdeas[${index}].description`,
          message: 'Idea description must be a non-empty string',
        });
      }

      if (!Array.isArray(idea.sourceThemes) || idea.sourceThemes.length === 0) {
        errors.push({
          field: `improvementIdeas[${index}].sourceThemes`,
          message: 'Idea must reference at least one source theme',
        });
      } else {
        // Check that referenced themes exist
        const themeNames = result.themes?.map((t: any) => t.name) || [];
        idea.sourceThemes.forEach((themeName: string) => {
          if (!themeNames.includes(themeName)) {
            errors.push({
              field: `improvementIdeas[${index}].sourceThemes`,
              message: `Referenced theme "${themeName}" not found in themes array`,
            });
          }
        });
      }
    });
  }

  // Return validation result
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, result: result as SentimentAnalysisResult };
}

/**
 * Calculate token usage and cost
 */
function calculateTokenUsage(usage: OpenAI.Completions.CompletionUsage): TokenUsage {
  const estimatedCost =
    (usage.prompt_tokens * TOKEN_PRICING.input) +
    (usage.completion_tokens * TOKEN_PRICING.output);

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    estimatedCost,
  };
}

/**
 * Main function to analyze sentiment using OpenAI
 */
export async function analyzeSentiment(
  reviews: ReviewForAnalysis[],
  businessName: string,
  totalReviews: number,
  config: Partial<OpenAIConfig> = {}
): Promise<{
  result: SentimentAnalysisResult;
  metrics: AnalysisMetrics;
}> {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate inputs
  if (!reviews || reviews.length === 0) {
    throw new Error('No reviews provided for analysis');
  }

  if (reviews.length < 10) {
    throw new Error('Minimum 10 reviews required for sentiment analysis');
  }

  if (!businessName || businessName.trim().length === 0) {
    throw new Error('Business name is required');
  }

  // Check OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY is missing from environment variables');
    captureError(error, { feature: 'sentiment-analysis' });
    throw error;
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: finalConfig.timeout,
  });

  try {
    // Create the analysis prompt
    const prompt = createAnalysisPrompt(reviews, businessName, totalReviews);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: finalConfig.model,
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' }, // Ensure JSON response
    });

    // Extract response content
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      captureError(parseError as Error, {
        feature: 'sentiment-analysis',
        step: 'json-parse',
        responseContent: responseContent.substring(0, 500), // First 500 chars for debugging
      });
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    // Validate the response
    const validation = validateAnalysisResult(parsedResponse, reviews.length);
    if (!validation.valid) {
      const error = new Error('OpenAI response validation failed');
      captureError(error, {
        feature: 'sentiment-analysis',
        validationErrors: validation.errors,
        responsePreview: JSON.stringify(parsedResponse).substring(0, 500),
      });
      throw error;
    }

    // Calculate metrics
    const endTime = Date.now();
    const tokenUsage = completion.usage
      ? calculateTokenUsage(completion.usage)
      : {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
        };

    const metrics: AnalysisMetrics = {
      startTime,
      endTime,
      durationMs: endTime - startTime,
      tokenUsage,
      reviewCount: reviews.length,
      tokensPerReview: tokenUsage.totalTokens / reviews.length,
    };

    // Log successful analysis
    captureMessage('Sentiment analysis completed successfully', 'info', {
      reviewCount: reviews.length,
      durationMs: metrics.durationMs,
      totalTokens: tokenUsage.totalTokens,
      estimatedCost: tokenUsage.estimatedCost,
    });

    return {
      result: validation.result!,
      metrics,
    };

  } catch (error) {
    const endTime = Date.now();

    // Handle specific error types
    if (error instanceof Error) {
      // Timeout errors
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        const timeoutError = new Error(`Sentiment analysis timed out after ${finalConfig.timeout}ms`);
        captureError(timeoutError, {
          feature: 'sentiment-analysis',
          reviewCount: reviews.length,
          timeout: finalConfig.timeout,
          durationMs: endTime - startTime,
        });
        throw timeoutError;
      }

      // Rate limit errors
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        const rateLimitError = new Error('OpenAI API rate limit exceeded. Please try again in a few moments.');
        captureError(rateLimitError, {
          feature: 'sentiment-analysis',
          reviewCount: reviews.length,
        });
        throw rateLimitError;
      }

      // Malformed response errors (already captured above)
      if (error.message.includes('parse') || error.message.includes('validation')) {
        throw error; // Already captured and formatted
      }

      // Generic OpenAI API errors
      captureError(error, {
        feature: 'sentiment-analysis',
        reviewCount: reviews.length,
        durationMs: endTime - startTime,
      });
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }

    // Unknown errors
    const unknownError = new Error('An unexpected error occurred during sentiment analysis');
    captureError(unknownError, {
      feature: 'sentiment-analysis',
      originalError: error,
    });
    throw unknownError;
  }
}

/**
 * Estimate token cost for a given number of reviews
 * Useful for displaying cost estimates to users
 */
export function estimateTokenCost(reviewCount: number): {
  minTokens: number;
  maxTokens: number;
  minCost: number;
  maxCost: number;
} {
  // Rough estimates based on testing
  // Average review is ~50-150 tokens
  // System + user prompt adds ~500-800 tokens
  // Response is typically ~500-1500 tokens

  const avgReviewTokens = 100;
  const promptOverhead = 650;
  const responseTokens = 1000;

  const inputTokens = (reviewCount * avgReviewTokens) + promptOverhead;
  const totalTokens = inputTokens + responseTokens;

  // Add 20% buffer for variation
  const minTokens = Math.floor(totalTokens * 0.8);
  const maxTokens = Math.ceil(totalTokens * 1.2);

  const minCost = (minTokens * 0.8 * TOKEN_PRICING.input) + (minTokens * 0.2 * TOKEN_PRICING.output);
  const maxCost = (maxTokens * 0.8 * TOKEN_PRICING.input) + (maxTokens * 0.2 * TOKEN_PRICING.output);

  return {
    minTokens,
    maxTokens,
    minCost: Math.round(minCost * 100) / 100, // Round to 2 decimals
    maxCost: Math.round(maxCost * 100) / 100,
  };
}
