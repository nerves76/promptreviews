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
  error?: string;
}

export interface SerpItem {
  position: number;
  url: string;
  domain: string;
  title: string;
  description: string;
  breadcrumb: string;
  serpFeatures: SerpFeatures;
  // Raw data for advanced use cases
  raw?: {
    highlightedWords?: string[];
    relatedSearches?: string[];
  };
}

export interface SerpFeatures {
  featuredSnippet: boolean;
  siteLinks: boolean;
  faq: boolean;
  images: boolean;
  videos: boolean;
  mapPack: boolean;
  aiOverview: boolean;
}

export interface SerpRankResult {
  position: number | null;
  url: string | null;
  title: string | null;
  found: boolean;
  topCompetitors: SerpCompetitor[];
  cost: number;
}

export interface SerpCompetitor {
  position: number;
  domain: string;
  url: string;
  title: string;
  serpFeatures: SerpFeatures;
}

export interface KeywordVolumeResult {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
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
 * Parse SERP features from DataForSEO item
 */
function parseSerpFeatures(item: any): SerpFeatures {
  const features = item.rectangle || {};

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
 */
export async function searchGoogleSerp(params: {
  keyword: string;
  locationCode: number;
  languageCode?: string;
  device?: 'desktop' | 'mobile';
  depth?: number;
}): Promise<SerpSearchResult> {
  const {
    keyword,
    locationCode,
    languageCode = 'en',
    device = 'desktop',
    depth = DEFAULT_DEPTH,
  } = params;

  const requestBody = [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device,
      depth,
      calculate_rectangles: true, // Enable SERP feature detection
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
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        items: [],
        error: `Task failed: ${task.status_message}`,
      };
    }

    // Extract organic items (filter out non-organic results)
    const rawItems = task.result?.[0]?.items || [];
    const organicItems = rawItems.filter((item: any) => item.type === 'organic');

    const items: SerpItem[] = organicItems.map((item: any) => ({
      position: item.rank_absolute || 0,
      url: item.url || '',
      domain: extractDomain(item.url || ''),
      title: item.title || '',
      description: item.description || '',
      breadcrumb: item.breadcrumb || '',
      serpFeatures: parseSerpFeatures(item),
      raw: {
        highlightedWords: item.highlighted || [],
        relatedSearches: item.related_searches || [],
      },
    }));

    console.log(`🔍 [DataForSEO SERP] Found ${items.length} organic results (cost: $${task.cost})`);

    return {
      success: true,
      cost: task.cost || 0,
      items,
    };
  } catch (error) {
    console.error('❌ [DataForSEO SERP] searchGoogleSerp failed:', error);
    return {
      success: false,
      cost: 0,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 2. Check rank for a specific domain
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

  const searchResult = await searchGoogleSerp(searchParams);

  if (!searchResult.success) {
    return {
      position: null,
      url: null,
      title: null,
      found: false,
      topCompetitors: [],
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
      console.error('❌ [DataForSEO SERP] Keyword volume task failed');
      return [];
    }

    const items = task.result?.[0]?.items || [];

    const results: KeywordVolumeResult[] = items.map((item: any) => ({
      keyword: item.keyword || '',
      searchVolume: item.search_volume || 0,
      cpc: item.cpc || null,
      competition: item.competition || null,
      competitionLevel: mapCompetitionLevel(item.competition_index),
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

    const results: KeywordSuggestion[] = items.map((item: any) => ({
      keyword: item.keyword || '',
      searchVolume: item.keyword_info?.search_volume || 0,
      cpc: item.keyword_info?.cpc || null,
      competition: item.keyword_info?.competition || null,
      competitionLevel: mapCompetitionLevel(item.keyword_info?.competition_index),
    }));

    console.log(`🔍 [DataForSEO SERP] Retrieved ${results.length} suggestions (cost: $${task.cost})`);

    return results;
  } catch (error) {
    console.error('❌ [DataForSEO SERP] getKeywordSuggestions failed:', error);
    return [];
  }
}

/**
 * 5. Get available locations for SERP searches
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
  getAvailableLocations,
  testConnection,
};

export default dataForSEOSerpClient;
