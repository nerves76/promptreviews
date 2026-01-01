'use client';

import { useState, useRef } from 'react';
import { STORAGE_KEY_CONNECTED } from '../utils/localStorage';

interface UseGoogleBusinessConnectionReturn {
  // Connection state
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  connectedEmail: string | null;
  setConnectedEmail: (email: string | null) => void;

  // Platform loading state (for Bluesky, LinkedIn, etc.)
  isLoadingPlatforms: boolean;
  setIsLoadingPlatforms: (loading: boolean) => void;

  // Refs for preventing duplicate operations
  loadingRef: React.MutableRefObject<boolean>;
  initialLoadDone: React.MutableRefObject<boolean>;

  // GBP access check
  hasGBPAccess: boolean;
  setHasGBPAccess: (hasAccess: boolean) => void;
}

/**
 * Hook to manage Google Business connection state
 *
 * Handles:
 * - Connection status with localStorage persistence
 * - Loading states for various operations
 * - Connected email tracking
 * - GBP access state
 *
 * Note: OAuth handlers are kept in the main component
 * due to their complex interdependencies with other state.
 */
export function useGoogleBusinessConnection(): UseGoogleBusinessConnectionReturn {
  // Connection status from localStorage
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_CONNECTED);
      return stored === 'true';
    }
    return false;
  });

  // Loading state for initial load and operations
  const [isLoading, setIsLoading] = useState(true);

  // Connected email address
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  // Platform loading state (for cross-posting platforms)
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);

  // Refs to prevent duplicate operations
  const loadingRef = useRef(false);
  const initialLoadDone = useRef(false);

  // GBP access state (based on plan)
  const [hasGBPAccess, setHasGBPAccess] = useState(false);

  return {
    isConnected,
    setIsConnected,
    isLoading,
    setIsLoading,
    connectedEmail,
    setConnectedEmail,
    isLoadingPlatforms,
    setIsLoadingPlatforms,
    loadingRef,
    initialLoadDone,
    hasGBPAccess,
    setHasGBPAccess,
  };
}
