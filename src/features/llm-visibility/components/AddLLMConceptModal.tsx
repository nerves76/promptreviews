'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

interface Question {
  question: string;
  funnelStage: 'top' | 'middle' | 'bottom';
}

interface AddLLMConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; questions: Question[] }) => Promise<void>;
}

const FUNNEL_OPTIONS = [
  { value: 'top', label: 'Top', description: 'Awareness stage' },
  { value: 'middle', label: 'Middle', description: 'Consideration stage' },
  { value: 'bottom', label: 'Bottom', description: 'Decision stage' },
] as const;

/**
 * Modal for adding a keyword concept with LLM questions from the LLM visibility page.
 * Supports adding multiple questions with funnel stages.
 */
export function AddLLMConceptModal({
  isOpen,
  onClose,
  onAdd,
}: AddLLMConceptModalProps) {
  const [name, setName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([{ question: '', funnelStage: 'top' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], question: value };
    setQuestions(newQuestions);
  };

  const handleFunnelChange = (index: number, value: 'top' | 'middle' | 'bottom') => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], funnelStage: value };
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, { question: '', funnelStage: 'top' }]);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a concept name');
      return;
    }

    const validQuestions = questions.filter(q => q.question.trim().length > 0);
    if (validQuestions.length === 0) {
      setError('Please enter at least one question');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({
        name: name.trim(),
        questions: validQuestions.map(q => ({
          question: q.question.trim(),
          funnelStage: q.funnelStage,
        })),
      });
      // Reset form
      setName('');
      setQuestions([{ question: '', funnelStage: 'top' }]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add concept');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setQuestions([{ question: '', funnelStage: 'top' }]);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add LLM concept</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <Icon name="FaTimes" className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Concept name */}
          <div>
            <label htmlFor="concept-name" className="block text-sm font-medium text-gray-700 mb-1">
              Concept name
            </label>
            <input
              id="concept-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              placeholder="e.g., Portland marketing services"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/50 transition-all"
              maxLength={50}
              autoFocus
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                A short name to identify this concept
              </p>
              <span className={`text-xs ${name.length >= 45 ? 'text-amber-600' : 'text-gray-400'}`}>
                {name.length}/50
              </span>
            </div>
          </div>

          {/* Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Questions to track
            </label>
            <div className="space-y-3">
              {questions.map((q, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                        placeholder={index === 0 ? "e.g., What's the best marketing agency in Portland?" : "Add another question..."}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/50 transition-all text-sm"
                      />
                    </div>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove question"
                      >
                        <Icon name="FaTimes" className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Funnel stage selector */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Funnel stage:</span>
                    <div className="flex gap-1">
                      {FUNNEL_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleFunnelChange(index, option.value)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            q.funnelStage === option.value
                              ? option.value === 'top'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : option.value === 'middle'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={option.description}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Questions people might ask AI about your services
              </p>
              {questions.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-xs text-slate-blue hover:text-slate-blue/80 flex items-center gap-1 transition-colors"
                >
                  <Icon name="FaPlus" className="w-3 h-3" />
                  Add another
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Icon name="FaPlus" className="w-4 h-4" />
                  Add concept
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLLMConceptModal;
