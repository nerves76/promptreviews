/**
 * useLocations Hook
 *
 * Searches DataForSEO locations for rank tracking.
 * Used when creating/editing keyword groups to select a target location.
 */

'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';

// ============================================
// Types
// ============================================

export interface Location {
  locationCode: number;
  locationName: string;
  countryCode: string;
  locationType: string;
}

export interface UseLocationsReturn {
  /** Search results */
  locations: Location[];
  /** Loading state */
  isLoading: boolean;
  /** Search for locations by name */
  search: (query: string) => Promise<void>;
  /** Error message if any */
  error: string | null;
}

// ============================================
// Hook
// ============================================

export function useLocations(): UseLocationsReturn {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setLocations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ locations: Location[] }>(
        `/rank-tracking/locations?search=${encodeURIComponent(query)}`
      );

      setLocations(response.locations || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to search locations';
      setError(message);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    locations,
    isLoading,
    search,
    error,
  };
}

export default useLocations;
