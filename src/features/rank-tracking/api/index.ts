/**
 * DataForSEO SERP Client - Main Export
 *
 * Export all functions and types from the SERP client for easy importing.
 */

export {
  // Main functions
  searchGoogleSerp,
  checkRankForDomain,
  getKeywordVolume,
  getKeywordSuggestions,
  getAvailableLocations,
  testConnection,

  // Default export
  dataForSEOSerpClient,

  // Types
  type SerpSearchResult,
  type SerpItem,
  type SerpFeatures,
  type SerpRankResult,
  type SerpCompetitor,
  type KeywordVolumeResult,
  type MonthlySearchData,
  type KeywordSuggestion,
  type DataForSEOLocation,
} from './dataforseo-serp-client';

// Re-export default for convenience
export { default } from './dataforseo-serp-client';
