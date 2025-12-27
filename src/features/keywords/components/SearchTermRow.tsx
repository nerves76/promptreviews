'use client';

import { formatDistanceToNow } from 'date-fns';
import Icon from '@/components/Icon';
import { type SearchTerm, formatVolume, getCompetitionColor } from '../keywordUtils';

/**
 * Volume data for a search term (from keyword_research_results table)
 */
export interface VolumeData {
  searchVolume: number | null;
  cpc?: number | null;
  competitionLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  locationName?: string | null;
  researchedAt?: string | null;
}

/**
 * Ranking data for a search term (from rank tracking)
 */
export interface RankingData {
  groupId: string;
  groupName?: string;
  device: string;
  location: string;
  locationCode?: number;
  latestCheck: {
    position: number | null;
    foundUrl?: string | null;
    checkedAt: string;
    searchQuery: string;
    positionChange: number | null;
  } | null;
}

export interface SearchTermRowProps {
  /** The search term to display */
  term: SearchTerm;
  /** Volume data from keyword research (if available) */
  volumeData?: VolumeData | null;
  /** Ranking data from rank tracking (if available) */
  rankings?: RankingData[];
  /** Whether the component is in edit mode */
  isEditing?: boolean;
  /** Whether the canonical star can be changed (only in edit mode) */
  isCanonicalEditable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Callback when set canonical button is clicked */
  onSetCanonical?: () => void;
  /** Callback when check volume button is clicked */
  onCheckVolume?: () => void;
  /** Callback when check rank button is clicked */
  onCheckRank?: () => void;
  /** Whether volume check is in progress for this term */
  isCheckingVolume?: boolean;
  /** Whether rank check is in progress for this term */
  isCheckingRank?: boolean;
  /** Disable all actions (e.g., when another term is being checked) */
  disabled?: boolean;
}

/**
 * Get volume age text
 */
function getVolumeAge(researchedAt: string | null): string | null {
  if (!researchedAt) return null;
  return formatDistanceToNow(new Date(researchedAt), { addSuffix: true });
}

/**
 * SearchTermRow Component
 *
 * A shared component for rendering a single search term with volume, competition,
 * and ranking data. Used in both KeywordDetailsSidebar and ConceptCard.
 */
export function SearchTermRow({
  term,
  volumeData,
  rankings = [],
  isEditing = false,
  isCanonicalEditable = true,
  onRemove,
  onSetCanonical,
  onCheckVolume,
  onCheckRank,
  isCheckingVolume = false,
  isCheckingRank = false,
  disabled = false,
}: SearchTermRowProps) {
  const hasVolume = volumeData && volumeData.searchVolume !== null;
  const hasRankings = rankings.length > 0;

  return (
    <div
      className={`p-3 rounded-lg border ${
        term.isCanonical
          ? 'bg-blue-50/80 border-blue-200/50'
          : 'bg-white/80 border-gray-100'
      }`}
    >
      {/* Term header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {term.isCanonical && (
            <span title="Canonical term">
              <Icon name="FaStar" className="w-3 h-3 text-blue-500 flex-shrink-0" />
            </span>
          )}
          <span className="text-sm font-medium text-gray-800 truncate">
            {term.term}
          </span>
        </div>

        {/* Edit mode actions */}
        {isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {!term.isCanonical && isCanonicalEditable && onSetCanonical && (
              <button
                onClick={onSetCanonical}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Set as primary"
              >
                <Icon name="FaStar" className="w-3 h-3" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove term"
              >
                <Icon name="FaTimes" className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats row - show per-term volume data and rankings */}
      <div className="mt-2 pt-2 border-t border-gray-100/50 space-y-2">
        {/* Volume data */}
        {hasVolume && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-gray-500">Volume: </span>
                <span className="font-semibold text-gray-900">
                  {formatVolume(volumeData.searchVolume)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Icon name="FaMapMarker" className="w-2.5 h-2.5" />
                {volumeData.locationName || 'United States'}
              </div>
              {volumeData.researchedAt && (
                <span className="text-[10px] text-gray-400">
                  ({getVolumeAge(volumeData.researchedAt)})
                </span>
              )}
              {volumeData.competitionLevel && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCompetitionColor(
                    volumeData.competitionLevel
                  )}`}
                >
                  {volumeData.competitionLevel}
                </span>
              )}
            </div>
            {volumeData.cpc && (
              <div className="text-gray-500">
                CPC: <span className="font-medium text-gray-700">${volumeData.cpc.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Rankings inline - show per-location rankings for this term */}
        {hasRankings && (
          <div className="flex flex-wrap gap-1.5">
            {rankings.map((ranking) => (
              <div
                key={ranking.groupId}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded text-xs"
              >
                <span className="text-gray-500 truncate max-w-[80px]">
                  {ranking.location}:
                </span>
                {ranking.latestCheck?.position ? (
                  <>
                    <span
                      className={`font-semibold ${
                        ranking.latestCheck.position <= 3
                          ? 'text-green-600'
                          : ranking.latestCheck.position <= 10
                          ? 'text-blue-600'
                          : ranking.latestCheck.position <= 20
                          ? 'text-amber-600'
                          : 'text-gray-600'
                      }`}
                    >
                      #{ranking.latestCheck.position}
                    </span>
                    {ranking.latestCheck.positionChange !== null &&
                      ranking.latestCheck.positionChange !== 0 && (
                        <span
                          className={`text-[10px] font-medium ${
                            ranking.latestCheck.positionChange > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {ranking.latestCheck.positionChange > 0 ? '↑' : '↓'}
                          {Math.abs(ranking.latestCheck.positionChange)}
                        </span>
                      )}
                  </>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons row - only in view mode */}
        {!isEditing && (onCheckVolume || onCheckRank) && (
          <div className="flex items-center gap-2">
            {/* Check volume button */}
            {onCheckVolume && (
              <button
                onClick={onCheckVolume}
                disabled={isCheckingVolume || disabled}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCheckingVolume ? (
                  <>
                    <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Icon name="FaSearch" className="w-3 h-3" />
                    {hasVolume ? 'Re-check volume' : 'Check volume'}
                  </>
                )}
              </button>
            )}

            {/* Check rank button */}
            {onCheckRank && (
              <button
                onClick={onCheckRank}
                disabled={isCheckingRank || disabled}
                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCheckingRank ? (
                  <>
                    <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Icon name="FaChartLine" className="w-3 h-3" />
                    {hasRankings ? 'Re-check rank' : 'Check rank'}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
