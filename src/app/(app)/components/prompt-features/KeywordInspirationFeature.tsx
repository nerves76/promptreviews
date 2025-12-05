/**
 * KeywordInspirationFeature Component
 *
 * A reusable component for the Keyword Power-Ups feature that appears across all prompt page types.
 * This component handles the toggle for showing/hiding keyword power-ups on public prompt pages.
 *
 * Simplified: Automatically uses the first 10 keywords from the Keywords section.
 * No manual selection needed - just toggle on/off.
 *
 * Features:
 * - Toggle to enable/disable the power-ups button on public page
 * - Automatically displays the first 10 keywords from the page
 * - Shows preview of which keywords will be displayed
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";

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

  // Auto-select first 10 keywords
  const autoSelectedKeywords = availableKeywords.slice(0, 10);

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

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onEnabledChange?.(newEnabled);
    onToggle?.(newEnabled);
  };

  const hasNoKeywords = availableKeywords.length === 0;

  return (
    <div className="rounded-lg p-2 sm:p-4 bg-green-50 border border-green-200 flex flex-col gap-4 shadow relative">
      <div className="flex flex-row justify-between items-start mb-2 px-2 sm:px-4 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="mushroom" className="w-7 h-7 text-slate-blue" size={28} />
            <span className="text-2xl font-bold text-slate-blue">
              Keyword Power-Ups
            </span>
            <div className="relative group">
              <Icon name="prompty" className="w-5 h-5 text-slate-blue" size={20} />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-72 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg z-10">
                Keywords are used by Prompty AI and inserted into reviews for better rankings in Google and LLMs like ChatGPT.
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-9">
            Show a "Power-up" button on your Prompt Page that displays your first 10 keywords with copy buttons, encouraging customers to include them in their review.
          </div>
        </div>
        <div className="flex flex-col justify-start pt-1">
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled || hasNoKeywords}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isEnabled ? "bg-slate-blue" : "bg-gray-200"
            } ${disabled || hasNoKeywords ? "opacity-50 cursor-not-allowed" : ""}`}
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
                <p className="font-medium mb-1">No keywords available</p>
                <p>Add keywords in the "Keywords" section above. The first 10 will automatically appear in Power-Ups.</p>
              </div>
            </div>
          )}

          {/* Preview of keywords that will be shown */}
          {!hasNoKeywords && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-green-800">
                  Keywords that will be shown ({autoSelectedKeywords.length} of {availableKeywords.length})
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {autoSelectedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center px-3 py-1 bg-green-100 border border-green-300 rounded-full text-sm text-green-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              {availableKeywords.length > 10 && (
                <p className="text-xs text-green-600 mt-2">
                  +{availableKeywords.length - 10} more keywords not shown in Power-Ups (only first 10 displayed)
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
                <li>• Adds a "Power-up" button to your Prompt Page</li>
                <li>• Customers click it to see keyword suggestions</li>
                <li>• Each keyword has a copy button to add to their review</li>
                <li>• Automatically uses your first 10 keywords</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
