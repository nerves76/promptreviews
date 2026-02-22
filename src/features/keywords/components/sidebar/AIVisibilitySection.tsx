'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { type KeywordData, type RelatedQuestion, type FunnelStage } from '../../keywordUtils';
import { FunnelStageGroup } from '../FunnelStageGroup';
import { type LLMProvider } from '@/features/llm-visibility/utils/types';

const MAX_QUESTIONS = 20;

export interface AIVisibilitySectionProps {
  /** The keyword being displayed */
  keyword: KeywordData;
  /** Whether in edit mode */
  isEditing: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Callback to start editing */
  onStartEditing: () => void;
  /** Callback to save changes */
  onSave: () => Promise<void>;
  /** Callback to cancel editing */
  onCancel: () => void;

  // AI visibility questions
  /** The edited questions */
  editedQuestions: RelatedQuestion[];
  /** New question text input */
  newQuestionText: string;
  /** Callback when new question text changes */
  onNewQuestionTextChange: (value: string) => void;
  /** New question funnel stage */
  newQuestionFunnel: FunnelStage;
  /** Callback when new question funnel changes */
  onNewQuestionFunnelChange: (stage: FunnelStage) => void;
  /** Callback to add a question */
  onAddQuestion: () => void;
  /** Callback to remove a question */
  onRemoveQuestion: (index: number) => void;
  /** Callback to update question funnel stage */
  onUpdateQuestionFunnel: (index: number, stage: FunnelStage) => void;

  // LLM checking
  /** Selected LLM providers */
  selectedLLMProviders: LLMProvider[];
  /** Map of question to LLM results */
  questionLLMMap: Map<string, Map<string, { domainCited: boolean; brandMentioned: boolean; citationPosition?: number | null; checkedAt: string }>>;
  /** Index of question being checked */
  checkingQuestionIndex: number | null;
  /** Callback to check a question */
  onCheckQuestion: (index: number) => void;
  /** Last check result */
  lastCheckResult: { questionIndex: number; success: boolean; message: string } | null;
  // Question expansion
  /** Index of expanded question */
  expandedQuestionIndex: number | null;
  /** Callback to toggle question expansion */
  onToggleQuestionExpand: (index: number | null) => void;
  /** Whether section is initially collapsed (default: false) */
  defaultCollapsed?: boolean;
}

/**
 * AIVisibilitySection Component
 *
 * Displays and allows editing of AI visibility questions
 * grouped by funnel stage, with LLM checking capabilities.
 */
export function AIVisibilitySection({
  keyword,
  isEditing,
  isSaving,
  onStartEditing,
  onSave,
  onCancel,
  editedQuestions,
  newQuestionText,
  onNewQuestionTextChange,
  newQuestionFunnel,
  onNewQuestionFunnelChange,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestionFunnel,
  selectedLLMProviders,
  questionLLMMap,
  checkingQuestionIndex,
  onCheckQuestion,
  lastCheckResult,
  expandedQuestionIndex,
  onToggleQuestionExpand,
  defaultCollapsed = false,
}: AIVisibilitySectionProps) {
  const questionsAtLimit = editedQuestions.length >= MAX_QUESTIONS;
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Expand when editing starts
  useEffect(() => {
    if (isEditing) {
      setIsCollapsed(false);
    }
  }, [isEditing]);

  // Get display questions (edited if editing, otherwise from keyword)
  const displayQuestions = isEditing ? editedQuestions : keyword.relatedQuestions;

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden">
      {/* Section header - clickable to collapse */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer select-none"
        onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Icon name="FaRobot" className="w-5 h-5 text-slate-blue" />
          <span className="text-lg font-semibold text-gray-800">AI visibility</span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing();
                }}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit AI visibility section"
                aria-label="Edit AI visibility section"
              >
                <Icon name="FaEdit" className="w-4 h-4" />
              </button>
              <Icon
                name="FaChevronDown"
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                  isCollapsed ? '' : 'rotate-180'
                }`}
              />
            </>
          ) : (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onCancel}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-2.5 py-1 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1"
              >
                {isSaving && <Icon name="FaSpinner" className="w-2.5 h-2.5 animate-spin" />}
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="px-5 py-5 space-y-5 border-t border-gray-100">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              AI visibility questions
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Questions to track your visibility in AI search results.
            </p>

            {/* Questions list - grouped by funnel stage */}
            <div className="space-y-3 mb-3">
              {(() => {
                if (!displayQuestions || displayQuestions.length === 0) {
                  if (!isEditing) {
                    return (
                      <div className="text-sm text-gray-600 italic bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
                        No questions added
                      </div>
                    );
                  }
                  return null;
                }

                // Group questions by funnel stage
                const grouped = {
                  top: displayQuestions
                    .map((q, idx) => ({ ...q, originalIndex: idx }))
                    .filter((q) => q.funnelStage === 'top'),
                  middle: displayQuestions
                    .map((q, idx) => ({ ...q, originalIndex: idx }))
                    .filter((q) => q.funnelStage === 'middle'),
                  bottom: displayQuestions
                    .map((q, idx) => ({ ...q, originalIndex: idx }))
                    .filter((q) => q.funnelStage === 'bottom'),
                };

                return (['top', 'middle', 'bottom'] as const).map((stage) => (
                  <FunnelStageGroup
                    key={stage}
                    stage={stage}
                    questions={grouped[stage]}
                    llmResultsMap={questionLLMMap}
                    isEditing={isEditing}
                    expandedIndex={expandedQuestionIndex}
                    onToggleExpand={(idx) =>
                      onToggleQuestionExpand(expandedQuestionIndex === idx ? null : idx)
                    }
                    onRemoveQuestion={onRemoveQuestion}
                    onUpdateFunnel={onUpdateQuestionFunnel}
                    onCheckQuestion={onCheckQuestion}
                    checkingIndex={checkingQuestionIndex}
                    selectedProviders={selectedLLMProviders}
                    checkResult={lastCheckResult}
                  />
                ));
              })()}
            </div>

            {/* Add new question (edit mode) */}
            {isEditing && !questionsAtLimit && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => onNewQuestionTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddQuestion();
                    }
                  }}
                  placeholder="Type your question..."
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                  aria-label="New AI visibility question"
                />
                <div className="flex items-center gap-2">
                  <div className="relative group flex-1">
                    <select
                      value={newQuestionFunnel}
                      onChange={(e) => onNewQuestionFunnelChange(e.target.value as FunnelStage)}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 cursor-help"
                    >
                      <option value="top">Top (awareness)</option>
                      <option value="middle">Middle (consideration)</option>
                      <option value="bottom">Bottom (decision)</option>
                    </select>
                    <div className="absolute bottom-full left-0 mb-1 p-2 bg-gray-900 text-white text-xs rounded w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      <div className="font-semibold mb-1">Marketing funnel stage</div>
                      <div className="space-y-0.5">
                        <div>
                          <span className="text-blue-300">Top:</span> Awareness - broad, educational
                          questions
                        </div>
                        <div>
                          <span className="text-amber-300">Middle:</span> Consideration - comparison
                          questions
                        </div>
                        <div>
                          <span className="text-green-300">Bottom:</span> Decision - purchase-intent
                          questions
                        </div>
                      </div>
                      <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                  <button
                    onClick={onAddQuestion}
                    disabled={!newQuestionText.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    Add question
                  </button>
                </div>
              </div>
            )}
            {isEditing && questionsAtLimit && (
              <p className="text-xs text-amber-600">Maximum of {MAX_QUESTIONS} questions reached</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIVisibilitySection;
