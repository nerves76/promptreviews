/**
 * Unified Keyword System - Utility Functions
 *
 * Provides common utilities for keyword management including:
 * - Phrase normalization for matching
 * - Word count calculation
 * - Usage-based color coding for UI
 */

export type UsageColor = 'gray' | 'yellow' | 'orange' | 'red';

/**
 * Normalize a keyword phrase for consistent matching.
 * - Converts to lowercase
 * - Trims whitespace
 * - Collapses multiple spaces to single space
 *
 * @param phrase - The raw keyword phrase
 * @returns Normalized phrase for storage and matching
 */
export function normalizePhrase(phrase: string): string {
  return phrase
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Calculate the number of words in a phrase.
 * Used to determine color thresholds (only 4+ word keywords show usage colors).
 *
 * @param phrase - The keyword phrase
 * @returns Number of words
 */
export function calculateWordCount(phrase: string): number {
  const trimmed = phrase.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Get the usage color for a keyword based on word count and usage.
 *
 * Color coding only applies to keywords with 4+ words (long-tail keywords).
 * Short keywords (1-3 words) always return 'gray' as they don't get "stale"
 * the same way longer phrases do.
 *
 * Thresholds for 4+ word keywords:
 * - gray: 0-3 uses (fresh)
 * - yellow: 4-7 uses (getting familiar)
 * - orange: 8-15 uses (consider rotating)
 * - red: 16+ uses (overused, rotate soon)
 *
 * @param wordCount - Number of words in the keyword
 * @param usageCount - Number of reviews containing this keyword
 * @returns Color indicator for UI
 */
export function getUsageColor(wordCount: number, usageCount: number): UsageColor {
  // Short keywords (1-3 words) don't show usage colors
  if (wordCount < 4) {
    return 'gray';
  }

  // Long-tail keywords (4+ words) use threshold-based coloring
  if (usageCount <= 3) {
    return 'gray';
  } else if (usageCount <= 7) {
    return 'yellow';
  } else if (usageCount <= 15) {
    return 'orange';
  } else {
    return 'red';
  }
}

/**
 * Get CSS classes for usage color.
 * Returns Tailwind classes for background and text color.
 *
 * @param color - The usage color
 * @returns Object with bg and text Tailwind classes
 */
export function getUsageColorClasses(color: UsageColor): { bg: string; text: string } {
  switch (color) {
    case 'yellow':
      return { bg: 'bg-yellow-200', text: 'text-yellow-700' };
    case 'orange':
      return { bg: 'bg-orange-200', text: 'text-orange-700' };
    case 'red':
      return { bg: 'bg-red-200', text: 'text-red-700' };
    case 'gray':
    default:
      return { bg: 'bg-slate-200', text: 'text-slate-600' };
  }
}

/**
 * Get tooltip text explaining the usage count.
 *
 * @param wordCount - Number of words in the keyword
 * @param usageCount - Number of reviews containing this keyword
 * @returns Human-readable tooltip text
 */
export function getUsageTooltip(wordCount: number, usageCount: number): string {
  if (wordCount < 4) {
    return `Used in ${usageCount} review${usageCount === 1 ? '' : 's'}.`;
  }

  const color = getUsageColor(wordCount, usageCount);

  switch (color) {
    case 'gray':
      return `Used in ${usageCount} review${usageCount === 1 ? '' : 's'}. This phrase is still fresh.`;
    case 'yellow':
      return `Used in ${usageCount} reviews. This longer phrase is becoming familiar.`;
    case 'orange':
      return `Used in ${usageCount} reviews. Consider rotating this phrase to keep reviews feeling authentic.`;
    case 'red':
      return `Used in ${usageCount} reviews. This phrase is overused - consider replacing or rotating it.`;
    default:
      return `Used in ${usageCount} review${usageCount === 1 ? '' : 's'}.`;
  }
}

/**
 * Check if a keyword should show a usage indicator.
 * Only keywords with 4+ words show the usage bubble.
 *
 * @param wordCount - Number of words in the keyword
 * @returns Whether to show usage indicator
 */
export function shouldShowUsageIndicator(wordCount: number): boolean {
  return wordCount >= 4;
}

/**
 * Escape special regex characters in a string.
 * Used for word-boundary matching.
 *
 * @param text - Text to escape
 * @returns Escaped text safe for regex
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a keyword phrase exists in text using word-boundary matching.
 * More accurate than simple indexOf as it won't match partial words.
 *
 * @param text - The text to search in
 * @param keyword - The keyword to find
 * @returns Whether the keyword exists as a whole word/phrase
 */
export function keywordExistsInText(text: string, keyword: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = normalizePhrase(keyword);
  const regex = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, 'i');
  return regex.test(normalizedText);
}

/**
 * Default group name for keywords without explicit grouping.
 */
export const DEFAULT_GROUP_NAME = 'General';

/**
 * Type for keyword status.
 */
export type KeywordStatus = 'active' | 'paused';

/**
 * Location scope for keywords.
 */
export type LocationScope = 'local' | 'city' | 'region' | 'state' | 'national';

/**
 * Keyword data structure for API responses.
 */
export interface KeywordData {
  id: string;
  phrase: string;
  normalizedPhrase: string;
  wordCount: number;
  status: KeywordStatus;
  reviewUsageCount: number;
  lastUsedInReviewAt: string | null;
  groupId: string | null;
  groupName: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields for UI
  usageColor: UsageColor;
  showUsageIndicator: boolean;
  // Keyword concept fields
  reviewPhrase: string | null;
  searchQuery: string | null;
  aliases: string[];
  locationScope: LocationScope | null;
  aiGenerated: boolean;
  aiSuggestions: Record<string, unknown> | null;
  // Related questions for PAA/LLM tracking (AI generates 3-5, user can add up to 10)
  relatedQuestions: string[];
  // Rank tracking usage
  isUsedInRankTracking?: boolean;
  // Search volume metrics (from DataForSEO)
  searchVolume: number | null;
  cpc: number | null;
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  searchVolumeTrend: {
    monthly?: number;
    quarterly?: number;
    yearly?: number;
    monthlyData?: { month: number; year: number; volume: number }[];
  } | null;
  metricsUpdatedAt: string | null;
}

/**
 * Transform database keyword row to API response format.
 */
export function transformKeywordToResponse(
  keyword: {
    id: string;
    phrase: string;
    normalized_phrase: string;
    word_count: number;
    status: string | null;
    review_usage_count: number | null;
    last_used_in_review_at: Date | string | null;
    group_id: string | null;
    created_at: Date | string | null;
    updated_at: Date | string | null;
    // Concept fields
    review_phrase?: string | null;
    search_query?: string | null;
    aliases?: string[] | null;
    location_scope?: string | null;
    ai_generated?: boolean | null;
    ai_suggestions?: Record<string, unknown> | null;
    related_questions?: string[] | null;
    // Metrics fields
    search_volume?: number | null;
    cpc?: number | null;
    competition_level?: string | null;
    search_volume_trend?: Record<string, unknown> | null;
    metrics_updated_at?: Date | string | null;
  },
  groupName: string | null = null
): KeywordData {
  const wordCount = keyword.word_count;
  const usageCount = keyword.review_usage_count ?? 0;

  return {
    id: keyword.id,
    phrase: keyword.phrase,
    normalizedPhrase: keyword.normalized_phrase,
    wordCount,
    status: (keyword.status as KeywordStatus) || 'active',
    reviewUsageCount: usageCount,
    lastUsedInReviewAt: keyword.last_used_in_review_at
      ? new Date(keyword.last_used_in_review_at).toISOString()
      : null,
    groupId: keyword.group_id,
    groupName,
    createdAt: keyword.created_at
      ? new Date(keyword.created_at).toISOString()
      : new Date().toISOString(),
    updatedAt: keyword.updated_at
      ? new Date(keyword.updated_at).toISOString()
      : new Date().toISOString(),
    usageColor: getUsageColor(wordCount, usageCount),
    showUsageIndicator: shouldShowUsageIndicator(wordCount),
    // Concept fields
    reviewPhrase: keyword.review_phrase ?? null,
    searchQuery: keyword.search_query ?? null,
    aliases: keyword.aliases ?? [],
    locationScope: (keyword.location_scope as LocationScope) ?? null,
    aiGenerated: keyword.ai_generated ?? false,
    aiSuggestions: keyword.ai_suggestions ?? null,
    relatedQuestions: keyword.related_questions ?? [],
    // Metrics fields
    searchVolume: keyword.search_volume ?? null,
    cpc: keyword.cpc ? Number(keyword.cpc) : null,
    competitionLevel: (keyword.competition_level as 'LOW' | 'MEDIUM' | 'HIGH') ?? null,
    searchVolumeTrend: keyword.search_volume_trend as KeywordData['searchVolumeTrend'] ?? null,
    metricsUpdatedAt: keyword.metrics_updated_at
      ? new Date(keyword.metrics_updated_at).toISOString()
      : null,
  };
}

/**
 * Keyword group data structure for API responses.
 */
export interface KeywordGroupData {
  id: string;
  name: string;
  displayOrder: number;
  keywordCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform database keyword group row to API response format.
 */
export function transformGroupToResponse(
  group: {
    id: string;
    name: string;
    display_order: number | null;
    created_at: Date | string | null;
    updated_at: Date | string | null;
  },
  keywordCount: number = 0
): KeywordGroupData {
  return {
    id: group.id,
    name: group.name,
    displayOrder: group.display_order ?? 0,
    keywordCount,
    createdAt: group.created_at
      ? new Date(group.created_at).toISOString()
      : new Date().toISOString(),
    updatedAt: group.updated_at
      ? new Date(group.updated_at).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Helper to ensure "General" group exists for an account.
 * Creates the group if it doesn't exist, returns the group ID.
 *
 * @param accountId - The account ID
 * @param serviceSupabase - Supabase client with service role
 * @returns The group ID
 */
export async function ensureGeneralGroup(
  accountId: string,
  serviceSupabase: ReturnType<typeof import('@supabase/supabase-js').createClient>
): Promise<string> {
  const { data: existingGroup } = await serviceSupabase
    .from('keyword_groups')
    .select('id')
    .eq('account_id', accountId)
    .eq('name', DEFAULT_GROUP_NAME)
    .maybeSingle();

  if (existingGroup) {
    return (existingGroup as { id: string }).id;
  }

  const { data: newGroup, error } = await serviceSupabase
    .from('keyword_groups')
    .insert({
      account_id: accountId,
      name: DEFAULT_GROUP_NAME,
      display_order: 0,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to create General group');
  }

  return (newGroup as { id: string }).id;
}
