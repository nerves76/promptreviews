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
  checkSearchTermRelevance,
  getFunnelStageColor,
  getFunnelStageShortLabel,
} from '../keywordUtils';
import { useRelatedQuestions } from '../hooks/useRelatedQuestions';
import { LLMVisibilitySection } from '@/features/llm-visibility/components/LLMVisibilitySection';
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
  const [isVolumeExpanded, setIsVolumeExpanded] = useState(false);

  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
      setNewSearchTerm('');
      setRelevanceWarning(null);
    }
  }, [keyword, resetQuestions]);

  const handleSave = async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      const aliases = editedAliasesInput
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      await onUpdate(keyword.id, {
        reviewPhrase: editedReviewPhrase || '',
        searchTerms: editedSearchTerms,
        aliases,
        locationScope: editedLocationScope,
        relatedQuestions: editedQuestions.slice(0, 20), // Max 20 questions
        ...(showGroupSelector && { groupId: editedGroupId || undefined }),
      });

      // Refresh keyword details to show updated data
      if (onRefresh) {
        await onRefresh();
      }

      setIsEditing(false);
      setEnrichSuccess(false);
    } catch (error) {
      console.error('Failed to save keyword:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!keyword) return;
    setEditedReviewPhrase(keyword.reviewPhrase || '');
    setEditedSearchTerms(keyword.searchTerms || []);
    setEditedAliasesInput((keyword.aliases || []).join(', '));
    setEditedLocationScope(keyword.locationScope);
    setEditedGroupId(keyword.groupId);
    resetQuestions(keyword.relatedQuestions || []);
    setIsEditing(false);
    setEnrichSuccess(false);
    setNewSearchTerm('');
    setRelevanceWarning(null);
  };

  // Question management wrappers (set editing mode when modified)
  const handleAddQuestion = () => {
    if (addQuestion()) {
      setIsEditing(true);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    removeQuestion(index);
    setIsEditing(true);
  };

  const handleUpdateQuestionFunnel = (index: number, newStage: FunnelStage) => {
    updateQuestionFunnel(index, newStage);
    setIsEditing(true);
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
    setIsEditing(true); // Ensure we're in editing mode
  };

  const handleRemoveSearchTerm = (termToRemove: string) => {
    const remaining = editedSearchTerms.filter(t => t.term !== termToRemove);
    // If we removed the canonical term, make the first remaining one canonical
    if (remaining.length > 0 && !remaining.some(t => t.isCanonical)) {
      remaining[0].isCanonical = true;
    }
    setEditedSearchTerms(remaining);
    setIsEditing(true);
  };

  const handleSetCanonical = (term: string) => {
    setEditedSearchTerms(
      editedSearchTerms.map(t => ({
        ...t,
        isCanonical: t.term === term,
      }))
    );
    setIsEditing(true);
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
          search_query: string;
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
        // Convert search_query to search_terms array format
        if (response.enrichment.search_query) {
          setEditedSearchTerms([{
            term: response.enrichment.search_query,
            isCanonical: true,
            addedAt: new Date().toISOString(),
          }]);
        }
        setEditedAliasesInput((response.enrichment.aliases || []).join(', '));
        setEditedLocationScope(response.enrichment.location_scope);
        // Handle related_questions - AI returns with funnel stages
        setEditedQuestions(response.enrichment.related_questions || []);

        // Enable editing mode so user can review/modify before saving
        setIsEditing(true);
        setEnrichSuccess(true);
      }
    } catch (error) {
      console.error('AI enrichment failed:', error);
      setEnrichError(error instanceof Error ? error.message : 'Failed to generate SEO data');
    } finally {
      setIsEnriching(false);
    }
  };

  // Search volume lookup handler
  const handleVolumeLookup = async () => {
    if (!keyword) return;
    setIsLookingUpVolume(true);
    setVolumeLookupError(null);

    try {
      await apiClient.post(`/keywords/${keyword.id}/lookup-volume`, {
        includeSuggestions: false,
      });

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
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/20 transition-opacity" />
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
                  <div className="h-full flex flex-col bg-white/80 backdrop-blur-xl shadow-2xl">
                    <div className="flex-1 overflow-y-auto p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Keyword Concept</span>
                          {keyword && (
                            <Dialog.Title className="text-xl font-bold text-gray-900 mt-1">{keyword.phrase}</Dialog.Title>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Edit/Save buttons in header */}
                          {keyword && !isEditing && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="p-1.5 text-slate-blue hover:text-slate-blue/80 hover:bg-white/50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Icon name="FaEdit" className="w-5 h-5" />
                            </button>
                          )}
                          {keyword && isEditing && (
                            <>
                              <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-3 py-1 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {isSaving && <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />}
                                Save
                              </button>
                            </>
                          )}
                          <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            <Icon name="FaTimes" className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {keyword && (
                        <div className="space-y-4">
                          {/* Stats grid */}
                          <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div>
                              <span className="text-gray-500 block text-xs">Word count</span>
                              <span className="font-medium">{keyword.wordCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Prompt pages</span>
                              <span className={`font-medium ${promptPages.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {promptPages.length}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">In reviews</span>
                              <span className="font-medium">{keyword.reviewUsageCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Group</span>
                              <span className="font-medium">{keyword.groupName || 'None'}</span>
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
                                        const canAdd = !isAlreadySaved && !limitReached && !isEditing;
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

                          {/* AI Generate section - prominent when fields are empty */}
                          {hasEmptySEOFields && !isEditing && (
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Icon name="FaSparkles" className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-purple-900">Auto-fill with AI</div>
                                  <div className="text-xs text-purple-600">
                                    Generate review phrase, search terms, aliases, and questions
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={handleAIEnrich}
                                disabled={isEnriching}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                              >
                                {isEnriching ? (
                                  <>
                                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Icon name="FaSparkles" className="w-4 h-4" />
                                    Generate (1 credit)
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* AI enrichment error */}
                          {enrichError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
                              <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                              {enrichError}
                            </div>
                          )}

                          {/* AI enrichment success message */}
                          {enrichSuccess && isEditing && (
                            <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700 flex items-center gap-2">
                              <Icon name="FaSparkles" className="w-4 h-4" />
                              Fields populated by AI - review and save
                            </div>
                          )}

                          {/* REVIEWS SECTION */}
                          <div className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                              <Icon name="FaStar" className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-semibold text-gray-700">Reviews</span>
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
                                {isEditing ? (
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
                                {isEditing ? (
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

                          {/* SEO & LLM TRACKING SECTION */}
                          <div className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                              <Icon name="FaChartLine" className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-semibold text-gray-700">SEO & LLM tracking</span>
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

                                {/* Existing terms list */}
                                {editedSearchTerms.length > 0 ? (
                                  <div className="space-y-2 mb-3">
                                    {editedSearchTerms.map((term) => (
                                      <div
                                        key={term.term}
                                        className={`flex items-center justify-between p-2.5 rounded-lg border ${
                                          term.isCanonical
                                            ? 'bg-blue-50/80 border-blue-200/50'
                                            : 'bg-white/80 border-gray-100'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {term.isCanonical && (
                                            <span title="Canonical term">
                                              <Icon name="FaStar" className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                            </span>
                                          )}
                                          <span className="text-sm text-gray-700 truncate">{term.term}</span>
                                        </div>
                                        {isEditing && (
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
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400 italic bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100 mb-3">
                                    No search terms added
                                  </div>
                                )}

                                {/* Add new term input */}
                                {isEditing && (
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

                                {/* Search Volume Section - show for canonical term */}
                                {!isEditing && editedSearchTerms.length > 0 && (
                                  <div className="mt-3">
                                    {/* Show lookup button if no data or stale */}
                                    {(keyword.searchVolume === null || isMetricsStale) && (
                                      <button
                                        onClick={handleVolumeLookup}
                                        disabled={isLookingUpVolume}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
                                      >
                                        {isLookingUpVolume ? (
                                          <>
                                            <Icon name="FaSpinner" className="w-3.5 h-3.5 animate-spin" />
                                            Looking up...
                                          </>
                                        ) : (
                                          <>
                                            <Icon name="FaSearch" className="w-3.5 h-3.5" />
                                            {keyword.searchVolume !== null ? 'Refresh volume data' : 'Check search volume'}
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {/* Volume lookup error */}
                                    {volumeLookupError && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                                        <Icon name="FaExclamationTriangle" className="w-3 h-3" />
                                        {volumeLookupError}
                                      </div>
                                    )}

                                    {/* Volume data display */}
                                    {keyword.searchVolume !== null && (
                                      <div className="mt-3 p-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-100/50 rounded-xl">
                                        {/* Volume header with expand toggle */}
                                        <button
                                          onClick={() => setIsVolumeExpanded(!isVolumeExpanded)}
                                          className="w-full flex items-center justify-between"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div>
                                              <div className="text-xs text-gray-500">Estimated monthly searches</div>
                                              <div className="text-lg font-bold text-gray-900">
                                                {formatVolume(keyword.searchVolume)}
                                              </div>
                                            </div>
                                            {keyword.competitionLevel && (
                                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCompetitionColor(keyword.competitionLevel)}`}>
                                                {keyword.competitionLevel}
                                              </span>
                                            )}
                                            {keyword.cpc && (
                                              <div className="text-xs text-gray-500">
                                                CPC: ${keyword.cpc.toFixed(2)}
                                              </div>
                                            )}
                                          </div>
                                          <Icon
                                            name={isVolumeExpanded ? "FaChevronUp" : "FaChevronDown"}
                                            className="w-4 h-4 text-gray-400"
                                          />
                                        </button>

                                        {/* Expanded section */}
                                        {isVolumeExpanded && (
                                          <div className="mt-3 pt-3 border-t border-blue-100/50">
                                            {/* Monthly trend chart */}
                                            {keyword.searchVolumeTrend?.monthlyData && keyword.searchVolumeTrend.monthlyData.length > 0 && (
                                              <div className="mb-4">
                                                <div className="text-xs font-medium text-gray-600 mb-2">Search trend (12 months)</div>
                                                <div className="flex items-end gap-0.5 h-16">
                                                  {keyword.searchVolumeTrend.monthlyData.slice(-12).map((m, i) => {
                                                    const maxVol = Math.max(...(keyword.searchVolumeTrend?.monthlyData || []).map(x => x.volume || 0));
                                                    const height = maxVol > 0 ? ((m.volume || 0) / maxVol) * 100 : 0;
                                                    return (
                                                      <div
                                                        key={i}
                                                        className="flex-1 bg-blue-300/60 hover:bg-blue-400/80 rounded-t transition-colors"
                                                        style={{ height: `${Math.max(height, 8)}%` }}
                                                        title={`${m.volume?.toLocaleString() || 0} searches`}
                                                      />
                                                    );
                                                  })}
                                                </div>
                                                <div className="flex gap-0.5 mt-1">
                                                  {keyword.searchVolumeTrend.monthlyData.slice(-12).map((m, i) => {
                                                    const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                                                    return (
                                                      <div key={i} className="flex-1 text-center text-[9px] text-gray-400">
                                                        {monthNames[(m.month || 1) - 1]}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            {/* Last updated */}
                                            {keyword.metricsUpdatedAt && (
                                              <div className="mt-3 pt-2 border-t border-blue-100/50 flex items-center justify-between">
                                                <span className="text-[10px] text-gray-400">
                                                  Updated {new Date(keyword.metricsUpdatedAt).toLocaleDateString()}
                                                </span>
                                                <button
                                                  onClick={handleVolumeLookup}
                                                  disabled={isLookingUpVolume}
                                                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                  <Icon name="FaRedo" className={`w-2.5 h-2.5 ${isLookingUpVolume ? 'animate-spin' : ''}`} />
                                                  Refresh
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Location Scope */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Location scope
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                  Geographic relevance for organizing and filtering.
                                </p>
                                {isEditing ? (
                                  <select
                                    value={editedLocationScope || ''}
                                    onChange={(e) => setEditedLocationScope((e.target.value || null) as LocationScope | null)}
                                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  >
                                    {LOCATION_SCOPES.map((scope) => (
                                      <option key={scope.value || 'null'} value={scope.value || ''}>
                                        {scope.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
                                    {keyword.locationScope ? (
                                      <span className="capitalize">{keyword.locationScope}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">Not set</span>
                                    )}
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
                                {/* Questions list (view/edit) - grouped by funnel stage */}
                                <div className="space-y-3 mb-3">
                                  {(() => {
                                    const questions = isEditing ? editedQuestions : keyword.relatedQuestions;
                                    if (!questions || questions.length === 0) {
                                      if (!isEditing) {
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
                                              {stageQuestions.map((q) => (
                                                <div key={q.originalIndex} className="flex items-start gap-2 p-2 bg-white/80 rounded-lg border border-gray-100">
                                                  {isEditing && (
                                                    <div className="relative group flex-shrink-0">
                                                      <select
                                                        value={q.funnelStage}
                                                        onChange={(e) => handleUpdateQuestionFunnel(q.originalIndex, e.target.value as FunnelStage)}
                                                        className={`px-1.5 py-0.5 text-xs rounded border-0 ${funnelColor.bg} ${funnelColor.text} cursor-pointer`}
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
                                                  {isEditing && (
                                                    <button
                                                      onClick={() => handleRemoveQuestion(q.originalIndex)}
                                                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
                                                      title="Remove question"
                                                    >
                                                      <Icon name="FaTimes" className="w-3 h-3" />
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      });
                                  })()}
                                </div>

                                {/* Add new question (edit mode) */}
                                {isEditing && !questionsAtLimit && (
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
                                {isEditing && questionsAtLimit && (
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
                              {isEditing ? (
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

                          {/* LLM Visibility Section */}
                          {keyword.relatedQuestions && keyword.relatedQuestions.length > 0 && (
                            <LLMVisibilitySection
                              keywordId={keyword.id}
                              questions={keyword.relatedQuestions}
                            />
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
