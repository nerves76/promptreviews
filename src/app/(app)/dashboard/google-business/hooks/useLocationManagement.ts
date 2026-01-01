'use client';

import { useState, useEffect, useMemo } from 'react';
import type { GoogleBusinessLocation } from '../types/google-business';
import {
  STORAGE_KEY_LOCATIONS,
  STORAGE_KEY_SELECTED_LOCATIONS,
  STORAGE_KEY_FETCH_ATTEMPTED,
} from '../utils/localStorage';

interface UseLocationManagementReturn {
  // Locations state
  locations: GoogleBusinessLocation[];
  setLocations: (locations: GoogleBusinessLocation[]) => void;
  hasAttemptedFetch: boolean;
  setHasAttemptedFetch: (attempted: boolean) => void;

  // Selection state
  selectedLocations: string[];
  setSelectedLocations: (locations: string[]) => void;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;

  // Computed values
  scopedSelectedLocations: GoogleBusinessLocation[];
  scopedLocations: GoogleBusinessLocation[];
  resolvedSelectedLocation: GoogleBusinessLocation | undefined;

  // Plan limits
  maxGBPLocations: number | null;
  setMaxGBPLocations: (max: number | null) => void;
}

/**
 * Hook to manage location state and selection
 *
 * Handles:
 * - Locations list with localStorage persistence
 * - Location selection state
 * - Scoped locations based on selection
 * - Plan-based location limits
 */
export function useLocationManagement(): UseLocationManagementReturn {
  // Locations list from localStorage
  const [locations, setLocations] = useState<GoogleBusinessLocation[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_LOCATIONS);
      try {
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Track whether user has attempted to fetch locations before
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_FETCH_ATTEMPTED);
      return stored === 'true';
    }
    return false;
  });

  // Selected location IDs from localStorage
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_SELECTED_LOCATIONS);
      try {
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Currently selected single location for viewing/editing
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Track maxLocations from API response
  const [maxGBPLocations, setMaxGBPLocations] = useState<number | null>(null);

  // Filter selection to only include valid location IDs
  useEffect(() => {
    if (selectedLocations.length === 0) {
      return;
    }

    const validLocationIds = new Set(locations.map(loc => loc.id));
    const filteredSelection = selectedLocations.filter(id => validLocationIds.has(id));

    if (filteredSelection.length !== selectedLocations.length) {
      setSelectedLocations(filteredSelection);
    }
  }, [locations, selectedLocations]);

  // Persist locations to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOCATIONS, JSON.stringify(locations));
  }, [locations]);

  // Persist hasAttemptedFetch to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FETCH_ATTEMPTED, hasAttemptedFetch.toString());
  }, [hasAttemptedFetch]);

  // Persist selected locations to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SELECTED_LOCATIONS, JSON.stringify(selectedLocations));
  }, [selectedLocations]);

  // Compute scoped selected locations (full objects)
  const scopedSelectedLocations = useMemo(() => {
    if (selectedLocations.length === 0) {
      return [] as GoogleBusinessLocation[];
    }

    const locationMap = new Map(locations.map(loc => [loc.id, loc]));

    return selectedLocations
      .map(id => locationMap.get(id))
      .filter((loc): loc is GoogleBusinessLocation => Boolean(loc));
  }, [locations, selectedLocations]);

  // Use selected locations if available, otherwise all locations
  const scopedLocations = scopedSelectedLocations.length > 0 ? scopedSelectedLocations : locations;

  // Resolve the currently selected location object
  const resolvedSelectedLocation = useMemo(() => {
    if (!selectedLocationId) {
      return scopedLocations[0];
    }

    const match = scopedLocations.find(loc => loc.id === selectedLocationId);
    return match || scopedLocations[0];
  }, [selectedLocationId, scopedLocations]);

  // Enforce location selection rules based on actual account limits
  useEffect(() => {
    // If there's exactly one location, force select it
    if (locations.length === 1) {
      const only = locations[0].id;
      if (selectedLocations.length !== 1 || selectedLocations[0] !== only) {
        setSelectedLocations([only]);
      }
      return;
    }

    // Enforce maxGBPLocations limit if available (respects database overrides)
    if (maxGBPLocations !== null && maxGBPLocations > 0 && selectedLocations.length > maxGBPLocations) {
      console.log(`⚠️ Location selection exceeds limit (${selectedLocations.length} > ${maxGBPLocations}). Trimming to limit.`);
      setSelectedLocations(selectedLocations.slice(0, maxGBPLocations));
    }
  }, [locations, maxGBPLocations, selectedLocations]);

  return {
    locations,
    setLocations,
    hasAttemptedFetch,
    setHasAttemptedFetch,
    selectedLocations,
    setSelectedLocations,
    selectedLocationId,
    setSelectedLocationId,
    scopedSelectedLocations,
    scopedLocations,
    resolvedSelectedLocation,
    maxGBPLocations,
    setMaxGBPLocations,
  };
}
