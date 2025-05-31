import React from 'react';
import { FaRobot } from 'react-icons/fa';

interface DisableAIGenerationSectionProps {
  enabled: boolean;
  onToggle: () => void;
}

const DisableAIGenerationSection: React.FC<DisableAIGenerationSectionProps> = ({ enabled, onToggle }) => (
  <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4">
    <div className="flex items-center justify-between mb-2 px-4 py-2">
      <div className="flex items-center gap-3">
        <FaRobot className="w-7 h-7 text-slate-blue" />
        <span className="text-2xl font-bold text-[#1A237E]">AI Review Generation</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
        aria-pressed={!!enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </div>
    <div className="text-xs text-gray-500 px-4 -mt-2">
      {enabled
        ? 'Customers will see the "Generate with AI" button to help them write a review.'
        : 'The AI review generation button will be hidden from customers on this prompt page.'}
    </div>
  </div>
);

export default DisableAIGenerationSection; 