'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';

/**
 * SERP visibility data from rank check
 */
export interface SerpVisibility {
  paa: {
    questionCount: number;
    oursCount: number;
  };
  aiOverview: {
    present: boolean;
    oursCited: boolean;
    citationCount: number;
  };
  featuredSnippet: {
    present: boolean;
    ours: boolean;
  };
}

/**
 * Question discovered from Google PAA
 */
export interface DiscoveredQuestion {
  question: string;
  answerDomain: string | null;
  isOurs: boolean;
}

/**
 * Ranking data for a specific group/device/location combination
 */
export interface RankingData {
  groupId: string;
  groupName: string;
  device: string;
  location: string;
  locationCode: number;
  isEnabled: boolean;
  latestCheck: {
    position: number | null;
    foundUrl: string | null;
    checkedAt: string;
    searchQuery: string;
    positionChange: number | null;
    serpVisibility?: SerpVisibility;
    discoveredQuestions?: DiscoveredQuestion[];
  } | null;
}

/**
 * Full rank status response from the API
 */
export interface RankStatusResponse {
  isTracked: boolean;
  keyword: {
    id: string;
    phrase: string;
    searchQuery: string | null;
  };
  rankings: RankingData[];
}

/**
 * Options for the useRankStatus hook
 */
export interface UseRankStatusOptions {
  /** The keyword ID to fetch rank status for */
  keywordId: string | null;
  /** Whether the keyword is used in rank tracking (skip fetch if false) */
  isUsedInRankTracking?: boolean;
  /** Whether the parent component is open/visible (triggers auto-fetch) */
  isOpen?: boolean;
}

/**
 * Return type for the useRankStatus hook
 */
export interface UseRankStatusReturn {
  /** The rank status data */
  rankStatus: RankStatusResponse | null;
  /** Whether rank status is being loaded */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh rank status from the server */
  refresh: () => Promise<void>;
  /** Clear rank status data */
  clear: () => void;
}

/**
 * Hook for fetching keyword rank status
 *
 * Automatically fetches rank status when:
 * - isOpen is true
 * - isUsedInRankTracking is true
 * - keywordId is provided
 *
 * @example
 * ```tsx
 * const { rankStatus, isLoading, refresh } = useRankStatus({
 *   keywordId: keyword?.id,
 *   isUsedInRankTracking: keyword?.isUsedInRankTracking,
 *   isOpen: true,
 * });
 *
 * // Access rankings
 * rankStatus?.rankings.forEach(ranking => {
 *   console.log(ranking.location, ranking.latestCheck?.position);
 * });
 * ```
 */
export function useRankStatus({
  keywordId,
  isUsedInRankTracking = false,
  isOpen = true,
}: UseRankStatusOptions): UseRankStatusReturn {
  const [rankStatus, setRankStatus] = useState<RankStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch rank status
  const fetchRankStatus = useCallback(async () => {
    if (!keywordId) {
      setRankStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<RankStatusResponse>(
        `/keywords/${keywordId}/rank-status`
      );
      setRankStatus(response);
    } catch (err) {
      console.error('Failed to fetch rank status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rank status');
      setRankStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [keywordId]);

  // Auto-fetch when conditions are met
  useEffect(() => {
    if (keywordId && isUsedInRankTracking && isOpen) {
      fetchRankStatus();
    } else if (!isUsedInRankTracking || !isOpen) {
      setRankStatus(null);
    }
  }, [keywordId, isUsedInRankTracking, isOpen, fetchRankStatus]);

  // Clear rank status
  const clear = useCallback(() => {
    setRankStatus(null);
    setError(null);
  }, []);

  return {
    rankStatus,
    isLoading,
    error,
    refresh: fetchRankStatus,
    clear,
  };
}

/**
 * Get all discovered questions from rank status
 */
export function getDiscoveredQuestions(
  rankStatus: RankStatusResponse | null
): DiscoveredQuestion[] {
  if (!rankStatus?.rankings) return [];

  const questionsMap = new Map<string, DiscoveredQuestion>();

  for (const ranking of rankStatus.rankings) {
    if (ranking.latestCheck?.discoveredQuestions) {
      for (const q of ranking.latestCheck.discoveredQuestions) {
        // Deduplicate by question text
        if (!questionsMap.has(q.question.toLowerCase())) {
          questionsMap.set(q.question.toLowerCase(), q);
        }
      }
    }
  }

  return Array.from(questionsMap.values());
}

/**
 * Get the average position across all rankings
 */
export function getAveragePosition(rankStatus: RankStatusResponse | null): number | null {
  if (!rankStatus?.rankings) return null;

  const positions = rankStatus.rankings
    .filter((r) => r.latestCheck?.position !== null && r.latestCheck?.position !== undefined)
    .map((r) => r.latestCheck!.position!);

  if (positions.length === 0) return null;

  return Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
}

/**
 * Get the best (lowest) position across all rankings
 */
export function getBestPosition(rankStatus: RankStatusResponse | null): number | null {
  if (!rankStatus?.rankings) return null;

  const positions = rankStatus.rankings
    .filter((r) => r.latestCheck?.position !== null && r.latestCheck?.position !== undefined)
    .map((r) => r.latestCheck!.position!);

  if (positions.length === 0) return null;

  return Math.min(...positions);
}

/**
 * Check if any rankings have SERP visibility data
 */
export function hasSerpVisibility(rankStatus: RankStatusResponse | null): boolean {
  if (!rankStatus?.rankings) return false;

  return rankStatus.rankings.some((r) => r.latestCheck?.serpVisibility);
}

/**
 * Get rankings filtered by search term
 */
export function getRankingsForTerm(
  rankStatus: RankStatusResponse | null,
  term: string
): RankingData[] {
  if (!rankStatus?.rankings) return [];

  return rankStatus.rankings.filter(
    (r) => r.latestCheck?.searchQuery?.toLowerCase() === term.toLowerCase()
  );
}
