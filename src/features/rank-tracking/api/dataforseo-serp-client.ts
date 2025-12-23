/**
 * DataForSEO SERP API Client
 *
 * Wrapper for DataForSEO's organic search (SERP) and keyword research APIs.
 * Used for rank tracking, keyword discovery, and search volume analysis.
 *
 * API Documentation:
 * - Organic SERP: https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/
 * - Keyword Volume: https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/
 * - Keyword Suggestions: https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live/
 * - Locations: https://docs.dataforseo.com/v3/serp/google/locations/
 */

// ============================================
// Types
// ============================================

export interface SerpSearchResult {
  success: boolean;
  cost: number;
  items: SerpItem[];
  /** Enriched SERP features including PAA questions and AI Overview citations */
  serpFeatures: SerpFeatures;
  error?: string;
}

export interface SerpItem {
  position: number;
  url: string;
  domain: string;
  title: string;
  description: string;
  breadcrumb: string;
  /** Per-item SERP features (simple booleans for individual results) */
  serpFeatures: SerpFeaturesSimple;
  // Raw data for advanced use cases
  raw?: {
    highlightedWords?: string[];
    relatedSearches?: string[];
  };
}

// Legacy simple boolean features (for backward compatibility)
export interface SerpFeaturesSimple {
  featuredSnippet: boolean;
  siteLinks: boolean;
  faq: boolean;
  images: boolean;
  videos: boolean;
  mapPack: boolean;
  aiOverview: boolean;
}

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

export interface SerpRankResult {
  position: number | null;
  url: string | null;
  title: string | null;
  found: boolean;
  topCompetitors: SerpCompetitor[];
  /** Enriched SERP features including PAA and AI Overview visibility */
  serpFeatures: SerpFeatures;
  cost: number;
}

export interface SerpCompetitor {
  position: number;
  domain: string;
  url: string;
  title: string;
  /** Per-item SERP features (simple booleans for competitors) */
  serpFeatures: SerpFeaturesSimple;
}

export interface KeywordVolumeResult {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  monthlySearches: MonthlySearchData[];
}

export interface MonthlySearchData {
  year: number;
  month: number;
  searchVolume: number;
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  // New metrics
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  keywordDifficulty: number | null;
  searchIntent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null;
  categories: string[];
  searchVolumeTrend: {
    monthly: number | null;
    quarterly: number | null;
    yearly: number | null;
  } | null;
}

export interface DataForSEOLocation {
  locationCode: number;
  locationName: string;
  countryIsoCode: string;
  locationType: string;
}

// Internal types for API responses
interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    cost: number;
    result?: Array<{
      items?: any[];
      total_count?: number;
    }>;
  }>;
}

// ============================================
// Configuration
// ============================================

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';
const ORGANIC_SERP_ENDPOINT = '/serp/google/organic/live/advanced';
const KEYWORD_VOLUME_ENDPOINT = '/keywords_data/google_ads/search_volume/live';
const KEYWORD_SUGGESTIONS_ENDPOINT = '/dataforseo_labs/google/keyword_suggestions/live';
const LOCATIONS_ENDPOINT = '/serp/google/locations';

// Default depth for SERP results (top 100)
const DEFAULT_DEPTH = 100;

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

// ============================================
// Credentials
// ============================================

interface DataForSEOCredentials {
  login: string;
  password: string;
}

function getCredentials(): DataForSEOCredentials {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.'
    );
  }

  return { login, password };
}

function getAuthHeader(credentials: DataForSEOCredentials): string {
  const encoded = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');
  return `Basic ${encoded}`;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse simple SERP features from a single DataForSEO item (legacy)
 */
function parseSerpFeaturesSimple(item: any): SerpFeaturesSimple {
  return {
    featuredSnippet: item.type === 'featured_snippet' || false,
    siteLinks: Array.isArray(item.links) && item.links.length > 0,
    faq: item.type === 'faq' || item.type === 'people_also_ask' || false,
    images: item.type === 'images' || false,
    videos: item.type === 'video' || false,
    mapPack: item.type === 'local_pack' || item.type === 'map' || false,
    aiOverview: item.type === 'ai_overview' || false,
  };
}

/**
 * Parse all SERP items to extract enriched features including PAA and AI Overview
 */
function parseEnrichedSerpFeatures(allItems: any[], targetDomain?: string): SerpFeatures {
  const normalizedTarget = targetDomain
    ?.replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  const isOurDomain = (domain: string | null | undefined): boolean => {
    if (!domain || !normalizedTarget) return false;
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    return normalizedDomain === normalizedTarget || normalizedDomain.includes(normalizedTarget);
  };

  // Initialize result
  const result: SerpFeatures = {
    featuredSnippet: { present: false, isOurs: false, domain: null, url: null },
    siteLinks: false,
    images: false,
    videos: false,
    mapPack: { present: false, isOurs: false },
    peopleAlsoAsk: { present: false, questions: [], ourQuestionCount: 0 },
    aiOverview: { present: false, isOursCited: false, citations: [], ourCitationCount: 0 },
  };

  for (const item of allItems) {
    const itemType = item.type;

    // Featured Snippet
    if (itemType === 'featured_snippet') {
      const domain = item.domain || extractDomain(item.url || '');
      result.featuredSnippet = {
        present: true,
        isOurs: isOurDomain(domain),
        domain,
        url: item.url || null,
      };
    }

    // Site Links (on organic items)
    if (Array.isArray(item.links) && item.links.length > 0) {
      result.siteLinks = true;
    }

    // Images
    if (itemType === 'images') {
      result.images = true;
    }

    // Videos
    if (itemType === 'video') {
      result.videos = true;
    }

    // Map Pack / Local Pack
    if (itemType === 'local_pack' || itemType === 'map') {
      result.mapPack.present = true;
      // Check if our domain appears in local pack items
      if (item.items && Array.isArray(item.items)) {
        for (const localItem of item.items) {
          if (isOurDomain(localItem.domain)) {
            result.mapPack.isOurs = true;
            break;
          }
        }
      }
    }

    // People Also Ask
    if (itemType === 'people_also_ask') {
      result.peopleAlsoAsk.present = true;

      // Parse PAA items
      if (item.items && Array.isArray(item.items)) {
        for (const paaItem of item.items) {
          const question: PAAQuestion = {
            question: paaItem.title || '',
            answerDomain: null,
            answerUrl: null,
            answerTitle: null,
            isOurs: false,
            isAiGenerated: false,
          };

          // Check expanded element for answer source
          if (paaItem.expanded_element && Array.isArray(paaItem.expanded_element)) {
            for (const expanded of paaItem.expanded_element) {
              if (expanded.type === 'people_also_ask_expanded_element') {
                question.answerDomain = expanded.domain || extractDomain(expanded.url || '');
                question.answerUrl = expanded.url || null;
                question.answerTitle = expanded.title || null;
                question.isOurs = isOurDomain(question.answerDomain);
                question.isAiGenerated = false;
              } else if (expanded.type === 'people_also_ask_ai_overview_expanded_element') {
                question.isAiGenerated = true;
                // AI-generated answers may have references
                if (expanded.references && Array.isArray(expanded.references)) {
                  const firstRef = expanded.references[0];
                  if (firstRef) {
                    question.answerDomain = firstRef.domain || null;
                    question.answerUrl = firstRef.url || null;
                    question.answerTitle = firstRef.title || null;
                    question.isOurs = isOurDomain(question.answerDomain);
                  }
                }
              }
            }
          }

          if (question.question) {
            result.peopleAlsoAsk.questions.push(question);
            if (question.isOurs) {
              result.peopleAlsoAsk.ourQuestionCount++;
            }
          }
        }
      }
    }

    // AI Overview
    if (itemType === 'ai_overview') {
      result.aiOverview.present = true;

      // Parse citations from AI overview items
      if (item.items && Array.isArray(item.items)) {
        for (const aiItem of item.items) {
          // Check for references in each AI overview element
          if (aiItem.references && Array.isArray(aiItem.references)) {
            for (const ref of aiItem.references) {
              const citation: AICitation = {
                domain: ref.domain || extractDomain(ref.url || ''),
                url: ref.url || null,
                title: ref.title || null,
                isOurs: isOurDomain(ref.domain),
              };

              // Avoid duplicates
              const exists = result.aiOverview.citations.some(
                (c) => c.url === citation.url || (c.domain === citation.domain && !c.url)
              );

              if (!exists && citation.domain) {
                result.aiOverview.citations.push(citation);
                if (citation.isOurs) {
                  result.aiOverview.ourCitationCount++;
                  result.aiOverview.isOursCited = true;
                }
              }
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Map competition index to level
 */
function mapCompetitionLevel(index: number | null): 'LOW' | 'MEDIUM' | 'HIGH' | null {
  if (index === null || index === undefined) return null;
  if (index < 33) return 'LOW';
  if (index < 66) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Make authenticated request to DataForSEO API
 */
async function makeDataForSEORequest(
  endpoint: string,
  requestBody: any[],
  logPrefix: string
): Promise<DataForSEOResponse> {
  const credentials = getCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log(`🔍 [DataForSEO SERP] ${logPrefix}`);

    const response = await fetch(`${DATAFORSEO_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(credentials),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [DataForSEO SERP] API error: ${response.status}`, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data: DataForSEOResponse = await response.json();

    // Check overall response status
    if (data.status_code !== 20000) {
      throw new Error(`API error: ${data.status_message}`);
    }

    console.log(`✅ [DataForSEO SERP] ${logPrefix} - Success`);
    return data;
  } catch (error) {
    clearTimeout(timeout);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`❌ [DataForSEO SERP] Request timeout (${REQUEST_TIMEOUT / 1000}s)`);
      throw new Error(`Request timeout (${REQUEST_TIMEOUT / 1000} seconds)`);
    }

    console.error(`❌ [DataForSEO SERP] ${logPrefix} - Failed:`, error);
    throw error;
  }
}

// ============================================
// API Functions
// ============================================

/**
 * 1. Search Google organic SERP results
 *
 * Returns organic results plus enriched SERP features including:
 * - People Also Ask questions with answer sources
 * - AI Overview citations
 * - Featured snippet info
 */
export async function searchGoogleSerp(params: {
  keyword: string;
  locationCode: number;
  languageCode?: string;
  device?: 'desktop' | 'mobile';
  depth?: number;
  /** Target domain to check for PAA/AI visibility (e.g., "example.com") */
  targetDomain?: string;
}): Promise<SerpSearchResult> {
  const {
    keyword,
    locationCode,
    languageCode = 'en',
    device = 'desktop',
    depth = DEFAULT_DEPTH,
    targetDomain,
  } = params;

  // Default empty SERP features for error cases
  const emptySerpFeatures: SerpFeatures = {
    featuredSnippet: { present: false, isOurs: false, domain: null, url: null },
    siteLinks: false,
    images: false,
    videos: false,
    mapPack: { present: false, isOurs: false },
    peopleAlsoAsk: { present: false, questions: [], ourQuestionCount: 0 },
    aiOverview: { present: false, isOursCited: false, citations: [], ourCitationCount: 0 },
  };

  const requestBody = [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device,
      depth,
      calculate_rectangles: true, // Enable SERP feature detection
      load_async_ai_overview: true, // Enable AI Overview data (+$0.002)
    },
  ];

  try {
    const data = await makeDataForSEORequest(
      ORGANIC_SERP_ENDPOINT,
      requestBody,
      `Searching SERP for "${keyword}"`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return {
        success: false,
        cost: 0,
        items: [],
        serpFeatures: emptySerpFeatures,
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        items: [],
        serpFeatures: emptySerpFeatures,
        error: `Task failed: ${task.status_message}`,
      };
    }

    // Get ALL items for SERP feature parsing
    const rawItems = task.result?.[0]?.items || [];

    // Parse enriched SERP features from all items
    const serpFeatures = parseEnrichedSerpFeatures(rawItems, targetDomain);

    // Extract organic items for position tracking
    const organicItems = rawItems.filter((item: any) => item.type === 'organic');

    const items: SerpItem[] = organicItems.map((item: any) => ({
      position: item.rank_absolute || 0,
      url: item.url || '',
      domain: extractDomain(item.url || ''),
      title: item.title || '',
      description: item.description || '',
      breadcrumb: item.breadcrumb || '',
      serpFeatures: parseSerpFeaturesSimple(item), // Per-item features (legacy)
      raw: {
        highlightedWords: item.highlighted || [],
        relatedSearches: item.related_searches || [],
      },
    }));

    const paaCount = serpFeatures.peopleAlsoAsk.questions.length;
    const aiCitations = serpFeatures.aiOverview.citations.length;
    console.log(
      `🔍 [DataForSEO SERP] Found ${items.length} organic results, ` +
      `${paaCount} PAA questions, ${aiCitations} AI citations (cost: $${task.cost})`
    );

    return {
      success: true,
      cost: task.cost || 0,
      items,
      serpFeatures,
    };
  } catch (error) {
    console.error('❌ [DataForSEO SERP] searchGoogleSerp failed:', error);
    return {
      success: false,
      cost: 0,
      items: [],
      serpFeatures: emptySerpFeatures,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 2. Check rank for a specific domain
 *
 * Also returns enriched SERP features with PAA/AI visibility for the target domain.
 */
export async function checkRankForDomain(params: {
  keyword: string;
  locationCode: number;
  targetDomain: string;
  device?: 'desktop' | 'mobile';
  depth?: number;
}): Promise<SerpRankResult> {
  const { targetDomain, ...searchParams } = params;

  // Normalize domain (remove www, protocol, trailing slash)
  const normalizedTarget = targetDomain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  console.log(`🔍 [DataForSEO SERP] Checking rank for domain: ${normalizedTarget}`);

  // Pass targetDomain so SERP features can check for our visibility
  const searchResult = await searchGoogleSerp({
    ...searchParams,
    targetDomain: normalizedTarget,
  });

  // Default empty SERP features for error cases
  const emptySerpFeatures: SerpFeatures = {
    featuredSnippet: { present: false, isOurs: false, domain: null, url: null },
    siteLinks: false,
    images: false,
    videos: false,
    mapPack: { present: false, isOurs: false },
    peopleAlsoAsk: { present: false, questions: [], ourQuestionCount: 0 },
    aiOverview: { present: false, isOursCited: false, citations: [], ourCitationCount: 0 },
  };

  if (!searchResult.success) {
    return {
      position: null,
      url: null,
      title: null,
      found: false,
      topCompetitors: [],
      serpFeatures: emptySerpFeatures,
      cost: searchResult.cost,
    };
  }

  // Find matching domain
  let position: number | null = null;
  let url: string | null = null;
  let title: string | null = null;
  let found = false;

  for (const item of searchResult.items) {
    const itemDomain = item.domain.toLowerCase();

    if (itemDomain === normalizedTarget || itemDomain.includes(normalizedTarget)) {
      position = item.position;
      url = item.url;
      title = item.title;
      found = true;
      console.log(`✅ [DataForSEO SERP] Found at position ${position}`);
      break;
    }
  }

  if (!found) {
    console.log(`❌ [DataForSEO SERP] Domain not found in top ${searchResult.items.length} results`);
  }

  // Log PAA/AI visibility
  const paa = searchResult.serpFeatures.peopleAlsoAsk;
  const ai = searchResult.serpFeatures.aiOverview;
  if (paa.present || ai.present) {
    console.log(
      `📊 [DataForSEO SERP] SERP Features: ` +
      `PAA: ${paa.ourQuestionCount}/${paa.questions.length} questions, ` +
      `AI Overview: ${ai.isOursCited ? 'CITED' : ai.present ? 'present (not cited)' : 'not present'}`
    );
  }

  // Get top 10 competitors (excluding target domain)
  const topCompetitors: SerpCompetitor[] = searchResult.items
    .filter((item) => {
      const itemDomain = item.domain.toLowerCase();
      return itemDomain !== normalizedTarget && !itemDomain.includes(normalizedTarget);
    })
    .slice(0, 10)
    .map((item) => ({
      position: item.position,
      domain: item.domain,
      url: item.url,
      title: item.title,
      serpFeatures: item.serpFeatures,
    }));

  return {
    position,
    url,
    title,
    found,
    topCompetitors,
    serpFeatures: searchResult.serpFeatures,
    cost: searchResult.cost,
  };
}

/**
 * 3. Get search volume for keywords
 */
export async function getKeywordVolume(params: {
  keywords: string[];
  locationCode?: number;
  languageCode?: string;
}): Promise<KeywordVolumeResult[]> {
  const { keywords, locationCode = 2840, languageCode = 'en' } = params; // Default: USA

  if (keywords.length === 0) {
    return [];
  }

  const requestBody = [
    {
      keywords,
      location_code: locationCode,
      language_code: languageCode,
    },
  ];

  try {
    const data = await makeDataForSEORequest(
      KEYWORD_VOLUME_ENDPOINT,
      requestBody,
      `Getting volume for ${keywords.length} keywords`
    );

    const task = data.tasks?.[0];

    if (!task || task.status_code !== 20000) {
      console.error('❌ [DataForSEO SERP] Keyword volume task failed:', task?.status_message);
      return [];
    }

    // Note: The keyword volume endpoint returns results directly in task.result array,
    // NOT nested under result[0].items like SERP endpoints
    const items = task.result || [];

    console.log(`🔍 [DataForSEO SERP] Keyword volume items count: ${items.length}`);

    const results: KeywordVolumeResult[] = items.map((item: any) => ({
      keyword: item.keyword || '',
      searchVolume: item.search_volume || 0,
      cpc: item.cpc || null,
      // Ensure competition is always numeric (DataForSEO may sometimes return strings)
      competition: typeof item.competition === 'number' ? item.competition : null,
      competitionLevel: mapCompetitionLevel(item.competition_index),
      lowTopOfPageBid: item.low_top_of_page_bid || null,
      highTopOfPageBid: item.high_top_of_page_bid || null,
      monthlySearches: (item.monthly_searches || []).map((month: any) => ({
        year: month.year,
        month: month.month,
        searchVolume: month.search_volume || 0,
      })),
    }));

    console.log(`🔍 [DataForSEO SERP] Retrieved volume for ${results.length} keywords (cost: $${task.cost})`);

    return results;
  } catch (error) {
    console.error('❌ [DataForSEO SERP] getKeywordVolume failed:', error);
    return [];
  }
}

/**
 * 4. Get keyword suggestions (related keywords)
 * Returns comprehensive keyword data including difficulty, intent, and trends
 */
export async function getKeywordSuggestions(params: {
  seedKeyword: string;
  locationCode?: number;
  limit?: number;
}): Promise<KeywordSuggestion[]> {
  const { seedKeyword, locationCode = 2840, limit = 100 } = params; // Default: USA, 100 results

  const requestBody = [
    {
      keyword: seedKeyword,
      location_code: locationCode,
      limit,
      include_seed_keyword: true,
      include_serp_info: false, // Don't need SERP features for suggestions
    },
  ];

  try {
    const data = await makeDataForSEORequest(
      KEYWORD_SUGGESTIONS_ENDPOINT,
      requestBody,
      `Getting suggestions for "${seedKeyword}"`
    );

    const task = data.tasks?.[0];
    if (!task || task.status_code !== 20000) {
      console.error('❌ [DataForSEO SERP] Keyword suggestions task failed');
      return [];
    }

    const items = task.result?.[0]?.items || [];

    const results: KeywordSuggestion[] = items.map((item: any) => {
      const keywordInfo = item.keyword_info || {};
      const keywordProps = item.keyword_properties || {};
      const intentInfo = item.search_intent_info || {};
      const trend = keywordInfo.search_volume_trend || {};

      return {
        keyword: item.keyword || '',
        searchVolume: keywordInfo.search_volume || 0,
        cpc: keywordInfo.cpc || null,
        // Ensure competition is always numeric (DataForSEO may sometimes return strings)
        competition: typeof keywordInfo.competition === 'number' ? keywordInfo.competition : null,
        competitionLevel: mapCompetitionLevel(keywordInfo.competition_index),
        lowTopOfPageBid: keywordInfo.low_top_of_page_bid || null,
        highTopOfPageBid: keywordInfo.high_top_of_page_bid || null,
        keywordDifficulty: keywordProps.keyword_difficulty ?? null,
        searchIntent: mapSearchIntent(intentInfo.main_intent),
        categories: keywordInfo.categories || [],
        searchVolumeTrend: trend ? {
          monthly: trend.monthly ?? null,
          quarterly: trend.quarterly ?? null,
          yearly: trend.yearly ?? null,
        } : null,
      };
    });

    console.log(`🔍 [DataForSEO SERP] Retrieved ${results.length} suggestions (cost: $${task.cost})`);

    return results;
  } catch (error) {
    console.error('❌ [DataForSEO SERP] getKeywordSuggestions failed:', error);
    return [];
  }
}

/**
 * Map DataForSEO intent to our normalized values
 */
function mapSearchIntent(
  intent: string | null | undefined
): 'informational' | 'navigational' | 'commercial' | 'transactional' | null {
  if (!intent) return null;
  const normalized = intent.toLowerCase();
  if (normalized === 'informational') return 'informational';
  if (normalized === 'navigational') return 'navigational';
  if (normalized === 'commercial') return 'commercial';
  if (normalized === 'transactional') return 'transactional';
  return null;
}

/**
 * 5. Get comprehensive keyword metrics for existing keywords
 * Uses DataForSEO Labs to get difficulty, intent, trends, etc.
 *
 * Note: This uses the keyword_suggestions endpoint with the keyword as seed
 * to get full metrics including difficulty and intent.
 */
export async function getKeywordMetrics(params: {
  keywords: string[];
  locationCode?: number;
}): Promise<Map<string, KeywordSuggestion>> {
  const { keywords, locationCode = 2840 } = params;
  const metricsMap = new Map<string, KeywordSuggestion>();

  if (keywords.length === 0) {
    return metricsMap;
  }

  // For each keyword, fetch its metrics using keyword_suggestions with limit 1
  // This gets us the full metrics including difficulty and intent
  for (const keyword of keywords) {
    try {
      const results = await getKeywordSuggestions({
        seedKeyword: keyword,
        locationCode,
        limit: 1, // Just get the seed keyword metrics
      });

      // Find exact match (the seed keyword itself)
      const match = results.find(
        (r) => r.keyword.toLowerCase() === keyword.toLowerCase()
      );

      if (match) {
        metricsMap.set(keyword.toLowerCase(), match);
      }
    } catch (error) {
      console.error(`❌ [DataForSEO] Failed to get metrics for "${keyword}":`, error);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`🔍 [DataForSEO SERP] Retrieved metrics for ${metricsMap.size}/${keywords.length} keywords`);

  return metricsMap;
}

/**
 * 6. Get available locations for SERP searches
 */
export async function getAvailableLocations(): Promise<DataForSEOLocation[]> {
  const credentials = getCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log('🔍 [DataForSEO SERP] Fetching available locations');

    const response = await fetch(`${DATAFORSEO_API_BASE}${LOCATIONS_ENDPOINT}`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(credentials),
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data: DataForSEOResponse = await response.json();

    if (data.status_code !== 20000) {
      throw new Error(`API error: ${data.status_message}`);
    }

    const task = data.tasks?.[0];
    if (!task || task.status_code !== 20000) {
      throw new Error('Failed to fetch locations');
    }

    const items = task.result || [];

    const locations: DataForSEOLocation[] = items.map((item: any) => ({
      locationCode: item.location_code,
      locationName: item.location_name,
      countryIsoCode: item.country_iso_code || '',
      locationType: item.location_type || '',
    }));

    console.log(`✅ [DataForSEO SERP] Retrieved ${locations.length} locations`);

    return locations;
  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ [DataForSEO SERP] getAvailableLocations failed:', error);
    return [];
  }
}

// ============================================
// Test & Utility Functions
// ============================================

/**
 * Test API connection with a simple search
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  cost?: number;
}> {
  try {
    const result = await searchGoogleSerp({
      keyword: 'pizza',
      locationCode: 2840, // USA
      depth: 10,
    });

    if (result.success) {
      return {
        success: true,
        message: `Connection successful. Found ${result.items.length} results.`,
        cost: result.cost,
      };
    } else {
      return {
        success: false,
        message: result.error || 'Unknown error',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Exports
// ============================================

export const dataForSEOSerpClient = {
  searchGoogleSerp,
  checkRankForDomain,
  getKeywordVolume,
  getKeywordSuggestions,
  getKeywordMetrics,
  getAvailableLocations,
  testConnection,
};

export default dataForSEOSerpClient;
