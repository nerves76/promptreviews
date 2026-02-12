'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { QuestionEditor } from './QuestionEditor';
import { SurveyQuestion, QuestionType } from '../types';

type EditableQuestion = Omit<SurveyQuestion, 'id' | 'survey_id' | 'created_at' | 'updated_at'> & { id?: string };

interface SurveyBuilderProps {
  questions: EditableQuestion[];
  onChange: (questions: EditableQuestion[]) => void;
}

const DEFAULT_QUESTION: Omit<EditableQuestion, 'position'> = {
  question_type: 'text',
  question_text: '',
  description: null,
  is_required: false,
  options: [],
  allow_other: false,
  rating_min: 1,
  rating_max: 5,
  rating_labels: {},
  text_max_length: 1000,
  text_placeholder: null,
};

export function SurveyBuilder({ questions, onChange }: SurveyBuilderProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const addQuestion = useCallback((type: QuestionType) => {
    const newQuestion: EditableQuestion = {
      ...DEFAULT_QUESTION,
      question_type: type,
      position: questions.length,
      options: (type === 'multiple_choice_single' || type === 'multiple_choice_multi')
        ? ['Option 1', 'Option 2']
        : [],
    };
    onChange([...questions, newQuestion]);
    setAddMenuOpen(false);
  }, [questions, onChange]);

  const updateQuestion = useCallback((index: number, updated: EditableQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updated;
    onChange(newQuestions);
  }, [questions, onChange]);

  const removeQuestion = useCallback((index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    // Re-index positions
    onChange(newQuestions.map((q, i) => ({ ...q, position: i })));
  }, [questions, onChange]);

  const moveQuestion = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    // Re-index positions
    onChange(newQuestions.map((q, i) => ({ ...q, position: i })));
  }, [questions, onChange]);

  return (
    <div className="space-y-4">
      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <Icon name="FaFileAlt" size={32} className="mx-auto mb-2 text-gray-300" />
          <p>No questions yet. Add your first question below.</p>
        </div>
      )}

      {questions.map((question, index) => (
        <div key={index} className="relative">
          {/* Move buttons */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <button
              onClick={() => moveQuestion(index, 'up')}
              disabled={index === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move question up"
            >
              <Icon name="FaChevronUp" size={12} />
            </button>
            <button
              onClick={() => moveQuestion(index, 'down')}
              disabled={index === questions.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move question down"
            >
              <Icon name="FaChevronDown" size={12} />
            </button>
          </div>

          <QuestionEditor
            question={question}
            onChange={(updated) => updateQuestion(index, updated)}
            onRemove={() => removeQuestion(index)}
            index={index}
          />
        </div>
      ))}

      {/* Add question */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setAddMenuOpen(!addMenuOpen)}
          className="w-full"
        >
          <Icon name="FaPlus" size={14} className="mr-2" />
          Add question
        </Button>

        {addMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {(Object.entries({
              text: 'Free text',
              rating_star: 'Star rating',
              rating_number: 'Number rating',
              multiple_choice_single: 'Multiple choice (single)',
              multiple_choice_multi: 'Multiple choice (multi)',
            }) as [QuestionType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => addQuestion(type)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 first:rounded-t-lg"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => addQuestion('section_header')}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 rounded-b-lg text-gray-500"
            >
              <Icon name="FaMinus" size={10} className="inline mr-2" />
              Section header
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
