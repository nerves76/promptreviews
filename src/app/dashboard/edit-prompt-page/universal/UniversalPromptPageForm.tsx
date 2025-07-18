import React, { useState, useEffect, forwardRef, useCallback } from "react";

import OfferToggle from "../components/OfferToggle";
import EmojiSentimentSection from "../components/EmojiSentimentSection";
import ReviewPlatformsSection, {
  ReviewPlatformLink,
} from "../components/ReviewPlatformsSection";
import { Input } from "@/app/components/ui/input";
import OfferSection from "../components/OfferSection";
import DisableAIGenerationSection from "@/app/components/DisableAIGenerationSection";
import FallingStarsSection from "@/app/components/FallingStarsSection";
import { useFallingStars } from "@/hooks/useFallingStars";
import SectionHeader from "@/app/components/SectionHeader";
import { FaCommentDots } from "react-icons/fa";

export interface UniversalPromptFormState {
  offerEnabled: boolean;
  offerTitle: string;
  offerBody: string;
  offerUrl: string;
  emojiSentimentEnabled: boolean;
  emojiSentimentQuestion: string;
  emojiFeedbackMessage: string;
  emojiThankYouMessage: string;
  emojiFeedbackPopupHeader: string;
  emojiFeedbackPageHeader: string;
  reviewPlatforms: ReviewPlatformLink[];
  fallingEnabled: boolean;
  fallingIcon: string;
  fallingIconColor: string;
  aiButtonEnabled: boolean;
  notePopupEnabled: boolean;
  friendlyNote: string;
}

interface UniversalPromptPageFormProps {
  onSave: (state: UniversalPromptFormState) => void;
  isLoading?: boolean;
  initialData?: Partial<UniversalPromptFormState>;
  showResetButton?: boolean;
  businessReviewPlatforms?: ReviewPlatformLink[];
  slug?: string;
}

const UniversalPromptPageForm = forwardRef<any, UniversalPromptPageFormProps>(
  (
    {
      onSave,
      isLoading,
      initialData,
      showResetButton,
      businessReviewPlatforms = [],
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
      initialData?.emojiSentimentQuestion || "How was Your Experience?",
    );
    const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
      initialData?.emojiFeedbackMessage || "We value your feedback! Let us know how we can do better.",
    );
    const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
      initialData?.emojiThankYouMessage &&
        initialData?.emojiThankYouMessage.trim() !== ""
        ? initialData.emojiThankYouMessage
        : "Thank you for your feedback. It's important to us.",
    );
    const [emojiFeedbackPopupHeader, setEmojiFeedbackPopupHeader] = useState(
      initialData?.emojiFeedbackPopupHeader || "How can we improve?",
    );
    const [emojiFeedbackPageHeader, setEmojiFeedbackPageHeader] = useState(
      initialData?.emojiFeedbackPageHeader || "Your feedback helps us grow",
    );
    const [reviewPlatforms, setReviewPlatforms] = useState<
      ReviewPlatformLink[]
    >(initialData?.reviewPlatforms ?? []);
    const [fallingEnabled, setFallingEnabled] = useState(
      initialData?.fallingEnabled ?? false,
    );
    
    // Use shared falling stars hook
    const { fallingIcon, fallingIconColor, handleIconChange, handleColorChange, initializeValues } = useFallingStars({
      initialIcon: initialData?.fallingIcon ?? "star",
      initialColor: initialData?.fallingIconColor ?? "#fbbf24"
    });
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



    const handleNotePopupClick = () => {
      if (emojiSentimentEnabled) {
        setShowPopupConflictModal("note");
      } else {
        setNotePopupEnabled(prev => !prev);
      }
    };

    const handleEmojiSentimentClick = () => {
      if (notePopupEnabled) {
        setShowPopupConflictModal("emoji");
      } else {
        setEmojiSentimentEnabled(prev => !prev);
      }
    };

    // Debug: Log when modal state changes
    React.useEffect(() => {
      console.log('🔍 Modal state changed:', showPopupConflictModal);
    }, [showPopupConflictModal]);

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
            emojiSentimentEnabled: emojiSentimentEnabled,
            emojiSentimentQuestion,
            emojiFeedbackMessage,
            emojiThankYouMessage,
            emojiFeedbackPopupHeader,
            emojiFeedbackPageHeader,
            reviewPlatforms,
            fallingEnabled,
            fallingIcon,
            fallingIconColor,
            aiButtonEnabled,
            notePopupEnabled: notePopupEnabled,
            friendlyNote,
          });
        },
        getCurrentState: () => ({
          offerEnabled,
          offerTitle,
          offerBody,
          offerUrl,
          emojiSentimentEnabled: emojiSentimentEnabled,
          emojiSentimentQuestion,
          emojiFeedbackMessage,
          emojiThankYouMessage,
          emojiFeedbackPopupHeader,
          emojiFeedbackPageHeader,
          reviewPlatforms,
          fallingEnabled,
          fallingIcon,
          fallingIconColor,
          aiButtonEnabled,
          notePopupEnabled: notePopupEnabled,
          friendlyNote,
        }),
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
        emojiFeedbackPopupHeader,
        emojiFeedbackPageHeader,
        reviewPlatforms,
        fallingEnabled,
        fallingIcon,
        fallingIconColor,
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
          console.log('🔍 Form onSubmit triggered');
          
          // Remove the review platform validation from here
          // It's now handled in the parent component's Save button
          if (!emojiThankYouMessage || emojiThankYouMessage.trim() === "") {
            alert(
              "Please enter a thank you message for the emoji sentiment module.",
            );
            return;
          }
          
          const formData = {
            offerEnabled,
            offerTitle,
            offerBody,
            offerUrl,
            emojiSentimentEnabled,
            emojiSentimentQuestion,
            emojiFeedbackMessage,
            emojiThankYouMessage:
              emojiThankYouMessage || "Thank you for your feedback!",
            emojiFeedbackPopupHeader,
            emojiFeedbackPageHeader,
            reviewPlatforms,
            fallingEnabled,
            fallingIcon,
            fallingIconColor,
            aiButtonEnabled,
            notePopupEnabled,
            friendlyNote,
          };
          
          console.log('🔍 Calling onSave with data:', formData);
          onSave(formData);
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
              onClick={handleNotePopupClick}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                notePopupEnabled 
                  ? "bg-slate-blue" 
                  : emojiSentimentEnabled 
                    ? "bg-gray-300 cursor-not-allowed opacity-50" 
                    : "bg-gray-200"
              }`}
              aria-pressed={!!notePopupEnabled}
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
              placeholder="Jonas, it was so good to catch up yesterday. I'm excited about the project. Would you mind dropping us a review? I have a review template you can use or you can write your own. Thanks!"
            />
          )}
        </div>
        {/* Emoji Sentiment Section (shared design) */}
        <EmojiSentimentSection
          enabled={emojiSentimentEnabled}
          onToggle={handleEmojiSentimentClick}
          question={emojiSentimentQuestion}
          onQuestionChange={setEmojiSentimentQuestion}
          feedbackMessage={emojiFeedbackMessage}
          onFeedbackMessageChange={setEmojiFeedbackMessage}
          thankYouMessage={emojiThankYouMessage}
          onThankYouMessageChange={setEmojiThankYouMessage}
          feedbackPopupHeader={emojiFeedbackPopupHeader}
          onFeedbackPopupHeaderChange={setEmojiFeedbackPopupHeader}
          feedbackPageHeader={emojiFeedbackPageHeader}
          onFeedbackPageHeaderChange={setEmojiFeedbackPageHeader}
          slug={slug}
          disabled={!!notePopupEnabled}
        />
        {/* AI Review Generation Toggle */}
                    <DisableAIGenerationSection
              aiGenerationEnabled={aiButtonEnabled}
              fixGrammarEnabled={true}
              onToggleAI={() => setAiButtonEnabled((v) => !v)}
              onToggleGrammar={() => {}}
            />
        {/* Falling Stars Section (using new component) */}
        <FallingStarsSection
          enabled={fallingEnabled}
          onToggle={() => setFallingEnabled((v) => !v)}
          icon={fallingIcon}
          onIconChange={handleIconChange}
          color={fallingIconColor}
          onColorChange={handleColorChange}
        />
        {/* No Save button here; Save is handled by parent */}
      </form>
      
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
                {showPopupConflictModal === "note" ? "Emoji Sentiment Flow" : "Personalized Note Pop-up"}
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

UniversalPromptPageForm.displayName = 'UniversalPromptPageForm';

export default UniversalPromptPageForm;
