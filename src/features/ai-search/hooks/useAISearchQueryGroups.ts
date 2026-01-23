import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';

export interface AISearchQueryGroupData {
  id: string;
  name: string;
  displayOrder: number;
  queryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UseAISearchQueryGroupsOptions {
  autoFetch?: boolean;
}

interface UseAISearchQueryGroupsReturn {
  groups: AISearchQueryGroupData[];
  ungroupedCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createGroup: (name: string, displayOrder?: number) => Promise<AISearchQueryGroupData | null>;
  updateGroup: (id: string, updates: { name?: string; displayOrder?: number }) => Promise<AISearchQueryGroupData | null>;
  deleteGroup: (id: string) => Promise<boolean>;
  reorderGroups: (updates: { id: string; displayOrder: number }[]) => Promise<boolean>;
  bulkMoveQueries: (questionIds: string[], groupId: string | null) => Promise<boolean>;
}

export function useAISearchQueryGroups(
  options: UseAISearchQueryGroupsOptions = {}
): UseAISearchQueryGroupsReturn {
  const { autoFetch = true } = options;

  const [groups, setGroups] = useState<AISearchQueryGroupData[]>([]);
  const [ungroupedCount, setUngroupedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{
        groups: AISearchQueryGroupData[];
        ungroupedCount: number;
      }>('/ai-search-query-groups');

      setGroups(response.groups || []);
      setUngroupedCount(response.ungroupedCount || 0);
    } catch (err: any) {
      console.error('❌ Failed to fetch AI search query groups:', err);
      setError(err?.message || 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(
    async (name: string, displayOrder?: number): Promise<AISearchQueryGroupData | null> => {
      try {
        const response = await apiClient.post<{ group: AISearchQueryGroupData }>(
          '/ai-search-query-groups',
          { name, displayOrder }
        );

        if (response.group) {
          setGroups((prev) => [...prev, response.group]);
          return response.group;
        }
        return null;
      } catch (err: any) {
        console.error('❌ Failed to create AI search query group:', err);
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
    ): Promise<AISearchQueryGroupData | null> => {
      try {
        const response = await apiClient.put<{ group: AISearchQueryGroupData }>(
          `/ai-search-query-groups/${id}`,
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
        console.error('❌ Failed to update AI search query group:', err);
        setError(err?.message || 'Failed to update group');
        return null;
      }
    },
    []
  );

  const deleteGroup = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/ai-search-query-groups/${id}`);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      // Refresh to update counts since items were moved to General
      await refresh();
      return true;
    } catch (err: any) {
      console.error('❌ Failed to delete AI search query group:', err);
      setError(err?.message || 'Failed to delete group');
      return false;
    }
  }, [refresh]);

  const reorderGroups = useCallback(
    async (updates: { id: string; displayOrder: number }[]): Promise<boolean> => {
      try {
        await apiClient.patch('/ai-search-query-groups/reorder', { updates });

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
        console.error('❌ Failed to reorder AI search query groups:', err);
        setError(err?.message || 'Failed to reorder groups');
        return false;
      }
    },
    []
  );

  const bulkMoveQueries = useCallback(
    async (questionIds: string[], groupId: string | null): Promise<boolean> => {
      try {
        await apiClient.post('/keyword-questions/bulk-move', {
          questionIds,
          groupId,
        });

        // Refresh to update counts
        await refresh();
        return true;
      } catch (err: any) {
        console.error('❌ Failed to move queries:', err);
        setError(err?.message || 'Failed to move queries');
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
    bulkMoveQueries,
  };
}
