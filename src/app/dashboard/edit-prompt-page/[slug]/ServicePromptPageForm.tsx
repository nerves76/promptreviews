import React, { useState, useEffect, forwardRef } from "react";
import OfferToggle from "../components/OfferToggle";
import EmojiSentimentSection from "../components/EmojiSentimentSection";
import ReviewWriteSection, {
  ReviewWritePlatform,
} from "../components/ReviewWriteSection";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
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
  FaCommentDots,
} from "react-icons/fa";
import OfferSection from "../components/OfferSection";
import DisableAIGenerationSection from "@/app/components/DisableAIGenerationSection";
import RobotTooltip from "@/app/components/RobotTooltip";

export interface ServicePromptFormState {
  offerEnabled: boolean;
  offerTitle: string;
  offerBody: string;
  offerUrl: string;
  emojiSentimentEnabled: boolean;
  emojiSentimentQuestion: string;
  emojiFeedbackMessage: string;
  emojiThankYouMessage: string;
  emojiLabels: string[];
  reviewPlatforms: ReviewWritePlatform[];
  fallingEnabled: boolean;
  fallingIcon: string;
  aiButtonEnabled: boolean;
  notePopupEnabled: boolean;
  friendlyNote: string;
}

interface ServicePromptPageFormProps {
  onSave: (state: ServicePromptFormState) => void;
  isLoading?: boolean;
  initialData?: Partial<ServicePromptFormState>;
  showResetButton?: boolean;
  businessReviewPlatforms?: ReviewWritePlatform[];
  onGenerateReview: (idx: number) => void;
}

const ServicePromptPageForm = forwardRef<any, ServicePromptPageFormProps>(
  (
    {
      onSave,
      isLoading,
      initialData,
      showResetButton,
      businessReviewPlatforms = [],
      onGenerateReview,
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
      initialData?.emojiSentimentQuestion || "How was your experience?",
    );
    const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
      initialData?.emojiFeedbackMessage || "How can we improve?",
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
      ReviewWritePlatform[]
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
    const [notePopupEnabled, setNotePopupEnabled] = useState(
      initialData?.notePopupEnabled ?? false,
    );
    const [friendlyNote, setFriendlyNote] = useState(
      initialData?.friendlyNote ?? "",
    );

    // Add state for warning modal
    const [showPopupConflictModal, setShowPopupConflictModal] = useState<
      null | "emoji" | "note"
    >(null);

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
            notePopupEnabled,
            friendlyNote,
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
        notePopupEnabled,
        friendlyNote,
        onSave,
      ],
    );

    return (
      <>
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
              notePopupEnabled,
              friendlyNote,
            });
          }}
        >
          {/* Review Platforms Section with review and AI (Service only) */}
          <div className="mt-16">
            <ReviewWriteSection
              value={reviewPlatforms}
              onChange={setReviewPlatforms}
              onGenerateReview={onGenerateReview}
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
          {/* Personalized Note Pop-up Section */}
          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
            <div className="flex items-center justify-between mb-2 px-2 py-2">
              <div className="flex items-center gap-3">
                <FaCommentDots className="w-7 h-7 text-slate-blue" />
                <span className="text-2xl font-bold text-[#1A237E]">
                  Personalized note pop-up
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (emojiSentimentEnabled) {
                    setShowPopupConflictModal("note");
                    return;
                  }
                  setNotePopupEnabled((v) => !v);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notePopupEnabled ? "bg-slate-blue" : "bg-gray-200"}`}
                aria-pressed={!!notePopupEnabled}
                disabled={emojiSentimentEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notePopupEnabled ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
            </div>
            <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
              This note appears as a pop-up at the top of the review page. Use
              it to set the context and tone for your customer.
            </div>
            {notePopupEnabled && (
              <textarea
                id="friendly_note"
                value={friendlyNote}
                onChange={(e) => setFriendlyNote(e.target.value)}
                rows={4}
                className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-inner"
                placeholder="Ty! It was so great having you in yesterday. You left your scarf! I can drop it by tomorrow on my way in. Thanks for leaving us a review, we need all the positivity we can get.  :)"
              />
            )}
          </div>
          {/* Emoji Sentiment Section (shared design) */}
          <EmojiSentimentSection
            enabled={emojiSentimentEnabled}
            onToggle={() => {
              if (notePopupEnabled) {
                setShowPopupConflictModal("emoji");
                return;
              }
              setEmojiSentimentEnabled((v) => !v);
            }}
            question={emojiSentimentQuestion}
            onQuestionChange={setEmojiSentimentQuestion}
            feedbackMessage={emojiFeedbackMessage}
            onFeedbackMessageChange={setEmojiFeedbackMessage}
            thankYouMessage={emojiThankYouMessage}
            onThankYouMessageChange={setEmojiThankYouMessage}
            emojiLabels={emojiLabels}
            onEmojiLabelChange={handleEmojiLabelChange}
            disabled={!!notePopupEnabled}
          />
          {/* AI Review Generation Toggle */}
          <DisableAIGenerationSection
            enabled={aiButtonEnabled}
            onToggle={() => setAiButtonEnabled((v) => !v)}
          />
          {/* Falling Stars Section (full module) */}
          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
            <div className="flex items-center justify-between mb-2 px-2 py-2">
              <div className="flex items-center gap-3">
                <FaStar className="w-7 h-7 text-slate-blue" />
                <span className="text-2xl font-bold text-[#1A237E]">
                  Falling star animation
                </span>
              </div>
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

            {/* Icon picker (enabled) */}
            <div className="flex gap-4 px-2 flex-wrap">
              {[
                {
                  key: "star",
                  label: "Stars",
                  icon: <FaStar className="w-6 h-6 text-yellow-400" />,
                },
                {
                  key: "heart",
                  label: "Hearts",
                  icon: <FaHeart className="w-6 h-6 text-red-500" />,
                },
                {
                  key: "smile",
                  label: "Smiles",
                  icon: <FaSmile className="w-6 h-6 text-yellow-400" />,
                },
                {
                  key: "thumb",
                  label: "Thumbs Up",
                  icon: <FaThumbsUp className="w-6 h-6 text-blue-500" />,
                },
                {
                  key: "bolt",
                  label: "Bolts",
                  icon: <FaBolt className="w-6 h-6 text-amber-400" />,
                },
                {
                  key: "rainbow",
                  label: "Rainbows",
                  icon: <FaRainbow className="w-6 h-6 text-fuchsia-400" />,
                },
                {
                  key: "coffee",
                  label: "Coffee Cups",
                  icon: <FaCoffee className="w-6 h-6 text-amber-800" />,
                },
                {
                  key: "wrench",
                  label: "Wrenches",
                  icon: <FaWrench className="w-6 h-6 text-gray-500" />,
                },
                {
                  key: "confetti",
                  label: "Wine Glass",
                  icon: <FaGlassCheers className="w-6 h-6 text-pink-400" />,
                },
                {
                  key: "barbell",
                  label: "Barbell",
                  icon: <FaDumbbell className="w-6 h-6 text-gray-600" />,
                },
                {
                  key: "flower",
                  label: "Flower",
                  icon: <FaPagelines className="w-6 h-6 text-green-500" />,
                },
                {
                  key: "peace",
                  label: "Peace",
                  icon: <FaPeace className="w-6 h-6 text-purple-500" />,
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`p-2 rounded-full border transition bg-white flex items-center justify-center ${fallingIcon === opt.key ? "border-slate-blue ring-2 ring-slate-blue" : "border-gray-300"}`}
                  onClick={() => setFallingIcon(opt.key)}
                  aria-label={opt.label}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>
          {/* No Save button here; Save is handled by parent */}
        </form>
        
        {/* Bottom Action Buttons */}
        <div className="border-t border-gray-200 pt-6 mt-8 flex justify-between items-center">
          {/* Reset Button - Bottom Left */}
          {showResetButton && (
            <button
              type="button"
              className="px-4 py-2 text-sm rounded border-2 border-red-500 text-red-600 bg-white hover:bg-red-50 transition-colors"
              onClick={() => {
                if (window.confirm("Are you sure you want to reset to business defaults? Any customizations will be lost.")) {
                  // Reset review platforms to business defaults
                  setReviewPlatforms(businessReviewPlatforms);
                }
              }}
              title="Reset to Business Defaults"
            >
              Reset to Defaults
            </button>
          )}
          
          {/* Save and View Buttons - Bottom Right */}
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
              onClick={() => {
                // Navigate to the service prompt page preview
                window.open(`/r/preview`, '_blank');
              }}
            >
              View
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded bg-slate-blue text-white hover:bg-slate-blue/90 transition-colors"
              onClick={() => {
                // Trigger form submission
                const form = document.querySelector('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Popup conflict modal */}
        {showPopupConflictModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setShowPopupConflictModal(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold text-red-700 mb-4">
                Popup Feature Conflict
              </h2>
                          <p className="mb-6 text-gray-700">
              You can't enable Emoji Sentiment and Personalized note pop-up at the same time because that's pop-ups on top of pop-ups—which would be weird.
            </p>
              <button
                onClick={() => setShowPopupConflictModal(null)}
                className="bg-slate-blue text-white px-6 py-2 rounded hover:bg-slate-blue/90 font-semibold mt-2"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </>
    );
  },
);

export default ServicePromptPageForm;
