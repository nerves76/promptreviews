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
      className="flex flex-col items-start p-6 rounded-xl border-2 border-gray-200 hover:border-slate-blue hover:bg-slate-blue/5 transition-all text-left w-full"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-blue/10 flex items-center justify-center">
          <Icon name="FaFileAlt" size={18} className="text-slate-blue" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
      </div>
      {template.description && (
        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
      )}
      <p className="text-xs text-gray-500">
        {template.questions.length} question{template.questions.length !== 1 ? 's' : ''}
      </p>
    </button>
  );
}
