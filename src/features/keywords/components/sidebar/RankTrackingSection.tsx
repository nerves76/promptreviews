'use client';

import Icon from '@/components/Icon';
import { type RankStatusResponse, type RankingData } from '../../hooks/useRankStatus';

export interface RankTrackingSectionProps {
  /** The rank status data */
  rankStatus: RankStatusResponse | null;
  /** Whether rank status is loading */
  isLoading: boolean;
}

/**
 * Get position color based on ranking position
 */
function getPositionColor(position: number): string {
  if (position <= 3) return 'text-green-600';
  if (position <= 10) return 'text-blue-600';
  if (position <= 20) return 'text-amber-600';
  return 'text-gray-600';
}

/**
 * Single ranking item display
 */
function RankingItem({ ranking }: { ranking: RankingData }) {
  return (
    <div className="bg-white/60 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">{ranking.groupName}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
            <span>{ranking.location}</span>
            <span className="text-gray-300">•</span>
            <span className="capitalize">{ranking.device}</span>
          </div>
        </div>
        {ranking.latestCheck ? (
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              {ranking.latestCheck.position ? (
                <>
                  <span
                    className={`text-lg font-bold ${getPositionColor(ranking.latestCheck.position)}`}
                  >
                    #{ranking.latestCheck.position}
                  </span>
                  {ranking.latestCheck.positionChange !== null &&
                    ranking.latestCheck.positionChange !== 0 && (
                      <span
                        className={`text-xs font-medium ${
                          ranking.latestCheck.positionChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {ranking.latestCheck.positionChange > 0 ? '↑' : '↓'}
                        {Math.abs(ranking.latestCheck.positionChange)}
                      </span>
                    )}
                </>
              ) : (
                <span className="text-sm text-gray-500">Not found</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {new Date(ranking.latestCheck.checkedAt).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-500">No checks yet</span>
        )}
      </div>

      {/* SERP Visibility badges */}
      {ranking.latestCheck?.serpVisibility && (
        <div className="mt-2 pt-2 border-t border-gray-100/50">
          <div className="flex flex-wrap gap-1.5">
            {/* Featured Snippet */}
            {ranking.latestCheck.serpVisibility.featuredSnippet.present && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  ranking.latestCheck.serpVisibility.featuredSnippet.ours
                    ? 'bg-green-100/80 text-green-700'
                    : 'bg-gray-100/80 text-gray-600'
                }`}
              >
                <Icon name="FaStar" className="w-2.5 h-2.5" />
                Featured{ranking.latestCheck.serpVisibility.featuredSnippet.ours && ' ✓'}
              </span>
            )}

            {/* AI Overview */}
            {ranking.latestCheck.serpVisibility.aiOverview.present && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  ranking.latestCheck.serpVisibility.aiOverview.oursCited
                    ? 'bg-purple-100/80 text-purple-700'
                    : 'bg-gray-100/80 text-gray-600'
                }`}
              >
                <Icon name="FaSparkles" className="w-2.5 h-2.5" />
                AI{ranking.latestCheck.serpVisibility.aiOverview.oursCited && ' ✓'}
              </span>
            )}

            {/* PAA */}
            {ranking.latestCheck.serpVisibility.paa.questionCount > 0 && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  ranking.latestCheck.serpVisibility.paa.oursCount > 0
                    ? 'bg-blue-100/80 text-blue-700'
                    : 'bg-gray-100/80 text-gray-600'
                }`}
              >
                <Icon name="FaQuestionCircle" className="w-2.5 h-2.5" />
                PAA {ranking.latestCheck.serpVisibility.paa.oursCount}/
                {ranking.latestCheck.serpVisibility.paa.questionCount}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RankTrackingSection Component
 *
 * Displays rank tracking status with position badges and SERP visibility indicators.
 * Only renders if the keyword is used in rank tracking.
 */
export function RankTrackingSection({ rankStatus, isLoading }: RankTrackingSectionProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 backdrop-blur-sm border border-blue-100/50 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="FaChartLine" className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-medium uppercase tracking-wider text-blue-600">
          Rank tracking
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : rankStatus?.rankings && rankStatus.rankings.length > 0 ? (
        <div className="space-y-3">
          {rankStatus.rankings.map((ranking) => (
            <RankingItem key={ranking.groupId} ranking={ranking} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Added to rank tracking but no checks performed yet.
        </div>
      )}
    </div>
  );
}

export default RankTrackingSection;
