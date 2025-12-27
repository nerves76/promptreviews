'use client';

import Icon from '@/components/Icon';
import {
  type RankStatusResponse,
  type DiscoveredQuestion,
  getDiscoveredQuestions,
} from '../../hooks/useRankStatus';
import { type RelatedQuestion, type FunnelStage } from '../../keywordUtils';

export interface DiscoveredQuestionsSectionProps {
  /** The rank status containing discovered questions */
  rankStatus: RankStatusResponse | null;
  /** Current number of related questions */
  currentQuestionsCount: number;
  /** Maximum number of questions allowed */
  maxQuestions?: number;
  /** Callback when a question is added to tracked questions */
  onAddQuestion: (question: string, funnelStage: FunnelStage) => void;
  /** Current related questions to check for duplicates */
  existingQuestions?: RelatedQuestion[];
}

/**
 * DiscoveredQuestionsSection Component
 *
 * Displays PAA (People Also Ask) questions discovered from Google SERPs.
 * Users can click to add these questions to their tracked questions.
 */
export function DiscoveredQuestionsSection({
  rankStatus,
  currentQuestionsCount,
  maxQuestions = 20,
  onAddQuestion,
  existingQuestions = [],
}: DiscoveredQuestionsSectionProps) {
  // Get deduplicated discovered questions
  const discoveredQuestions = getDiscoveredQuestions(rankStatus);

  // Don't render if no discovered questions
  if (discoveredQuestions.length === 0) {
    return null;
  }

  const limitReached = currentQuestionsCount >= maxQuestions;

  // Filter out questions that already exist in the tracked questions
  const existingQuestionTexts = new Set(
    existingQuestions.map((q) => q.question.toLowerCase())
  );
  const newQuestions = discoveredQuestions.filter(
    (q) => !existingQuestionTexts.has(q.question.toLowerCase())
  );

  // If all discovered questions are already added, don't show the section
  if (newQuestions.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm border border-amber-100/50 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="FaLightbulb" className="w-4 h-4 text-amber-600" />
        <span className="text-xs font-medium uppercase tracking-wider text-amber-600">
          Questions from Google
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Questions people ask related to this keyword.
        {!limitReached && ' Click to add to your tracked questions.'}
      </p>

      {limitReached && (
        <div className="mb-3 px-2 py-1.5 bg-amber-100/80 border border-amber-200/50 rounded-lg text-xs text-amber-700">
          Limit reached (20 questions max)
        </div>
      )}

      <div className="space-y-2">
        {newQuestions.map((q) => (
          <DiscoveredQuestionItem
            key={q.question}
            question={q}
            onAdd={() => onAddQuestion(q.question, 'middle')}
            disabled={limitReached}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual discovered question item
 */
function DiscoveredQuestionItem({
  question,
  onAdd,
  disabled,
}: {
  question: DiscoveredQuestion;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onAdd}
      disabled={disabled}
      className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
        disabled
          ? 'bg-gray-50/80 border-gray-200/50 cursor-not-allowed opacity-60'
          : 'bg-white/80 border-gray-200/50 hover:border-amber-300 hover:bg-amber-50/50'
      }`}
      aria-label={`Add question: ${question.question}`}
    >
      <div className="flex items-start gap-2">
        <Icon
          name={disabled ? 'FaQuestionCircle' : 'FaPlus'}
          className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
            disabled ? 'text-gray-400' : 'text-amber-500'
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">{question.question}</p>
          {question.answerDomain && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  question.isOurs ? 'bg-green-400' : 'bg-gray-300'
                }`}
              />
              {question.answerDomain}
              {question.isOurs && (
                <span className="text-green-600 font-medium">(You)</span>
              )}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export default DiscoveredQuestionsSection;
