/**
 * HelpBubble Component
 *
 * Universal glassmorphic help icon that can be used inline throughout the dashboard
 * Maintains consistent design with the main help bubble in corner
 * Opens help modal with specific article when clicked
 */

'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import HelpModal from '@/app/(app)/components/help/HelpModal';

interface HelpBubbleProps {
  /**
   * The help article path to open (e.g., 'metrics/total-reviews')
   * Will be prefixed with 'google-biz-optimizer/' for GBP articles
   */
  articlePath?: string;

  /**
   * Optional label for accessibility
   */
  label?: string;

  /**
   * Size of the bubble
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Optional tooltip text
   */
  tooltip?: string;

  /**
   * Optional custom click handler (instead of opening help modal)
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show inline (no absolute positioning)
   */
  inline?: boolean;
}

export default function HelpBubble({
  articlePath,
  label = 'Learn more',
  size = 'sm',
  tooltip,
  onClick,
  className = '',
  inline = true
}: HelpBubbleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Size configurations
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault();

    if (onClick) {
      onClick();
    } else {
      setIsModalOpen(true);
    }
  };

  const baseClasses = inline
    ? 'inline-flex'
    : 'absolute';

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          items-center justify-center
          rounded-full
          bg-blue-100 hover:bg-blue-700
          transition-all duration-200
          group
          relative
          ${className}
        `}
        style={{
          transform: 'translate(2px, 1px)'
        }}
        aria-label={label}
        type="button"
      >
        <span className="text-blue-700 group-hover:text-blue-100 transition-colors duration-200 font-semibold" style={{ fontSize: `${iconSizes[size] * 0.7}px`, lineHeight: 1 }}>
          ?
        </span>

        {/* Tooltip */}
        {(tooltip || label) && showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
            <div className="px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap">
              {tooltip || label}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </button>

      {/* Help Modal - only render if we're handling the modal internally */}
      {!onClick && (
        <HelpModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialArticleId={articlePath}
        />
      )}
    </>
  );
}

/**
 * Variant specifically for Google Business Profile metrics
 */
export function GBPHelpBubble({
  metric,
  ...props
}: Omit<HelpBubbleProps, 'articlePath'> & { metric: string }) {
  return (
    <HelpBubble
      articlePath={`google-biz-optimizer/${metric}`}
      {...props}
    />
  );
}