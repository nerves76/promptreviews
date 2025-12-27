'use client';

import { useState, useEffect, Fragment, useCallback } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Icon from '@/components/Icon';
import {
  type KeywordData,
  type RelatedQuestion,
  type FunnelStage,
  buildQuestionLLMMap,
  checkSearchTermRelevance,
} from '../keywordUtils';
import { useRelatedQuestions } from '../hooks/useRelatedQuestions';
import { useAIEnrichment } from '../hooks/useAIEnrichment';
import { useVolumeData } from '../hooks/useVolumeData';
import { useRankStatus, getDiscoveredQuestions } from '../hooks/useRankStatus';
import { useLLMVisibility } from '@/features/llm-visibility/hooks/useLLMVisibility';
import { LLMProvider } from '@/features/llm-visibility/utils/types';
import { useAuth } from '@/auth';
import {
  HeaderStats,
  RankTrackingSection,
  DiscoveredQuestionsSection,
  ReviewsEditSection,
  SEOTrackingSection,
  TrackingLocationsSection,
  PromptPagesSection,
  RecentReviewsSection,
  type LLMProvider as SidebarLLMProvider,
} from './sidebar';

export interface KeywordDetailsSidebarProps {
  isOpen: boolean;
  keyword: KeywordData | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<KeywordData>) => Promise<KeywordData | null>;
  promptPages?: Array<{ id: string; name?: string | null; slug?: string }>;
  recentReviews?: Array<{ id: string; reviewerName: string; content?: string | null }>;
  groups?: Array<{ id: string; name: string }>;
  showGroupSelector?: boolean;
  onRefresh?: () => Promise<void>;
  onCheckRank?: (keyword: string, conceptId: string) => void;
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
  onCheckRank,
}: KeywordDetailsSidebarProps) {
  const { account } = useAuth();

  // === HOOKS ===

  // Rank status
  const {
    rankStatus,
    isLoading: rankStatusLoading,
  } = useRankStatus({
    keywordId: keyword?.id || null,
    isUsedInRankTracking: keyword?.isUsedInRankTracking || false,
    isOpen,
  });

  // Volume data
  const {
    termVolumeData,
    checkTermVolume,
    checkingTerm: checkingTermVolume,
    isLoading: isLoadingTermVolume,
  } = useVolumeData({
    keywordId: keyword?.id || null,
    isOpen,
    defaultLocationCode: keyword?.searchVolumeLocationCode,
    defaultLocationName: keyword?.searchVolumeLocationName,
  });

  // AI enrichment
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

  // Related questions
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

  // LLM visibility
  const [selectedLLMProviders, setSelectedLLMProviders] = useState<LLMProvider[]>(['chatgpt', 'claude']);
  const [checkingQuestionIndex, setCheckingQuestionIndex] = useState<number | null>(null);
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);
  const [lastCheckResult, setLastCheckResult] = useState<{ success: boolean; message: string; questionIndex: number } | null>(null);
  const {
    results: llmResults,
    error: llmError,
    fetchResults: fetchLLMResults,
    runCheck: runLLMCheck,
  } = useLLMVisibility({ keywordId: keyword?.id || '' });

  // === EDITING STATE ===
  const [isEditingReviews, setIsEditingReviews] = useState(false);
  const [isEditingSEO, setIsEditingSEO] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedReviewPhrase, setEditedReviewPhrase] = useState(keyword?.reviewPhrase || '');
  const [editedSearchTerms, setEditedSearchTerms] = useState(keyword?.searchTerms || []);
  const [editedAliasesInput, setEditedAliasesInput] = useState((keyword?.aliases || []).join(', '));
  const [editedLocationScope, setEditedLocationScope] = useState(keyword?.locationScope || null);
  const [editedGroupId, setEditedGroupId] = useState<string | null>(keyword?.groupId || null);
  const [newSearchTerm, setNewSearchTerm] = useState('');
  const [relevanceWarning, setRelevanceWarning] = useState<{
    term: string;
    sharedRoots: string[];
    missingRoots: string[];
  } | null>(null);
  const [volumeLookupError, setVolumeLookupError] = useState<string | null>(null);
  const [isLookingUpVolume, setIsLookingUpVolume] = useState(false);

  const isAnyEditing = isEditingReviews || isEditingSEO;
  const questionLLMMap = buildQuestionLLMMap(llmResults);

  // === EFFECTS ===

  // Fetch LLM results when sidebar opens
  useEffect(() => {
    if (keyword?.id && isOpen && keyword.relatedQuestions && keyword.relatedQuestions.length > 0) {
      fetchLLMResults();
    }
  }, [keyword?.id, isOpen, fetchLLMResults, keyword?.relatedQuestions]);

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
      resetEnrichment();
    }
  }, [keyword, resetQuestions, resetEnrichment]);

  // === HANDLERS ===

  const handleSaveReviews = async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      const aliases = editedAliasesInput.split(',').map(a => a.trim()).filter(Boolean);
      await onUpdate(keyword.id, { reviewPhrase: editedReviewPhrase || '', aliases });
      if (onRefresh) await onRefresh();
      setIsEditingReviews(false);
      resetEnrichment();
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
        relatedQuestions: editedQuestions.slice(0, 20),
        ...(showGroupSelector && { groupId: editedGroupId || undefined }),
      });
      if (onRefresh) await onRefresh();
      setIsEditingSEO(false);
      resetEnrichment();
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
    resetEnrichment();
  };

  const handleCancelSEO = () => {
    if (!keyword) return;
    setEditedSearchTerms(keyword.searchTerms || []);
    setEditedLocationScope(keyword.locationScope);
    setEditedGroupId(keyword.groupId);
    resetQuestions(keyword.relatedQuestions || []);
    setIsEditingSEO(false);
    resetEnrichment();
    setNewSearchTerm('');
    setRelevanceWarning(null);
  };

  const handleAddQuestion = () => {
    if (addQuestion()) setIsEditingSEO(true);
  };

  const handleRemoveQuestion = (index: number) => {
    removeQuestion(index);
    setIsEditingSEO(true);
  };

  const handleUpdateQuestionFunnel = (index: number, newStage: FunnelStage) => {
    updateQuestionFunnel(index, newStage);
    setIsEditingSEO(true);
  };

  const handleAddSearchTerm = useCallback((forceAdd = false) => {
    if (!keyword || !newSearchTerm.trim()) return;
    if (editedSearchTerms.length >= 10) return;

    const termToAdd = newSearchTerm.trim();
    if (editedSearchTerms.some(t => t.term.toLowerCase() === termToAdd.toLowerCase())) return;

    if (!forceAdd) {
      const relevance = checkSearchTermRelevance(keyword.phrase, termToAdd);
      if (!relevance.isRelevant) {
        setRelevanceWarning({ term: termToAdd, sharedRoots: relevance.sharedRoots, missingRoots: relevance.missingRoots });
        return;
      }
    }

    setEditedSearchTerms([...editedSearchTerms, {
      term: termToAdd,
      isCanonical: editedSearchTerms.length === 0,
      addedAt: new Date().toISOString(),
    }]);
    setNewSearchTerm('');
    setRelevanceWarning(null);
    setIsEditingSEO(true);
  }, [keyword, newSearchTerm, editedSearchTerms]);

  const handleRemoveSearchTerm = (termToRemove: string) => {
    const remaining = editedSearchTerms.filter(t => t.term !== termToRemove);
    if (remaining.length > 0 && !remaining.some(t => t.isCanonical)) {
      remaining[0].isCanonical = true;
    }
    setEditedSearchTerms(remaining);
    setIsEditingSEO(true);
  };

  const handleSetCanonical = (term: string) => {
    setEditedSearchTerms(editedSearchTerms.map(t => ({ ...t, isCanonical: t.term === term })));
    setIsEditingSEO(true);
  };

  const handleCheckQuestion = async (questionIndex: number) => {
    if (!keyword?.id || selectedLLMProviders.length === 0) return;
    setCheckingQuestionIndex(questionIndex);
    setLastCheckResult(null);
    try {
      const response = await runLLMCheck(selectedLLMProviders, [questionIndex]);
      if (response && response.checksPerformed > 0) {
        setLastCheckResult({
          success: true,
          message: `Check complete for ${selectedLLMProviders.length} AI${selectedLLMProviders.length > 1 ? 's' : ''}. See results below.`,
          questionIndex,
        });
        setExpandedQuestionIndex(questionIndex);
      } else {
        setLastCheckResult({ success: false, message: llmError || 'Check failed', questionIndex });
      }
    } catch (err) {
      setLastCheckResult({ success: false, message: err instanceof Error ? err.message : 'Check failed', questionIndex });
    } finally {
      setCheckingQuestionIndex(null);
      setTimeout(() => setLastCheckResult(null), 5000);
    }
  };

  const handleCheckTermVolume = async (term: string) => {
    try {
      await checkTermVolume(term, keyword?.searchVolumeLocationCode, keyword?.searchVolumeLocationName);
    } catch (err) {
      console.error('Failed to check term volume:', err);
    }
  };

  const handleAIEnrich = async () => {
    const result = await enrich();
    if (result) {
      setEditedReviewPhrase(result.reviewPhrase || '');
      if (result.searchTerms?.length) {
        setEditedSearchTerms(result.searchTerms);
      }
      setEditedAliasesInput((result.aliases || []).join(', '));
      setEditedLocationScope(result.locationScope);
      setEditedQuestions(result.relatedQuestions || []);
      setIsEditingReviews(true);
      setIsEditingSEO(true);
    }
  };

  const handleAddDiscoveredQuestion = (question: string, funnelStage: FunnelStage) => {
    if (!keyword) return;
    const newQuestion: RelatedQuestion = {
      question,
      funnelStage,
      addedAt: new Date().toISOString(),
    };
    const newQuestions = [...(keyword.relatedQuestions || []), newQuestion];
    setEditedQuestions(newQuestions);
    onUpdate(keyword.id, { relatedQuestions: newQuestions });
  };

  const handleToggleLLMProvider = (provider: SidebarLLMProvider) => {
    setSelectedLLMProviders(prev => {
      if (prev.includes(provider as LLMProvider)) {
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== provider);
      }
      return [...prev, provider as LLMProvider];
    });
  };

  // === COMPUTED VALUES ===
  const hasEmptySEOFields = !keyword?.reviewPhrase ||
    !keyword?.searchTerms?.length ||
    !keyword?.aliases?.length;

  const terms = Array.from(termVolumeData.values());
  const totalVolume = terms.reduce((sum, t) => sum + (t.searchVolume || 0), 0);
  const allLowVolume = terms.length > 0 && terms.every(t => (t.searchVolume || 0) < 10);

  // === RENDER ===
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                      {/* Close button */}
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={onClose}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Close sidebar"
                        >
                          <Icon name="FaTimes" className="w-5 h-5" />
                        </button>
                      </div>

                      {keyword && (
                        <div className="space-y-4">
                          {/* Header + Stats */}
                          <HeaderStats
                            keyword={keyword}
                            promptPagesCount={promptPages.length}
                            totalVolume={totalVolume}
                            allLowVolume={allLowVolume}
                            termVolumeDataSize={termVolumeData.size}
                            isAnyEditing={isAnyEditing}
                            isSaving={isSaving}
                            onSave={async () => {
                              if (isEditingReviews) await handleSaveReviews();
                              if (isEditingSEO) await handleSaveSEO();
                            }}
                          />

                          {/* Rank Tracking Status */}
                          {keyword.isUsedInRankTracking && (
                            <RankTrackingSection
                              rankStatus={rankStatus}
                              isLoading={rankStatusLoading}
                            />
                          )}

                          {/* Discovered Questions from Google */}
                          <DiscoveredQuestionsSection
                            rankStatus={rankStatus}
                            currentQuestionsCount={keyword.relatedQuestions?.length || 0}
                            maxQuestions={20}
                            onAddQuestion={handleAddDiscoveredQuestion}
                            existingQuestions={keyword.relatedQuestions}
                          />

                          {/* AI Generate button */}
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
                                  Auto-fill with AI
                                </>
                              )}
                            </button>
                          )}

                          {/* AI enrichment messages */}
                          {enrichError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
                              <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                              {enrichError}
                            </div>
                          )}
                          {enrichSuccess && isAnyEditing && (
                            <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700 flex items-center gap-2">
                              <Icon name="prompty" className="w-4 h-4" />
                              Fields populated by AI - review and save
                            </div>
                          )}

                          {/* Reviews Section */}
                          <ReviewsEditSection
                            keyword={keyword}
                            isEditing={isEditingReviews}
                            isSaving={isSaving}
                            editedReviewPhrase={editedReviewPhrase}
                            onReviewPhraseChange={setEditedReviewPhrase}
                            editedAliasesInput={editedAliasesInput}
                            onAliasesChange={setEditedAliasesInput}
                            onStartEditing={() => setIsEditingReviews(true)}
                            onSave={handleSaveReviews}
                            onCancel={handleCancelReviews}
                          />

                          {/* SEO & LLM Tracking Section */}
                          <SEOTrackingSection
                            keyword={keyword}
                            isEditing={isEditingSEO}
                            isSaving={isSaving}
                            onStartEditing={() => setIsEditingSEO(true)}
                            onSave={handleSaveSEO}
                            onCancel={handleCancelSEO}
                            editedSearchTerms={editedSearchTerms}
                            newSearchTerm={newSearchTerm}
                            onNewSearchTermChange={setNewSearchTerm}
                            onAddSearchTerm={handleAddSearchTerm}
                            onRemoveSearchTerm={handleRemoveSearchTerm}
                            onSetCanonical={handleSetCanonical}
                            relevanceWarning={relevanceWarning}
                            onAddAnyway={() => handleAddSearchTerm(true)}
                            onDismissRelevanceWarning={() => setRelevanceWarning(null)}
                            termVolumeData={termVolumeData}
                            checkingTermVolume={checkingTermVolume}
                            isLookingUpVolume={isLookingUpVolume}
                            onCheckTermVolume={handleCheckTermVolume}
                            volumeLookupError={volumeLookupError}
                            rankStatus={rankStatus}
                            onCheckRank={onCheckRank}
                            editedQuestions={editedQuestions}
                            newQuestionText={newQuestionText}
                            onNewQuestionTextChange={setNewQuestionText}
                            newQuestionFunnel={newQuestionFunnel}
                            onNewQuestionFunnelChange={setNewQuestionFunnel}
                            onAddQuestion={handleAddQuestion}
                            onRemoveQuestion={handleRemoveQuestion}
                            onUpdateQuestionFunnel={handleUpdateQuestionFunnel}
                            selectedLLMProviders={selectedLLMProviders as SidebarLLMProvider[]}
                            onToggleLLMProvider={handleToggleLLMProvider}
                            questionLLMMap={questionLLMMap}
                            checkingQuestionIndex={checkingQuestionIndex}
                            onCheckQuestion={handleCheckQuestion}
                            lastCheckResult={lastCheckResult}
                            llmError={llmError}
                            expandedQuestionIndex={expandedQuestionIndex}
                            onToggleQuestionExpand={setExpandedQuestionIndex}
                          />

                          {/* Tracking Locations */}
                          {keyword.isUsedInRankTracking && (
                            <TrackingLocationsSection rankStatus={rankStatus} />
                          )}

                          {/* Group selector */}
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
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
                                  {keyword.groupName || <span className="text-gray-400 italic">No group</span>}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Prompt Pages */}
                          <PromptPagesSection
                            promptPages={promptPages.map(p => ({
                              id: p.id,
                              name: p.name || null,
                              slug: p.slug || '',
                            }))}
                          />

                          {/* Recent Reviews */}
                          <RecentReviewsSection
                            recentReviews={recentReviews.map(r => ({
                              id: r.id,
                              reviewerName: r.reviewerName,
                              content: r.content || null,
                            }))}
                          />

                          {/* Bottom save button */}
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
