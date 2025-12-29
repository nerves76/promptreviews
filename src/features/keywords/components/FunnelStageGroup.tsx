'use client';

import { type FunnelStage, type RelatedQuestion, getFunnelStageColor } from '../keywordUtils';
import { type LLMProvider } from '@/features/llm-visibility/utils/types';
import { QuestionRow } from './QuestionRow';

/**
 * Props for FunnelStageGroup component
 */
export interface FunnelStageGroupProps {
  /** The funnel stage being rendered (top/middle/bottom) */
  stage: FunnelStage;
  /** Questions for this stage with their original indices */
  questions: Array<RelatedQuestion & { originalIndex: number }>;
  /** Map of question text -> provider -> LLM visibility results */
  llmResultsMap: Map<string, Map<string, {
    domainCited: boolean;
    citationPosition?: number | null;
    checkedAt: string;
  }>>;
  /** Whether in edit mode */
  isEditing?: boolean;
  /** Index of currently expanded question for details */
  expandedIndex?: number | null;
  /** Callback to toggle question expansion */
  onToggleExpand?: (index: number) => void;
  /** Callback to remove a question */
  onRemoveQuestion?: (index: number) => void;
  /** Callback to update question's funnel stage */
  onUpdateFunnel?: (index: number, stage: FunnelStage) => void;
  /** Callback to check LLM visibility for a question */
  onCheckQuestion?: (index: number, question: string) => void;
  /** Index of question currently being checked */
  checkingIndex?: number | null;
  /** Selected LLM providers for visibility checks */
  selectedProviders?: LLMProvider[];
  /** Check result for a specific question (indexed by question index) */
  checkResult?: { questionIndex: number; success: boolean; message: string } | null;
}

/**
 * Stage metadata for display
 */
interface StageMetadata {
  label: string;
  description: string;
}

const STAGE_METADATA: Record<FunnelStage, StageMetadata> = {
  top: { label: 'Top of funnel', description: 'Awareness' },
  middle: { label: 'Middle of funnel', description: 'Consideration' },
  bottom: { label: 'Bottom of funnel', description: 'Decision' },
};

/**
 * FunnelStageGroup Component
 *
 * Renders a group of questions for a specific funnel stage.
 * Used by both KeywordDetailsSidebar and ConceptCard to display
 * related questions grouped by awareness/consideration/decision stages.
 */
export function FunnelStageGroup({
  stage,
  questions,
  llmResultsMap,
  isEditing = false,
  expandedIndex = null,
  onToggleExpand,
  onRemoveQuestion,
  onUpdateFunnel,
  onCheckQuestion,
  checkingIndex = null,
  selectedProviders = [],
  checkResult = null,
}: FunnelStageGroupProps) {
  // Don't render if no questions for this stage
  if (questions.length === 0) {
    return null;
  }

  const { label, description } = STAGE_METADATA[stage];
  const funnelColor = getFunnelStageColor(stage);

  return (
    <div className="space-y-1.5">
      {/* Stage header */}
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 text-xs rounded ${funnelColor.bg} ${funnelColor.text}`}>
          {label}
        </span>
        <span className="text-xs text-gray-500">{description}</span>
      </div>

      {/* Questions list with left border */}
      <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
        {questions.map((question) => (
          <QuestionRow
            key={question.originalIndex}
            question={question}
            index={question.originalIndex}
            llmResults={llmResultsMap.get(question.question)}
            isEditing={isEditing}
            isExpanded={expandedIndex === question.originalIndex}
            onToggleExpand={onToggleExpand ? () => onToggleExpand(question.originalIndex) : undefined}
            onRemove={onRemoveQuestion ? () => onRemoveQuestion(question.originalIndex) : undefined}
            onUpdateFunnel={onUpdateFunnel ? (newStage) => onUpdateFunnel(question.originalIndex, newStage) : undefined}
            onCheck={onCheckQuestion ? () => onCheckQuestion(question.originalIndex, question.question) : undefined}
            isChecking={checkingIndex === question.originalIndex}
            selectedProviders={selectedProviders}
            checkResult={checkResult?.questionIndex === question.originalIndex ? checkResult : null}
          />
        ))}
      </div>
    </div>
  );
}
