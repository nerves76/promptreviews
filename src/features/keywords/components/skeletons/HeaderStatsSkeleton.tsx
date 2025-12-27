'use client';

/**
 * Loading skeleton for the HeaderStats section
 */
export function HeaderStatsSkeleton() {
  return (
    <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-3 text-sm pt-3 mt-3 border-t border-gray-100">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-12 bg-gray-200 rounded mb-1" />
            <div className="h-5 w-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeaderStatsSkeleton;
