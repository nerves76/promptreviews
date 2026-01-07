'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { IconName } from '@/components/Icon';

export interface SubNavItem {
  /** Display label for the tab */
  label: string;
  /** Icon name from the Icon component */
  icon: IconName;
  /** URL to navigate to */
  href: string;
  /**
   * How to match active state:
   * - 'exact': pathname must match href exactly
   * - 'startsWith': pathname must start with href
   * Default: 'exact'
   */
  matchType?: 'exact' | 'startsWith';
}

export interface SubNavProps {
  /** Array of navigation items */
  items: SubNavItem[];
  /** Optional max width constraint (default: none) */
  maxWidth?: string;
  /** Optional className for the outer container */
  className?: string;
}

/**
 * SubNav Component
 *
 * A centralized sub-navigation component for dashboard pages.
 * Features:
 * - Responsive: grid layout on mobile, flex on desktop
 * - Click animation with scale effect
 * - Safari-compatible with proper z-index handling
 * - Consistent styling across all pages
 *
 * Usage:
 * ```tsx
 * <SubNav
 *   items={[
 *     { label: 'Library', icon: 'FaKey', href: '/dashboard/keywords' },
 *     { label: 'Rank Tracking', icon: 'FaChartLine', href: '/dashboard/keywords/rank-tracking', matchType: 'startsWith' },
 *   ]}
 * />
 * ```
 */
export function SubNav({ items, maxWidth, className = '' }: SubNavProps) {
  const pathname = usePathname();

  const isActive = (item: SubNavItem): boolean => {
    if (item.matchType === 'startsWith') {
      return pathname.startsWith(item.href);
    }
    return pathname === item.href;
  };

  // Determine grid columns based on item count
  const getGridCols = () => {
    if (items.length <= 2) return 'grid-cols-2';
    if (items.length === 3) return 'grid-cols-3';
    return 'grid-cols-2'; // 4+ items use 2 columns on mobile
  };

  return (
    <div className={`flex justify-center w-full z-20 px-4 relative isolate ${className}`}>
      <nav
        className={`
          ${getGridCols()} grid sm:flex
          bg-white/10 backdrop-blur-sm border border-white/30
          rounded-2xl sm:rounded-full p-1 shadow-lg
          ${maxWidth ? maxWidth : 'w-auto'}
          gap-1 sm:gap-0
          isolate
        `}
        role="navigation"
        aria-label="Sub navigation"
        style={{ WebkitBackfaceVisibility: 'hidden' }}
      >
        {items.map((item) => {
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                px-4 sm:px-6 py-2 sm:py-1.5
                font-semibold text-sm
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                transition-all duration-200
                rounded-xl sm:rounded-full
                flex items-center justify-center gap-2
                sm:flex-1
                active:scale-95
                cursor-pointer
                relative
                ${active
                  ? 'bg-slate-blue text-white shadow-md z-10'
                  : 'bg-transparent text-white hover:bg-white/10 z-0'
                }
              `}
              aria-current={active ? 'page' : undefined}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Icon name={item.icon} className="w-[18px] h-[18px] flex-shrink-0 pointer-events-none" size={18} />
              <span className="whitespace-nowrap pointer-events-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default SubNav;
