/**
 * Geo Grid Rank Tracker - Type Definitions
 *
 * Types for the geo grid rank tracking feature that monitors
 * Google Maps/Local Pack visibility across geographic points.
 */

// ============================================
// Position Buckets
// ============================================

export type PositionBucket = 'top3' | 'top10' | 'top20' | 'none';

export const POSITION_BUCKETS: PositionBucket[] = ['top3', 'top10', 'top20', 'none'];

/**
 * Convert a numeric position to a bucket
 */
export function positionToBucket(position: number | null): PositionBucket {
  if (position === null || position <= 0) return 'none';
  if (position <= 3) return 'top3';
  if (position <= 10) return 'top10';
  if (position <= 20) return 'top20';
  return 'none';
}

// ============================================
// Check Points
// ============================================

export type CheckPoint = 'center' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const DEFAULT_CHECK_POINTS: CheckPoint[] = ['center', 'n', 's', 'e', 'w'];

export interface GeoPoint {
  lat: number;
  lng: number;
  label: CheckPoint;
}

// ============================================
// Configuration
// ============================================

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | null;

// Joined Google Business Location data (from API)
export interface GGConfigGoogleBusinessLocation {
  id: string;
  location_name: string;
  address?: string | null;
}

export interface GGConfig {
  id: string;
  accountId: string;
  googleBusinessLocationId: string | null;
  locationName: string | null; // Denormalized for display
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  checkPoints: CheckPoint[];
  targetPlaceId: string | null;
  isEnabled: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Scheduling fields
  scheduleFrequency: ScheduleFrequency;
  scheduleDayOfWeek: number | null; // 0=Sunday, 6=Saturday
  scheduleDayOfMonth: number | null; // 1-28
  scheduleHour: number; // 0-23, default 9
  nextScheduledAt: string | null;
  lastScheduledRunAt: string | null;
  // Joined data from API (optional)
  googleBusinessLocation?: GGConfigGoogleBusinessLocation | null;
}

export interface GGConfigCreateInput {
  googleBusinessLocationId?: string;
  locationName?: string; // Display name for the location
  centerLat: number;
  centerLng: number;
  radiusMiles?: number;
  checkPoints?: CheckPoint[];
  targetPlaceId?: string;
}

export interface GGConfigUpdateInput {
  centerLat?: number;
  centerLng?: number;
  radiusMiles?: number;
  checkPoints?: CheckPoint[];
  targetPlaceId?: string;
  isEnabled?: boolean;
  locationName?: string;
}

// ============================================
// Tracked Keywords
// ============================================

export interface GGTrackedKeyword {
  id: string;
  configId: string;
  keywordId: string;
  accountId: string;
  isEnabled: boolean;
  createdAt: string;
  // Joined from keywords table
  phrase?: string;
  normalizedPhrase?: string;
  reviewUsageCount?: number;
}

// ============================================
// Check Results
// ============================================

export interface GGCompetitor {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  position: number;
  placeId: string | null;
  address: string | null;
  category: string | null;
}

export interface GGCheckResult {
  id: string;
  accountId: string;
  configId: string;
  keywordId: string;
  checkPoint: CheckPoint;
  pointLat: number;
  pointLng: number;
  position: number | null;
  positionBucket: PositionBucket;
  businessFound: boolean;
  topCompetitors: GGCompetitor[];
  ourRating: number | null;
  ourReviewCount: number | null;
  ourPlaceId: string | null;
  checkedAt: string;
  apiCostUsd: number | null;
  createdAt: string;
  // Joined data
  keywordPhrase?: string;
}

// ============================================
// Daily Summary
// ============================================

export interface GGPointSummary {
  top3: number;
  top10: number;
  top20: number;
  none: number;
}

export interface GGDailySummary {
  id: string;
  accountId: string;
  configId: string;
  checkDate: string;
  totalKeywordsChecked: number;
  keywordsInTop3: number;
  keywordsInTop10: number;
  keywordsInTop20: number;
  keywordsNotFound: number;
  pointSummaries: Record<CheckPoint, GGPointSummary>;
  totalApiCostUsd: number | null;
  createdAt: string;
}

// ============================================
// DataForSEO API Types
// ============================================

export interface DataForSEOCredentials {
  login: string;
  password: string;
}

export interface DataForSEOTask {
  languageCode: string;
  locationCoordinate: string; // "lat,lng,zoom"
  keyword: string;
}

export interface DataForSEOMapsItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  title: string;
  rating?: {
    value: number;
    votes_count: number;
  };
  place_id?: string;
  address?: string;
  phone?: string;
  domain?: string;
  category?: string;
}

export interface DataForSEOTaskResult {
  items: DataForSEOMapsItem[];
  cost: number;
}

export interface DataForSEOResponse {
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    cost: number;
    result: DataForSEOTaskResult[] | null;
  }>;
}

// ============================================
// API Request/Response Types
// ============================================

export interface TriggerCheckRequest {
  keywordIds?: string[]; // If not provided, check all tracked keywords
}

export interface TriggerCheckResponse {
  success: boolean;
  checksPerformed: number;
  totalCost: number;
  results: GGCheckResult[];
  errors?: string[];
}

export interface GetResultsParams {
  keywordId?: string;
  checkPoint?: CheckPoint;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface GetSummaryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}
