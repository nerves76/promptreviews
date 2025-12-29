"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useAuth } from "@/auth";
import { apiClient } from "@/utils/apiClient";
import CreateBoardModal from "./components/CreateBoardModal";
import { WMBoardListItem } from "@/types/workManager";

interface UserAccount {
  account_id: string;
  account_name?: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
}

export default function WorkManagerDashboard() {
  const router = useRouter();
  const { user, accounts, isInitialized } = useAuth();
  const [boards, setBoards] = useState<WMBoardListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check if user has multiple accounts
  const hasMultipleAccounts = accounts && accounts.length > 1;

  // Fetch boards
  const fetchBoards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get("/work-manager/boards");
      setBoards(response.boards || []);
    } catch (err: any) {
      console.error("Failed to fetch boards:", err);
      setError(err.message || "Failed to load boards");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && user) {
      fetchBoards();
    }
  }, [isInitialized, user]);

  // Redirect single-account users with a board directly to their board
  useEffect(() => {
    if (!hasMultipleAccounts && boards.length === 1 && !isLoading) {
      router.replace(`/work-manager/${boards[0].id}`);
    }
  }, [hasMultipleAccounts, boards, isLoading, router]);

  const handleBoardCreated = (boardId: string) => {
    fetchBoards();
    router.push(`/work-manager/${boardId}`);
  };

  const getBoardDisplayName = (board: WMBoardListItem): string => {
    if (board.name) return board.name;
    if (board.business_name) return board.business_name;
    return board.account_name || "Unnamed Board";
  };

  // Don't show dashboard for single-account users
  if (!hasMultipleAccounts && !isLoading && boards.length <= 1) {
    if (boards.length === 0) {
      return (
        <div className="min-h-screen p-6">
          <div className="max-w-2xl mx-auto text-center py-20">
            <Icon name="FaTasks" size={64} className="mx-auto mb-6 text-white/30" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Work Manager
            </h1>
            <p className="text-white/70 mb-8">
              Work Manager is available for agencies managing multiple client accounts.
              Add another account to get started.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-blue rounded-lg hover:bg-white/90 font-medium"
            >
              <Icon name="FaCog" size={16} />
              Go to Settings
            </Link>
          </div>
        </div>
      );
    }
    // Will redirect to board
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="FaSpinner" size={32} className="animate-spin text-white" />
      </div>
    );
  }

  const existingBoardAccountIds = boards.map((b) => b.account_id);
  const userAccounts: UserAccount[] = accounts?.map((a: any) => ({
    account_id: a.id, // Account type uses 'id', not 'account_id'
    account_name: a.name,
    business_name: a.business_name,
    first_name: a.first_name,
    last_name: a.last_name,
  })) || [];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Work Manager</h1>
            <p className="text-white/70 mt-1">
              Manage tasks across your client accounts
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium shadow-lg"
          >
            <Icon name="FaPlus" size={14} />
            Create Board
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Icon name="FaSpinner" size={32} className="animate-spin text-white" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <Icon name="FaExclamationTriangle" size={32} className="mx-auto mb-3 text-red-500" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchBoards}
              className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && boards.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Icon name="FaClipboardList" size={64} className="mx-auto mb-6 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              No Task Boards Yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first task board to start managing work for your client accounts.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
            >
              <Icon name="FaPlus" size={14} />
              Create Your First Board
            </button>
          </div>
        )}

        {/* Boards grid */}
        {!isLoading && !error && boards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/work-manager/${board.id}`}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6 group border border-transparent hover:border-slate-blue/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-slate-blue transition">
                      {getBoardDisplayName(board)}
                    </h3>
                    {board.business_name && board.name && (
                      <p className="text-sm text-gray-500 truncate">
                        {board.business_name}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <div className="w-10 h-10 rounded-full bg-slate-blue/10 flex items-center justify-center group-hover:bg-slate-blue/20 transition">
                      <Icon name="FaTasks" size={18} className="text-slate-blue" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="FaClipboardCheck" size={12} />
                    {board.task_count} {board.task_count === 1 ? "task" : "tasks"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="FaCalendarAlt" size={12} />
                    {new Date(board.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Click to open board
                  </span>
                  <Icon
                    name="FaArrowRight"
                    size={14}
                    className="text-gray-300 group-hover:text-slate-blue transition"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        accounts={userAccounts}
        existingBoardAccountIds={existingBoardAccountIds}
        onBoardCreated={handleBoardCreated}
      />
    </div>
  );
}
