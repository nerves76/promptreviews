/**
 * useKeywordDiscovery Hook
 *
 * Provides keyword research capabilities using DataForSEO.
 * Handles rate limiting and provides suggestions for keyword expansion.
 */

'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';

// ============================================
// Types
// ============================================

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | null;
}

export interface DiscoveryResult {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  monthlyTrend: { month: number; volume: number }[];
  suggestions: KeywordSuggestion[];
}

export interface UseKeywordDiscoveryReturn {
  /** Discover keyword data and suggestions */
  discover: (
    keyword: string,
    locationCode?: number
  ) => Promise<DiscoveryResult | null>;
  /** Get quick suggestions without full discovery */
  getSuggestions: (seed: string) => Promise<KeywordSuggestion[]>;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether user is rate limited */
  isRateLimited: boolean;
  /** Remaining lookups in current period */
  remainingLookups: number | null;
}

// ============================================
// Hook
// ============================================

export function useKeywordDiscovery(): UseKeywordDiscoveryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingLookups, setRemainingLookups] = useState<number | null>(null);

  const discover = useCallback(
    async (
      keyword: string,
      locationCode?: number
    ): Promise<DiscoveryResult | null> => {
      if (!keyword || keyword.trim().length === 0) {
        return null;
      }

      setIsLoading(true);
      setError(null);
      setIsRateLimited(false);

      try {
        const params = new URLSearchParams({
          keyword: keyword.trim(),
        });

        if (locationCode) {
          params.append('locationCode', locationCode.toString());
        }

        const response = await apiClient.get<{
          result: DiscoveryResult;
          remainingLookups?: number;
          error?: string;
        }>(`/rank-tracking/keywords/discover?${params.toString()}`);

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.remainingLookups !== undefined) {
          setRemainingLookups(response.remainingLookups);
        }

        return response.result;
      } catch (err: any) {
        const message =
          err instanceof Error ? err.message : 'Failed to discover keyword';

        // Check for rate limit error
        if (message.includes('rate limit') || err.status === 429) {
          setIsRateLimited(true);
          setError('Rate limit reached. Please try again later.');
        } else {
          setError(message);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getSuggestions = useCallback(
    async (seed: string): Promise<KeywordSuggestion[]> => {
      if (!seed || seed.trim().length === 0) {
        return [];
      }

      setIsLoading(true);
      setError(null);
      setIsRateLimited(false);

      try {
        const response = await apiClient.get<{
          suggestions: KeywordSuggestion[];
          remainingLookups?: number;
          error?: string;
        }>(
          `/rank-tracking/keywords/suggestions?seed=${encodeURIComponent(seed.trim())}`
        );

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.remainingLookups !== undefined) {
          setRemainingLookups(response.remainingLookups);
        }

        return response.suggestions || [];
      } catch (err: any) {
        const message =
          err instanceof Error ? err.message : 'Failed to get suggestions';

        // Check for rate limit error
        if (message.includes('rate limit') || err.status === 429) {
          setIsRateLimited(true);
          setError('Rate limit reached. Please try again later.');
        } else {
          setError(message);
        }

        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    discover,
    getSuggestions,
    isLoading,
    error,
    isRateLimited,
    remainingLookups,
  };
}

export default useKeywordDiscovery;
