'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import KeywordChip from './KeywordChip';
import { type KeywordData, type KeywordGroupData } from '../keywordUtils';

interface KeywordGroupAccordionProps {
  /** The group data */
  group: KeywordGroupData;
  /** Keywords in this group */
  keywords: KeywordData[];
  /** Initially expanded state */
  defaultExpanded?: boolean;
  /** Callback when a keyword is clicked */
  onKeywordClick?: (keyword: KeywordData) => void;
  /** Callback when a keyword is removed */
  onKeywordRemove?: (keywordId: string) => void;
  /** Callback when the group is edited */
  onGroupEdit?: (group: KeywordGroupData) => void;
  /** Callback when the group is deleted */
  onGroupDelete?: (groupId: string) => void;
  /** Whether the group can be modified */
  editable?: boolean;
  /** Whether this is the "General" group (can't be renamed/deleted) */
  isDefaultGroup?: boolean;
}

/**
 * KeywordGroupAccordion Component
 *
 * Displays a collapsible group of keywords with:
 * - Expandable/collapsible header
 * - Keyword count badge
 * - Edit/delete actions (except for "General" group)
 * - Grid of KeywordChips inside
 */
export default function KeywordGroupAccordion({
  group,
  keywords,
  defaultExpanded = false,
  onKeywordClick,
  onKeywordRemove,
  onGroupEdit,
  onGroupDelete,
  editable = true,
  isDefaultGroup = false,
}: KeywordGroupAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);

  // Sort keywords: most used first for long-tail, then alphabetically
  const sortedKeywords = [...keywords].sort((a, b) => {
    // Long-tail keywords (4+ words) with high usage come first
    if (a.showUsageIndicator && b.showUsageIndicator) {
      return b.reviewUsageCount - a.reviewUsageCount;
    }
    // Long-tail before short
    if (a.showUsageIndicator && !b.showUsageIndicator) return -1;
    if (!a.showUsageIndicator && b.showUsageIndicator) return 1;
    // Alphabetically for same type
    return a.phrase.localeCompare(b.phrase);
  });

  // Count keywords by usage color for summary
  const usageStats = keywords.reduce(
    (acc, kw) => {
      if (kw.showUsageIndicator) {
        acc[kw.usageColor] = (acc[kw.usageColor] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3
          bg-gray-50 cursor-pointer select-none
          hover:bg-gray-100 transition-colors
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Expand/collapse icon */}
          <Icon
            name={isExpanded ? "FaChevronDown" : "FaChevronRight"}
            className="w-3.5 h-3.5 text-gray-500"
          />

          {/* Group name */}
          <h3 className="font-semibold text-gray-800">{group.name}</h3>

          {/* Keyword count badge */}
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
            {keywords.length}
          </span>

          {/* Usage color indicators */}
          {Object.keys(usageStats).length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {usageStats.red && (
                <span
                  className="w-2 h-2 rounded-full bg-red-400"
                  title={`${usageStats.red} overused`}
                />
              )}
              {usageStats.orange && (
                <span
                  className="w-2 h-2 rounded-full bg-orange-400"
                  title={`${usageStats.orange} consider rotating`}
                />
              )}
              {usageStats.yellow && (
                <span
                  className="w-2 h-2 rounded-full bg-yellow-400"
                  title={`${usageStats.yellow} getting familiar`}
                />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {editable && (isHovered || isExpanded) && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {!isDefaultGroup && onGroupEdit && (
              <button
                type="button"
                onClick={() => onGroupEdit(group)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="Edit group"
              >
                <Icon name="FaEdit" className="w-3.5 h-3.5" />
              </button>
            )}
            {!isDefaultGroup && onGroupDelete && (
              <button
                type="button"
                onClick={() => onGroupDelete(group.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete group"
              >
                <Icon name="FaTrash" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100">
          {keywords.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No keywords in this group</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedKeywords.map((keyword) => (
                <KeywordChip
                  key={keyword.id}
                  keyword={keyword}
                  onClick={onKeywordClick}
                  onRemove={editable ? onKeywordRemove : undefined}
                  size="md"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ungrouped keywords section (for keywords with null group_id)
 */
export function UngroupedKeywordsSection({
  keywords,
  defaultExpanded = true,
  onKeywordClick,
  onKeywordRemove,
  editable = true,
}: {
  keywords: KeywordData[];
  defaultExpanded?: boolean;
  onKeywordClick?: (keyword: KeywordData) => void;
  onKeywordRemove?: (keywordId: string) => void;
  editable?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (keywords.length === 0) return null;

  return (
    <div className="border border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Icon
            name={isExpanded ? "FaChevronDown" : "FaChevronRight"}
            className="w-3.5 h-3.5 text-gray-400"
          />
          <h3 className="font-medium text-gray-600">Ungrouped</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-500 rounded-full">
            {keywords.length}
          </span>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <KeywordChip
                key={keyword.id}
                keyword={keyword}
                onClick={onKeywordClick}
                onRemove={editable ? onKeywordRemove : undefined}
                size="md"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
