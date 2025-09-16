"use client";
import React from "react";
import Icon from "@/components/Icon";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/outline";

interface WidgetCardProps {
  widget: {
    id: string;
    name: string;
    type: string;
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
    <div className={`bg-white rounded-lg shadow-md p-4 border transition-colors flex flex-col h-full min-h-[200px] ${
      isSelected 
        ? 'border-slate-blue border-2' 
        : 'border-gray-200 hover:border-slate-blue'
    }`}>
      <div className="flex justify-between items-start mb-4">
        {/* Widget Name and Type */}
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 break-words leading-tight">{widget.name}</h3>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 
                widget.type === 'single' ? '#60A5FA' :
                widget.type === 'multi' ? '#34D399' :
                widget.type === 'photo' ? '#A78BFA' : '#6B7280',
              color: 'white'
            }}
          >
            {widget.type === 'single' && 'Single card'}
            {widget.type === 'multi' && 'Multi card'}
            {widget.type === 'photo' && 'Photo'}
          </span>
        </div>
        
        {/* Action Buttons (Icons Only) */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyEmbed();
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={isCopied ? "Copied!" : "Copy embed code"}
          >
            {isCopied ? (
              <CheckIcon className="w-4 h-4 text-green-600" />
            ) : (
              <Icon name="FaCode" className="w-4 h-4" size={16} />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditStyle();
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit style"
          >
            <Icon name="FaPalette" className="w-4 h-4" size={16} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onManageReviews();
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Manage reviews"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete widget"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-grow"></div>

      {/* Select Button */}
      <div className="flex justify-end items-center mt-auto pt-4 min-h-[56px]">
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