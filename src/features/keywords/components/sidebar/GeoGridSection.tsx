'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import {
  type GeoGridStatusResponse,
  type GeoGridCheckResult,
  getPositionColorClass,
  getPositionBgClass,
} from '../../hooks/useGeoGridStatus';
import type { CheckPoint, PositionBucket } from '@/features/geo-grid/utils/types';

export interface GeoGridSectionProps {
  /** The geo grid status data */
  geoGridStatus: GeoGridStatusResponse | null;
  /** Whether geo grid status is loading */
  isLoading: boolean;
}

/**
 * Get position display for a grid point
 */
function getPositionDisplay(result: GeoGridCheckResult | undefined): string {
  if (!result || result.position === null) return '--';
  return `#${result.position}`;
}

/**
 * Get result for a specific check point
 */
function getResultForPoint(
  results: GeoGridCheckResult[],
  point: CheckPoint
): GeoGridCheckResult | undefined {
  return results.find((r) => r.checkPoint === point);
}

/**
 * Mini grid visualization showing positions at each check point
 */
function MiniGridVisual({ results }: { results: GeoGridCheckResult[] }) {
  const getPointStyle = (point: CheckPoint) => {
    const result = getResultForPoint(results, point);
    const bucket: PositionBucket = result?.positionBucket || 'none';
    const colorClass = getPositionColorClass(bucket);
    const bgClass = getPositionBgClass(bucket);
    return { colorClass, bgClass, display: getPositionDisplay(result) };
  };

  const n = getPointStyle('n');
  const s = getPointStyle('s');
  const e = getPointStyle('e');
  const w = getPointStyle('w');
  const c = getPointStyle('center');

  return (
    <div className="grid grid-cols-3 gap-1 w-full max-w-[140px] mx-auto text-xs font-medium">
      {/* Row 1: N */}
      <div />
      <div
        className={`${n.bgClass} ${n.colorClass} rounded-md py-1 px-2 text-center`}
        title="North"
      >
        {n.display}
      </div>
      <div />

      {/* Row 2: W, Center, E */}
      <div
        className={`${w.bgClass} ${w.colorClass} rounded-md py-1 px-2 text-center`}
        title="West"
      >
        {w.display}
      </div>
      <div
        className={`${c.bgClass} ${c.colorClass} rounded-md py-1 px-2 text-center ring-2 ring-offset-1 ring-gray-300`}
        title="Center (your business)"
      >
        {c.display}
      </div>
      <div
        className={`${e.bgClass} ${e.colorClass} rounded-md py-1 px-2 text-center`}
        title="East"
      >
        {e.display}
      </div>

      {/* Row 3: S */}
      <div />
      <div
        className={`${s.bgClass} ${s.colorClass} rounded-md py-1 px-2 text-center`}
        title="South"
      >
        {s.display}
      </div>
      <div />
    </div>
  );
}

/**
 * Visibility progress bar
 */
function VisibilityBar({
  pointsInTop10,
  totalPoints,
}: {
  pointsInTop10: number;
  totalPoints: number;
}) {
  const percentage = totalPoints > 0 ? Math.round((pointsInTop10 / totalPoints) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">Top-10 visibility</span>
        <span className="font-medium text-gray-700">
          {pointsInTop10}/{totalPoints} points
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * GeoGridSection Component
 *
 * Displays geo grid tracking status with a mini grid visualization.
 * Only renders if the keyword is used in geo grid tracking.
 */
export function GeoGridSection({ geoGridStatus, isLoading }: GeoGridSectionProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-sm border border-emerald-100/50 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="FaMapMarker" className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-medium uppercase tracking-wider text-emerald-600">
          Local ranking grid
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : geoGridStatus?.config && geoGridStatus.latestResults.length > 0 ? (
        <div className="space-y-4">
          {/* Location info */}
          <div className="text-sm text-gray-600">
            {geoGridStatus.config.locationName && (
              <span className="font-medium text-gray-800">
                {geoGridStatus.config.locationName}
              </span>
            )}
            {geoGridStatus.config.locationName && ' • '}
            <span>{geoGridStatus.config.radiusMiles} mi radius</span>
          </div>

          {/* Summary stats */}
          {geoGridStatus.summary && (
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-500">Avg position</div>
                <div
                  className={`text-xl font-bold ${
                    geoGridStatus.summary.averagePosition
                      ? geoGridStatus.summary.averagePosition <= 3
                        ? 'text-green-600'
                        : geoGridStatus.summary.averagePosition <= 10
                          ? 'text-blue-600'
                          : geoGridStatus.summary.averagePosition <= 20
                            ? 'text-amber-600'
                            : 'text-gray-600'
                      : 'text-gray-400'
                  }`}
                >
                  {geoGridStatus.summary.averagePosition
                    ? `#${geoGridStatus.summary.averagePosition}`
                    : '--'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Best</div>
                <div
                  className={`text-xl font-bold ${
                    geoGridStatus.summary.bestPosition
                      ? geoGridStatus.summary.bestPosition <= 3
                        ? 'text-green-600'
                        : geoGridStatus.summary.bestPosition <= 10
                          ? 'text-blue-600'
                          : geoGridStatus.summary.bestPosition <= 20
                            ? 'text-amber-600'
                            : 'text-gray-600'
                      : 'text-gray-400'
                  }`}
                >
                  {geoGridStatus.summary.bestPosition
                    ? `#${geoGridStatus.summary.bestPosition}`
                    : '--'}
                </div>
              </div>
            </div>
          )}

          {/* Visibility bar */}
          {geoGridStatus.summary && (
            <VisibilityBar
              pointsInTop10={geoGridStatus.summary.pointsInTop10}
              totalPoints={geoGridStatus.summary.totalPoints}
            />
          )}

          {/* Mini grid visualization */}
          <div className="py-2">
            <MiniGridVisual results={geoGridStatus.latestResults} />
          </div>

          {/* Last checked */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-emerald-100">
            <span>
              Last checked:{' '}
              {geoGridStatus.config.lastCheckedAt
                ? new Date(geoGridStatus.config.lastCheckedAt).toLocaleDateString()
                : 'Never'}
            </span>
            <Link
              href="/dashboard/local-ranking-grids"
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View grid
              <Icon name="FaChevronRight" className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      ) : geoGridStatus?.config ? (
        <div className="text-sm text-gray-500">
          Added to grid tracking but no checks performed yet.
        </div>
      ) : (
        <div className="text-sm text-gray-500">No grid tracking data available.</div>
      )}
    </div>
  );
}

export default GeoGridSection;
