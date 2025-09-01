"use client";
import React from "react";
import Icon from "@/components/Icon";
import { ChatBubbleLeftIcon, CheckIcon } from "@heroicons/react/24/outline";

interface Widget {
  id: string;
  name: string;
  type: string;
  theme: any;
  created_at?: string;
}

interface WidgetTableProps {
  widgets: Widget[];
  selectedWidgetId?: string;
  onSelect: (widget: Widget) => void;
  onCopyEmbed: (widgetId: string) => void;
  onEditStyle: (widget: Widget) => void;
  onManageReviews: (widgetId: string) => void;
  onDelete: (widgetId: string) => void;
  copiedWidgetId: string | null;
}

export function WidgetTable({
  widgets,
  selectedWidgetId,
  onSelect,
  onCopyEmbed,
  onEditStyle,
  onManageReviews,
  onDelete,
  copiedWidgetId
}: WidgetTableProps) {
  const getWidgetTypeDisplay = (type: string) => {
    switch (type) {
      case 'single':
        return { text: 'Single card', color: '#60A5FA' };
      case 'multi':
        return { text: 'Multi card', color: '#34D399' };
      case 'photo':
        return { text: 'Photo', color: '#A78BFA' };
      default:
        return { text: type, color: '#6B7280' };
    }
  };

  return (
    <div className="overflow-x-auto shadow sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Widget Name</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">Select</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {widgets.map((widget, index) => {
            const isSelected = selectedWidgetId === widget.id;
            const isCopied = copiedWidgetId === widget.id;
            const typeDisplay = getWidgetTypeDisplay(widget.type);
            
            return (
              <tr key={widget.id} className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                {/* Widget Name */}
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="font-medium text-gray-900">{widget.name}</div>
                </td>
                
                {/* Type */}
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: typeDisplay.color }}
                  >
                    {typeDisplay.text}
                  </span>
                </td>
                
                {/* Created */}
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {widget.created_at ? new Date(widget.created_at).toLocaleDateString() : '-'}
                </td>
                
                {/* Actions */}
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyEmbed(widget.id);
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
                        onEditStyle(widget);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit style"
                    >
                      <Icon name="FaPalette" className="w-4 h-4" size={16} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageReviews(widget.id);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Manage reviews"
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(widget.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete widget"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
                
                {/* Select */}
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => onSelect(widget)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg font-medium text-sm transition-colors border-2 ${
                      isSelected
                        ? 'border-slate-blue bg-white text-slate-blue'
                        : 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 mr-1"
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
                    {isSelected ? 'Selected' : 'Select to view'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}