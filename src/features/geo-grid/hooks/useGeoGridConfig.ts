/**
 * useGeoGridConfig Hook
 *
 * Manages geo grid configuration state and operations.
 * Supports multiple configs for Maven accounts.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import { GGConfig, CheckPoint } from '../utils/types';

// ============================================
// Types
// ============================================

export interface UseGeoGridConfigOptions {
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
  /** Initial config ID to select */
  initialConfigId?: string | null;
}

export interface UseGeoGridConfigReturn {
  /** All configs for the account */
  configs: GGConfig[];
  /** Currently selected config (null if none) */
  config: GGConfig | null;
  /** Currently selected config ID */
  selectedConfigId: string | null;
  /** Select a config by ID */
  selectConfig: (configId: string | null) => void;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether any config exists */
  hasConfig: boolean;
  /** Whether user can add more configs (based on plan) */
  canAddMore: boolean;
  /** Account plan */
  plan: string;
  /** Max configs allowed for plan */
  maxConfigs: number;
  /** Refresh config from server */
  refresh: () => Promise<void>;
  /** Create or update config */
  saveConfig: (data: SaveConfigData) => Promise<{ success: boolean; error?: string; config?: GGConfig }>;
  /** Delete a config */
  deleteConfig: (configId: string) => Promise<{ success: boolean; error?: string }>;
}

export interface SaveConfigData {
  /** Config ID to update (optional - creates new if not provided) */
  configId?: string;
  googleBusinessLocationId?: string;
  locationName?: string;
  centerLat: number;
  centerLng: number;
  radiusMiles?: number;
  checkPoints?: CheckPoint[];
  targetPlaceId?: string;
  isEnabled?: boolean;
}

interface ConfigApiResponse {
  configs: GGConfig[];
  config: GGConfig | null;
  plan: string;
  maxConfigs: number;
  canAddMore: boolean;
}

// ============================================
// Hook
// ============================================

export function useGeoGridConfig(
  options: UseGeoGridConfigOptions = {}
): UseGeoGridConfigReturn {
  const { autoFetch = true, initialConfigId = null } = options;

  // Track selected account to refetch when it changes
  const { selectedAccountId } = useAccountData();

  const [configs, setConfigs] = useState<GGConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(initialConfigId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('grower');
  const [maxConfigs, setMaxConfigs] = useState<number>(1);
  const [canAddMore, setCanAddMore] = useState<boolean>(true);

  // Get the selected config
  const config = useMemo(() => {
    if (!selectedConfigId) {
      return configs[0] || null;
    }
    return configs.find(c => c.id === selectedConfigId) || configs[0] || null;
  }, [configs, selectedConfigId]);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ConfigApiResponse>('/geo-grid/config');

      setConfigs(response.configs || []);
      setPlan(response.plan || 'grower');
      setMaxConfigs(response.maxConfigs || 1);
      setCanAddMore(response.canAddMore ?? true);

      // Auto-select first config if none selected
      setSelectedConfigId(prev => {
        if (!prev && response.configs?.length > 0) {
          return response.configs[0].id;
        }
        return prev;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch config';
      setError(message);
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectConfig = useCallback((configId: string | null) => {
    setSelectedConfigId(configId);
  }, []);

  const saveConfig = useCallback(
    async (data: SaveConfigData): Promise<{ success: boolean; error?: string; config?: GGConfig }> => {
      setError(null);

      try {
        const response = await apiClient.post<{
          config: GGConfig;
          created?: boolean;
          updated?: boolean;
          error?: string;
          message?: string;
          upgradeRequired?: boolean;
        }>('/geo-grid/config', data);

        if (response.error) {
          throw new Error(response.message || response.error);
        }

        // Update configs list
        setConfigs(prev => {
          const existingIndex = prev.findIndex(c => c.id === response.config.id);
          if (existingIndex >= 0) {
            // Update existing
            const updated = [...prev];
            updated[existingIndex] = response.config;
            return updated;
          } else {
            // Add new
            return [...prev, response.config];
          }
        });

        // Select the new/updated config
        setSelectedConfigId(response.config.id);

        // Refresh to get updated canAddMore from server
        // This ensures we have accurate tier info
        await fetchConfig();

        return { success: true, config: response.config };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save config';
        setError(message);
        return { success: false, error: message };
      }
    },
    [fetchConfig]
  );

  const deleteConfig = useCallback(
    async (configIdToDelete: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);

      try {
        await apiClient.delete(`/geo-grid/config?configId=${configIdToDelete}`);

        // Remove from configs list and update selection if needed
        setConfigs(prev => {
          const remaining = prev.filter(c => c.id !== configIdToDelete);
          // If we deleted the selected config, select another
          if (selectedConfigId === configIdToDelete) {
            const nextConfig = remaining[0];
            // Use setTimeout to avoid state update during render
            setTimeout(() => setSelectedConfigId(nextConfig?.id || null), 0);
          }
          return remaining;
        });

        // Update canAddMore
        setCanAddMore(true);

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete config';
        setError(message);
        return { success: false, error: message };
      }
    },
    [selectedConfigId]
  );

  // Clear data and refetch when account changes
  useEffect(() => {
    // Clear stale data immediately when account changes
    setConfigs([]);
    setSelectedConfigId(initialConfigId);
    setError(null);
    setPlan('grower');
    setMaxConfigs(1);
    setCanAddMore(true);

    if (autoFetch && selectedAccountId) {
      fetchConfig();
    }
  }, [selectedAccountId]); // Only depend on selectedAccountId to avoid infinite loops

  // Also fetch on mount if autoFetch is enabled
  useEffect(() => {
    if (autoFetch && selectedAccountId) {
      fetchConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    configs,
    config,
    selectedConfigId,
    selectConfig,
    isLoading,
    error,
    hasConfig: configs.length > 0,
    canAddMore,
    plan,
    maxConfigs,
    refresh: fetchConfig,
    saveConfig,
    deleteConfig,
  };
}

export default useGeoGridConfig;
