'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import {
  WMLibraryTask,
  WM_LIBRARY_CATEGORIES,
  WM_LIBRARY_DIFFICULTY,
  WM_LIBRARY_TIME_ESTIMATES,
  WM_LIBRARY_CATEGORY_COLORS,
  WM_LIBRARY_DIFFICULTY_COLORS,
} from '@/types/workManager';

interface LibraryTaskPreviewProps {
  task: WMLibraryTask;
  onClose: () => void;
  onAddToBoard: (task: WMLibraryTask) => Promise<void>;
  isAdding: boolean;
}

export default function LibraryTaskPreview({
  task,
  onClose,
  onAddToBoard,
  isAdding,
}: LibraryTaskPreviewProps) {
  const categoryInfo = WM_LIBRARY_CATEGORIES.find(c => c.id === task.category);
  const difficultyInfo = WM_LIBRARY_DIFFICULTY.find(d => d.id === task.difficulty);
  const timeInfo = WM_LIBRARY_TIME_ESTIMATES.find(t => t.id === task.time_estimate);

  const categoryColors = WM_LIBRARY_CATEGORY_COLORS[task.category];
  const difficultyColors = WM_LIBRARY_DIFFICULTY_COLORS[task.difficulty];

  const handleAddToBoard = async () => {
    await onAddToBoard(task);
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Close button - small red circle at top right */}
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-10"
        aria-label="Close preview"
      >
        <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        {/* Category badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${categoryColors.bg} ${categoryColors.text}`}>
            {categoryInfo?.label || task.category}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${difficultyColors.bg} ${difficultyColors.text}`}>
            {difficultyInfo?.label || task.difficulty}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Icon name="FaClock" size={10} />
            {timeInfo?.label || task.time_estimate}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 pr-6">{task.title}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        {task.description && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{task.description}</p>
          </div>
        )}

        {/* Education / Why this matters */}
        {task.education && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Icon name="FaLightbulb" size={14} />
              Why this matters
            </h3>
            <p className="text-blue-800 text-sm">{task.education}</p>
          </div>
        )}

        {/* Instructions */}
        {task.instructions && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Icon name="FaListOl" size={14} />
              Instructions
            </h3>
            <div className="text-gray-600 text-sm whitespace-pre-line">
              {task.instructions}
            </div>
          </div>
        )}

        {/* Relevant Tools */}
        {task.relevant_tools && task.relevant_tools.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Icon name="FaTools" size={14} />
              Tools in Prompt Reviews
            </h3>
            <div className="flex flex-wrap gap-2">
              {task.relevant_tools.map((tool, index) => (
                <Link
                  key={index}
                  href={tool.route}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-blue/10 text-slate-blue rounded-lg text-sm font-medium hover:bg-slate-blue/20 transition-colors"
                >
                  <Icon name="FaExternalLinkAlt" size={10} />
                  {tool.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags Section */}
        <div className="space-y-4">
          {/* Goals */}
          {task.goals && task.goals.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Goals</h3>
              <div className="flex flex-wrap gap-1.5">
                {task.goals.map((goal, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Page Types */}
          {task.page_types && task.page_types.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Page types</h3>
              <div className="flex flex-wrap gap-1.5">
                {task.page_types.map((pageType, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {pageType}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Off-site Sources */}
          {task.offsite_sources && task.offsite_sources.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Off-site sources</h3>
              <div className="flex flex-wrap gap-1.5">
                {task.offsite_sources.map((source, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleAddToBoard}
          disabled={isAdding}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? (
            <>
              <Icon name="FaSpinner" size={16} className="animate-spin" />
              Adding to board...
            </>
          ) : (
            <>
              <Icon name="FaPlus" size={14} />
              Add to board
            </>
          )}
        </button>
      </div>
    </div>
  );
}
