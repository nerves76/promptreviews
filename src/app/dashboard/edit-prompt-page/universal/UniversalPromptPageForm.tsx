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
  KickstartersFeature,
  RecentReviewsFeature
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
  showFriendlyNote: boolean;
  friendlyNote: string;
  kickstartersEnabled: boolean;
  selectedKickstarters: string[];
  recentReviewsEnabled: boolean;
  recentReviewsScope: 'current_page' | 'all_pages';
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
    const [offerEnabled, setOfferEnabled] = useState(false);
    const [offerTitle, setOfferTitle] = useState("");
    const [offerBody, setOfferBody] = useState("");
    const [offerUrl, setOfferUrl] = useState("");
    const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
    const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState("How was Your Experience?");
    const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState("We value your feedback! Let us know how we can do better.");
    const [emojiThankYouMessage, setEmojiThankYouMessage] = useState("Thank you for your feedback. It's important to us.");
    const [emojiFeedbackPopupHeader, setEmojiFeedbackPopupHeader] = useState("How can we improve?");
    const [emojiFeedbackPageHeader, setEmojiFeedbackPageHeader] = useState("Your feedback helps us grow");
    const [reviewPlatforms, setReviewPlatforms] = useState<ReviewPlatformLink[]>([]);
    const [fallingEnabled, setFallingEnabled] = useState(true);
    
    // Use shared falling stars hook
    const { fallingIcon, fallingIconColor, handleIconChange, handleColorChange, initializeValues } = useFallingStars({
      initialIcon: "star",
      initialColor: "#fbbf24",
      onFormDataChange: (data) => {
        // The hook will update its own state
        console.log('Falling stars data changed:', data);
      }
    });
    const [aiButtonEnabled, setAiButtonEnabled] = useState(true);
    const [fixGrammarEnabled, setFixGrammarEnabled] = useState(true);
    const [notePopupEnabled, setNotePopupEnabled] = useState(false);
    const [showFriendlyNote, setShowFriendlyNote] = useState(false);
    const [friendlyNote, setFriendlyNote] = useState("");
    const [kickstartersEnabled, setKickstartersEnabled] = useState(false);
    const [selectedKickstarters, setSelectedKickstarters] = useState<string[]>([]);
    const [recentReviewsEnabled, setRecentReviewsEnabled] = useState(false);
    const [recentReviewsScope, setRecentReviewsScope] = useState<'current_page' | 'all_pages'>('current_page');

    // AI Generation loading state
    const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);

    // Add state for warning modal
    const [showPopupConflictModal, setShowPopupConflictModal] = useState<
      null | "emoji" | "note"
    >(null);

    // Initialize all state from initialData when it changes
    useEffect(() => {
      if (initialData) {
        setOfferEnabled(initialData.offerEnabled ?? false);
        setOfferTitle(initialData.offerTitle ?? "");
        setOfferBody(initialData.offerBody ?? "");
        setOfferUrl(initialData.offerUrl ?? "");
        setEmojiSentimentEnabled(initialData.emojiSentimentEnabled ?? false);
        setEmojiSentimentQuestion(initialData.emojiSentimentQuestion || "How was Your Experience?");
        setEmojiFeedbackMessage(initialData.emojiFeedbackMessage || "We value your feedback! Let us know how we can do better.");
        setEmojiThankYouMessage(initialData.emojiThankYouMessage || "Thank you for your feedback. It's important to us.");
        setEmojiFeedbackPopupHeader(initialData.emojiFeedbackPopupHeader || "How can we improve?");
        setEmojiFeedbackPageHeader(initialData.emojiFeedbackPageHeader || "Your feedback helps us grow");
        setReviewPlatforms(initialData.reviewPlatforms ?? []);
        setFallingEnabled(initialData.fallingEnabled ?? true);
        setAiButtonEnabled(initialData.aiButtonEnabled ?? true);
        setFixGrammarEnabled(initialData.fixGrammarEnabled ?? true);
        setNotePopupEnabled(initialData.notePopupEnabled ?? false);
        setShowFriendlyNote(initialData.showFriendlyNote ?? false);
        setFriendlyNote(initialData.friendlyNote ?? "");
        setKickstartersEnabled(initialData.kickstartersEnabled ?? false);
        setSelectedKickstarters(initialData.selectedKickstarters ?? []);
        setRecentReviewsEnabled(initialData.recentReviewsEnabled ?? false);
        setRecentReviewsScope(initialData.recentReviewsScope ?? 'current_page');
        
        // Initialize falling stars hook with proper values
        if (initialData.fallingIcon || initialData.fallingIconColor) {
          initializeValues(initialData.fallingIcon || "star", initialData.fallingIconColor || "#fbbf24");
        }
      }
    }, [initialData, initializeValues]);



    const handleEmojiSentimentClick = () => {
      // If trying to turn ON emoji sentiment while friendly note is enabled, show conflict
      if (!emojiSentimentEnabled && showFriendlyNote) {
        setShowPopupConflictModal("emoji");
      } else {
        // Always allow turning OFF emoji sentiment, or turning ON when no conflict
        setEmojiSentimentEnabled(prev => !prev);
      }
    };

    const handleFriendlyNoteClick = () => {
      // If trying to turn ON friendly note while emoji sentiment is enabled, show conflict
      if (!showFriendlyNote && emojiSentimentEnabled) {
        setShowPopupConflictModal("note");
      } else {
        // Always allow turning OFF friendly note, or turning ON when no conflict
        setShowFriendlyNote(prev => !prev);
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
            showFriendlyNote: showFriendlyNote,
            friendlyNote,
            kickstartersEnabled,
            selectedKickstarters,
            recentReviewsEnabled,
            recentReviewsScope,
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
            showFriendlyNote: showFriendlyNote,
            friendlyNote,
            kickstartersEnabled,
            selectedKickstarters,
            recentReviewsEnabled,
            recentReviewsScope,
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
        recentReviewsEnabled,
        recentReviewsScope,
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
            showFriendlyNote,
            friendlyNote,
            kickstartersEnabled,
            selectedKickstarters,
            recentReviewsEnabled,
            recentReviewsScope,
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

          {/* Recent Reviews Feature */}
          <RecentReviewsFeature
            enabled={recentReviewsEnabled}
            onEnabledChange={(enabled) => setRecentReviewsEnabled(enabled)}
            scope={recentReviewsScope}
            onScopeChange={(scope) => setRecentReviewsScope(scope)}
            initialData={{
              recent_reviews_enabled: recentReviewsEnabled,
              recent_reviews_scope: recentReviewsScope,
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

          {/* Friendly Note Feature */}
          <PersonalizedNoteFeature
            enabled={showFriendlyNote}
            onToggle={handleFriendlyNoteClick}
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
            disabled={!!showFriendlyNote}
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
                  : "Friendly Note Pop-up"}
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
