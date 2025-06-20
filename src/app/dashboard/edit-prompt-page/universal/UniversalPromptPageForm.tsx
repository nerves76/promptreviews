import React, { useState, useEffect, forwardRef } from "react";
import OfferToggle from "../components/OfferToggle";
import EmojiSentimentSection from "../components/EmojiSentimentSection";
import ReviewPlatformsSection, {
  ReviewPlatformLink,
} from "../components/ReviewPlatformsSection";
import { Input } from "@/app/components/ui/input";
import {
  FaStar,
  FaHeart,
  FaSmile,
  FaThumbsUp,
  FaBolt,
  FaCoffee,
  FaWrench,
  FaRainbow,
  FaGlassCheers,
  FaDumbbell,
  FaPagelines,
  FaPeace,
} from "react-icons/fa";
import OfferSection from "../components/OfferSection";
import DisableAIGenerationSection from "@/app/components/DisableAIGenerationSection";
import { FALLING_STARS_ICONS } from "@/app/components/prompt-modules/fallingStarsConfig";
import SectionHeader from "@/app/components/SectionHeader";

export interface UniversalPromptFormState {
  offerEnabled: boolean;
  offerTitle: string;
  offerBody: string;
  offerUrl: string;
  emojiSentimentEnabled: boolean;
  emojiSentimentQuestion: string;
  emojiFeedbackMessage: string;
  emojiThankYouMessage: string;
  emojiLabels: string[];
  reviewPlatforms: ReviewPlatformLink[];
  fallingEnabled: boolean;
  fallingIcon: string;
  aiButtonEnabled: boolean;
}

interface UniversalPromptPageFormProps {
  onSave: (state: UniversalPromptFormState) => void;
  isLoading?: boolean;
  initialData?: Partial<UniversalPromptFormState>;
  showResetButton?: boolean;
  businessReviewPlatforms?: ReviewPlatformLink[];
}

const UniversalPromptPageForm = forwardRef<any, UniversalPromptPageFormProps>(
  (
    {
      onSave,
      isLoading,
      initialData,
      showResetButton,
      businessReviewPlatforms = [],
    },
    ref,
  ) => {
    const [offerEnabled, setOfferEnabled] = useState(
      initialData?.offerEnabled ?? false,
    );
    const [offerTitle, setOfferTitle] = useState(initialData?.offerTitle ?? "");
    const [offerBody, setOfferBody] = useState(initialData?.offerBody ?? "");
    const [offerUrl, setOfferUrl] = useState(initialData?.offerUrl ?? "");
    const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(
      initialData?.emojiSentimentEnabled ?? false,
    );
    const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
      initialData?.emojiSentimentQuestion ?? "How was your experience?",
    );
    const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
      initialData?.emojiFeedbackMessage ??
        "We value your feedback! Let us know how we can do better.",
    );
    const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
      initialData?.emojiThankYouMessage &&
        initialData.emojiThankYouMessage.trim() !== ""
        ? initialData.emojiThankYouMessage
        : "Thank you for your feedback. It's important to us.",
    );
    const [emojiLabels, setEmojiLabels] = useState(
      initialData?.emojiLabels ?? [
        "Excellent",
        "Satisfied",
        "Neutral",
        "Unsatisfied",
        "Frustrated",
      ],
    );
    const [reviewPlatforms, setReviewPlatforms] = useState<
      ReviewPlatformLink[]
    >(initialData?.reviewPlatforms ?? []);
    const [fallingEnabled, setFallingEnabled] = useState(
      initialData?.fallingEnabled ?? false,
    );
    const [fallingIcon, setFallingIcon] = useState(
      initialData?.fallingIcon ?? "star",
    );
    const [aiButtonEnabled, setAiButtonEnabled] = useState(
      initialData?.aiButtonEnabled ?? true,
    );

    const handleEmojiLabelChange = (index: number, val: string) => {
      setEmojiLabels((labels) => labels.map((l, i) => (i === index ? val : l)));
    };

    // Expose a submit function via ref
    React.useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          onSave({
            offerEnabled,
            offerTitle,
            offerBody,
            offerUrl,
            emojiSentimentEnabled,
            emojiSentimentQuestion,
            emojiFeedbackMessage,
            emojiThankYouMessage,
            emojiLabels,
            reviewPlatforms,
            fallingEnabled,
            fallingIcon,
            aiButtonEnabled,
          });
        },
      }),
      [
        offerEnabled,
        offerTitle,
        offerBody,
        offerUrl,
        emojiSentimentEnabled,
        emojiSentimentQuestion,
        emojiFeedbackMessage,
        emojiThankYouMessage,
        emojiLabels,
        reviewPlatforms,
        fallingEnabled,
        fallingIcon,
        aiButtonEnabled,
        onSave,
      ],
    );

    return (
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (reviewPlatforms.length === 0) {
            if (
              !window.confirm(
                "You didn't add a review platform. Are you sure you want to save?",
              )
            ) {
              return;
            }
          }
          if (!emojiThankYouMessage || emojiThankYouMessage.trim() === "") {
            alert(
              "Please enter a thank you message for the emoji sentiment module.",
            );
            return;
          }
          onSave({
            offerEnabled,
            offerTitle,
            offerBody,
            offerUrl,
            emojiSentimentEnabled,
            emojiSentimentQuestion,
            emojiFeedbackMessage,
            emojiThankYouMessage:
              emojiThankYouMessage || "Thank you for your feedback!",
            emojiLabels,
            reviewPlatforms,
            fallingEnabled,
            fallingIcon,
            aiButtonEnabled,
          });
        }}
      >
        {/* Review Platforms Section (shared design, no review templates) */}
        <div className="mt-16">
          <ReviewPlatformsSection
            value={reviewPlatforms}
            onChange={setReviewPlatforms}
            hideReviewTemplateFields={true}
            onResetToDefaults={
              showResetButton
                ? () => setReviewPlatforms(businessReviewPlatforms)
                : undefined
            }
          />
        </div>
        {/* Special Offer Section (shared design) */}
        <OfferSection
          enabled={offerEnabled}
          onToggle={() => setOfferEnabled((v) => !v)}
          title={offerTitle}
          onTitleChange={setOfferTitle}
          description={offerBody}
          onDescriptionChange={setOfferBody}
          url={offerUrl}
          onUrlChange={setOfferUrl}
        />
        {/* Emoji Sentiment Section (shared design) */}
        <EmojiSentimentSection
          enabled={emojiSentimentEnabled}
          onToggle={() => setEmojiSentimentEnabled((v) => !v)}
          question={emojiSentimentQuestion}
          onQuestionChange={setEmojiSentimentQuestion}
          feedbackMessage={emojiFeedbackMessage}
          onFeedbackMessageChange={setEmojiFeedbackMessage}
          thankYouMessage={emojiThankYouMessage}
          onThankYouMessageChange={setEmojiThankYouMessage}
          emojiLabels={emojiLabels}
          onEmojiLabelChange={handleEmojiLabelChange}
        />
        {/* AI Review Generation Toggle */}
        <DisableAIGenerationSection
          enabled={aiButtonEnabled}
          onToggle={() => setAiButtonEnabled((v) => !v)}
        />
        {/* Falling Stars Section (full module) */}
        <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
          <div className="flex flex-row justify-between items-start px-2 py-2">
            <SectionHeader
              icon={<FaStar className="w-7 h-7 text-slate-blue" />}
              title="Falling star animation"
              subCopy="Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below."
              className="!mb-0"
              subCopyLeftOffset="ml-9"
            />
            <div className="flex flex-col justify-start pt-1">
              <button
                type="button"
                onClick={() => setFallingEnabled((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fallingEnabled ? "bg-slate-blue" : "bg-gray-200"}`}
                aria-pressed={!!fallingEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${fallingEnabled ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>
          {/* Icon picker (enabled) */}
          <div className="flex gap-4 px-2 flex-wrap ml-9">
            {FALLING_STARS_ICONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  className={`p-2 rounded-full border transition bg-white flex items-center justify-center ${fallingIcon === opt.key ? "border-slate-blue ring-2 ring-slate-blue" : "border-gray-300"}`}
                  onClick={() => setFallingIcon(opt.key)}
                  aria-label={opt.label}
                  type="button"
                  disabled={!fallingEnabled}
                >
                  <Icon
                    className={
                      opt.key === "star"
                        ? "w-6 h-6 text-yellow-400"
                        : opt.key === "heart"
                          ? "w-6 h-6 text-red-500"
                          : opt.key === "smile"
                            ? "w-6 h-6 text-yellow-400"
                            : opt.key === "thumb"
                              ? "w-6 h-6 text-blue-500"
                              : opt.key === "bolt"
                                ? "w-6 h-6 text-amber-400"
                                : opt.key === "rainbow"
                                  ? "w-6 h-6 text-fuchsia-400"
                                  : opt.key === "coffee"
                                    ? "w-6 h-6 text-amber-800"
                                    : opt.key === "wrench"
                                      ? "w-6 h-6 text-gray-500"
                                      : opt.key === "confetti"
                                        ? "w-6 h-6 text-pink-400"
                                        : opt.key === "barbell"
                                          ? "w-6 h-6 text-gray-600"
                                          : opt.key === "flower"
                                            ? "w-6 h-6 text-green-500"
                                            : opt.key === "peace"
                                              ? "w-6 h-6 text-purple-500"
                                              : opt.key === "bicycle"
                                                ? "w-6 h-6 text-green-500"
                                                : opt.key === "anchor"
                                                  ? "w-6 h-6 text-blue-500"
                                                  : "w-6 h-6"
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>
        {/* No Save button here; Save is handled by parent */}
      </form>
    );
  },
);

export default UniversalPromptPageForm;
