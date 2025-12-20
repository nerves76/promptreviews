'use client';

import { useState, useEffect, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import {
  type KeywordData,
  type LocationScope,
  type SearchTerm,
  type RelatedQuestion,
  type FunnelStage,
  type ResearchResultData,
  checkSearchTermRelevance,
  getFunnelStageColor,
  getFunnelStageShortLabel,
  normalizePhrase,
} from '../keywordUtils';
import { useRelatedQuestions } from '../hooks/useRelatedQuestions';
import { useLLMVisibility } from '@/features/llm-visibility/hooks/useLLMVisibility';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
} from '@/features/llm-visibility/utils/types';
import { useAuth } from '@/auth';

// Types for rank status API response
interface SerpVisibility {
  paa: {
    questionCount: number;
    oursCount: number;
  };
  aiOverview: {
    present: boolean;
    oursCited: boolean;
    citationCount: number;
  };
  featuredSnippet: {
    present: boolean;
    ours: boolean;
  };
}

interface DiscoveredQuestion {
  question: string;
  answerDomain: string | null;
  isOurs: boolean;
}

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
    serpVisibility?: SerpVisibility;
    discoveredQuestions?: DiscoveredQuestion[];
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

const LOCATION_SCOPES: { value: LocationScope | null; label: string }[] = [
  { value: null, label: 'Not set' },
  { value: 'local', label: 'Local (neighborhood)' },
  { value: 'city', label: 'City' },
  { value: 'region', label: 'Region' },
  { value: 'state', label: 'State' },
  { value: 'national', label: 'National' },
];

export interface KeywordDetailsSidebarProps {
  isOpen: boolean;
  keyword: KeywordData | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<{
    phrase: string;
    groupId: string;
    status: 'active' | 'paused';
    reviewPhrase: string;
    searchQuery: string;
    searchTerms: SearchTerm[];
    aliases: string[];
    locationScope: string | null;
    relatedQuestions: RelatedQuestion[];
  }>) => Promise<KeywordData | null>;
  /** Optional: Show prompt pages this keyword is used in */
  promptPages?: Array<{ id: string; name?: string; slug?: string }>;
  /** Optional: Show recent reviews matching this keyword */
  recentReviews?: Array<{ id: string; reviewerName: string; content?: string }>;
  /** Optional: List of groups for the group selector */
  groups?: Array<{ id: string; name: string }>;
  /** Optional: Show the group selector (defaults to false) */
  showGroupSelector?: boolean;
  /** Optional: Refresh callback to refetch keyword details after update */
  onRefresh?: () => Promise<void>;
}

export function KeywordDetailsSidebar({
  isOpen,
  keyword,
  onClose,
  onUpdate,
  promptPages = [],
  recentReviews = [],
  groups = [],
  showGroupSelector = false,
  onRefresh,
}: KeywordDetailsSidebarProps) {
  // Get business context for AI enrichment
  const { account } = useAuth();

  // Search volume lookup state
  const [isLookingUpVolume, setIsLookingUpVolume] = useState(false);
  const [volumeLookupError, setVolumeLookupError] = useState<string | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{
    locationCode: number;
    locationName: string;
    countryCode?: string;
    locationType?: string;
  }>>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);

  // Local state for editing - per section
  const [isEditingReviews, setIsEditingReviews] = useState(false);
  const [isEditingSEO, setIsEditingSEO] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedReviewPhrase, setEditedReviewPhrase] = useState(keyword?.reviewPhrase || '');
  const [editedSearchTerms, setEditedSearchTerms] = useState<SearchTerm[]>(keyword?.searchTerms || []);
  const [editedAliasesInput, setEditedAliasesInput] = useState((keyword?.aliases || []).join(', '));
  const [editedLocationScope, setEditedLocationScope] = useState<LocationScope | null>(keyword?.locationScope || null);
  const [editedGroupId, setEditedGroupId] = useState<string | null>(keyword?.groupId || null);

  // Related questions hook
  const {
    questions: editedQuestions,
    setQuestions: setEditedQuestions,
    newQuestionText,
    setNewQuestionText,
    newQuestionFunnel,
    setNewQuestionFunnel,
    addQuestion,
    removeQuestion,
    updateQuestionFunnel,
    isAtLimit: questionsAtLimit,
    reset: resetQuestions,
  } = useRelatedQuestions({
    initialQuestions: keyword?.relatedQuestions || [],
    maxQuestions: 20,
  });

  // Search term addition state
  const [newSearchTerm, setNewSearchTerm] = useState('');
  const [relevanceWarning, setRelevanceWarning] = useState<{
    term: string;
    sharedRoots: string[];
    missingRoots: string[];
  } | null>(null);

  // AI enrichment state
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [enrichSuccess, setEnrichSuccess] = useState(false);

  // Rank tracking status
  const [rankStatus, setRankStatus] = useState<RankStatusResponse | null>(null);
  const [rankStatusLoading, setRankStatusLoading] = useState(false);

  // Per-term volume data from keyword_research_results
  const [termVolumeData, setTermVolumeData] = useState<Map<string, ResearchResultData>>(new Map());
  const [isLoadingTermVolume, setIsLoadingTermVolume] = useState(false);
  const [checkingTermVolume, setCheckingTermVolume] = useState<string | null>(null);

  // LLM visibility state
  const [selectedLLMProviders, setSelectedLLMProviders] = useState<LLMProvider[]>(['chatgpt', 'claude']);
  const [checkingQuestionIndex, setCheckingQuestionIndex] = useState<number | null>(null);
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);
  const [lastCheckResult, setLastCheckResult] = useState<{ success: boolean; message: string; questionIndex: number } | null>(null);
  const {
    results: llmResults,
    isChecking: isCheckingLLM,
    error: llmError,
    fetchResults: fetchLLMResults,
    runCheck: runLLMCheck,
  } = useLLMVisibility({ keywordId: keyword?.id || '' });

  // Check a single question
  const handleCheckQuestion = async (questionIndex: number, question: string) => {
    if (!keyword?.id || selectedLLMProviders.length === 0) return;
    setCheckingQuestionIndex(questionIndex);
    setLastCheckResult(null);
    try {
      const response = await runLLMCheck(selectedLLMProviders, [questionIndex]);
      if (response && response.checksPerformed > 0) {
        const totalProviders = selectedLLMProviders.length;

        setLastCheckResult({
          success: true,
          message: `Check complete for ${totalProviders} AI${totalProviders > 1 ? 's' : ''}. See results below.`,
          questionIndex,
        });
        // Auto-expand the question to show results
        setExpandedQuestionIndex(questionIndex);
      } else if (llmError) {
        setLastCheckResult({
          success: false,
          message: llmError,
          questionIndex,
        });
      } else {
        setLastCheckResult({
          success: false,
          message: 'Check failed - no results returned',
          questionIndex,
        });
      }
    } catch (err) {
      setLastCheckResult({
        success: false,
        message: err instanceof Error ? err.message : 'Check failed',
        questionIndex,
      });
    } finally {
      setCheckingQuestionIndex(null);
      // Clear the result message after 5 seconds
      setTimeout(() => setLastCheckResult(null), 5000);
    }
  };

  // Build question -> provider -> result map for quick lookup
  const questionLLMMap = new Map<string, Map<LLMProvider, { domainCited: boolean; citationPosition?: number | null; checkedAt: string }>>();
  for (const result of llmResults) {
    if (!questionLLMMap.has(result.question)) {
      questionLLMMap.set(result.question, new Map());
    }
    const providerMap = questionLLMMap.get(result.question)!;
    const existing = providerMap.get(result.llmProvider);
    if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
      providerMap.set(result.llmProvider, {
        domainCited: result.domainCited,
        citationPosition: result.citationPosition,
        checkedAt: result.checkedAt,
      });
    }
  }

  // Fetch LLM results when sidebar opens
  useEffect(() => {
    if (keyword?.id && isOpen && keyword.relatedQuestions && keyword.relatedQuestions.length > 0) {
      fetchLLMResults();
    }
  }, [keyword?.id, isOpen, fetchLLMResults]);

  // Fetch per-term volume data when sidebar opens
  useEffect(() => {
    if (keyword?.id && isOpen) {
      setIsLoadingTermVolume(true);
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
          console.error('Failed to fetch term volume data:', err);
          setTermVolumeData(new Map());
        })
        .finally(() => setIsLoadingTermVolume(false));
    } else {
      setTermVolumeData(new Map());
    }
  }, [keyword?.id, isOpen]);

  // Fetch rank status when keyword changes and is used in rank tracking
  useEffect(() => {
    if (keyword?.isUsedInRankTracking && isOpen) {
      setRankStatusLoading(true);
      apiClient
        .get<RankStatusResponse>(`/keywords/${keyword.id}/rank-status`)
        .then(setRankStatus)
        .catch((err) => {
          console.error('Failed to fetch rank status:', err);
          setRankStatus(null);
        })
        .finally(() => setRankStatusLoading(false));
    } else {
      setRankStatus(null);
    }
  }, [keyword?.id, keyword?.isUsedInRankTracking, isOpen]);

  // Reset editing state when keyword changes
  useEffect(() => {
    if (keyword) {
      setEditedReviewPhrase(keyword.reviewPhrase || '');
      setEditedSearchTerms(keyword.searchTerms || []);
      setEditedAliasesInput((keyword.aliases || []).join(', '));
      setEditedLocationScope(keyword.locationScope);
      setEditedGroupId(keyword.groupId);
      resetQuestions(keyword.relatedQuestions || []);
      setIsEditingReviews(false);
      setIsEditingSEO(false);
      setNewSearchTerm('');
      setRelevanceWarning(null);
    }
  }, [keyword, resetQuestions]);

  const handleSaveReviews = async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      const aliases = editedAliasesInput
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      await onUpdate(keyword.id, {
        reviewPhrase: editedReviewPhrase || '',
        aliases,
      });

      // Refresh keyword details to show updated data
      if (onRefresh) {
        await onRefresh();
      }

      setIsEditingReviews(false);
      setEnrichSuccess(false);
    } catch (error) {
      console.error('Failed to save keyword:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSEO = async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      await onUpdate(keyword.id, {
        searchTerms: editedSearchTerms,
        locationScope: editedLocationScope,
        relatedQuestions: editedQuestions.slice(0, 20), // Max 20 questions
        ...(showGroupSelector && { groupId: editedGroupId || undefined }),
      });

      // Refresh keyword details to show updated data
      if (onRefresh) {
        await onRefresh();
      }

      setIsEditingSEO(false);
      setEnrichSuccess(false);
    } catch (error) {
      console.error('Failed to save keyword:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReviews = () => {
    if (!keyword) return;
    setEditedReviewPhrase(keyword.reviewPhrase || '');
    setEditedAliasesInput((keyword.aliases || []).join(', '));
    setIsEditingReviews(false);
    setEnrichSuccess(false);
  };

  const handleCancelSEO = () => {
    if (!keyword) return;
    setEditedSearchTerms(keyword.searchTerms || []);
    setEditedLocationScope(keyword.locationScope);
    setEditedGroupId(keyword.groupId);
    resetQuestions(keyword.relatedQuestions || []);
    setIsEditingSEO(false);
    setEnrichSuccess(false);
    setNewSearchTerm('');
    setRelevanceWarning(null);
  };

  // Question management wrappers (set editing mode when modified)
  const handleAddQuestion = () => {
    if (addQuestion()) {
      setIsEditingSEO(true);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    removeQuestion(index);
    setIsEditingSEO(true);
  };

  const handleUpdateQuestionFunnel = (index: number, newStage: FunnelStage) => {
    updateQuestionFunnel(index, newStage);
    setIsEditingSEO(true);
  };

  // Search term management functions
  const handleAddSearchTerm = (forceAdd = false) => {
    if (!keyword || !newSearchTerm.trim()) return;

    const termToAdd = newSearchTerm.trim();

    // Check if term already exists
    if (editedSearchTerms.some(t => t.term.toLowerCase() === termToAdd.toLowerCase())) {
      return; // Already exists
    }

    // Check relevance against concept name (phrase)
    if (!forceAdd) {
      const relevance = checkSearchTermRelevance(keyword.phrase, termToAdd);
      if (!relevance.isRelevant) {
        setRelevanceWarning({
          term: termToAdd,
          sharedRoots: relevance.sharedRoots,
          missingRoots: relevance.missingRoots,
        });
        return;
      }
    }

    // Add the term
    const newTerm: SearchTerm = {
      term: termToAdd,
      isCanonical: editedSearchTerms.length === 0, // First term is canonical
      addedAt: new Date().toISOString(),
    };

    setEditedSearchTerms([...editedSearchTerms, newTerm]);
    setNewSearchTerm('');
    setRelevanceWarning(null);
    setIsEditingSEO(true); // Ensure we're in editing mode
  };

  const handleRemoveSearchTerm = (termToRemove: string) => {
    const remaining = editedSearchTerms.filter(t => t.term !== termToRemove);
    // If we removed the canonical term, make the first remaining one canonical
    if (remaining.length > 0 && !remaining.some(t => t.isCanonical)) {
      remaining[0].isCanonical = true;
    }
    setEditedSearchTerms(remaining);
    setIsEditingSEO(true);
  };

  const handleSetCanonical = (term: string) => {
    setEditedSearchTerms(
      editedSearchTerms.map(t => ({
        ...t,
        isCanonical: t.term === term,
      }))
    );
    setIsEditingSEO(true);
  };

  const handleDismissRelevanceWarning = () => {
    setRelevanceWarning(null);
  };

  const handleAddAnyway = () => {
    handleAddSearchTerm(true); // Force add
  };

  // Check if main SEO fields are empty (show AI button to help fill them)
  // Show button when review phrase, search terms, or aliases are missing
  const hasEmptySEOFields = !keyword?.reviewPhrase ||
    (!keyword?.searchTerms || keyword.searchTerms.length === 0) ||
    (!keyword?.aliases || keyword.aliases.length === 0);

  // Check if any section is in editing mode
  const isAnyEditing = isEditingReviews || isEditingSEO;

  // AI enrichment handler
  const handleAIEnrich = async () => {
    if (!keyword) return;
    setIsEnriching(true);
    setEnrichError(null);
    setEnrichSuccess(false);

    try {
      // Get business info from account's businesses array if available
      const primaryBusiness = account?.businesses?.[0];

      const response = await apiClient.post<{
        success: boolean;
        enrichment: {
          review_phrase: string;
          search_terms: string[];
          aliases: string[];
          location_scope: LocationScope | null;
          related_questions: RelatedQuestion[];
        };
        creditsUsed: number;
        creditsRemaining: number;
      }>('/ai/enrich-keyword', {
        phrase: keyword.phrase,
        businessName: account?.business_name || primaryBusiness?.name,
        businessCity: primaryBusiness?.address_city,
        businessState: primaryBusiness?.address_state,
      });

      if (response.success && response.enrichment) {
        // Update local state with AI-generated values
        setEditedReviewPhrase(response.enrichment.review_phrase || '');
        // Convert search_terms array to SearchTerm format (first one is canonical)
        const now = new Date().toISOString();
        if (response.enrichment.search_terms && response.enrichment.search_terms.length > 0) {
          setEditedSearchTerms(response.enrichment.search_terms.map((term, index) => ({
            term,
            isCanonical: index === 0,
            addedAt: now,
          })));
        }
        setEditedAliasesInput((response.enrichment.aliases || []).join(', '));
        setEditedLocationScope(response.enrichment.location_scope);
        // Handle related_questions - AI returns with funnel stages
        setEditedQuestions(response.enrichment.related_questions || []);

        // Enable both editing modes so user can review/modify before saving
        setIsEditingReviews(true);
        setIsEditingSEO(true);
        setEnrichSuccess(true);
      }
    } catch (error) {
      console.error('AI enrichment failed:', error);
      setEnrichError(error instanceof Error ? error.message : 'Failed to generate SEO data');
    } finally {
      setIsEnriching(false);
    }
  };

  // Location search handler
  const handleLocationSearch = async (query: string) => {
    setLocationSearchQuery(query);
    if (query.length < 2) {
      setLocationSearchResults([]);
      return;
    }

    setIsSearchingLocations(true);
    try {
      const response = await apiClient.get<{ locations: Array<{
        locationCode: number;
        locationName: string;
        countryIsoCode?: string;
        locationType?: string;
      }> }>(`/rank-tracking/locations?search=${encodeURIComponent(query)}&limit=10`);
      setLocationSearchResults(response.locations || []);
    } catch (error) {
      console.error('Location search failed:', error);
      setLocationSearchResults([]);
    } finally {
      setIsSearchingLocations(false);
    }
  };

  // Search volume lookup handler
  const handleVolumeLookup = async (locationCode?: number, locationName?: string) => {
    if (!keyword) return;
    setIsLookingUpVolume(true);
    setVolumeLookupError(null);
    setShowLocationSelector(false);

    try {
      const body: Record<string, unknown> = {
        includeSuggestions: false,
      };

      // Use provided location or existing keyword location
      if (locationCode && locationName) {
        body.locationCode = locationCode;
        body.locationName = locationName;
      }

      await apiClient.post(`/keywords/${keyword.id}/lookup-volume`, body);

      // Refresh to get the updated keyword with volume data
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Volume lookup failed:', error);
      setVolumeLookupError(error instanceof Error ? error.message : 'Failed to look up search volume');
    } finally {
      setIsLookingUpVolume(false);
    }
  };

  // Handle location selection
  const handleSelectLocation = (locationCode: number, locationName: string) => {
    // Trigger volume lookup with new location
    handleVolumeLookup(locationCode, locationName);
    setLocationSearchQuery('');
    setLocationSearchResults([]);
  };

  // Check volume for a specific search term
  const handleCheckTermVolume = async (term: string) => {
    if (!keyword) return;
    setCheckingTermVolume(term);
    try {
      // Use the keyword discovery API to get volume data
      const response = await apiClient.post<{
        keyword: string;
        volume: number;
        cpc: number | null;
        competition: number | null;
        competitionLevel: string | null;
        trend: string | null;
        monthlySearches: Array<{ month: number; year: number; searchVolume: number }> | null;
      }>('/rank-tracking/discovery', {
        keyword: term,
        locationCode: keyword.searchVolumeLocationCode || 2840,
      });

      // Save the result linked to this keyword
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
          id: '', // Will be set by API
          term,
          normalizedTerm,
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

  // Format large numbers nicely
  // Note: Google rounds low-volume keywords to 0, but they may still get traffic
  const formatVolume = (vol: number | null) => {
    if (vol === null || vol === undefined) return '-';
    if (vol === 0) return '<10';
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  // Get competition badge color
  const getCompetitionColor = (level: string | null) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  // Check if metrics are stale (older than 30 days)
  const isMetricsStale = keyword?.metricsUpdatedAt
    ? new Date(keyword.metricsUpdatedAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : true;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop - transparent, just for click-outside handling */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md h-full">
                  <div className="h-full flex flex-col backdrop-blur-xl shadow-2xl">
                    <div className="flex-1 overflow-y-auto p-6">
                      {/* Close button - floats on top right */}
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={onClose}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Icon name="FaTimes" className="w-5 h-5" />
                        </button>
                      </div>

                      {keyword && (
                        <div className="space-y-4">
                          {/* Header + Stats card combined */}
                          <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Icon name="FaStar" className="w-5 h-5 text-slate-blue" />
                                <Dialog.Title className="text-lg font-bold text-gray-900">{keyword.phrase}</Dialog.Title>
                              </div>
                              {isAnyEditing && (
                                <button
                                  onClick={async () => {
                                    if (isEditingReviews) await handleSaveReviews();
                                    if (isEditingSEO) await handleSaveSEO();
                                  }}
                                  disabled={isSaving}
                                  className="px-3 py-1.5 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {isSaving && <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />}
                                  Save
                                </button>
                              )}
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-5 gap-3 text-sm pt-3 mt-3 border-t border-gray-100">
                              <div>
                                <span className="text-gray-500 block text-xs">Words</span>
                                <span className="font-medium">{keyword.wordCount}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs">Pages</span>
                                <span className={`font-medium ${promptPages.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  {promptPages.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs">Reviews</span>
                                <span className="font-medium">{keyword.reviewUsageCount}</span>
                              </div>
                              {(() => {
                                const terms = Array.from(termVolumeData.values());
                                const totalVolume = terms.reduce((sum, t) => sum + (t.searchVolume || 0), 0);
                                const allLowVolume = terms.length > 0 && terms.every(t => (t.searchVolume || 0) < 10);

                                return (
                                  <div
                                    className="cursor-help"
                                    title={`Total monthly search volume from ${termVolumeData.size} researched term${termVolumeData.size === 1 ? '' : 's'}. Click "Check volume" on search terms to add more.`}
                                  >
                                    <span className="text-gray-500 block text-xs flex items-center gap-1">
                                      Volume
                                      <Icon name="FaInfoCircle" className="w-2.5 h-2.5 text-gray-400" />
                                    </span>
                                    <span className={`font-medium ${termVolumeData.size > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                      {termVolumeData.size === 0
                                        ? '—'
                                        : allLowVolume
                                          ? '<10'
                                          : formatVolume(totalVolume)}
                                    </span>
                                  </div>
                                );
                              })()}
                              <div>
                                <span className="text-gray-500 block text-xs">Group</span>
                                <span className="font-medium truncate block">{keyword.groupName || 'None'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Rank Tracking Status */}
                          {keyword.isUsedInRankTracking && (
                            <div className="p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 backdrop-blur-sm border border-blue-100/50 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon name="FaChartLine" className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium uppercase tracking-wider text-blue-600">Rank Tracking</span>
                              </div>
                              {rankStatusLoading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                                  Loading...
                                </div>
                              ) : rankStatus?.rankings && rankStatus.rankings.length > 0 ? (
                                <div className="space-y-3">
                                  {rankStatus.rankings.map((ranking) => (
                                    <div key={ranking.groupId} className="bg-white/60 rounded-lg p-3">
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
                                                  <span className={`text-lg font-bold ${
                                                    ranking.latestCheck.position <= 3 ? 'text-green-600' :
                                                    ranking.latestCheck.position <= 10 ? 'text-blue-600' :
                                                    ranking.latestCheck.position <= 20 ? 'text-amber-600' : 'text-gray-600'
                                                  }`}>
                                                    #{ranking.latestCheck.position}
                                                  </span>
                                                  {ranking.latestCheck.positionChange !== null && ranking.latestCheck.positionChange !== 0 && (
                                                    <span className={`text-xs font-medium ${
                                                      ranking.latestCheck.positionChange > 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                      {ranking.latestCheck.positionChange > 0 ? '↑' : '↓'}
                                                      {Math.abs(ranking.latestCheck.positionChange)}
                                                    </span>
                                                  )}
                                                </>
                                              ) : (
                                                <span className="text-sm text-gray-400">Not found</span>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                              {new Date(ranking.latestCheck.checkedAt).toLocaleDateString()}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-gray-400">No checks yet</span>
                                        )}
                                      </div>
                                      {/* SERP Visibility */}
                                      {ranking.latestCheck?.serpVisibility && (
                                        <div className="mt-2 pt-2 border-t border-gray-100/50">
                                          <div className="flex flex-wrap gap-1.5">
                                            {/* Featured Snippet */}
                                            {ranking.latestCheck.serpVisibility.featuredSnippet.present && (
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                ranking.latestCheck.serpVisibility.featuredSnippet.ours
                                                  ? 'bg-green-100/80 text-green-700'
                                                  : 'bg-gray-100/80 text-gray-600'
                                              }`}>
                                                <Icon name="FaStar" className="w-2.5 h-2.5" />
                                                Featured{ranking.latestCheck.serpVisibility.featuredSnippet.ours && ' ✓'}
                                              </span>
                                            )}
                                            {/* AI Overview */}
                                            {ranking.latestCheck.serpVisibility.aiOverview.present && (
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                ranking.latestCheck.serpVisibility.aiOverview.oursCited
                                                  ? 'bg-purple-100/80 text-purple-700'
                                                  : 'bg-gray-100/80 text-gray-600'
                                              }`}>
                                                <Icon name="FaSparkles" className="w-2.5 h-2.5" />
                                                AI{ranking.latestCheck.serpVisibility.aiOverview.oursCited && ' ✓'}
                                              </span>
                                            )}
                                            {/* PAA */}
                                            {ranking.latestCheck.serpVisibility.paa.questionCount > 0 && (
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                ranking.latestCheck.serpVisibility.paa.oursCount > 0
                                                  ? 'bg-blue-100/80 text-blue-700'
                                                  : 'bg-gray-100/80 text-gray-600'
                                              }`}>
                                                <Icon name="FaQuestionCircle" className="w-2.5 h-2.5" />
                                                PAA {ranking.latestCheck.serpVisibility.paa.oursCount}/{ranking.latestCheck.serpVisibility.paa.questionCount}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  Added to rank tracking but no checks performed yet.
                                </div>
                              )}
                            </div>
                          )}

                          {/* Discovered Questions from Google */}
                          {rankStatus?.rankings && rankStatus.rankings.some(r =>
                            r.latestCheck?.discoveredQuestions && r.latestCheck.discoveredQuestions.length > 0
                          ) && (
                            <div className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm border border-amber-100/50 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon name="FaLightbulb" className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-medium uppercase tracking-wider text-amber-600">
                                  Questions from Google
                                </span>
                              </div>
                              {(() => {
                                const currentCount = keyword?.relatedQuestions?.length || 0;
                                const limitReached = currentCount >= 20;
                                return (
                                  <>
                                    <p className="text-xs text-gray-500 mb-3">
                                      Questions people ask related to this keyword.
                                      {!limitReached && ' Click to add to your tracked questions.'}
                                    </p>
                                    {limitReached && (
                                      <div className="mb-3 px-2 py-1.5 bg-amber-100/80 border border-amber-200/50 rounded-lg text-xs text-amber-700">
                                        Limit reached (20 questions max)
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      {/* Dedupe questions across all rankings */}
                                      {Array.from(
                                        new Map(
                                          rankStatus.rankings
                                            .flatMap(r => r.latestCheck?.discoveredQuestions || [])
                                            .map(q => [q.question, q])
                                        ).values()
                                      ).slice(0, 8).map((q, idx) => {
                                        const isAlreadySaved = keyword?.relatedQuestions?.some(rq => rq.question === q.question);
                                        const canAdd = !isAlreadySaved && !limitReached && !isEditingSEO;
                                        return (
                                          <div
                                            key={idx}
                                            className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                                              isAlreadySaved
                                                ? 'bg-green-50/80 border border-green-100/50'
                                                : canAdd
                                                  ? 'bg-white/60 hover:bg-white/80 cursor-pointer'
                                                  : 'bg-white/40 opacity-60'
                                            }`}
                                            onClick={() => {
                                              if (canAdd) {
                                                // Add to related questions with default 'middle' funnel
                                                const currentQuestions = keyword?.relatedQuestions || [];
                                                const newQuestion: RelatedQuestion = {
                                                  question: q.question,
                                                  funnelStage: 'middle',
                                                  addedAt: new Date().toISOString(),
                                                };
                                                const newQuestions = [...currentQuestions, newQuestion];
                                                setEditedQuestions(newQuestions);
                                                // Auto-save the question
                                                onUpdate(keyword!.id, {
                                                  relatedQuestions: newQuestions,
                                                });
                                              }
                                            }}
                                          >
                                            <Icon
                                              name={isAlreadySaved ? "FaCheckCircle" : "FaQuestionCircle"}
                                              className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                                                isAlreadySaved ? 'text-green-500' : 'text-amber-400'
                                              }`}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-sm text-gray-700">{q.question}</span>
                                              {q.isOurs && (
                                                <span className="ml-2 text-xs text-green-600 font-medium">
                                                  You answer this!
                                                </span>
                                              )}
                                            </div>
                                            {canAdd && (
                                              <Icon name="FaPlus" className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* AI Generate button - shown when fields are empty */}
                          {hasEmptySEOFields && !isAnyEditing && (
                            <button
                              onClick={handleAIEnrich}
                              disabled={isEnriching}
                              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                              {isEnriching ? (
                                <>
                                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Icon name="prompty" className="w-4 h-4" />
                                  Auto-fill with AI (1 credit)
                                </>
                              )}
                            </button>
                          )}

                          {/* AI enrichment error */}
                          {enrichError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
                              <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                              {enrichError}
                            </div>
                          )}

                          {/* AI enrichment success message */}
                          {enrichSuccess && isAnyEditing && (
                            <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700 flex items-center gap-2">
                              <Icon name="prompty" className="w-4 h-4" />
                              Fields populated by AI - review and save
                            </div>
                          )}

                          {/* REVIEWS SECTION */}
                          <div className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Icon name="FaStar" className="w-5 h-5 text-slate-blue" />
                                <span className="text-lg font-semibold text-gray-800">Reviews</span>
                              </div>
                              {!isEditingReviews ? (
                                <button
                                  onClick={() => setIsEditingReviews(true)}
                                  className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit reviews section"
                                >
                                  <Icon name="FaEdit" className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={handleSaveReviews}
                                  disabled={isSaving}
                                  className="px-2.5 py-1 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isSaving && <Icon name="FaSpinner" className="w-2.5 h-2.5 animate-spin" />}
                                  Save
                                </button>
                              )}
                            </div>

                            <div className="space-y-5">
                              {/* Review Phrase */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Review phrase
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                  This is the phrase used in AI Generate and the Suggested Reviews feature on Prompt Pages.
                                </p>
                                {isEditingReviews ? (
                                  <input
                                    type="text"
                                    value={editedReviewPhrase}
                                    onChange={(e) => setEditedReviewPhrase(e.target.value)}
                                    placeholder="e.g., best marketing consultant in Portland"
                                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
                                    {keyword.reviewPhrase || <span className="text-gray-400 italic">Not set</span>}
                                  </div>
                                )}
                              </div>

                              {/* Review Aliases */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Review aliases
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                  Alternative spellings or phrases that count as mentions of this keyword.
                                </p>
                                {isEditingReviews ? (
                                  <input
                                    type="text"
                                    value={editedAliasesInput}
                                    onChange={(e) => setEditedAliasesInput(e.target.value)}
                                    placeholder="e.g., plumbing services, plumbers (comma-separated)"
                                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100 min-h-[42px]">
                                    {keyword.aliases && keyword.aliases.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {keyword.aliases.map((alias, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-sm text-indigo-700">
                                            {alias}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">No aliases</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* SEARCH & LLM TRACKING SECTION */}
                          <div className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Icon name="FaChartLine" className="w-5 h-5 text-slate-blue" />
                                <span className="text-lg font-semibold text-gray-800">SEO & LLM tracking</span>
                              </div>
                              {!isEditingSEO ? (
                                <button
                                  onClick={() => setIsEditingSEO(true)}
                                  className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit SEO section"
                                >
                                  <Icon name="FaEdit" className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={handleSaveSEO}
                                  disabled={isSaving}
                                  className="px-2.5 py-1 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isSaving && <Icon name="FaSpinner" className="w-2.5 h-2.5 animate-spin" />}
                                  Save
                                </button>
                              )}
                            </div>

                            <div className="space-y-5">
                              {/* Search Terms */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Search terms
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                  Terms tracked in Google SERPs. The root phrase that defines this concept should share root words with these terms.
                                </p>

                                {/* Existing terms list - each term with its own stats */}
                                {editedSearchTerms.length > 0 ? (
                                  <div className="space-y-2 mb-3">
                                    {editedSearchTerms.map((term) => (
                                      <div
                                        key={term.term}
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
                                            <span className="text-sm font-medium text-gray-800 truncate">{term.term}</span>
                                          </div>
                                          {isEditingSEO && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              {!term.isCanonical && (
                                                <button
                                                  onClick={() => handleSetCanonical(term.term)}
                                                  className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                                                  title="Set as canonical"
                                                >
                                                  <Icon name="FaStar" className="w-3 h-3" />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => handleRemoveSearchTerm(term.term)}
                                                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                title="Remove term"
                                              >
                                                <Icon name="FaTimes" className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Stats row - show per-term volume data only */}
                                        <div className="mt-2 pt-2 border-t border-gray-100/50">
                                          {(() => {
                                            // Check if we have per-term volume data for this term
                                            const normalizedTerm = normalizePhrase(term.term);
                                            const termData = termVolumeData.get(normalizedTerm);

                                            // Only show volume if we have term-specific data
                                            if (termData && termData.searchVolume !== null) {
                                              return (
                                                <div className="flex items-center justify-between text-xs">
                                                  <div className="flex items-center gap-3">
                                                    <div>
                                                      <span className="text-gray-500">Volume: </span>
                                                      <span className="font-semibold text-gray-900">{formatVolume(termData.searchVolume)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                      <Icon name="FaMapMarker" className="w-2.5 h-2.5" />
                                                      {termData.locationName || 'United States'}
                                                    </div>
                                                    {termData.competitionLevel && (
                                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCompetitionColor(termData.competitionLevel)}`}>
                                                        {termData.competitionLevel}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {termData.cpc && (
                                                    <div className="text-gray-500">
                                                      CPC: <span className="font-medium text-gray-700">${termData.cpc.toFixed(2)}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            }

                                            // No per-term volume data - show check button
                                            return (
                                              <button
                                                onClick={() => handleCheckTermVolume(term.term)}
                                                disabled={checkingTermVolume === term.term || isLookingUpVolume}
                                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
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
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400 italic bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100 mb-3">
                                    No search terms added
                                  </div>
                                )}

                                {/* Add new term input */}
                                {isEditingSEO && (
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={newSearchTerm}
                                        onChange={(e) => setNewSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSearchTerm();
                                          }
                                        }}
                                        placeholder="e.g., portland plumber"
                                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                      />
                                      <button
                                        onClick={() => handleAddSearchTerm()}
                                        disabled={!newSearchTerm.trim()}
                                        className="px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <Icon name="FaPlus" className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Relevance warning */}
                                    {relevanceWarning && (
                                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                          <Icon name="FaExclamationTriangle" className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-800">
                                              This term may not match the concept
                                            </p>
                                            <p className="text-xs text-amber-600 mt-1">
                                              &quot;{relevanceWarning.term}&quot; doesn&apos;t share root words with &quot;{keyword.phrase}&quot;.
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                              <button
                                                onClick={handleAddAnyway}
                                                className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200 transition-colors"
                                              >
                                                Add anyway
                                              </button>
                                              <button
                                                onClick={handleDismissRelevanceWarning}
                                                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <p className="text-xs text-gray-400">
                                      <Icon name="FaStar" className="w-2.5 h-2.5 inline mr-1" />
                                      = Canonical term (shown when space is limited)
                                    </p>
                                  </div>
                                )}

                                {/* Volume lookup error */}
                                {volumeLookupError && (
                                  <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                                    <Icon name="FaExclamationTriangle" className="w-3 h-3" />
                                    {volumeLookupError}
                                  </div>
                                )}
                              </div>

                              {/* Related Questions */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Related questions
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                  Questions for tracking &quot;People Also Ask&quot; and AI visibility.
                                </p>

                                {/* AI providers selector (view mode only, at top) */}
                                {!isEditingSEO && keyword.relatedQuestions && keyword.relatedQuestions.length > 0 && (
                                  <div className="mb-3 p-2 bg-purple-50/60 rounded-lg border border-purple-100/50">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-medium text-purple-600">Check with:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {LLM_PROVIDERS.map(provider => {
                                          const isSelected = selectedLLMProviders.includes(provider);
                                          const colors = LLM_PROVIDER_COLORS[provider];
                                          return (
                                            <button
                                              key={provider}
                                              onClick={() => {
                                                setSelectedLLMProviders(prev => {
                                                  if (prev.includes(provider)) {
                                                    if (prev.length === 1) return prev;
                                                    return prev.filter(p => p !== provider);
                                                  }
                                                  return [...prev, provider];
                                                });
                                              }}
                                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                                                isSelected
                                                  ? `${colors.bg} ${colors.text}`
                                                  : 'bg-gray-100 text-gray-400'
                                              }`}
                                            >
                                              {LLM_PROVIDER_LABELS[provider]}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    {llmError && (
                                      <p className="mt-1 text-xs text-red-600">{llmError}</p>
                                    )}
                                  </div>
                                )}

                                {/* Questions list (view/edit) - grouped by funnel stage */}
                                <div className="space-y-3 mb-3">
                                  {(() => {
                                    const questions = isEditingSEO ? editedQuestions : keyword.relatedQuestions;
                                    if (!questions || questions.length === 0) {
                                      if (!isEditingSEO) {
                                        return (
                                          <div className="text-sm text-gray-400 italic bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
                                            No questions added
                                          </div>
                                        );
                                      }
                                      return null;
                                    }

                                    // Group questions by funnel stage
                                    const grouped = {
                                      top: questions.map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => q.funnelStage === 'top'),
                                      middle: questions.map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => q.funnelStage === 'middle'),
                                      bottom: questions.map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => q.funnelStage === 'bottom'),
                                    };

                                    const stages: Array<{ key: FunnelStage; label: string; description: string }> = [
                                      { key: 'top', label: 'Top of funnel', description: 'Awareness' },
                                      { key: 'middle', label: 'Middle of funnel', description: 'Consideration' },
                                      { key: 'bottom', label: 'Bottom of funnel', description: 'Decision' },
                                    ];

                                    return stages
                                      .filter(stage => grouped[stage.key].length > 0)
                                      .map(stage => {
                                        const stageQuestions = grouped[stage.key];
                                        const funnelColor = getFunnelStageColor(stage.key);

                                        return (
                                          <div key={stage.key} className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <span className={`px-1.5 py-0.5 text-xs rounded ${funnelColor.bg} ${funnelColor.text}`}>
                                                {stage.label}
                                              </span>
                                              <span className="text-xs text-gray-400">{stage.description}</span>
                                            </div>
                                            <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
                                              {stageQuestions.map((q) => {
                                                const isExpanded = expandedQuestionIndex === q.originalIndex;
                                                const providerResults = questionLLMMap.get(q.question);
                                                const hasResults = providerResults && providerResults.size > 0;
                                                const citedCount = hasResults
                                                  ? Array.from(providerResults.values()).filter(r => r.domainCited).length
                                                  : 0;
                                                const checkResultForThis = lastCheckResult?.questionIndex === q.originalIndex ? lastCheckResult : null;

                                                return (
                                                <div key={q.originalIndex} className="bg-white/80 rounded-lg border border-gray-100 overflow-hidden">
                                                  {/* Question header - clickable to expand */}
                                                  <div
                                                    className={`flex items-start gap-2 p-2 cursor-pointer hover:bg-gray-50/50 transition-colors ${
                                                      isExpanded ? 'border-b border-gray-100' : ''
                                                    }`}
                                                    onClick={() => !isEditingSEO && setExpandedQuestionIndex(isExpanded ? null : q.originalIndex)}
                                                  >
                                                  {isEditingSEO && (
                                                    <div className="relative group flex-shrink-0">
                                                      <select
                                                        value={q.funnelStage}
                                                        onChange={(e) => handleUpdateQuestionFunnel(q.originalIndex, e.target.value as FunnelStage)}
                                                        className={`px-1.5 py-0.5 text-xs rounded border-0 ${funnelColor.bg} ${funnelColor.text} cursor-pointer`}
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <option value="top">Top</option>
                                                        <option value="middle">Mid</option>
                                                        <option value="bottom">Bot</option>
                                                      </select>
                                                      <div className="absolute bottom-full left-0 mb-1 p-2 bg-gray-900 text-white text-xs rounded w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                                        <div className="font-semibold mb-1">Change funnel stage</div>
                                                        <div className="space-y-0.5">
                                                          <div><span className="text-blue-300">Top:</span> Awareness questions</div>
                                                          <div><span className="text-amber-300">Mid:</span> Consideration questions</div>
                                                          <div><span className="text-green-300">Bot:</span> Decision questions</div>
                                                        </div>
                                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
                                                      </div>
                                                    </div>
                                                  )}
                                                  <span className="flex-1 text-sm text-gray-700">{q.question}</span>
                                                  {isEditingSEO ? (
                                                    <button
                                                      onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(q.originalIndex); }}
                                                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
                                                      title="Remove question"
                                                    >
                                                      <Icon name="FaTimes" className="w-3 h-3" />
                                                    </button>
                                                  ) : (
                                                    /* LLM visibility summary badges + expand indicator */
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                      {hasResults ? (
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                          citedCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                          {citedCount}/{providerResults.size} cited
                                                        </span>
                                                      ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400">
                                                          Not checked
                                                        </span>
                                                      )}
                                                      <Icon
                                                        name={isExpanded ? "FaChevronUp" : "FaChevronDown"}
                                                        className="w-3 h-3 text-gray-400"
                                                      />
                                                    </div>
                                                  )}
                                                  </div>

                                                  {/* Expanded content - AI visibility details */}
                                                  {isExpanded && !isEditingSEO && (
                                                    <div className="p-3 bg-gray-50/50 space-y-3">
                                                      {/* Check result message */}
                                                      {checkResultForThis && (
                                                        <div className={`p-2 rounded-lg text-sm flex items-center gap-2 ${
                                                          checkResultForThis.success
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-red-50 text-red-700 border border-red-200'
                                                        }`}>
                                                          <Icon
                                                            name={checkResultForThis.success ? "FaCheckCircle" : "FaExclamationTriangle"}
                                                            className="w-4 h-4 flex-shrink-0"
                                                          />
                                                          {checkResultForThis.message}
                                                        </div>
                                                      )}

                                                      {/* Provider results grid */}
                                                      <div className="space-y-2">
                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI visibility results</div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                          {selectedLLMProviders.map(provider => {
                                                            const result = providerResults?.get(provider);
                                                            const colors = LLM_PROVIDER_COLORS[provider];

                                                            return (
                                                              <div
                                                                key={provider}
                                                                className={`p-2 rounded-lg border ${
                                                                  result?.domainCited
                                                                    ? 'bg-green-50 border-green-200'
                                                                    : result
                                                                      ? 'bg-gray-50 border-gray-200'
                                                                      : 'bg-white border-gray-200'
                                                                }`}
                                                              >
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                                                                    {LLM_PROVIDER_LABELS[provider]}
                                                                  </span>
                                                                </div>
                                                                {result ? (
                                                                  <div className="text-xs">
                                                                    {result.domainCited ? (
                                                                      <span className="text-green-600 font-medium flex items-center gap-1">
                                                                        <Icon name="FaCheckCircle" className="w-3 h-3" />
                                                                        Cited{result.citationPosition ? ` (#${result.citationPosition})` : ''}
                                                                      </span>
                                                                    ) : (
                                                                      <span className="text-gray-500">Not cited</span>
                                                                    )}
                                                                  </div>
                                                                ) : (
                                                                  <div className="text-xs text-gray-400">Not checked yet</div>
                                                                )}
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      </div>

                                                      {/* Check button */}
                                                      <button
                                                        onClick={(e) => { e.stopPropagation(); handleCheckQuestion(q.originalIndex, q.question); }}
                                                        disabled={checkingQuestionIndex !== null || selectedLLMProviders.length === 0}
                                                        className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                                      >
                                                        {checkingQuestionIndex === q.originalIndex ? (
                                                          <>
                                                            <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                                                            Checking AI visibility...
                                                          </>
                                                        ) : (
                                                          <>
                                                            <Icon name="prompty" className="w-4 h-4" />
                                                            Check AI visibility ({selectedLLMProviders.length} {selectedLLMProviders.length === 1 ? 'provider' : 'providers'})
                                                          </>
                                                        )}
                                                      </button>
                                                      <p className="text-[10px] text-center text-gray-400">
                                                        Uses {selectedLLMProviders.reduce((acc, p) => acc + LLM_CREDIT_COSTS[p], 0)} credits
                                                      </p>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      });
                                  })()}
                                </div>

                                {/* Add new question (edit mode) */}
                                {isEditingSEO && !questionsAtLimit && (
                                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <input
                                      type="text"
                                      value={newQuestionText}
                                      onChange={(e) => setNewQuestionText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddQuestion();
                                        }
                                      }}
                                      placeholder="Type your question..."
                                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                    />
                                    <div className="flex items-center gap-2">
                                      <div className="relative group flex-1">
                                        <select
                                          value={newQuestionFunnel}
                                          onChange={(e) => setNewQuestionFunnel(e.target.value as FunnelStage)}
                                          className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 cursor-help"
                                        >
                                          <option value="top">Top (awareness)</option>
                                          <option value="middle">Middle (consideration)</option>
                                          <option value="bottom">Bottom (decision)</option>
                                        </select>
                                        <div className="absolute bottom-full left-0 mb-1 p-2 bg-gray-900 text-white text-xs rounded w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                          <div className="font-semibold mb-1">Marketing funnel stage</div>
                                          <div className="space-y-0.5">
                                            <div><span className="text-blue-300">Top:</span> Awareness - broad, educational questions</div>
                                            <div><span className="text-amber-300">Middle:</span> Consideration - comparison questions</div>
                                            <div><span className="text-green-300">Bottom:</span> Decision - purchase-intent questions</div>
                                          </div>
                                          <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
                                        </div>
                                      </div>
                                      <button
                                        onClick={handleAddQuestion}
                                        disabled={!newQuestionText.trim()}
                                        className="px-3 py-1.5 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                      >
                                        Add question
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {isEditingSEO && questionsAtLimit && (
                                  <p className="text-xs text-amber-600">Maximum of 20 questions reached</p>
                                )}

                              </div>
                            </div>
                          </div>

                          {/* Group selector (optional) */}
                          {showGroupSelector && groups.length > 0 && (
                            <div className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                              <label className="text-sm font-medium text-gray-700 block mb-2">
                                Group
                              </label>
                              {isEditingSEO ? (
                                <select
                                  value={editedGroupId || ''}
                                  onChange={(e) => setEditedGroupId(e.target.value || null)}
                                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                >
                                  <option value="">No group</option>
                                  {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                      {group.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
                                  {keyword.groupName || <span className="text-gray-400 italic">No group</span>}
                                </div>
                              )}
                            </div>
                          )}


                          {/* Prompt pages */}
                          {promptPages.length > 0 && (
                            <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Used in Prompt Pages</span>
                              <div className="space-y-1 mt-2">
                                {promptPages.map((page) => (
                                  <div key={page.id} className="text-sm text-gray-600 flex items-center gap-2">
                                    <Icon name="FaFileAlt" className="w-3 h-3 text-indigo-400" />
                                    <span>{page.name || page.slug}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recent reviews */}
                          {recentReviews.length > 0 && (
                            <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Recent Matches</span>
                              <div className="space-y-2 mt-2">
                                {recentReviews.slice(0, 5).map((review) => (
                                  <div key={review.id} className="text-sm p-2 bg-white/80 rounded-lg">
                                    <div className="font-medium text-gray-700">{review.reviewerName}</div>
                                    {review.content && (
                                      <div className="text-gray-500 text-xs line-clamp-2 mt-1">{review.content}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bottom save button - shown when any section is being edited */}
                          {isAnyEditing && (
                            <div className="sticky bottom-0 pt-4 pb-2 -mx-6 px-6 bg-gradient-to-t from-white/95 via-white/90 to-transparent">
                              <button
                                onClick={async () => {
                                  if (isEditingReviews) await handleSaveReviews();
                                  if (isEditingSEO) await handleSaveSEO();
                                }}
                                disabled={isSaving}
                                className="w-full py-2.5 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                              >
                                {isSaving && <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />}
                                Save changes
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default KeywordDetailsSidebar;
