"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import WorkManagerCard from "./WorkManagerCard";
import Icon from "@/components/Icon";
import {
  WMTask,
  WMStatusLabels,
  WMTaskStatus,
  WM_STATUS_COLORS,
  WM_STATUS_ORDER,
} from "@/types/workManager";
import { apiClient } from "@/utils/apiClient";

interface WorkManagerKanbanProps {
  tasks: WMTask[];
  boardId: string;
  statusLabels: WMStatusLabels;
  onEditLabel: (status: keyof WMStatusLabels) => void;
  onTaskClick: (task: WMTask) => void;
  onTasksReordered?: () => void;
  onAddTask?: (status: WMTaskStatus) => void;
}

export default function WorkManagerKanban({
  tasks,
  boardId,
  statusLabels,
  onEditLabel,
  onTaskClick,
  onTasksReordered,
  onAddTask,
}: WorkManagerKanbanProps) {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<WMTask[]>(tasks);

  // Sync local tasks with props
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Group tasks by status
  const columnData = useMemo(() => {
    return WM_STATUS_ORDER.map((status) => {
      const statusTasks = localTasks
        .filter((task) => task.status === status)
        .sort((a, b) => {
          // Sort by sort_order (ascending), fallback to created_at (descending)
          const aOrder = a.sort_order ?? 999999;
          const bOrder = b.sort_order ?? 999999;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      return {
        id: status,
        label: statusLabels[status],
        tasks: statusTasks,
        color: WM_STATUS_COLORS[status],
      };
    });
  }, [localTasks, statusLabels]);

  const handleDragStart = (result: any) => {
    setDraggedCardId(result.draggableId);
  };

  const handleDragEnd = async (result: DropResult) => {
    setDraggedCardId(null);

    if (!result.destination) {
      return;
    }

    const { draggableId, source, destination } = result;
    const newStatus = destination.droppableId as WMTaskStatus;
    const oldStatus = source.droppableId as WMTaskStatus;

    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const task = localTasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Optimistic update
    const updatedTasks = localTasks.map((t) => {
      if (t.id === draggableId) {
        return { ...t, status: newStatus };
      }
      return t;
    });

    // Get all tasks in the destination column
    const columnTasks = updatedTasks.filter((t) => t.status === newStatus);

    // Remove the dragged task from its old position
    const withoutDragged = columnTasks.filter((t) => t.id !== draggableId);

    // Insert it at the new position
    const reordered = [
      ...withoutDragged.slice(0, destination.index),
      { ...task, status: newStatus },
      ...withoutDragged.slice(destination.index),
    ];

    // Calculate new sort orders
    const updates: Array<{ id: string; sort_order: number; status?: WMTaskStatus }> = [];
    reordered.forEach((t, index) => {
      const update: any = { id: t.id, sort_order: index + 1 };
      if (t.id === draggableId && oldStatus !== newStatus) {
        update.status = newStatus;
      }
      updates.push(update);
    });

    // Update local state optimistically
    const finalTasks = localTasks.map((t) => {
      const update = updates.find((u) => u.id === t.id);
      if (update) {
        return {
          ...t,
          sort_order: update.sort_order,
          status: update.status || t.status,
        };
      }
      return t;
    });
    setLocalTasks(finalTasks);

    // Persist the changes
    try {
      await apiClient.patch("/work-manager/tasks/reorder", { updates });

      // Trigger a refetch
      onTasksReordered?.();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wm-tasks-reordered"));
      }
    } catch (error) {
      console.error("Failed to persist sort order:", error);
      // Revert on error
      setLocalTasks(tasks);
    }
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-4">
        {columnData.map((column) => (
          <div key={column.id} className="min-w-0">
            {/* Column Header */}
            <div
              className={`${column.color} border rounded-t-lg p-3 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{column.label}</h3>
                <span className="text-sm text-gray-600">({column.tasks.length})</span>
              </div>
              <div className="flex items-center gap-1">
                {onAddTask && (
                  <button
                    type="button"
                    onClick={() => onAddTask(column.id)}
                    className="text-gray-600 hover:text-gray-900 transition p-1"
                    title={`Add task to ${column.label}`}
                    aria-label={`Add task to ${column.label}`}
                  >
                    <Icon name="FaPlus" size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onEditLabel(column.id)}
                  className="text-gray-600 hover:text-gray-900 transition p-1"
                  title="Edit column name"
                  aria-label={`Edit ${column.label} label`}
                >
                  <Icon name="FaEdit" size={14} />
                </button>
              </div>
            </div>

            {/* Droppable Column */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    bg-white/30 backdrop-blur-md border-l border-r border-b rounded-b-lg p-3
                    min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto
                    transition-colors
                    ${snapshot.isDraggingOver ? "bg-blue-100/40 border-blue-300" : "border-white/40"}
                  `}
                >
                  {column.tasks.length === 0 ? (
                    <div className="text-center py-12 text-white/60">
                      <p className="text-sm font-medium">No tasks in {column.label}</p>
                      <p className="text-xs mt-1">Drag tasks here or add new</p>
                    </div>
                  ) : (
                    column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <WorkManagerCard
                              task={task}
                              isDragging={snapshot.isDragging || draggedCardId === task.id}
                              onOpen={onTaskClick}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
