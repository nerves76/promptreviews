/**
 * EmojiSentimentFeature Component
 * 
 * A reusable component for the emoji sentiment feature that appears across all prompt page types.
 * This component handles the configuration of emoji sentiment including questions, messages, and settings.
 * 
 * Features:
 * - Toggle to enable/disable emoji sentiment
 * - Question configuration
 * - Feedback and thank you message configuration
 * - Conflict handling with personalized note
 * - Demo button to preview functionality
 * - Embed functionality for website integration
 * - Emoji preview/example
 * - Proper state management and callbacks
 */

"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { FaSmile, FaArrowRight, FaCodeBranch } from "react-icons/fa";
import EmojiSentimentDemoModal from "../EmojiSentimentDemoModal";
import EmojiEmbedButton from "../EmojiEmbedButton";
import { EMOJI_SENTIMENT_LABELS, EMOJI_SENTIMENT_ICONS } from "../prompt-modules/emojiSentimentConfig";

export interface EmojiSentimentFeatureProps {
  /** Whether emoji sentiment is enabled */
  enabled: boolean;
  /** The question to ask customers */
  question: string;
  /** The feedback message shown to customers */
  feedbackMessage: string;
  /** The thank you message shown after feedback */
  thankYouMessage: string;
  /** The feedback popup header */
  feedbackPopupHeader?: string;
  /** The feedback page header */
  feedbackPageHeader?: string;
  /** Whether personalized note is enabled (conflicts with emoji sentiment) */
  personalizedNoteEnabled?: boolean;
  /** The slug for embed functionality */
  slug?: string;
  /** Callback when the enabled state changes */
  onEnabledChange?: (enabled: boolean) => void;
  /** Alternative callback for toggle (same as onEnabledChange) */
  onToggle?: (enabled: boolean) => void;
  /** Callback when the question changes */
  onQuestionChange: (question: string) => void;
  /** Callback when the feedback message changes */
  onFeedbackMessageChange: (message: string) => void;
  /** Callback when the thank you message changes */
  onThankYouMessageChange: (message: string) => void;
  /** Callback when the feedback popup header changes */
  onFeedbackPopupHeaderChange?: (header: string) => void;
  /** Callback when the feedback page header changes */
  onFeedbackPageHeaderChange?: (header: string) => void;
  /** Initial values for the component */
  initialData?: {
    emoji_sentiment_enabled?: boolean;
    emoji_sentiment_question?: string;
    emoji_feedback_message?: string;
    emoji_thank_you_message?: string;
    emoji_feedback_popup_header?: string;
    emoji_feedback_page_header?: string;
  };
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether the component is in edit mode */
  editMode?: boolean;
}

export default function EmojiSentimentFeature({
  enabled,
  question,
  feedbackMessage,
  thankYouMessage,
  feedbackPopupHeader = "",
  feedbackPageHeader = "",
  personalizedNoteEnabled = false,
  slug,
  onEnabledChange,
  onToggle,
  onQuestionChange,
  onFeedbackMessageChange,
  onThankYouMessageChange,
  onFeedbackPopupHeaderChange,
  onFeedbackPageHeaderChange,
  initialData,
  disabled = false,
  editMode = false,
}: EmojiSentimentFeatureProps) {
  // Initialize state from props and initialData
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [questionText, setQuestionText] = useState(question);
  const [feedbackText, setFeedbackText] = useState(feedbackMessage);
  const [thankYouText, setThankYouText] = useState(thankYouMessage);
  const [popupHeader, setPopupHeader] = useState(feedbackPopupHeader);
  const [pageHeader, setPageHeader] = useState(feedbackPageHeader);
  const [showDemo, setShowDemo] = useState(false);

  // Update state when props change
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    setQuestionText(question);
  }, [question]);

  useEffect(() => {
    setFeedbackText(feedbackMessage);
  }, [feedbackMessage]);

  useEffect(() => {
    setThankYouText(thankYouMessage);
  }, [thankYouMessage]);

  useEffect(() => {
    setPopupHeader(feedbackPopupHeader);
  }, [feedbackPopupHeader]);

  useEffect(() => {
    setPageHeader(feedbackPageHeader);
  }, [feedbackPageHeader]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.emoji_sentiment_enabled !== undefined) {
        setIsEnabled(initialData.emoji_sentiment_enabled);
      }
      if (initialData.emoji_sentiment_question !== undefined) {
        setQuestionText(initialData.emoji_sentiment_question);
      }
      if (initialData.emoji_feedback_message !== undefined) {
        setFeedbackText(initialData.emoji_feedback_message);
      }
      if (initialData.emoji_thank_you_message !== undefined) {
        setThankYouText(initialData.emoji_thank_you_message);
      }
      if (initialData.emoji_feedback_popup_header !== undefined) {
        setPopupHeader(initialData.emoji_feedback_popup_header);
      }
      if (initialData.emoji_feedback_page_header !== undefined) {
        setPageHeader(initialData.emoji_feedback_page_header);
      }
    }
  }, [initialData]);

  const handleToggle = () => {
    if (personalizedNoteEnabled) {
      // Show conflict modal would go here
      console.warn("Cannot enable emoji sentiment when personalized note is enabled");
      return;
    }
    
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onEnabledChange?.(newEnabled);
    onToggle?.(newEnabled);
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuestion = e.target.value;
    setQuestionText(newQuestion);
    onQuestionChange(newQuestion);
  };

  const handleFeedbackMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setFeedbackText(newMessage);
    onFeedbackMessageChange(newMessage);
  };

  const handleThankYouMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setThankYouText(newMessage);
    onThankYouMessageChange(newMessage);
  };

  const handlePopupHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeader = e.target.value;
    setPopupHeader(newHeader);
    onFeedbackPopupHeaderChange?.(newHeader);
  };

  const handlePageHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeader = e.target.value;
    setPageHeader(newHeader);
    onFeedbackPageHeaderChange?.(newHeader);
  };

  return (
    <div className={`${editMode ? 'rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4' : 'bg-white rounded-lg border border-gray-200 p-6 mb-6'}`}>
      <div className={`${editMode ? 'flex flex-row justify-between items-start px-2 py-2' : 'flex items-center justify-between mb-4'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <FaSmile className={`${editMode ? 'w-7 h-7 text-slate-blue' : 'text-slate-blue text-lg'}`} />
            <h3 className={`${editMode ? 'text-2xl font-bold text-[#1A237E]' : 'text-lg font-semibold text-gray-900'}`}>
              Emoji Sentiment Flow
            </h3>
          </div>
          <div className={`${editMode ? 'text-sm text-gray-700 mt-[3px] ml-10' : 'text-sm text-gray-600'}`}>
            
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Demo Button */}
          <button
            type="button"
            onClick={() => setShowDemo(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
            title="View emoji sentiment demo"
          >
            <FaArrowRight className="w-3 h-3" />
            View demo
          </button>
          
          {/* Embed Button - only show when enabled and slug is available */}
          {isEnabled && slug ? (
            <EmojiEmbedButton
              slug={slug}
              question={questionText}
              enabled={isEnabled}
            />
          ) : isEnabled && !slug ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-400 rounded cursor-not-allowed text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
              title="Save your page to enable embed functionality"
            >
              <FaCodeBranch className="w-4 h-4" />
              Embed
            </button>
          ) : null}
          
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isEnabled ? "bg-slate-blue" : "bg-gray-200"
            } ${disabled || personalizedNoteEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={isEnabled}
            disabled={disabled || personalizedNoteEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-700 mb-4 max-w-[85ch] px-2">
        Allow customers to express their satisfaction with emoji reactions. This creates a quick and engaging way for customers to provide feedback.
      </div>
      
      {/* Emoji Preview */}
      {isEnabled && (
        <div className="mb-6 px-2">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">Preview:</div>
            <div className="text-center mb-3">
              <div className="text-lg font-semibold text-gray-800 mb-4">
                {questionText || "How was your experience?"}
              </div>
              <div className="flex justify-center items-center gap-4">
                {EMOJI_SENTIMENT_LABELS.map((label, index) => {
                  const iconConfig = EMOJI_SENTIMENT_ICONS[index];
                  const IconComponent = iconConfig.icon;
                  
                  return (
                    <div key={label} className="flex flex-col items-center">
                      <div className="w-12 h-12 flex items-center justify-center mb-2">
                        <IconComponent
                          className={iconConfig.color}
                          size={32}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isEnabled && (
        <div className="space-y-4 px-2">
          <div>
            <label htmlFor="emoji-question" className="block text-sm font-medium text-gray-700 mb-2">
              Question to ask customers
            </label>
            <Input
              id="emoji-question"
              value={questionText}
              onChange={handleQuestionChange}
              placeholder="How was your experience?"
              className="block w-full"
              disabled={disabled}
            />
          </div>
          
          <div>
            <label htmlFor="emoji-feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
              Feedback message
            </label>
            <Textarea
              id="emoji-feedback-message"
              value={feedbackText}
              onChange={handleFeedbackMessageChange}
              placeholder="How can we improve?"
              rows={3}
              className="block w-full"
              disabled={disabled}
            />
          </div>
          
          <div>
            <label htmlFor="emoji-thank-you-message" className="block text-sm font-medium text-gray-700 mb-2">
              Thank you message
            </label>
            <Textarea
              id="emoji-thank-you-message"
              value={thankYouText}
              onChange={handleThankYouMessageChange}
              placeholder="Thank you for your feedback!"
              rows={3}
              className="block w-full"
              disabled={disabled}
            />
          </div>
          
          {onFeedbackPopupHeaderChange && (
            <div>
              <label htmlFor="emoji-popup-header" className="block text-sm font-medium text-gray-700 mb-2">
                Feedback popup header
              </label>
              <Input
                id="emoji-popup-header"
                value={popupHeader}
                onChange={handlePopupHeaderChange}
                placeholder="We'd love to hear more"
                className="block w-full"
                disabled={disabled}
              />
            </div>
          )}
          
          {onFeedbackPageHeaderChange && (
            <div>
              <label htmlFor="emoji-page-header" className="block text-sm font-medium text-gray-700 mb-2">
                Feedback page header
              </label>
              <Input
                id="emoji-page-header"
                value={pageHeader}
                onChange={handlePageHeaderChange}
                placeholder="Tell us more about your experience"
                className="block w-full"
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Demo Modal */}
      <EmojiSentimentDemoModal
        isOpen={showDemo}
        onClose={() => setShowDemo(false)}
      />
    </div>
  );
} 