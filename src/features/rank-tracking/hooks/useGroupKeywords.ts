/**
 * useGroupKeywords Hook
 *
 * Manages keywords within a specific rank tracking group.
 * Handles fetching, adding, and removing keywords from a group.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { RankGroupKeyword } from '../utils/types';

// ============================================
// Types
// ============================================

export interface UseGroupKeywordsOptions {
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface UseGroupKeywordsReturn {
  /** Keywords in the group */
  keywords: RankGroupKeyword[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh keywords from server */
  refresh: () => Promise<void>;
  /** Add keywords to the group */
  addKeywords: (
    keywordIds: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  /** Remove keywords from the group */
  removeKeywords: (
    keywordIds: string[]
  ) => Promise<{ success: boolean; error?: string }>;
}

// ============================================
// Hook
// ============================================

export function useGroupKeywords(
  groupId: string | null,
  options: UseGroupKeywordsOptions = {}
): UseGroupKeywordsReturn {
  const { autoFetch = true } = options;

  const [keywords, setKeywords] = useState<RankGroupKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    if (!groupId) {
      setKeywords([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ keywords: RankGroupKeyword[] }>(
        `/rank-tracking/groups/${groupId}/keywords`
      );

      setKeywords(response.keywords || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch keywords';
      setError(message);
      setKeywords([]);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const addKeywords = useCallback(
    async (
      keywordIds: string[]
    ): Promise<{ success: boolean; error?: string }> => {
      if (!groupId) {
        return { success: false, error: 'No group selected' };
      }

      setError(null);

      try {
        const response = await apiClient.post<{
          keywords: RankGroupKeyword[];
          error?: string;
        }>(`/rank-tracking/groups/${groupId}/keywords`, {
          keywordIds,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // Add new keywords to the list
        setKeywords((prev) => [...prev, ...response.keywords]);

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to add keywords';
        setError(message);
        return { success: false, error: message };
      }
    },
    [groupId]
  );

  const removeKeywords = useCallback(
    async (
      keywordIds: string[]
    ): Promise<{ success: boolean; error?: string }> => {
      if (!groupId) {
        return { success: false, error: 'No group selected' };
      }

      setError(null);

      try {
        await apiClient.delete(
          `/rank-tracking/groups/${groupId}/keywords?keywordIds=${keywordIds.join(',')}`
        );

        // Remove keywords from the list
        setKeywords((prev) =>
          prev.filter((kw) => !keywordIds.includes(kw.keywordId))
        );

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to remove keywords';
        setError(message);
        return { success: false, error: message };
      }
    },
    [groupId]
  );

  // Auto-fetch when groupId changes
  useEffect(() => {
    if (autoFetch) {
      fetchKeywords();
    }
  }, [autoFetch, fetchKeywords]);

  return {
    keywords,
    isLoading,
    error,
    refresh: fetchKeywords,
    addKeywords,
    removeKeywords,
  };
}

export default useGroupKeywords;
