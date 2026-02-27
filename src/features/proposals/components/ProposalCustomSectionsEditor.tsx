'use client';

import { useState } from 'react';
import { ProposalCustomSection } from '../types';
import { SavedSectionsModal } from './SavedSectionsModal';
import { SaveSectionModal } from './SaveSectionModal';
import Icon from '@/components/Icon';

interface ProposalCustomSectionsEditorProps {
  sections: ProposalCustomSection[];
  onChange: (sections: ProposalCustomSection[]) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function ProposalCustomSectionsEditor({ sections, onChange }: ProposalCustomSectionsEditorProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [saveTarget, setSaveTarget] = useState<ProposalCustomSection | null>(null);

  const addSection = () => {
    const newSection: ProposalCustomSection = {
      id: generateId(),
      title: '',
      body: '',
      position: sections.length,
    };
    onChange([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    onChange(
      sections
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, position: i }))
    );
  };

  const updateSection = (id: string, field: 'title' | 'body', value: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((s, i) => ({ ...s, position: i })));
  };

  const handleImport = (title: string, body: string) => {
    const newSection: ProposalCustomSection = {
      id: generateId(),
      title,
      body,
      position: sections.length,
    };
    onChange([...sections, newSection]);
  };

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveSection(index, 'up')}
                disabled={index === 0}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move section up"
              >
                <Icon name="FaChevronUp" size={10} />
              </button>
              <button
                type="button"
                onClick={() => moveSection(index, 'down')}
                disabled={index === sections.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move section down"
              >
                <Icon name="FaChevronDown" size={10} />
              </button>
            </div>
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSection(section.id, 'title', e.target.value)}
              placeholder="Section title"
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
              aria-label="Section title"
            />
            <button
              type="button"
              onClick={() => setSaveTarget(section)}
              disabled={!section.title.trim()}
              className="p-1.5 text-gray-400 hover:text-slate-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Save section to library"
              title="Save to library"
            >
              <Icon name="FaSave" size={14} />
            </button>
            <button
              type="button"
              onClick={() => removeSection(section.id)}
              className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
              aria-label="Remove section"
            >
              <Icon name="FaTrash" size={14} />
            </button>
          </div>
          <textarea
            value={section.body}
            onChange={(e) => updateSection(section.id, 'body', e.target.value)}
            placeholder="Section content..."
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 resize-y"
            aria-label="Section content"
          />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addSection}
          className="flex items-center gap-1.5 text-sm text-slate-blue hover:text-slate-blue/80 font-medium transition-colors"
        >
          <Icon name="FaPlus" size={12} />
          Add section
        </button>
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-1.5 text-sm text-slate-blue hover:text-slate-blue/80 font-medium transition-colors"
        >
          <Icon name="FaSave" size={12} />
          Import saved section
        </button>
      </div>

      <SavedSectionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <SaveSectionModal
        isOpen={!!saveTarget}
        onClose={() => setSaveTarget(null)}
        defaultName={saveTarget?.title || ''}
        sectionTitle={saveTarget?.title || ''}
        sectionBody={saveTarget?.body || ''}
      />
    </div>
  );
}
