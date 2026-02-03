"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow, format, isPast, isToday } from "date-fns";
import Icon, { IconName } from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import {
  WMTask,
  WMTaskAction,
  WMTaskStatus,
  WMTaskPriority,
  WMStatusLabels,
  WM_PRIORITY_LABELS,
  WM_PRIORITY_COLORS,
  WMUserInfo,
  WMLink,
} from "@/types/workManager";
import MentionInput from "./MentionInput";
import LinksSection from "./LinksSection";

interface WorkManagerDetailsPanelProps {
  task: WMTask;
  statusLabels: WMStatusLabels;
  accountUsers: WMUserInfo[];
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export default function WorkManagerDetailsPanel({
  task,
  statusLabels,
  accountUsers,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: WorkManagerDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || "");
  const [editedStatus, setEditedStatus] = useState<WMTaskStatus>(task.status);
  const [editedPriority, setEditedPriority] = useState<WMTaskPriority>(task.priority);
  const [editedDueDate, setEditedDueDate] = useState(task.due_date ? task.due_date.split("T")[0] : "");
  const [editedAssignee, setEditedAssignee] = useState(task.assigned_to || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Activity log
  const [actions, setActions] = useState<WMTaskAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Links
  const [links, setLinks] = useState<WMLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);

  // Fetch activity log
  useEffect(() => {
    const fetchActions = async () => {
      try {
        setActionsLoading(true);
        const response = await apiClient.get<{ actions: WMTaskAction[] }>(`/work-manager/task-actions?taskId=${task.id}`);
        setActions(response.actions || []);
      } catch (err) {
        console.error("Failed to fetch task actions:", err);
      } finally {
        setActionsLoading(false);
      }
    };
    fetchActions();
  }, [task.id]);

  // Fetch links
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLinksLoading(true);
        const response = await apiClient.get<{ links: WMLink[] }>(`/work-manager/links?taskId=${task.id}`);
        setLinks(response.links || []);
      } catch (err) {
        console.error("Failed to fetch task links:", err);
      } finally {
        setLinksLoading(false);
      }
    };
    fetchLinks();
  }, [task.id]);

  const handleLinksChanged = async () => {
    try {
      const response = await apiClient.get<{ links: WMLink[] }>(`/work-manager/links?taskId=${task.id}`);
      setLinks(response.links || []);
    } catch (err) {
      console.error("Failed to refresh links:", err);
    }
  };

  // Reset form when task changes
  useEffect(() => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || "");
    setEditedStatus(task.status);
    setEditedPriority(task.priority);
    setEditedDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    setEditedAssignee(task.assigned_to || "");
    setIsEditing(false);
    setError(null);
  }, [task]);

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.patch(`/work-manager/tasks/${task.id}`, {
        title: editedTitle.trim(),
        description: editedDescription.trim() || null,
        status: editedStatus,
        priority: editedPriority,
        due_date: editedDueDate || null,
        assigned_to: editedAssignee || null,
      });
      setIsEditing(false);
      onTaskUpdated();
    } catch (err: any) {
      console.error("Failed to update task:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.delete(`/work-manager/tasks/${task.id}`);
      onTaskDeleted();
      onClose();
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      setError(err.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNote = async (content: string, mentionedUserIds: string[]) => {
    if (!content.trim()) return;

    setIsAddingNote(true);
    try {
      const response = await apiClient.post<{ action: WMTaskAction }>("/work-manager/task-actions", {
        task_id: task.id,
        activity_type: "note",
        content: content.trim(),
        mentioned_user_ids: mentionedUserIds,
      });
      setActions((prev) => [response.action, ...prev]);
      setNewNote("");
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const priorityColors = WM_PRIORITY_COLORS[task.priority];

  // Due date display
  let dueDateStatus: "overdue" | "today" | "upcoming" | "none" = "none";
  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    if (isPast(dueDate) && task.status !== "done") {
      dueDateStatus = "overdue";
    } else if (isToday(dueDate)) {
      dueDateStatus = "today";
    } else {
      dueDateStatus = "upcoming";
    }
  }

  const getActionIcon = (type: string): IconName => {
    switch (type) {
      case "note":
        return "FaStickyNote";
      case "status_change":
        return "FaCoins";
      case "assignment_change":
        return "FaUser";
      case "priority_change":
        return "FaExclamationTriangle";
      case "due_date_change":
        return "FaCalendarAlt";
      case "created":
        return "FaPlus";
      default:
        return "FaCircle";
    }
  };

  const getActionDescription = (action: WMTaskAction): string => {
    const metadata = action.metadata as any;
    switch (action.activity_type) {
      case "note":
        return action.content || "";
      case "status_change":
        return `Status changed from "${statusLabels[metadata?.from as keyof WMStatusLabels] || metadata?.from}" to "${statusLabels[metadata?.to as keyof WMStatusLabels] || metadata?.to}"`;
      case "assignment_change":
        return metadata?.to ? "Task assigned" : "Task unassigned";
      case "priority_change":
        return `Priority changed from ${WM_PRIORITY_LABELS[metadata?.from as WMTaskPriority] || metadata?.from} to ${WM_PRIORITY_LABELS[metadata?.to as WMTaskPriority] || metadata?.to}`;
      case "due_date_change":
        return metadata?.to ? `Due date set to ${format(new Date(metadata.to), "MMM d, yyyy")}` : "Due date removed";
      case "created":
        return action.content || "Task created";
      default:
        return action.content || "Activity recorded";
    }
  };

  return (
    <div className="flex flex-col h-full backdrop-blur-xl shadow-2xl">
      {/* Close button */}
      <div className="flex justify-end px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-white hover:text-white/80 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close details"
        >
          <Icon name="FaTimes" size={18} />
        </button>
      </div>

      {/* Header section on glass card */}
      <div className="mx-4 p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase text-gray-500 mb-1">Task</p>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-xl font-semibold text-gray-900 border-b border-gray-300 focus:border-slate-blue focus:outline-none py-1 bg-transparent"
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {task.title}
            </h2>
          )}
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
        {isEditing ? (
          <>
            <select
              value={editedStatus}
              onChange={(e) => setEditedStatus(e.target.value as WMTaskStatus)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={editedPriority}
              onChange={(e) => setEditedPriority(e.target.value as WMTaskPriority)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {Object.entries(WM_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
              <Icon name="FaColumns" size={10} />
              {statusLabels[task.status]}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border whitespace-nowrap ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}>
              {task.priority === "high" && <Icon name="FaCaretUp" size={10} />}
              {task.priority === "low" && <Icon name="FaCaretDown" size={10} />}
              {WM_PRIORITY_LABELS[task.priority]}
            </span>
          </>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white text-gray-700 border border-gray-200 whitespace-nowrap">
          <Icon name="FaCalendarAlt" size={10} />
          Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Due Date */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Due Date</h3>
          {isEditing ? (
            <input
              type="date"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg w-full"
            />
          ) : task.due_date ? (
            <div className={`flex items-center gap-2 text-sm ${
              dueDateStatus === "overdue" ? "text-red-600" :
              dueDateStatus === "today" ? "text-amber-600" : "text-gray-700"
            }`}>
              <Icon name="FaCalendarAlt" size={14} />
              <span>
                {format(new Date(task.due_date), "MMMM d, yyyy")}
                {dueDateStatus === "overdue" && " (Overdue)"}
                {dueDateStatus === "today" && " (Due today)"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No due date set</p>
          )}
        </section>

        {/* Assignee */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Assigned To</h3>
          {isEditing ? (
            <select
              value={editedAssignee}
              onChange={(e) => setEditedAssignee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg w-full"
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
          ) : task.assignee ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Icon name="FaUser" size={14} className="text-gray-500" />
              <span>
                {task.assignee.first_name || task.assignee.last_name
                  ? `${task.assignee.first_name || ""} ${task.assignee.last_name || ""}`.trim()
                  : task.assignee.email}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No one assigned</p>
          )}
        </section>

        {/* Description */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Description</h3>
          {isEditing ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
            />
          ) : task.description ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">No description</p>
          )}
        </section>

        {/* Links */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
          {linksLoading ? (
            <div className="flex items-center justify-center py-4">
              <Icon name="FaSpinner" size={16} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <LinksSection
              links={links}
              taskId={task.id}
              onLinksChanged={handleLinksChanged}
              readOnly={isEditing}
            />
          )}
        </section>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <Icon name="FaExclamationTriangle" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-blue text-white rounded hover:bg-slate-blue/90 text-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <Icon name="FaSpinner" size={12} className="animate-spin" />
                  ) : (
                    <Icon name="FaCheck" size={12} />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                >
                  <Icon name="FaEdit" size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Icon name="FaSpinner" size={12} className="animate-spin" />
                  ) : (
                    <Icon name="FaTrash" size={12} />
                  )}
                  Delete
                </button>
              </>
            )}
          </div>
        </section>

        {/* Activity Timeline */}
        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Activity</h3>

          {/* Add Note with @mention support */}
          <MentionInput
            value={newNote}
            onChange={setNewNote}
            onSubmit={handleAddNote}
            placeholder="Add a comment... (type @ to mention)"
            users={accountUsers}
            disabled={isAddingNote}
            isSubmitting={isAddingNote}
          />

          {/* Timeline */}
          {actionsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Icon name="FaSpinner" size={20} className="animate-spin text-gray-500" />
            </div>
          ) : actions.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {actions.map((action) => (
                <div key={action.id} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon name={getActionIcon(action.activity_type)} size={12} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700">{getActionDescription(action)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {action.creator && (
                        <span>
                          {action.creator.first_name || action.creator.last_name
                            ? `${action.creator.first_name || ""} ${action.creator.last_name || ""}`.trim()
                            : action.creator.email}
                          {" · "}
                        </span>
                      )}
                      {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
