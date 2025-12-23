'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import Icon from '@/components/Icon';

interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Optional badge content (e.g., count) */
  badge?: ReactNode;
  /** Whether the section is expanded by default */
  defaultExpanded?: boolean;
  /** Controlled expanded state (overrides internal state when provided) */
  forceExpanded?: boolean;
  /** Children to render inside the collapsible section */
  children: ReactNode;
  /** Optional className for the container */
  className?: string;
  /** Optional icon to show before title */
  icon?: ReactNode;
  /** Optional action button for the header */
  headerAction?: ReactNode;
}

/**
 * CollapsibleSection Component
 *
 * A reusable collapsible section for the ConceptCard.
 * Supports title, badge, icon, and header actions.
 */
export function CollapsibleSection({
  title,
  badge,
  defaultExpanded = false,
  forceExpanded,
  children,
  className = '',
  icon,
  headerAction,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // When forceExpanded changes to true, expand the section
  useEffect(() => {
    if (forceExpanded) {
      setIsExpanded(true);
    }
  }, [forceExpanded]);

  // Measure content height when expanded or when children change
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      });

      resizeObserver.observe(contentRef.current);
      setContentHeight(contentRef.current.scrollHeight);

      return () => {
        resizeObserver.disconnect();
      };
    } else {
      setContentHeight(0);
    }
  }, [isExpanded, children]);

  return (
    <div className={`border-t border-gray-100 first:border-t-0 ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2.5 px-1 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            name={isExpanded ? 'FaChevronDown' : 'FaChevronRight'}
            className="w-3 h-3 text-gray-400 flex-shrink-0 transition-transform"
          />
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="text-sm font-medium text-gray-700 truncate">{title}</span>
          {badge && (
            <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              {badge}
            </span>
          )}
        </div>
        {headerAction && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerAction}
          </div>
        )}
      </button>

      {/* Content - animated wrapper */}
      <div
        className="overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: contentHeight !== null ? `${contentHeight}px` : undefined }}
      >
        <div ref={contentRef} className="pb-3 px-1">
          {isExpanded && children}
        </div>
      </div>
    </div>
  );
}

export default CollapsibleSection;
