'use client';

import Icon from '@/components/Icon';

export interface PromptPage {
  id: string;
  name: string | null;
  slug: string;
}

export interface PromptPagesSectionProps {
  /** The prompt pages where this keyword is used */
  promptPages: PromptPage[];
}

/**
 * PromptPagesSection Component
 *
 * Displays the prompt pages where this keyword is being used.
 */
export function PromptPagesSection({ promptPages }: PromptPagesSectionProps) {
  // Don't render if no prompt pages
  if (promptPages.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
        Used in Prompt Pages
      </span>
      <div className="space-y-1 mt-2">
        {promptPages.map((page) => (
          <div key={page.id} className="text-sm text-gray-600 flex items-center gap-2">
            <Icon name="FaFileAlt" className="w-3 h-3 text-indigo-400" />
            <span>{page.name || page.slug}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PromptPagesSection;
