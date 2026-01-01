"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Icon from "@/components/Icon";
import type { GoogleBusinessScheduledPost } from "@/features/social-posting";

interface QueueItemProps {
  item: GoogleBusinessScheduledPost;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onRemove: () => void;
}

export default function QueueItem({
  item,
  selected,
  onSelect,
  onRemove,
}: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get content preview
  const getContentPreview = () => {
    if (item.content?.summary) {
      const summary = item.content.summary;
      return summary.length > 150 ? summary.slice(0, 150) + "..." : summary;
    }
    if (item.caption) {
      return item.caption.length > 150
        ? item.caption.slice(0, 150) + "..."
        : item.caption;
    }
    return "No content";
  };

  // Get source label
  const getSourceLabel = () => {
    if (item.sourceType === "rss") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
          <Icon name="FaLink" size={10} className="mr-1" />
          RSS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
        Manual
      </span>
    );
  };

  // Get target platforms
  const getTargetPlatforms = () => {
    const platforms = [];

    if (item.selectedLocations && item.selectedLocations.length > 0) {
      platforms.push(
        <span
          key="gbp"
          className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
        >
          <Icon name="FaGoogle" size={10} className="mr-1" />
          GBP ({item.selectedLocations.length})
        </span>
      );
    }

    if (item.additionalPlatforms?.bluesky?.enabled) {
      platforms.push(
        <span
          key="bluesky"
          className="inline-flex items-center px-2 py-0.5 text-xs bg-sky-100 text-sky-700 rounded"
        >
          <Icon name="FaGlobe" size={10} className="mr-1" />
          Bluesky
        </span>
      );
    }

    if (platforms.length === 0) {
      return (
        <span className="text-xs text-amber-600">No targets configured</span>
      );
    }

    return platforms;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        border rounded-lg p-4 bg-white transition-shadow
        ${isDragging ? "shadow-lg opacity-90 z-10" : "shadow-sm"}
        ${selected ? "border-slate-blue ring-1 ring-slate-blue" : "border-gray-200"}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-1"
          title="Drag to reorder"
        >
          <Icon name="FaBars" size={16} />
        </button>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 mt-1 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getSourceLabel()}
              {item.content?.metadata?.rssTitle && (
                <span className="font-medium text-gray-900 text-sm">
                  {item.content.metadata.rssTitle}
                </span>
              )}
            </div>
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
              title="Remove from queue"
            >
              <Icon name="FaTimes" size={14} />
            </button>
          </div>

          {/* Content preview */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {getContentPreview()}
          </p>

          {/* Target platforms */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 mr-1">Targets:</span>
            {getTargetPlatforms()}
          </div>
        </div>
      </div>
    </div>
  );
}
