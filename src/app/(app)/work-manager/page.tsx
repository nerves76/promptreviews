"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useAuth } from "@/auth";
import { apiClient } from "@/utils/apiClient";
import { WMBoard } from "@/types/workManager";

/**
 * Work Manager landing page - redirects to the user's board.
 * Every account gets one board, auto-created on first visit.
 */
export default function WorkManagerDashboard() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ensureAttempted = useRef(false);

  useEffect(() => {
    if (!isInitialized || !user || ensureAttempted.current) return;
    ensureAttempted.current = true;

    const ensureAndRedirect = async () => {
      try {
        // Get or create the board for this account
        const response = await apiClient.post<{ board: WMBoard; created: boolean }>(
          '/work-manager/boards/ensure',
          {}
        );
        // Redirect directly to the board
        router.replace(`/work-manager/${response.board.id}`);
      } catch (err: any) {
        console.error("Failed to load Work Manager:", err);
        setError(err.message || "Failed to load Work Manager");
      }
    };

    ensureAndRedirect();
  }, [isInitialized, user, router]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <Icon name="FaExclamationTriangle" size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              ensureAttempted.current = false;
              setError(null);
            }}
            className="px-6 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Loading state - show while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Icon name="FaSpinner" size={32} className="animate-spin text-white mx-auto mb-4" />
        <p className="text-white/70">Loading Work Manager...</p>
      </div>
    </div>
  );
}
