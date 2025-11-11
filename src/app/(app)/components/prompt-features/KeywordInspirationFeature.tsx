/**
 * KeywordInspirationFeature Component
 *
 * A reusable component for the Keyword Inspiration feature that appears across all prompt page types.
 * This component handles the toggle for showing/hiding keyword inspiration on public prompt pages.
 * Only shows the "Keyword inspiration" button when keywords are selected.
 *
 * Features:
 * - Toggle to enable/disable the keyword inspiration button
 * - Select up to 10 keywords from the page's keywords
 * - Displays keywords with copy buttons on the public page
 * - Helpful hints when no keywords are available
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
  /** Selected keywords to display (max 10) */
  selectedKeywords?: string[];
  /** Callback when the selected keywords change */
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
  const [selected, setSelected] = useState<string[]>(selectedKeywords);
  const [showKeywordList, setShowKeywordList] = useState(false);

  // Update state when props change
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    setSelected(selectedKeywords);
  }, [selectedKeywords]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.keyword_inspiration_enabled !== undefined) {
        setIsEnabled(initialData.keyword_inspiration_enabled);
      }
      if (initialData.selected_keyword_inspirations !== undefined) {
        setSelected(initialData.selected_keyword_inspirations);
      }
    }
  }, [initialData]);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onEnabledChange?.(newEnabled);
    onToggle?.(newEnabled);
  };

  const handleKeywordToggle = (keyword: string) => {
    let newSelected: string[];
    if (selected.includes(keyword)) {
      newSelected = selected.filter(k => k !== keyword);
    } else {
      if (selected.length >= 10) {
        return; // Max 10 keywords
      }
      newSelected = [...selected, keyword];
    }
    setSelected(newSelected);
    onKeywordsChange?.(newSelected);
  };

  const hasNoKeywords = availableKeywords.length === 0;
  const hasNoSelectedKeywords = selected.length === 0;

  return (
    <div className="rounded-lg p-4 bg-green-50 border border-green-200 flex flex-col gap-4 shadow relative">
      <div className="flex flex-row justify-between items-start mb-2 px-4 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="mushroom" className="w-7 h-7 text-slate-blue" size={28} />
            <span className="text-2xl font-bold text-slate-blue">
              Keyword Power-Ups
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-9">
            Show a "Power-up" button on your Prompt Page to help visitors come up with ideas for their review. Displays up to 10 keyword phrases with copy buttons for easy use.
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
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
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
                <p>You need to add some keywords above in the "Keywords" section, then save your changes so you can select them here.</p>
              </div>
            </div>
          )}

          {/* Keyword Selection */}
          {!hasNoKeywords && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-green-800">
                  Select Keywords to Display ({selected.length}/10)
                </label>
                <button
                  type="button"
                  onClick={() => setShowKeywordList(!showKeywordList)}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {showKeywordList ? 'Hide' : 'Show'} keyword list
                </button>
              </div>

              {showKeywordList && (
                <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-white rounded border border-green-300">
                  {availableKeywords.map((keyword) => (
                    <label key={keyword} className="flex items-center hover:bg-green-50 p-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.includes(keyword)}
                        onChange={() => handleKeywordToggle(keyword)}
                        disabled={disabled || (!selected.includes(keyword) && selected.length >= 10)}
                        className="mr-3 text-green-600"
                      />
                      <span className="text-sm text-gray-800">{keyword}</span>
                    </label>
                  ))}
                </div>
              )}

              {hasNoSelectedKeywords && (
                <p className="text-xs text-green-600 mt-2">
                  Click "Show keyword list" above to select keywords you want to display.
                </p>
              )}

              {!hasNoSelectedKeywords && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full text-sm text-green-800"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleKeywordToggle(keyword)}
                        className="hover:text-red-600"
                        aria-label={`Remove ${keyword}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How it works info */}
          <div className="flex items-start space-x-3 pt-2 border-t border-green-200">
            <Icon
              name="FaInfoCircle"
              className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
              size={20}
            />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-green-700">
                <li>• Activates "Power-up" button on your Prompt Page</li>
                <li>• Button appears on the left side below the hero area</li>
                <li>• On click, displays your selected keywords in a modal</li>
                <li>• Each keyword has a copy button for easy use</li>
                <li>• Select up to 10 keywords to help inspire better reviews</li>
                <li>• Keywords must be saved above before selecting them here</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
