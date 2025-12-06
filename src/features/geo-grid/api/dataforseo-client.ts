/**
 * DataForSEO API Client
 *
 * Wrapper for DataForSEO's Google Maps SERP API.
 * Used to check local pack rankings at specific geographic coordinates.
 *
 * API Documentation: https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
 */

import {
  DataForSEOCredentials,
  DataForSEOTask,
  DataForSEOResponse,
  DataForSEOMapsItem,
  GGCompetitor,
  PositionBucket,
  positionToBucket,
} from '../utils/types';

// ============================================
// Configuration
// ============================================

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';
const GOOGLE_MAPS_ENDPOINT = '/serp/google/maps/live/advanced';

// Default zoom level for Google Maps searches (17 = neighborhood level)
const DEFAULT_ZOOM = 17;

// Maximum results to request (we only need top 20)
const MAX_RESULTS_DEPTH = 20;

// ============================================
// Credentials
// ============================================

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
// API Client
// ============================================

export interface MapsSearchParams {
  keyword: string;
  lat: number;
  lng: number;
  languageCode?: string;
  zoom?: number;
}

export interface MapsSearchResult {
  success: boolean;
  cost: number;
  items: DataForSEOMapsItem[];
  error?: string;
}

export interface RankCheckResult {
  position: number | null;
  positionBucket: PositionBucket;
  businessFound: boolean;
  ourRating: number | null;
  ourReviewCount: number | null;
  topCompetitors: GGCompetitor[];
  cost: number;
  rawResponse: DataForSEOResponse | null;
}

/**
 * Search Google Maps for a keyword at a specific location
 */
export async function searchGoogleMaps(params: MapsSearchParams): Promise<MapsSearchResult> {
  const { keyword, lat, lng, languageCode = 'en', zoom = DEFAULT_ZOOM } = params;

  const credentials = getCredentials();
  const locationCoordinate = `${lat.toFixed(7)},${lng.toFixed(7)},${zoom}`;

  const requestBody: DataForSEOTask[] = [
    {
      languageCode,
      locationCoordinate,
      keyword,
    },
  ];

  // Map to actual API field names
  const apiRequestBody = requestBody.map((task) => ({
    language_code: task.languageCode,
    location_coordinate: task.locationCoordinate,
    keyword: task.keyword,
    depth: MAX_RESULTS_DEPTH,
  }));

  // Add timeout for API calls (30 seconds)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${DATAFORSEO_API_BASE}${GOOGLE_MAPS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(credentials),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [DataForSEO] API error:', response.status, errorText);
      return {
        success: false,
        cost: 0,
        items: [],
        error: `API returned ${response.status}: ${errorText}`,
      };
    }

    const data: DataForSEOResponse = await response.json();

    // Check task status
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

    // Extract items from result
    const items = task.result?.[0]?.items || [];

    return {
      success: true,
      cost: task.cost || 0,
      items,
    };
  } catch (error) {
    clearTimeout(timeout);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ [DataForSEO] Request timeout (30s)');
      return {
        success: false,
        cost: 0,
        items: [],
        error: 'Request timeout (30 seconds)',
      };
    }

    console.error('❌ [DataForSEO] Request failed:', error);
    return {
      success: false,
      cost: 0,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check rank for a specific business (by Place ID) at a location
 */
export async function checkRankForBusiness(
  params: MapsSearchParams & { targetPlaceId: string }
): Promise<RankCheckResult> {
  const { targetPlaceId, ...searchParams } = params;

  const searchResult = await searchGoogleMaps(searchParams);

  if (!searchResult.success) {
    return {
      position: null,
      positionBucket: 'none',
      businessFound: false,
      ourRating: null,
      ourReviewCount: null,
      topCompetitors: [],
      cost: searchResult.cost,
      rawResponse: null,
    };
  }

  // Find our business in the results
  let position: number | null = null;
  let ourRating: number | null = null;
  let ourReviewCount: number | null = null;
  let businessFound = false;

  // Debug: log all results to help diagnose matching issues
  console.log(`   🔍 [DataForSEO] Searching for Place ID: ${targetPlaceId}`);
  console.log(`   🔍 [DataForSEO] Found ${searchResult.items.length} results:`);
  for (const item of searchResult.items) {
    const isMatch = item.place_id === targetPlaceId;
    console.log(`      ${item.rank_absolute}. ${item.title} (${item.place_id})${isMatch ? ' ← MATCH!' : ''}`);
  }

  for (const item of searchResult.items) {
    // Match by Place ID
    if (item.place_id === targetPlaceId) {
      position = item.rank_absolute;
      ourRating = item.rating?.value ?? null;
      ourReviewCount = item.rating?.votes_count ?? null;
      businessFound = true;
      break;
    }
  }

  // Get top 10 competitors (excluding our business)
  const topCompetitors: GGCompetitor[] = searchResult.items
    .filter((item) => item.place_id !== targetPlaceId)
    .slice(0, 10)
    .map((item) => ({
      name: item.title,
      rating: item.rating?.value ?? null,
      reviewCount: item.rating?.votes_count ?? null,
      position: item.rank_absolute,
      placeId: item.place_id ?? null,
      address: item.address ?? null,
      category: item.category ?? null,
    }));

  return {
    position,
    positionBucket: positionToBucket(position),
    businessFound,
    ourRating,
    ourReviewCount,
    topCompetitors,
    cost: searchResult.cost,
    rawResponse: null, // Don't include raw response to save memory - can be added if needed
  };
}

/**
 * Batch check ranks for multiple keywords at a single location
 * Note: DataForSEO charges per keyword, so this is just a convenience wrapper
 */
export async function batchCheckRanks(
  keywords: string[],
  lat: number,
  lng: number,
  targetPlaceId: string,
  languageCode: string = 'en'
): Promise<Map<string, RankCheckResult>> {
  const results = new Map<string, RankCheckResult>();

  // Process sequentially to avoid rate limits
  // Could be parallelized with Promise.all if needed, but be mindful of rate limits
  for (const keyword of keywords) {
    const result = await checkRankForBusiness({
      keyword,
      lat,
      lng,
      targetPlaceId,
      languageCode,
    });
    results.set(keyword, result);
  }

  return results;
}

/**
 * Test API connection with a simple search
 */
export async function testConnection(): Promise<{ success: boolean; message: string; cost?: number }> {
  try {
    const result = await searchGoogleMaps({
      keyword: 'restaurant',
      lat: 37.7749,
      lng: -122.4194, // San Francisco
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

export const dataForSEOClient = {
  searchGoogleMaps,
  checkRankForBusiness,
  batchCheckRanks,
  testConnection,
};

export default dataForSEOClient;
