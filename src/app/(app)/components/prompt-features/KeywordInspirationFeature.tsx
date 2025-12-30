/**
 * KeywordInspirationFeature Component
 *
 * A reusable component for the Suggested Phrases Menu feature that appears across all prompt page types.
 * This component handles the toggle for showing/hiding the suggested phrases menu on public prompt pages.
 *
 * Simplified: Automatically uses the first 10 keywords from the Keywords section.
 * No manual selection needed - just toggle on/off.
 *
 * Features:
 * - Toggle to enable/disable the power-ups button on public page
 * - Automatically displays the first 10 keywords from the page
 * - Shows preview of which keywords will be displayed (using reviewPhrase when available)
 */

"use client";
import React, { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import { useKeywords } from "@/features/keywords/hooks/useKeywords";

export interface KeywordInspirationFeatureProps {
  /** Whether the keyword inspiration feature is enabled */
  enabled: boolean;
  /** Callback when the enabled state changes */
  onEnabledChange?: (enabled: boolean) => void;
  /** Alternative callback for toggle (same as onEnabledChange) */
  onToggle?: (enabled: boolean) => void;
  /** Selected keywords to display (max 10) - kept for backwards compatibility but now auto-populated */
  selectedKeywords?: string[];
  /** Callback when the selected keywords change - auto-updates with first 10 */
  onKeywordsChange?: (keywords: string[]) => void;
  /** Available keywords from the page */
  availableKeywords: string[];
  /** Initial values for the component */
  initialData?: {
    keyword_inspiration_enabled?: boolean;
    selected_keyword_inspirations?: string[];
  };
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
}

export default function KeywordInspirationFeature({
  enabled,
  onEnabledChange,
  onToggle,
  selectedKeywords = [],
  onKeywordsChange,
  availableKeywords = [],
  initialData,
  disabled = false,
  editMode = false,
}: KeywordInspirationFeatureProps) {
  // Initialize state from props and initialData
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [showNoKeywordsModal, setShowNoKeywordsModal] = useState(false);

  // Fetch all keywords to get reviewPhrase data
  const { keywords: allKeywords } = useKeywords();

  // Auto-select first 10 keywords
  const autoSelectedKeywords = availableKeywords.slice(0, 10);

  // Build a map of phrase -> reviewPhrase for display
  const phraseToReviewPhrase = useMemo(() => {
    const map = new Map<string, string>();
    for (const kw of allKeywords) {
      // Use reviewPhrase if available, otherwise fall back to phrase
      const displayText = kw.reviewPhrase || kw.phrase;
      map.set(kw.phrase.toLowerCase(), displayText);
    }
    return map;
  }, [allKeywords]);

  // Get display text for each keyword (reviewPhrase if available)
  const getDisplayText = (phrase: string): string => {
    return phraseToReviewPhrase.get(phrase.toLowerCase()) || phrase;
  };

  // Update state when props change
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.keyword_inspiration_enabled !== undefined) {
        setIsEnabled(initialData.keyword_inspiration_enabled);
      }
    }
  }, [initialData]);

  // Auto-update selected keywords when available keywords change
  useEffect(() => {
    if (onKeywordsChange && availableKeywords.length > 0) {
      onKeywordsChange(autoSelectedKeywords);
    }
  }, [availableKeywords.join(',')]); // Only trigger when keywords actually change

  const hasNoKeywords = availableKeywords.length === 0;

  const handleToggle = () => {
    const newEnabled = !isEnabled;

    // Show modal if trying to enable but no keywords available
    if (newEnabled && hasNoKeywords) {
      setShowNoKeywordsModal(true);
      return;
    }

    setIsEnabled(newEnabled);
    onEnabledChange?.(newEnabled);
    onToggle?.(newEnabled);
  };

  return (
    <div className="rounded-lg p-2 sm:p-4 bg-green-50 border border-green-200 flex flex-col gap-4 shadow relative">
      <div className="flex flex-row justify-between items-start mb-2 px-2 sm:px-4 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <svg className="w-7 h-7 text-slate-blue" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="text-2xl font-bold text-slate-blue">
              Suggested Phrases Menu
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-9">
            Display a "Suggested phrases" button on your Prompt Page that allows users to choose to add any of your phrases to their review.
          </div>
        </div>
        <div className="flex flex-col justify-start pt-1">
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isEnabled ? "bg-slate-blue" : "bg-gray-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={isEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Feature Details when enabled */}
      {isEnabled && (
        <div className="mt-2 p-4 bg-white/50 rounded-lg border border-green-200 space-y-4">
          {/* No keywords warning */}
          {hasNoKeywords && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Icon
                name="FaExclamationTriangle"
                className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                size={20}
              />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">No keyword phrases available</p>
                <p>Add keyword phrases in the "Suggested Phrases" section above. The first 10 will automatically appear in the menu.</p>
              </div>
            </div>
          )}

          {/* Preview of keywords that will be shown */}
          {!hasNoKeywords && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-green-800">
                  Phrases that will be shown ({autoSelectedKeywords.length} of {availableKeywords.length})
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {autoSelectedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center px-3 py-1 bg-green-100 border border-green-300 rounded-full text-sm text-green-800"
                    title={`Concept: ${keyword}`}
                  >
                    {getDisplayText(keyword)}
                  </span>
                ))}
              </div>

              {availableKeywords.length > 10 && (
                <p className="text-xs text-green-600 mt-2">
                  +{availableKeywords.length - 10} more phrases not shown in menu (only first 10 displayed)
                </p>
              )}
            </div>
          )}

          {/* How it works info */}
          <div className="flex items-start space-x-3 pt-3 border-t border-green-200">
            <Icon
              name="FaInfoCircle"
              className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
              size={20}
            />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-green-700">
                <li>• Adds a "Suggested phrases" button to your Prompt Page</li>
                <li>• Customers click it to see phrase suggestions</li>
                <li>• Click to add a phrase to review</li>
                <li>• Automatically uses your first 10 keyword phrases</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* No Keywords Modal */}
      {showNoKeywordsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setShowNoKeywordsModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-amber-700 mb-4">
              No Suggested Phrases
            </h2>
            <p className="mb-6 text-gray-700">
              You must add keyword phrases to <strong>Suggested Phrases</strong> first before enabling this feature.
            </p>
            <button
              onClick={() => setShowNoKeywordsModal(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold mt-2"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
