'use client';

import React from 'react';
import Icon from '@/components/Icon';
import {
  WMLibraryTask,
  WM_LIBRARY_CATEGORIES,
  WM_LIBRARY_DIFFICULTY,
  WM_LIBRARY_TIME_ESTIMATES,
  WM_LIBRARY_CATEGORY_COLORS,
  WM_LIBRARY_DIFFICULTY_COLORS,
} from '@/types/workManager';

interface LibraryTaskCardProps {
  task: WMLibraryTask;
  onClick: (task: WMLibraryTask) => void;
}

export default function LibraryTaskCard({ task, onClick }: LibraryTaskCardProps) {
  const categoryInfo = WM_LIBRARY_CATEGORIES.find(c => c.id === task.category);
  const difficultyInfo = WM_LIBRARY_DIFFICULTY.find(d => d.id === task.difficulty);
  const timeInfo = WM_LIBRARY_TIME_ESTIMATES.find(t => t.id === task.time_estimate);

  const categoryColors = WM_LIBRARY_CATEGORY_COLORS[task.category] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const difficultyColors = WM_LIBRARY_DIFFICULTY_COLORS[task.difficulty] || { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <button
      onClick={() => onClick(task)}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:border-slate-blue/50 hover:shadow-md transition-all group"
    >
      {/* Category badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColors.bg} ${categoryColors.text}`}>
          {categoryInfo?.label || task.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 group-hover:text-slate-blue transition-colors line-clamp-2 mb-2">
        {task.title}
      </h3>

      {/* Description preview */}
      {task.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {/* Difficulty */}
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${difficultyColors.bg} ${difficultyColors.text}`}>
          {difficultyInfo?.label || task.difficulty}
        </span>

        {/* Time */}
        <span className="flex items-center gap-1">
          <Icon name="FaClock" size={10} />
          {timeInfo?.label || task.time_estimate}
        </span>
      </div>
    </button>
  );
}
