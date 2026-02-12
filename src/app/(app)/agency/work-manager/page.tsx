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
import BoardSelector, { BoardContext } from "./components/BoardSelector";
import ClientBoardCreateTaskModal from "./components/ClientBoardCreateTaskModal";
import WorkManagerTabs from "@/app/(app)/work-manager/components/WorkManagerTabs";
import ResourcesView from "@/app/(app)/work-manager/components/ResourcesView";
import {
  WMBoard,
  WMTask,
  WMStatusLabels,
  WMTaskStatus,
  DEFAULT_WM_STATUS_LABELS,
  WMUserInfo,
  WMViewTab,
} from "@/types/workManager";

interface AgencyBoardResponse {
  board: WMBoard;
  tasks: WMTask[];
}

interface ClientBoardResponse {
  board: WMBoard;
  tasks: WMTask[];
  accountUsers: WMUserInfo[];
  client_name: string | null;
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

  // Board context state
  const [boardContext, setBoardContext] = useState<BoardContext>({ type: "agency" });

  // View tab state
  const [activeTab, setActiveTab] = useState<WMViewTab>("board");

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

  // Fetch agency board + tasks
  const fetchAgencyBoard = useCallback(async () => {
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

  // Fetch client board + tasks
  const fetchClientBoard = useCallback(async (clientId: string) => {
    try {
      const data = await apiClient.get<ClientBoardResponse>(
        `/agency/work-manager/client-board?clientAccountId=${clientId}`
      );
      setBoard(data.board);
      setTasks(data.tasks || []);
      setAccountUsers(data.accountUsers || []);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch client board:", err);
      throw err;
    }
  }, []);

  // Fetch just tasks (for refreshes after reorder etc.)
  const fetchTasks = useCallback(async () => {
    try {
      if (boardContext.type === "agency") {
        const data = await apiClient.get<AgencyBoardResponse>('/agency/work-manager/board');
        setTasks(data.tasks || []);
      } else {
        const data = await apiClient.get<ClientBoardResponse>(
          `/agency/work-manager/client-board?clientAccountId=${boardContext.clientId}`
        );
        setTasks(data.tasks || []);
      }
    } catch (err: any) {
      console.error("Failed to refresh tasks:", err);
    }
  }, [boardContext]);

  // Fetch agency team members AND client account users for assignment/mentions
  const fetchAgencyTeamMembers = useCallback(async () => {
    try {
      interface TeamMember {
        user_id?: string;
        id?: string;
        first_name?: string | null;
        last_name?: string | null;
        email?: string;
        avatar_url?: string | null;
      }

      // Fetch agency team members
      const teamResponse = await apiClient.get<{ members: TeamMember[] }>('/team/members');
      const agencyMembers = (teamResponse.members || []).map((m): WMUserInfo => ({
        id: m.user_id || m.id || '',
        first_name: m.first_name ?? null,
        last_name: m.last_name ?? null,
        email: m.email || '',
        avatar_url: m.avatar_url ?? null,
      }));

      // Fetch users from all managed client accounts
      interface ClientUsersResponse {
        users: Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string;
          avatar_url: string | null;
          account_name: string | null;
        }>;
      }
      let clientUsers: WMUserInfo[] = [];
      try {
        const clientUsersResponse = await apiClient.get<ClientUsersResponse>('/agency/client-users');
        clientUsers = (clientUsersResponse.users || []).map((u): WMUserInfo => ({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          avatar_url: u.avatar_url,
        }));
      } catch {
        // Endpoint may not exist yet, continue with just agency members
      }

      // Combine and dedupe by user ID
      const allUsers = [...agencyMembers];
      const existingIds = new Set(agencyMembers.map(m => m.id));
      for (const clientUser of clientUsers) {
        if (!existingIds.has(clientUser.id)) {
          allUsers.push(clientUser);
          existingIds.add(clientUser.id);
        }
      }

      setAccountUsers(allUsers);
    } catch (err) {
      console.error("Failed to fetch account users:", err);
    }
  }, []);

  // Fetch client list for browser panel and selector
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
          fetchAgencyBoard(),
          fetchAgencyTeamMembers(),
          fetchClients(),
        ]);
      } catch (err: any) {
        setError(err.message || "Failed to load work manager");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isInitialized, user, fetchAgencyBoard, fetchAgencyTeamMembers, fetchClients]);

  // Handle board context change
  const handleBoardContextChange = useCallback(async (newContext: BoardContext) => {
    if (
      newContext.type === boardContext.type &&
      (newContext.type === "agency" ||
        (newContext.type === "client" && boardContext.type === "client" && newContext.clientId === boardContext.clientId))
    ) {
      return; // No change
    }

    setIsLoading(true);
    setError(null);
    setSelectedTask(null); // Close any open task detail panel

    try {
      if (newContext.type === "agency") {
        await fetchAgencyBoard();
        await fetchAgencyTeamMembers();
      } else {
        await fetchClientBoard(newContext.clientId);
      }
      setBoardContext(newContext);
    } catch (err: any) {
      setError(err.message || "Failed to load board");
    } finally {
      setIsLoading(false);
    }
  }, [boardContext, fetchAgencyBoard, fetchAgencyTeamMembers, fetchClientBoard]);

  // Handle status label edit
  const handleEditLabel = () => {
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
        if (boardContext.type === "agency") {
          const data = await apiClient.get<AgencyBoardResponse>('/agency/work-manager/board');
          const updated = (data.tasks || []).find(t => t.id === selectedTask.id);
          setSelectedTask(updated || null);
        } else {
          const data = await apiClient.get<ClientBoardResponse>(
            `/agency/work-manager/client-board?clientAccountId=${boardContext.clientId}`
          );
          const updated = (data.tasks || []).find(t => t.id === selectedTask.id);
          setSelectedTask(updated || null);
        }
      } catch {
        setSelectedTask(null);
      }
    }
  };

  // Handle client status change from card dropdown (agency board only)
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

  // Custom reorder handler for client boards
  const handleTasksReordered = useCallback(async () => {
    // The WorkManagerKanban calls the standard reorder endpoint
    // For client boards, we need to intercept and use a different endpoint
    // This is handled by providing a custom reorder function
    await fetchTasks();
  }, [fetchTasks]);

  const statusLabels = board?.status_labels || DEFAULT_WM_STATUS_LABELS;
  const isAgencyBoard = boardContext.type === "agency";

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
      {/* Client Board Banner */}
      {!isAgencyBoard && (
        <div className="bg-amber-500/20 border-b border-amber-400/30">
          <div className="max-w-[1550px] mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Icon name="FaBuilding" size={16} className="text-amber-300" />
                <span className="text-amber-100 text-sm">
                  Working on <strong>{boardContext.clientName}</strong>&apos;s board
                </span>
                <span className="text-amber-200/60 text-xs">
                  Changes sync directly to client
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={board?.show_time_to_client ?? false}
                  onChange={async () => {
                    if (!board) return;
                    const newValue = !(board.show_time_to_client ?? false);
                    try {
                      await apiClient.patch(`/work-manager/boards/${board.id}`, {
                        show_time_to_client: newValue,
                      });
                      setBoard(prev => prev ? { ...prev, show_time_to_client: newValue } : null);
                    } catch (err) {
                      console.error("Failed to toggle show_time_to_client:", err);
                    }
                  }}
                  className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-amber-100 text-sm whitespace-nowrap">Show time to client</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-[1550px] mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-white">Work Manager</h1>
            <WorkManagerTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Board Selector */}
            <BoardSelector
              currentContext={boardContext}
              clients={clients}
              onChange={handleBoardContextChange}
            />

            {/* Pull from client - only on agency board and board tab */}
            {isAgencyBoard && activeTab === "board" && (
              <button
                onClick={() => setIsClientBrowserOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 font-medium transition-colors whitespace-nowrap"
              >
                <Icon name="FaUsers" size={14} />
                Pull from client
              </button>
            )}

            {activeTab === "board" && (
              <button
                onClick={() => setIsCreateTaskOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium shadow whitespace-nowrap"
              >
                <Icon name="FaPlus" size={14} />
                Add task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {board && (
        <div className="max-w-[1550px] mx-auto px-6 py-6">
          {activeTab === "board" ? (
            <WorkManagerKanban
              tasks={tasks}
              boardId={board.id}
              statusLabels={statusLabels}
              onEditLabel={handleEditLabel}
              onTaskClick={handleTaskClick}
              onTasksReordered={handleTasksReordered}
              onAddTask={handleAddTask}
              clientStatusChangeHandler={isAgencyBoard ? handleClientStatusChange : undefined}
              customReorderEndpoint={
                boardContext.type === "client"
                  ? {
                      endpoint: "/agency/work-manager/client-board/tasks/reorder",
                      extraPayload: { client_account_id: boardContext.clientId },
                    }
                  : undefined
              }
              showTimeSpent={true}
            />
          ) : (
            <ResourcesView boardId={board.id} />
          )}
        </div>
      )}

      {/* Status Label Editor */}
      <WMStatusLabelEditor
        isOpen={isLabelEditorOpen}
        onClose={() => setIsLabelEditorOpen(false)}
        currentLabels={statusLabels}
        onSave={handleSaveLabels}
      />

      {/* Create Task Modal - different based on context */}
      {board && isAgencyBoard && (
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

      {/* Create Task Modal for Client Board */}
      {board && boardContext.type === "client" && (
        <ClientBoardCreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          boardId={board.id}
          clientAccountId={boardContext.clientId}
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
          showTimeEntries={true}
          showTimeEntriesDetail={true}
          currentUserId={user?.id}
        />
      )}

      {/* Client Task Browser - only available from agency board */}
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
  showTimeEntries,
  showTimeEntriesDetail,
  currentUserId,
}: {
  task: WMTask;
  statusLabels: WMStatusLabels;
  accountUsers: WMUserInfo[];
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
  showTimeEntries?: boolean;
  showTimeEntriesDetail?: boolean;
  currentUserId?: string;
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
          showTimeEntries={showTimeEntries}
          showTimeEntriesDetail={showTimeEntriesDetail}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
