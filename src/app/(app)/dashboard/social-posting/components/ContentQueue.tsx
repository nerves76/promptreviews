"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import type { GoogleBusinessScheduledPost } from "@/features/social-posting";
import QueueItem from "./QueueItem";
import BulkScheduler from "./BulkScheduler";

interface ContentQueueProps {
  drafts: GoogleBusinessScheduledPost[];
  onScheduleComplete: () => void;
  onReorderComplete: () => void;
  onError: (message: string) => void;
}

export default function ContentQueue({
  drafts,
  onScheduleComplete,
  onReorderComplete,
  onError,
}: ContentQueueProps) {
  const [items, setItems] = useState(drafts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isReordering, setIsReordering] = useState(false);

  // Update items when drafts prop changes
  useEffect(() => {
    setItems(drafts);
  }, [drafts]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setIsReordering(true);

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);

        try {
          await apiClient.patch("/social-posting/scheduled/reorder", {
            orderedIds: newItems.map((item) => item.id),
          });
          onReorderComplete();
        } catch (err) {
          console.error("Failed to reorder:", err);
          // Revert on error
          setItems(items);
          onError("Failed to save new order");
        } finally {
          setIsReordering(false);
        }
      }
    },
    [items, onReorderComplete, onError]
  );

  const handleSelectItem = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedIds);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleRemoveFromQueue = async (id: string) => {
    try {
      await apiClient.delete(`/social-posting/scheduled/${id}`);
      setItems(items.filter((item) => item.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (err) {
      console.error("Failed to remove from queue:", err);
      onError("Failed to remove item from queue");
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
        <Icon
          name="FaCalendarAlt"
          className="w-12 h-12 text-gray-300 mx-auto mb-4"
          size={48}
        />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Your queue is empty
        </h3>
        <p className="text-gray-500 mb-4">
          Add content from RSS feeds or create posts manually to start
          scheduling.
        </p>
        <a
          href="/dashboard/rss-feeds"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 inline-flex items-center"
        >
          <Icon name="FaLink" size={14} className="mr-2" />
          Go to RSS feeds
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === items.length && items.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
            />
            <span className="text-sm text-gray-600">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : "Select all"}
            </span>
          </label>
        </div>
        {isReordering && (
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <Icon name="FaSpinner" size={14} className="animate-spin" />
            Saving order...
          </span>
        )}
      </div>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <QueueItem
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onSelect={(selected) => handleSelectItem(item.id, selected)}
                onRemove={() => handleRemoveFromQueue(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Bulk scheduler */}
      {selectedIds.size > 0 && (
        <BulkScheduler
          selectedCount={selectedIds.size}
          selectedIds={Array.from(selectedIds)}
          onScheduleComplete={onScheduleComplete}
          onError={onError}
        />
      )}
    </div>
  );
}
