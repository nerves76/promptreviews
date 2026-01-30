"use client";

import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/Icon";
import { useAuth } from "@/auth";
import { apiClient } from "@/utils/apiClient";
import WorkManagerKanban from "@/app/(app)/work-manager/components/WorkManagerKanban";
import WMStatusLabelEditor from "@/app/(app)/work-manager/components/WMStatusLabelEditor";
import CreateTaskModal from "@/app/(app)/work-manager/components/CreateTaskModal";
import WorkManagerDetailsPanel from "@/app/(app)/work-manager/components/WorkManagerDetailsPanel";
import ClientTaskBrowser from "./components/ClientTaskBrowser";
import {
  WMBoard,
  WMTask,
  WMStatusLabels,
  WMTaskStatus,
  DEFAULT_WM_STATUS_LABELS,
  WMUserInfo,
} from "@/types/workManager";

interface AgencyBoardResponse {
  board: WMBoard;
  tasks: WMTask[];
}

interface ClientInfo {
  id: string;
  business_name: string | null;
}

interface AgencyClientsResponse {
  clients: ClientInfo[];
}

export default function AgencyWorkManagerPage() {
  const { user, isInitialized } = useAuth();

  const [board, setBoard] = useState<WMBoard | null>(null);
  const [tasks, setTasks] = useState<WMTask[]>([]);
  const [accountUsers, setAccountUsers] = useState<WMUserInfo[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal/panel states
  const [isLabelEditorOpen, setIsLabelEditorOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<WMTaskStatus>("backlog");
  const [selectedTask, setSelectedTask] = useState<WMTask | null>(null);
  const [isClientBrowserOpen, setIsClientBrowserOpen] = useState(false);

  // Fetch board + tasks
  const fetchBoard = useCallback(async () => {
    try {
      const data = await apiClient.get<AgencyBoardResponse>('/agency/work-manager/board');
      setBoard(data.board);
      setTasks(data.tasks || []);
      return data.board;
    } catch (err: any) {
      console.error("Failed to fetch agency board:", err);
      throw err;
    }
  }, []);

  // Fetch just tasks (for refreshes after reorder etc.)
  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiClient.get<AgencyBoardResponse>('/agency/work-manager/board');
      setTasks(data.tasks || []);
    } catch (err: any) {
      console.error("Failed to refresh tasks:", err);
    }
  }, []);

  // Fetch team members for assignment
  const fetchAccountUsers = useCallback(async () => {
    try {
      interface TeamMember {
        user_id?: string;
        id?: string;
        first_name?: string | null;
        last_name?: string | null;
        email?: string;
        avatar_url?: string | null;
      }
      const response = await apiClient.get<{ members: TeamMember[] }>('/team/members');
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
      console.error("Failed to fetch account users:", err);
    }
  }, []);

  // Fetch client list for browser panel
  const fetchClients = useCallback(async () => {
    try {
      const data = await apiClient.get<AgencyClientsResponse>('/agency/clients');
      setClients((data.clients || []).map(c => ({
        id: c.id,
        business_name: (c as any).business_name || null,
      })));
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isInitialized || !user) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchBoard(),
          fetchAccountUsers(),
          fetchClients(),
        ]);
      } catch (err: any) {
        setError(err.message || "Failed to load work manager");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isInitialized, user, fetchBoard, fetchAccountUsers, fetchClients]);

  // Handle status label edit
  const handleEditLabel = (status: keyof WMStatusLabels) => {
    setIsLabelEditorOpen(true);
  };

  // Save status labels
  const handleSaveLabels = async (labels: WMStatusLabels): Promise<boolean> => {
    if (!board) return false;
    try {
      await apiClient.patch(`/work-manager/boards/${board.id}`, {
        status_labels: labels,
      });
      setBoard(prev => prev ? { ...prev, status_labels: labels } : null);
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

  // Handle task click
  const handleTaskClick = (task: WMTask) => {
    setSelectedTask(task);
  };

  // Handle task updated
  const handleTaskUpdated = async () => {
    await fetchTasks();
    if (selectedTask) {
      try {
        const data = await apiClient.get<AgencyBoardResponse>('/agency/work-manager/board');
        const updated = (data.tasks || []).find(t => t.id === selectedTask.id);
        setSelectedTask(updated || null);
      } catch {
        setSelectedTask(null);
      }
    }
  };

  // Handle client status change from card dropdown
  const handleClientStatusChange = async (taskId: string, newStatus: WMTaskStatus) => {
    try {
      await apiClient.patch('/agency/work-manager/client-task-status', {
        agency_task_id: taskId,
        new_status: newStatus,
      });
      // Refresh to pick up updated linked_task data
      await fetchTasks();
    } catch (err: any) {
      console.error("Failed to update client status:", err);
    }
  };

  const statusLabels = board?.status_labels || DEFAULT_WM_STATUS_LABELS;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Icon name="FaSpinner" className="animate-spin text-white w-8 h-8" size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <Icon name="FaExclamationTriangle" className="text-red-400 w-8 h-8 mx-auto mb-2" size={32} />
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Work Manager</h1>
            <p className="text-sm text-white/70 mt-1">
              Manage agency tasks and pull in work from client boards
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsClientBrowserOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 font-medium transition-colors whitespace-nowrap"
            >
              <Icon name="FaUsers" size={14} />
              Pull from client
            </button>
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium shadow whitespace-nowrap"
            >
              <Icon name="FaPlus" size={14} />
              Add task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {board && (
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <WorkManagerKanban
            tasks={tasks}
            boardId={board.id}
            statusLabels={statusLabels}
            onEditLabel={handleEditLabel}
            onTaskClick={handleTaskClick}
            onTasksReordered={fetchTasks}
            onAddTask={handleAddTask}
            clientStatusChangeHandler={handleClientStatusChange}
          />
        </div>
      )}

      {/* Status Label Editor */}
      <WMStatusLabelEditor
        isOpen={isLabelEditorOpen}
        onClose={() => setIsLabelEditorOpen(false)}
        currentLabels={statusLabels}
        onSave={handleSaveLabels}
      />

      {/* Create Task Modal */}
      {board && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          boardId={board.id}
          statusLabels={statusLabels}
          defaultStatus={createTaskDefaultStatus}
          accountUsers={accountUsers}
          onTaskCreated={fetchTasks}
        />
      )}

      {/* Task Details Drawer */}
      {selectedTask && (
        <TaskDetailsDrawer
          task={selectedTask}
          statusLabels={statusLabels}
          accountUsers={accountUsers}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={() => { fetchTasks(); setSelectedTask(null); }}
        />
      )}

      {/* Client Task Browser */}
      <ClientTaskBrowser
        isOpen={isClientBrowserOpen}
        onClose={() => setIsClientBrowserOpen(false)}
        clients={clients}
        onTasksPulled={fetchTasks}
      />
    </div>
  );
}

// Task Details Drawer wrapper (same pattern as work-manager/[boardId]/page.tsx)
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
      <div className="relative h-full w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl">
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
