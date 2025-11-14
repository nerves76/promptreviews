"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { PromptPage } from "./PromptPagesTable";
import PromptPageCard from "./PromptPageCard";
import Icon from "@/components/Icon";
import { StatusLabels } from "@/hooks/useStatusLabels";
import PromptPageDetailsPanel from "./PromptPageDetailsPanel";

interface PromptPagesKanbanProps {
  promptPages: PromptPage[];
  business: any;
  account: any;
  onStatusUpdate: (pageId: string, newStatus: PromptPage["status"]) => void;
  statusLabels: StatusLabels;
  onEditLabel: (status: keyof StatusLabels) => void;
  selectedType?: string;
  onLocalStatusUpdate?: (pageId: string, newStatus: PromptPage["status"], lastContactAt?: string | null) => void;
}

const STATUS_COLORS = {
  draft: "bg-gray-300/60 backdrop-blur-sm border-gray-100/70",
  in_queue: "bg-blue-300/60 backdrop-blur-sm border-blue-100/70",
  sent: "bg-purple-300/60 backdrop-blur-sm border-purple-100/70",
  follow_up: "bg-amber-300/60 backdrop-blur-sm border-amber-100/70",
  complete: "bg-emerald-300/60 backdrop-blur-sm border-emerald-100/70",
};

export default function PromptPagesKanban({
  promptPages,
  business,
  account,
  onStatusUpdate,
  statusLabels,
  onEditLabel,
  selectedType,
  onLocalStatusUpdate,
}: PromptPagesKanbanProps) {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PromptPage | null>(null);

  // Group pages by status
  const columnData = useMemo(() => {
    const statuses: Array<keyof StatusLabels> = ["draft", "in_queue", "sent", "follow_up", "complete"];

    return statuses.map((status) => {
      const pages = promptPages
        .filter((page) => {
          if (page.is_universal) return false;
          if (page.status !== status) return false;
          if (selectedType && page.review_type !== selectedType) return false;
          return true;
        })
        .sort((a, b) => {
          // Sort by sort_order (ascending), fallback to created_at (descending) for pages without sort_order
          const aOrder = a.sort_order ?? 999999;
          const bOrder = b.sort_order ?? 999999;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          // If sort_order is the same, sort by created_at descending
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

  const handleDragEnd = async (result: DropResult) => {
    setDraggedCardId(null);

    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const { draggableId, source, destination } = result;
    const newStatus = destination.droppableId as PromptPage["status"];
    const oldStatus = source.droppableId as PromptPage["status"];

    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const page = promptPages.find((p) => p.id === draggableId);
    if (!page) return;

    // Handle status change (moved to different column)
    if (oldStatus !== newStatus) {
      onStatusUpdate(draggableId, newStatus);

      // Log campaign action for status change
      try {
        await fetch('/api/campaign-actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            promptPageId: draggableId,
            contactId: page.contact_id,
            accountId: page.account_id || account?.id,
            activityType: 'status_change',
            content: `Status changed from "${statusLabels[oldStatus] || oldStatus}" to "${statusLabels[newStatus] || newStatus}"`,
            metadata: {
              status_from: oldStatus,
              status_to: newStatus,
            },
          }),
        });
      } catch (error) {
        // Don't fail the status update if campaign action logging fails
        console.error('Failed to log status change campaign action:', error);
      }
    }

    // Handle reordering within same column
    // Get all pages in the destination column
    const columnPages = promptPages.filter((p) => {
      if (p.is_universal) return false;
      if (selectedType && p.review_type !== selectedType) return false;
      return p.status === newStatus;
    });

    // Calculate new sort orders
    const updates: Array<{ id: string; sort_order: number }> = [];

    // Remove the dragged page from its old position
    const withoutDragged = columnPages.filter(p => p.id !== draggableId);

    // Insert it at the new position
    const reordered = [
      ...withoutDragged.slice(0, destination.index),
      page,
      ...withoutDragged.slice(destination.index)
    ];

    // Assign new sort orders (1-indexed)
    reordered.forEach((p, index) => {
      updates.push({
        id: p.id,
        sort_order: index + 1
      });
    });

    // Persist the new sort orders to the database
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add selected account header if available
      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('promptreviews_last_user_id');
        if (userId) {
          const accountKey = `promptreviews_selected_account_${userId}`;
          const selectedAccountId = localStorage.getItem(accountKey);
          if (selectedAccountId) {
            headers['X-Selected-Account'] = selectedAccountId;
          }
        }
      }

      const response = await fetch('/api/prompt-pages/reorder', {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist sort order');
      }

      // Trigger a refetch to show the new order
      // The parent component should pass a refresh callback
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prompt-pages-reordered'));
      }
    } catch (error) {
      console.error('Failed to persist sort order:', error);
      // The UI will still show the reordered state optimistically
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-4">
        {columnData.map((column) => (
          <div key={column.id} className="min-w-0">
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
                <Icon name="FaEdit" size={18} />
              </button>
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
                  {column.pages.length === 0 ? (
                    <div className="text-center py-12 text-white">
                      <Icon name="FaArrowsAlt" size={32} className="mx-auto mb-2 opacity-70" />
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
                                onOpen={(selected) => setActivePage(selected)}
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
            <Icon name="FaLock" size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
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
      {activePage && (
        <PromptPageDetailsDrawer
          page={activePage}
          business={business}
          onClose={() => setActivePage(null)}
          onLocalStatusUpdate={onLocalStatusUpdate}
        />
      )}
    </DragDropContext>
  );
}

interface PromptPageDetailsDrawerProps {
  page: PromptPage;
  business: any;
  onClose: () => void;
  onLocalStatusUpdate?: (pageId: string, newStatus: PromptPage["status"], lastContactAt?: string | null) => void;
}

function PromptPageDetailsDrawer({
  page,
  business,
  onClose,
  onLocalStatusUpdate,
}: PromptPageDetailsDrawerProps) {
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
      <div className="relative h-full w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 translate-x-0">
        <PromptPageDetailsPanel
          page={page}
          business={business}
          onClose={onClose}
          onLocalStatusUpdate={onLocalStatusUpdate}
        />
      </div>
    </div>
  );
}
