'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import { type GeoGridStatusResponse } from '../../hooks/useGeoGridStatus';

export interface GeoGridSectionProps {
  /** The geo grid status data */
  geoGridStatus: GeoGridStatusResponse | null;
  /** Whether geo grid status is loading */
  isLoading: boolean;
}

/**
 * GeoGridSection Component
 *
 * Compact badge showing geo grid tracking status with a key stat.
 * Only renders if the keyword is used in geo grid tracking.
 */
export function GeoGridSection({ geoGridStatus, isLoading }: GeoGridSectionProps) {
  if (isLoading) {
    return null;
  }

  if (!geoGridStatus?.isTracked) {
    return null;
  }

  const summary = geoGridStatus.summary;
  const hasResults = summary && summary.totalPoints > 0;

  // Calculate visibility percentage
  const visibilityPct = hasResults
    ? Math.round((summary.pointsInTop10 / summary.totalPoints) * 100)
    : null;

  // Determine color based on avg position
  const getPositionColor = (pos: number | null) => {
    if (!pos) return 'text-gray-500';
    if (pos <= 3) return 'text-green-600';
    if (pos <= 10) return 'text-blue-600';
    if (pos <= 20) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <Link
      href="/dashboard/local-ranking-grids"
      className="block p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon name="FaMapMarker" className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
            Local ranking grid
          </span>
        </div>
        <Icon
          name="FaChevronRight"
          className="w-3 h-3 text-emerald-500 group-hover:text-emerald-700 transition-colors"
        />
      </div>

      {hasResults ? (
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Avg: </span>
            <span className={`font-semibold ${getPositionColor(summary.averagePosition)}`}>
              {summary.averagePosition ? `#${summary.averagePosition}` : '--'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Top 10: </span>
            <span className="font-semibold text-gray-700">
              {visibilityPct}%
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No checks yet
        </div>
      )}
    </Link>
  );
}

export default GeoGridSection;
