'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/utils/apiClient';
import { normalizePhrase, type ResearchResultData } from '../keywordUtils';

/**
 * Response from the volume discovery API
 */
interface VolumeDiscoveryResponse {
  keyword: string;
  volume: number;
  cpc: number | null;
  competition: number | null;
  competitionLevel: string | null;
  trend: string | null;
  monthlySearches: Array<{ month: number; year: number; searchVolume: number }> | null;
}

/**
 * Options for the useVolumeData hook
 */
export interface UseVolumeDataOptions {
  /** The keyword ID to fetch volume data for */
  keywordId: string | null;
  /** Whether the parent component is open/visible (triggers auto-fetch) */
  isOpen?: boolean;
  /** Default location code for volume lookups (defaults to US: 2840) */
  defaultLocationCode?: number;
  /** Default location name for volume lookups */
  defaultLocationName?: string;
}

/**
 * Return type for the useVolumeData hook
 */
export interface UseVolumeDataReturn {
  /** Map of normalized term to volume data */
  termVolumeData: Map<string, ResearchResultData>;
  /** Whether initial volume data is being loaded */
  isLoading: boolean;
  /** Total volume across all tracked terms */
  totalVolume: number;
  /** Whether all terms have low volume (<10) */
  allLowVolume: boolean;
  /**
   * Check volume for a specific search term
   * @param term - The search term to check
   * @param locationCode - Optional location code override
   * @param locationName - Optional location name override
   */
  checkTermVolume: (
    term: string,
    locationCode?: number,
    locationName?: string
  ) => Promise<void>;
  /** The term currently being checked (null if not checking) */
  checkingTerm: string | null;
  /** Refresh volume data from the server */
  refresh: () => Promise<void>;
  /** Clear all volume data */
  clear: () => void;
}

/**
 * Hook for managing keyword volume data
 *
 * Handles:
 * - Auto-fetching volume data when opened
 * - Checking volume for individual terms
 * - Saving results to the server
 * - Computing aggregate stats (total volume, all low volume)
 *
 * @example
 * ```tsx
 * const {
 *   termVolumeData,
 *   isLoading,
 *   totalVolume,
 *   checkTermVolume,
 *   checkingTerm,
 * } = useVolumeData({
 *   keywordId: keyword?.id,
 *   isOpen: true,
 *   defaultLocationCode: keyword?.searchVolumeLocationCode || 2840,
 * });
 * ```
 */
export function useVolumeData({
  keywordId,
  isOpen = true,
  defaultLocationCode = 2840,
  defaultLocationName = 'United States',
}: UseVolumeDataOptions): UseVolumeDataReturn {
  const [termVolumeData, setTermVolumeData] = useState<Map<string, ResearchResultData>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [checkingTerm, setCheckingTerm] = useState<string | null>(null);

  // Fetch volume data for all linked terms
  const fetchVolumeData = useCallback(async () => {
    if (!keywordId) {
      setTermVolumeData(new Map());
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get<{ results: ResearchResultData[] }>(
        `/keyword-research/results?keywordId=${keywordId}`
      );

      const map = new Map<string, ResearchResultData>();
      for (const r of response.results) {
        map.set(r.normalizedTerm, r);
      }
      setTermVolumeData(map);
    } catch (err) {
      console.error('Failed to fetch term volume data:', err);
      setTermVolumeData(new Map());
    } finally {
      setIsLoading(false);
    }
  }, [keywordId]);

  // Auto-fetch when opened
  useEffect(() => {
    if (keywordId && isOpen) {
      fetchVolumeData();
    } else if (!isOpen) {
      // Optionally clear data when closed to free memory
      // setTermVolumeData(new Map());
    }
  }, [keywordId, isOpen, fetchVolumeData]);

  // Check volume for a specific term
  const checkTermVolume = useCallback(
    async (
      term: string,
      locationCode: number = defaultLocationCode,
      locationName: string = defaultLocationName
    ) => {
      if (!keywordId) return;

      setCheckingTerm(term);
      try {
        // Use the keyword discovery API to get volume data
        const response = await apiClient.post<VolumeDiscoveryResponse>(
          '/rank-tracking/discovery',
          {
            keyword: term,
            locationCode,
          }
        );

        // Save the result linked to this keyword
        await apiClient.post('/keyword-research/save', {
          term,
          searchVolume: response.volume,
          cpc: response.cpc,
          competition: response.competition,
          competitionLevel: response.competitionLevel,
          searchVolumeTrend: response.monthlySearches
            ? {
                monthlyData: response.monthlySearches.map((m) => ({
                  month: m.month,
                  year: m.year,
                  volume: m.searchVolume,
                })),
              }
            : null,
          monthlySearches: response.monthlySearches,
          locationCode,
          locationName,
          keywordId,
        });

        // Update local state
        const normalizedTerm = normalizePhrase(term);
        setTermVolumeData((prev) => {
          const newMap = new Map(prev);
          newMap.set(normalizedTerm, {
            id: '', // Will be set by API
            term,
            normalizedTerm,
            searchVolume: response.volume,
            cpc: response.cpc,
            competition: response.competition,
            competitionLevel: response.competitionLevel,
            searchVolumeTrend: response.monthlySearches
              ? {
                  monthlyData: response.monthlySearches.map((m) => ({
                    month: m.month,
                    year: m.year,
                    volume: m.searchVolume,
                  })),
                }
              : null,
            monthlySearches: response.monthlySearches,
            locationCode,
            locationName,
            keywordId,
            linkedAt: new Date().toISOString(),
            researchedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          return newMap;
        });
      } catch (err) {
        console.error('Failed to check term volume:', err);
        throw err;
      } finally {
        setCheckingTerm(null);
      }
    },
    [keywordId, defaultLocationCode, defaultLocationName]
  );

  // Computed: total volume across all terms
  const totalVolume = useMemo(() => {
    const terms = Array.from(termVolumeData.values());
    return terms.reduce((sum, t) => sum + (t.searchVolume || 0), 0);
  }, [termVolumeData]);

  // Computed: whether all terms have low volume
  const allLowVolume = useMemo(() => {
    const terms = Array.from(termVolumeData.values());
    return terms.length > 0 && terms.every((t) => (t.searchVolume || 0) < 10);
  }, [termVolumeData]);

  // Clear all data
  const clear = useCallback(() => {
    setTermVolumeData(new Map());
  }, []);

  return {
    termVolumeData,
    isLoading,
    totalVolume,
    allLowVolume,
    checkTermVolume,
    checkingTerm,
    refresh: fetchVolumeData,
    clear,
  };
}

/**
 * Get volume data for a specific term from the volume data map
 */
export function getTermVolume(
  termVolumeData: Map<string, ResearchResultData>,
  term: string
): ResearchResultData | undefined {
  return termVolumeData.get(normalizePhrase(term));
}

/**
 * Check if volume data exists for a term
 */
export function hasTermVolume(
  termVolumeData: Map<string, ResearchResultData>,
  term: string
): boolean {
  const data = termVolumeData.get(normalizePhrase(term));
  return data !== undefined && data.searchVolume !== null;
}
