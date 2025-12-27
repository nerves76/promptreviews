'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import {
  type KeywordData,
  type SearchTerm,
  type RelatedQuestion,
  type LocationScope,
} from '../keywordUtils';

/**
 * Response from the AI enrichment API
 */
interface AIEnrichmentResponse {
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
}

/**
 * Processed enrichment result with properly formatted types
 */
export interface EnrichmentResult {
  reviewPhrase: string;
  searchTerms: SearchTerm[];
  aliases: string[];
  locationScope: LocationScope | null;
  relatedQuestions: RelatedQuestion[];
  creditsUsed: number;
  creditsRemaining: number;
}

/**
 * Options for the useAIEnrichment hook
 */
export interface UseAIEnrichmentOptions {
  /** The keyword to enrich */
  keyword: KeywordData | null;
  /** Business name for context */
  businessName?: string | null;
  /** Business city for geographic context */
  businessCity?: string | null;
  /** Business state for geographic context */
  businessState?: string | null;
}

/**
 * Return type for the useAIEnrichment hook
 */
export interface UseAIEnrichmentReturn {
  /** Whether enrichment is currently in progress */
  isEnriching: boolean;
  /** Error message if enrichment failed */
  enrichError: string | null;
  /** Whether the last enrichment was successful */
  enrichSuccess: boolean;
  /**
   * Trigger AI enrichment for the keyword
   * @returns The enrichment result or null if failed
   */
  enrich: () => Promise<EnrichmentResult | null>;
  /** Reset the success/error state */
  reset: () => void;
}

/**
 * Hook for AI-powered keyword enrichment
 *
 * Provides AI-generated suggestions for:
 * - Review phrase (how the keyword appears in reviews)
 * - Search terms (for SERP tracking)
 * - Aliases (alternative spellings)
 * - Related questions (for LLM visibility tracking)
 *
 * @example
 * ```tsx
 * const { enrich, isEnriching, enrichError } = useAIEnrichment({
 *   keyword,
 *   businessName: account?.business_name,
 *   businessCity: business?.address_city,
 *   businessState: business?.address_state,
 * });
 *
 * const handleEnrich = async () => {
 *   const result = await enrich();
 *   if (result) {
 *     setEditedReviewPhrase(result.reviewPhrase);
 *     setEditedSearchTerms(result.searchTerms);
 *     // ... apply other fields
 *   }
 * };
 * ```
 */
export function useAIEnrichment({
  keyword,
  businessName,
  businessCity,
  businessState,
}: UseAIEnrichmentOptions): UseAIEnrichmentReturn {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [enrichSuccess, setEnrichSuccess] = useState(false);

  const enrich = useCallback(async (): Promise<EnrichmentResult | null> => {
    if (!keyword) {
      setEnrichError('No keyword provided');
      return null;
    }

    setIsEnriching(true);
    setEnrichError(null);
    setEnrichSuccess(false);

    try {
      const response = await apiClient.post<AIEnrichmentResponse>('/ai/enrich-keyword', {
        phrase: keyword.phrase,
        businessName: businessName || undefined,
        businessCity: businessCity || undefined,
        businessState: businessState || undefined,
      });

      if (response.success && response.enrichment) {
        // Convert search_terms array to SearchTerm format (first one is canonical)
        const now = new Date().toISOString();
        const searchTerms: SearchTerm[] = (response.enrichment.search_terms || []).map(
          (term, index) => ({
            term,
            isCanonical: index === 0,
            addedAt: now,
          })
        );

        const result: EnrichmentResult = {
          reviewPhrase: response.enrichment.review_phrase || '',
          searchTerms,
          aliases: response.enrichment.aliases || [],
          locationScope: response.enrichment.location_scope,
          relatedQuestions: response.enrichment.related_questions || [],
          creditsUsed: response.creditsUsed,
          creditsRemaining: response.creditsRemaining,
        };

        setEnrichSuccess(true);
        return result;
      }

      setEnrichError('Enrichment returned no data');
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate SEO data';
      setEnrichError(message);
      return null;
    } finally {
      setIsEnriching(false);
    }
  }, [keyword, businessName, businessCity, businessState]);

  const reset = useCallback(() => {
    setEnrichError(null);
    setEnrichSuccess(false);
  }, []);

  return {
    isEnriching,
    enrichError,
    enrichSuccess,
    enrich,
    reset,
  };
}

/**
 * Helper function to apply enrichment result to edited fields
 * with support for "fill empty only" mode
 *
 * @param result - The enrichment result from the API
 * @param keyword - The current keyword data
 * @param fillEmptyOnly - If true, only fills fields that are currently empty
 * @returns Object with the values to apply to edited state
 */
export function applyEnrichmentResult(
  result: EnrichmentResult,
  keyword: KeywordData | null,
  fillEmptyOnly: boolean = false
): {
  reviewPhrase: string;
  searchTerms: SearchTerm[];
  aliases: string[];
  relatedQuestions: RelatedQuestion[];
} {
  if (!fillEmptyOnly) {
    // Replace all fields
    return {
      reviewPhrase: result.reviewPhrase,
      searchTerms: result.searchTerms,
      aliases: result.aliases,
      relatedQuestions: result.relatedQuestions,
    };
  }

  // Fill empty only mode
  return {
    reviewPhrase: keyword?.reviewPhrase?.trim()
      ? keyword.reviewPhrase
      : result.reviewPhrase,
    searchTerms:
      keyword?.searchTerms && keyword.searchTerms.length > 0
        ? keyword.searchTerms
        : result.searchTerms,
    aliases:
      keyword?.aliases && keyword.aliases.length > 0
        ? keyword.aliases
        : result.aliases,
    relatedQuestions:
      keyword?.relatedQuestions && keyword.relatedQuestions.length > 0
        ? keyword.relatedQuestions
        : result.relatedQuestions,
  };
}

/**
 * Check if a keyword has any existing data that would be overwritten by enrichment
 */
export function hasExistingEnrichmentData(keyword: KeywordData | null): boolean {
  if (!keyword) return false;
  return !!(
    keyword.reviewPhrase?.trim() ||
    (keyword.searchTerms && keyword.searchTerms.length > 0) ||
    (keyword.aliases && keyword.aliases.length > 0) ||
    (keyword.relatedQuestions && keyword.relatedQuestions.length > 0)
  );
}

/**
 * Check if a keyword has any empty fields that could be filled by enrichment
 */
export function hasEmptyEnrichmentFields(keyword: KeywordData | null): boolean {
  if (!keyword) return true;
  return (
    !keyword.reviewPhrase ||
    !keyword.searchTerms ||
    keyword.searchTerms.length === 0 ||
    !keyword.aliases ||
    keyword.aliases.length === 0 ||
    !keyword.relatedQuestions ||
    keyword.relatedQuestions.length === 0
  );
}
