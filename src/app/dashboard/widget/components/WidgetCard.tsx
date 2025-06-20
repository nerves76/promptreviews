"use client";
import React from "react";
import { FaCopy, FaArrowsAlt } from "react-icons/fa";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

interface WidgetCardProps {
  widget: {
    id: string;
    name: string;
    widget_type: string;
    theme: any;
  };
  isSelected: boolean;
  onSelect: () => void;
  onCopyEmbed: () => void;
  onEditStyle: () => void;
  onManageReviews: () => void;
  onDelete: () => void;
  copiedWidgetId: string | null;
}

export function WidgetCard({
  widget,
  isSelected,
  onSelect,
  onCopyEmbed,
  onEditStyle,
  onManageReviews,
  onDelete,
  copiedWidgetId
}: WidgetCardProps) {
  // Determine colors based on widget type
  let shadowColor = 'rgba(59, 130, 246, 0.18)'; // blue-500
  let borderColor = '#3B82F6'; // blue-500
  let accentColor = '#3B82F6';

  if (widget.widget_type === 'multi') {
    shadowColor = 'rgba(16, 185, 129, 0.18)'; // green-500
    borderColor = '#10B981'; // green-500
    accentColor = '#10B981';
  } else if (widget.widget_type === 'photo') {
    shadowColor = 'rgba(139, 92, 246, 0.18)'; // purple-500
    borderColor = '#8B5CF6'; // purple-500
    accentColor = '#8B5CF6';
  }

  const isCopied = copiedWidgetId === widget.id;

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer border-2 transition-all relative ${isSelected ? '' : ''}`}
      style={{
        boxShadow: isSelected
          ? `0 4px 24px 0 ${shadowColor}, 0 0 0 2px ${borderColor}`
          : `0 4px 24px 0 ${shadowColor}`,
        borderColor: isSelected ? borderColor : 'transparent',
      }}
      onClick={onSelect}
    >
      {/* Widget Type Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className="px-2 py-1 text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: accentColor }}
        >
          {widget.widget_type === 'single' && 'Single Card'}
          {widget.widget_type === 'multi' && 'Multi Card'}
          {widget.widget_type === 'photo' && 'Photo Widget'}
        </span>
      </div>

      {/* Widget Preview */}
      <div className="relative h-48 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
            <ChatBubbleLeftIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-sm font-medium text-gray-700">{widget.name}</div>
          <div className="text-xs text-gray-500 capitalize">{widget.widget_type} Widget</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyEmbed();
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {isCopied ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="w-4 h-4" />
                <span>Copy Embed</span>
              </>
            )}
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditStyle();
              }}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Edit Style"
            >
              <FaArrowsAlt className="w-4 h-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onManageReviews();
              }}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Manage Reviews"
            >
              <ChatBubbleLeftIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-full px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        >
          Delete Widget
        </button>
      </div>
    </div>
  );
} 