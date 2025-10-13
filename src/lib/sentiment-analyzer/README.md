# Sentiment Analyzer Module

AI-powered sentiment analysis for customer reviews using OpenAI GPT-4-turbo.

## Overview

This module provides sentiment analysis capabilities that extract actionable insights from customer reviews:
- Overall sentiment scores and distribution
- Key themes (strengths and improvement areas)
- Specific improvement ideas backed by evidence
- Supporting quotes from real reviews

## Installation

The module is already integrated into the project. No additional installation needed.

## Usage

### Basic Usage

```typescript
import { analyzeSentiment } from '@/lib/sentiment-analyzer';
import type { ReviewForAnalysis } from '@/lib/sentiment-analyzer';

// Prepare your reviews
const reviews: ReviewForAnalysis[] = [
  {
    id: '1',
    content: 'Great service! Staff was very helpful.',
    rating: 5,
    created_at: '2025-10-10T14:30:00Z',
    platform: 'Google',
    reviewer_name: 'John Doe',
  },
  // ... more reviews (minimum 10 required)
];

// Run analysis
try {
  const { result, metrics } = await analyzeSentiment(
    reviews,
    'Your Business Name',
    150 // total reviews in account
  );

  console.log('Sentiment Score:', result.sentimentSummary.sentimentScore);
  console.log('Overall Label:', result.sentimentSummary.overallLabel);
  console.log('Themes:', result.themes);
  console.log('Improvement Ideas:', result.improvementIdeas);
  console.log('Cost:', `$${metrics.tokenUsage.estimatedCost.toFixed(4)}`);
} catch (error) {
  console.error('Analysis failed:', error.message);
}
```

### Advanced Configuration

```typescript
import { analyzeSentiment } from '@/lib/sentiment-analyzer';

const { result, metrics } = await analyzeSentiment(
  reviews,
  businessName,
  totalReviews,
  {
    model: 'gpt-4-turbo-preview', // Default model
    temperature: 0.3, // Lower = more consistent
    maxTokens: 2500, // Response length limit
    timeout: 60000, // 60 seconds
  }
);
```

### Estimate Costs Before Analysis

```typescript
import { estimateTokenCost } from '@/lib/sentiment-analyzer';

const estimate = estimateTokenCost(100); // 100 reviews

console.log('Estimated tokens:', estimate.minTokens, '-', estimate.maxTokens);
console.log('Estimated cost:', `$${estimate.minCost} - $${estimate.maxCost}`);
```

### Validate Results

```typescript
import { validateAnalysisResult } from '@/lib/sentiment-analyzer';

const validation = validateAnalysisResult(aiResponse, reviewCount);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
} else {
  const result = validation.result;
  // Use validated result
}
```

## API Reference

### `analyzeSentiment()`

Main function to perform sentiment analysis.

**Parameters:**
- `reviews: ReviewForAnalysis[]` - Array of reviews to analyze (min 10)
- `businessName: string` - Name of the business
- `totalReviews: number` - Total number of reviews in account
- `config?: Partial<OpenAIConfig>` - Optional configuration overrides

**Returns:**
```typescript
{
  result: SentimentAnalysisResult;
  metrics: AnalysisMetrics;
}
```

**Throws:**
- `Error` if less than 10 reviews provided
- `Error` if OpenAI API key missing
- `Error` if API call times out
- `Error` if rate limit exceeded
- `Error` if validation fails

### `validateAnalysisResult()`

Validates AI response against the expected schema.

**Parameters:**
- `result: any` - Raw AI response to validate
- `reviewCount: number` - Expected number of reviews

**Returns:**
```typescript
{
  valid: boolean;
  result?: SentimentAnalysisResult; // if valid
  errors?: ValidationError[]; // if invalid
}
```

### `estimateTokenCost()`

Estimates token usage and cost for a given number of reviews.

**Parameters:**
- `reviewCount: number` - Number of reviews to analyze

**Returns:**
```typescript
{
  minTokens: number;
  maxTokens: number;
  minCost: number; // in USD
  maxCost: number; // in USD
}
```

## Result Structure

### SentimentAnalysisResult

```typescript
{
  metadata: {
    analysisId: string;
    runDate: string;
    reviewCount: number;
    reviewLimit: number;
    totalReviewsInAccount: number;
    dateRangeAnalyzed: { start: string; end: string };
    analysisVersion: string;
  };

  sentimentSummary: {
    overallLabel: 'positive' | 'mixed' | 'negative';
    sentimentScore: number; // 0-100
    breakdown: {
      positive: { count: number; percentage: number };
      mixed: { count: number; percentage: number };
      negative: { count: number; percentage: number };
    };
    shortSummary: string; // One-sentence takeaway
  };

  themes: Array<{
    name: string;
    sentiment: 'strength' | 'improvement';
    mentionCount: number;
    supportingQuotes: Array<{
      reviewId: string;
      excerpt: string; // <= 80 characters
    }>;
  }>;

  improvementIdeas: Array<{
    title: string;
    description: string;
    sourceThemes: string[]; // References theme names
  }>;

  limitations?: string; // Optional warning about data quality
}
```

### AnalysisMetrics

```typescript
{
  startTime: number;
  endTime: number;
  durationMs: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number; // USD
  };
  reviewCount: number;
  tokensPerReview: number;
}
```

## Cost Estimates

Based on GPT-4-turbo pricing ($0.01/1K input, $0.03/1K output):

| Reviews | Min Cost | Max Cost | Avg Time |
|---------|----------|----------|----------|
| 50      | $0.12    | $0.18    | 15-20s   |
| 100     | $0.22    | $0.35    | 25-35s   |
| 500     | $1.00    | $1.65    | 60-90s   |

*Note: Actual costs may vary based on review length and complexity.*

## Error Handling

The module throws specific errors for different failure scenarios:

```typescript
try {
  const { result } = await analyzeSentiment(reviews, businessName, totalReviews);
} catch (error) {
  if (error.message.includes('Minimum 10 reviews')) {
    // Handle insufficient reviews
  } else if (error.message.includes('rate limit')) {
    // Handle rate limiting
  } else if (error.message.includes('timed out')) {
    // Handle timeout
  } else {
    // Handle generic error
  }
}
```

All errors are automatically logged to Sentry with relevant context.

## Validation Rules

The module enforces strict validation:

1. **Sentiment Breakdown**: Counts must sum to total review count
2. **Percentages**: Must sum to ~100% (±1% for rounding)
3. **Themes**: Maximum 3 themes, each with 1-2 supporting quotes
4. **Quotes**: Must be ≤80 characters and reference valid review IDs
5. **Improvement Ideas**: Maximum 3, each must reference valid themes
6. **Review IDs**: All quoted review IDs must exist in input data

## Testing

Sample reviews are provided for testing:

```typescript
import { sampleReviews, getReviewsForPlan } from '@/lib/sentiment-analyzer/__tests__/sample-reviews';

// Test with sample data
const reviews = getReviewsForPlan('builder'); // 18 reviews
const { result } = await analyzeSentiment(reviews, 'Test Business', 100);
```

## Performance Optimization

The module includes several optimizations:

1. **Data Compression**: Reviews are compressed before sending to API
2. **Model Selection**: Uses GPT-4-turbo for optimal cost/quality ratio
3. **JSON Mode**: Forces structured output for reliable parsing
4. **Timeout Protection**: Configurable timeouts prevent hanging requests
5. **Token Monitoring**: Tracks usage for cost management

## Dependencies

- `openai` - OpenAI API client
- `@/utils/sentry` - Error tracking

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

## Best Practices

1. **Review Selection**: Always analyze most recent reviews for relevance
2. **Batch Size**: Respect plan limits (50/100/500 reviews)
3. **Error Handling**: Always wrap calls in try/catch
4. **Cost Monitoring**: Use `estimateTokenCost()` before expensive operations
5. **Rate Limiting**: Implement appropriate rate limiting in API routes
6. **Caching**: Cache results to avoid re-analyzing same data

## Troubleshooting

### "Minimum 10 reviews required"
Ensure you're passing at least 10 reviews to the function.

### "OPENAI_API_KEY is missing"
Add `OPENAI_API_KEY` to your `.env.local` file.

### "OpenAI response validation failed"
The AI returned invalid data. Check logs for validation errors. This is rare but can happen with very short or repetitive reviews.

### "rate limit exceeded"
You've hit OpenAI's rate limit. Implement exponential backoff or contact OpenAI to increase limits.

### High costs
Review your token usage patterns. Consider:
- Reducing review count per analysis
- Implementing caching
- Using longer analysis intervals

## Support

For issues or questions:
1. Check validation errors in response
2. Review Sentry logs for detailed error context
3. Test with sample data to isolate issues
4. Consult `/docs/SENTIMENT_ANALYZER_SPEC.md` for full specification

## Version

**Current Version**: 1.0
**Last Updated**: October 2025
