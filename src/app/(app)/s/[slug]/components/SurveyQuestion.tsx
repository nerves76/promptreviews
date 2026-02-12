'use client';

import { RatingInput } from './RatingInput';
import { MultipleChoiceInput } from './MultipleChoiceInput';
import { TextInput } from './TextInput';

interface SurveyQuestionProps {
  question: any;
  value: any;
  onChange: (value: any) => void;
  textColor: string;
  inputColor: string;
  inputBg: string;
  innerShadow: string;
  placeholderColor: string;
  index: number;
}

export function SurveyQuestion({ question, value, onChange, textColor, inputColor, inputBg, innerShadow, placeholderColor, index }: SurveyQuestionProps) {
  // Section header — render as styled divider heading
  if (question.question_type === 'section_header') {
    return (
      <div className="pt-4 pb-2">
        <div className="border-b pb-2 mb-1" style={{ borderColor: `${textColor}20` }}>
          <h3 className="text-lg font-bold" style={{ color: textColor }}>
            {question.question_text}
          </h3>
        </div>
        {question.description && (
          <p className="text-sm opacity-70" style={{ color: textColor }}>
            {question.description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block font-medium mb-2" style={{ color: textColor }}>
        {question.question_text}
        {question.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm mb-3 opacity-70" style={{ color: textColor }}>
          {question.description}
        </p>
      )}

      {question.question_type === 'text' && (
        <TextInput
          value={value || ''}
          onChange={onChange}
          placeholder={question.text_placeholder || ''}
          maxLength={question.text_max_length || 1000}
          inputColor={inputColor}
          inputBg={inputBg}
          innerShadow={innerShadow}
          placeholderColor={placeholderColor}
        />
      )}

      {(question.question_type === 'rating_star' || question.question_type === 'rating_number') && (
        <RatingInput
          type={question.question_type === 'rating_star' ? 'star' : 'number'}
          value={value}
          onChange={onChange}
          min={question.rating_min || 1}
          max={question.rating_max || 5}
          labels={question.rating_labels || {}}
          textColor={textColor}
          inputBg={inputBg}
        />
      )}

      {(question.question_type === 'multiple_choice_single' || question.question_type === 'multiple_choice_multi') && (
        <MultipleChoiceInput
          options={question.options || []}
          multi={question.question_type === 'multiple_choice_multi'}
          allowOther={question.allow_other}
          value={value}
          onChange={onChange}
          textColor={textColor}
          inputColor={inputColor}
          inputBg={inputBg}
          innerShadow={innerShadow}
          placeholderColor={placeholderColor}
        />
      )}
    </div>
  );
}
