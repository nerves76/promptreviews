/**
 * useGeoGridResults Hook
 *
 * Fetches and manages geo grid rank check results.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { GGCheckResult, CheckPoint } from '../utils/types';

// ============================================
// Types
// ============================================

export interface UseGeoGridResultsOptions {
  /** Config ID to fetch results for (optional, defaults to first config) */
  configId?: string | null;
  /** Fetch mode: 'current' for latest batch, 'history' for multiple results */
  mode?: 'current' | 'history';
  /** Filter by keyword ID */
  keywordId?: string;
  /** Filter by check point */
  checkPoint?: CheckPoint;
  /** Filter results after this date (YYYY-MM-DD) */
  startDate?: string;
  /** Filter results before this date (YYYY-MM-DD) */
  endDate?: string;
  /** Max results to return (default 100) */
  limit?: number;
  /** Include summary stats (default true for mode=current) */
  includeSummary?: boolean;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface CurrentSummary {
  totalChecked: number;
  inTop3: number;
  inTop10: number;
  inTop20: number;
  notFound: number;
  pointSummaries: Record<CheckPoint, PointSummary>;
  totalCost: number;
  lastCheckedAt: string | null;
}

export interface PointSummary {
  point: CheckPoint;
  totalChecked: number;
  inTop3: number;
  inTop10: number;
  inTop20: number;
  notFound: number;
  avgPosition: number | null;
}

export interface UseGeoGridResultsReturn {
  /** Check results */
  results: GGCheckResult[];
  /** Current summary (only in 'current' mode) */
  summary: CurrentSummary | null;
  /** Last check timestamp */
  lastCheckedAt: string | null;
  /** Total result count */
  count: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh results from server */
  refresh: () => Promise<void>;
  /** Trigger a new rank check */
  runCheck: (keywordIds?: string[]) => Promise<RunCheckResult>;
}

export interface RunCheckResult {
  success: boolean;
  checksPerformed?: number;
  totalCost?: number;
  error?: string;
}

// ============================================
// Hook
// ============================================

export function useGeoGridResults(
  options: UseGeoGridResultsOptions = {}
): UseGeoGridResultsReturn {
  const {
    configId,
    mode = 'current',
    keywordId,
    checkPoint,
    startDate,
    endDate,
    limit = 100,
    includeSummary = true,
    autoFetch = true,
  } = options;

  const [results, setResults] = useState<GGCheckResult[]>([]);
  const [summary, setSummary] = useState<CurrentSummary | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (configId) params.set('configId', configId);
      params.set('mode', mode);
      if (keywordId) params.set('keywordId', keywordId);
      if (checkPoint) params.set('checkPoint', checkPoint);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('limit', limit.toString());
      params.set('includeSummary', includeSummary.toString());

      const response = await apiClient.get<{
        results: GGCheckResult[];
        summary?: CurrentSummary;
        lastCheckedAt?: string;
        count?: number;
        message?: string;
      }>(`/geo-grid/results?${params.toString()}`);

      setResults(response.results || []);
      setSummary(response.summary || null);
      setLastCheckedAt(response.lastCheckedAt || null);
      setCount(response.count || response.results?.length || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch results';
      setError(message);
      setResults([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [configId, mode, keywordId, checkPoint, startDate, endDate, limit, includeSummary]);

  const runCheck = useCallback(
    async (keywordIds?: string[]): Promise<RunCheckResult> => {
      try {
        const response = await apiClient.post<{
          success: boolean;
          checksPerformed: number;
          totalCost: number;
          errors?: string[];
        }>('/geo-grid/check', { configId, keywordIds });

        if (response.success) {
          // Refresh results after successful check
          await fetchResults();
        }

        return {
          success: response.success,
          checksPerformed: response.checksPerformed,
          totalCost: response.totalCost,
          error: response.errors?.join(', '),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to run check';
        return { success: false, error: message };
      }
    },
    [configId, fetchResults]
  );

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchResults();
    }
  }, [autoFetch, fetchResults]);

  return {
    results,
    summary,
    lastCheckedAt,
    count,
    isLoading,
    error,
    refresh: fetchResults,
    runCheck,
  };
}

export default useGeoGridResults;
