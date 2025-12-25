'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

interface AIEnrichButtonProps {
  /** Whether existing data would be overwritten */
  hasExistingData: boolean;
  /** Whether there are empty fields that can be filled */
  hasEmptyFields: boolean;
  /** Whether enrichment is currently in progress */
  isEnriching: boolean;
  /** Error message from enrichment attempt */
  enrichError?: string | null;
  /** Whether enrichment completed successfully */
  enrichSuccess?: boolean;
  /** Callback when user triggers enrichment */
  onEnrich: (fillEmptyOnly: boolean) => void;
  /** Optional CSS classes */
  className?: string;
}

/**
 * AIEnrichButton Component
 *
 * Shared button for AI-powered field enrichment with overwrite protection.
 * Used in both ConceptCard and KeywordDetailsSidebar.
 *
 * Behavior:
 * - Shows "Auto-fill with AI (1 credit)" button when fields can be filled
 * - If existing data detected, shows warning with "Fill empty only" or "Replace all" options
 * - Shows loading spinner during enrichment
 * - Shows error or success messages
 */
export function AIEnrichButton({
  hasExistingData,
  hasEmptyFields,
  isEnriching,
  enrichError,
  enrichSuccess,
  onEnrich,
  className = '',
}: AIEnrichButtonProps) {
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  // Don't render if there are no empty fields to fill
  if (!hasEmptyFields) return null;

  const handleButtonClick = () => {
    if (hasExistingData) {
      setShowOverwriteWarning(true);
    } else {
      onEnrich(false);
    }
  };

  const handleFillEmptyOnly = () => {
    setShowOverwriteWarning(false);
    onEnrich(true);
  };

  const handleReplaceAll = () => {
    setShowOverwriteWarning(false);
    onEnrich(false);
  };

  const handleCancel = () => {
    setShowOverwriteWarning(false);
  };

  return (
    <div className={className}>
      {/* Main AI button - shown when not showing overwrite warning */}
      {!showOverwriteWarning && (
        <button
          onClick={handleButtonClick}
          disabled={isEnriching}
          className="text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isEnriching ? (
            <>
              <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Icon name="FaRocket" className="w-3 h-3" />
              Auto-fill with AI
              <span className="text-purple-400">(1 credit)</span>
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {enrichError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2">
          <Icon name="FaExclamationTriangle" className="w-3 h-3" />
          {enrichError}
        </div>
      )}

      {/* Overwrite warning */}
      {showOverwriteWarning && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 mb-2">
            Some fields already have data. What would you like to do?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleFillEmptyOnly}
              disabled={isEnriching}
              className="px-2.5 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
            >
              {isEnriching ? (
                <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
              ) : (
                'Fill empty only'
              )}
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={isEnriching}
              className="px-2.5 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50"
            >
              Replace all
            </button>
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success message */}
      {enrichSuccess && (
        <div className="mt-2 p-2 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-700 flex items-center gap-2">
          <Icon name="FaRocket" className="w-3 h-3" />
          Fields populated by AI - review and save
        </div>
      )}
    </div>
  );
}
