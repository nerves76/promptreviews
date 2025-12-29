/**
 * RankGroupCard Component
 *
 * Displays a clickable card for a rank tracking group.
 * Shows group name, location, device, keyword count, and stats.
 */

'use client';

import Link from 'next/link';
import { RankKeywordGroup } from '../utils/types';
import { ComputerDesktopIcon, DevicePhoneMobileIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '@/app/(app)/community/utils/timeFormatter';

// ============================================
// Types
// ============================================

interface RankGroupCardProps {
  group: RankKeywordGroup;
  onRefresh?: () => void;
  /** Base URL for group detail links. Defaults to /dashboard/rank-tracking */
  linkPrefix?: string;
}

// ============================================
// Component
// ============================================

export default function RankGroupCard({ group, linkPrefix = '/dashboard/rank-tracking' }: RankGroupCardProps) {
  return (
    <Link href={`${linkPrefix}/${group.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-slate-blue/30 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{group.name}</h3>
          {group.device === 'desktop' ? (
            <ComputerDesktopIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
          ) : (
            <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{group.locationName}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {group.keywordCount || 0} keyword{group.keywordCount !== 1 ? 's' : ''}
          </span>
          {group.avgPosition && (
            <span className="font-medium text-slate-blue">
              Avg: #{Math.round(group.avgPosition)}
            </span>
          )}
        </div>

        {/* Schedule Badge */}
        {group.scheduleFrequency && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <ClockIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{group.scheduleFrequency}</span>
            </div>
          </div>
        )}

        {/* Last Checked */}
        {group.lastCheckedAt && (
          <div className="mt-2 text-xs text-gray-500">
            Last checked: {formatRelativeTime(group.lastCheckedAt)}
          </div>
        )}
      </div>
    </Link>
  );
}
