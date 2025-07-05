import React, { useState, useEffect } from "react";
import {
  EMOJI_SENTIMENT_LABELS,
  EMOJI_SENTIMENT_ICONS,
  EMOJI_SENTIMENT_TITLE,
  EMOJI_SENTIMENT_SUBTEXT,
  EMOJI_SENTIMENT_NOTE,
  EMOJI_SENTIMENT_STEP2_HEADLINE,
  EMOJI_SENTIMENT_STEP2_BODY,
  EMOJI_SENTIMENT_STEP2_FEEDBACK_BUTTON,
  EMOJI_SENTIMENT_STEP2_REVIEW_BUTTON,
  shouldShowStep2,
  isPositiveEmoji,
} from "./prompt-modules/emojiSentimentConfig";
import { FaSmile, FaEdit, FaGlobeAmericas } from "react-icons/fa";

interface EmojiSentimentModalProps {
  open: boolean;
  onClose: () => void;
  question?: string;
  feedbackMessage?: string;
  thankYouMessage?: string;
  emojiLabels?: string[];
  onPositive?: (sentiment: string) => void;
  onFeedback?: (sentiment: string) => void;
  onPublicReview?: (sentiment: string) => void;
  headerColor?: string;
  buttonColor?: string;
  fontFamily?: string;
  // New props for customizable step 2 text
  step2Headline?: string;
  step2Body?: string;
  feedbackButtonText?: string;
  reviewButtonText?: string;
}

const EmojiSentimentModal: React.FC<EmojiSentimentModalProps> = ({
  open,
  onClose,
  question = "How was your experience?",
  feedbackMessage = "We value your feedback! Let us know how we can do better.",
  thankYouMessage = "Thank you for your feedback!",
  emojiLabels = EMOJI_SENTIMENT_LABELS,
  onPositive,
  onFeedback,
  onPublicReview,
  headerColor = "#4F46E5",
  buttonColor = "#4F46E5",
  fontFamily = "Inter",
  step2Headline = EMOJI_SENTIMENT_STEP2_HEADLINE,
  step2Body = EMOJI_SENTIMENT_STEP2_BODY,
  feedbackButtonText = EMOJI_SENTIMENT_STEP2_FEEDBACK_BUTTON,
  reviewButtonText = EMOJI_SENTIMENT_STEP2_REVIEW_BUTTON,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setCurrentStep(1);
    }
  }, [open]);

  if (!open) return null;

  const handleEmojiSelect = (index: number) => {
    setSelected(index);
    
    if (shouldShowStep2(index)) {
      // Show step 2 for negative/neutral emojis
      setCurrentStep(2);
    } else {
      // Go directly to positive flow for happy emojis
      if (selected !== null) {
        onPositive && onPositive(emojiLabels[index].toLowerCase());
      }
      onClose();
    }
  };

  const handleFeedbackClick = () => {
    if (selected !== null) {
      onFeedback && onFeedback(emojiLabels[selected].toLowerCase());
    }
    onClose();
  };

  const handlePublicReviewClick = () => {
    if (selected !== null) {
      onPublicReview && onPublicReview(emojiLabels[selected].toLowerCase());
    }
    onClose();
  };

  // Modal overlay and card
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fadein">
      <div
        className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full relative animate-slideup border-2 border-blue-200"
        style={{ fontFamily }}
      >
        {currentStep === 1 && (
          <>
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
                    className={`flex flex-col items-center focus:outline-none transition-transform hover:scale-105 ${selected === i ? "scale-110" : ""}`}
                    onClick={() => handleEmojiSelect(i)}
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
          </>
        )}

        {currentStep === 2 && (
          <>
            <div
              className="mb-6 text-2xl font-bold text-center"
              style={{ color: headerColor }}
            >
              {step2Headline}
            </div>
            <div className="mb-8 text-lg text-center text-gray-700">
              {step2Body}
            </div>
            <div className="space-y-4">
              {/* Give Feedback Option */}
              <div className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg text-left">
                <FaEdit className="w-6 h-6 text-blue-500" />
                <span className="text-gray-700">
                  <strong>Give us direct feedback</strong> so we can make things better?
                </span>
              </div>
              
              {/* Leave Public Review Option */}
              <div className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg text-left">
                <FaGlobeAmericas className="w-6 h-6 text-green-500" />
                <span className="text-gray-700">
                  Or <strong>leave a public review</strong> of your experience?
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 px-6 py-3 rounded-lg font-bold text-lg shadow-lg text-white hover:opacity-90 focus:outline-none transition flex items-center justify-center gap-2"
                style={{ backgroundColor: buttonColor }}
                onClick={handleFeedbackClick}
              >
                <FaEdit className="w-5 h-5" />
                {feedbackButtonText}
              </button>
              <button
                className="flex-1 px-6 py-3 rounded-lg font-bold text-lg shadow-lg text-white hover:opacity-90 focus:outline-none transition flex items-center justify-center gap-2"
                style={{ backgroundColor: '#10B981' }}
                onClick={handlePublicReviewClick}
              >
                <FaGlobeAmericas className="w-5 h-5" />
                {reviewButtonText}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmojiSentimentModal;
