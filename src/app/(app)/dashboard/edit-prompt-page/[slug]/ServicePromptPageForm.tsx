import React, { useState, useEffect, forwardRef } from "react";
import OfferToggle from "../components/OfferToggle";
import { 
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature
} from "@/app/(app)/components/prompt-features";
import ReviewWriteSection, {
  ReviewWritePlatform,
} from "../components/ReviewWriteSection";
import { Input } from "@/app/(app)/components/ui/input";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import Icon from "@/components/Icon";
import { useFallingStars } from "@/hooks/useFallingStars";
import RobotTooltip from "@/app/(app)/components/RobotTooltip";

export interface ServicePromptFormState {
  offerEnabled: boolean;
  offerTitle: string;
  offerBody: string;
  offerUrl: string;
  emojiSentimentEnabled: boolean;
  emojiSentimentQuestion: string;
  emojiFeedbackMessage: string;
  emojiThankYouMessage: string;
  reviewPlatforms: ReviewWritePlatform[];
  fallingEnabled: boolean;
  fallingIcon: string;
  fallingIconColor: string;
  aiButtonEnabled: boolean;
  fixGrammarEnabled: boolean;
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
  slug?: string;
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
      slug,
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
      initialData?.emojiThankYouMessage || "Thank you for your feedback!",
    );
    const [reviewPlatforms, setReviewPlatforms] = useState<
      ReviewWritePlatform[]
    >(initialData?.reviewPlatforms ?? []);
    const [fallingEnabled, setFallingEnabled] = useState(
      initialData?.fallingEnabled ?? true,
    );
    
    // Use shared falling stars hook instead of hardcoded state
    const { fallingIcon, fallingIconColor, handleIconChange, handleColorChange, initializeValues } = useFallingStars({
      initialIcon: initialData?.fallingIcon ?? "star",
      initialColor: initialData?.fallingIconColor ?? "#fbbf24",
      onFormDataChange: (data) => {
        // Update form data when falling stars change
    
      }
    });
    
    const [aiButtonEnabled, setAiButtonEnabled] = useState(
      initialData?.aiButtonEnabled ?? true,
    );
    const [fixGrammarEnabled, setFixGrammarEnabled] = useState(
      initialData?.fixGrammarEnabled ?? true,
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
            reviewPlatforms,
            fallingEnabled,
            fallingIcon,
            fallingIconColor,
            aiButtonEnabled,
            fixGrammarEnabled,
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
        reviewPlatforms,
        fallingEnabled,
        fallingIcon,
        fallingIconColor,
        aiButtonEnabled,
        fixGrammarEnabled,
        notePopupEnabled,
        friendlyNote,
        onSave,
      ],
    );

    return (
      <>
        {/* Top right Save & publish button */}
        <div className="absolute top-4 right-8 z-20 flex gap-2">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={() => {
              // Trigger form submission
              const form = document.querySelector('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true }));
              }
            }}
          >
            Save & publish
          </button>
        </div>
        
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
              fixGrammarEnabled: false,
              offerEnabled,
              offerTitle,
              offerBody,
              offerUrl,
              emojiSentimentEnabled,
              emojiSentimentQuestion,
              emojiFeedbackMessage,
              emojiThankYouMessage:
                emojiThankYouMessage || "Thank you for your feedback!",
              reviewPlatforms,
              fallingEnabled,
              fallingIcon,
              fallingIconColor,
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
          <OfferFeature
            enabled={offerEnabled}
            onToggle={() => setOfferEnabled((v) => !v)}
            title={offerTitle}
            onTitleChange={setOfferTitle}
            description={offerBody}
            onDescriptionChange={setOfferBody}
            url={offerUrl}
            onUrlChange={setOfferUrl}
          />
          {/* Friendly Note Pop-up Section */}
          <EmojiSentimentFeature
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
            slug={slug}
            disabled={!!notePopupEnabled}
          />
          {/* AI Review Generation Toggle */}
          <AISettingsFeature
              aiGenerationEnabled={aiButtonEnabled}
              fixGrammarEnabled={fixGrammarEnabled}
              onAIEnabledChange={(enabled) => setAiButtonEnabled(enabled)}
              onGrammarEnabledChange={(enabled) => setFixGrammarEnabled(enabled)}
            />
          {/* Falling Stars Section (full module) */}
          <FallingStarsFeature
            enabled={fallingEnabled}
            onToggle={() => setFallingEnabled((v) => !v)}
            icon={fallingIcon}
            onIconChange={handleIconChange}
            color={fallingIconColor}
            onColorChange={handleColorChange}
          />
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
              Save & publish
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
                Cannot Enable Multiple Popups
              </h2>
              <p className="mb-6 text-gray-700">
                You cannot have 2 popups enabled at the same time. You must disable{" "}
                <strong>
                  {showPopupConflictModal === "note" ? "Emoji Feedback Flow" : "Friendly Note Pop-up"}
                </strong>{" "}
                first.
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

ServicePromptPageForm.displayName = 'ServicePromptPageForm';

export default ServicePromptPageForm;
