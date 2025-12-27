'use client';

/**
 * Loading skeleton for the RankTrackingSection
 */
export function RankTrackingSkeleton() {
  return (
    <div className="p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 backdrop-blur-sm border border-blue-100/50 rounded-xl animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 bg-blue-200 rounded" />
        <div className="h-3 w-24 bg-blue-200 rounded" />
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white/60 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
              <div className="text-right">
                <div className="h-6 w-8 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RankTrackingSkeleton;
