'use client';

import Icon from '@/components/Icon';
import { SurveyTemplate } from '../types';

interface SurveyTemplateCardProps {
  template: SurveyTemplate;
  onSelect: (template: SurveyTemplate) => void;
}

export function SurveyTemplateCard({ template, onSelect }: SurveyTemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-slate-blue hover:bg-slate-blue/5 transition-all text-left w-full"
    >
      <div className="w-9 h-9 rounded-lg bg-slate-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon name="FaFileAlt" size={16} className="text-slate-blue" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{template.name}</h3>
        {template.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {template.questions.length} question{template.questions.length !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  );
}
