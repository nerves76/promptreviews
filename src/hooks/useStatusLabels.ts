import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/auth";
import { apiClient } from "@/utils/apiClient";

export interface StatusLabels {
  draft: string;
  in_queue: string;
  sent: string;
  follow_up: string;
  complete: string;
}

const DEFAULT_LABELS: StatusLabels = {
  draft: "Backlog",
  in_queue: "In progress",
  sent: "Sent",
  follow_up: "Follow up",
  complete: "Complete",
};

/**
 * Hook to fetch and update custom status labels for the current account
 */
export function useStatusLabels() {
  const { user, isInitialized } = useAuth();
  const [statusLabels, setStatusLabels] = useState<StatusLabels>(DEFAULT_LABELS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch status labels
  const fetchLabels = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!user || !isInitialized) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await apiClient.get<{ labels: StatusLabels }>("/account/status-labels");
      setStatusLabels(data.labels || DEFAULT_LABELS);
    } catch (err) {
      // Only log errors if auth is initialized (suppress initial auth timing issues)
      if (isInitialized) {
        console.error("Error fetching status labels:", err);
      }
      setError(err instanceof Error ? err.message : "Unknown error");
      // Fall back to defaults on error
      setStatusLabels(DEFAULT_LABELS);
    } finally {
      setIsLoading(false);
    }
  }, [user, isInitialized]);

  // Update status labels
  const updateStatusLabels = useCallback(
    async (labels: StatusLabels): Promise<boolean> => {
      try {
        const data = await apiClient.put<{ labels: StatusLabels }>("/account/status-labels", { labels });
        setStatusLabels(data.labels);
        return true;
      } catch (err) {
        console.error("Error updating status labels:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    []
  );

  // Update a single status label
  const updateLabel = useCallback(
    async (
      status: keyof StatusLabels,
      label: string
    ): Promise<boolean> => {
      const newLabels = { ...statusLabels, [status]: label };
      return updateStatusLabels(newLabels);
    },
    [statusLabels, updateStatusLabels]
  );

  // Fetch labels on mount, but only when auth is ready
  useEffect(() => {
    if (user && isInitialized) {
      fetchLabels();
    }
  }, [fetchLabels, user, isInitialized]);

  return {
    statusLabels,
    isLoading,
    error,
    updateStatusLabels,
    updateLabel,
    refetch: fetchLabels,
  };
}
