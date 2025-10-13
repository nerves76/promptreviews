/**
 * Sentiment Analyzer Type Definitions
 * Based on SENTIMENT_ANALYZER_SPEC.md
 */

export interface AnalysisInput {
  accountId: string;
  reviewCount: number;
  reviews: Array<{
    id: string;
    content: string;
    rating: number;
    created_at: string;
    platform?: string;
    reviewer_name?: string;
  }>;
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export interface SentimentAnalysisMetadata {
  analysisId: string;
  runDate: string;
  reviewCount: number;
  reviewLimit: number;
  totalReviewsInAccount: number;
  dateRangeAnalyzed: { start: string; end: string };
  analysisVersion: string;
}

export interface SentimentBreakdown {
  count: number;
  percentage: number;
}

export interface SentimentSummary {
  overallLabel: 'positive' | 'mixed' | 'negative';
  sentimentScore: number; // 0-100
  breakdown: Record<'positive' | 'mixed' | 'negative', SentimentBreakdown>;
  shortSummary: string;
}

export interface SupportingQuote {
  reviewId: string;
  excerpt: string; // <= 80 characters
}

export interface Theme {
  name: string;
  sentiment: 'strength' | 'improvement';
  mentionCount: number;
  supportingQuotes: SupportingQuote[];
}

export interface ImprovementIdea {
  title: string;
  description: string;
  sourceThemes: string[];
}

export interface SentimentAnalysisResult {
  metadata: SentimentAnalysisMetadata;
  sentimentSummary: SentimentSummary;
  themes: Theme[];
  improvementIdeas: ImprovementIdea[];
  limitations?: string;
}

export interface EligibilityResponse {
  eligible: boolean;
  reason?: 'insufficient_reviews' | 'quota_exceeded';
  reviewCount: number;
  reviewLimit: number;
  minReviewsRequired: number;
  usageThisMonth: number;
  usageLimit: number;
  nextResetDate: string;
  plan: 'grower' | 'builder' | 'maven';
  daysUntilReset: number;
}

export interface AnalysisResponse {
  success: boolean;
  analysisId: string;
  results: SentimentAnalysisResult;
  reviewsAnalyzed: number;
  reviewsSkipped: number;
}

export interface AnalysisHistoryItem {
  id: string;
  runDate: string;
  reviewCount: number;
  overallLabel: 'positive' | 'mixed' | 'negative';
  sentimentScore: number;
}

export interface AnalysisHistoryResponse {
  analyses: AnalysisHistoryItem[];
  total: number;
}
