'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Icon from '@/components/Icon';
import { CollapsibleSection } from './CollapsibleSection';
import { apiClient } from '@/utils/apiClient';
import {
  type KeywordData,
  type SearchTerm,
  type RelatedQuestion,
  type ResearchResultData,
  type LLMVisibilityResult,
  normalizePhrase,
  getFunnelStageColor,
  formatVolume,
  buildQuestionLLMMap,
} from '../keywordUtils';
import {
  LLMProvider,
  LLM_PROVIDERS,
} from '@/features/llm-visibility/utils/types';
import {
  useAIEnrichment,
  applyEnrichmentResult,
  hasExistingEnrichmentData,
  hasEmptyEnrichmentFields,
} from '../hooks/useAIEnrichment';
import type { EnrichmentData } from './KeywordManager';
import { useAuth } from '@/auth';
import { FunnelStageGroup } from './FunnelStageGroup';
import LocationPicker from '@/components/LocationPicker';

// Types for rank status (from enrichment data)
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

interface RankStatusData {
  isTracked: boolean;
  rankings: RankingData[];
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
  /** Callback when user wants to check AI visibility for a question */
  onCheckLLMVisibility?: (question: string, conceptId: string) => void;
  /** Optional: Show edit actions */
  showEditActions?: boolean;
  /** Optional: Prompt page usage (array of page names) */
  promptPageNames?: string[];
  /** Pre-fetched enrichment data (volume, rank, LLM visibility) from parent */
  enrichedData?: EnrichmentData;
  /** Whether enrichment data is currently being loaded at parent level */
  isLoadingEnrichment?: boolean;
  /** Business location code (fallback when concept has no location) */
  businessLocationCode?: number | null;
  /** Business location name (fallback when concept has no location) */
  businessLocationName?: string | null;
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
  onCheckLLMVisibility,
  showEditActions = true,
  promptPageNames = [],
  enrichedData,
  isLoadingEnrichment = false,
  businessLocationCode,
  businessLocationName,
}: ConceptCardProps) {
  // Get business context for AI enrichment
  const { account } = useAuth();

  // Helper function to calculate age of volume data
  const getVolumeAge = (researchedAt: string | null) => {
    if (!researchedAt) return null;
    return formatDistanceToNow(new Date(researchedAt), { addSuffix: true });
  };

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable fields
  const [editedName, setEditedName] = useState(keyword.name);
  const [editedReviewPhrase, setEditedReviewPhrase] = useState(keyword.reviewPhrase || '');
  const [editedAliases, setEditedAliases] = useState<string[]>(keyword.aliases || []);
  const [newAlias, setNewAlias] = useState('');
  const [editedSearchTerms, setEditedSearchTerms] = useState<SearchTerm[]>(keyword.searchTerms || []);
  const [newSearchTerm, setNewSearchTerm] = useState('');
  const [editedQuestions, setEditedQuestions] = useState<RelatedQuestion[]>(keyword.relatedQuestions || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionFunnel, setNewQuestionFunnel] = useState<'top' | 'middle' | 'bottom'>('top');
  // Location editing
  const [editedLocation, setEditedLocation] = useState<{
    locationCode: number | null;
    locationName: string | null;
  }>({
    locationCode: keyword.searchVolumeLocationCode ?? null,
    locationName: keyword.searchVolumeLocationName ?? null,
  });
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  // Optimistic update state
  const [optimisticData, setOptimisticData] = useState<Partial<KeywordData> | null>(null);

  // Per-item loading states
  const [loadingStates, setLoadingStates] = useState<Record<string, 'checking-volume' | 'saving' | null>>({});

  // AI enrichment hook
  const {
    isEnriching,
    enrichError,
    enrichSuccess,
    enrich,
    reset: resetEnrichment,
  } = useAIEnrichment({
    keyword,
    businessName: account?.business_name || account?.businesses?.[0]?.name,
    businessCity: account?.businesses?.[0]?.address_city,
    businessState: account?.businesses?.[0]?.address_state,
  });
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  // Card expansion state (accordion behavior)
  const [isExpanded, setIsExpanded] = useState(false);

  // Local state for checking individual term volume (still needed for on-demand checks)
  const [localVolumeData, setLocalVolumeData] = useState<Map<string, ResearchResultData>>(new Map());

  // Derive data from enrichedData prop (batch-fetched) merged with local state
  const termVolumeData = useMemo(() => {
    const map = new Map<string, ResearchResultData>();
    // First add data from parent (batch-fetched)
    if (enrichedData?.volumeData) {
      for (const r of enrichedData.volumeData) {
        map.set(r.normalizedTerm, r);
      }
    }
    // Then overlay any locally-fetched data (from on-demand volume checks)
    for (const [key, value] of localVolumeData) {
      map.set(key, value);
    }
    return map;
  }, [enrichedData?.volumeData, localVolumeData]);

  const rankStatus: RankStatusData | null = enrichedData?.rankStatus || null;
  const llmResults = useMemo<LLMVisibilityResult[]>(
    () => enrichedData?.llmResults || [],
    [enrichedData?.llmResults]
  );

  // Reset edit state when keyword changes
  useEffect(() => {
    setEditedName(keyword.name);
    setEditedReviewPhrase(keyword.reviewPhrase || '');
    setEditedAliases(keyword.aliases || []);
    setEditedSearchTerms(keyword.searchTerms || []);
    setEditedQuestions(keyword.relatedQuestions || []);
    setEditedLocation({
      locationCode: keyword.searchVolumeLocationCode ?? null,
      locationName: keyword.searchVolumeLocationName ?? null,
    });
    setShowLocationWarning(false);
  }, [keyword]);

  // Build question -> provider -> result map using shared utility
  const questionLLMMap = useMemo(() => buildQuestionLLMMap(llmResults), [llmResults]);

  // Calculate total volume
  const totalVolume = useMemo(() => {
    const terms = Array.from(termVolumeData.values());
    return terms.reduce((sum, t) => sum + (t.searchVolume || 0), 0);
  }, [termVolumeData]);

  const allLowVolume = useMemo(() => {
    const terms = Array.from(termVolumeData.values());
    return terms.length > 0 && terms.every(t => (t.searchVolume || 0) < 10);
  }, [termVolumeData]);

  // Calculate LLM citation stats (cited / total checks)
  const llmCitationStats = useMemo(() => {
    if (llmResults.length === 0) return null;
    const citedCount = llmResults.filter(r => r.domainCited).length;
    return { cited: citedCount, total: llmResults.length };
  }, [llmResults]);

  // Check volume for a term
  const handleCheckTermVolume = async (term: string) => {
    // Set loading state for this specific term
    setLoadingStates(prev => ({ ...prev, [term]: 'checking-volume' }));

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

      // Update local state (will merge with enrichedData in useMemo)
      const normalizedTerm = normalizePhrase(term);
      setLocalVolumeData((prev) => {
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
      // Clear loading state for this term
      setLoadingStates(prev => ({ ...prev, [term]: null }));
    }
  };

  // Handle entering edit mode
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original values
    setEditedReviewPhrase(keyword.reviewPhrase || '');
    setEditedAliases(keyword.aliases || []);
    setEditedSearchTerms(keyword.searchTerms || []);
    setEditedQuestions(keyword.relatedQuestions || []);
    setEditedLocation({
      locationCode: keyword.searchVolumeLocationCode ?? null,
      locationName: keyword.searchVolumeLocationName ?? null,
    });
    setNewAlias('');
    setNewSearchTerm('');
    setNewQuestion('');
    resetEnrichment();
    setShowOverwriteWarning(false);
    setShowLocationWarning(false);
  };

  // Handle saving changes with optimistic updates
  const handleSaveEdit = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    setSaveError(null);

    // Store original values for rollback
    const originalData = {
      name: keyword.name,
      reviewPhrase: keyword.reviewPhrase,
      aliases: keyword.aliases,
      searchTerms: keyword.searchTerms,
      relatedQuestions: keyword.relatedQuestions,
      searchVolumeLocationCode: keyword.searchVolumeLocationCode,
      searchVolumeLocationName: keyword.searchVolumeLocationName,
    };

    // Check if location changed - will trigger history cleanup on backend
    const locationChanged = editedLocation.locationCode !== keyword.searchVolumeLocationCode;

    // Optimistically update the UI
    const updates = {
      name: editedName,
      reviewPhrase: editedReviewPhrase,
      aliases: editedAliases,
      searchTerms: editedSearchTerms,
      relatedQuestions: editedQuestions,
      searchVolumeLocationCode: editedLocation.locationCode,
      searchVolumeLocationName: editedLocation.locationName,
      // Flag to tell backend to clear history if location changed
      ...(locationChanged && { _locationChanged: true }),
    };
    setOptimisticData(updates);

    try {
      const result = await onUpdate(keyword.id, updates);

      if (!result) {
        throw new Error('Update failed - no result returned');
      }

      // Success - clear optimistic state and exit edit mode
      setOptimisticData(null);
      setIsEditing(false);
      setSaveError(null);
      resetEnrichment();
    } catch (err) {
      console.error('Failed to save changes:', err);

      // Rollback optimistic update
      setOptimisticData(null);

      // Reset edited values to original
      setEditedName(originalData.name);
      setEditedReviewPhrase(originalData.reviewPhrase || '');
      setEditedAliases(originalData.aliases || []);
      setEditedSearchTerms(originalData.searchTerms || []);
      setEditedQuestions(originalData.relatedQuestions || []);
      setEditedLocation({
        locationCode: originalData.searchVolumeLocationCode ?? null,
        locationName: originalData.searchVolumeLocationName ?? null,
      });

      // Show error feedback
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');

      // Auto-clear error after 5 seconds
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new search term
  const handleAddSearchTerm = () => {
    if (!newSearchTerm.trim()) return;
    const isFirst = editedSearchTerms.length === 0;
    setEditedSearchTerms([
      ...editedSearchTerms,
      {
        term: newSearchTerm.trim(),
        isCanonical: isFirst,
        addedAt: new Date().toISOString(),
      },
    ]);
    setNewSearchTerm('');
  };

  // Remove a search term
  const handleRemoveSearchTerm = (termToRemove: string) => {
    const remaining = editedSearchTerms.filter((t) => t.term !== termToRemove);
    // Make first remaining term canonical if we removed the canonical one
    if (remaining.length > 0 && !remaining.some((t) => t.isCanonical)) {
      remaining[0].isCanonical = true;
    }
    setEditedSearchTerms(remaining);
  };

  // Add a new alias
  const handleAddAlias = () => {
    if (!newAlias.trim()) return;
    if (editedAliases.includes(newAlias.trim())) return;
    setEditedAliases([...editedAliases, newAlias.trim()]);
    setNewAlias('');
  };

  // Remove an alias
  const handleRemoveAlias = (aliasToRemove: string) => {
    setEditedAliases(editedAliases.filter((a) => a !== aliasToRemove));
  };

  // Add a new question
  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setEditedQuestions([
      ...editedQuestions,
      {
        question: newQuestion.trim(),
        funnelStage: newQuestionFunnel,
        addedAt: new Date().toISOString(),
      },
    ]);
    setNewQuestion('');
  };

  // Remove a question
  const handleRemoveQuestion = (questionToRemove: string) => {
    setEditedQuestions(editedQuestions.filter((q) => q.question !== questionToRemove));
  };

  // Check if user has entered any data that would be overwritten
  const hasExistingData = hasExistingEnrichmentData(keyword);

  // Check if any fields are empty (show AI button when something can be filled)
  const hasEmptySEOFields = hasEmptyEnrichmentFields(keyword);

  // AI enrichment handler using the hook
  const handleAIEnrich = async (fillEmptyOnly = false) => {
    if (!keyword || !onUpdate) return;
    setShowOverwriteWarning(false);

    const result = await enrich();
    if (result) {
      const applied = applyEnrichmentResult(result, keyword, fillEmptyOnly);
      setEditedReviewPhrase(applied.reviewPhrase);
      setEditedSearchTerms(applied.searchTerms);
      setEditedAliases(applied.aliases);
      setEditedQuestions(applied.relatedQuestions);

      // Enter edit mode so user can review/modify before saving
      setIsEditing(true);
    }
  };

  // Merge keyword data with optimistic updates
  const displayKeyword = useMemo(() => {
    if (!optimisticData) return keyword;
    return { ...keyword, ...optimisticData };
  }, [keyword, optimisticData]);

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
    <div className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-shadow ${
      isEditing ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:shadow-md'
    }`}>
      {/* Header - clickable to expand/collapse */}
      <div
        className={`px-4 py-3 transition-colors cursor-pointer hover:bg-gray-50/50 ${isExpanded || isEditing ? 'border-b border-gray-100' : ''}`}
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Left: expand icon + title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon
              name={isExpanded || isEditing ? 'FaChevronDown' : 'FaChevronRight'}
              className="w-3 h-3 text-gray-400 flex-shrink-0 transition-transform"
            />
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1 text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Concept name"
              />
            ) : (
              <h3 className="text-lg font-medium text-gray-900 truncate">{keyword.name}</h3>
            )}
          </div>

          {/* Right: badges and actions */}
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Quick stats badges */}
            {!isEditing && (
              <>
                {promptPageNames.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
                    {promptPageNames.length} page{promptPageNames.length !== 1 ? 's' : ''}
                  </span>
                )}
                {termVolumeData.size > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                    {allLowVolume ? '<10' : formatVolume(totalVolume)} vol
                  </span>
                )}
                {(keyword.reviewUsageCount > 0 || keyword.aliasMatchCount > 0) && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700">
                    In reviews: {keyword.reviewUsageCount + keyword.aliasMatchCount}
                  </span>
                )}
                {llmCitationStats && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    llmCitationStats.cited > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    LLM citations: {llmCitationStats.cited}/{llmCitationStats.total}
                  </span>
                )}
                {keyword.searchVolumeLocationName && (
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 max-w-[100px] truncate"
                    title={keyword.searchVolumeLocationName}
                  >
                    <Icon name="FaMapMarker" className="w-2 h-2 inline mr-0.5" />
                    {keyword.searchVolumeLocationName.split(',')[0]}
                  </span>
                )}
                {keyword.isUsedInRankTracking && avgPosition !== null && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    avgPosition <= 10
                      ? 'bg-green-100 text-green-700'
                      : avgPosition <= 20
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    #{avgPosition}
                  </span>
                )}
                {keyword.isUsedInGeoGrid && enrichedData?.geoGridStatus?.summary && enrichedData.geoGridStatus.summary.totalPoints > 0 ? (
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded flex items-center gap-0.5 ${
                    enrichedData.geoGridStatus.summary.averagePosition && enrichedData.geoGridStatus.summary.averagePosition <= 3
                      ? 'bg-green-100 text-green-700'
                      : enrichedData.geoGridStatus.summary.averagePosition && enrichedData.geoGridStatus.summary.averagePosition <= 10
                        ? 'bg-emerald-100 text-emerald-700'
                        : enrichedData.geoGridStatus.summary.averagePosition && enrichedData.geoGridStatus.summary.averagePosition <= 20
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon name="FaMapMarker" className="w-2 h-2" />
                    {enrichedData.geoGridStatus.summary.averagePosition
                      ? `#${enrichedData.geoGridStatus.summary.averagePosition}`
                      : 'Grid'}
                    <span className="text-[9px] opacity-75">
                      ({Math.round((enrichedData.geoGridStatus.summary.pointsInTop10 / enrichedData.geoGridStatus.summary.totalPoints) * 100)}%)
                    </span>
                  </span>
                ) : keyword.isUsedInGeoGrid && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                    <Icon name="FaMapMarker" className="w-2 h-2" />
                    Grid
                  </span>
                )}
              </>
            )}
            {/* Edit button */}
            {showEditActions && !isEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                  handleStartEditing();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <Icon name="FaEdit" className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Edit mode actions */}
            {isEditing && (
              <div className="flex items-center gap-2">
                {saveError && (
                  <span className="text-xs text-red-600 max-w-[150px] truncate" title={saveError}>
                    {saveError}
                  </span>
                )}
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-2 py-0.5 text-xs bg-slate-blue text-white rounded hover:bg-slate-blue/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isSaving && <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />}
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable content */}
      {(isExpanded || isEditing) && (
        <>
          {/* Compact info bar: Location + AI button */}
          {!isEditing && (
            <div className="px-4 py-2 flex items-center justify-between gap-3 text-xs border-b border-gray-100">
              {/* Location */}
              <div className="flex items-center gap-1.5 text-gray-500">
                <Icon name="FaMapMarker" className="w-3 h-3 text-slate-blue" />
                <span>{keyword.searchVolumeLocationName || businessLocationName || 'No location'}</span>
              </div>
              {/* AI Auto-fill Button */}
              {hasEmptySEOFields && onUpdate && !showOverwriteWarning && (
                <button
                  onClick={() => {
                    if (hasExistingData) {
                      setShowOverwriteWarning(true);
                    } else {
                      handleAIEnrich();
                    }
                  }}
                  disabled={isEnriching}
                  className="text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isEnriching ? (
                    <>
                      <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon name="prompty" className="w-3 h-3" />
                      Auto-fill with AI
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          {enrichError && !isEditing && (
            <div className="px-4 py-2">
              <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2">
                <Icon name="FaExclamationTriangle" className="w-3 h-3" />
                {enrichError}
              </div>
            </div>
          )}

          {/* Overwrite Warning */}
          {showOverwriteWarning && !isEditing && (
            <div className="px-4 py-2">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 mb-2">
                  Some fields already have data. What would you like to do?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAIEnrich(true)}
                    disabled={isEnriching}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isEnriching ? (
                      <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                    ) : (
                      'Fill empty only'
                    )}
                  </button>
                  <button
                    onClick={() => handleAIEnrich(false)}
                    disabled={isEnriching}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50"
                  >
                    Replace all
                  </button>
                  <button
                    onClick={() => setShowOverwriteWarning(false)}
                    className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI enrichment success message */}
          {enrichSuccess && isEditing && (
            <div className="px-4 py-2">
              <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-700 flex items-center gap-2">
                <Icon name="prompty" className="w-3 h-3" />
                Fields populated by AI - review and save
              </div>
            </div>
          )}

          {/* Location Section - only shown in edit mode */}
          {isEditing && (
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Icon name="FaMapMarker" className="w-3 h-3 text-slate-blue" />
                  Location for rank tracking
                </span>
                <LocationPicker
                  value={editedLocation}
                  onChange={(location) => {
                    const isChanging = location?.locationCode !== keyword.searchVolumeLocationCode;
                    if (isChanging && keyword.searchVolumeLocationCode) {
                      setShowLocationWarning(true);
                    }
                    setEditedLocation({
                      locationCode: location?.locationCode ?? null,
                      locationName: location?.locationName ?? null,
                    });
                  }}
                  placeholder="Search for a city or region..."
                />
                {showLocationWarning && editedLocation.locationCode !== keyword.searchVolumeLocationCode && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                    <Icon name="FaExclamationTriangle" className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Changing location will clear rank and volume history for this concept.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsible Sections */}
          <div className="px-4">
        {/* Search Terms Section */}
        <CollapsibleSection
          title="Search terms"
          badge={isEditing ? editedSearchTerms.length : (displayKeyword.searchTerms?.length || 0)}
          defaultExpanded={false}
          forceExpanded={isEditing}
          icon={<Icon name="FaSearch" className="w-3.5 h-3.5 text-slate-blue" />}
          headerAction={undefined}
        >
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-2">
              {editedSearchTerms.map((term) => (
                <div
                  key={term.term}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    term.isCanonical
                      ? 'bg-blue-50/80 border-blue-200/50'
                      : 'bg-gray-50/80 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {term.isCanonical && (
                      <Icon name="FaStar" className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-800 truncate">{term.term}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSearchTerm(term.term)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Icon name="FaTimes" className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Add new term input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSearchTerm}
                  onChange={(e) => setNewSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSearchTerm()}
                  placeholder="Add search term..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
                <button
                  onClick={handleAddSearchTerm}
                  disabled={!newSearchTerm.trim()}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Icon name="FaPlus" className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : displayKeyword.searchTerms && displayKeyword.searchTerms.length > 0 ? (
            /* View mode - table layout matching rank tracker */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2">
                      <span className="text-xs font-semibold text-gray-600">Keyword</span>
                    </th>
                    <th className="text-center py-2 px-2 w-20">
                      <span className="text-xs font-semibold text-gray-600">Volume</span>
                    </th>
                    <th className="text-center py-2 px-2 w-28">
                      <span className="text-xs font-semibold text-gray-600">Rank</span>
                    </th>
                    <th className="text-center py-2 px-2 w-44">
                      <span className="text-xs font-semibold text-gray-600">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayKeyword.searchTerms.map((term) => {
                    const normalizedTerm = normalizePhrase(term.term);
                    const volumeData = termVolumeData.get(normalizedTerm);
                    const termRankings = rankStatus?.rankings?.filter(
                      r => r.latestCheck?.searchQuery === term.term
                    ) || [];
                    const hasVolume = volumeData && volumeData.searchVolume !== null;
                    const hasRankings = termRankings.length > 0;

                    const desktopRanking = termRankings.find(r => r.device === 'desktop');
                    const mobileRanking = termRankings.find(r => r.device === 'mobile');
                    const desktopRank = desktopRanking?.latestCheck?.position;
                    const mobileRank = mobileRanking?.latestCheck?.position;

                    const getPositionColor = (pos: number | null) => {
                      if (pos === null) return 'text-gray-400';
                      if (pos <= 3) return 'text-green-600';
                      if (pos <= 10) return 'text-blue-600';
                      if (pos <= 20) return 'text-amber-600';
                      return 'text-gray-600';
                    };

                    return (
                      <tr key={term.term} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            {term.isCanonical && (
                              <Icon name="FaStar" className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{term.term}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          {hasVolume ? (
                            <span className="font-medium text-blue-600 text-sm">
                              {formatVolume(volumeData!.searchVolume!)}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {(desktopRanking || mobileRanking) ? (
                            <div className="flex items-center justify-center gap-2">
                              {desktopRanking && (
                                <span className="flex items-center gap-1" title="Desktop">
                                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 16 14" fill="currentColor">
                                    <rect x="0" y="0" width="16" height="10" rx="1" />
                                    <rect x="5" y="11" width="6" height="1" />
                                    <rect x="4" y="12" width="8" height="1" />
                                  </svg>
                                  <span className={`text-sm font-semibold ${getPositionColor(desktopRank ?? null)}`}>
                                    {desktopRank !== null && desktopRank !== undefined ? (desktopRank > 100 ? '>100' : desktopRank) : '>100'}
                                  </span>
                                </span>
                              )}
                              {mobileRanking && (
                                <span className="flex items-center gap-1" title="Mobile">
                                  <svg className="w-2.5 h-3.5 text-gray-400" viewBox="0 0 10 16" fill="currentColor">
                                    <rect x="0" y="0" width="10" height="16" rx="1.5" />
                                    <rect x="3.5" y="13" width="3" height="1" rx="0.5" fill="white" />
                                  </svg>
                                  <span className={`text-sm font-semibold ${getPositionColor(mobileRank ?? null)}`}>
                                    {mobileRank !== null && mobileRank !== undefined ? (mobileRank > 100 ? '>100' : mobileRank) : '>100'}
                                  </span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCheckTermVolume(term.term)}
                              disabled={loadingStates[term.term] === 'checking-volume' || Object.values(loadingStates).some(s => s !== null)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                              title="Check search volume"
                            >
                              {loadingStates[term.term] === 'checking-volume' ? (
                                <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                              ) : (
                                <Icon name="FaChartLine" className="w-3 h-3" />
                              )}
                              Volume
                            </button>
                            {onCheckRank && (
                              <button
                                onClick={() => onCheckRank(term.term, keyword.id)}
                                disabled={Object.values(loadingStates).some(s => s !== null)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-slate-blue rounded hover:bg-slate-blue/90 transition-colors disabled:opacity-50"
                                title="Check ranking"
                              >
                                <Icon name="FaSearch" className="w-3 h-3" />
                                Rank
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No search terms added</p>
          )}
        </CollapsibleSection>

        {/* AI Visibility Section */}
        <CollapsibleSection
          title="AI visibility"
          badge={isEditing ? editedQuestions.length : (displayKeyword.relatedQuestions?.length || 0)}
          defaultExpanded={false}
          forceExpanded={isEditing}
          icon={<Icon name="FaSparkles" className="w-3.5 h-3.5 text-slate-blue" />}
          headerAction={undefined /* Each question has its own check button */}
        >
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-2">
              {(['top', 'middle', 'bottom'] as const).map((stage) => {
                const stageQuestions = editedQuestions.filter(q => q.funnelStage === stage);
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
                      {stageQuestions.map((q, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-white/80 rounded-lg border border-gray-100">
                          <span className="flex-1 text-sm text-gray-700">{q.question}</span>
                          <button
                            onClick={() => handleRemoveQuestion(q.question)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          >
                            <Icon name="FaTimes" className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Add new question input */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <select
                    value={newQuestionFunnel}
                    onChange={(e) => setNewQuestionFunnel(e.target.value as 'top' | 'middle' | 'bottom')}
                    className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  >
                    <option value="top">Top of funnel</option>
                    <option value="middle">Middle of funnel</option>
                    <option value="bottom">Bottom of funnel</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                    placeholder="Add AI visibility question..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                  <button
                    onClick={handleAddQuestion}
                    disabled={!newQuestion.trim()}
                    className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Icon name="FaPlus" className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : displayKeyword.relatedQuestions && displayKeyword.relatedQuestions.length > 0 ? (
            /* View mode - using shared FunnelStageGroup */
            <div className="space-y-2">
              {(['top', 'middle', 'bottom'] as const).map((stage) => {
                const stageQuestions = displayKeyword.relatedQuestions!
                  .map((q, idx) => ({ ...q, originalIndex: idx }))
                  .filter(q => q.funnelStage === stage);
                return (
                  <FunnelStageGroup
                    key={stage}
                    stage={stage}
                    questions={stageQuestions}
                    llmResultsMap={questionLLMMap}
                    isEditing={false}
                    onCheckQuestion={onCheckLLMVisibility ? (idx, question) => onCheckLLMVisibility(question, keyword.id) : undefined}
                    selectedProviders={LLM_PROVIDERS}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No AI visibility questions added</p>
          )}
        </CollapsibleSection>

        {/* Reviews Section (collapsed by default) */}
        <CollapsibleSection
          title="Reviews"
          defaultExpanded={false}
          forceExpanded={isEditing}
          icon={<Icon name="FaStar" className="w-3.5 h-3.5 text-slate-blue" />}
        >
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Review phrase:</label>
                <input
                  type="text"
                  value={editedReviewPhrase}
                  onChange={(e) => setEditedReviewPhrase(e.target.value)}
                  placeholder="How this keyword appears in reviews..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Aliases:</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {editedAliases.map((alias, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1">
                      {alias}
                      <button
                        onClick={() => handleRemoveAlias(alias)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Icon name="FaTimes" className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAlias()}
                    placeholder="Add alias..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                  <button
                    onClick={handleAddAlias}
                    disabled={!newAlias.trim()}
                    className="px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Icon name="FaPlus" className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500">Review phrase:</span>
                <p className="text-sm text-gray-700 mt-0.5">
                  {displayKeyword.reviewPhrase || <span className="text-gray-400 italic">Not set</span>}
                </p>
              </div>
              {displayKeyword.aliases && displayKeyword.aliases.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500">Aliases:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {displayKeyword.aliases.map((alias, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
      </>
      )}
    </div>
  );
}

export default ConceptCard;
