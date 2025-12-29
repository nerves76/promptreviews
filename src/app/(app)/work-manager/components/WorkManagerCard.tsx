"use client";

import React from "react";
import { formatDistanceToNow, isPast, isToday } from "date-fns";
import Icon from "@/components/Icon";
import { WMTask, WM_PRIORITY_COLORS, WM_PRIORITY_LABELS } from "@/types/workManager";

interface WorkManagerCardProps {
  task: WMTask;
  isDragging?: boolean;
  onOpen?: (task: WMTask) => void;
}

export default function WorkManagerCard({
  task,
  isDragging = false,
  onOpen,
}: WorkManagerCardProps) {
  const handleOpen = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onOpen?.(task);
  };

  const priorityColors = WM_PRIORITY_COLORS[task.priority];
  const priorityLabel = WM_PRIORITY_LABELS[task.priority];

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
          <Icon name="FaExclamationCircle" size={10} className="text-red-600" />
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
        group relative bg-white border border-gray-200 rounded-lg shadow-lg
        transition-all duration-200 mb-3
        ${isDragging ? "shadow-2xl rotate-2 scale-105 opacity-100" : "hover:shadow-xl"}
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

      <div className="space-y-2 pr-12">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {task.title}
        </h3>

        {/* Priority badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}
        >
          {task.priority === "high" && <Icon name="FaArrowUp" size={10} />}
          {task.priority === "low" && <Icon name="FaArrowDown" size={10} />}
          {priorityLabel}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
        {/* Due date or assignee */}
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
    </div>
  );
}
