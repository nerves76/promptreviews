/**
 * Sentiment Analyzer Module
 *
 * Main exports for the sentiment analysis feature.
 * Use this module to analyze customer reviews and extract insights.
 */

export { analyzeSentiment, validateAnalysisResult, estimateTokenCost } from './openai-integration';
export type {
  SentimentAnalysisResult,
  ReviewForAnalysis,
  AnalysisInput,
  ValidationError,
  ValidatedAnalysisResult,
  OpenAIConfig,
  TokenUsage,
  AnalysisMetrics,
} from './types';
