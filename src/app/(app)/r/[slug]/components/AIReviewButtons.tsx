/**
 * AIReviewButtons Component
 *
 * Single context-aware AI button that transforms based on user input:
 * - Default: "Generate with AI" (creates review from scratch)
 * - After user manually types 10+ words: "Enhance with AI" (improves existing text)
 *
 * Features:
 * - 3-use limit per session for each mode
 * - Tooltips explaining disabled states
 * - Smooth transition between modes
 */

"use client";
import React, { useEffect, useRef, useState } from "react";
import { getContrastTextColor } from "@/utils/colorUtils";
import ButtonSpinner from "@/components/ButtonSpinner";
import { Tooltip } from "@/app/(app)/components/ui/Tooltip";

/** Minimum manually-typed words before switching to enhance mode */
const MIN_MANUAL_WORDS_FOR_ENHANCE = 10;

export interface AIReviewButtonsProps {
  /** Whether AI generation is enabled for this page */
  aiGenerateEnabled: boolean;
  /** Whether AI enhancement is enabled for this page */
  aiEnhanceEnabled: boolean;
  /** Number of words the user has manually typed (not from AI generation) */
  manualWordCount: number;
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
  manualWordCount,
  aiGenerateLoading,
  aiEnhanceLoading,
  aiGenerateCount,
  aiEnhanceCount,
  onGenerateWithAI,
  onEnhanceReview,
  primaryColor,
}: AIReviewButtonsProps) {
  const hasEnoughManualWords = manualWordCount >= MIN_MANUAL_WORDS_FOR_ENHANCE;
  const isEnhanceMode = aiEnhanceEnabled && hasEnoughManualWords;

  // Track mode changes to trigger glow animation
  const prevModeRef = useRef(isEnhanceMode);
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    if (prevModeRef.current !== isEnhanceMode) {
      prevModeRef.current = isEnhanceMode;
      setIsGlowing(true);
      const timer = setTimeout(() => setIsGlowing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isEnhanceMode]);

  // Determine visibility based on settings and mode
  // Generate ON + Enhance ON: transforms from Generate → Enhance after manual typing
  // Generate ON + Enhance OFF: always shows Generate, never transforms
  // Generate OFF + Enhance ON: hidden initially, appears as Enhance once user types 10+ words
  // Generate OFF + Enhance OFF: no button shown
  const isVisible = isEnhanceMode ? aiEnhanceEnabled : aiGenerateEnabled;

  if (!isVisible) return null;

  // Mode-specific state
  const isLoading = isEnhanceMode ? aiEnhanceLoading : aiGenerateLoading;
  const useCount = isEnhanceMode ? aiEnhanceCount : aiGenerateCount;
  const isDisabled = isLoading || useCount >= 3;
  const onClick = isEnhanceMode ? onEnhanceReview : onGenerateWithAI;

  const getTooltip = () => {
    if (isEnhanceMode) {
      if (aiEnhanceCount >= 3) {
        return "You've used all 3 enhancement attempts";
      }
      return "Use AI to polish your review while preserving your writing style";
    }
    if (aiGenerateCount >= 3) {
      return "You've used all 3 generation attempts";
    }
    return "Use AI to generate a review you can modify and make your own";
  };

  // Enhance mode uses sparkle icon, Generate mode uses star icon
  const icon = isEnhanceMode ? (
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
  ) : (
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
  );

  const loadingLabel = isEnhanceMode ? "Enhancing..." : "Generating...";
  const fullLabel = isEnhanceMode ? "Enhance with AI" : "Generate with AI";
  const shortLabel = isEnhanceMode ? "Enhance" : "Generate";

  const glowColor = primaryColor || "#2563EB";

  return (
    <div className="flex items-center gap-2">
      {/* Glow keyframes scoped via unique animation name */}
      <style>{`
        @keyframes ai-btn-glow {
          0% { box-shadow: 0 0 0 0 ${glowColor}00; }
          30% { box-shadow: 0 0 12px 4px ${glowColor}60; }
          100% { box-shadow: 0 0 0 0 ${glowColor}00; }
        }
      `}</style>
      <Tooltip content={getTooltip()} position="top">
        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          className="px-3 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all duration-200 border whitespace-nowrap"
          style={{
            backgroundColor: "transparent",
            borderColor: primaryColor || "#2563EB",
            color: primaryColor || "#2563EB",
            ...(isGlowing
              ? {
                  boxShadow: `0 0 8px 2px ${primaryColor || "#2563EB"}80`,
                  animation: "ai-btn-glow 0.8s ease-out",
                }
              : {}),
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.backgroundColor = primaryColor || "#2563EB";
              e.currentTarget.style.color = getContrastTextColor(
                primaryColor || "#2563EB"
              );
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = primaryColor || "#2563EB";
            }
          }}
        >
          {isLoading ? (
            <>
              <ButtonSpinner size={12} />
              <span className="hidden sm:inline">{loadingLabel}</span>
            </>
          ) : (
            <>
              {icon}
              <span className="hidden sm:inline">{fullLabel}</span>
              <span className="sm:hidden">{shortLabel}</span>
              {useCount > 0 && (
                <span className="hidden sm:inline">({useCount}/3)</span>
              )}
            </>
          )}
        </button>
      </Tooltip>
    </div>
  );
}
