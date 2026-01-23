import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';

export interface RankTrackingTermGroupData {
  id: string;
  name: string;
  displayOrder: number;
  termCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UseRankTrackingTermGroupsOptions {
  autoFetch?: boolean;
}

interface UseRankTrackingTermGroupsReturn {
  groups: RankTrackingTermGroupData[];
  ungroupedCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createGroup: (name: string, displayOrder?: number) => Promise<RankTrackingTermGroupData | null>;
  updateGroup: (id: string, updates: { name?: string; displayOrder?: number }) => Promise<RankTrackingTermGroupData | null>;
  deleteGroup: (id: string) => Promise<boolean>;
  reorderGroups: (updates: { id: string; displayOrder: number }[]) => Promise<boolean>;
  bulkMoveTerms: (termIdentifiers: Array<{ keywordId: string; term: string }>, groupId: string | null) => Promise<boolean>;
}

export function useRankTrackingTermGroups(
  options: UseRankTrackingTermGroupsOptions = {}
): UseRankTrackingTermGroupsReturn {
  const { autoFetch = true } = options;

  const [groups, setGroups] = useState<RankTrackingTermGroupData[]>([]);
  const [ungroupedCount, setUngroupedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{
        groups: RankTrackingTermGroupData[];
        ungroupedCount: number;
      }>('/rank-tracking-term-groups');

      setGroups(response.groups || []);
      setUngroupedCount(response.ungroupedCount || 0);
    } catch (err: any) {
      console.error('❌ Failed to fetch rank tracking term groups:', err);
      setError(err?.message || 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(
    async (name: string, displayOrder?: number): Promise<RankTrackingTermGroupData | null> => {
      try {
        const response = await apiClient.post<{ group: RankTrackingTermGroupData }>(
          '/rank-tracking-term-groups',
          { name, displayOrder }
        );

        if (response.group) {
          setGroups((prev) => [...prev, response.group]);
          return response.group;
        }
        return null;
      } catch (err: any) {
        console.error('❌ Failed to create rank tracking term group:', err);
        setError(err?.message || 'Failed to create group');
        return null;
      }
    },
    []
  );

  const updateGroup = useCallback(
    async (
      id: string,
      updates: { name?: string; displayOrder?: number }
    ): Promise<RankTrackingTermGroupData | null> => {
      try {
        const response = await apiClient.put<{ group: RankTrackingTermGroupData }>(
          `/rank-tracking-term-groups/${id}`,
          updates
        );

        if (response.group) {
          setGroups((prev) =>
            prev.map((g) => (g.id === id ? response.group : g))
          );
          return response.group;
        }
        return null;
      } catch (err: any) {
        console.error('❌ Failed to update rank tracking term group:', err);
        setError(err?.message || 'Failed to update group');
        return null;
      }
    },
    []
  );

  const deleteGroup = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/rank-tracking-term-groups/${id}`);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      // Refresh to update counts since items were moved to General
      await refresh();
      return true;
    } catch (err: any) {
      console.error('❌ Failed to delete rank tracking term group:', err);
      setError(err?.message || 'Failed to delete group');
      return false;
    }
  }, [refresh]);

  const reorderGroups = useCallback(
    async (updates: { id: string; displayOrder: number }[]): Promise<boolean> => {
      try {
        await apiClient.patch('/rank-tracking-term-groups/reorder', { updates });

        // Optimistically update local state
        setGroups((prev) => {
          const updated = [...prev];
          for (const update of updates) {
            const idx = updated.findIndex((g) => g.id === update.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], displayOrder: update.displayOrder };
            }
          }
          return updated.sort((a, b) => a.displayOrder - b.displayOrder);
        });

        return true;
      } catch (err: any) {
        console.error('❌ Failed to reorder rank tracking term groups:', err);
        setError(err?.message || 'Failed to reorder groups');
        return false;
      }
    },
    []
  );

  const bulkMoveTerms = useCallback(
    async (termIdentifiers: Array<{ keywordId: string; term: string }>, groupId: string | null): Promise<boolean> => {
      try {
        await apiClient.post('/rank-tracking-terms/bulk-move', {
          termIdentifiers,
          groupId,
        });

        // Refresh to update counts
        await refresh();
        return true;
      } catch (err: any) {
        console.error('❌ Failed to move terms:', err);
        setError(err?.message || 'Failed to move terms');
        return false;
      }
    },
    [refresh]
  );

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  return {
    groups,
    ungroupedCount,
    isLoading,
    error,
    refresh,
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    bulkMoveTerms,
  };
}
