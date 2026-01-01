'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { STORAGE_KEY_OVERVIEW_DATA } from '../utils/localStorage';

// Cache version: increment to invalidate old cached data when adding new fields
const OVERVIEW_CACHE_VERSION = 3; // v3 adds postsData

interface OverviewDataResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface UseOverviewDataOptions {
  selectedAccountId: string | null;
  accountId: string | undefined;
  accountIdRef: React.MutableRefObject<string | undefined>;
}

interface UseOverviewDataReturn {
  overviewData: any;
  setOverviewData: (data: any) => void;
  overviewLoading: boolean;
  overviewError: string | null;
  isExportingPDF: boolean;
  setIsExportingPDF: (loading: boolean) => void;
  fetchOverviewData: (locationId: string) => Promise<void>;
  initialFetchDone: React.MutableRefObject<boolean>;
  OVERVIEW_CACHE_VERSION: number;
}

/**
 * Hook to manage overview/analytics data
 *
 * Handles:
 * - Overview data state with localStorage caching
 * - Cache versioning for data invalidation
 * - Fetch function for overview API
 * - PDF export loading state
 */
export function useOverviewData({
  selectedAccountId,
  accountId,
  accountIdRef,
}: UseOverviewDataOptions): UseOverviewDataReturn {
  // Initialize from localStorage with cache validation
  const [overviewData, setOverviewData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_OVERVIEW_DATA);
      try {
        const parsed = stored ? JSON.parse(stored) : null;
        // Invalidate cache if version is outdated or missing
        if (parsed && parsed._cacheVersion !== OVERVIEW_CACHE_VERSION) {
          localStorage.removeItem(STORAGE_KEY_OVERVIEW_DATA);
          return null;
        }
        // Also invalidate if postsData is missing
        if (parsed && !('postsData' in parsed)) {
          localStorage.removeItem(STORAGE_KEY_OVERVIEW_DATA);
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Track if initial fetch has been done
  const initialFetchDone = useRef(false);

  // Persist to localStorage when data changes
  useEffect(() => {
    if (overviewData) {
      // Add cache version when saving
      localStorage.setItem(STORAGE_KEY_OVERVIEW_DATA, JSON.stringify({
        ...overviewData,
        _cacheVersion: OVERVIEW_CACHE_VERSION
      }));
    }
  }, [overviewData]);

  // Fetch overview data from API
  const fetchOverviewData = useCallback(async (locationId: string) => {
    if (!locationId) return;

    // Get account ID directly to avoid stale ref issues
    const activeAccountId = selectedAccountId || accountId || accountIdRef.current;

    if (!activeAccountId) return;

    setOverviewLoading(true);
    setOverviewError(null);

    try {
      const data = await apiClient.get<OverviewDataResult>(
        `/google-business-profile/overview?locationId=${encodeURIComponent(locationId)}`
      );

      if (data.success) {
        // Include locationId in the stored data for cache validation
        console.log('📊 Overview Data Received:', {
          totalReviews: data.data?.reviewTrends?.totalReviews,
          monthlyDataLength: data.data?.reviewTrends?.monthlyReviewData?.length,
          monthlyData: data.data?.reviewTrends?.monthlyReviewData
        });
        setOverviewData({ ...data.data, locationId });
      } else {
        setOverviewError(data.error || 'Failed to fetch overview data');
      }
    } catch (error) {
      setOverviewError('Failed to fetch overview data');
    } finally {
      setOverviewLoading(false);
    }
  }, [selectedAccountId, accountId, accountIdRef]);

  return {
    overviewData,
    setOverviewData,
    overviewLoading,
    overviewError,
    isExportingPDF,
    setIsExportingPDF,
    fetchOverviewData,
    initialFetchDone,
    OVERVIEW_CACHE_VERSION,
  };
}
