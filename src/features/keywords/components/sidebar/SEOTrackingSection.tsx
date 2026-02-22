'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { type KeywordData, type SearchTerm, type ResearchResultData } from '../../keywordUtils';
import { type RankStatusResponse } from '../../hooks/useRankStatus';
import { type GeoGridStatusResponse } from '../../hooks/useGeoGridStatus';
import { type RelevanceWarning } from '../../hooks/useKeywordEditor';

// LLM provider constants
export const LLM_PROVIDERS = ['chatgpt', 'perplexity', 'gemini', 'claude'] as const;
export type LLMProvider = (typeof LLM_PROVIDERS)[number];

export const LLM_PROVIDER_LABELS: Record<LLMProvider, string> = {
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
  claude: 'Claude',
};

export const LLM_PROVIDER_COLORS: Record<LLMProvider, { bg: string; text: string; border: string }> = {
  chatgpt: { bg: 'bg-llm-chatgpt-bg', text: 'text-llm-chatgpt-text', border: 'border-llm-chatgpt-border/30' },
  claude: { bg: 'bg-llm-claude-bg', text: 'text-llm-claude-text', border: 'border-llm-claude-border/30' },
  gemini: { bg: 'bg-llm-gemini-bg', text: 'text-llm-gemini-text', border: 'border-llm-gemini-border/30' },
  perplexity: { bg: 'bg-llm-perplexity-bg', text: 'text-llm-perplexity-text', border: 'border-llm-perplexity-border/30' },
};

const MAX_SEARCH_TERMS = 10;

export interface SEOTrackingSectionProps {
  /** The keyword being displayed */
  keyword: KeywordData;
  /** Whether in edit mode */
  isEditing: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Callback to start editing */
  onStartEditing: () => void;
  /** Callback to save changes */
  onSave: () => Promise<void>;
  /** Callback to cancel editing */
  onCancel: () => void;

  // Search terms
  /** The edited search terms */
  editedSearchTerms: SearchTerm[];
  /** New search term input value */
  newSearchTerm: string;
  /** Callback when new search term input changes */
  onNewSearchTermChange: (value: string) => void;
  /** Callback to add a search term */
  onAddSearchTerm: () => void;
  /** Callback to remove a search term */
  onRemoveSearchTerm: (term: string) => void;
  /** Callback to set a term as canonical */
  onSetCanonical: (term: string) => void;
  /** Relevance warning for term being added */
  relevanceWarning: RelevanceWarning | null;
  /** Callback to add term despite warning */
  onAddAnyway: () => void;
  /** Callback to dismiss relevance warning */
  onDismissRelevanceWarning: () => void;

  // Volume data
  /** Map of term volumes */
  termVolumeData: Map<string, ResearchResultData>;
  /** Term currently being checked for volume */
  checkingTermVolume: string | null;
  /** Whether volume lookup is in progress */
  isLookingUpVolume: boolean;
  /** Callback to check volume for a term */
  onCheckTermVolume: (term: string) => void;
  /** Volume lookup error message */
  volumeLookupError: string | null;

  // Rank status
  /** Rank status data */
  rankStatus: RankStatusResponse | null;
  /** Geo grid status data */
  geoGridStatus: GeoGridStatusResponse | null;
  /** Callback to check rank for a term */
  onCheckRank?: (term: string, keywordId: string) => void;

  /** Whether section is initially collapsed (default: false) */
  defaultCollapsed?: boolean;
}

/**
 * Normalize phrase for comparison
 */
function normalizePhrase(phrase: string): string {
  return phrase.toLowerCase().trim();
}

/**
 * Format volume number
 */
function formatVolume(volume: number | null | undefined): string {
  if (volume === null || volume === undefined) return '—';
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

/**
 * Get competition level color classes
 */
function getCompetitionColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    case 'high':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get position color based on ranking
 */
function getPositionColor(position: number): string {
  if (position <= 3) return 'text-green-600';
  if (position <= 10) return 'text-blue-600';
  if (position <= 20) return 'text-amber-600';
  return 'text-gray-600';
}

/**
 * SEOTrackingSection Component
 *
 * Displays and allows editing of search engine tracking data:
 * - Search terms with volume and ranking data
 * - Geo grid tracking status
 */
export function SEOTrackingSection({
  keyword,
  isEditing,
  isSaving,
  onStartEditing,
  onSave,
  onCancel,
  editedSearchTerms,
  newSearchTerm,
  onNewSearchTermChange,
  onAddSearchTerm,
  onRemoveSearchTerm,
  onSetCanonical,
  relevanceWarning,
  onAddAnyway,
  onDismissRelevanceWarning,
  termVolumeData,
  checkingTermVolume,
  isLookingUpVolume,
  onCheckTermVolume,
  volumeLookupError,
  rankStatus,
  geoGridStatus,
  onCheckRank,
  defaultCollapsed = false,
}: SEOTrackingSectionProps) {
  const searchTermsAtLimit = editedSearchTerms.length >= MAX_SEARCH_TERMS;
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Expand when editing starts
  useEffect(() => {
    if (isEditing) {
      setIsCollapsed(false);
    }
  }, [isEditing]);

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden">
      {/* Section header - clickable to collapse */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer select-none"
        onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Icon name="FaChartLine" className="w-5 h-5 text-slate-blue" />
          <span className="text-lg font-semibold text-gray-800">Search engine tracking</span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing();
                }}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit search engine tracking"
                aria-label="Edit search engine tracking"
              >
                <Icon name="FaEdit" className="w-4 h-4" />
              </button>
              <Icon
                name="FaChevronDown"
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                  isCollapsed ? '' : 'rotate-180'
                }`}
              />
            </>
          ) : (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onCancel}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-2.5 py-1 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1"
              >
                {isSaving && <Icon name="FaSpinner" className="w-2.5 h-2.5 animate-spin" />}
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="px-5 py-5 space-y-5 border-t border-gray-100">
        {/* Search Terms */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Search terms</label>
          <p className="text-xs text-gray-600 mb-2">
            Terms tracked in Google SERPs. The root phrase that defines this concept should share
            root words with these terms.
          </p>

          {/* Existing terms list */}
          {editedSearchTerms.length > 0 ? (
            <div className="space-y-2 mb-3">
              {editedSearchTerms.map((term) => (
                <SearchTermItem
                  key={term.term}
                  term={term}
                  isEditing={isEditing}
                  termVolumeData={termVolumeData}
                  rankStatus={rankStatus}
                  geoGridStatus={geoGridStatus}
                  checkingTermVolume={checkingTermVolume}
                  isLookingUpVolume={isLookingUpVolume}
                  onCheckTermVolume={onCheckTermVolume}
                  onCheckRank={onCheckRank}
                  keywordId={keyword.id}
                  onSetCanonical={onSetCanonical}
                  onRemove={onRemoveSearchTerm}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 italic bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100 mb-3">
              No search terms added
            </div>
          )}

          {/* Add new term input */}
          {isEditing && !searchTermsAtLimit && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSearchTerm}
                  onChange={(e) => onNewSearchTermChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddSearchTerm();
                    }
                  }}
                  placeholder="e.g., portland plumber"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                  aria-label="New search term"
                />
                <button
                  onClick={onAddSearchTerm}
                  disabled={!newSearchTerm.trim()}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Add search term"
                >
                  <Icon name="FaPlus" className="w-3 h-3" />
                </button>
              </div>

              {/* Relevance warning */}
              {relevanceWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon
                      name="FaExclamationTriangle"
                      className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">
                        This term may not match the concept
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        &quot;{relevanceWarning.term}&quot; doesn&apos;t share root words with
                        &quot;{keyword.phrase}&quot;.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={onAddAnyway}
                          className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200 transition-colors"
                        >
                          Add anyway
                        </button>
                        <button
                          onClick={onDismissRelevanceWarning}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600">
                <Icon name="FaStar" className="w-2.5 h-2.5 inline mr-1" />= Canonical term (shown
                when space is limited)
              </p>
            </div>
          )}
          {isEditing && searchTermsAtLimit && (
            <p className="text-xs text-amber-600">
              Maximum of {MAX_SEARCH_TERMS} search terms reached
            </p>
          )}

          {/* Volume lookup error */}
          {volumeLookupError && (
            <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
              <Icon name="FaExclamationTriangle" className="w-3 h-3" />
              {volumeLookupError}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}

/**
 * SearchTermItem - Individual search term display
 */
function SearchTermItem({
  term,
  isEditing,
  termVolumeData,
  rankStatus,
  geoGridStatus,
  checkingTermVolume,
  isLookingUpVolume,
  onCheckTermVolume,
  onCheckRank,
  keywordId,
  onSetCanonical,
  onRemove,
}: {
  term: SearchTerm;
  isEditing: boolean;
  termVolumeData: Map<string, ResearchResultData>;
  rankStatus: RankStatusResponse | null;
  geoGridStatus: GeoGridStatusResponse | null;
  checkingTermVolume: string | null;
  isLookingUpVolume: boolean;
  onCheckTermVolume: (term: string) => void;
  onCheckRank?: (term: string, keywordId: string) => void;
  keywordId: string;
  onSetCanonical: (term: string) => void;
  onRemove: (term: string) => void;
}) {
  const normalizedTerm = normalizePhrase(term.term);
  const termData = termVolumeData.get(normalizedTerm);

  // Find rankings for this specific term
  const termRankings =
    rankStatus?.rankings?.filter((r) => r.latestCheck?.searchQuery === term.term) || [];

  return (
    <div
      className={`p-3 rounded-lg border ${
        term.isCanonical ? 'bg-blue-50/80 border-blue-200/50' : 'bg-white/80 border-gray-100'
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
          <span className="text-sm font-medium text-gray-800 truncate">{term.term}</span>
        </div>
        {isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {!term.isCanonical && (
              <button
                onClick={() => onSetCanonical(term.term)}
                className="p-1 text-gray-600 hover:text-blue-500 rounded transition-colors"
                title="Set as primary"
                aria-label={`Set ${term.term} as primary term`}
              >
                <Icon name="FaStar" className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => onRemove(term.term)}
              className="p-1 text-gray-600 hover:text-red-500 rounded transition-colors"
              title="Remove term"
              aria-label={`Remove search term: ${term.term}`}
            >
              <Icon name="FaTimes" className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-2 pt-2 border-t border-gray-100/50 space-y-2">
        {/* Volume data */}
        {termData && termData.searchVolume !== null && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-gray-600">Volume: </span>
                <span className="font-semibold text-gray-900">
                  {formatVolume(termData.searchVolume)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Icon name="FaMapMarker" className="w-2.5 h-2.5" />
                {termData.locationName || 'United States'}
              </div>
              {termData.competitionLevel && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCompetitionColor(termData.competitionLevel)}`}
                >
                  {termData.competitionLevel}
                </span>
              )}
            </div>
            {termData.cpc && (
              <div className="text-gray-600">
                CPC: <span className="font-medium text-gray-700">${termData.cpc.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Rankings inline */}
        {termRankings.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {termRankings.map((ranking) => (
              <div
                key={ranking.groupId}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded text-xs"
              >
                <span className="text-gray-600 truncate max-w-[80px]">{ranking.location}:</span>
                {ranking.latestCheck?.position ? (
                  <>
                    <span className={`font-semibold ${getPositionColor(ranking.latestCheck.position)}`}>
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
                  <span className="text-gray-600">—</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Geo Grid tracking inline */}
        {geoGridStatus?.isTracked && geoGridStatus.summary && geoGridStatus.summary.totalPoints > 0 && (
          <Link
            href="/dashboard/local-ranking-grids"
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-xs transition-colors"
          >
            <Icon name="FaMapMarker" className="w-3 h-3 text-emerald-600" />
            <span className="text-emerald-700">Grid:</span>
            <span className={`font-semibold ${
              geoGridStatus.summary.averagePosition
                ? geoGridStatus.summary.averagePosition <= 3
                  ? 'text-green-600'
                  : geoGridStatus.summary.averagePosition <= 10
                    ? 'text-blue-600'
                    : geoGridStatus.summary.averagePosition <= 20
                      ? 'text-amber-600'
                      : 'text-gray-600'
                : 'text-gray-600'
            }`}>
              {geoGridStatus.summary.averagePosition
                ? `Avg #${geoGridStatus.summary.averagePosition}`
                : '—'}
            </span>
            <span className="text-emerald-600">
              ({Math.round((geoGridStatus.summary.pointsInTop10 / geoGridStatus.summary.totalPoints) * 100)}% top 10)
            </span>
          </Link>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-2">
          {/* Check volume button */}
          {(!termData || termData.searchVolume === null) && (
            <button
              onClick={() => onCheckTermVolume(term.term)}
              disabled={checkingTermVolume === term.term || isLookingUpVolume}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
              aria-label={`Check volume for ${term.term}`}
            >
              {checkingTermVolume === term.term ? (
                <>
                  <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Icon name="FaSearch" className="w-3 h-3" />
                  Check volume
                </>
              )}
            </button>
          )}

          {/* Check rank button */}
          {onCheckRank && keywordId && (
            <button
              onClick={() => onCheckRank(term.term, keywordId)}
              className="text-xs text-slate-blue hover:text-slate-blue/80 flex items-center gap-1"
              aria-label={`Check rank for ${term.term}`}
            >
              <Icon name="FaChartLine" className="w-3 h-3" />
              Check rank
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SEOTrackingSection;
