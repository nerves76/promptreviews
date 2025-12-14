/**
 * Rank Tracking Types
 *
 * TypeScript types for Google SERP rank tracking feature.
 * Mirrors the database schema from rank_keyword_groups, rank_group_keywords, rank_checks.
 */

// ============================================
// Schedule Types
// ============================================

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';
export type DeviceType = 'desktop' | 'mobile';

// ============================================
// Group (mirrors rank_keyword_groups)
// ============================================

export interface RankKeywordGroup {
  id: string;
  accountId: string;
  name: string;
  device: DeviceType;
  locationCode: number;
  locationName: string;
  scheduleFrequency: ScheduleFrequency | null;
  scheduleDayOfWeek: number | null;
  scheduleDayOfMonth: number | null;
  scheduleHour: number;
  nextScheduledAt: string | null;
  lastScheduledRunAt: string | null;
  lastCheckedAt: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed/joined
  keywordCount?: number;
  avgPosition?: number;
}

// ============================================
// Group keyword (mirrors rank_group_keywords)
// ============================================

export interface RankGroupKeyword {
  id: string;
  groupId: string;
  keywordId: string;
  accountId: string;
  targetUrl: string | null;
  isEnabled: boolean;
  createdAt: string;
  // Joined from keywords table
  phrase?: string;
  searchQuery?: string;
  reviewPhrase?: string;
  // SEO metrics from keywords table
  searchIntent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | null;
  keywordDifficulty?: number | null;
  searchVolume?: number | null;
  cpc?: number | null;
  competitionLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  searchVolumeTrend?: {
    monthly: number | null;
    quarterly: number | null;
    yearly: number | null;
  } | null;
  // Computed from latest check
  latestPosition?: number | null;
  latestUrl?: string | null;
  positionChange?: number | null;
}

// ============================================
// Check result (mirrors rank_checks)
// ============================================

export interface RankCheck {
  id: string;
  accountId: string;
  groupId: string;
  keywordId: string;
  searchQueryUsed: string;
  position: number | null;
  foundUrl: string | null;
  matchedTargetUrl: boolean | null;
  serpFeatures: SerpFeatures | null;
  topCompetitors: Competitor[];
  apiCostUsd: number;
  checkedAt: string;
  createdAt: string;
  // SERP visibility summary fields
  paaQuestionCount: number;
  paaOursCount: number;
  aiOverviewPresent: boolean;
  aiOverviewOursCited: boolean;
  aiOverviewCitationCount: number;
  featuredSnippetPresent: boolean;
  featuredSnippetOurs: boolean;
  // Joined
  keywordPhrase?: string;
}

// ============================================
// SERP Features (enriched with PAA/AI data)
// ============================================

// PAA Question data
export interface PAAQuestion {
  question: string;
  answerDomain: string | null;
  answerUrl: string | null;
  answerTitle: string | null;
  isOurs: boolean;
  isAiGenerated: boolean;
}

// AI Overview citation data
export interface AICitation {
  domain: string;
  url: string | null;
  title: string | null;
  isOurs: boolean;
}

// Enriched SERP features with full PAA and AI Overview data
export interface SerpFeatures {
  featuredSnippet: {
    present: boolean;
    isOurs: boolean;
    domain: string | null;
    url: string | null;
  };
  siteLinks: boolean;
  images: boolean;
  videos: boolean;
  mapPack: {
    present: boolean;
    isOurs: boolean;
  };
  peopleAlsoAsk: {
    present: boolean;
    questions: PAAQuestion[];
    ourQuestionCount: number;
  };
  aiOverview: {
    present: boolean;
    isOursCited: boolean;
    citations: AICitation[];
    ourCitationCount: number;
  };
}

// Legacy simple SERP features (for backward compatibility)
export interface SerpFeaturesSimple {
  featuredSnippet: boolean;
  mapPack: boolean;
  faq: boolean;
  images: boolean;
  videos: boolean;
  aiOverview: boolean;
  siteLinks: boolean;
}

// ============================================
// Competitor Data
// ============================================

export interface Competitor {
  domain: string;
  url: string;
  position: number;
  title: string;
}

// ============================================
// Summary and Statistics
// ============================================

export interface GroupSummary {
  totalKeywords: number;
  keywordsRanking: number;
  avgPosition: number | null;
  inTop3: number;
  inTop10: number;
  inTop50: number;
  inTop100: number;
  notFound: number;
}

// ============================================
// Keyword Discovery (future)
// ============================================

export interface DiscoveryResult {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  monthlyTrend: { month: number; volume: number }[];
  suggestions: DiscoverySuggestion[];
}

export interface DiscoverySuggestion {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
}

// ============================================
// Service Layer Types
// ============================================

export interface RankCheckBatchResult {
  success: boolean;
  checksPerformed: number;
  totalCost: number;
  results: RankCheck[];
  errors: string[];
}

export interface RankCheckOptions {
  /** Specific keyword IDs to check. If not provided, checks all enabled keywords */
  keywordIds?: string[];
  /** Language code for search (default: 'en') */
  languageCode?: string;
}

export interface GetHistoryOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
}
