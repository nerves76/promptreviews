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

export const LLM_PROVIDER_SHORT_LABELS: Record<LLMProvider, string> = {
  chatgpt: 'CGPT',
  claude: 'CLDE',
  gemini: 'GMNI',
  perplexity: 'PLXY',
};

// Model names used by DataForSEO API
// ChatGPT uses scraper (web UI), others use specific model versions
export const LLM_PROVIDER_MODELS: Record<LLMProvider, string> = {
  chatgpt: 'Web UI', // Uses ChatGPT web interface scraper
  claude: 'Sonnet 4', // claude-sonnet-4-0
  gemini: 'Flash 2.0', // gemini-2.0-flash
  perplexity: 'Sonar', // sonar model
};

// Brand-aligned colors for each LLM provider
// ChatGPT: #0fa47f (green), Claude: #d97757 (coral), Gemini: #5885f3 (blue), Perplexity: #22808d (teal)
// Colors defined in tailwind.config.js under theme.extend.colors
export const LLM_PROVIDER_COLORS: Record<
  LLMProvider,
  { bg: string; text: string; border: string }
> = {
  chatgpt: {
    bg: 'bg-llm-chatgpt-bg',
    text: 'text-llm-chatgpt-text',
    border: 'border-llm-chatgpt-border/30',
  },
  claude: {
    bg: 'bg-llm-claude-bg',
    text: 'text-llm-claude-text',
    border: 'border-llm-claude-border/30',
  },
  gemini: {
    bg: 'bg-llm-gemini-bg',
    text: 'text-llm-gemini-text',
    border: 'border-llm-gemini-border/30',
  },
  perplexity: {
    bg: 'bg-llm-perplexity-bg',
    text: 'text-llm-perplexity-text',
    border: 'border-llm-perplexity-border/30',
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

export interface LLMBrandEntity {
  title: string;
  category: string | null;
  urls: Array<{ url: string; domain: string }> | null;
}

/**
 * Search result from the AI's web search (includes unused results)
 */
export interface LLMSearchResult {
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
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
  mentionedBrands: LLMBrandEntity[];
  responseSnippet: string | null;
  fullResponse: string | null;
  searchResults: LLMSearchResult[];
  fanOutQueries: string[];
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
  full_response: string | null;
  citations: LLMCitation[] | null;
  mentioned_brands: LLMBrandEntity[] | null;
  search_results: LLMSearchResult[] | null;
  fan_out_queries: string[] | null;
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
  fullResponse: string | null;
  citations: LLMCitation[] | null;
  mentionedBrands: LLMBrandEntity[] | null;
  searchResults: LLMSearchResult[] | null;
  fanOutQueries: string[] | null;
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
