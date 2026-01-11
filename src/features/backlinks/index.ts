/**
 * Backlinks Feature
 *
 * Track domain backlink profiles, referring domains, anchor text distribution,
 * and new/lost backlinks using the DataForSEO Backlinks API.
 */

// Export types first (canonical source)
export * from './utils/types';

// Export API functions
export {
  getBacklinksSummary,
  getReferringDomains,
  getNewLostBacklinks,
  getAnchors,
  getBacklinksHistory,
  testConnection,
  type BacklinksSummaryResult,
  type BacklinksSummaryData,
  type ReferringDomainsResult,
  type NewLostBacklinksResult,
  type AnchorsResult,
  type BacklinksHistoryResult,
  type AnchorItem,
  type BacklinkHistoryItem,
} from './api';

// Export hooks
export {
  useBacklinkHistory,
  useBacklinkDomains,
  useBacklinkAnchors,
  useReferringDomains,
  useNewLostBacklinks,
} from './hooks';

// Export services
export * from './services';
