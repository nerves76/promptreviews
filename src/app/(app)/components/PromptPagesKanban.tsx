"use client";

import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { PromptPage } from "./PromptPagesTable";
import PromptPageCard from "./PromptPageCard";
import Icon from "@/components/Icon";
import { StatusLabels } from "@/hooks/useStatusLabels";

interface PromptPagesKanbanProps {
  promptPages: PromptPage[];
  business: any;
  account: any;
  onStatusUpdate: (pageId: string, newStatus: PromptPage["status"]) => void;
  statusLabels: StatusLabels;
  onEditLabel: (status: keyof StatusLabels) => void;
  selectedType?: string;
}

const STATUS_COLORS = {
  draft: "bg-gray-500/20 backdrop-blur-sm border-gray-300/30",
  in_queue: "bg-blue-500/20 backdrop-blur-sm border-blue-300/30",
  sent: "bg-purple-500/20 backdrop-blur-sm border-purple-300/30",
  follow_up: "bg-yellow-500/20 backdrop-blur-sm border-yellow-300/30",
  complete: "bg-green-500/20 backdrop-blur-sm border-green-300/30",
};

export default function PromptPagesKanban({
  promptPages,
  business,
  account,
  onStatusUpdate,
  statusLabels,
  onEditLabel,
  selectedType,
}: PromptPagesKanbanProps) {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Group pages by status
  const columnData = useMemo(() => {
    const statuses: Array<keyof StatusLabels> = ["draft", "in_queue", "sent", "follow_up", "complete"];

    return statuses.map((status) => {
      const pages = promptPages.filter((page) => {
        if (page.is_universal) return false;
        if (page.status !== status) return false;
        if (selectedType && page.review_type !== selectedType) return false;
        return true;
      });

      return {
        id: status,
        label: statusLabels[status],
        pages,
        color: STATUS_COLORS[status],
      };
    });
  }, [promptPages, statusLabels, selectedType]);

  const handleDragStart = (result: any) => {
    setDraggedCardId(result.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggedCardId(null);

    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as PromptPage["status"];

    // Update status if changed
    const page = promptPages.find((p) => p.id === draggableId);
    if (page && page.status !== newStatus) {
      onStatusUpdate(draggableId, newStatus);
    }
  };

  // Plan lock logic (reuse from table)
  const isGrower = account?.plan === "grower";
  const isBuilder = account?.plan === "builder";
  const isMaven = account?.plan === "maven";

  const maxGrowerPages = 4;
  const maxBuilderPages = 100;
  const maxMavenPages = 500;

  const maxPages = isGrower
    ? maxGrowerPages
    : isBuilder
    ? maxBuilderPages
    : isMaven
    ? maxMavenPages
    : Infinity;

  // Filter accessible pages
  const accessiblePages = promptPages.slice(0, maxPages);
  const accessiblePageIds = new Set(accessiblePages.map((p) => p.id));

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-2">
        {columnData.map((column) => (
          <div key={column.id} className="min-w-[320px] flex-shrink-0">
            {/* Column Header */}
            <div
              className={`${column.color} border rounded-t-lg p-3 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{column.label}</h3>
                <span className="text-sm text-gray-600">({column.pages.length})</span>
              </div>
              <button
                type="button"
                onClick={() => onEditLabel(column.id)}
                className="text-gray-600 hover:text-gray-900 transition"
                title="Edit column name"
                aria-label={`Edit ${column.label} label`}
              >
                <Icon name="MdEdit" size={18} />
              </button>
            </div>

            {/* Droppable Column */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    bg-gray-50 border-l border-r border-b rounded-b-lg p-3
                    min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto
                    transition-colors
                    ${snapshot.isDraggingOver ? "bg-blue-50 border-blue-300" : ""}
                  `}
                >
                  {column.pages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Icon name="MdDragIndicator" size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pages in {column.label}</p>
                      <p className="text-xs mt-1">Drag cards here</p>
                    </div>
                  ) : (
                    column.pages.map((page, index) => {
                      const isAccessible = accessiblePageIds.has(page.id);

                      return (
                        <Draggable
                          key={page.id}
                          draggableId={page.id}
                          index={index}
                          isDragDisabled={!isAccessible}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={isAccessible ? "" : "opacity-50 cursor-not-allowed"}
                              title={
                                !isAccessible
                                  ? `Upgrade to access more than ${maxPages} prompt pages`
                                  : undefined
                              }
                            >
                              <PromptPageCard
                                page={page}
                                business={business}
                                isDragging={snapshot.isDragging || draggedCardId === page.id}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>

      {/* Plan Upgrade Notice */}
      {promptPages.length > maxPages && (
        <div className="mt-4 p-4 bg-amber-500/20 backdrop-blur-sm border border-amber-300/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="MdLock" size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                You've reached the limit for your {account?.plan} plan
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Upgrade to access all {promptPages.length} prompt pages. Currently showing {maxPages}.
              </p>
            </div>
          </div>
        </div>
      )}
    </DragDropContext>
  );
}
