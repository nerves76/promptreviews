/**
 * Concept Schedule Types
 *
 * Types for unified concept-level scheduling that combines
 * search rank tracking, geo-grid checks, and LLM visibility checks.
 */

import type { LLMProvider } from '@/features/llm-visibility/utils/types';

// ============================================
// Schedule Frequency Types
// ============================================

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

// ============================================
// Cost Breakdown Types
// ============================================

export interface SearchRankCostBreakdown {
  enabled: boolean;
  searchTermCount: number;
  devicesCount: number; // 2 for desktop + mobile
  creditCostPerTerm: number;
  cost: number;
}

export interface GeoGridCostBreakdown {
  enabled: boolean;
  gridSize: number;
  checkPointCount: number;
  searchTermCount: number;
  baseCost: number;
  cellCost: number;
  keywordCost: number;
  cost: number;
}

export interface LLMVisibilityCostBreakdown {
  enabled: boolean;
  questionCount: number;
  providers: LLMProvider[];
  costPerQuestion: number;
  cost: number;
}

export interface ConceptCostBreakdown {
  searchRank: SearchRankCostBreakdown;
  geoGrid: GeoGridCostBreakdown;
  llmVisibility: LLMVisibilityCostBreakdown;
  total: number;
}

// ============================================
// Database Types (snake_case from Supabase)
// ============================================

export interface ConceptScheduleRow {
  id: string;
  account_id: string;
  keyword_id: string;
  schedule_frequency: ScheduleFrequency | null;
  schedule_day_of_week: number | null;
  schedule_day_of_month: number | null;
  schedule_hour: number;
  search_rank_enabled: boolean;
  geo_grid_enabled: boolean;
  llm_visibility_enabled: boolean;
  llm_providers: string[];
  estimated_credits: number;
  is_enabled: boolean;
  next_scheduled_at: string | null;
  last_scheduled_run_at: string | null;
  last_credit_warning_sent_at: string | null;
  paused_llm_schedule_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Response Types (camelCase for frontend)
// ============================================

export interface ConceptSchedule {
  id: string;
  accountId: string;
  keywordId: string;
  scheduleFrequency: ScheduleFrequency | null;
  scheduleDayOfWeek: number | null;
  scheduleDayOfMonth: number | null;
  scheduleHour: number;
  searchRankEnabled: boolean;
  geoGridEnabled: boolean;
  llmVisibilityEnabled: boolean;
  llmProviders: LLMProvider[];
  estimatedCredits: number;
  isEnabled: boolean;
  nextScheduledAt: string | null;
  lastScheduledRunAt: string | null;
  lastCreditWarningSentAt: string | null;
  pausedLlmScheduleId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Request Types
// ============================================

export interface CreateConceptScheduleRequest {
  keywordId: string;
  scheduleFrequency: ScheduleFrequency | null;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  searchRankEnabled?: boolean;
  geoGridEnabled?: boolean;
  llmVisibilityEnabled?: boolean;
  llmProviders?: LLMProvider[];
}

export interface UpdateConceptScheduleRequest {
  scheduleFrequency?: ScheduleFrequency | null;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  searchRankEnabled?: boolean;
  geoGridEnabled?: boolean;
  llmVisibilityEnabled?: boolean;
  llmProviders?: LLMProvider[];
  isEnabled?: boolean;
}

export interface CostPreviewRequest {
  keywordId: string;
  searchRankEnabled: boolean;
  geoGridEnabled: boolean;
  llmVisibilityEnabled: boolean;
  llmProviders: LLMProvider[];
}

// ============================================
// Response Types
// ============================================

export interface ConceptScheduleResponse {
  schedule: ConceptSchedule;
  costBreakdown: ConceptCostBreakdown;
  pausedSchedules?: {
    llmScheduleId: string | null;
  };
}

export interface CostPreviewResponse {
  costBreakdown: ConceptCostBreakdown;
  hasExistingSchedules: boolean;
  existingSchedules?: {
    llmSchedule?: {
      id: string;
      frequency: ScheduleFrequency | null;
      providers: LLMProvider[];
    };
  };
}

// ============================================
// Override Tracking Types
// ============================================

export interface PausedSchedules {
  llmScheduleId: string | null;
}

// ============================================
// Cron Job Types
// ============================================

export interface ConceptCheckResult {
  scheduleId: string;
  keywordId: string;
  accountId: string;
  status: 'success' | 'partial' | 'skipped' | 'insufficient_credits' | 'error';
  creditsUsed: number;
  searchRankResult?: {
    success: boolean;
    checksPerformed: number;
    error?: string;
  };
  geoGridResult?: {
    success: boolean;
    checksPerformed: number;
    error?: string;
  };
  llmVisibilityResult?: {
    success: boolean;
    checksPerformed: number;
    error?: string;
  };
  error?: string;
}

export interface ConceptCronSummary {
  processed: number;
  successful: number;
  partial: number;
  skipped: number;
  insufficientCredits: number;
  errors: number;
  totalCreditsUsed: number;
  details: ConceptCheckResult[];
}

// ============================================
// Transform Functions
// ============================================

export function transformConceptScheduleRow(row: ConceptScheduleRow): ConceptSchedule {
  return {
    id: row.id,
    accountId: row.account_id,
    keywordId: row.keyword_id,
    scheduleFrequency: row.schedule_frequency,
    scheduleDayOfWeek: row.schedule_day_of_week,
    scheduleDayOfMonth: row.schedule_day_of_month,
    scheduleHour: row.schedule_hour,
    searchRankEnabled: row.search_rank_enabled,
    geoGridEnabled: row.geo_grid_enabled,
    llmVisibilityEnabled: row.llm_visibility_enabled,
    llmProviders: row.llm_providers as LLMProvider[],
    estimatedCredits: row.estimated_credits,
    isEnabled: row.is_enabled,
    nextScheduledAt: row.next_scheduled_at,
    lastScheduledRunAt: row.last_scheduled_run_at,
    lastCreditWarningSentAt: row.last_credit_warning_sent_at,
    pausedLlmScheduleId: row.paused_llm_schedule_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
