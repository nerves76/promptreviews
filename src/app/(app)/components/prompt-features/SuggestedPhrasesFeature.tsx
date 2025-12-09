/**
 * SuggestedPhrasesFeature Component
 *
 * A reusable component for the Suggested Phrases section that appears across all prompt page types.
 * This component handles keyword phrase management and auto-rotation settings.
 *
 * Features:
 * - Keyword phrase input with business context for AI suggestions
 * - Auto-rotate toggle to track phrase usage and rotate overused phrases
 * - Click handler for viewing keyword details
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { KeywordsInputLegacyAdapter as KeywordsInput } from "@/features/keywords/components";

export interface SuggestedPhrasesFeatureProps {
  /** Array of keyword phrases */
  keywords: string[];
  /** Callback when keywords change */
  onKeywordsChange: (keywords: string[]) => void;
  /** Whether auto-rotation is enabled */
  autoRotateEnabled: boolean;
  /** Callback when auto-rotate enabled state changes */
  onAutoRotateEnabledChange: (enabled: boolean) => void;
  /** Business info for AI suggestions */
  businessInfo?: {
    name?: string;
    industry?: string[] | null;
    industries_other?: string;
    industry_other?: string;
    address_city?: string;
    address_state?: string;
    accountId?: string;
    about_us?: string;
    differentiators?: string;
    years_in_business?: string | null;
    services_offered?: string | string[] | null;
    industries_served?: string;
  };
  /** Callback when a keyword is clicked (for showing details sidebar) */
  onKeywordClick?: (phrase: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Initial values for the component */
  initialData?: {
    keywords?: string[];
    keyword_auto_rotate_enabled?: boolean;
  };
  /** Whether the component is disabled */
  disabled?: boolean;
}

export default function SuggestedPhrasesFeature({
  keywords,
  onKeywordsChange,
  autoRotateEnabled,
  onAutoRotateEnabledChange,
  businessInfo,
  onKeywordClick,
  placeholder = "Enter keywords separated by commas (e.g., best pizza Seattle, wood-fired oven, authentic Italian)",
  initialData,
  disabled = false,
}: SuggestedPhrasesFeatureProps) {
  // Initialize state from props
  const [localKeywords, setLocalKeywords] = useState<string[]>(keywords);
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState(autoRotateEnabled);

  // Update state when props change
  useEffect(() => {
    setLocalKeywords(keywords);
  }, [keywords]);

  useEffect(() => {
    setIsAutoRotateEnabled(autoRotateEnabled);
  }, [autoRotateEnabled]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.keywords !== undefined) {
        setLocalKeywords(initialData.keywords);
      }
      if (initialData.keyword_auto_rotate_enabled !== undefined) {
        setIsAutoRotateEnabled(initialData.keyword_auto_rotate_enabled);
      }
    }
  }, [initialData]);

  const handleKeywordsChange = (newKeywords: string[]) => {
    setLocalKeywords(newKeywords);
    onKeywordsChange(newKeywords);
  };

  const handleAutoRotateToggle = () => {
    const newEnabled = !isAutoRotateEnabled;
    setIsAutoRotateEnabled(newEnabled);
    onAutoRotateEnabledChange(newEnabled);
  };

  return (
    <div className="rounded-lg p-6 bg-green-50 border border-green-200 shadow">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="FaKey" className="w-7 h-7 text-slate-blue" size={28} />
        <h3 className="text-2xl font-bold text-slate-blue">Suggested Phrases</h3>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select which keyword phrases can be used by Prompty AI and/or the Suggested Phrases Menu.
        </label>
        <KeywordsInput
          keywords={localKeywords}
          onChange={handleKeywordsChange}
          placeholder={placeholder}
          businessInfo={businessInfo}
          onKeywordClick={onKeywordClick}
        />
      </div>

      {/* Auto-rotate toggle */}
      <div className="mt-4 pt-4 border-t border-green-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAutoRotateEnabled}
            onChange={handleAutoRotateToggle}
            disabled={disabled}
            className="mt-1 w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue disabled:opacity-50"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Auto-rotate phrases</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Track how often each phrase appears in reviews and automatically rotate out overused phrases to keep reviews looking natural.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
