/**
 * RecentReviewsFeature Component
 * 
 * A reusable component for the Recent Reviews feature that appears across all prompt page types.
 * This component handles the toggle for showing/hiding recent reviews on public prompt pages.
 * Only shows the "Recent reviews" button when 3+ reviews are available.
 * 
 * Features:
 * - Toggle to enable/disable the recent reviews button
 * - Displays recent reviews with initials for privacy
 * - Requires minimum 3 reviews to show button
 * - Filters out feedback and incomplete reviews
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";

export interface RecentReviewsFeatureProps {
  /** Whether the recent reviews feature is enabled */
  enabled: boolean;
  /** Callback when the enabled state changes */
  onEnabledChange?: (enabled: boolean) => void;
  /** Alternative callback for toggle (same as onEnabledChange) */
  onToggle?: (enabled: boolean) => void;
  /** Scope for recent reviews: 'current_page' or 'all_pages' */
  scope?: 'current_page' | 'all_pages';
  /** Callback when the scope changes */
  onScopeChange?: (scope: 'current_page' | 'all_pages') => void;
  /** Initial values for the component */
  initialData?: {
    recent_reviews_enabled?: boolean;
    recent_reviews_scope?: 'current_page' | 'all_pages';
  };
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
}

export default function RecentReviewsFeature({
  enabled,
  onEnabledChange,
  onToggle,
  scope = 'current_page',
  onScopeChange,
  initialData,
  disabled = false,
  editMode = false,
}: RecentReviewsFeatureProps) {
  // Initialize state from props and initialData
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [reviewScope, setReviewScope] = useState<'current_page' | 'all_pages'>(scope);

  // Update state when props change
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    setReviewScope(scope);
  }, [scope]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.recent_reviews_enabled !== undefined) {
        setIsEnabled(initialData.recent_reviews_enabled);
      }
      if (initialData.recent_reviews_scope !== undefined) {
        setReviewScope(initialData.recent_reviews_scope);
      }
    }
  }, [initialData]);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onEnabledChange?.(newEnabled);
    onToggle?.(newEnabled);
  };

  const handleScopeChange = (newScope: 'current_page' | 'all_pages') => {
    setReviewScope(newScope);
    onScopeChange?.(newScope);
  };

  return (
    <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative">
      <div className="flex flex-row justify-between items-start mb-2 px-4 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="FaComments" className="w-7 h-7 text-slate-blue" size={28} />
            <span className="text-2xl font-bold text-slate-blue">
              Recent Reviews
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-9">
            Show a "Recent reviews" button below on your Prompt Page to inspire visitors or help them come up with ideas for their own review. Displays the latest 5 reviews with only the reviewer's initials for privacy. Note: Button only appears when you have 3+ reviews.
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
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Review Source
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reviewScope"
                  value="current_page"
                  checked={reviewScope === 'current_page'}
                  onChange={(e) => handleScopeChange(e.target.value as 'current_page' | 'all_pages')}
                  disabled={disabled}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="text-sm text-blue-800 font-medium">This prompt page only</div>
                  <div className="text-xs text-blue-600">Show reviews submitted specifically for this prompt page</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reviewScope"
                  value="all_pages"
                  checked={reviewScope === 'all_pages'}
                  onChange={(e) => handleScopeChange(e.target.value as 'current_page' | 'all_pages')}
                  disabled={disabled}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="text-sm text-blue-800 font-medium">All my prompt pages</div>
                  <div className="text-xs text-blue-600">Show reviews from all your prompt pages (great for multi-location businesses)</div>
                </div>
              </label>
            </div>
          </div>
          
          {/* How it works info */}
          <div className="flex items-start space-x-3 pt-2 border-t border-blue-200">
            <Icon 
              name="FaInfoCircle" 
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" 
              size={20} 
            />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Activates "Recent reviews" button on your Prompt Page</li>
                <li>• Only appears when you have 3+ reviews</li>
                <li>• On click, displays the latest 5 reviews to inspire visitors</li>
                <li>• Shows reviewer initials only (e.g., "J.D.") for privacy</li>
                <li>• Excludes private feedback and incomplete submissions</li>
                <li>• Automatically filters out duplicate reviews</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 