"use client";
import React from "react";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import Icon from "@/components/Icon";

export interface MotivationalNudgeFeatureProps {
  /** Whether the motivational nudge is enabled */
  enabled: boolean;
  /** The nudge text content */
  text: string;
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when the text content changes */
  onTextChange: (text: string) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
}

const DEFAULT_NUDGE_TEXT = "Your review helps us get found online and hold our own against bigger brands";

export default function MotivationalNudgeFeature({
  enabled,
  text,
  onEnabledChange,
  onTextChange,
  disabled = false,
  editMode = false,
}: MotivationalNudgeFeatureProps) {
  const displayText = text || DEFAULT_NUDGE_TEXT;

  const handleToggle = () => {
    onEnabledChange(!enabled);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
  };

  return (
    <div className={`${editMode ? 'rounded-lg p-2 sm:p-4 bg-amber-50 border border-amber-200 flex flex-col gap-4 shadow relative mb-4' : 'bg-white rounded-lg border border-gray-200 p-6 mb-6'}`}>
      <div className={`${editMode ? 'flex flex-row justify-between items-start px-2 sm:px-2 py-2' : 'flex items-center justify-between mb-4'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="FaSparkles" className={`${editMode ? 'w-7 h-7' : 'text-lg'}`} style={{ color: "#F59E0B" }} size={editMode ? 28 : 18} />
            <h3 className={`${editMode ? 'text-2xl font-bold text-amber-700' : 'text-lg font-semibold text-gray-900'}`}>
              Motivational Nudge
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            enabled ? "bg-amber-500" : "bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={enabled}
          disabled={disabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
        Display a motivational message below the review input to encourage customers to submit their review.
      </div>

      {enabled && (
        <div className="px-2">
          <Textarea
            id="motivational_nudge_text"
            value={displayText}
            onChange={handleTextChange}
            rows={2}
            className="block w-full"
            placeholder={DEFAULT_NUDGE_TEXT}
            disabled={disabled}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {displayText.length}/200 characters
          </p>
        </div>
      )}
    </div>
  );
}
