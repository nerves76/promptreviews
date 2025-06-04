import React, { useState, useEffect } from "react";
import {
  EMOJI_SENTIMENT_LABELS,
  EMOJI_SENTIMENT_ICONS,
  EMOJI_SENTIMENT_TITLE,
  EMOJI_SENTIMENT_SUBTEXT,
  EMOJI_SENTIMENT_NOTE,
} from "./prompt-modules/emojiSentimentConfig";
import { FaSmile } from "react-icons/fa";

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
            const Icon = iconDef?.icon || EMOJI_SENTIMENT_ICONS[1].icon;
            const color = iconDef?.color || "text-gray-400";
            return (
              <button
                key={i}
                className={`flex flex-col items-center focus:outline-none ${selected === i ? "scale-110" : ""}`}
                onClick={() => setSelected(i)}
                disabled={submitted}
                aria-label={label}
                type="button"
              >
                <Icon
                  className={`w-12 h-12 ${color} ${selected === i ? "ring-2 ring-blue-400" : ""}`}
                />
                <span className="text-sm mt-2 text-gray-700">{label}</span>
              </button>
            );
          })}
        </div>
        {/* Feedback/Continue logic */}
        <div className="mt-8 text-center">
          <button
            className="px-8 py-3 rounded-lg font-bold text-lg shadow-lg text-white hover:opacity-90 focus:outline-none transition"
            style={{ backgroundColor: buttonColor }}
            onClick={() => {
              if (selected !== null) {
                onPositive && onPositive(emojiLabels[selected].toLowerCase());
              }
              onClose();
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmojiSentimentModal;
