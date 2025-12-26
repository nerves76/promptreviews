'use client';

import Icon from '@/components/Icon';
import {
  type RelatedQuestion,
  type FunnelStage,
  getFunnelStageColor,
} from '../keywordUtils';
import {
  type LLMProvider,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
} from '@/features/llm-visibility/utils/types';

/**
 * QuestionRow Component
 *
 * Renders a single AI visibility question with:
 * - Question text
 * - Funnel stage badge (editable dropdown in edit mode)
 * - LLM citation status (X/Y cited) with appropriate colors
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
}: QuestionRowProps) {
  const funnelColor = getFunnelStageColor(question.funnelStage);

  // Calculate citation stats
  const hasResults = llmResults && llmResults.size > 0;
  const citedCount = hasResults
    ? Array.from(llmResults.values()).filter(r => r.domainCited).length
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
        <span className="flex-1 text-sm text-gray-700">{question.question}</span>

        {/* Right side - remove button (edit mode) OR citation status + expand indicator */}
        {isEditing ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
            title="Remove question"
          >
            <Icon name="FaTimes" className="w-3 h-3" />
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Citation status badge */}
            {hasResults ? (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                citedCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {citedCount}/{totalProviders} cited
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400">
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
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                title="Check AI visibility"
              >
                {isChecking ? (
                  <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                ) : (
                  <Icon name="FaSearch" className="w-3 h-3" />
                )}
                Check
              </button>
            )}

            {/* Expand indicator */}
            {onToggleExpand && (
              <Icon
                name={isExpanded ? "FaChevronUp" : "FaChevronDown"}
                className="w-3 h-3 text-gray-400"
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
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                AI visibility results
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedProviders.map(provider => {
                  const result = llmResults?.get(provider);
                  const colors = LLM_PROVIDER_COLORS[provider];

                  return (
                    <div
                      key={provider}
                      className={`p-2 rounded-lg border ${
                        result?.domainCited
                          ? 'bg-green-50 border-green-200'
                          : result
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white border-gray-200'
                      }`}
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
                            <span className="text-gray-500">Not cited</span>
                          )}
                          {result.checkedAt && (
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(result.checkedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">Not checked yet</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Last checked date (if no provider grid shown) */}
          {lastCheckedAt && selectedProviders.length === 0 && (
            <div className="text-xs text-gray-500">
              Last checked: {new Date(lastCheckedAt).toLocaleDateString()}
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
                className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isChecking ? (
                  <>
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                    Checking AI visibility...
                  </>
                ) : (
                  <>
                    <Icon name="prompty" className="w-4 h-4" />
                    {hasResults ? 'Re-check' : 'Check'} AI visibility ({selectedProviders.length} {selectedProviders.length === 1 ? 'provider' : 'providers'})
                  </>
                )}
              </button>
              {totalCredits > 0 && (
                <p className="text-[10px] text-center text-gray-400">
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
