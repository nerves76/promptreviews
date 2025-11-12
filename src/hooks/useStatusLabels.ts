import { useState, useEffect, useCallback } from "react";

export interface StatusLabels {
  draft: string;
  in_queue: string;
  sent: string;
  follow_up: string;
  complete: string;
}

const DEFAULT_LABELS: StatusLabels = {
  draft: "Draft",
  in_queue: "In Queue",
  sent: "Sent",
  follow_up: "Follow Up",
  complete: "Complete",
};

/**
 * Hook to fetch and update custom status labels for the current account
 */
export function useStatusLabels() {
  const [statusLabels, setStatusLabels] = useState<StatusLabels>(DEFAULT_LABELS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch status labels
  const fetchLabels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/account/status-labels");

      if (!response.ok) {
        throw new Error("Failed to fetch status labels");
      }

      const data = await response.json();
      setStatusLabels(data.labels || DEFAULT_LABELS);
    } catch (err) {
      console.error("Error fetching status labels:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // Fall back to defaults on error
      setStatusLabels(DEFAULT_LABELS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update status labels
  const updateStatusLabels = useCallback(
    async (labels: StatusLabels): Promise<boolean> => {
      try {
        const response = await fetch("/api/account/status-labels", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ labels }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update status labels");
        }

        const data = await response.json();
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

  // Fetch labels on mount
  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  return {
    statusLabels,
    isLoading,
    error,
    updateStatusLabels,
    updateLabel,
    refetch: fetchLabels,
  };
}
