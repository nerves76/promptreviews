import { useState, useCallback } from 'react';
import { type RelatedQuestion, type FunnelStage } from '../keywordUtils';

interface UseRelatedQuestionsOptions {
  /** Initial questions to populate */
  initialQuestions?: RelatedQuestion[];
  /** Maximum number of questions allowed */
  maxQuestions?: number;
  /** Callback when questions change */
  onChange?: (questions: RelatedQuestion[]) => void;
}

interface UseRelatedQuestionsReturn {
  /** Current list of questions */
  questions: RelatedQuestion[];
  /** Set questions directly */
  setQuestions: (questions: RelatedQuestion[]) => void;
  /** New question text input value */
  newQuestionText: string;
  /** Set new question text */
  setNewQuestionText: (text: string) => void;
  /** Funnel stage for new question */
  newQuestionFunnel: FunnelStage;
  /** Set funnel stage for new question */
  setNewQuestionFunnel: (stage: FunnelStage) => void;
  /** Add a new question */
  addQuestion: () => boolean;
  /** Remove a question by index */
  removeQuestion: (index: number) => void;
  /** Update funnel stage of a question */
  updateQuestionFunnel: (index: number, stage: FunnelStage) => void;
  /** Check if at max capacity */
  isAtLimit: boolean;
  /** Reset to initial state */
  reset: (questions?: RelatedQuestion[]) => void;
}

/**
 * Hook for managing related questions with funnel stages.
 * Extracts common logic from KeywordConceptInput and KeywordDetailsSidebar.
 */
export function useRelatedQuestions({
  initialQuestions = [],
  maxQuestions = 20,
  onChange,
}: UseRelatedQuestionsOptions = {}): UseRelatedQuestionsReturn {
  const [questions, setQuestionsInternal] = useState<RelatedQuestion[]>(initialQuestions);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionFunnel, setNewQuestionFunnel] = useState<FunnelStage>('middle');

  const setQuestions = useCallback((newQuestions: RelatedQuestion[]) => {
    setQuestionsInternal(newQuestions);
    onChange?.(newQuestions);
  }, [onChange]);

  const addQuestion = useCallback((): boolean => {
    const trimmed = newQuestionText.trim();
    if (!trimmed || questions.length >= maxQuestions) {
      return false;
    }

    // Check for duplicates
    if (questions.some(q => q.question.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }

    const newQuestion: RelatedQuestion = {
      question: trimmed,
      funnelStage: newQuestionFunnel,
      addedAt: new Date().toISOString(),
    };

    const updated = [...questions, newQuestion];
    setQuestionsInternal(updated);
    setNewQuestionText('');
    onChange?.(updated);
    return true;
  }, [newQuestionText, newQuestionFunnel, questions, maxQuestions, onChange]);

  const removeQuestion = useCallback((index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestionsInternal(updated);
    onChange?.(updated);
  }, [questions, onChange]);

  const updateQuestionFunnel = useCallback((index: number, stage: FunnelStage) => {
    const updated = questions.map((q, i) =>
      i === index ? { ...q, funnelStage: stage } : q
    );
    setQuestionsInternal(updated);
    onChange?.(updated);
  }, [questions, onChange]);

  const reset = useCallback((newQuestions: RelatedQuestion[] = []) => {
    setQuestionsInternal(newQuestions);
    setNewQuestionText('');
    setNewQuestionFunnel('middle');
  }, []);

  return {
    questions,
    setQuestions,
    newQuestionText,
    setNewQuestionText,
    newQuestionFunnel,
    setNewQuestionFunnel,
    addQuestion,
    removeQuestion,
    updateQuestionFunnel,
    isAtLimit: questions.length >= maxQuestions,
    reset,
  };
}

export default useRelatedQuestions;
