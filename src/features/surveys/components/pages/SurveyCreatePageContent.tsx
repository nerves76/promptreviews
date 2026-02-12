'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { SurveyTemplateCard } from '@/features/surveys/components/SurveyTemplateCard';
import { apiClient } from '@/utils/apiClient';
import { SurveyTemplate } from '@/features/surveys/types';

interface SurveyCreatePageContentProps {
  basePath: string;
}

export function SurveyCreatePageContent({ basePath }: SurveyCreatePageContentProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiClient.get<{ templates: SurveyTemplate[] }>('/surveys/templates')
      .then(data => setTemplates(data.templates))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreateFromTemplate = async (template: SurveyTemplate) => {
    setCreating(true);
    try {
      const data = await apiClient.post<any>('/surveys/from-template', {
        template_id: template.id,
      });
      router.push(`${basePath}/${data.id}`);
    } catch {
      setCreating(false);
    }
  };

  const handleCreateBlank = async () => {
    setCreating(true);
    try {
      const data = await apiClient.post<any>('/surveys', {
        title: 'Untitled survey',
        questions: [],
      });
      router.push(`${basePath}/${data.id}`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <PageCard icon={<Icon name="FaPlus" size={24} className="text-slate-blue" />}>
      <PageCardHeader
        title="Create a survey"
        description="Start from a template or build from scratch"
        actions={
          <Button variant="secondary" onClick={() => router.push(basePath)}>
            <Icon name="FaArrowLeft" size={14} className="mr-2" />
            Back
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
          <p>Loading templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Blank survey */}
          <button
            onClick={handleCreateBlank}
            disabled={creating}
            className="flex flex-col items-start p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-slate-blue hover:bg-slate-blue/5 transition-all text-left w-full disabled:opacity-50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Icon name="FaPlus" size={18} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Start from scratch</h3>
            </div>
            <p className="text-sm text-gray-600">Build a custom survey with your own questions</p>
          </button>

          {/* Templates */}
          {templates.map((template) => (
            <SurveyTemplateCard
              key={template.id}
              template={template}
              onSelect={handleCreateFromTemplate}
            />
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <Icon name="FaSpinner" size={16} className="animate-spin text-slate-blue" />
            <span className="text-gray-700">Creating your survey...</span>
          </div>
        </div>
      )}
    </PageCard>
  );
}
