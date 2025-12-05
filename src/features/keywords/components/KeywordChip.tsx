'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import {
  type KeywordData,
  type UsageColor,
  getUsageColorClasses,
  getUsageTooltip,
} from '../keywordUtils';

interface KeywordChipProps {
  /** The keyword data object */
  keyword: KeywordData;
  /** Whether the chip can be removed */
  onRemove?: (keywordId: string) => void;
  /** Whether the chip can be clicked for details */
  onClick?: (keyword: KeywordData) => void;
  /** Whether the chip is in a selected/active state */
  isSelected?: boolean;
  /** Whether the chip is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show usage count bubble (only for 4+ word keywords) */
  showUsageBubble?: boolean;
}

/**
 * KeywordChip Component
 *
 * Displays a keyword as a chip/tag with optional usage indicator.
 * Usage bubbles only appear on keywords with 4+ words (long-tail keywords).
 *
 * Color coding for 4+ word keywords:
 * - Gray: 0-3 uses (fresh)
 * - Yellow: 4-7 uses (getting familiar)
 * - Orange: 8-15 uses (consider rotating)
 * - Red: 16+ uses (overused)
 */
export default function KeywordChip({
  keyword,
  onRemove,
  onClick,
  isSelected = false,
  disabled = false,
  size = 'md',
  showUsageBubble = true,
}: KeywordChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const bubbleSizes = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  // Get usage color classes
  const usageColor = keyword.usageColor || 'gray';
  const colorClasses = getUsageColorClasses(usageColor);
  const tooltip = getUsageTooltip(keyword.wordCount, keyword.reviewUsageCount);

  // Should we show the usage bubble?
  const shouldShowBubble = showUsageBubble && keyword.showUsageIndicator;

  // Base chip styles
  const baseClasses = `
    inline-flex items-center font-medium rounded-full
    transition-all duration-200 relative
    ${sizeClasses[size]}
    ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${onClick && !disabled ? 'cursor-pointer hover:shadow-md' : ''}
  `;

  // Color classes based on usage (only for long-tail keywords)
  const getChipColorClasses = () => {
    if (!shouldShowBubble) {
      // Short keywords always use default styling
      return 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100';
    }

    // Long-tail keywords use usage-based coloring
    switch (usageColor) {
      case 'yellow':
        return 'text-yellow-800 bg-yellow-50 border border-yellow-300 hover:bg-yellow-100';
      case 'orange':
        return 'text-orange-800 bg-orange-50 border border-orange-300 hover:bg-orange-100';
      case 'red':
        return 'text-red-800 bg-red-50 border border-red-300 hover:bg-red-100';
      case 'gray':
      default:
        return 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100';
    }
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(keyword);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onRemove) {
      onRemove(keyword.id);
    }
  };

  return (
    <div
      className={`${baseClasses} ${getChipColorClasses()}`}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Keyword text */}
      <span className="truncate max-w-[200px]">{keyword.phrase}</span>

      {/* Usage bubble for 4+ word keywords */}
      {shouldShowBubble && (
        <span
          className={`
            inline-flex items-center justify-center
            ${bubbleSizes[size]}
            ${colorClasses.bg} ${colorClasses.text}
            rounded-full font-bold
            flex-shrink-0
          `}
          title={tooltip}
        >
          {keyword.reviewUsageCount > 99 ? '99+' : keyword.reviewUsageCount}
        </span>
      )}

      {/* Remove button */}
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={handleRemove}
          className={`
            flex items-center justify-center
            rounded-full hover:bg-black/10
            transition-colors flex-shrink-0
            ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}
          `}
          aria-label={`Remove keyword: ${keyword.phrase}`}
        >
          <Icon name="FaTimes" className={iconSizes[size]} />
        </button>
      )}

      {/* Tooltip */}
      {showTooltip && shouldShowBubble && (
        <div
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-2 py-1 text-xs text-white bg-gray-900 rounded
            whitespace-nowrap z-50 pointer-events-none
            shadow-lg
          "
        >
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/**
 * Simple keyword chip for non-unified keywords (string-based).
 * Used for backward compatibility with existing keyword arrays.
 */
export function SimpleKeywordChip({
  keyword,
  onRemove,
  disabled = false,
  size = 'md',
}: {
  keyword: string;
  onRemove?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={`
        inline-flex items-center font-medium rounded-full
        text-indigo-700 bg-indigo-50 border border-indigo-200
        hover:bg-indigo-100 transition-colors
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span className="truncate max-w-[200px]">{keyword}</span>
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={onRemove}
          className={`
            flex items-center justify-center
            rounded-full hover:bg-indigo-200
            transition-colors flex-shrink-0
            ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}
          `}
          aria-label={`Remove keyword: ${keyword}`}
        >
          <Icon name="FaTimes" className={iconSizes[size]} />
        </button>
      )}
    </div>
  );
}
