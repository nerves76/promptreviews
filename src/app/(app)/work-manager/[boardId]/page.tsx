"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useAuth } from "@/auth";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import WorkManagerKanban from "../components/WorkManagerKanban";
import WMStatusLabelEditor from "../components/WMStatusLabelEditor";
import CreateTaskModal from "../components/CreateTaskModal";
import WorkManagerDetailsPanel from "../components/WorkManagerDetailsPanel";
import LibraryBrowser from "../components/LibraryBrowser";
import WorkManagerTabs from "../components/WorkManagerTabs";
import ResourcesView from "../components/ResourcesView";
import {
  WMBoard,
  WMTask,
  WMStatusLabels,
  WMTaskStatus,
  DEFAULT_WM_STATUS_LABELS,
  WMUserInfo,
  WMViewTab,
} from "@/types/workManager";

export default function WorkManagerBoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;
  const { user, isInitialized } = useAuth();
  const { selectedAccountId } = useAccountData();

  const [board, setBoard] = useState<WMBoard | null>(null);
  const [tasks, setTasks] = useState<WMTask[]>([]);
  const [accountUsers, setAccountUsers] = useState<WMUserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View tab state
  const [activeTab, setActiveTab] = useState<WMViewTab>("board");

  // Modal states
  const [isLabelEditorOpen, setIsLabelEditorOpen] = useState(false);
  const [editingLabelStatus, setEditingLabelStatus] = useState<keyof WMStatusLabels | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<WMTaskStatus>("backlog");
  const [selectedTask, setSelectedTask] = useState<WMTask | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Fetch board data
  const fetchBoard = useCallback(async () => {
    try {
      const response = await apiClient.get<{ board: WMBoard }>(`/work-manager/boards/${boardId}`);
      setBoard(response.board);
      return response.board;
    } catch (err: any) {
      console.error("Failed to fetch board:", err);
      throw err;
    }
  }, [boardId]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const response = await apiClient.get<{ tasks: WMTask[] }>(`/work-manager/tasks?boardId=${boardId}`);
      setTasks(response.tasks || []);
    } catch (err: any) {
      console.error("Failed to fetch tasks:", err);
      throw err;
    }
  }, [boardId]);

  // Fetch account users for assignment
  const fetchAccountUsers = useCallback(async (accountId: string) => {
    try {
      // This would need an API endpoint to get account users
      // For now, we'll use a simple approach
      interface TeamMember {
        user_id?: string;
        id?: string;
        first_name?: string | null;
        last_name?: string | null;
        email?: string;
        avatar_url?: string | null;
      }
      const response = await apiClient.get<{ members: TeamMember[] }>(`/team/members?accountId=${accountId}`);
      if (response.members) {
        setAccountUsers(response.members.map((m): WMUserInfo => ({
          id: m.user_id || m.id || '',
          first_name: m.first_name ?? null,
          last_name: m.last_name ?? null,
          email: m.email || '',
          avatar_url: m.avatar_url ?? null,
        })));
      }
    } catch (err) {
      // Silently fail - assignment dropdown just won't show users
      console.error("Failed to fetch account users:", err);
    }
  }, []);

  // Redirect to correct board when user switches accounts
  useEffect(() => {
    if (!selectedAccountId || !board) return;
    if (board.account_id !== selectedAccountId) {
      // Board belongs to a different account — redirect to landing page
      // which will ensure/load the correct board for the selected account
      router.replace("/work-manager");
    }
  }, [selectedAccountId, board, router]);

  // Initial load
  useEffect(() => {
    if (!isInitialized || !user) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const boardData = await fetchBoard();
        await fetchTasks();
        if (boardData?.account_id) {
          await fetchAccountUsers(boardData.account_id);
        }
      } catch (err: any) {
        // If board not found (likely wrong account), redirect to landing page
        // which will load the correct board for the selected account
        if (err.message?.includes("Board not found") || err.message?.includes("not found")) {
          router.replace("/work-manager");
          return;
        }
        setError(err.message || "Failed to load board");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isInitialized, user, fetchBoard, fetchTasks, fetchAccountUsers, router]);

  // Handle status label edit
  const handleEditLabel = (status: keyof WMStatusLabels) => {
    setEditingLabelStatus(status);
    setIsLabelEditorOpen(true);
  };

  // Save status labels
  const handleSaveLabels = async (labels: WMStatusLabels): Promise<boolean> => {
    try {
      await apiClient.patch(`/work-manager/boards/${boardId}`, {
        status_labels: labels,
      });
      setBoard((prev) => prev ? { ...prev, status_labels: labels } : null);
      return true;
    } catch (err) {
      console.error("Failed to save labels:", err);
      return false;
    }
  };

  // Handle add task
  const handleAddTask = (status: WMTaskStatus) => {
    setCreateTaskDefaultStatus(status);
    setIsCreateTaskOpen(true);
  };

  // Handle task created
  const handleTaskCreated = () => {
    fetchTasks();
  };

  // Handle task click - open details panel
  const handleTaskClick = (task: WMTask) => {
    setSelectedTask(task);
  };

  // Handle task updated - refresh tasks and update selected task
  const handleTaskUpdated = async () => {
    await fetchTasks();
    // Refresh selected task data
    if (selectedTask) {
      try {
        const response = await apiClient.get<{ task: WMTask }>(`/work-manager/tasks/${selectedTask.id}`);
        setSelectedTask(response.task);
      } catch (err) {
        // Task may have been deleted
        setSelectedTask(null);
      }
    }
  };

  // Handle task deleted
  const handleTaskDeleted = () => {
    fetchTasks();
    setSelectedTask(null);
  };

  const statusLabels = board?.status_labels || DEFAULT_WM_STATUS_LABELS;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="FaSpinner" size={32} className="animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
            <Icon name="FaExclamationTriangle" size={32} className="mx-auto mb-3 text-red-400" />
            <h2 className="text-lg font-bold text-white mb-2">Error Loading Board</h2>
            <p className="text-white/80 mb-4">{error}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
              >
                Try Again
              </button>
              <Link
                href="/work-manager"
                className="px-4 py-2 bg-white text-slate-blue rounded-lg hover:bg-white/90"
              >
                Back to Boards
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          <Icon name="FaQuestionCircle" size={64} className="mx-auto mb-6 text-white/30" />
          <h2 className="text-xl font-bold text-white mb-3">Board Not Found</h2>
          <p className="text-white/70 mb-6">
            This board may have been deleted or you don't have access.
          </p>
          <Link
            href="/work-manager"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-blue rounded-lg hover:bg-white/90 font-medium"
          >
            <Icon name="FaArrowLeft" size={14} />
            Back to Boards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-white">Work Manager</h1>
            <WorkManagerTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "board" && (
              <>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 font-medium transition-colors whitespace-nowrap"
                >
                  <Icon name="FaBookmark" size={14} />
                  Browse library
                </button>
                <button
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium shadow whitespace-nowrap"
                >
                  <Icon name="FaPlus" size={14} />
                  Add task
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {activeTab === "board" ? (
          <WorkManagerKanban
            tasks={tasks}
            boardId={boardId}
            statusLabels={statusLabels}
            onEditLabel={handleEditLabel}
            onTaskClick={handleTaskClick}
            onTasksReordered={fetchTasks}
            onAddTask={handleAddTask}
          />
        ) : (
          <ResourcesView boardId={boardId} />
        )}
      </div>

      {/* Status Label Editor */}
      <WMStatusLabelEditor
        isOpen={isLabelEditorOpen}
        onClose={() => {
          setIsLabelEditorOpen(false);
          setEditingLabelStatus(null);
        }}
        currentLabels={statusLabels}
        onSave={handleSaveLabels}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        boardId={boardId}
        statusLabels={statusLabels}
        defaultStatus={createTaskDefaultStatus}
        accountUsers={accountUsers}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Details Drawer */}
      {selectedTask && (
        <TaskDetailsDrawer
          task={selectedTask}
          statusLabels={statusLabels}
          accountUsers={accountUsers}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}

      {/* Library Browser */}
      <LibraryBrowser
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onTaskAdded={fetchTasks}
      />
    </div>
  );
}

// Task Details Drawer wrapper component
function TaskDetailsDrawer({
  task,
  statusLabels,
  accountUsers,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: {
  task: WMTask;
  statusLabels: WMStatusLabels;
  accountUsers: WMUserInfo[];
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
        aria-label="Close details overlay"
      />
      <div className="relative h-full w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl transform transition-transform duration-300 translate-x-0">
        <WorkManagerDetailsPanel
          task={task}
          statusLabels={statusLabels}
          accountUsers={accountUsers}
          onClose={onClose}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={onTaskDeleted}
        />
      </div>
    </div>
  );
}
