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
}

const EmojiSentimentModal: React.FC<EmojiSentimentModalProps> = ({
  open,
  onClose,
  question = "How was your experience?",
  feedbackMessage = "We value your feedback! Let us know how we can do better.",
  thankYouMessage = "Thank you for your feedback!",
  emojiLabels = EMOJI_SENTIMENT_LABELS,
  onPositive,
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
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-slideup border-2 border-blue-200">
        <div className="mb-4 text-base font-medium text-gray-800 text-center">
          {question}
        </div>
        {/* Emoji row */}
        <div className="flex justify-center gap-3 my-3 select-none">
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
                  className={`w-10 h-10 ${color} ${selected === i ? "ring-2 ring-blue-400" : ""}`}
                />
                <span className="text-xs mt-1 text-gray-700">{label}</span>
              </button>
            );
          })}
        </div>
        {/* Feedback/Continue logic */}
        {selected !== null &&
        !submitted &&
        ["neutral", "unsatisfied", "angry"].includes(
          emojiLabels[selected].toLowerCase(),
        ) ? (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              onClose();
            }}
          >
            <div className="text-sm text-gray-700 mb-1 text-center">
              {feedbackMessage}
            </div>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 text-base bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="Your feedback..."
              required
            />
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg font-bold text-lg shadow-lg bg-slate-blue text-white hover:bg-indigo-900 focus:outline-none transition"
            >
              Submit Feedback
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <button
              className="px-6 py-3 rounded-lg font-bold text-lg shadow-lg bg-slate-blue text-white hover:bg-indigo-900 focus:outline-none transition"
              onClick={() => {
                if (
                  selected !== null &&
                  ["excellent", "satisfied"].includes(
                    emojiLabels[selected].toLowerCase(),
                  )
                ) {
                  onPositive && onPositive(emojiLabels[selected].toLowerCase());
                }
                onClose();
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiSentimentModal;
