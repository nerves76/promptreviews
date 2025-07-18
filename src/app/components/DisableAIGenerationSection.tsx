import React from "react";
import { FaRobot, FaSpellCheck } from "react-icons/fa";

interface DisableAIGenerationSectionProps {
  aiGenerationEnabled: boolean;
  fixGrammarEnabled: boolean;
  onToggleAI: () => void;
  onToggleGrammar: () => void;
}

const DisableAIGenerationSection: React.FC<DisableAIGenerationSectionProps> = ({
  aiGenerationEnabled,
  fixGrammarEnabled,
  onToggleAI,
  onToggleGrammar,
}) => (
  <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4">
    {/* AI Review Generation Toggle */}
    <div className="flex flex-row justify-between items-start px-2 py-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <FaRobot className="w-7 h-7 text-slate-blue" />
          <span className="text-2xl font-bold text-[#1A237E]">
            Generate with AI
          </span>
        </div>
        <div className="text-sm text-gray-700 mt-[3px] ml-9">
          {aiGenerationEnabled
            ? 'Customers will see the "Generate with AI" button to help them write a review.'
            : "The AI review generation button will be hidden from customers on this prompt page."}
        </div>
      </div>
      <div className="flex flex-col justify-start pt-1">
        <button
          type="button"
          onClick={onToggleAI}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiGenerationEnabled ? "bg-slate-blue" : "bg-gray-200"}`}
          aria-pressed={!!aiGenerationEnabled}
          style={{ verticalAlign: "middle" }}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${aiGenerationEnabled ? "translate-x-5" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>

    {/* Fix My Grammar Toggle */}
    <div className="flex flex-row justify-between items-start px-2 py-2 border-t border-blue-200 pt-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <FaSpellCheck className="w-7 h-7 text-slate-blue" />
          <span className="text-2xl font-bold text-[#1A237E]">
            Fix My Grammar
          </span>
        </div>
        <div className="text-sm text-gray-700 mt-[3px] ml-9">
          {fixGrammarEnabled
            ? 'Customers will see the "Fix My Grammar" button to improve their review writing.'
            : "The grammar fixing button will be hidden from customers on this prompt page."}
        </div>
      </div>
      <div className="flex flex-col justify-start pt-1">
        <button
          type="button"
          onClick={onToggleGrammar}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fixGrammarEnabled ? "bg-slate-blue" : "bg-gray-200"}`}
          aria-pressed={!!fixGrammarEnabled}
          style={{ verticalAlign: "middle" }}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${fixGrammarEnabled ? "translate-x-5" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  </div>
);

export default DisableAIGenerationSection;
