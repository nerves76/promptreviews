import { useState, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { WMTask } from '@/types/workManager';

interface GBPSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface AddToWorkManagerResult {
  success: boolean;
  boardId?: string;
  task?: WMTask;
  error?: string;
}

/**
 * Hook for integrating GBP suggestions with Work Manager.
 * Provides functionality to add GBP optimization suggestions as tasks.
 */
export function useWorkManagerIntegration() {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AddToWorkManagerResult | null>(null);

  const addSuggestionToWorkManager = useCallback(async (
    suggestion: GBPSuggestion
  ): Promise<AddToWorkManagerResult> => {
    setAddingId(suggestion.id);
    setLastResult(null);

    try {
      const response = await apiClient.post<{ task: WMTask; board_id: string }>(
        '/work-manager/tasks/from-suggestion',
        { suggestion }
      );

      const result: AddToWorkManagerResult = {
        success: true,
        boardId: response.board_id,
        task: response.task,
      };

      setLastResult(result);
      return result;
    } catch (error: any) {
      const result: AddToWorkManagerResult = {
        success: false,
        error: error.message || 'Failed to add task to Work Manager',
      };

      setLastResult(result);
      return result;
    } finally {
      setAddingId(null);
    }
  }, []);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    addSuggestionToWorkManager,
    isAddingToWorkManager: addingId,
    lastResult,
    clearResult,
  };
}
