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
 * Compact badge showing geo grid tracking status with link to view results.
 * Only renders if the keyword is used in geo grid tracking.
 */
export function GeoGridSection({ geoGridStatus, isLoading }: GeoGridSectionProps) {
  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (!geoGridStatus?.isTracked) {
    return null;
  }

  return (
    <Link
      href="/dashboard/local-ranking-grids"
      className="flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-2">
        <Icon name="FaMapMarker" className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-800">
          Tracked in local ranking grid
        </span>
      </div>
      <Icon
        name="FaChevronRight"
        className="w-3 h-3 text-emerald-500 group-hover:text-emerald-700 transition-colors"
      />
    </Link>
  );
}

export default GeoGridSection;
