/**
 * AISettingsFeature Component
 *
 * A reusable component for AI generation settings that appears across all prompt page types.
 * This component handles the configuration of AI review generation, enhancement, and grammar fixing.
 *
 * Features:
 * - Toggle to enable/disable AI review generation
 * - Toggle to enable/disable AI review enhancement
 * - Toggle to enable/disable grammar fixing
 * - Proper state management and callbacks
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";

export interface AISettingsFeatureProps {
  /** Whether AI generation is enabled */
  aiGenerationEnabled: boolean;
  /** Whether AI enhancement is enabled */
  aiEnhanceEnabled?: boolean;
  /** Whether grammar fixing is enabled */
  fixGrammarEnabled: boolean;
  /** Callback when AI generation enabled state changes */
  onAIEnabledChange: (enabled: boolean) => void;
  /** Callback when AI enhancement enabled state changes */
  onAIEnhanceEnabledChange?: (enabled: boolean) => void;
  /** Callback when grammar fixing enabled state changes */
  onGrammarEnabledChange: (enabled: boolean) => void;
  /** Initial values for the component */
  initialData?: {
    ai_button_enabled?: boolean;
    ai_enhance_enabled?: boolean;
    fix_grammar_enabled?: boolean;
  };
  /** Whether the component is disabled */
  disabled?: boolean;
}

export default function AISettingsFeature({
  aiGenerationEnabled,
  aiEnhanceEnabled = true,
  fixGrammarEnabled,
  onAIEnabledChange,
  onAIEnhanceEnabledChange,
  onGrammarEnabledChange,
  initialData,
  disabled = false,
}: AISettingsFeatureProps) {
  // Initialize state from props and initialData
  const [isAIEnabled, setIsAIEnabled] = useState(aiGenerationEnabled);
  const [isEnhanceEnabled, setIsEnhanceEnabled] = useState(aiEnhanceEnabled);
  const [isGrammarEnabled, setIsGrammarEnabled] = useState(fixGrammarEnabled);

  // Update state when props change
  useEffect(() => {
    setIsAIEnabled(aiGenerationEnabled);
  }, [aiGenerationEnabled]);

  useEffect(() => {
    setIsEnhanceEnabled(aiEnhanceEnabled);
  }, [aiEnhanceEnabled]);

  useEffect(() => {
    setIsGrammarEnabled(fixGrammarEnabled);
  }, [fixGrammarEnabled]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.ai_button_enabled !== undefined) {
        setIsAIEnabled(initialData.ai_button_enabled);
      }
      if (initialData.ai_enhance_enabled !== undefined) {
        setIsEnhanceEnabled(initialData.ai_enhance_enabled);
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

  const handleEnhanceToggle = () => {
    const newEnabled = !isEnhanceEnabled;
    setIsEnhanceEnabled(newEnabled);
    onAIEnhanceEnabledChange?.(newEnabled);
  };

  const handleGrammarToggle = () => {
    const newEnabled = !isGrammarEnabled;
    setIsGrammarEnabled(newEnabled);
    onGrammarEnabledChange(newEnabled);
  };

  return (
    <div className="rounded-lg p-2 sm:p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4">
      {/* AI Review Generation Toggle */}
      <div className="flex flex-row justify-between items-start px-2 sm:px-2 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="prompty" className="w-8 h-8 text-slate-blue" size={32} />
            <span className="text-2xl font-bold text-slate-blue">
              Generate with AI
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-10">
            {isAIEnabled
              ? 'Customers will see a "Generate with AI" button that creates a review for them to edit and make their own.'
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
            aria-label="Toggle Generate with AI"
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

      {/* Enhance with AI Toggle */}
      <div className="flex flex-row justify-between items-start px-2 py-2 border-t border-blue-200 pt-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="FaSparkles" className="w-7 h-7 text-slate-blue" size={28} />
            <span className="text-2xl font-bold text-slate-blue">
              Enhance with AI
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-10">
            {isEnhanceEnabled
              ? "Once the user has typed 10 words the AI generate button will pulse and turn into AI enhance button so they can improve their review. If AI generate is disabled the button will only enhance."
              : "The AI enhancement option will be hidden. Customers will only see the generate button."}
          </div>
        </div>
        <div className="flex flex-col justify-start pt-1">
          <button
            type="button"
            onClick={handleEnhanceToggle}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isEnhanceEnabled ? "bg-slate-blue" : "bg-gray-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={isEnhanceEnabled}
            aria-label="Toggle Enhance with AI"
            style={{ verticalAlign: "middle" }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isEnhanceEnabled ? "translate-x-5" : "translate-x-1"
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
            <span className="text-2xl font-bold text-slate-blue">
              Fix my grammar
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-10">
            {isGrammarEnabled
              ? 'Customers will see the "Fix my grammar" button to improve their review writing.'
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
            aria-label="Toggle Fix my grammar"
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
