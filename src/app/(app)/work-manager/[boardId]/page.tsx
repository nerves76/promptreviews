"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useAuth } from "@/auth";
import { apiClient } from "@/utils/apiClient";
import WorkManagerKanban from "../components/WorkManagerKanban";
import WMStatusLabelEditor from "../components/WMStatusLabelEditor";
import CreateTaskModal from "../components/CreateTaskModal";
import WorkManagerDetailsPanel from "../components/WorkManagerDetailsPanel";
import {
  WMBoard,
  WMTask,
  WMStatusLabels,
  WMTaskStatus,
  DEFAULT_WM_STATUS_LABELS,
  WMUserInfo,
} from "@/types/workManager";

export default function WorkManagerBoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;
  const { user, accounts, isInitialized } = useAuth();

  const [board, setBoard] = useState<WMBoard | null>(null);
  const [tasks, setTasks] = useState<WMTask[]>([]);
  const [accountUsers, setAccountUsers] = useState<WMUserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isLabelEditorOpen, setIsLabelEditorOpen] = useState(false);
  const [editingLabelStatus, setEditingLabelStatus] = useState<keyof WMStatusLabels | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<WMTaskStatus>("backlog");
  const [selectedTask, setSelectedTask] = useState<WMTask | null>(null);

  const hasMultipleAccounts = accounts && accounts.length > 1;

  // Fetch board data
  const fetchBoard = useCallback(async () => {
    try {
      const response = await apiClient.get(`/work-manager/boards/${boardId}`);
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
      const response = await apiClient.get(`/work-manager/tasks?boardId=${boardId}`);
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
      const response = await apiClient.get(`/team/members?accountId=${accountId}`);
      if (response.members) {
        setAccountUsers(response.members.map((m: any) => ({
          id: m.user_id || m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          email: m.email,
          avatar_url: m.avatar_url,
        })));
      }
    } catch (err) {
      // Silently fail - assignment dropdown just won't show users
      console.error("Failed to fetch account users:", err);
    }
  }, []);

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
        setError(err.message || "Failed to load board");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isInitialized, user, fetchBoard, fetchTasks, fetchAccountUsers]);

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
        const response = await apiClient.get(`/work-manager/tasks/${selectedTask.id}`);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Icon name="FaSpinner" size={32} className="animate-spin text-slate-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <Icon name="FaExclamationTriangle" size={32} className="mx-auto mb-3 text-red-500" />
            <h2 className="text-lg font-bold text-red-900 mb-2">Error Loading Board</h2>
            <p className="text-red-800 mb-4">{error}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
              >
                Try Again
              </button>
              <Link
                href="/work-manager"
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          <Icon name="FaQuestionCircle" size={64} className="mx-auto mb-6 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-3">Board Not Found</h2>
          <p className="text-gray-600 mb-6">
            This board may have been deleted or you don't have access.
          </p>
          <Link
            href="/work-manager"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
          >
            <Icon name="FaArrowLeft" size={14} />
            Back to Boards
          </Link>
        </div>
      </div>
    );
  }

  const boardDisplayName = board.name || board.business_name || board.account_name || "Task Board";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {hasMultipleAccounts && (
                <Link
                  href="/work-manager"
                  className="text-gray-500 hover:text-gray-700 transition"
                  title="Back to boards"
                >
                  <Icon name="FaArrowLeft" size={18} />
                </Link>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{boardDisplayName}</h1>
                {board.business_name && board.name && (
                  <p className="text-sm text-gray-500">{board.business_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateTaskOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium shadow"
              >
                <Icon name="FaPlus" size={14} />
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <WorkManagerKanban
          tasks={tasks}
          boardId={boardId}
          statusLabels={statusLabels}
          onEditLabel={handleEditLabel}
          onTaskClick={handleTaskClick}
          onTasksReordered={fetchTasks}
          onAddTask={handleAddTask}
        />
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
      <div className="relative h-full w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 translate-x-0">
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
