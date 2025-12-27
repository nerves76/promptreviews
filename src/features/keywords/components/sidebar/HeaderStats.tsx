'use client';

import Icon from '@/components/Icon';
import { Dialog } from '@headlessui/react';
import { type KeywordData, formatVolume } from '../../keywordUtils';

export interface HeaderStatsProps {
  /** The keyword being displayed */
  keyword: KeywordData;
  /** Number of prompt pages using this keyword */
  promptPagesCount: number;
  /** Pre-computed total search volume across all terms */
  totalVolume: number;
  /** Pre-computed: whether all terms have low volume (<10) */
  allLowVolume: boolean;
  /** Number of terms with volume data */
  termVolumeDataSize: number;
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
 * Shows: Words, Pages, Reviews, Volume, Group
 */
export function HeaderStats({
  keyword,
  promptPagesCount,
  totalVolume,
  allLowVolume,
  termVolumeDataSize,
  isAnyEditing,
  isSaving,
  onSave,
}: HeaderStatsProps) {

  return (
    <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="FaStar" className="w-5 h-5 text-slate-blue" />
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
        <div>
          <span className="text-gray-500 block text-xs">Words</span>
          <span className="font-medium">{keyword.wordCount}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Pages</span>
          <span
            className={`font-medium ${promptPagesCount > 0 ? 'text-green-600' : 'text-gray-400'}`}
          >
            {promptPagesCount}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Reviews</span>
          <span className="font-medium">{keyword.reviewUsageCount}</span>
        </div>
        <div
          className="cursor-help"
          title={`Total monthly search volume from ${termVolumeDataSize} researched term${termVolumeDataSize === 1 ? '' : 's'}. Click "Check volume" on search terms to add more.`}
        >
          <span className="text-gray-500 block text-xs flex items-center gap-1">
            Volume
            <Icon name="FaInfoCircle" className="w-2.5 h-2.5 text-gray-400" />
          </span>
          <span
            className={`font-medium ${termVolumeDataSize > 0 ? 'text-blue-600' : 'text-gray-400'}`}
          >
            {termVolumeDataSize === 0
              ? '—'
              : allLowVolume
                ? '<10'
                : formatVolume(totalVolume)}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Group</span>
          <span className="font-medium truncate block">{keyword.groupName || 'None'}</span>
        </div>
      </div>
    </div>
  );
}

export default HeaderStats;
