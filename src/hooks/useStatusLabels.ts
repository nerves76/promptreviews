import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/auth";

export interface StatusLabels {
  draft: string;
  in_queue: string;
  sent: string;
  follow_up: string;
  complete: string;
}

const DEFAULT_LABELS: StatusLabels = {
  draft: "Draft",
  in_queue: "In queue",
  sent: "Sent",
  follow_up: "Follow up",
  complete: "Complete",
};

// Helper to get selected account ID from localStorage
function getSelectedAccountId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const userId = localStorage.getItem('promptreviews_last_user_id');
    if (!userId) return null;

    const accountKey = `promptreviews_selected_account_${userId}`;
    return localStorage.getItem(accountKey);
  } catch (error) {
    console.error('Error reading selected account:', error);
    return null;
  }
}

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

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add selected account header
      const selectedAccountId = getSelectedAccountId();
      if (selectedAccountId) {
        headers["X-Selected-Account"] = selectedAccountId;
      }

      const response = await fetch("/api/account/status-labels", { headers });

      if (!response.ok) {
        // Silently use defaults if fetch fails (likely auth not ready)
        setStatusLabels(DEFAULT_LABELS);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
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
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        // Add selected account header
        const selectedAccountId = getSelectedAccountId();
        if (selectedAccountId) {
          headers["X-Selected-Account"] = selectedAccountId;
        }

        const response = await fetch("/api/account/status-labels", {
          method: "PUT",
          headers,
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
