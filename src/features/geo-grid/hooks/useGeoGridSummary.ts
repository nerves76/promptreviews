/**
 * useGeoGridSummary Hook
 *
 * Fetches daily summaries for trend analysis and historical data.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { GGDailySummary } from '../utils/types';

// ============================================
// Types
// ============================================

export interface UseGeoGridSummaryOptions {
  /** Fetch mode: 'latest' for most recent, 'history' for multiple days */
  mode?: 'latest' | 'history';
  /** Filter summaries after this date (YYYY-MM-DD) */
  startDate?: string;
  /** Filter summaries before this date (YYYY-MM-DD) */
  endDate?: string;
  /** Max summaries to return (default 30) */
  limit?: number;
  /** Include trend calculation (default true for mode=latest) */
  includeTrend?: boolean;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface TrendData {
  top3Change: number;
  top10Change: number;
  top20Change: number;
  direction: 'improving' | 'declining' | 'stable';
}

export interface SummaryWithTrend extends GGDailySummary {
  trend: TrendData | null;
}

export interface UseGeoGridSummaryReturn {
  /** Latest summary (only in 'latest' mode) */
  summary: GGDailySummary | null;
  /** Historical summaries with trends (only in 'history' mode) */
  summaries: SummaryWithTrend[];
  /** Trend compared to previous day (only in 'latest' mode) */
  trend: TrendData | null;
  /** Total summary count */
  count: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh summaries from server */
  refresh: () => Promise<void>;
}

// ============================================
// Hook
// ============================================

export function useGeoGridSummary(
  options: UseGeoGridSummaryOptions = {}
): UseGeoGridSummaryReturn {
  const {
    mode = 'latest',
    startDate,
    endDate,
    limit = 30,
    includeTrend = true,
    autoFetch = true,
  } = options;

  const [summary, setSummary] = useState<GGDailySummary | null>(null);
  const [summaries, setSummaries] = useState<SummaryWithTrend[]>([]);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.set('mode', mode);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('limit', limit.toString());
      params.set('includeTrend', includeTrend.toString());

      const response = await apiClient.get<{
        summary?: GGDailySummary;
        summaries?: SummaryWithTrend[];
        trend?: TrendData;
        count?: number;
        message?: string;
      }>(`/geo-grid/summary?${params.toString()}`);

      if (mode === 'latest') {
        setSummary(response.summary || null);
        setTrend(response.trend || null);
        setSummaries([]);
        setCount(response.summary ? 1 : 0);
      } else {
        setSummaries(response.summaries || []);
        setSummary(null);
        setTrend(null);
        setCount(response.count || response.summaries?.length || 0);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch summaries';
      setError(message);
      setSummary(null);
      setSummaries([]);
      setTrend(null);
    } finally {
      setIsLoading(false);
    }
  }, [mode, startDate, endDate, limit, includeTrend]);

  // Auto-fetch on mount and when options change
  useEffect(() => {
    if (autoFetch) {
      fetchSummaries();
    }
  }, [autoFetch, fetchSummaries]);

  return {
    summary,
    summaries,
    trend,
    count,
    isLoading,
    error,
    refresh: fetchSummaries,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get a human-readable trend description
 */
export function getTrendDescription(trend: TrendData | null): string {
  if (!trend) return 'No trend data';

  const { direction, top10Change } = trend;

  if (direction === 'stable') {
    return 'Visibility is stable';
  }

  const changeText = Math.abs(top10Change) === 1 ? 'keyword' : 'keywords';

  if (direction === 'improving') {
    return `+${top10Change} ${changeText} in top 10`;
  }

  return `${top10Change} ${changeText} in top 10`;
}

/**
 * Get trend color class for UI styling
 */
export function getTrendColor(trend: TrendData | null): string {
  if (!trend) return 'text-gray-500';

  switch (trend.direction) {
    case 'improving':
      return 'text-green-600';
    case 'declining':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get trend icon name
 */
export function getTrendIcon(trend: TrendData | null): 'arrow-up' | 'arrow-down' | 'minus' {
  if (!trend) return 'minus';

  switch (trend.direction) {
    case 'improving':
      return 'arrow-up';
    case 'declining':
      return 'arrow-down';
    default:
      return 'minus';
  }
}

export default useGeoGridSummary;
