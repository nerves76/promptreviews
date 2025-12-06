/**
 * GeoGridMap Component
 *
 * Visual representation of the geo grid with color-coded rank visibility.
 * Shows check points on a simplified map view with position bucket colors.
 */

'use client';

import React, { useMemo } from 'react';
import { GGCheckResult, CheckPoint, PositionBucket } from '../utils/types';

// ============================================
// Types
// ============================================

interface GeoGridMapProps {
  /** Check results to display */
  results: GGCheckResult[];
  /** Center point coordinates */
  center: {
    lat: number;
    lng: number;
  };
  /** Radius in miles */
  radiusMiles: number;
  /** Selected keyword ID to filter by (shows all if not set) */
  selectedKeywordId?: string;
  /** Callback when a point is clicked */
  onPointClick?: (point: CheckPoint, results: GGCheckResult[]) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

interface PointData {
  point: CheckPoint;
  position: { x: number; y: number };
  bucket: PositionBucket;
  avgPosition: number | null;
  results: GGCheckResult[];
}

// ============================================
// Constants
// ============================================

const BUCKET_COLORS: Record<PositionBucket, string> = {
  top3: 'bg-green-500',
  top10: 'bg-yellow-500',
  top20: 'bg-orange-500',
  none: 'bg-red-500',
};

const BUCKET_LABELS: Record<PositionBucket, string> = {
  top3: 'Top 3',
  top10: 'Top 10',
  top20: 'Top 20',
  none: 'Not Found',
};

const SIZE_CONFIG = {
  sm: { container: 'w-48 h-48', point: 'w-6 h-6', centerPoint: 'w-8 h-8', fontSize: 'text-xs' },
  md: { container: 'w-64 h-64', point: 'w-8 h-8', centerPoint: 'w-10 h-10', fontSize: 'text-sm' },
  lg: { container: 'w-80 h-80', point: 'w-10 h-10', centerPoint: 'w-12 h-12', fontSize: 'text-base' },
};

// Point positions as percentages (center is 50%, 50%)
const POINT_POSITIONS: Record<CheckPoint, { x: number; y: number }> = {
  center: { x: 50, y: 50 },
  n: { x: 50, y: 10 },
  s: { x: 50, y: 90 },
  e: { x: 90, y: 50 },
  w: { x: 10, y: 50 },
  ne: { x: 78, y: 22 },
  nw: { x: 22, y: 22 },
  se: { x: 78, y: 78 },
  sw: { x: 22, y: 78 },
};

// ============================================
// Helper Functions
// ============================================

function calculatePointData(
  results: GGCheckResult[],
  selectedKeywordId?: string
): Map<CheckPoint, PointData> {
  const pointMap = new Map<CheckPoint, PointData>();

  // Filter by keyword if specified
  const filteredResults = selectedKeywordId
    ? results.filter((r) => r.keywordId === selectedKeywordId)
    : results;

  // Group by check point
  const grouped = new Map<CheckPoint, GGCheckResult[]>();
  for (const result of filteredResults) {
    const existing = grouped.get(result.checkPoint) || [];
    existing.push(result);
    grouped.set(result.checkPoint, existing);
  }

  // Calculate aggregates for each point
  for (const [point, pointResults] of grouped) {
    // Determine best bucket (prioritize better rankings)
    const buckets = pointResults.map((r) => r.positionBucket);
    let bestBucket: PositionBucket = 'none';
    if (buckets.includes('top3')) bestBucket = 'top3';
    else if (buckets.includes('top10')) bestBucket = 'top10';
    else if (buckets.includes('top20')) bestBucket = 'top20';

    // Calculate average position (only for found results)
    const foundResults = pointResults.filter((r) => r.position !== null);
    const avgPosition =
      foundResults.length > 0
        ? foundResults.reduce((sum, r) => sum + (r.position || 0), 0) / foundResults.length
        : null;

    pointMap.set(point, {
      point,
      position: POINT_POSITIONS[point],
      bucket: bestBucket,
      avgPosition,
      results: pointResults,
    });
  }

  return pointMap;
}

// ============================================
// Component
// ============================================

export function GeoGridMap({
  results,
  center,
  radiusMiles,
  selectedKeywordId,
  onPointClick,
  size = 'md',
}: GeoGridMapProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const pointData = useMemo(
    () => calculatePointData(results, selectedKeywordId),
    [results, selectedKeywordId]
  );

  const allPoints: CheckPoint[] = ['center', 'n', 's', 'e', 'w'];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
      {/* Map Container */}
      <div className={`relative ${sizeConfig.container} mx-auto`}>
        {/* Background circle (represents radius) */}
        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-full" />

        {/* Grid lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />

        {/* Points */}
        {allPoints.map((point) => {
          const data = pointData.get(point);
          const position = POINT_POSITIONS[point];
          const isCenter = point === 'center';
          const pointSize = isCenter ? sizeConfig.centerPoint : sizeConfig.point;
          const bucketColor = data ? BUCKET_COLORS[data.bucket] : 'bg-gray-300';

          return (
            <button
              key={point}
              onClick={() => data && onPointClick?.(point, data.results)}
              disabled={!data}
              className={`
                absolute ${pointSize} rounded-full ${bucketColor}
                transform -translate-x-1/2 -translate-y-1/2
                flex items-center justify-center
                ${data ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-2' : 'cursor-default opacity-50'}
                transition-all duration-200
                ${isCenter ? 'ring-2 ring-white shadow-lg' : 'shadow'}
              `}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
              title={data ? `${BUCKET_LABELS[data.bucket]}${data.avgPosition ? ` (avg #${Math.round(data.avgPosition)})` : ''}` : 'No data'}
            >
              {data?.avgPosition && (
                <span className={`text-white font-bold ${sizeConfig.fontSize}`}>
                  {Math.round(data.avgPosition)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {(Object.entries(BUCKET_COLORS) as [PositionBucket, string][]).map(([bucket, color]) => (
          <div key={bucket} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-gray-600">{BUCKET_LABELS[bucket]}</span>
          </div>
        ))}
      </div>

      {/* Radius info */}
      <p className="text-center text-xs text-gray-500 mt-2">
        {radiusMiles} mile radius from center
      </p>
    </div>
  );
}

export default GeoGridMap;
