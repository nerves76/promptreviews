"use client";
import React from "react";
import { FaCopy } from "react-icons/fa";
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
  const isCopied = copiedWidgetId === widget.id;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:border-slateblue transition-colors">
      <div className="flex justify-between items-start mb-4">
        {/* Widget Name and Type */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{widget.name}</h3>
          <div className="text-sm text-gray-500 capitalize">{widget.widget_type} Widget</div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyEmbed();
            }}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Copy Embed Code"
          >
            {isCopied ? (
              <CheckIcon className="w-4 h-4 text-green-600" />
            ) : (
              <DocumentDuplicateIcon className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditStyle();
            }}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Edit Style"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
              />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onManageReviews();
            }}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Manage Reviews"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete Widget"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Select Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {widget.widget_type} Widget
        </div>
        <button
          onClick={onSelect}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            isSelected
              ? 'bg-slateblue text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label="Select to view"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 inline-block"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12C3.5 7.5 7.5 4.5 12 4.5c4.5 0 8.5 3 9.75 7.5-1.25 4.5-5.25 7.5-9.75 7.5-4.5 0-8.5-3-9.75-7.5z"
            />
          </svg>
          {isSelected ? 'Selected' : 'Select to view'}
        </button>
      </div>
    </div>
  );
} 