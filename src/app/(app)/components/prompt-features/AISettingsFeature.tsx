/**
 * AISettingsFeature Component
 * 
 * A reusable component for AI generation settings that appears across all prompt page types.
 * This component handles the configuration of AI review generation and grammar fixing features.
 * 
 * Features:
 * - Toggle to enable/disable AI review generation
 * - Toggle to enable/disable grammar fixing
 * - Proper state management and callbacks
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";

export interface AISettingsFeatureProps {
  /** Whether AI generation is enabled */
  aiGenerationEnabled: boolean;
  /** Whether grammar fixing is enabled */
  fixGrammarEnabled: boolean;
  /** Callback when AI generation enabled state changes */
  onAIEnabledChange: (enabled: boolean) => void;
  /** Callback when grammar fixing enabled state changes */
  onGrammarEnabledChange: (enabled: boolean) => void;
  /** Initial values for the component */
  initialData?: {
    ai_button_enabled?: boolean;
    fix_grammar_enabled?: boolean;
  };
  /** Whether the component is disabled */
  disabled?: boolean;
}

export default function AISettingsFeature({
  aiGenerationEnabled,
  fixGrammarEnabled,
  onAIEnabledChange,
  onGrammarEnabledChange,
  initialData,
  disabled = false,
}: AISettingsFeatureProps) {
  // Initialize state from props and initialData
  const [isAIEnabled, setIsAIEnabled] = useState(aiGenerationEnabled);
  const [isGrammarEnabled, setIsGrammarEnabled] = useState(fixGrammarEnabled);

  // Update state when props change
  useEffect(() => {
    setIsAIEnabled(aiGenerationEnabled);
  }, [aiGenerationEnabled]);

  useEffect(() => {
    setIsGrammarEnabled(fixGrammarEnabled);
  }, [fixGrammarEnabled]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.ai_button_enabled !== undefined) {
        setIsAIEnabled(initialData.ai_button_enabled);
      }
      if (initialData.fix_grammar_enabled !== undefined) {
        setIsGrammarEnabled(initialData.fix_grammar_enabled);
      }
    }
  }, [initialData]);

  const handleAIToggle = () => {
    const newEnabled = !isAIEnabled;
    setIsAIEnabled(newEnabled);
    onAIEnabledChange(newEnabled);
  };

  const handleGrammarToggle = () => {
    const newEnabled = !isGrammarEnabled;
    setIsGrammarEnabled(newEnabled);
    onGrammarEnabledChange(newEnabled);
  };

  return (
    <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4">
      {/* AI Review Generation Toggle */}
      <div className="flex flex-row justify-between items-start px-2 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="prompty" className="w-8 h-8 text-slate-blue" size={32} />
            <span className="text-2xl font-bold text-[#1A237E]">
              Generate with AI
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-10">
            {isAIEnabled
              ? 'Customers will see the "Generate with AI" button to help them write a review.'
              : "The AI review generation button will be hidden from customers on this prompt page."}
          </div>
        </div>
        <div className="flex flex-col justify-start pt-1">
          <button
            type="button"
            onClick={handleAIToggle}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isAIEnabled ? "bg-slate-blue" : "bg-gray-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={isAIEnabled}
            style={{ verticalAlign: "middle" }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isAIEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Fix My Grammar Toggle */}
      <div className="flex flex-row justify-between items-start px-2 py-2 border-t border-blue-200 pt-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="FaCheck" className="w-7 h-7 text-slate-blue" size={28} />
            <span className="text-2xl font-bold text-[#1A237E]">
              Fix My Grammar
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-10">
            {isGrammarEnabled
              ? 'Customers will see the "Fix My Grammar" button to improve their review writing.'
              : "The grammar fixing button will be hidden from customers on this prompt page."}
          </div>
        </div>
        <div className="flex flex-col justify-start pt-1">
          <button
            type="button"
            onClick={handleGrammarToggle}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isGrammarEnabled ? "bg-slate-blue" : "bg-gray-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={isGrammarEnabled}
            style={{ verticalAlign: "middle" }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isGrammarEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
} 