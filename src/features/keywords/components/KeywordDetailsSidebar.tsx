'use client';

import { useState, useEffect, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { type KeywordData, type LocationScope } from '../keywordUtils';
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
    aliases: string[];
    locationScope: string | null;
    relatedQuestions: string[];
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
  const [editedSearchQuery, setEditedSearchQuery] = useState(keyword?.searchQuery || '');
  const [editedAliasesInput, setEditedAliasesInput] = useState((keyword?.aliases || []).join(', '));
  const [editedLocationScope, setEditedLocationScope] = useState<LocationScope | null>(keyword?.locationScope || null);
  const [editedGroupId, setEditedGroupId] = useState<string | null>(keyword?.groupId || null);
  const [editedQuestionsInput, setEditedQuestionsInput] = useState((keyword?.relatedQuestions || []).join('\n'));

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
      setEditedSearchQuery(keyword.searchQuery || '');
      setEditedAliasesInput((keyword.aliases || []).join(', '));
      setEditedLocationScope(keyword.locationScope);
      setEditedGroupId(keyword.groupId);
      setEditedQuestionsInput((keyword.relatedQuestions || []).join('\n'));
      setIsEditing(false);
    }
  }, [keyword]);

  const handleSave = async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      const aliases = editedAliasesInput
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      const relatedQuestions = editedQuestionsInput
        .split('\n')
        .map(q => q.trim())
        .filter(Boolean)
        .slice(0, 20); // Max 20 questions

      await onUpdate(keyword.id, {
        reviewPhrase: editedReviewPhrase || '',
        searchQuery: editedSearchQuery || '',
        aliases,
        locationScope: editedLocationScope,
        relatedQuestions,
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
    setEditedSearchQuery(keyword.searchQuery || '');
    setEditedAliasesInput((keyword.aliases || []).join(', '));
    setEditedLocationScope(keyword.locationScope);
    setEditedGroupId(keyword.groupId);
    setEditedQuestionsInput((keyword.relatedQuestions || []).join('\n'));
    setIsEditing(false);
    setEnrichSuccess(false);
  };

  // Check if main SEO fields are empty (show AI button to help fill them)
  // Show button when review phrase, search query, or aliases are missing
  const hasEmptySEOFields = !keyword?.reviewPhrase ||
    !keyword?.searchQuery ||
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
          related_questions: string[];
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
        setEditedSearchQuery(response.enrichment.search_query || '');
        setEditedAliasesInput((response.enrichment.aliases || []).join(', '));
        setEditedLocationScope(response.enrichment.location_scope);
        setEditedQuestionsInput((response.enrichment.related_questions || []).join('\n'));

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
  const formatVolume = (vol: number | null) => {
    if (vol === null || vol === undefined) return '-';
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
                        <button
                          onClick={onClose}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                        >
                          <Icon name="FaTimes" className="w-5 h-5" />
                        </button>
                      </div>

                      {keyword && (
                        <div className="space-y-4">
                          {/* Suggested Phrase (AI-generated) */}
                          {keyword.reviewPhrase && (
                            <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-sm border border-indigo-100/50 rounded-xl">
                              <span className="text-xs font-medium uppercase tracking-wider text-indigo-600">Suggested Phrase</span>
                              <p className="text-sm text-gray-700 mt-2 italic leading-relaxed">
                                &ldquo;{keyword.reviewPhrase}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Stats grid */}
                          <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div>
                              <span className="text-gray-500 block text-xs">Word count</span>
                              <span className="font-medium">{keyword.wordCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Status</span>
                              <span className={`font-medium ${keyword.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                                {keyword.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Uses</span>
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
                                        const isAlreadySaved = keyword?.relatedQuestions?.includes(q.question);
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
                                                // Add to related questions
                                                const currentQuestions = keyword?.relatedQuestions || [];
                                                const newQuestions = [...currentQuestions, q.question];
                                                setEditedQuestionsInput(newQuestions.join('\n'));
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

                          {/* Editable fields section */}
                          <div className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-semibold text-gray-700">SEO & matching</span>
                              {!isEditing ? (
                                <div className="flex gap-2 items-center">
                                  {/* AI Generate button - show when fields are empty */}
                                  {hasEmptySEOFields && (
                                    <button
                                      onClick={handleAIEnrich}
                                      disabled={isEnriching}
                                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors disabled:opacity-50"
                                    >
                                      {isEnriching ? (
                                        <>
                                          <Icon name="FaSpinner" className="w-3.5 h-3.5 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Icon name="FaSparkles" className="w-3.5 h-3.5" />
                                          AI generate
                                          <span className="text-purple-400 font-normal">(1 credit)</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm text-slate-blue hover:text-slate-blue/80 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/50 transition-colors"
                                  >
                                    <Icon name="FaEdit" className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 items-center">
                                  <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white/50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-1.5 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    {isSaving && <Icon name="FaSpinner" className="w-3.5 h-3.5 animate-spin" />}
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* AI enrichment error */}
                            {enrichError && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                                {enrichError}
                              </div>
                            )}

                            {/* AI enrichment success message */}
                            {enrichSuccess && isEditing && (
                              <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700 flex items-center gap-2">
                                <Icon name="FaSparkles" className="w-4 h-4" />
                                Fields populated by AI - review and save
                              </div>
                            )}

                            <div className="space-y-5">
                              {/* Suggested Phrase (editable) */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Review phrase
                                </label>
                                <p className="text-sm text-gray-500 mb-2">
                                  The phrase customers see on prompt pages when asked to mention this keyword.
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

                              {/* Search Query */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Search query
                                </label>
                                <p className="text-sm text-gray-500 mb-2">
                                  The exact phrase searched on Google when tracking your ranking position.
                                </p>
                                {keyword.isUsedInRankTracking && (
                                  <div className="mb-2 px-3 py-2 bg-amber-50/80 border border-amber-200/50 rounded-lg text-sm text-amber-700">
                                    <Icon name="FaExclamationTriangle" className="w-3.5 h-3.5 inline mr-1.5" />
                                    Used in rank tracking. Create a new keyword to track a different term.
                                  </div>
                                )}
                                {isEditing && !keyword.isUsedInRankTracking ? (
                                  <input
                                    type="text"
                                    value={editedSearchQuery}
                                    onChange={(e) => setEditedSearchQuery(e.target.value)}
                                    placeholder="e.g., best green eggs ham San Diego"
                                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
                                    {keyword.searchQuery || <span className="text-gray-400 italic">Not set</span>}
                                  </div>
                                )}

                                {/* Search Volume Section */}
                                {!isEditing && keyword.searchQuery && (
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
                                              <div className="text-xs text-gray-500">Monthly searches</div>
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

                              {/* Aliases */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Aliases
                                </label>
                                <p className="text-sm text-gray-500 mb-2">
                                  Alternative spellings or phrases that should count as mentions of this keyword.
                                </p>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedAliasesInput}
                                    onChange={(e) => setEditedAliasesInput(e.target.value)}
                                    placeholder="e.g., plumbing services, plumbers"
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

                              {/* Location Scope */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Location scope
                                </label>
                                <p className="text-sm text-gray-500 mb-2">
                                  Geographic relevance of this keyword for organizing and filtering.
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
                                <p className="text-sm text-gray-500 mb-2">
                                  Questions people ask related to this keyword. Used for tracking &quot;People Also Ask&quot; and AI answer visibility.
                                </p>
                                {isEditing ? (
                                  <div>
                                    <textarea
                                      value={editedQuestionsInput}
                                      onChange={(e) => setEditedQuestionsInput(e.target.value)}
                                      placeholder="What is the best plumber in Portland?&#10;How much does a plumber cost?&#10;When should I call a plumber?"
                                      rows={4}
                                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all resize-none"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                      One question per line. Max 20 questions.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100 min-h-[42px]">
                                    {keyword.relatedQuestions && keyword.relatedQuestions.length > 0 ? (
                                      <ul className="space-y-2">
                                        {keyword.relatedQuestions.map((question, idx) => (
                                          <li key={idx} className="flex items-start gap-2 text-sm">
                                            <Icon name="FaQuestionCircle" className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                            <span>{question}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-gray-400 italic">No questions added</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Group (optional) */}
                              {showGroupSelector && groups.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700 block mb-1">
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
                            </div>
                          </div>

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
