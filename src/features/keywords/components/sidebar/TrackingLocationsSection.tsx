'use client';

import Icon from '@/components/Icon';
import { type RankStatusResponse, type RankingData } from '../../hooks/useRankStatus';

export interface TrackingLocationsSectionProps {
  /** The rank status containing location data */
  rankStatus: RankStatusResponse | null;
}

/**
 * TrackingLocationsSection Component
 *
 * Displays the tracking locations where the keyword is being monitored.
 * Groups unique locations and shows their status and last check date.
 */
export function TrackingLocationsSection({ rankStatus }: TrackingLocationsSectionProps) {
  // Don't render if no rankings
  if (!rankStatus?.rankings || rankStatus.rankings.length === 0) {
    return null;
  }

  // Group unique locations (may have multiple rankings per location for different terms)
  const uniqueLocations = new Map<string, RankingData>();
  rankStatus.rankings.forEach((ranking) => {
    const key = `${ranking.groupId}`;
    if (!uniqueLocations.has(key)) {
      uniqueLocations.set(key, ranking);
    }
  });

  const locations = Array.from(uniqueLocations.values());

  return (
    <div className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="FaMapMarker" className="w-5 h-5 text-slate-blue" />
          <span className="text-lg font-semibold text-gray-800">Tracking locations</span>
        </div>
      </div>
      <div className="space-y-2">
        {locations.map((location) => (
          <div
            key={location.groupId}
            className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-gray-100"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon
                name={location.isEnabled ? 'FaCheckCircle' : 'FaCircle'}
                className={`w-4 h-4 flex-shrink-0 ${location.isEnabled ? 'text-green-500' : 'text-gray-300'}`}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{location.location}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="capitalize">{location.device}</span>
                  <span className="text-gray-300">•</span>
                  <span>{location.groupName}</span>
                </div>
              </div>
            </div>
            {location.latestCheck && (
              <div className="text-xs text-gray-500 flex-shrink-0">
                {new Date(location.latestCheck.checkedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackingLocationsSection;
