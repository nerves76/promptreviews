"use client";

import React from "react";
import { formatDistanceToNow, isPast, isToday } from "date-fns";
import Icon from "@/components/Icon";
import { WMTask, WMTaskStatus, WMStatusLabels, WM_PRIORITY_COLORS, WM_PRIORITY_LABELS, formatTimeEstimate } from "@/types/workManager";
import { LLM_PROVIDER_LABELS, LLM_PROVIDER_COLORS, type LLMProvider } from "@/features/llm-visibility/utils/types";

interface WorkManagerCardProps {
  task: WMTask;
  isDragging?: boolean;
  onOpen?: (task: WMTask) => void;
  onDelete?: (task: WMTask) => void;
  /** Client name for linked (pulled) tasks */
  clientName?: string | null;
  /** Current client-side status for linked tasks */
  clientStatus?: WMTaskStatus | null;
  /** Client board status labels for the dropdown */
  clientStatusLabels?: WMStatusLabels | null;
  /** Callback when agency changes the client-side status */
  onClientStatusChange?: (taskId: string, newStatus: WMTaskStatus) => void;
  /** Whether to show time spent badge */
  showTimeSpent?: boolean;
}

export default function WorkManagerCard({
  task,
  isDragging = false,
  onOpen,
  onDelete,
  clientName,
  clientStatus,
  clientStatusLabels,
  onClientStatusChange,
  showTimeSpent = true,
}: WorkManagerCardProps) {
  const handleOpen = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onOpen?.(task);
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete?.(task);
  };

  const priorityColors = WM_PRIORITY_COLORS[task.priority] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  const priorityLabel = WM_PRIORITY_LABELS[task.priority] || 'Medium';

  // Due date formatting
  let dueDateDisplay: React.ReactNode = null;
  let dueDateClassName = "text-gray-500";

  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    const isOverdue = isPast(dueDate) && task.status !== "done";
    const isDueToday = isToday(dueDate);

    if (isOverdue) {
      dueDateClassName = "text-red-600 font-medium";
      dueDateDisplay = (
        <>
          <Icon name="FaExclamationTriangle" size={10} className="text-red-600" />
          <span>Overdue</span>
        </>
      );
    } else if (isDueToday) {
      dueDateClassName = "text-amber-600 font-medium";
      dueDateDisplay = (
        <>
          <Icon name="FaClock" size={10} className="text-amber-600" />
          <span>Due today</span>
        </>
      );
    } else {
      dueDateDisplay = (
        <>
          <Icon name="FaCalendarAlt" size={10} />
          <span>Due {formatDistanceToNow(dueDate, { addSuffix: true })}</span>
        </>
      );
    }
  }

  // Assignee display
  const assigneeName = task.assignee
    ? `${task.assignee.first_name || ""} ${task.assignee.last_name || ""}`.trim() ||
      task.assignee.email
    : null;

  return (
    <div
      className={`
        group relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-lg shadow-lg
        transition-all duration-200 mb-3
        ${isDragging ? "shadow-2xl rotate-2 scale-105 !bg-white/90" : "hover:shadow-xl"}
        p-4 cursor-grab
      `}
    >
      {/* Open button */}
      <button
        type="button"
        onClick={handleOpen}
        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-white/80 text-slate-blue rounded shadow opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
      >
        <Icon name="FaArrowRight" size={10} />
        Open
      </button>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-xs bg-white/80 text-gray-400 hover:text-red-500 rounded shadow opacity-0 group-hover:opacity-100 transition"
          aria-label="Delete task"
        >
          <Icon name="FaTrash" size={10} />
        </button>
      )}

      <div className="space-y-2 pr-12">
        {/* Client badge for linked tasks */}
        {clientName && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-blue/10 text-slate-blue border border-slate-blue/20 whitespace-nowrap">
            <Icon name="FaBuilding" size={9} />
            {clientName}
          </span>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {task.title}
        </h3>

        {/* Provider & concept tags from metadata */}
        {Array.isArray(task.metadata?.providers) && (task.metadata.providers as string[]).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(task.metadata.providers as string[]).map(p => {
              const providerLabel = LLM_PROVIDER_LABELS[p as LLMProvider] || p;
              const colors = LLM_PROVIDER_COLORS[p as LLMProvider];
              return (
                <span
                  key={p}
                  className={`px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap ${
                    colors ? `${colors.bg} ${colors.text}` : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {providerLabel}
                </span>
              );
            })}
          </div>
        )}
        {Array.isArray(task.metadata?.concepts) && (task.metadata.concepts as string[]).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(task.metadata.concepts as string[]).slice(0, 3).map(c => (
              <span
                key={c}
                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded truncate max-w-[120px] whitespace-nowrap"
                title={c}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Priority badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}
        >
          {task.priority === "high" && <Icon name="FaCaretUp" size={10} />}
          {task.priority === "low" && <Icon name="FaCaretDown" size={10} />}
          {priorityLabel}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
        {/* Due date or assignee */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`inline-flex items-center gap-1 truncate ${dueDateClassName}`}>
            {dueDateDisplay || (
              assigneeName ? (
                <>
                  <Icon name="FaUser" size={10} className="text-gray-500" />
                  <span className="truncate text-gray-600">{assigneeName}</span>
                </>
              ) : (
                <span className="text-gray-500">No due date</span>
              )
            )}
          </div>

          {/* Time estimate */}
          {task.time_estimate_minutes != null && task.time_estimate_minutes > 0 && (
            <span className="inline-flex items-center gap-1 text-gray-500 whitespace-nowrap">
              <Icon name="FaClock" size={10} />
              {formatTimeEstimate(task.time_estimate_minutes)}
            </span>
          )}

          {/* Time spent */}
          {showTimeSpent && (task.total_time_spent_minutes ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-emerald-600 whitespace-nowrap">
              <Icon name="FaCheck" size={10} />
              {formatTimeEstimate(task.total_time_spent_minutes!)}
            </span>
          )}
        </div>

        {/* Mobile open button */}
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1 text-slate-blue hover:text-slate-blue/80 text-xs font-semibold md:hidden"
        >
          <Icon name="FaArrowRight" size={10} />
          Open
        </button>
      </div>

      {/* Assignee avatar (if due date is shown) */}
      {dueDateDisplay && assigneeName && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <Icon name="FaUser" size={10} className="text-gray-500" />
          <span className="truncate">{assigneeName}</span>
        </div>
      )}

      {/* Client status dropdown for linked tasks */}
      {clientStatusLabels && clientStatus && onClientStatusChange && (
        <div
          className="mt-2 pt-2 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Client status</label>
          <select
            value={clientStatus}
            onChange={(e) => {
              e.stopPropagation();
              onClientStatusChange(task.id, e.target.value as WMTaskStatus);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="mt-0.5 block w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-blue"
          >
            {(Object.entries(clientStatusLabels) as [WMTaskStatus, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
