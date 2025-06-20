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
    <div className={`bg-white rounded-lg shadow-md p-4 border transition-colors flex flex-col h-full ${
      isSelected 
        ? 'border-slate-blue border-2' 
        : 'border-gray-200 hover:border-slate-blue'
    }`}>
      <div className="flex-1">
        {/* Widget Name and Type */}
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 break-words leading-tight">{widget.name}</h3>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 
                widget.widget_type === 'single' ? '#60A5FA' :
                widget.widget_type === 'multi' ? '#34D399' :
                widget.widget_type === 'photo' ? '#A78BFA' : '#6B7280',
              color: 'white'
            }}
          >
            {widget.widget_type === 'single' && 'Single Card'}
            {widget.widget_type === 'multi' && 'Multi Card'}
            {widget.widget_type === 'photo' && 'Photo'}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyEmbed();
            }}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
            title="Copy Embed Code"
          >
            {isCopied ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="w-4 h-4" />
                <span>Embed</span>
              </>
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditStyle();
            }}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
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
            <span>Style</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onManageReviews();
            }}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
            title="Manage Reviews"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>Reviews</span>
          </button>
        </div>
      </div>
      
      {/* Footer Buttons */}
      <div className="flex justify-between items-center mt-auto pt-4 min-h-[56px]">
        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
          title="Delete Widget"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete</span>
        </button>

        {/* Select Button */}
        <button
          onClick={onSelect}
          className={`w-40 h-10 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center border-2 ${
            isSelected
              ? 'border-slate-blue bg-white text-slate-blue'
              : 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={isSelected ? "Selected. Click to deselect." : "Select to view"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{isSelected ? 'Selected' : 'Select to view'}</span>
        </button>
      </div>
    </div>
  );
} 