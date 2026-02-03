"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/app/(app)/components/ui/modal";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import {
  WMTaskStatus,
  WMTaskPriority,
  WMStatusLabels,
  WM_PRIORITY_LABELS,
  WMUserInfo,
} from "@/types/workManager";

interface ClientBoardCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  clientAccountId: string;
  statusLabels: WMStatusLabels;
  defaultStatus?: WMTaskStatus;
  accountUsers: WMUserInfo[];
  onTaskCreated: () => void;
}

export default function ClientBoardCreateTaskModal({
  isOpen,
  onClose,
  boardId,
  clientAccountId,
  statusLabels,
  defaultStatus = "backlog",
  accountUsers,
  onTaskCreated,
}: ClientBoardCreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<WMTaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<WMTaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setPriority("medium");
      setDueDate("");
      setAssignedTo("");
      setError(null);
    }
  }, [isOpen, defaultStatus]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Use the agency client board task creation endpoint
      await apiClient.post("/agency/work-manager/client-board/tasks", {
        client_account_id: clientAccountId,
        board_id: boardId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        due_date: dueDate || undefined,
        assigned_to: assignedTo || undefined,
      });

      onTaskCreated();
      onClose();
    } catch (err: any) {
      console.error("Failed to create task:", err);
      setError(err.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create task on client board" size="lg">
      <p className="text-sm text-gray-600 -mt-2 mb-4">
        This task will be added directly to the client&apos;s board
      </p>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            maxLength={200}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue resize-none"
          />
        </div>

        {/* Status and Priority row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as WMTaskStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as WMTaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            >
              {Object.entries(WM_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
          />
        </div>

        {/* Assignee */}
        {accountUsers.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="assignedTo" className="text-sm font-medium text-gray-700">
              Assign to (client team)
            </label>
            <select
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            >
              <option value="">Unassigned</option>
              {accountUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name || user.last_name
                    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                    : user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <Icon name="FaExclamationTriangle" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <Modal.Footer>
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !title.trim()}
          className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 whitespace-nowrap"
        >
          {isCreating && (
            <Icon name="FaSpinner" size={14} className="animate-spin" />
          )}
          {isCreating ? "Creating..." : "Create task"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
