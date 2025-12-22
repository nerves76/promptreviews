'use client';

import { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/Icon';
import { CollapsibleSection } from './CollapsibleSection';
import { apiClient } from '@/utils/apiClient';
import {
  type KeywordData,
  type SearchTerm,
  type RelatedQuestion,
  type ResearchResultData,
  normalizePhrase,
  getFunnelStageColor,
} from '../keywordUtils';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
} from '@/features/llm-visibility/utils/types';

// Types for rank status API response
interface RankingData {
  groupId: string;
  groupName: string;
  device: string;
  location: string;
  locationCode: number;
  isEnabled: boolean;
  latestCheck: {
    position: number | null;
    foundUrl: string | null;
    checkedAt: string;
    searchQuery: string;
    positionChange: number | null;
  } | null;
}

interface RankStatusResponse {
  isTracked: boolean;
  keyword: {
    id: string;
    phrase: string;
    searchQuery: string | null;
  };
  rankings: RankingData[];
}

// LLM Result type
interface LLMVisibilityResult {
  question: string;
  llmProvider: LLMProvider;
  domainCited: boolean;
  citationPosition: number | null;
  checkedAt: string;
}

interface ConceptCardProps {
  /** The keyword data to display */
  keyword: KeywordData;
  /** Callback when the card is clicked to open details */
  onOpenDetails?: (keyword: KeywordData) => void;
  /** Callback to update keyword */
  onUpdate?: (id: string, updates: Partial<KeywordData>) => Promise<KeywordData | null>;
  /** Callback when user wants to check rank for a search term */
  onCheckRank?: (term: string, conceptId: string) => void;
  /** Optional: Show edit actions */
  showEditActions?: boolean;
  /** Optional: Prompt page usage (array of page names) */
  promptPageNames?: string[];
}

/**
 * ConceptCard Component
 *
 * An expanded card view of a keyword concept, modeled after the sidebar.
 * Shows search terms, related questions, volume, and rank data inline.
 */
export function ConceptCard({
  keyword,
  onOpenDetails,
  onUpdate,
  onCheckRank,
  showEditActions = true,
  promptPageNames = [],
}: ConceptCardProps) {
  // State for fetched data
  const [termVolumeData, setTermVolumeData] = useState<Map<string, ResearchResultData>>(new Map());
  const [isLoadingVolume, setIsLoadingVolume] = useState(false);
  const [checkingTermVolume, setCheckingTermVolume] = useState<string | null>(null);

  const [rankStatus, setRankStatus] = useState<RankStatusResponse | null>(null);
  const [isLoadingRank, setIsLoadingRank] = useState(false);

  const [llmResults, setLlmResults] = useState<LLMVisibilityResult[]>([]);
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);

  // Fetch volume data for search terms
  useEffect(() => {
    if (keyword.searchTerms && keyword.searchTerms.length > 0) {
      setIsLoadingVolume(true);
      apiClient
        .get<{ results: ResearchResultData[] }>(`/keyword-research/results?keywordId=${keyword.id}`)
        .then((response) => {
          const map = new Map<string, ResearchResultData>();
          for (const r of response.results) {
            map.set(r.normalizedTerm, r);
          }
          setTermVolumeData(map);
        })
        .catch((err) => {
          console.error('Failed to fetch volume data:', err);
          setTermVolumeData(new Map());
        })
        .finally(() => setIsLoadingVolume(false));
    }
  }, [keyword.id, keyword.searchTerms]);

  // Fetch rank status if keyword is used in rank tracking
  useEffect(() => {
    if (keyword.isUsedInRankTracking) {
      setIsLoadingRank(true);
      apiClient
        .get<RankStatusResponse>(`/keywords/${keyword.id}/rank-status`)
        .then(setRankStatus)
        .catch((err) => {
          console.error('Failed to fetch rank status:', err);
          setRankStatus(null);
        })
        .finally(() => setIsLoadingRank(false));
    }
  }, [keyword.id, keyword.isUsedInRankTracking]);

  // Fetch LLM visibility results if there are related questions
  useEffect(() => {
    if (keyword.relatedQuestions && keyword.relatedQuestions.length > 0) {
      setIsLoadingLLM(true);
      apiClient
        .get<{ results: LLMVisibilityResult[] }>(`/llm-visibility/results?keywordId=${keyword.id}`)
        .then((response) => setLlmResults(response.results || []))
        .catch((err) => {
          console.error('Failed to fetch LLM results:', err);
          setLlmResults([]);
        })
        .finally(() => setIsLoadingLLM(false));
    }
  }, [keyword.id, keyword.relatedQuestions]);

  // Build question -> provider -> result map
  const questionLLMMap = useMemo(() => {
    const map = new Map<string, Map<LLMProvider, { domainCited: boolean; citationPosition?: number | null; checkedAt: string }>>();
    for (const result of llmResults) {
      if (!map.has(result.question)) {
        map.set(result.question, new Map());
      }
      const providerMap = map.get(result.question)!;
      const existing = providerMap.get(result.llmProvider);
      if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
        providerMap.set(result.llmProvider, {
          domainCited: result.domainCited,
          citationPosition: result.citationPosition,
          checkedAt: result.checkedAt,
        });
      }
    }
    return map;
  }, [llmResults]);

  // Calculate total volume
  const totalVolume = useMemo(() => {
    const terms = Array.from(termVolumeData.values());
    return terms.reduce((sum, t) => sum + (t.searchVolume || 0), 0);
  }, [termVolumeData]);

  const allLowVolume = useMemo(() => {
    const terms = Array.from(termVolumeData.values());
    return terms.length > 0 && terms.every(t => (t.searchVolume || 0) < 10);
  }, [termVolumeData]);

  // Format volume display
  const formatVolume = (vol: number | null) => {
    if (vol === null || vol === undefined) return '—';
    if (vol < 10) return '<10';
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  // Check volume for a term
  const handleCheckTermVolume = async (term: string) => {
    setCheckingTermVolume(term);
    try {
      const response = await apiClient.post<{
        keyword: string;
        volume: number;
        cpc: number | null;
        competition: number | null;
        competitionLevel: string | null;
        monthlySearches: Array<{ month: number; year: number; searchVolume: number }> | null;
      }>('/rank-tracking/discovery', {
        keyword: term,
        locationCode: keyword.searchVolumeLocationCode || 2840,
      });

      // Save the result
      await apiClient.post('/keyword-research/save', {
        term,
        searchVolume: response.volume,
        cpc: response.cpc,
        competition: response.competition,
        competitionLevel: response.competitionLevel,
        searchVolumeTrend: response.monthlySearches ? {
          monthlyData: response.monthlySearches.map((m) => ({
            month: m.month,
            year: m.year,
            volume: m.searchVolume,
          })),
        } : null,
        monthlySearches: response.monthlySearches,
        locationCode: keyword.searchVolumeLocationCode || 2840,
        locationName: keyword.searchVolumeLocationName || 'United States',
        keywordId: keyword.id,
      });

      // Update local state
      const normalizedTerm = normalizePhrase(term);
      setTermVolumeData((prev) => {
        const newMap = new Map(prev);
        newMap.set(normalizedTerm, {
          id: '',
          term,
          normalizedTerm,
          searchVolume: response.volume,
          cpc: response.cpc,
          competition: response.competition,
          competitionLevel: response.competitionLevel,
          searchVolumeTrend: null,
          monthlySearches: response.monthlySearches,
          locationCode: keyword.searchVolumeLocationCode || 2840,
          locationName: keyword.searchVolumeLocationName || 'United States',
          keywordId: keyword.id,
          linkedAt: new Date().toISOString(),
          researchedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return newMap;
      });
    } catch (err) {
      console.error('Failed to check term volume:', err);
    } finally {
      setCheckingTermVolume(null);
    }
  };

  // Get average position from rankings
  const avgPosition = useMemo(() => {
    if (!rankStatus?.rankings) return null;
    const positions = rankStatus.rankings
      .filter(r => r.latestCheck?.position)
      .map(r => r.latestCheck!.position!);
    if (positions.length === 0) return null;
    return Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
  }, [rankStatus]);

  // Check if any rankings exist (even if all outside top 100)
  const hasAnyRankings = useMemo(() => {
    if (!rankStatus?.rankings) return false;
    return rankStatus.rankings.some(r => r.latestCheck !== null);
  }, [rankStatus]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => onOpenDetails?.(keyword)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="FaStar" className="w-4 h-4 text-slate-blue flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 truncate">{keyword.phrase}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Rank badge */}
            {keyword.isUsedInRankTracking && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                avgPosition !== null
                  ? avgPosition <= 10
                    ? 'bg-green-100 text-green-700'
                    : avgPosition <= 20
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  : hasAnyRankings
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {avgPosition !== null
                  ? `Avg: #${avgPosition}`
                  : hasAnyRankings
                    ? '100+'
                    : 'Not tracked'}
              </span>
            )}
            {showEditActions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails?.(keyword);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icon name="FaEdit" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div>
            <span className="text-gray-400">Words:</span>{' '}
            <span className="font-medium text-gray-700">{keyword.wordCount}</span>
          </div>
          <div>
            <span className="text-gray-400">Pages:</span>{' '}
            <span className={`font-medium ${promptPageNames.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {promptPageNames.length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Reviews:</span>{' '}
            <span className="font-medium text-gray-700">{keyword.reviewUsageCount || 0}</span>
          </div>
          <div>
            <span className="text-gray-400">Volume:</span>{' '}
            <span className={`font-medium ${termVolumeData.size > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              {termVolumeData.size === 0 ? '—' : allLowVolume ? '<10' : formatVolume(totalVolume)}
            </span>
          </div>
          {keyword.groupName && (
            <div>
              <span className="text-gray-400">Group:</span>{' '}
              <span className="font-medium text-gray-700">{keyword.groupName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="border-t border-gray-100 px-4">
        {/* Search Terms Section */}
        <CollapsibleSection
          title="Search terms"
          badge={keyword.searchTerms?.length || 0}
          defaultExpanded={false}
          icon={<Icon name="FaSearch" className="w-3.5 h-3.5 text-blue-500" />}
          headerAction={
            onCheckRank && keyword.searchTerms && keyword.searchTerms.length > 0 ? (
              <button
                onClick={() => onCheckRank(keyword.searchTerms![0].term, keyword.id)}
                className="text-xs text-slate-blue hover:text-slate-blue/80 flex items-center gap-1"
              >
                <Icon name="FaChartLine" className="w-3 h-3" />
                Track
              </button>
            ) : undefined
          }
        >
          {keyword.searchTerms && keyword.searchTerms.length > 0 ? (
            <div className="space-y-2">
              {keyword.searchTerms.map((term) => {
                const normalizedTerm = normalizePhrase(term.term);
                const volumeData = termVolumeData.get(normalizedTerm);
                const termRankings = rankStatus?.rankings?.filter(
                  r => r.latestCheck?.searchQuery === term.term
                ) || [];

                return (
                  <div
                    key={term.term}
                    className={`p-2.5 rounded-lg border ${
                      term.isCanonical
                        ? 'bg-blue-50/80 border-blue-200/50'
                        : 'bg-gray-50/80 border-gray-100'
                    }`}
                  >
                    {/* Term header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {term.isCanonical && (
                          <Icon name="FaStar" className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-800 truncate">{term.term}</span>
                      </div>
                    </div>

                    {/* Volume and rank info */}
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex items-center gap-3 flex-wrap">
                        {volumeData && volumeData.searchVolume !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Volume:</span>
                            <span className="font-semibold text-gray-900">{formatVolume(volumeData.searchVolume)}</span>
                            {volumeData.locationName && (
                              <span className="text-gray-400">{volumeData.locationName}</span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCheckTermVolume(term.term)}
                            disabled={checkingTermVolume === term.term}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                          >
                            {checkingTermVolume === term.term ? (
                              <>
                                <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <Icon name="FaSearch" className="w-3 h-3" />
                                Check volume
                              </>
                            )}
                          </button>
                        )}

                        {/* Check ranking button - show if not already tracked */}
                        {onCheckRank && termRankings.length === 0 && (
                          <button
                            onClick={() => onCheckRank(term.term, keyword.id)}
                            className="text-green-600 hover:text-green-700 flex items-center gap-1"
                          >
                            <Icon name="FaChartLine" className="w-3 h-3" />
                            Check ranking
                          </button>
                        )}
                      </div>

                      {/* Rankings */}
                      {termRankings.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {termRankings.map((ranking) => {
                            const deviceMatch = ranking.device;
                            return (
                              <div
                                key={ranking.groupId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded border border-gray-200 text-xs"
                              >
                                <span className="text-gray-500">Rank:</span>
                                {ranking.latestCheck?.position ? (
                                  <span className={`font-semibold ${
                                    ranking.latestCheck.position <= 3 ? 'text-green-600' :
                                    ranking.latestCheck.position <= 10 ? 'text-blue-600' :
                                    ranking.latestCheck.position <= 20 ? 'text-amber-600' : 'text-gray-600'
                                  }`}>
                                    #{ranking.latestCheck.position}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Not in top 100</span>
                                )}
                                <span className="text-gray-400">({deviceMatch})</span>
                                <span className="text-gray-400">{ranking.location}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No search terms added</p>
          )}
        </CollapsibleSection>

        {/* Related Questions Section */}
        <CollapsibleSection
          title="Related questions"
          badge={keyword.relatedQuestions?.length || 0}
          defaultExpanded={false}
          icon={<Icon name="FaQuestionCircle" className="w-3.5 h-3.5 text-purple-500" />}
        >
          {keyword.relatedQuestions && keyword.relatedQuestions.length > 0 ? (
            <div className="space-y-2">
              {/* Group by funnel stage */}
              {(['top', 'middle', 'bottom'] as const).map((stage) => {
                const stageQuestions = keyword.relatedQuestions!.filter(q => q.funnelStage === stage);
                if (stageQuestions.length === 0) return null;

                const funnelColor = getFunnelStageColor(stage);
                const stageLabel = stage === 'top' ? 'Top of funnel' : stage === 'middle' ? 'Middle of funnel' : 'Bottom of funnel';

                return (
                  <div key={stage} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${funnelColor.bg} ${funnelColor.text}`}>
                        {stageLabel}
                      </span>
                    </div>
                    <div className="space-y-1 pl-2 border-l-2 border-gray-100">
                      {stageQuestions.map((q, idx) => {
                        const providerResults = questionLLMMap.get(q.question);
                        const hasResults = providerResults && providerResults.size > 0;
                        const citedCount = hasResults
                          ? Array.from(providerResults.values()).filter(r => r.domainCited).length
                          : 0;

                        return (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-white/80 rounded-lg border border-gray-100">
                            <span className="flex-1 text-sm text-gray-700">{q.question}</span>
                            {hasResults ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                                citedCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {citedCount}/{providerResults!.size} cited
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 flex-shrink-0">
                                Not checked
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No questions added</p>
          )}
        </CollapsibleSection>

        {/* Reviews Section (collapsed by default) */}
        <CollapsibleSection
          title="Reviews"
          defaultExpanded={false}
          icon={<Icon name="FaStar" className="w-3.5 h-3.5 text-amber-500" />}
        >
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Review phrase:</span>
              <p className="text-sm text-gray-700 mt-0.5">
                {keyword.reviewPhrase || <span className="text-gray-400 italic">Not set</span>}
              </p>
            </div>
            {keyword.aliases && keyword.aliases.length > 0 && (
              <div>
                <span className="text-xs text-gray-500">Aliases:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {keyword.aliases.map((alias, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Tracking Locations Section (collapsed by default) */}
        {keyword.isUsedInRankTracking && rankStatus?.rankings && rankStatus.rankings.length > 0 && (
          <CollapsibleSection
            title="Tracking locations"
            badge={rankStatus.rankings.length}
            defaultExpanded={false}
            icon={<Icon name="FaMapMarker" className="w-3.5 h-3.5 text-red-500" />}
          >
            <div className="space-y-1.5">
              {rankStatus.rankings.map((ranking) => (
                <div
                  key={ranking.groupId}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      name={ranking.isEnabled ? 'FaCheckCircle' : 'FaCircle'}
                      className={`w-3 h-3 ${ranking.isEnabled ? 'text-green-500' : 'text-gray-300'}`}
                    />
                    <span className="text-gray-700">{ranking.location}</span>
                    <span className="text-gray-400 capitalize">({ranking.device})</span>
                  </div>
                  {ranking.latestCheck && (
                    <span className="text-gray-400">
                      {new Date(ranking.latestCheck.checkedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

export default ConceptCard;
