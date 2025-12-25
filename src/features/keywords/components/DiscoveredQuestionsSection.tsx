'use client';

import Icon from '@/components/Icon';
import { type RelatedQuestion } from '../keywordUtils';

/**
 * Represents a question discovered from SERP (People Also Ask, etc.)
 */
export interface DiscoveredQuestion {
  question: string;
  answerDomain: string | null;
  isOurs: boolean;
}

interface DiscoveredQuestionsSectionProps {
  discoveredQuestions: DiscoveredQuestion[];
  existingQuestions: RelatedQuestion[];
  maxQuestions?: number;
  isEditingQuestions?: boolean;
  onAddQuestion: (question: string) => void;
}

/**
 * Displays discovered PAA (People Also Ask) questions from Google SERP.
 *
 * Features:
 * - Shows questions with amber/orange theme styling
 * - Clickable questions to add to tracked questions
 * - Shows checkmark icon if question is already saved
 * - Shows "You answer this!" badge if isOurs is true
 * - Respects max questions limit (default 20)
 * - Disables adding when in editing mode
 */
export function DiscoveredQuestionsSection({
  discoveredQuestions,
  existingQuestions,
  maxQuestions = 20,
  isEditingQuestions = false,
  onAddQuestion,
}: DiscoveredQuestionsSectionProps) {
  const currentCount = existingQuestions.length;
  const limitReached = currentCount >= maxQuestions;

  // Deduplicate questions
  const uniqueQuestions = Array.from(
    new Map(discoveredQuestions.map(q => [q.question, q])).values()
  ).slice(0, 8);

  if (uniqueQuestions.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm border border-amber-100/50 rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon name="FaLightbulb" className="w-4 h-4 text-amber-600" />
        <span className="text-xs font-medium uppercase tracking-wider text-amber-600">
          Questions from Google
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 mb-3">
        Questions people ask related to this keyword.
        {!limitReached && ' Click to add to your tracked questions.'}
      </p>

      {/* Limit reached warning */}
      {limitReached && (
        <div className="mb-3 px-2 py-1.5 bg-amber-100/80 border border-amber-200/50 rounded-lg text-xs text-amber-700">
          Limit reached ({maxQuestions} questions max)
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-2">
        {uniqueQuestions.map((q, idx) => {
          const isAlreadySaved = existingQuestions.some(rq => rq.question === q.question);
          const canAdd = !isAlreadySaved && !limitReached && !isEditingQuestions;

          return (
            <div
              key={idx}
              className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                isAlreadySaved
                  ? 'bg-green-50/80 border border-green-100/50'
                  : canAdd
                    ? 'bg-white/60 hover:bg-white/80 cursor-pointer'
                    : 'bg-white/40 opacity-60'
              }`}
              onClick={() => {
                if (canAdd) {
                  onAddQuestion(q.question);
                }
              }}
            >
              <Icon
                name={isAlreadySaved ? "FaCheckCircle" : "FaQuestionCircle"}
                className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                  isAlreadySaved ? 'text-green-500' : 'text-amber-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-700">{q.question}</span>
                {q.isOurs && (
                  <span className="ml-2 text-xs text-green-600 font-medium">
                    You answer this!
                  </span>
                )}
              </div>
              {canAdd && (
                <Icon name="FaPlus" className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
