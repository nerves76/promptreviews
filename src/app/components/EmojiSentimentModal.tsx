/**
 * Emoji Sentiment Modal Component
 * 
 * This component displays a modal with emoji sentiment options for users to select.
 * It renders Font Awesome icons and handles user interaction for sentiment selection.
 */

import React, { useState, useEffect } from "react";
import {
  EMOJI_SENTIMENT_LABELS,
  EMOJI_SENTIMENT_ICONS,
  EMOJI_SENTIMENT_TITLE,
  EMOJI_SENTIMENT_SUBTEXT,
  EMOJI_SENTIMENT_NOTE,
} from "./prompt-modules/emojiSentimentConfig";

interface EmojiSentimentModalProps {
  open: boolean;
  onClose: () => void;
  question?: string;
  feedbackMessage?: string;
  thankYouMessage?: string;
  emojiLabels?: string[];
  onPositive?: (sentiment: string) => void;
  headerColor?: string;
  buttonColor?: string;
  fontFamily?: string;
  promptPageId?: string;
  onEmojiEmbed?: (emoji: string, sentiment: string) => void;
}

const EmojiSentimentModal: React.FC<EmojiSentimentModalProps> = ({
  open,
  onClose,
  question = "How was your experience?",
  feedbackMessage = "We value your feedback! Let us know how we can do better.",
  thankYouMessage = "Thank you for your feedback!",
  emojiLabels = EMOJI_SENTIMENT_LABELS,
  onPositive,
  headerColor = "#4F46E5",
  buttonColor = "#4F46E5",
  fontFamily = "Inter",
  promptPageId,
  onEmojiEmbed,
}) => {
  const [selected, setSelected] = useState<number | null>(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) setSelected(0);
  }, [open]);

  if (!open) return null;

  // Modal overlay and card
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fadein">
      <div
        className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full relative animate-slideup border-2 border-blue-200"
        style={{ fontFamily }}
      >
        <div
          className="mb-8 text-3xl font-bold text-center"
          style={{ color: headerColor }}
        >
          {question}
        </div>
        {/* Emoji row */}
        <div className="flex justify-center gap-6 my-8 select-none">
          {emojiLabels.map((label, i) => {
            const iconDef = EMOJI_SENTIMENT_ICONS[i];
            const IconComponent = iconDef?.icon || EMOJI_SENTIMENT_ICONS[1].icon;
            const color = iconDef?.color || "text-gray-400";
            return (
              <button
                key={i}
                className={`flex flex-col items-center focus:outline-none ${selected === i ? "scale-110" : ""}`}
                onClick={() => {
                  setSelected(i);
                  // Immediately trigger the action when emoji is clicked
                  const sentiment = label.toLowerCase();
                  
                  // Track emoji selection for analytics
                  if (promptPageId) {
                    fetch("/api/track-event", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        event: 'emoji_sentiment_selected',
                        sentiment: sentiment,
                        promptPageId: promptPageId,
                        source: 'modal_interaction'
                      }),
                    }).catch(() => {
                      // Silently fail if analytics tracking fails
                    });
                  }
                  
                  onPositive && onPositive(sentiment);
                  onClose();
                }}
                disabled={submitted}
                aria-label={label}
                type="button"
              >
                <IconComponent
                  className={`w-12 h-12 ${color}`}
                  style={{ filter: selected === i ? "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))" : "none" }}
                />
                <span className="text-sm mt-2 text-gray-700">{label}</span>
              </button>
            );
          })}
        </div>
        {/* Emoji click immediately triggers action */}
        <div className="mt-8 text-center">
          {/* No buttons - clicking emojis immediately triggers the action */}
        </div>
      </div>
    </div>
  );
};

export default EmojiSentimentModal;
