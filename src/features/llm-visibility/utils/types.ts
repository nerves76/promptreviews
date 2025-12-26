/**
 * LLM Visibility Tracking Types
 *
 * Types for tracking brand visibility in AI assistants
 * (ChatGPT, Claude, Gemini, Perplexity)
 */

// ============================================
// Core Types
// ============================================

export type LLMProvider = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';

export const LLM_PROVIDERS: LLMProvider[] = [
  'chatgpt',
  'claude',
  'gemini',
  'perplexity',
];

export const LLM_PROVIDER_LABELS: Record<LLMProvider, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
};

export const LLM_PROVIDER_COLORS: Record<
  LLMProvider,
  { bg: string; text: string; border: string }
> = {
  chatgpt: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  claude: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  gemini: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  perplexity: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

// ============================================
// Credit Costs (100%+ margin target)
// ============================================

export const LLM_CREDIT_COSTS: Record<LLMProvider, number> = {
  chatgpt: 3, // DataForSEO: ~$0.004, Revenue: $0.006
  claude: 3, // DataForSEO: ~$0.003, Revenue: $0.006
  gemini: 2, // DataForSEO: ~$0.002, Revenue: $0.004
  perplexity: 3, // DataForSEO: ~$0.003, Revenue: $0.006
};

// Total for all 4 providers: 11 credits per question
export const LLM_ALL_PROVIDERS_COST = Object.values(LLM_CREDIT_COSTS).reduce(
  (sum, cost) => sum + cost,
  0
);

// ============================================
// API Response Types
// ============================================

export interface LLMCitation {
  domain: string;
  url: string | null;
  title: string | null;
  position: number;
  isOurs: boolean;
}

export interface LLMCheckResult {
  success: boolean;
  provider: LLMProvider;
  question: string;
  domainCited: boolean;
  brandMentioned: boolean;
  citationPosition: number | null;
  citationUrl: string | null;
  totalCitations: number;
  citations: LLMCitation[];
  responseSnippet: string | null;
  cost: number;
  error?: string;
}

// ============================================
// Database Types (snake_case from Supabase)
// ============================================

export interface LLMVisibilityCheckRow {
  id: string;
  account_id: string;
  keyword_id: string;
  question: string;
  llm_provider: LLMProvider;
  domain_cited: boolean;
  brand_mentioned: boolean;
  citation_position: number | null;
  citation_url: string | null;
  total_citations: number;
  response_snippet: string | null;
  citations: LLMCitation[] | null;
  api_cost_usd: number | null;
  checked_at: string;
  created_at: string;
}

export interface LLMVisibilitySummaryRow {
  id: string;
  account_id: string;
  keyword_id: string;
  total_questions: number;
  questions_with_citation: number;
  visibility_score: number | null;
  provider_stats: ProviderStats;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LLMVisibilityScheduleRow {
  id: string;
  account_id: string;
  keyword_id: string;
  providers: LLMProvider[];
  is_enabled: boolean;
  schedule_frequency: 'daily' | 'weekly' | 'monthly' | null;
  schedule_day_of_week: number | null;
  schedule_day_of_month: number | null;
  schedule_hour: number;
  next_scheduled_at: string | null;
  last_scheduled_run_at: string | null;
  last_credit_warning_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Response Types (camelCase for frontend)
// ============================================

export interface LLMVisibilityCheck {
  id: string;
  accountId: string;
  keywordId: string;
  question: string;
  llmProvider: LLMProvider;
  domainCited: boolean;
  brandMentioned: boolean;
  citationPosition: number | null;
  citationUrl: string | null;
  totalCitations: number;
  responseSnippet: string | null;
  citations: LLMCitation[] | null;
  apiCostUsd: number | null;
  checkedAt: string;
  createdAt: string;
}

export interface ProviderStat {
  checked: number;
  cited: number;
  avgPosition: number | null;
  lastCheckedAt: string | null;
}

export type ProviderStats = Partial<Record<LLMProvider, ProviderStat>>;

export interface LLMVisibilitySummary {
  id: string;
  accountId: string;
  keywordId: string;
  totalQuestions: number;
  questionsWithCitation: number;
  visibilityScore: number | null;
  providerStats: ProviderStats;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LLMVisibilitySchedule {
  id: string;
  accountId: string;
  keywordId: string;
  providers: LLMProvider[];
  isEnabled: boolean;
  scheduleFrequency: 'daily' | 'weekly' | 'monthly' | null;
  scheduleDayOfWeek: number | null;
  scheduleDayOfMonth: number | null;
  scheduleHour: number;
  nextScheduledAt: string | null;
  lastScheduledRunAt: string | null;
  lastCreditWarningSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Request/Response Types
// ============================================

export interface LLMCheckRequest {
  keywordId: string;
  providers?: LLMProvider[];
  questionIndices?: number[];
}

export interface LLMCheckBatchResult {
  success: boolean;
  checksPerformed: number;
  totalCost: number;
  totalCreditsUsed: number;
  results: LLMCheckResult[];
  errors: string[];
}

export interface LLMCheckResponse {
  success: boolean;
  checksPerformed: number;
  results: LLMVisibilityCheck[];
  summary: LLMVisibilitySummary | null;
  balance: {
    includedCredits: number;
    purchasedCredits: number;
    totalCredits: number;
  };
  errors?: string[];
}

export interface LLMResultsRequest {
  keywordId: string;
  provider?: LLMProvider;
  limit?: number;
  offset?: number;
}

export interface LLMResultsResponse {
  results: LLMVisibilityCheck[];
  total: number;
  hasMore: boolean;
}

export interface LLMScheduleRequest {
  keywordId: string;
  providers?: LLMProvider[];
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | null;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  isEnabled?: boolean;
}

// ============================================
// Question-Level View Types (for UI)
// ============================================

export interface QuestionVisibility {
  question: string;
  questionIndex: number;
  results: Map<LLMProvider, LLMVisibilityCheck | null>;
  citedCount: number;
  checkedCount: number;
  lastCheckedAt: string | null;
}

export interface KeywordLLMVisibility {
  keywordId: string;
  keywordPhrase: string;
  summary: LLMVisibilitySummary | null;
  schedule: LLMVisibilitySchedule | null;
  questions: QuestionVisibility[];
}
