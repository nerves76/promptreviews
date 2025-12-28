'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import type { CheckPoint, PositionBucket } from '@/features/geo-grid/utils/types';

/**
 * Config data from geo grid status
 */
export interface GeoGridConfigData {
  id: string;
  locationName: string | null;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  checkPoints: CheckPoint[];
  lastCheckedAt: string | null;
}

/**
 * Result data for a single grid check point
 */
export interface GeoGridCheckResult {
  checkPoint: CheckPoint;
  position: number | null;
  positionBucket: PositionBucket;
  businessFound: boolean;
  checkedAt: string;
}

/**
 * Summary stats across all grid points
 */
export interface GeoGridSummary {
  averagePosition: number | null;
  bestPosition: number | null;
  pointsInTop3: number;
  pointsInTop10: number;
  pointsInTop20: number;
  pointsNotFound: number;
  totalPoints: number;
}

/**
 * Full geo grid status response from the API
 */
export interface GeoGridStatusResponse {
  isTracked: boolean;
  keyword: {
    id: string;
    phrase: string;
  };
  config: GeoGridConfigData | null;
  latestResults: GeoGridCheckResult[];
  summary: GeoGridSummary | null;
}

/**
 * Options for the useGeoGridStatus hook
 */
export interface UseGeoGridStatusOptions {
  /** The keyword ID to fetch geo grid status for */
  keywordId: string | null;
  /** Whether the keyword is used in geo grid tracking (skip fetch if false) */
  isUsedInGeoGrid?: boolean;
  /** Whether the parent component is open/visible (triggers auto-fetch) */
  isOpen?: boolean;
}

/**
 * Return type for the useGeoGridStatus hook
 */
export interface UseGeoGridStatusReturn {
  /** The geo grid status data */
  geoGridStatus: GeoGridStatusResponse | null;
  /** Whether geo grid status is being loaded */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh geo grid status from the server */
  refresh: () => Promise<void>;
  /** Clear geo grid status data */
  clear: () => void;
}

/**
 * Hook for fetching keyword geo grid status
 *
 * Automatically fetches geo grid status when:
 * - isOpen is true
 * - isUsedInGeoGrid is true
 * - keywordId is provided
 *
 * @example
 * ```tsx
 * const { geoGridStatus, isLoading, refresh } = useGeoGridStatus({
 *   keywordId: keyword?.id,
 *   isUsedInGeoGrid: keyword?.isUsedInGeoGrid,
 *   isOpen: true,
 * });
 *
 * // Access grid results
 * geoGridStatus?.latestResults.forEach(result => {
 *   console.log(result.checkPoint, result.position);
 * });
 * ```
 */
export function useGeoGridStatus({
  keywordId,
  isUsedInGeoGrid = false,
  isOpen = true,
}: UseGeoGridStatusOptions): UseGeoGridStatusReturn {
  const [geoGridStatus, setGeoGridStatus] = useState<GeoGridStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch geo grid status
  const fetchGeoGridStatus = useCallback(async () => {
    if (!keywordId) {
      setGeoGridStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<GeoGridStatusResponse>(
        `/keywords/${keywordId}/geo-grid-status`
      );
      setGeoGridStatus(response);
    } catch (err) {
      console.error('Failed to fetch geo grid status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch geo grid status');
      setGeoGridStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [keywordId]);

  // Auto-fetch when conditions are met
  useEffect(() => {
    if (keywordId && isUsedInGeoGrid && isOpen) {
      fetchGeoGridStatus();
    } else if (!isUsedInGeoGrid || !isOpen) {
      setGeoGridStatus(null);
    }
  }, [keywordId, isUsedInGeoGrid, isOpen, fetchGeoGridStatus]);

  // Refetch data when page becomes visible (user navigates back)
  // This ensures data is fresh after running checks on other pages
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && keywordId && isUsedInGeoGrid && isOpen) {
        fetchGeoGridStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [keywordId, isUsedInGeoGrid, isOpen, fetchGeoGridStatus]);

  // Clear geo grid status
  const clear = useCallback(() => {
    setGeoGridStatus(null);
    setError(null);
  }, []);

  return {
    geoGridStatus,
    isLoading,
    error,
    refresh: fetchGeoGridStatus,
    clear,
  };
}

/**
 * Get the average position from geo grid status
 */
export function getAverageGeoGridPosition(status: GeoGridStatusResponse | null): number | null {
  return status?.summary?.averagePosition ?? null;
}

/**
 * Get the best (lowest) position from geo grid status
 */
export function getBestGeoGridPosition(status: GeoGridStatusResponse | null): number | null {
  return status?.summary?.bestPosition ?? null;
}

/**
 * Get position color class based on bucket
 */
export function getPositionColorClass(bucket: PositionBucket): string {
  switch (bucket) {
    case 'top3':
      return 'text-green-600';
    case 'top10':
      return 'text-blue-600';
    case 'top20':
      return 'text-amber-600';
    case 'none':
    default:
      return 'text-gray-400';
  }
}

/**
 * Get position background color class based on bucket
 */
export function getPositionBgClass(bucket: PositionBucket): string {
  switch (bucket) {
    case 'top3':
      return 'bg-green-100';
    case 'top10':
      return 'bg-blue-100';
    case 'top20':
      return 'bg-amber-100';
    case 'none':
    default:
      return 'bg-gray-100';
  }
}
