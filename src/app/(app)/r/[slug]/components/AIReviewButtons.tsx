/**
 * AIReviewButtons Component
 *
 * Centralized component for all AI review buttons (Generate, Enhance).
 * Used across all prompt page types for consistent styling and behavior.
 *
 * Features:
 * - Generate with AI button - creates a new review from scratch
 * - Enhance review button - improves existing review text
 * - 3-use limit per session for each button
 * - Tooltips explaining disabled states
 */

"use client";
import React from "react";
import { getContrastTextColor } from "@/utils/colorUtils";
import ButtonSpinner from "@/components/ButtonSpinner";
import { countWords } from "@/constants/promptPageWordLimits";
import { Tooltip } from "@/app/(app)/components/ui/Tooltip";

/** Minimum words required before enhance button is enabled */
const MIN_WORDS_FOR_ENHANCE = 10;

export interface AIReviewButtonsProps {
  /** Whether AI generation is enabled for this page */
  aiGenerateEnabled: boolean;
  /** Whether AI enhancement is enabled for this page */
  aiEnhanceEnabled: boolean;
  /** Current review text */
  reviewText: string;
  /** Whether AI generation is currently loading */
  aiGenerateLoading: boolean;
  /** Whether AI enhancement is currently loading */
  aiEnhanceLoading: boolean;
  /** Number of times AI generate has been used */
  aiGenerateCount: number;
  /** Number of times AI enhance has been used */
  aiEnhanceCount: number;
  /** Callback when Generate with AI is clicked */
  onGenerateWithAI: () => void;
  /** Callback when Enhance review is clicked */
  onEnhanceReview: () => void;
  /** Primary color for button styling */
  primaryColor: string;
}

export default function AIReviewButtons({
  aiGenerateEnabled,
  aiEnhanceEnabled,
  reviewText,
  aiGenerateLoading,
  aiEnhanceLoading,
  aiGenerateCount,
  aiEnhanceCount,
  onGenerateWithAI,
  onEnhanceReview,
  primaryColor,
}: AIReviewButtonsProps) {
  const wordCount = countWords(reviewText);
  const hasEnoughTextToEnhance = wordCount >= MIN_WORDS_FOR_ENHANCE;

  // Determine disabled states and tooltips
  const isGenerateDisabled = aiGenerateLoading || aiGenerateCount >= 3;
  const isEnhanceDisabled =
    aiEnhanceLoading ||
    aiEnhanceCount >= 3 ||
    !hasEnoughTextToEnhance;

  // Tooltip messages
  const getEnhanceTooltip = () => {
    if (aiEnhanceCount >= 3) {
      return "You've used all 3 enhancement attempts";
    }
    if (!hasEnoughTextToEnhance) {
      return "Write at least a sentence before enhancing";
    }
    return "Use AI to polish your review while preserving your writing style";
  };

  const getGenerateTooltip = () => {
    if (aiGenerateCount >= 3) {
      return "You've used all 3 generation attempts";
    }
    return "Use AI to generate a review you can modify and make your own";
  };

  return (
    <div className="flex items-center gap-2">
      {/* Enhance review button */}
      {aiEnhanceEnabled && (
        <Tooltip content={getEnhanceTooltip()} position="top">
          <button
            type="button"
            onClick={onEnhanceReview}
            disabled={isEnhanceDisabled}
            className="px-3 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all duration-200 border whitespace-nowrap"
            style={{
              backgroundColor: "transparent",
              borderColor: primaryColor || "#2563EB",
              color: primaryColor || "#2563EB",
            }}
            onMouseEnter={(e) => {
              if (!isEnhanceDisabled) {
                e.currentTarget.style.backgroundColor = primaryColor || "#2563EB";
                e.currentTarget.style.color = getContrastTextColor(
                  primaryColor || "#2563EB"
                );
              }
            }}
            onMouseLeave={(e) => {
              if (!isEnhanceDisabled) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = primaryColor || "#2563EB";
              }
            }}
          >
            {aiEnhanceLoading ? (
              <>
                <ButtonSpinner size={12} />
                <span className="hidden sm:inline">Enhancing...</span>
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-3 h-3"
                >
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                  <path d="M19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
                </svg>
                <span className="hidden sm:inline">Enhance review</span>
                <span className="sm:hidden">Enhance</span>
                {aiEnhanceCount > 0 && (
                  <span className="hidden sm:inline">({aiEnhanceCount}/3)</span>
                )}
              </>
            )}
          </button>
        </Tooltip>
      )}

      {/* Generate with AI button */}
      {aiGenerateEnabled && (
        <Tooltip content={getGenerateTooltip()} position="top">
          <button
            type="button"
            onClick={onGenerateWithAI}
            disabled={isGenerateDisabled}
            className="px-3 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all duration-200 border whitespace-nowrap"
            style={{
              backgroundColor: "transparent",
              borderColor: primaryColor || "#2563EB",
              color: primaryColor || "#2563EB",
            }}
            onMouseEnter={(e) => {
              if (!isGenerateDisabled) {
                e.currentTarget.style.backgroundColor = primaryColor || "#2563EB";
                e.currentTarget.style.color = getContrastTextColor(
                  primaryColor || "#2563EB"
                );
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerateDisabled) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = primaryColor || "#2563EB";
              }
            }}
          >
            {aiGenerateLoading ? (
              <>
                <ButtonSpinner size={12} />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-3 h-3"
                >
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0L9.937 15.5Z" />
                  <path d="M20 3v4" />
                  <path d="M22 5h-4" />
                  <path d="M4 17v2" />
                  <path d="M5 18H3" />
                </svg>
                <span className="hidden sm:inline">Generate with AI</span>
                <span className="sm:hidden">Generate</span>
                {aiGenerateCount > 0 && (
                  <span className="hidden sm:inline">({aiGenerateCount}/3)</span>
                )}
              </>
            )}
          </button>
        </Tooltip>
      )}
    </div>
  );
}
