"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  /** Optional handler for changing client-side status on linked agency tasks */
  clientStatusChangeHandler?: (taskId: string, newStatus: WMTaskStatus) => void;
}

export default function WorkManagerKanban({
  tasks,
  boardId,
  statusLabels,
  onEditLabel,
  onTaskClick,
  onTasksReordered,
  onAddTask,
  clientStatusChangeHandler,
}: WorkManagerKanbanProps) {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localTasks, setLocalTasks] = useState<WMTask[]>(tasks);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync local tasks with props
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Handle scroll to update active column indicator
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const columnWidth = container.offsetWidth * 0.85; // 85% of container width
    const newIndex = Math.round(scrollLeft / columnWidth);
    setActiveColumnIndex(Math.min(newIndex, WM_STATUS_ORDER.length - 1));
  }, []);

  // Scroll to a specific column
  const scrollToColumn = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const columnWidth = container.offsetWidth * 0.85;
    container.scrollTo({
      left: index * columnWidth,
      behavior: 'smooth'
    });
  }, []);

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
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setDraggedCardId(null);
    setIsDragging(false);

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

  // Render a draggable card (shared between renderClone and regular rendering)
  const renderDraggableCard = (
    task: WMTask,
    provided: any,
    snapshot: any,
    isDragClone: boolean = false
  ) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        // When rendering as clone in portal, preserve card width
        ...(isDragClone && {
          width: 256, // Match column width (280px - padding)
          zIndex: 9999,
        }),
      }}
    >
      <WorkManagerCard
        task={task}
        isDragging={snapshot.isDragging || draggedCardId === task.id}
        onOpen={onTaskClick}
        clientName={task.linked_task?.client_name}
        clientStatus={task.linked_task?.status as WMTaskStatus | undefined}
        clientStatusLabels={task.linked_task?.client_board_status_labels}
        onClientStatusChange={clientStatusChangeHandler}
      />
    </div>
  );

  // Render a single column (shared between mobile and desktop)
  // columnType: 'mobile' = 85vw with snap, 'desktop' = fixed 280px width
  const renderColumn = (column: typeof columnData[0], columnType: 'mobile' | 'desktop' = 'desktop') => (
    <div
      key={column.id}
      className={
        columnType === 'mobile'
          ? "w-[85vw] flex-shrink-0 snap-center"
          : "w-[280px] flex-shrink-0"
      }
    >
      {/* Column Header */}
      <div
        className={`${column.color} border border-white/30 rounded-t-lg p-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white">{column.label}</h3>
          <span className="text-sm text-white/70">({column.tasks.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {onAddTask && (
            <button
              type="button"
              onClick={() => onAddTask(column.id)}
              className="text-white/70 hover:text-white transition p-1"
              title={`Add task to ${column.label}`}
              aria-label={`Add task to ${column.label}`}
            >
              <Icon name="FaPlus" size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEditLabel(column.id)}
            className="text-white/70 hover:text-white transition p-1"
            title="Edit column name"
            aria-label={`Edit ${column.label} label`}
          >
            <Icon name="FaEdit" size={14} />
          </button>
        </div>
      </div>

      {/* Droppable Column */}
      <Droppable
        droppableId={column.id}
        renderClone={(provided, snapshot, rubric) => {
          // Search all localTasks to handle cross-column drags
          const task = localTasks.find(t => t.id === rubric.draggableId);
          if (!task) return <div ref={provided.innerRef} />;
          return renderDraggableCard(task, provided, snapshot, true);
        }}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              bg-white/30 backdrop-blur-md border-l border-r border-b border-white/30 rounded-b-lg p-3
              ${columnType === 'mobile' ? "min-h-[60vh]" : "min-h-[calc(100vh-200px)]"}
              transition-colors
              ${snapshot.isDraggingOver ? "bg-blue-100/40 border-blue-300" : ""}
            `}
            style={{
              // Disable overflow clipping during drag to prevent card from disappearing
              overflow: isDragging ? 'visible' : 'auto',
              overflowY: isDragging ? 'visible' : 'auto',
            }}
          >
            {column.tasks.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <p className="text-sm font-medium">No tasks in {column.label}</p>
                <p className="text-xs mt-1">Drag tasks here or add new</p>
              </div>
            ) : (
              column.tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => renderDraggableCard(task, provided, snapshot)}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Mobile: Horizontal scroll with snap */}
      <div className="md:hidden">
        {/* Column indicator pills - scrollable on very small screens */}
        <div className="flex gap-1.5 mb-3 px-4 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex gap-1.5 mx-auto">
            {columnData.map((column, index) => (
              <button
                key={column.id}
                onClick={() => scrollToColumn(index)}
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0
                  ${index === activeColumnIndex
                    ? `${column.color} text-white shadow-md`
                    : 'bg-white/30 text-white/70 hover:bg-white/40'
                  }
                `}
              >
                {column.label} ({column.tasks.length})
              </button>
            ))}
          </div>
        </div>

        {/* Swipeable columns */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-[7.5vw] pb-4"
        >
          {columnData.map((column) => renderColumn(column, 'mobile'))}
        </div>

        {/* Swipe hint */}
        <div className="flex justify-center items-center gap-2 text-white/50 text-xs mt-2">
          <Icon name="FaChevronLeft" size={10} />
          <span>Swipe to navigate</span>
          <Icon name="FaChevronRight" size={10} />
        </div>
      </div>

      {/* Desktop/Tablet: Horizontal scroll with fixed-width columns */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4 px-2">
        {columnData.map((column) => renderColumn(column, 'desktop'))}
      </div>
    </DragDropContext>
  );
}
