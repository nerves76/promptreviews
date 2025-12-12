/**
 * useRankGroups Hook
 *
 * Manages rank tracking keyword groups (CRUD operations).
 * Handles loading state, errors, and data refresh.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { RankKeywordGroup } from '../utils/types';

// ============================================
// Types
// ============================================

export interface UseRankGroupsOptions {
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface CreateGroupData {
  name: string;
  device: 'desktop' | 'mobile';
  locationCode: number;
  locationName: string;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | null;
  scheduleHour?: number;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
}

export interface UseRankGroupsReturn {
  /** All groups for the account */
  groups: RankKeywordGroup[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh groups from server */
  refresh: () => Promise<void>;
  /** Create a new group */
  createGroup: (data: CreateGroupData) => Promise<{
    success: boolean;
    group?: RankKeywordGroup;
    error?: string;
  }>;
  /** Update an existing group */
  updateGroup: (
    id: string,
    data: Partial<CreateGroupData>
  ) => Promise<{ success: boolean; error?: string }>;
  /** Delete a group */
  deleteGroup: (id: string) => Promise<{ success: boolean; error?: string }>;
}

// ============================================
// Hook
// ============================================

export function useRankGroups(
  options: UseRankGroupsOptions = {}
): UseRankGroupsReturn {
  const { autoFetch = true } = options;

  const [groups, setGroups] = useState<RankKeywordGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ groups: RankKeywordGroup[] }>(
        '/rank-tracking/groups'
      );

      setGroups(response.groups || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch groups';
      setError(message);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(
    async (
      data: CreateGroupData
    ): Promise<{ success: boolean; group?: RankKeywordGroup; error?: string }> => {
      setError(null);

      try {
        const response = await apiClient.post<{
          group: RankKeywordGroup;
          error?: string;
        }>('/rank-tracking/groups', data);

        if (response.error) {
          throw new Error(response.error);
        }

        // Add new group to the list
        setGroups((prev) => [...prev, response.group]);

        return { success: true, group: response.group };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create group';
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const updateGroup = useCallback(
    async (
      id: string,
      data: Partial<CreateGroupData>
    ): Promise<{ success: boolean; error?: string }> => {
      setError(null);

      try {
        const response = await apiClient.put<{
          group: RankKeywordGroup;
          error?: string;
        }>(`/rank-tracking/groups/${id}`, data);

        if (response.error) {
          throw new Error(response.error);
        }

        // Update the group in the list
        setGroups((prev) =>
          prev.map((group) => (group.id === id ? response.group : group))
        );

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update group';
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const deleteGroup = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);

      try {
        await apiClient.delete(`/rank-tracking/groups/${id}`);

        // Remove group from the list
        setGroups((prev) => prev.filter((group) => group.id !== id));

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete group';
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchGroups();
    }
  }, [autoFetch, fetchGroups]);

  return {
    groups,
    isLoading,
    error,
    refresh: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}

export default useRankGroups;
