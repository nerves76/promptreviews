/**
 * useRankHistory Hook
 *
 * Fetches rank check history for a group or specific keyword.
 * Provides function to trigger new rank checks.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { RankCheck } from '../utils/types';

// ============================================
// Types
// ============================================

export interface UseRankHistoryOptions {
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
  /** Filter by specific keyword ID */
  keywordId?: string;
}

export interface UseRankHistoryReturn {
  /** Rank check results */
  results: RankCheck[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh history from server */
  refresh: () => Promise<void>;
  /** Run a new rank check for the group */
  runCheck: () => Promise<{
    success: boolean;
    results?: RankCheck[];
    error?: string;
    balance?: any;
  }>;
  /** Whether a check is currently running */
  isRunning: boolean;
}

// ============================================
// Hook
// ============================================

export function useRankHistory(
  groupId: string | null,
  options: UseRankHistoryOptions = {}
): UseRankHistoryReturn {
  const { autoFetch = true, keywordId } = options;

  const [results, setResults] = useState<RankCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!groupId) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let url = `/rank-tracking/groups/${groupId}/history`;
      if (keywordId) {
        url += `?keywordId=${keywordId}`;
      }

      const response = await apiClient.get<{ results: RankCheck[] }>(url);

      setResults(response.results || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch rank history';
      setError(message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, keywordId]);

  const runCheck = useCallback(async (): Promise<{
    success: boolean;
    results?: RankCheck[];
    error?: string;
    balance?: any;
  }> => {
    if (!groupId) {
      return { success: false, error: 'No group selected' };
    }

    setIsRunning(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        results: RankCheck[];
        balance?: any;
        error?: string;
      }>(`/rank-tracking/groups/${groupId}/check`, {
        keywordIds: keywordId ? [keywordId] : undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Add new results to the beginning of the list
      if (response.results) {
        setResults((prev) => [...response.results, ...prev]);
      }

      return {
        success: true,
        results: response.results,
        balance: response.balance,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to run rank check';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsRunning(false);
    }
  }, [groupId, keywordId]);

  // Auto-fetch when groupId or keywordId changes
  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [autoFetch, fetchHistory]);

  return {
    results,
    isLoading,
    error,
    refresh: fetchHistory,
    runCheck,
    isRunning,
  };
}

export default useRankHistory;
