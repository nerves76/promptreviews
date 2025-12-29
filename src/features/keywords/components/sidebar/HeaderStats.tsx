'use client';

import Icon from '@/components/Icon';
import { Dialog } from '@headlessui/react';
import { type KeywordData } from '../../keywordUtils';

export interface HeaderStatsProps {
  /** The keyword being displayed */
  keyword: KeywordData;
  /** Number of prompt pages using this keyword */
  promptPagesCount: number;
  /** Whether any section is in edit mode */
  isAnyEditing: boolean;
  /** Whether a save is in progress */
  isSaving: boolean;
  /** Callback to save all sections */
  onSave: () => Promise<void>;
}

/**
 * HeaderStats Component
 *
 * Displays the keyword title and stats grid at the top of the sidebar.
 * Shows: Terms, Pages, Reviews, Questions, Group
 */
export function HeaderStats({
  keyword,
  promptPagesCount,
  isAnyEditing,
  isSaving,
  onSave,
}: HeaderStatsProps) {

  return (
    <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Keyword concept</span>
          <Dialog.Title className="text-lg font-bold text-gray-900">
            {keyword.name}
          </Dialog.Title>
        </div>
        {isAnyEditing && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1.5"
            aria-label="Save changes"
          >
            {isSaving && <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />}
            Save
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-3 text-sm pt-3 mt-3 border-t border-gray-100">
        <div
          className="cursor-help"
          title="Number of search term variations tracked for this concept"
        >
          <span className="text-gray-500 block text-xs">Terms</span>
          <span className="font-medium">{keyword.searchTerms?.length || 0}</span>
        </div>
        <div
          className="cursor-help"
          title="Number of AI visibility questions for tracking citations"
        >
          <span className="text-gray-500 block text-xs">Questions</span>
          <span className="font-medium">{keyword.relatedQuestions?.length || 0}</span>
        </div>
        <div
          className="cursor-help"
          title="Number of prompt pages using this keyword concept"
        >
          <span className="text-gray-500 block text-xs">Pages</span>
          <span
            className={`font-medium ${promptPagesCount > 0 ? 'text-green-600' : 'text-gray-500'}`}
          >
            {promptPagesCount}
          </span>
        </div>
        <div
          className="cursor-help"
          title="Number of customer reviews mentioning this keyword or its aliases"
        >
          <span className="text-gray-500 block text-xs">Reviews</span>
          <span className="font-medium">{keyword.reviewUsageCount}</span>
        </div>
        <div
          className="cursor-help"
          title="Keyword group for organizing related concepts"
        >
          <span className="text-gray-500 block text-xs">Group</span>
          <span className="font-medium truncate block">{keyword.groupName || 'None'}</span>
        </div>
      </div>
    </div>
  );
}

export default HeaderStats;
