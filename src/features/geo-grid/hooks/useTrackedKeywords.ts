/**
 * useTrackedKeywords Hook
 *
 * Manages tracked keywords for geo grid rank checking.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import { GGTrackedKeyword } from '../utils/types';

// ============================================
// Types
// ============================================

export interface UseTrackedKeywordsOptions {
  /** Config ID to fetch keywords for (optional, defaults to first config) */
  configId?: string | null;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface UseTrackedKeywordsReturn {
  /** List of tracked keywords */
  keywords: GGTrackedKeyword[];
  /** Enabled keywords only */
  enabledKeywords: GGTrackedKeyword[];
  /** Total count */
  count: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh keywords from server */
  refresh: () => Promise<void>;
  /** Add keywords to track */
  addKeywords: (keywordIds: string[]) => Promise<AddKeywordsResult>;
  /** Remove a tracked keyword */
  removeKeyword: (trackedKeywordId: string) => Promise<{ success: boolean; error?: string }>;
  /** Toggle keyword enabled state */
  toggleKeyword: (trackedKeywordId: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
}

export interface AddKeywordsResult {
  success: boolean;
  added: number;
  skipped: number;
  error?: string;
}

// ============================================
// Hook
// ============================================

export function useTrackedKeywords(
  options: UseTrackedKeywordsOptions = {}
): UseTrackedKeywordsReturn {
  const { configId, autoFetch = true } = options;

  // Track selected account to refetch when it changes
  const { selectedAccountId } = useAccountData();

  const [keywords, setKeywords] = useState<GGTrackedKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (configId) params.set('configId', configId);
      const queryString = params.toString();
      const url = queryString ? `/geo-grid/tracked-keywords?${queryString}` : '/geo-grid/tracked-keywords';

      const response = await apiClient.get<{
        trackedKeywords: GGTrackedKeyword[];
        count: number;
      }>(url);

      setKeywords(response.trackedKeywords || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tracked keywords';
      setError(message);
      setKeywords([]);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  const addKeywords = useCallback(
    async (keywordIds: string[]): Promise<AddKeywordsResult> => {
      try {
        const response = await apiClient.post<{
          success: boolean;
          added: number;
          skipped: number;
          trackedKeywords: GGTrackedKeyword[];
        }>('/geo-grid/tracked-keywords', { configId, keywordIds });

        if (response.success) {
          // Refresh to get updated list
          await fetchKeywords();
        }

        return {
          success: response.success,
          added: response.added,
          skipped: response.skipped,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add keywords';
        return { success: false, added: 0, skipped: 0, error: message };
      }
    },
    [configId, fetchKeywords]
  );

  const removeKeyword = useCallback(
    async (trackedKeywordId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await apiClient.delete(`/geo-grid/tracked-keywords?id=${trackedKeywordId}`);

        // Remove from local state
        setKeywords((prev) => prev.filter((k) => k.id !== trackedKeywordId));

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove keyword';
        return { success: false, error: message };
      }
    },
    []
  );

  const toggleKeyword = useCallback(
    async (
      trackedKeywordId: string,
      enabled: boolean
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Note: This would need an endpoint addition for PATCH
        // For now, we'll update local state optimistically
        setKeywords((prev) =>
          prev.map((k) =>
            k.id === trackedKeywordId ? { ...k, isEnabled: enabled } : k
          )
        );

        // TODO: Add PATCH endpoint for updating isEnabled
        // await apiClient.patch(`/geo-grid/tracked-keywords/${trackedKeywordId}`, { isEnabled: enabled });

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle keyword';
        // Revert on error
        await fetchKeywords();
        return { success: false, error: message };
      }
    },
    [fetchKeywords]
  );

  // Clear data and refetch when account changes
  useEffect(() => {
    // Clear stale data immediately when account changes
    setKeywords([]);
    setError(null);

    if (autoFetch && selectedAccountId) {
      fetchKeywords();
    }
  }, [selectedAccountId]); // Only depend on selectedAccountId to avoid infinite loops

  // Also fetch on mount and when configId changes
  useEffect(() => {
    if (autoFetch && selectedAccountId) {
      fetchKeywords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, configId, fetchKeywords]);

  // Computed values
  const enabledKeywords = keywords.filter((k) => k.isEnabled);

  return {
    keywords,
    enabledKeywords,
    count: keywords.length,
    isLoading,
    error,
    refresh: fetchKeywords,
    addKeywords,
    removeKeyword,
    toggleKeyword,
  };
}

export default useTrackedKeywords;
