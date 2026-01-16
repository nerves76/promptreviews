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
  /** Background color variant for visual separation */
  variant?: 'default' | 'blue' | 'purple' | 'amber';
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
  variant = 'default',
}: CollapsibleSectionProps) {
  // Background color classes for different variants
  const variantClasses = {
    default: 'bg-white',
    blue: 'bg-blue-50/50',
    purple: 'bg-purple-50/50',
    amber: 'bg-amber-50/50',
  };
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
    <div className={`mt-3 first:mt-0 rounded-lg ${variantClasses[variant]} ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 px-3 text-left hover:bg-black/5 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            name={isExpanded ? 'FaChevronDown' : 'FaChevronRight'}
            className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform"
          />
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="text-base font-semibold text-gray-800 truncate">{title}</span>
          {badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-white/80 text-gray-600 rounded">
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
        <div ref={contentRef} className="pb-4 px-3">
          {isExpanded && children}
        </div>
      </div>
    </div>
  );
}

export default CollapsibleSection;
