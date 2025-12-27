'use client';

export interface SectionSkeletonProps {
  /** Number of content rows to show */
  rows?: number;
  /** Whether to show a gradient background */
  gradient?: boolean;
  /** Gradient colors (from/to) */
  gradientColors?: { from: string; to: string; border: string };
}

/**
 * Generic loading skeleton for sidebar sections
 */
export function SectionSkeleton({
  rows = 3,
  gradient = false,
  gradientColors = { from: 'gray-50', to: 'gray-50', border: 'gray-100' },
}: SectionSkeletonProps) {
  const bgClass = gradient
    ? `bg-gradient-to-br from-${gradientColors.from}/80 to-${gradientColors.to}/80 border-${gradientColors.border}/50`
    : 'bg-white/60 border-gray-100/50';

  return (
    <div className={`p-5 backdrop-blur-sm border rounded-xl animate-pulse ${bgClass}`}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>

      {/* Content rows */}
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SectionSkeleton;
