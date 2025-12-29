'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { type KeywordData } from '../../keywordUtils';
import { apiClient } from '@/utils/apiClient';

export interface ReviewsEditSectionProps {
  /** The keyword being displayed */
  keyword: KeywordData;
  /** Whether in edit mode */
  isEditing: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** The edited review phrase */
  editedReviewPhrase: string;
  /** Callback when review phrase changes */
  onReviewPhraseChange: (value: string) => void;
  /** The edited aliases (comma-separated string) */
  editedAliasesInput: string;
  /** Callback when aliases change */
  onAliasesChange: (value: string) => void;
  /** Callback to start editing */
  onStartEditing: () => void;
  /** Callback to save changes */
  onSave: () => Promise<void>;
  /** Callback to cancel editing */
  onCancel: () => void;
  /** Callback after review matching completes */
  onReviewMatchComplete?: () => void;
}

/**
 * ReviewsEditSection Component
 *
 * Displays and allows editing of review-related keyword fields:
 * - Review phrase (used in AI generation)
 * - Review aliases (alternative spellings/phrases)
 */
interface CheckReviewsResult {
  reviewsScanned: number;
  matchesFound: number;
  exactMatches: number;
  aliasMatches: number;
}

export function ReviewsEditSection({
  keyword,
  isEditing,
  isSaving,
  editedReviewPhrase,
  onReviewPhraseChange,
  editedAliasesInput,
  onAliasesChange,
  onStartEditing,
  onSave,
  onCancel,
  onReviewMatchComplete,
}: ReviewsEditSectionProps) {
  const [isCheckingReviews, setIsCheckingReviews] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckReviewsResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleCheckReviews = async () => {
    if (!keyword.id) return;

    setIsCheckingReviews(true);
    setCheckError(null);
    setCheckResult(null);

    try {
      const result = await apiClient.post<{
        success: boolean;
        reviewsScanned: number;
        matchesFound: number;
        exactMatches: number;
        aliasMatches: number;
        creditsUsed: number;
      }>(`/keywords/${keyword.id}/check-reviews`, {});

      setCheckResult({
        reviewsScanned: result.reviewsScanned,
        matchesFound: result.matchesFound,
        exactMatches: result.exactMatches,
        aliasMatches: result.aliasMatches,
      });

      // Clear result after 5 seconds
      setTimeout(() => setCheckResult(null), 5000);

      // Notify parent to refresh data
      onReviewMatchComplete?.();
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Failed to check reviews');
      setTimeout(() => setCheckError(null), 5000);
    } finally {
      setIsCheckingReviews(false);
    }
  };

  return (
    <div className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="FaStar" className="w-5 h-5 text-slate-blue" />
          <span className="text-lg font-semibold text-gray-800">Reviews</span>
        </div>
        {!isEditing ? (
          <button
            onClick={onStartEditing}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit reviews section"
            aria-label="Edit reviews section"
          >
            <Icon name="FaEdit" className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-2.5 py-1 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1"
            >
              {isSaving && <Icon name="FaSpinner" className="w-2.5 h-2.5 animate-spin" />}
              Save
            </button>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Review Phrase */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Review phrase
          </label>
          <p className="text-xs text-gray-500 mb-2">
            This is the phrase used in AI Generate and the Suggested Reviews feature on Prompt
            Pages.
          </p>
          {isEditing ? (
            <input
              type="text"
              value={editedReviewPhrase}
              onChange={(e) => onReviewPhraseChange(e.target.value)}
              placeholder="e.g., best marketing consultant in Portland"
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
            />
          ) : (
            <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
              {keyword.reviewPhrase || <span className="text-gray-500 italic">Not set</span>}
            </div>
          )}
        </div>

        {/* Review Aliases */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Review aliases</label>
          <p className="text-xs text-gray-500 mb-2">
            Alternative spellings or phrases that count as mentions of this keyword.
          </p>
          {isEditing ? (
            <input
              type="text"
              value={editedAliasesInput}
              onChange={(e) => onAliasesChange(e.target.value)}
              placeholder="e.g., plumbing services, plumbers (comma-separated)"
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
            />
          ) : (
            <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100 min-h-[42px]">
              {keyword.aliases && keyword.aliases.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {keyword.aliases.map((alias, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-sm text-indigo-700"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 italic">No aliases</span>
              )}
            </div>
          )}
        </div>

        {/* Check Reviews Button */}
        {!isEditing && (keyword.reviewPhrase || (keyword.aliases && keyword.aliases.length > 0)) && (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={handleCheckReviews}
              disabled={isCheckingReviews}
              className="w-full px-4 py-2 text-sm font-medium text-slate-blue bg-slate-blue/10 hover:bg-slate-blue/20 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingReviews ? (
                <>
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                  Scanning reviews...
                </>
              ) : (
                <>
                  <Icon name="FaSearch" className="w-4 h-4" />
                  Check reviews (1 credit)
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-1.5 text-center">
              Scan all reviews to find matches for this concept
            </p>

            {/* Success result */}
            {checkResult && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Icon name="FaCheckCircle" className="w-4 h-4" />
                  <span className="text-sm font-medium">Review scan complete</span>
                </div>
                <div className="mt-1.5 text-xs text-green-600 space-y-0.5">
                  <p>{checkResult.reviewsScanned} reviews scanned</p>
                  <p>{checkResult.matchesFound} total matches found</p>
                  {checkResult.matchesFound > 0 && (
                    <p className="text-green-700">
                      {checkResult.exactMatches} exact · {checkResult.aliasMatches} alias
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {checkError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                  <span className="text-sm">{checkError}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewsEditSection;
