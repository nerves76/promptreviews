'use client';

import { useState, useEffect, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { type KeywordData, type LocationScope } from '../keywordUtils';
import { LLMVisibilitySection } from '@/features/llm-visibility/components/LLMVisibilitySection';

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
}: KeywordDetailsSidebarProps) {
  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedReviewPhrase, setEditedReviewPhrase] = useState(keyword?.reviewPhrase || '');
  const [editedSearchQuery, setEditedSearchQuery] = useState(keyword?.searchQuery || '');
  const [editedAliasesInput, setEditedAliasesInput] = useState((keyword?.aliases || []).join(', '));
  const [editedLocationScope, setEditedLocationScope] = useState<LocationScope | null>(keyword?.locationScope || null);
  const [editedGroupId, setEditedGroupId] = useState<string | null>(keyword?.groupId || null);
  const [editedQuestionsInput, setEditedQuestionsInput] = useState((keyword?.relatedQuestions || []).join('\n'));

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
      setIsEditing(false);
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
  };

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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white/80 backdrop-blur-xl shadow-2xl">
                    <div className="p-6">
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
                          <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">SEO & Matching</span>
                              {!isEditing ? (
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="text-xs text-slate-blue hover:text-slate-blue/80 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
                                >
                                  <Icon name="FaEdit" className="w-3 h-3" />
                                  Edit
                                </button>
                              ) : (
                                <div className="flex gap-2 items-center">
                                  <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-3 py-1 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isSaving && <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />}
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              {/* Suggested Phrase (editable) */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                  Review Phrase (shown to customers)
                                </label>
                                <p className="text-xs text-gray-400 mb-2">
                                  The phrase customers see on prompt pages when asked to mention this keyword.
                                </p>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedReviewPhrase}
                                    onChange={(e) => setEditedReviewPhrase(e.target.value)}
                                    placeholder="e.g., best marketing consultant in Portland"
                                    className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg min-h-[36px]">
                                    {keyword.reviewPhrase || <span className="text-gray-400 italic">Not set</span>}
                                  </div>
                                )}
                              </div>

                              {/* Search Query */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                  Search Query (for rank tracking)
                                </label>
                                <p className="text-xs text-gray-400 mb-2">
                                  The exact phrase searched on Google when tracking your ranking position.
                                </p>
                                {keyword.isUsedInRankTracking && (
                                  <div className="mb-2 px-3 py-2 bg-amber-50/80 border border-amber-200/50 rounded-lg text-xs text-amber-700">
                                    <Icon name="FaExclamationTriangle" className="w-3 h-3 inline mr-1" />
                                    Used in rank tracking. Create a new keyword to track a different term.
                                  </div>
                                )}
                                {isEditing && !keyword.isUsedInRankTracking ? (
                                  <input
                                    type="text"
                                    value={editedSearchQuery}
                                    onChange={(e) => setEditedSearchQuery(e.target.value)}
                                    placeholder="e.g., best green eggs ham San Diego"
                                    className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg min-h-[36px]">
                                    {keyword.searchQuery || <span className="text-gray-400 italic">Not set</span>}
                                  </div>
                                )}
                              </div>

                              {/* Aliases */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                  Aliases (for finding mentions in reviews)
                                </label>
                                <p className="text-xs text-gray-400 mb-2">
                                  Alternative spellings or phrases that should count as mentions of this keyword.
                                </p>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedAliasesInput}
                                    onChange={(e) => setEditedAliasesInput(e.target.value)}
                                    placeholder="e.g., plumbing services, plumbers"
                                    className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg min-h-[36px]">
                                    {keyword.aliases && keyword.aliases.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {keyword.aliases.map((alias, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-indigo-50/80 border border-indigo-100/50 rounded text-xs text-indigo-700">
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
                                <label className="text-xs text-gray-500 block mb-1">
                                  Location Scope
                                </label>
                                <p className="text-xs text-gray-400 mb-2">
                                  Geographic relevance of this keyword for organizing and filtering.
                                </p>
                                {isEditing ? (
                                  <select
                                    value={editedLocationScope || ''}
                                    onChange={(e) => setEditedLocationScope((e.target.value || null) as LocationScope | null)}
                                    className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  >
                                    {LOCATION_SCOPES.map((scope) => (
                                      <option key={scope.value || 'null'} value={scope.value || ''}>
                                        {scope.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg">
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
                                <label className="text-xs text-gray-500 block mb-1">
                                  Related Questions (for PAA/LLM tracking)
                                </label>
                                <p className="text-xs text-gray-400 mb-2">
                                  Questions people ask related to this keyword. Used for tracking &quot;People Also Ask&quot; and AI answer visibility.
                                </p>
                                {isEditing ? (
                                  <div>
                                    <textarea
                                      value={editedQuestionsInput}
                                      onChange={(e) => setEditedQuestionsInput(e.target.value)}
                                      placeholder="What is the best plumber in Portland?&#10;How much does a plumber cost?&#10;When should I call a plumber?"
                                      rows={4}
                                      className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all resize-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                      One question per line. Max 20 questions.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg min-h-[36px]">
                                    {keyword.relatedQuestions && keyword.relatedQuestions.length > 0 ? (
                                      <ul className="space-y-1.5">
                                        {keyword.relatedQuestions.map((question, idx) => (
                                          <li key={idx} className="flex items-start gap-2 text-sm">
                                            <Icon name="FaQuestionCircle" className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
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
                                  <label className="text-xs text-gray-500 block mb-1">
                                    Group
                                  </label>
                                  {isEditing ? (
                                    <select
                                      value={editedGroupId || ''}
                                      onChange={(e) => setEditedGroupId(e.target.value || null)}
                                      className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                    >
                                      <option value="">No group</option>
                                      {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                          {group.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg">
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
