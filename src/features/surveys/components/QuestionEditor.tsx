'use client';

import { useState } from 'react';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { SurveyQuestion, QuestionType, QUESTION_TYPE_LABELS } from '../types';

type EditableQuestion = Omit<SurveyQuestion, 'id' | 'survey_id' | 'created_at' | 'updated_at'> & { id?: string };

interface QuestionEditorProps {
  question: EditableQuestion;
  onChange: (question: EditableQuestion) => void;
  onRemove: () => void;
  index: number;
}

export function QuestionEditor({ question, onChange, onRemove, index }: QuestionEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateField = (field: string, value: any) => {
    onChange({ ...question, [field]: value });
  };

  const isMultipleChoice = question.question_type === 'multiple_choice_single' || question.question_type === 'multiple_choice_multi';
  const isRating = question.question_type === 'rating_star' || question.question_type === 'rating_number';

  // Section header — simplified editor
  if (question.question_type === 'section_header') {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/50">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-medium text-gray-500">Section header</span>
          <button
            onClick={onRemove}
            className="text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Remove section header"
          >
            <Icon name="FaTrash" size={14} />
          </button>
        </div>
        <input
          type="text"
          value={question.question_text}
          onChange={(e) => updateField('question_text', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-base font-semibold focus:ring-2 focus:ring-slate-blue focus:border-transparent mb-2"
          placeholder="Section title"
          aria-label="Section title"
        />
        <input
          type="text"
          value={question.description || ''}
          onChange={(e) => updateField('description', e.target.value || null)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          placeholder="Section description (optional)"
          aria-label="Section description"
        />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-4">
        <span className="text-base font-semibold text-gray-900">Question {index + 1}</span>
        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-red-500 transition-colors"
          aria-label={`Remove question ${index + 1}`}
        >
          <Icon name="FaTrash" size={14} />
        </button>
      </div>

      {/* Question type */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Question type</label>
        <select
          value={question.question_type}
          onChange={(e) => updateField('question_type', e.target.value as QuestionType)}
          className="inline-block w-auto px-3 py-1.5 bg-gray-100 border-0 rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 focus:outline-none transition-colors appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
        >
          {Object.entries(QUESTION_TYPE_LABELS)
            .filter(([value]) => value !== 'section_header')
            .map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
        </select>
      </div>

      {/* Question text */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Question text</label>
        <input
          type="text"
          value={question.question_text}
          onChange={(e) => updateField('question_text', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          placeholder="Enter your question..."
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
        <input
          type="text"
          value={question.description || ''}
          onChange={(e) => updateField('description', e.target.value || null)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          placeholder="Add context or instructions..."
        />
      </div>

      {/* Required toggle */}
      <div className="mb-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={question.is_required}
            onChange={(e) => updateField('is_required', e.target.checked)}
            className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
          />
          <span className="text-gray-700">Required</span>
        </label>
      </div>

      {/* Multiple choice options */}
      {isMultipleChoice && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
          {(question.options || []).map((option, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...(question.options || [])];
                  newOptions[i] = e.target.value;
                  updateField('options', newOptions);
                }}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
              />
              <button
                onClick={() => {
                  const newOptions = (question.options || []).filter((_, idx) => idx !== i);
                  updateField('options', newOptions);
                }}
                className="text-gray-500 hover:text-red-500"
                aria-label={`Remove option ${i + 1}`}
              >
                <Icon name="FaTimes" size={12} />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateField('options', [...(question.options || []), ''])}
          >
            <Icon name="FaPlus" size={12} className="mr-1" /> Add option
          </Button>

          <div className="mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={question.allow_other}
                onChange={(e) => updateField('allow_other', e.target.checked)}
                className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
              />
              <span className="text-gray-700">Allow &quot;Other&quot; option</span>
            </label>
          </div>
        </div>
      )}

      {/* Rating settings */}
      {isRating && (
        <div className="mb-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min</label>
              <input
                type="number"
                value={question.rating_min}
                onChange={(e) => updateField('rating_min', parseInt(e.target.value, 10))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                min={0}
                max={question.rating_max - 1}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
              <input
                type="number"
                value={question.rating_max}
                onChange={(e) => updateField('rating_max', parseInt(e.target.value, 10))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                min={question.rating_min + 1}
                max={10}
              />
            </div>
          </div>
        </div>
      )}

      {/* Text settings */}
      {question.question_type === 'text' && (
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-slate-blue hover:underline mb-2"
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced options
        </button>
      )}
      {question.question_type === 'text' && showAdvanced && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder text</label>
            <input
              type="text"
              value={question.text_placeholder || ''}
              onChange={(e) => updateField('text_placeholder', e.target.value || null)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              placeholder="e.g., Type your answer here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max length</label>
            <input
              type="number"
              value={question.text_max_length}
              onChange={(e) => updateField('text_max_length', parseInt(e.target.value, 10))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              min={10}
              max={5000}
            />
          </div>
        </div>
      )}
    </div>
  );
}
