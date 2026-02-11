'use client';

import { useMemo } from 'react';
import Icon from '@/components/Icon';
import {
  type RelatedQuestion,
  type FunnelStage,
  getFunnelStageColor,
} from '../keywordUtils';
import {
  type LLMProvider,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_SHORT_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
} from '@/features/llm-visibility/utils/types';

/**
 * Format a date as a relative time string (e.g., "2h ago", "3d ago", "2w ago").
 */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * QuestionRow Component
 *
 * Renders a single AI visibility question with:
 * - Question text
 * - Funnel stage badge (editable dropdown in edit mode)
 * - LLM mention status (X/Y mentioned) with appropriate colors
 * - Last checked date
 * - Check/Re-check button
 * - Optional expandable section showing per-provider results
 * - Edit mode: remove button and funnel stage selector
 */

interface QuestionRowProps {
  question: RelatedQuestion;
  index: number;
  llmResults?: Map<string, {
    domainCited: boolean;
    brandMentioned: boolean;
    citationPosition?: number | null;
    checkedAt: string
  }>;
  isEditing?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onRemove?: () => void;
  onUpdateFunnel?: (stage: FunnelStage) => void;
  onCheck?: () => void;
  isChecking?: boolean;
  selectedProviders?: LLMProvider[];
  checkResult?: {
    success: boolean;
    message: string;
  } | null;
  /** Schedule info for showing schedule indicator */
  scheduleInfo?: {
    isScheduled: boolean;
    frequency: string | null;
  } | null;
}

export function QuestionRow({
  question,
  index,
  llmResults,
  isEditing = false,
  isExpanded = false,
  onToggleExpand,
  onRemove,
  onUpdateFunnel,
  onCheck,
  isChecking = false,
  selectedProviders = [],
  checkResult,
  scheduleInfo,
}: QuestionRowProps) {
  const funnelColor = getFunnelStageColor(question.funnelStage);

  // Calculate mention stats
  const hasResults = llmResults && llmResults.size > 0;
  const mentionedCount = hasResults
    ? Array.from(llmResults.values()).filter(r => r.brandMentioned).length
    : 0;
  const totalProviders = hasResults ? llmResults.size : 0;

  // Get most recent check date
  const lastCheckedAt = hasResults
    ? Array.from(llmResults.values()).reduce((latest, r) => {
        if (!latest) return r.checkedAt;
        return new Date(r.checkedAt) > new Date(latest) ? r.checkedAt : latest;
      }, '' as string)
    : null;

  // Calculate total credit cost for selected providers
  const totalCredits = selectedProviders.reduce((acc, p) => acc + LLM_CREDIT_COSTS[p], 0);

  return (
    <div className="bg-white/80 rounded-lg border border-gray-100 overflow-hidden">
      {/* Question header - clickable to expand */}
      <div
        className={`flex items-start gap-2 p-2 ${
          !isEditing ? 'cursor-pointer hover:bg-gray-50/50' : ''
        } transition-colors ${
          isExpanded ? 'border-b border-gray-100' : ''
        }`}
        onClick={() => !isEditing && onToggleExpand?.()}
      >
        {/* Funnel stage dropdown - only show in edit mode (section headers show stage in view mode) */}
        {isEditing && onUpdateFunnel && (
          <div className="relative group flex-shrink-0">
            <select
              value={question.funnelStage}
              onChange={(e) => onUpdateFunnel(e.target.value as FunnelStage)}
              className={`px-1.5 py-0.5 text-xs rounded border-0 ${funnelColor.bg} ${funnelColor.text} cursor-pointer`}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="top">Top</option>
              <option value="middle">Mid</option>
              <option value="bottom">Bot</option>
            </select>
          </div>
        )}

        {/* Question text */}
        <span className="flex-1 text-sm text-gray-700 flex items-center gap-1">
          {question.question}
          {scheduleInfo?.isScheduled && (
            <span
              className="text-slate-blue flex-shrink-0"
              title={`Scheduled ${scheduleInfo.frequency}`}
            >
              <Icon name="FaCalendarAlt" className="w-2.5 h-2.5" />
            </span>
          )}
        </span>

        {/* Right side - remove button (edit mode) OR citation status + expand indicator */}
        {isEditing ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="p-1 text-gray-600 hover:text-red-500 rounded transition-colors flex-shrink-0"
            title="Remove question"
            aria-label={`Remove question: ${question.question.substring(0, 50)}${question.question.length > 50 ? '...' : ''}`}
          >
            <Icon name="FaTimes" className="w-3 h-3" />
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mention status with provider badges */}
            {hasResults ? (
              <div className="flex items-center gap-1.5">
                {/* Show which providers mentioned */}
                {mentionedCount > 0 && (
                  <div className="flex items-center gap-0.5">
                    {Array.from(llmResults.entries())
                      .filter(([_, r]) => r.brandMentioned)
                      .map(([provider]) => {
                        const colors = LLM_PROVIDER_COLORS[provider as LLMProvider];
                        return (
                          <span
                            key={provider}
                            className={`px-1 py-0.5 rounded text-[9px] font-medium ${colors.bg} ${colors.text}`}
                            title={`${LLM_PROVIDER_LABELS[provider as LLMProvider]} mentioned your business`}
                          >
                            {LLM_PROVIDER_SHORT_LABELS[provider as LLMProvider]}
                          </span>
                        );
                      })}
                  </div>
                )}
                {/* Mention count badge */}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  mentionedCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {mentionedCount}/{totalProviders} mentioned
                </span>
              </div>
            ) : isChecking ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                <Icon name="FaClock" className="w-2.5 h-2.5" />
                Checking
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                Not checked
              </span>
            )}

            {/* Check button - always visible */}
            {onCheck && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCheck();
                }}
                disabled={isChecking}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-slate-blue rounded hover:bg-slate-blue/90 disabled:opacity-50 transition-colors"
                title="Check AI visibility"
                aria-label={`Check AI visibility for: ${question.question.substring(0, 50)}${question.question.length > 50 ? '...' : ''}`}
              >
                {isChecking ? (
                  <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                ) : (
                  <Icon name="FaSparkles" className="w-3 h-3" />
                )}
                Check
              </button>
            )}

            {/* Expand indicator */}
            {onToggleExpand && (
              <Icon
                name={isExpanded ? "FaChevronUp" : "FaChevronDown"}
                className="w-3 h-3 text-gray-600"
              />
            )}
          </div>
        )}
      </div>

      {/* Expanded content - AI visibility details */}
      {isExpanded && !isEditing && (
        <div className="p-3 bg-gray-50/50 space-y-3">
          {/* Check result message */}
          {checkResult && (
            <div className={`p-2 rounded-lg text-sm flex items-center gap-2 ${
              checkResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <Icon
                name={checkResult.success ? "FaCheckCircle" : "FaExclamationTriangle"}
                className="w-4 h-4 flex-shrink-0"
              />
              {checkResult.message}
            </div>
          )}

          {/* Provider results grid */}
          {selectedProviders.length > 0 && (
            <ProviderResultsGrid
              selectedProviders={selectedProviders}
              llmResults={llmResults}
            />
          )}

          {/* Last checked date (if no provider grid shown) */}
          {lastCheckedAt && selectedProviders.length === 0 && (
            <div className="text-xs text-gray-600">
              Last checked: {formatRelativeTime(lastCheckedAt)}
            </div>
          )}

          {/* Check/Re-check button */}
          {onCheck && (
            <div className="space-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCheck();
                }}
                disabled={isChecking || selectedProviders.length === 0}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isChecking ? (
                  <>
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                    Checking AI visibility...
                  </>
                ) : (
                  <>
                    <Icon name="FaSparkles" className="w-4 h-4" />
                    {hasResults ? 'Re-check' : 'Check'} AI visibility ({selectedProviders.length} {selectedProviders.length === 1 ? 'provider' : 'providers'})
                  </>
                )}
              </button>
              {totalCredits > 0 && (
                <p className="text-[10px] text-center text-gray-600">
                  Uses {totalCredits} credits
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Sub-component: provider results grid with stale result fading */
function ProviderResultsGrid({
  selectedProviders,
  llmResults,
}: {
  selectedProviders: LLMProvider[];
  llmResults?: Map<string, { domainCited: boolean; citationPosition?: number | null; checkedAt: string }>;
}) {
  // Determine the most recent checkedAt across all provider results
  const mostRecentCheckedAt = useMemo(() => {
    if (!llmResults || llmResults.size === 0) return null;
    let latest = 0;
    for (const result of llmResults.values()) {
      if (result.checkedAt) {
        const t = new Date(result.checkedAt).getTime();
        if (t > latest) latest = t;
      }
    }
    return latest > 0 ? latest : null;
  }, [llmResults]);

  const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
        AI visibility results
      </div>
      <div className="grid grid-cols-2 gap-2">
        {selectedProviders.map(provider => {
          const result = llmResults?.get(provider);
          const colors = LLM_PROVIDER_COLORS[provider];

          // Determine if this result is stale (>24h older than most recent)
          const isStale = !!(
            result?.checkedAt &&
            mostRecentCheckedAt &&
            mostRecentCheckedAt - new Date(result.checkedAt).getTime() > STALE_THRESHOLD_MS
          );

          return (
            <div
              key={provider}
              className={`p-2 rounded-lg border ${
                result?.domainCited
                  ? 'bg-green-50 border-green-200'
                  : result
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-gray-200'
              } ${isStale ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                  {LLM_PROVIDER_LABELS[provider]}
                </span>
              </div>
              {result ? (
                <div className="text-xs">
                  {result.domainCited ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <Icon name="FaCheckCircle" className="w-3 h-3" />
                      Cited{result.citationPosition ? ` (#${result.citationPosition})` : ''}
                    </span>
                  ) : (
                    <span className="text-gray-600">Not cited</span>
                  )}
                  {result.checkedAt && (
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      {formatRelativeTime(result.checkedAt)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-600">Not checked yet</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
