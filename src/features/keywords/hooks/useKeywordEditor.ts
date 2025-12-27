'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type KeywordData,
  type SearchTerm,
  type RelatedQuestion,
  type LocationScope,
  type FunnelStage,
  type RelevanceCheckResult,
  checkSearchTermRelevance,
  MAX_SEARCH_TERMS,
} from '../keywordUtils';
import { useRelatedQuestions } from './useRelatedQuestions';

/**
 * Relevance warning when adding a search term that doesn't match the concept
 */
export interface RelevanceWarning {
  term: string;
  sharedRoots: string[];
  missingRoots: string[];
}

/**
 * Options for the useKeywordEditor hook
 */
export interface UseKeywordEditorOptions {
  /** The keyword being edited */
  keyword: KeywordData | null;
  /** Callback to save updates to the server */
  onUpdate: (id: string, updates: Partial<KeywordData>) => Promise<KeywordData | null>;
  /** Optional callback after successful save */
  onRefresh?: () => Promise<void>;
  /** Whether to show the group selector */
  showGroupSelector?: boolean;
}

/**
 * Return type for the useKeywordEditor hook
 */
export interface UseKeywordEditorReturn {
  // Edit state
  /** Whether reviews section is being edited */
  isEditingReviews: boolean;
  /** Whether SEO section is being edited */
  isEditingSEO: boolean;
  /** Whether any section is being edited */
  isAnyEditing: boolean;
  /** Whether a save is in progress */
  isSaving: boolean;

  // Edited values - Reviews section
  editedReviewPhrase: string;
  setEditedReviewPhrase: (value: string) => void;
  editedAliasesInput: string;
  setEditedAliasesInput: (value: string) => void;

  // Edited values - SEO section
  editedSearchTerms: SearchTerm[];
  setEditedSearchTerms: (terms: SearchTerm[]) => void;
  editedLocationScope: LocationScope | null;
  setEditedLocationScope: (scope: LocationScope | null) => void;
  editedGroupId: string | null;
  setEditedGroupId: (id: string | null) => void;

  // Questions management (from useRelatedQuestions)
  editedQuestions: RelatedQuestion[];
  setEditedQuestions: (questions: RelatedQuestion[]) => void;
  newQuestionText: string;
  setNewQuestionText: (text: string) => void;
  newQuestionFunnel: FunnelStage;
  setNewQuestionFunnel: (stage: FunnelStage) => void;
  addQuestion: () => boolean;
  removeQuestion: (index: number) => void;
  updateQuestionFunnel: (index: number, stage: FunnelStage) => void;
  questionsAtLimit: boolean;

  // Search term management
  newSearchTerm: string;
  setNewSearchTerm: (term: string) => void;
  searchTermsAtLimit: boolean;
  relevanceWarning: RelevanceWarning | null;
  /**
   * Add a new search term
   * @param forceAdd - If true, bypass relevance checking
   * @returns RelevanceCheckResult if the term was not relevant, null if added
   */
  handleAddSearchTerm: (forceAdd?: boolean) => RelevanceCheckResult | null;
  handleRemoveSearchTerm: (term: string) => void;
  handleSetCanonical: (term: string) => void;
  dismissRelevanceWarning: () => void;
  addSearchTermAnyway: () => void;

  // Section actions
  startEditingReviews: () => void;
  startEditingSEO: () => void;
  saveReviews: () => Promise<void>;
  saveSEO: () => Promise<void>;
  cancelReviews: () => void;
  cancelSEO: () => void;
  saveAll: () => Promise<void>;

  // State management
  /** Reset all edited fields to match the current keyword */
  reset: () => void;
  /** Set edit success state (for AI enrichment feedback) */
  setEnrichSuccess: (success: boolean) => void;
  enrichSuccess: boolean;

  // Computed values
  hasEmptySEOFields: boolean;
}

/**
 * Hook for managing keyword editing state
 *
 * Centralizes all editing logic for KeywordDetailsSidebar and ConceptCard:
 * - Section-based editing (reviews, SEO)
 * - Edited field state management
 * - Save/cancel handlers with optimistic updates
 * - Search term management with relevance checking
 * - Questions management
 *
 * @example
 * ```tsx
 * const editor = useKeywordEditor({
 *   keyword,
 *   onUpdate,
 *   onRefresh,
 * });
 *
 * // Start editing
 * editor.startEditingReviews();
 *
 * // Modify fields
 * editor.setEditedReviewPhrase('New phrase');
 *
 * // Save changes
 * await editor.saveReviews();
 * ```
 */
export function useKeywordEditor({
  keyword,
  onUpdate,
  onRefresh,
  showGroupSelector = false,
}: UseKeywordEditorOptions): UseKeywordEditorReturn {
  // Edit state
  const [isEditingReviews, setIsEditingReviews] = useState(false);
  const [isEditingSEO, setIsEditingSEO] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reviews section fields
  const [editedReviewPhrase, setEditedReviewPhrase] = useState(keyword?.reviewPhrase || '');
  const [editedAliasesInput, setEditedAliasesInput] = useState(
    (keyword?.aliases || []).join(', ')
  );

  // SEO section fields
  const [editedSearchTerms, setEditedSearchTerms] = useState<SearchTerm[]>(
    keyword?.searchTerms || []
  );
  const [editedLocationScope, setEditedLocationScope] = useState<LocationScope | null>(
    keyword?.locationScope || null
  );
  const [editedGroupId, setEditedGroupId] = useState<string | null>(keyword?.groupId || null);

  // Search term addition state
  const [newSearchTerm, setNewSearchTerm] = useState('');
  const [relevanceWarning, setRelevanceWarning] = useState<RelevanceWarning | null>(null);

  // AI enrichment success feedback
  const [enrichSuccess, setEnrichSuccess] = useState(false);

  // Questions management via useRelatedQuestions
  const {
    questions: editedQuestions,
    setQuestions: setEditedQuestions,
    newQuestionText,
    setNewQuestionText,
    newQuestionFunnel,
    setNewQuestionFunnel,
    addQuestion: addQuestionInternal,
    removeQuestion: removeQuestionInternal,
    updateQuestionFunnel: updateQuestionFunnelInternal,
    isAtLimit: questionsAtLimit,
    reset: resetQuestions,
  } = useRelatedQuestions({
    initialQuestions: keyword?.relatedQuestions || [],
    maxQuestions: 20,
  });

  // Reset when keyword changes
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
      setEnrichSuccess(false);
    }
  }, [keyword, resetQuestions]);

  // Computed values
  const isAnyEditing = isEditingReviews || isEditingSEO;
  const searchTermsAtLimit = editedSearchTerms.length >= MAX_SEARCH_TERMS;

  const hasEmptySEOFields = useMemo(() => {
    if (!keyword) return true;
    return (
      !keyword.reviewPhrase ||
      !keyword.searchTerms ||
      keyword.searchTerms.length === 0 ||
      !keyword.aliases ||
      keyword.aliases.length === 0
    );
  }, [keyword]);

  // Start editing handlers
  const startEditingReviews = useCallback(() => {
    setIsEditingReviews(true);
  }, []);

  const startEditingSEO = useCallback(() => {
    setIsEditingSEO(true);
  }, []);

  // Save handlers
  const saveReviews = useCallback(async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      const aliases = editedAliasesInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await onUpdate(keyword.id, {
        reviewPhrase: editedReviewPhrase || '',
        aliases,
      });

      if (onRefresh) {
        await onRefresh();
      }

      setIsEditingReviews(false);
      setEnrichSuccess(false);
    } catch (error) {
      console.error('Failed to save keyword:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [keyword, editedReviewPhrase, editedAliasesInput, onUpdate, onRefresh]);

  const saveSEO = useCallback(async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      await onUpdate(keyword.id, {
        searchTerms: editedSearchTerms,
        locationScope: editedLocationScope,
        relatedQuestions: editedQuestions.slice(0, 20),
        ...(showGroupSelector && { groupId: editedGroupId || undefined }),
      });

      if (onRefresh) {
        await onRefresh();
      }

      setIsEditingSEO(false);
      setEnrichSuccess(false);
    } catch (error) {
      console.error('Failed to save keyword:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
    keyword,
    editedSearchTerms,
    editedLocationScope,
    editedQuestions,
    editedGroupId,
    showGroupSelector,
    onUpdate,
    onRefresh,
  ]);

  const saveAll = useCallback(async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      const aliases = editedAliasesInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await onUpdate(keyword.id, {
        reviewPhrase: editedReviewPhrase || '',
        aliases,
        searchTerms: editedSearchTerms,
        locationScope: editedLocationScope,
        relatedQuestions: editedQuestions.slice(0, 20),
        ...(showGroupSelector && { groupId: editedGroupId || undefined }),
      });

      if (onRefresh) {
        await onRefresh();
      }

      setIsEditingReviews(false);
      setIsEditingSEO(false);
      setEnrichSuccess(false);
    } catch (error) {
      console.error('Failed to save keyword:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
    keyword,
    editedReviewPhrase,
    editedAliasesInput,
    editedSearchTerms,
    editedLocationScope,
    editedQuestions,
    editedGroupId,
    showGroupSelector,
    onUpdate,
    onRefresh,
  ]);

  // Cancel handlers
  const cancelReviews = useCallback(() => {
    if (!keyword) return;
    setEditedReviewPhrase(keyword.reviewPhrase || '');
    setEditedAliasesInput((keyword.aliases || []).join(', '));
    setIsEditingReviews(false);
    setEnrichSuccess(false);
  }, [keyword]);

  const cancelSEO = useCallback(() => {
    if (!keyword) return;
    setEditedSearchTerms(keyword.searchTerms || []);
    setEditedLocationScope(keyword.locationScope);
    setEditedGroupId(keyword.groupId);
    resetQuestions(keyword.relatedQuestions || []);
    setIsEditingSEO(false);
    setEnrichSuccess(false);
    setNewSearchTerm('');
    setRelevanceWarning(null);
  }, [keyword, resetQuestions]);

  // Question management wrappers that trigger edit mode
  const addQuestion = useCallback(() => {
    const added = addQuestionInternal();
    if (added) {
      setIsEditingSEO(true);
    }
    return added;
  }, [addQuestionInternal]);

  const removeQuestion = useCallback(
    (index: number) => {
      removeQuestionInternal(index);
      setIsEditingSEO(true);
    },
    [removeQuestionInternal]
  );

  const updateQuestionFunnel = useCallback(
    (index: number, stage: FunnelStage) => {
      updateQuestionFunnelInternal(index, stage);
      setIsEditingSEO(true);
    },
    [updateQuestionFunnelInternal]
  );

  // Search term management
  const handleAddSearchTerm = useCallback(
    (forceAdd = false): RelevanceCheckResult | null => {
      if (!keyword || !newSearchTerm.trim()) return null;

      if (editedSearchTerms.length >= MAX_SEARCH_TERMS) {
        return null;
      }

      const termToAdd = newSearchTerm.trim();

      // Check for duplicates
      if (editedSearchTerms.some((t) => t.term.toLowerCase() === termToAdd.toLowerCase())) {
        return null;
      }

      // Check relevance against concept name
      if (!forceAdd) {
        const relevance = checkSearchTermRelevance(keyword.phrase, termToAdd);
        if (!relevance.isRelevant) {
          setRelevanceWarning({
            term: termToAdd,
            sharedRoots: relevance.sharedRoots,
            missingRoots: relevance.missingRoots,
          });
          return relevance;
        }
      }

      // Add the term
      const newTerm: SearchTerm = {
        term: termToAdd,
        isCanonical: editedSearchTerms.length === 0,
        addedAt: new Date().toISOString(),
      };

      setEditedSearchTerms([...editedSearchTerms, newTerm]);
      setNewSearchTerm('');
      setRelevanceWarning(null);
      setIsEditingSEO(true);

      return null;
    },
    [keyword, newSearchTerm, editedSearchTerms]
  );

  const handleRemoveSearchTerm = useCallback(
    (termToRemove: string) => {
      const remaining = editedSearchTerms.filter((t) => t.term !== termToRemove);
      // If removed the canonical term, make first remaining canonical
      if (remaining.length > 0 && !remaining.some((t) => t.isCanonical)) {
        remaining[0].isCanonical = true;
      }
      setEditedSearchTerms(remaining);
      setIsEditingSEO(true);
    },
    [editedSearchTerms]
  );

  const handleSetCanonical = useCallback(
    (term: string) => {
      setEditedSearchTerms(
        editedSearchTerms.map((t) => ({
          ...t,
          isCanonical: t.term === term,
        }))
      );
      setIsEditingSEO(true);
    },
    [editedSearchTerms]
  );

  const dismissRelevanceWarning = useCallback(() => {
    setRelevanceWarning(null);
  }, []);

  const addSearchTermAnyway = useCallback(() => {
    handleAddSearchTerm(true);
  }, [handleAddSearchTerm]);

  // Full reset
  const reset = useCallback(() => {
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
      setEnrichSuccess(false);
    }
  }, [keyword, resetQuestions]);

  return {
    // Edit state
    isEditingReviews,
    isEditingSEO,
    isAnyEditing,
    isSaving,

    // Reviews fields
    editedReviewPhrase,
    setEditedReviewPhrase,
    editedAliasesInput,
    setEditedAliasesInput,

    // SEO fields
    editedSearchTerms,
    setEditedSearchTerms,
    editedLocationScope,
    setEditedLocationScope,
    editedGroupId,
    setEditedGroupId,

    // Questions
    editedQuestions,
    setEditedQuestions,
    newQuestionText,
    setNewQuestionText,
    newQuestionFunnel,
    setNewQuestionFunnel,
    addQuestion,
    removeQuestion,
    updateQuestionFunnel,
    questionsAtLimit,

    // Search terms
    newSearchTerm,
    setNewSearchTerm,
    searchTermsAtLimit,
    relevanceWarning,
    handleAddSearchTerm,
    handleRemoveSearchTerm,
    handleSetCanonical,
    dismissRelevanceWarning,
    addSearchTermAnyway,

    // Section actions
    startEditingReviews,
    startEditingSEO,
    saveReviews,
    saveSEO,
    cancelReviews,
    cancelSEO,
    saveAll,

    // State management
    reset,
    setEnrichSuccess,
    enrichSuccess,

    // Computed
    hasEmptySEOFields,
  };
}
