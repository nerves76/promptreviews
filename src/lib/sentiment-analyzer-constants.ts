/**
 * Sentiment Analyzer Feature Constants
 *
 * Defines plan-based limits for the sentiment analyzer feature.
 * These constants are used across API endpoints and UI components.
 */

export const PLAN_ANALYSIS_LIMITS = {
  grower: 1,
  builder: 3,
  maven: 10,
} as const;

export const PLAN_REVIEW_LIMITS = {
  grower: 50,
  builder: 100,
  maven: 500,
} as const;

export const MIN_REVIEWS_REQUIRED = 10;

export type PlanType = keyof typeof PLAN_ANALYSIS_LIMITS;
