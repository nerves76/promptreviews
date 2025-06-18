import React from 'react';
import { WidgetActions } from './WidgetActions';
import { WidgetName } from './WidgetName';

interface WidgetCardProps {
  widget: any;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyEmbed: () => void;
  onEditStyle: () => void;
  isSelected: boolean;
  copiedWidgetId: string | null;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  onSelect,
  onEdit,
  onDelete,
  onCopyEmbed,
  onEditStyle,
  isSelected,
  copiedWidgetId,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:border-slate-blue transition-colors">
      <div className="flex justify-between items-start mb-4">
        <WidgetName
          widget={widget}
          onSave={(name) => {
            // Handle name save
          }}
        />
        <WidgetActions
          onEdit={onEdit}
          onDelete={onDelete}
          onCopyEmbed={onCopyEmbed}
          onEditStyle={onEditStyle}
          copiedWidgetId={copiedWidgetId}
          widgetId={widget.id}
        />
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {widget.widget_type} Widget
        </div>
        <button
          onClick={onSelect}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            isSelected
              ? 'bg-slate-blue text-white'
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
}; 