'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { type KeywordData, MAX_SEARCH_TERMS } from '@/features/keywords/keywordUtils';

// ============================================
// Types
// ============================================

/** Simplified config type for display purposes */
interface ConfigSummary {
  id: string;
  name: string;
  locationName?: string;
  device?: string;
}

interface SearchTermRanking {
  term: string;
  isCanonical: boolean;
  rankings: {
    configId: string;
    configName: string;
    position: number | null;
    change: number | null;
    checkedAt: string | null;
  }[];
}

interface ConceptRankAccordionProps {
  /** The keyword concept data */
  concept: KeywordData;
  /** Ranking data for each search term, keyed by term */
  termRankings?: Map<string, SearchTermRanking['rankings']>;
  /** Available tracking configurations */
  configs?: ConfigSummary[];
  /** Initially expanded state */
  defaultExpanded?: boolean;
  /** Whether the accordion is editable */
  editable?: boolean;
  /** Callback when concept is clicked (e.g., to open sidebar) */
  onConceptClick?: (concept: KeywordData) => void;
  /** Callback when "Add to config" is clicked */
  onAddToConfig?: (concept: KeywordData, configId: string) => void;
  /** Callback to add a search term */
  onAddSearchTerm?: (conceptId: string, term: string) => Promise<void>;
  /** Callback to remove a search term */
  onRemoveSearchTerm?: (conceptId: string, term: string) => Promise<void>;
  /** Callback for AI auto-fill */
  onAIEnrich?: (concept: KeywordData) => Promise<void>;
  /** Loading state for AI enrichment */
  isEnriching?: boolean;
}

// ============================================
// Helper Functions
// ============================================

function getPositionColor(position: number | null): string {
  if (position === null) return 'text-gray-400';
  if (position <= 3) return 'text-green-600';
  if (position <= 10) return 'text-blue-600';
  if (position <= 20) return 'text-amber-600';
  return 'text-gray-600';
}

function getChangeIndicator(change: number | null): React.ReactNode {
  if (change === null || change === 0) return null;
  if (change > 0) {
    return (
      <span className="text-green-600 text-xs font-medium flex items-center">
        ↑{change}
      </span>
    );
  }
  return (
    <span className="text-red-600 text-xs font-medium flex items-center">
      ↓{Math.abs(change)}
    </span>
  );
}

function calculateAvgPosition(termRankings?: Map<string, SearchTermRanking['rankings']>): number | null {
  if (!termRankings || termRankings.size === 0) return null;

  const allPositions: number[] = [];
  termRankings.forEach((rankings) => {
    rankings.forEach((r) => {
      if (r.position !== null) {
        allPositions.push(r.position);
      }
    });
  });

  if (allPositions.length === 0) return null;
  return Math.round(allPositions.reduce((a, b) => a + b, 0) / allPositions.length);
}

// ============================================
// Component
// ============================================

export default function ConceptRankAccordion({
  concept,
  termRankings,
  configs = [],
  defaultExpanded = false,
  editable = false,
  onConceptClick,
  onAddToConfig,
  onAddSearchTerm,
  onRemoveSearchTerm,
  onAIEnrich,
  isEnriching = false,
}: ConceptRankAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [newTerm, setNewTerm] = useState('');
  const [isAddingTerm, setIsAddingTerm] = useState(false);

  const searchTerms = concept.searchTerms || [];
  const hasSearchTerms = searchTerms.length > 0;
  const avgPosition = calculateAvgPosition(termRankings);
  const isAtTermLimit = searchTerms.length >= MAX_SEARCH_TERMS;

  const handleAddTerm = async () => {
    if (!newTerm.trim() || !onAddSearchTerm || isAtTermLimit) return;
    setIsAddingTerm(true);
    try {
      await onAddSearchTerm(concept.id, newTerm.trim());
      setNewTerm('');
    } finally {
      setIsAddingTerm(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3
          bg-gray-50 cursor-pointer select-none
          hover:bg-gray-100 transition-colors
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Expand/collapse icon */}
          <Icon
            name={isExpanded ? "FaChevronDown" : "FaChevronRight"}
            className="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
          />

          {/* Concept name */}
          <h3
            className="font-semibold text-gray-800 truncate cursor-pointer hover:text-slate-blue"
            onClick={(e) => {
              e.stopPropagation();
              onConceptClick?.(concept);
            }}
          >
            {concept.phrase}
          </h3>

          {/* Search term count badge */}
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
            hasSearchTerms ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {hasSearchTerms ? `${searchTerms.length} term${searchTerms.length !== 1 ? 's' : ''}` : 'No terms'}
          </span>
        </div>

        {/* Average ranking badge */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {avgPosition !== null ? (
            <span className={`text-sm font-semibold ${getPositionColor(avgPosition)}`}>
              Avg: #{avgPosition}
            </span>
          ) : hasSearchTerms ? (
            <span className="text-xs text-gray-400">Not tracked</span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100">
          {hasSearchTerms ? (
            <div className="space-y-3">
              {/* Search terms list with rankings */}
              {searchTerms.map((term) => {
                const rankings = termRankings?.get(term.term) || [];

                return (
                  <div
                    key={term.term}
                    className={`p-3 rounded-lg border ${
                      term.isCanonical
                        ? 'bg-blue-50/50 border-blue-200/50'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    {/* Term header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {term.isCanonical && (
                          <span title="Canonical term">
                            <Icon name="FaStar" className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-800 truncate">
                          &quot;{term.term}&quot;
                        </span>
                      </div>
                      {editable && onRemoveSearchTerm && (
                        <button
                          onClick={() => onRemoveSearchTerm(concept.id, term.term)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Remove term"
                        >
                          <Icon name="FaTimes" className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Rankings by config */}
                    {rankings.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {rankings.map((ranking) => (
                          <div
                            key={ranking.configId}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-100 rounded text-xs"
                          >
                            <span className="text-gray-500 truncate max-w-[100px]">
                              {ranking.configName}:
                            </span>
                            {ranking.position !== null ? (
                              <>
                                <span className={`font-semibold ${getPositionColor(ranking.position)}`}>
                                  #{ranking.position}
                                </span>
                                {getChangeIndicator(ranking.change)}
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Not tracked in any configuration</p>
                    )}
                  </div>
                );
              })}

              {/* Add term input */}
              {editable && !isAtTermLimit && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTerm();
                        }
                      }}
                      placeholder="Add search term..."
                      className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
                    />
                    <button
                      onClick={handleAddTerm}
                      disabled={!newTerm.trim() || isAddingTerm}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAddingTerm ? (
                        <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                      ) : (
                        <Icon name="FaPlus" className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {searchTerms.length}/{MAX_SEARCH_TERMS} terms
                  </p>
                </div>
              )}
              {editable && isAtTermLimit && (
                <p className="text-xs text-amber-600 pt-2 border-t border-gray-100">
                  Maximum of {MAX_SEARCH_TERMS} search terms reached
                </p>
              )}
            </div>
          ) : (
            /* Empty state - no search terms */
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100/50 rounded-full mb-3">
                <Icon name="FaExclamationTriangle" className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                No search terms
              </h4>
              <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                Add search terms to track rankings for this concept in Google.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {onAIEnrich && (
                  <button
                    onClick={() => onAIEnrich(concept)}
                    disabled={isEnriching}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {isEnriching ? (
                      <>
                        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Icon name="prompty" className="w-4 h-4" />
                        Auto-fill with AI
                      </>
                    )}
                  </button>
                )}
                {editable && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTerm();
                        }
                      }}
                      placeholder="Add term manually..."
                      className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
                    />
                    <button
                      onClick={handleAddTerm}
                      disabled={!newTerm.trim() || isAddingTerm}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add to config button */}
          {hasSearchTerms && configs.length > 0 && onAddToConfig && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Track in:</span>
                <div className="flex flex-wrap gap-1">
                  {configs.slice(0, 3).map((config) => (
                    <button
                      key={config.id}
                      onClick={() => onAddToConfig(concept, config.id)}
                      className="px-2 py-1 text-xs font-medium text-slate-blue bg-slate-blue/10 rounded hover:bg-slate-blue/20 transition-colors"
                    >
                      {config.name}
                    </button>
                  ))}
                  {configs.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-400">
                      +{configs.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
