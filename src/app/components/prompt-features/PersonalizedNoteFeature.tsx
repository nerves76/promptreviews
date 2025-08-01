/**
 * PersonalizedNoteFeature Component
 * 
 * A reusable component for the personalized note feature that appears across all prompt page types.
 * This component handles the toggle for showing/hiding the personalized note and the textarea for the note content.
 * 
 * Features:
 * - Toggle to enable/disable the personalized note
 * - Textarea for entering the note content
 * - Conflict handling with emoji sentiment
 * - Proper state management and callbacks
 */

"use client";
import React, { useState, useEffect } from "react";
import { Textarea } from "@/app/components/ui/textarea";
import Icon from "@/components/Icon";

export interface PersonalizedNoteFeatureProps {
  /** Whether the personalized note is enabled */
  enabled: boolean;
  /** The note content */
  note: string;
  /** Whether emoji sentiment is enabled (conflicts with personalized note) */
  emojiSentimentEnabled?: boolean;
  /** Callback when the enabled state changes */
  onEnabledChange?: (enabled: boolean) => void;
  /** Alternative callback for toggle (same as onEnabledChange) */
  onToggle?: (enabled: boolean) => void;
  /** Callback when the note content changes */
  onNoteChange: (note: string) => void;
  /** Initial values for the component */
  initialData?: {
    show_friendly_note?: boolean;
    friendly_note?: string;
  };
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
}

export default function PersonalizedNoteFeature({
  enabled,
  note,
  emojiSentimentEnabled = false,
  onEnabledChange,
  onToggle,
  onNoteChange,
  initialData,
  disabled = false,
  editMode = false,
}: PersonalizedNoteFeatureProps) {
  // Initialize state from props and initialData
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [noteContent, setNoteContent] = useState(note);

  // Update state when props change
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    setNoteContent(note);
  }, [note]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.show_friendly_note !== undefined) {
        setIsEnabled(initialData.show_friendly_note);
      }
      if (initialData.friendly_note !== undefined) {
        setNoteContent(initialData.friendly_note);
      }
    }
  }, [initialData]);

  const handleToggle = () => {
    if (emojiSentimentEnabled) {
      // Show conflict modal would go here
      console.warn("Cannot enable personalized note when emoji sentiment is enabled");
      return;
    }
    
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onEnabledChange?.(newEnabled);
    onToggle?.(newEnabled);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNoteContent(newNote);
    onNoteChange(newNote);
  };

  return (
    <div className={`${editMode ? 'rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4' : 'bg-white rounded-lg border border-gray-200 p-6 mb-6'}`}>
      <div className={`${editMode ? 'flex flex-row justify-between items-start px-2 py-2' : 'flex items-center justify-between mb-4'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="FaStickyNote" className={`${editMode ? 'w-7 h-7' : 'text-lg'}`} style={{ color: "#1A237E" }} size={editMode ? 28 : 18} />
            <h3 className={`${editMode ? 'text-2xl font-bold text-[#1A237E]' : 'text-lg font-semibold text-gray-900'}`}>
              Friendly note pop-up
            </h3>
          </div>
          <div className={`${editMode ? 'text-sm text-gray-700 mt-[3px] ml-10' : 'text-sm text-gray-600'}`}>
            
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isEnabled ? "bg-slate-blue" : "bg-gray-200"
          } ${disabled || emojiSentimentEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={isEnabled}
          disabled={disabled || emojiSentimentEnabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isEnabled ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      
      <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
        Add a note that pops up when a customer or client visits your review page.
      </div>
      
      {isEnabled && (
        <div className="px-2">
          <Textarea
            id="friendly_note"
            value={noteContent || ""}
            onChange={handleNoteChange}
            rows={4}
            className="block w-full"
            placeholder="e.g., Hi John! Thanks for using your service today. We'd love to hear about your experience."
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
} 