"use client";

import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import {
  WMTaskStatus,
  WMStatusLabels,
  WMTaskPriority,
  WM_STATUS_ORDER,
  WM_PRIORITY_COLORS,
  WM_PRIORITY_LABELS,
  DEFAULT_WM_STATUS_LABELS,
} from "@/types/workManager";

interface ClientInfo {
  id: string;
  business_name: string | null;
}

interface ClientTask {
  id: string;
  title: string;
  description: string | null;
  status: WMTaskStatus;
  priority: WMTaskPriority;
  due_date: string | null;
  already_linked: boolean;
}

interface ClientTasksResponse {
  client_name: string | null;
  status_labels: WMStatusLabels;
  tasks: ClientTask[];
}

interface ClientTaskBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientInfo[];
  onTasksPulled: () => void;
}

export default function ClientTaskBrowser({
  isOpen,
  onClose,
  clients,
  onTasksPulled,
}: ClientTaskBrowserProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientTasks, setClientTasks] = useState<ClientTask[]>([]);
  const [clientName, setClientName] = useState<string | null>(null);
  const [statusLabels, setStatusLabels] = useState<WMStatusLabels>(DEFAULT_WM_STATUS_LABELS);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedClientId(null);
      setClientTasks([]);
      setSelectedTaskIds(new Set());
      setError(null);
    }
  }, [isOpen]);

  // Fetch tasks when a client is selected
  useEffect(() => {
    if (!selectedClientId) {
      setClientTasks([]);
      setSelectedTaskIds(new Set());
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<ClientTasksResponse>(
          `/agency/work-manager/client-tasks?clientAccountId=${selectedClientId}`
        );
        setClientTasks(data.tasks || []);
        setClientName(data.client_name);
        setStatusLabels(data.status_labels || DEFAULT_WM_STATUS_LABELS);
        setSelectedTaskIds(new Set());
      } catch (err: any) {
        console.error("Error fetching client tasks:", err);
        setError(err.message || "Failed to load client tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [selectedClientId]);

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handlePull = async () => {
    if (!selectedClientId || selectedTaskIds.size === 0) return;

    try {
      setPulling(true);
      setError(null);
      await apiClient.post('/agency/work-manager/pull-tasks', {
        client_account_id: selectedClientId,
        task_ids: Array.from(selectedTaskIds),
      });

      onTasksPulled();
      onClose();
    } catch (err: any) {
      console.error("Error pulling tasks:", err);
      setError(err.message || "Failed to pull tasks");
    } finally {
      setPulling(false);
    }
  };

  // Group tasks by status
  const tasksByStatus = WM_STATUS_ORDER.reduce<Record<WMTaskStatus, ClientTask[]>>((acc, status) => {
    acc[status] = clientTasks.filter(t => t.status === status);
    return acc;
  }, {} as Record<WMTaskStatus, ClientTask[]>);

  const selectableCount = clientTasks.filter(t => !t.already_linked).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); } }}
        aria-label="Close client task browser"
      />

      {/* Panel */}
      <div className="relative h-full w-full max-w-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Pull from client</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            aria-label="Close"
          >
            <Icon name="FaTimes" size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Client list */}
          <div className="w-56 border-r border-gray-200 overflow-y-auto bg-gray-50 flex-shrink-0">
            <div className="p-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Clients</p>
            </div>
            {clients.length === 0 ? (
              <p className="px-3 text-sm text-gray-500">No clients</p>
            ) : (
              clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    selectedClientId === client.id
                      ? 'bg-slate-blue/10 text-slate-blue font-medium border-r-2 border-slate-blue'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="FaBuilding" size={12} className="text-gray-500 flex-shrink-0" />
                    <span className="truncate">{client.business_name || 'Unnamed'}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Tasks area */}
          <div className="flex-1 overflow-y-auto">
            {!selectedClientId ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Icon name="FaArrowLeft" size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Select a client to browse their tasks</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <Icon name="FaSpinner" size={24} className="animate-spin text-gray-500" />
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <Icon name="FaExclamationTriangle" size={24} className="mx-auto mb-2 text-red-400" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : clientTasks.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Icon name="FaInfoCircle" size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">{clientName || 'This client'} has no tasks yet</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {WM_STATUS_ORDER.map(status => {
                  const tasks = tasksByStatus[status];
                  if (tasks.length === 0) return null;

                  return (
                    <div key={status}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {statusLabels[status]} ({tasks.length})
                      </h3>
                      <div className="space-y-1.5">
                        {tasks.map(task => {
                          const isLinked = task.already_linked;
                          const isSelected = selectedTaskIds.has(task.id);
                          const priorityColors = WM_PRIORITY_COLORS[task.priority] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };

                          return (
                            <label
                              key={task.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isLinked
                                  ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-slate-blue/5 border-slate-blue/30'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isLinked}
                                onChange={() => !isLinked && toggleTask(task.id)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-slate-blue focus:ring-slate-blue disabled:opacity-50"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}>
                                    {WM_PRIORITY_LABELS[task.priority] || 'Medium'}
                                  </span>
                                  {isLinked && (
                                    <span className="text-[10px] text-gray-500 italic">Already pulled</span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {selectedClientId && selectableCount > 0 && (
          <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-white">
            <p className="text-sm text-gray-600">
              {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
            </p>
            <button
              onClick={handlePull}
              disabled={selectedTaskIds.size === 0 || pulling}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
            >
              {pulling ? (
                <>
                  <Icon name="FaSpinner" size={14} className="animate-spin" />
                  Pulling...
                </>
              ) : (
                <>
                  <Icon name="FaArrowRight" size={14} />
                  Pull selected
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
