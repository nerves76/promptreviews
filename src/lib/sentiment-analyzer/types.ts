/**
 * Type definitions for Sentiment Analyzer feature
 * Based on SENTIMENT_ANALYZER_SPEC.md
 */

/**
 * Input data structure for sentiment analysis
 */
export interface AnalysisInput {
  accountId: string;
  businessName: string;
  reviewCount: number;
  totalReviews: number;
  reviews: ReviewForAnalysis[];
  dateRange: {
    earliest: string;
    latest: string;
  };
}

/**
 * Review data structure for analysis
 */
export interface ReviewForAnalysis {
  id: string;
  content: string;
  rating: number;
  created_at: string;
  platform?: string;
  reviewer_name?: string;
}

/**
 * Complete sentiment analysis result structure
 */
export interface SentimentAnalysisResult {
  metadata: {
    analysisId: string;
    runDate: string;
    reviewCount: number;
    reviewLimit: number; // plan-based limit (50/100/500)
    totalReviewsInAccount: number;
    dateRangeAnalyzed: { start: string; end: string };
    analysisVersion: string; // e.g., "1.0"
  };

  sentimentSummary: {
    overallLabel: 'positive' | 'mixed' | 'negative';
    sentimentScore: number; // 0-100
    breakdown: {
      positive: {
        count: number;
        percentage: number;
      };
      mixed: {
        count: number;
        percentage: number;
      };
      negative: {
        count: number;
        percentage: number;
      };
    };
    shortSummary: string; // single sentence takeaway
  };

  themes: Array<{
    name: string; // e.g., "Customer Service"
    sentiment: 'strength' | 'improvement';
    mentionCount: number;
    supportingQuotes: Array<{
      reviewId: string;
      excerpt: string; // <= 80 characters
    }>; // up to 2 quotes per theme
  }>;

  improvementIdeas: Array<{
    title: string;
    description: string; // 1-2 sentences
    sourceThemes: string[]; // reference theme names
  }>; // up to 3 ideas

  limitations?: string; // optional note when signal is weak or inconsistent
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  expected?: any;
  received?: any;
}

/**
 * Analysis result with validation status
 */
export interface ValidatedAnalysisResult {
  valid: boolean;
  result?: SentimentAnalysisResult;
  errors?: ValidationError[];
}

/**
 * OpenAI API configuration
 */
export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number; // milliseconds
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number; // USD
}

/**
 * Analysis performance metrics
 */
export interface AnalysisMetrics {
  startTime: number;
  endTime: number;
  durationMs: number;
  tokenUsage: TokenUsage;
  reviewCount: number;
  tokensPerReview: number;
}
