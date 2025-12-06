/**
 * useGeoGridConfig Hook
 *
 * Manages geo grid configuration state and operations.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { GGConfig, CheckPoint } from '../utils/types';

// ============================================
// Types
// ============================================

export interface UseGeoGridConfigOptions {
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface UseGeoGridConfigReturn {
  /** Current config (null if not set up) */
  config: GGConfig | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether config exists */
  hasConfig: boolean;
  /** Refresh config from server */
  refresh: () => Promise<void>;
  /** Create or update config */
  saveConfig: (data: SaveConfigData) => Promise<{ success: boolean; error?: string }>;
}

export interface SaveConfigData {
  googleBusinessLocationId?: string;
  centerLat: number;
  centerLng: number;
  radiusMiles?: number;
  checkPoints?: CheckPoint[];
  targetPlaceId?: string;
  isEnabled?: boolean;
}

// ============================================
// Hook
// ============================================

export function useGeoGridConfig(
  options: UseGeoGridConfigOptions = {}
): UseGeoGridConfigReturn {
  const { autoFetch = true } = options;

  const [config, setConfig] = useState<GGConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{
        config: GGConfig | null;
        message?: string;
      }>('/geo-grid/config');

      setConfig(response.config);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch config';
      setError(message);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveConfig = useCallback(
    async (data: SaveConfigData): Promise<{ success: boolean; error?: string }> => {
      setError(null);

      try {
        const response = await apiClient.post<{
          config: GGConfig;
          created: boolean;
        }>('/geo-grid/config', data);

        setConfig(response.config);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save config';
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchConfig();
    }
  }, [autoFetch, fetchConfig]);

  return {
    config,
    isLoading,
    error,
    hasConfig: config !== null,
    refresh: fetchConfig,
    saveConfig,
  };
}

export default useGeoGridConfig;
