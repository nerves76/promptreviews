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

export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';

export interface TrendPercentage {
  monthly: number | null;
  quarterly: number | null;
  yearly: number | null;
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  competitionValue: number | null;
  keywordDifficulty: number | null;
  searchIntent: SearchIntent | null;
  categories: string[];
  trendPercentage: TrendPercentage | null;
}

export interface DiscoveryResult {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  competitionValue: number | null;
  trendPercentage: TrendPercentage | null;
  monthlyTrend: { month: number; year: number; volume: number }[];
  suggestions: KeywordSuggestion[];
}

export interface UseKeywordDiscoveryReturn {
  /** Discover keyword data and suggestions */
  discover: (
    keyword: string,
    locationCode?: number
  ) => Promise<DiscoveryResult | null>;
  /** Get quick suggestions without full discovery */
  getSuggestions: (seed: string, locationCode?: number) => Promise<KeywordSuggestion[]>;
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
        // POST to /rank-tracking/discovery with keyword in body
        const response = await apiClient.post<{
          keyword: string;
          volume: number;
          trend: 'rising' | 'falling' | 'stable' | null;
          trendPercentage: TrendPercentage | null;
          cpc: number | null;
          lowTopOfPageBid: number | null;
          highTopOfPageBid: number | null;
          competition: number | null;
          competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          monthlySearches: { year: number; month: number; searchVolume: number }[];
          rateLimit?: {
            limit: number;
            used: number;
            remaining: number;
            resetsAt: string;
          };
          error?: string;
        }>('/rank-tracking/discovery', {
          keyword: keyword.trim(),
          locationCode: locationCode || 2840,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.rateLimit?.remaining !== undefined) {
          setRemainingLookups(response.rateLimit.remaining);
        }

        return {
          keyword: response.keyword,
          searchVolume: response.volume,
          cpc: response.cpc,
          lowTopOfPageBid: response.lowTopOfPageBid,
          highTopOfPageBid: response.highTopOfPageBid,
          competition: response.competitionLevel,
          competitionValue: response.competition,
          trendPercentage: response.trendPercentage,
          monthlyTrend: (response.monthlySearches || []).map(m => ({
            month: m.month,
            year: m.year,
            volume: m.searchVolume,
          })),
          suggestions: [], // Suggestions come from separate call
        };
      } catch (err: any) {
        const message =
          err instanceof Error ? err.message : 'Failed to discover keyword';

        // Check for rate limit error
        if (message.includes('rate limit') || message.includes('limit reached') || err.status === 429) {
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
    async (seed: string, locationCode?: number): Promise<KeywordSuggestion[]> => {
      if (!seed || seed.trim().length === 0) {
        return [];
      }

      setIsLoading(true);
      setError(null);
      setIsRateLimited(false);

      try {
        const params = new URLSearchParams({
          seed: seed.trim(),
        });
        if (locationCode) {
          params.append('locationCode', locationCode.toString());
        }

        const response = await apiClient.get<{
          suggestions: {
            keyword: string;
            volume: number;
            cpc: number | null;
            lowTopOfPageBid: number | null;
            highTopOfPageBid: number | null;
            competition: number | null;
            competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
            keywordDifficulty: number | null;
            searchIntent: SearchIntent | null;
            categories: string[];
            trendPercentage: TrendPercentage | null;
          }[];
          rateLimit?: {
            limit: number;
            used: number;
            remaining: number;
            resetsAt: string;
          };
          error?: string;
        }>(`/rank-tracking/discovery?${params.toString()}`);

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.rateLimit?.remaining !== undefined) {
          setRemainingLookups(response.rateLimit.remaining);
        }

        return (response.suggestions || []).map(s => ({
          keyword: s.keyword,
          searchVolume: s.volume,
          cpc: s.cpc,
          lowTopOfPageBid: s.lowTopOfPageBid,
          highTopOfPageBid: s.highTopOfPageBid,
          competition: s.competitionLevel,
          competitionValue: s.competition,
          keywordDifficulty: s.keywordDifficulty,
          searchIntent: s.searchIntent,
          categories: s.categories || [],
          trendPercentage: s.trendPercentage,
        }));
      } catch (err: any) {
        const message =
          err instanceof Error ? err.message : 'Failed to get suggestions';

        // Check for rate limit error
        if (message.includes('rate limit') || message.includes('limit reached') || err.status === 429) {
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
