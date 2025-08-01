import React, { useState, useEffect, forwardRef, useCallback } from "react";

import ReviewPlatformsSection, {
  ReviewPlatformLink,
} from "../components/ReviewPlatformsSection";
import { Input } from "@/app/components/ui/input";
import { 
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  PersonalizedNoteFeature,
  KickstartersFeature
} from "@/app/components/prompt-features";
import { useFallingStars } from "@/hooks/useFallingStars";
import SectionHeader from "@/app/components/SectionHeader";
import Icon from "@/components/Icon";

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
  fixGrammarEnabled: boolean;
  notePopupEnabled: boolean;
  friendlyNote: string;
  kickstartersEnabled: boolean;
  selectedKickstarters: string[];
}

interface UniversalPromptPageFormProps {
  onSave: (state: UniversalPromptFormState) => void;
  isLoading?: boolean;
  initialData?: Partial<UniversalPromptFormState>;
  showResetButton?: boolean;
  businessReviewPlatforms?: ReviewPlatformLink[];
  slug?: string;
  businessProfile?: {
    name?: string;
    business_name?: string;
  } | null;
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
      businessProfile,
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
      initialData?.fallingEnabled ?? true,
    );
    
    // Use shared falling stars hook
    const { fallingIcon, fallingIconColor, handleIconChange, handleColorChange, initializeValues } = useFallingStars({
      initialIcon: initialData?.fallingIcon ?? "star",
      initialColor: initialData?.fallingIconColor ?? "#fbbf24"
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
    const [kickstartersEnabled, setKickstartersEnabled] = useState(
      initialData?.kickstartersEnabled ?? false,
    );
    const [selectedKickstarters, setSelectedKickstarters] = useState<string[]>(
      initialData?.selectedKickstarters ?? [],
    );

    // AI Generation loading state
    const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);

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

    // Handle AI review generation with loading state
    const handleGenerateAIReview = async (idx: number) => {
      setAiGeneratingIndex(idx);
      try {
        // TODO: Implement AI review generation logic
        console.log('Generating AI review for index:', idx);
        // Simulate AI generation delay
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Failed to generate AI review:", error);
      } finally {
        setAiGeneratingIndex(null);
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
            fixGrammarEnabled,
            notePopupEnabled: notePopupEnabled,
            friendlyNote,
            kickstartersEnabled,
            selectedKickstarters,
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
            fixGrammarEnabled,
            notePopupEnabled: notePopupEnabled,
            friendlyNote,
            kickstartersEnabled,
            selectedKickstarters,
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
        fixGrammarEnabled,
        notePopupEnabled,
        friendlyNote,
        kickstartersEnabled,
        selectedKickstarters,
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
            fixGrammarEnabled,
            notePopupEnabled,
            friendlyNote,
            kickstartersEnabled,
            selectedKickstarters,
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
        {/* Shared Feature Components */}
        <div className="space-y-8">
          {/* Kickstarters Feature */}
          <KickstartersFeature
            enabled={kickstartersEnabled}
            selectedKickstarters={selectedKickstarters}
            businessName={(() => {
              const name = businessProfile?.name || businessProfile?.business_name || "Business Name";
          
              return name;
            })()}
            onEnabledChange={setKickstartersEnabled}
            onKickstartersChange={setSelectedKickstarters}
            initialData={{
              kickstarters_enabled: kickstartersEnabled,
              selected_kickstarters: selectedKickstarters,
            }}
            editMode={true}
          />

          {/* Offer Feature */}
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

          {/* Personalized Note Feature */}
          <PersonalizedNoteFeature
            enabled={notePopupEnabled}
            onToggle={handleNotePopupClick}
            note={friendlyNote}
            onNoteChange={setFriendlyNote}
            disabled={emojiSentimentEnabled}
            editMode={true}
          />

          {/* Emoji Sentiment Feature */}
          <EmojiSentimentFeature
            enabled={emojiSentimentEnabled}
            onToggle={handleEmojiSentimentClick}
            question={emojiSentimentQuestion}
            onQuestionChange={setEmojiSentimentQuestion}
            feedbackMessage={emojiFeedbackMessage}
            onFeedbackMessageChange={setEmojiFeedbackMessage}
            feedbackPageHeader={emojiFeedbackPageHeader}
            onFeedbackPageHeaderChange={setEmojiFeedbackPageHeader}
            thankYouMessage={emojiThankYouMessage}
            onThankYouMessageChange={setEmojiThankYouMessage}
            disabled={!!notePopupEnabled}
            slug={slug}
            editMode={true}
          />

          {/* Falling Stars Feature */}
          <FallingStarsFeature
            enabled={fallingEnabled}
            onToggle={() => setFallingEnabled((v) => !v)}
            icon={fallingIcon}
            onIconChange={handleIconChange}
            color={fallingIconColor}
            onColorChange={handleColorChange}
            editMode={true}
          />

          {/* AI Settings Feature */}
          <AISettingsFeature
            aiGenerationEnabled={aiButtonEnabled}
            fixGrammarEnabled={fixGrammarEnabled}
            onAIEnabledChange={setAiButtonEnabled}
            onGrammarEnabledChange={setFixGrammarEnabled}
            initialData={{
              ai_button_enabled: aiButtonEnabled,
              fix_grammar_enabled: fixGrammarEnabled,
            }}
          />
        </div>
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
                {showPopupConflictModal === "note" 
                  ? "Emoji Sentiment Flow" 
                  : "Personalized Note Pop-up"}
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
