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
 * Search term entry for SERP tracking.
 * Multiple search terms can be associated with a single keyword concept.
 */
export interface SearchTerm {
  term: string;
  isCanonical: boolean;  // The primary term shown when space is limited
  addedAt: string;       // ISO date string
}

/**
 * Funnel stage for related questions.
 * - top: Awareness stage - broad, educational questions
 * - middle: Consideration stage - comparison, evaluation questions
 * - bottom: Decision stage - purchase-intent, specific action questions
 */
export type FunnelStage = 'top' | 'middle' | 'bottom';

/**
 * Related question entry with funnel stage categorization.
 */
export interface RelatedQuestion {
  question: string;
  funnelStage: FunnelStage;
  addedAt: string;  // ISO date string
}

/**
 * Result of checking if a search term is relevant to a concept.
 */
export interface RelevanceCheckResult {
  isRelevant: boolean;
  sharedRoots: string[];
  missingRoots: string[];
  similarity: number;  // 0-1 score
}

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
  /** @deprecated Use searchTerms instead. Kept for backward compatibility. */
  searchQuery: string | null;
  /** Array of search terms for SERP tracking. One should have isCanonical=true. */
  searchTerms: SearchTerm[];
  aliases: string[];
  locationScope: LocationScope | null;
  aiGenerated: boolean;
  aiSuggestions: Record<string, unknown> | null;
  // Related questions for PAA/LLM tracking with funnel stage categorization
  relatedQuestions: RelatedQuestion[];
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
  // Location used for search volume lookup
  searchVolumeLocationCode: number | null;
  searchVolumeLocationName: string | null;
}

// ==========================================
// Search Term Functions
// ==========================================

/**
 * Transform database search_terms to API format.
 * Falls back to search_query if search_terms is empty (backward compatibility).
 */
export function transformSearchTerms(
  searchTerms: { term: string; is_canonical: boolean; added_at: string }[] | null | undefined,
  searchQuery: string | null | undefined
): SearchTerm[] {
  // If we have search_terms array, transform it
  if (searchTerms && Array.isArray(searchTerms) && searchTerms.length > 0) {
    return searchTerms.map((st) => ({
      term: st.term,
      isCanonical: st.is_canonical,
      addedAt: st.added_at,
    }));
  }

  // Fallback: if only search_query exists (legacy data), convert it
  if (searchQuery) {
    return [
      {
        term: searchQuery,
        isCanonical: true,
        addedAt: new Date().toISOString(),
      },
    ];
  }

  return [];
}

/**
 * Get the canonical (primary) search term from the array.
 * Returns the first canonical term, or the first term if none is canonical.
 */
export function getCanonicalSearchTerm(searchTerms: SearchTerm[]): SearchTerm | null {
  if (searchTerms.length === 0) return null;
  return searchTerms.find((t) => t.isCanonical) ?? searchTerms[0];
}

/**
 * Transform search terms array to database format.
 */
export function searchTermsToDb(
  searchTerms: SearchTerm[]
): { term: string; is_canonical: boolean; added_at: string }[] {
  return searchTerms.map((st) => ({
    term: st.term,
    is_canonical: st.isCanonical,
    added_at: st.addedAt,
  }));
}

// ==========================================
// Related Questions Functions
// ==========================================

/**
 * Database format for related questions (snake_case).
 */
interface DbRelatedQuestion {
  question: string;
  funnelStage: FunnelStage;
  addedAt: string;
}

/**
 * Transform database related_questions to API format.
 * Handles both old string[] format and new object[] format for backward compatibility.
 */
export function transformRelatedQuestions(
  dbQuestions: DbRelatedQuestion[] | string[] | null | undefined
): RelatedQuestion[] {
  if (!dbQuestions || !Array.isArray(dbQuestions)) {
    return [];
  }

  // Check if it's the old string[] format
  if (dbQuestions.length > 0 && typeof dbQuestions[0] === 'string') {
    // Convert old format to new format with default 'middle' funnel stage
    return (dbQuestions as string[]).map((q) => ({
      question: q,
      funnelStage: 'middle' as FunnelStage,
      addedAt: new Date().toISOString(),
    }));
  }

  // New format - already objects
  return (dbQuestions as DbRelatedQuestion[]).map((q) => ({
    question: q.question,
    funnelStage: q.funnelStage || 'middle',
    addedAt: q.addedAt || new Date().toISOString(),
  }));
}

/**
 * Transform related questions array to JSONB database format (legacy).
 */
export function relatedQuestionsToDb(
  questions: RelatedQuestion[]
): DbRelatedQuestion[] {
  return questions.map((q) => ({
    question: q.question,
    funnelStage: q.funnelStage,
    addedAt: q.addedAt,
  }));
}

// ==========================================
// Keyword Questions Table Functions (normalized)
// ==========================================

/**
 * Database row format for keyword_questions table.
 */
export interface KeywordQuestionRow {
  id: string;
  keyword_id: string;
  question: string;
  funnel_stage: FunnelStage;
  added_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Transform keyword_questions table rows to API format.
 */
export function transformKeywordQuestionRows(
  rows: KeywordQuestionRow[] | null | undefined
): RelatedQuestion[] {
  if (!rows || !Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => ({
    question: row.question,
    funnelStage: row.funnel_stage || 'middle',
    addedAt: row.added_at || row.created_at || new Date().toISOString(),
  }));
}

/**
 * Prepare a question for insertion into keyword_questions table.
 */
export function prepareQuestionForInsert(
  keywordId: string,
  question: RelatedQuestion
): Omit<KeywordQuestionRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    keyword_id: keywordId,
    question: question.question,
    funnel_stage: question.funnelStage,
    added_at: question.addedAt || new Date().toISOString(),
  };
}

/**
 * Get display label for funnel stage.
 */
export function getFunnelStageLabel(stage: FunnelStage): string {
  switch (stage) {
    case 'top':
      return 'Top of funnel';
    case 'middle':
      return 'Middle of funnel';
    case 'bottom':
      return 'Bottom of funnel';
    default:
      return 'Middle of funnel';
  }
}

/**
 * Get short label for funnel stage.
 */
export function getFunnelStageShortLabel(stage: FunnelStage): string {
  switch (stage) {
    case 'top':
      return 'ToF';
    case 'middle':
      return 'MoF';
    case 'bottom':
      return 'BoF';
    default:
      return 'MoF';
  }
}

/**
 * Get color classes for funnel stage.
 */
export function getFunnelStageColor(stage: FunnelStage): { bg: string; text: string; border: string } {
  switch (stage) {
    case 'top':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
    case 'middle':
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' };
    case 'bottom':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
  }
}

// ==========================================
// Root Word Relevance Checking
// ==========================================

/**
 * Common stop words to ignore when extracting root words.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'or',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'best', 'top', 'good', 'great', 'near', 'me', 'my', 'your',
  'i', 'you', 'we', 'they', 'it', 'this', 'that',
  'how', 'what', 'where', 'when', 'why', 'who',
]);

/**
 * Extract the stem/root of a word by stripping common suffixes.
 * This is a simple rule-based stemmer, not as sophisticated as Porter Stemmer
 * but sufficient for relevance checking.
 */
export function getStem(word: string): string {
  let stem = word.toLowerCase().trim();

  // Skip very short words
  if (stem.length <= 3) return stem;

  // Strip common suffixes (order matters - longer suffixes first)
  const suffixes = [
    'ational', 'tional', 'ization', 'fulness', 'ousness', 'iveness',
    'ement', 'ment', 'ness', 'able', 'ible', 'tion', 'sion',
    'ance', 'ence', 'ling', 'ally', 'ful', 'ous', 'ive',
    'ing', 'ers', 'ies', 'ed', 'er', 'es', 'ly', 's',
  ];

  for (const suffix of suffixes) {
    if (stem.endsWith(suffix) && stem.length > suffix.length + 2) {
      stem = stem.slice(0, -suffix.length);
      break;
    }
  }

  // Handle 'y' -> 'i' conversions (e.g., plumbi -> plumb)
  if (stem.endsWith('i') && stem.length > 2) {
    stem = stem.slice(0, -1);
  }

  return stem;
}

/**
 * Extract root words from a phrase, excluding stop words.
 * Returns a Set of stems for efficient lookup.
 */
export function getRootWords(phrase: string): Set<string> {
  return new Set(
    phrase
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
      .map(getStem)
      .filter((stem) => stem.length > 1)
  );
}

/**
 * Check if a search term is relevant to a keyword concept.
 *
 * Compares root words between the concept's phrase and the new term.
 * A term is considered relevant if it shares at least one root word
 * with the concept phrase.
 *
 * @param conceptPhrase - The keyword concept's main phrase (e.g., "plumbing services")
 * @param newTerm - The search term being added (e.g., "portland plumber")
 * @returns Relevance check result with shared/missing roots and similarity score
 */
export function checkSearchTermRelevance(
  conceptPhrase: string,
  newTerm: string
): RelevanceCheckResult {
  const conceptRoots = getRootWords(conceptPhrase);
  const termRoots = getRootWords(newTerm);

  const termRootsArray = Array.from(termRoots);
  const sharedRoots = termRootsArray.filter((r) => conceptRoots.has(r));
  const missingRoots = termRootsArray.filter((r) => !conceptRoots.has(r));

  // Calculate similarity as ratio of shared roots to term roots
  const similarity = termRoots.size > 0
    ? sharedRoots.length / termRoots.size
    : 0;

  // Relevant if at least 1 root word matches
  const isRelevant = sharedRoots.length >= 1;

  return {
    isRelevant,
    sharedRoots,
    missingRoots,
    similarity,
  };
}

// ==========================================
// Transformer Functions
// ==========================================

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
    search_terms?: { term: string; is_canonical: boolean; added_at: string }[] | null;
    aliases?: string[] | null;
    location_scope?: string | null;
    ai_generated?: boolean | null;
    ai_suggestions?: Record<string, unknown> | null;
    related_questions?: DbRelatedQuestion[] | string[] | null;
    // Metrics fields
    search_volume?: number | null;
    cpc?: number | null;
    competition_level?: string | null;
    search_volume_trend?: Record<string, unknown> | null;
    search_volume_location_code?: number | null;
    search_volume_location_name?: string | null;
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
    searchTerms: transformSearchTerms(keyword.search_terms, keyword.search_query),
    aliases: keyword.aliases ?? [],
    locationScope: (keyword.location_scope as LocationScope) ?? null,
    aiGenerated: keyword.ai_generated ?? false,
    aiSuggestions: keyword.ai_suggestions ?? null,
    relatedQuestions: transformRelatedQuestions(keyword.related_questions),
    // Metrics fields
    searchVolume: keyword.search_volume ?? null,
    cpc: keyword.cpc ? Number(keyword.cpc) : null,
    competitionLevel: (keyword.competition_level as 'LOW' | 'MEDIUM' | 'HIGH') ?? null,
    searchVolumeTrend: keyword.search_volume_trend as KeywordData['searchVolumeTrend'] ?? null,
    metricsUpdatedAt: keyword.metrics_updated_at
      ? new Date(keyword.metrics_updated_at).toISOString()
      : null,
    searchVolumeLocationCode: keyword.search_volume_location_code ?? null,
    searchVolumeLocationName: keyword.search_volume_location_name ?? null,
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
