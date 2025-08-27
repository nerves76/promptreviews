import React, { useState, useEffect, forwardRef, useCallback } from "react";

import ReviewPlatformsSection, {
  ReviewPlatformLink,
} from "../components/ReviewPlatformsSection";
import { Input } from "@/app/(app)/components/ui/input";
import { 
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  PersonalizedNoteFeature,
  KickstartersFeature,
  RecentReviewsFeature
} from "@/app/(app)/components/prompt-features";
import { useFallingStars } from "@/hooks/useFallingStars";
import SectionHeader from "@/app/(app)/components/SectionHeader";
import Icon from "@/components/Icon";

export interface UniversalPromptFormState {
  offer_enabled: boolean;
  offer_title: string;
  offer_body: string;
  offer_url: string;
  emoji_sentiment_enabled: boolean;
  emoji_sentiment_question: string;
  emoji_feedback_message: string;
  emoji_thank_you_message: string;
  emoji_feedback_popup_header: string;
  emoji_feedback_page_header: string;
  review_platforms: ReviewPlatformLink[];
  falling_enabled: boolean;
  falling_icon: string;
  falling_icon_color: string;
  ai_button_enabled: boolean;
  fix_grammar_enabled: boolean;
  note_popup_enabled: boolean;
  show_friendly_note: boolean;
  friendly_note: string;
  kickstarters_enabled: boolean;
  selected_kickstarters: string[];
  recent_reviews_enabled: boolean;
  recent_reviews_scope: 'current_page' | 'all_pages';
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
    initialData?.offer_enabled ?? false,
  );
    const [offerTitle, setOfferTitle] = useState(initialData?.offer_title ?? "");
    const [offerBody, setOfferBody] = useState(initialData?.offer_body ?? "");
    const [offerUrl, setOfferUrl] = useState(initialData?.offer_url ?? "");
      const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(
    initialData?.emoji_sentiment_enabled ?? false,
  );
    const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
      initialData?.emoji_sentiment_question || "How was Your Experience?",
    );
    const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
      initialData?.emoji_feedback_message || "We value your feedback! Let us know how we can do better.",
    );
    const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
      initialData?.emoji_thank_you_message &&
        initialData?.emoji_thank_you_message.trim() !== ""
        ? initialData.emoji_thank_you_message
        : "Thank you for your feedback. It's important to us.",
    );
    const [emojiFeedbackPopupHeader, setEmojiFeedbackPopupHeader] = useState(
      initialData?.emoji_feedback_popup_header || "How can we improve?",
    );
    const [emojiFeedbackPageHeader, setEmojiFeedbackPageHeader] = useState(
      initialData?.emoji_feedback_page_header || "Your feedback helps us grow",
    );
    const [reviewPlatforms, setReviewPlatforms] = useState<
      ReviewPlatformLink[]
    >(initialData?.review_platforms ?? []);
      const [fallingEnabled, setFallingEnabled] = useState(
    initialData?.falling_enabled ?? true,
  );
    
    // Use shared falling stars hook
    const { fallingIcon, fallingIconColor, handleIconChange, handleColorChange, initializeValues } = useFallingStars({
      initialIcon: initialData?.falling_icon ?? "star",
      initialColor: initialData?.falling_icon_color ?? "#fbbf24",
      onFormDataChange: (data) => {
        // Update the local state when falling stars hook changes values
        if (data.falling_icon !== undefined) {
          // fallingIcon state is already managed by the hook
        }
        if (data.falling_icon_color !== undefined) {
          // fallingIconColor state is already managed by the hook
        }
      }
    });
      const [aiButtonEnabled, setAiButtonEnabled] = useState(
    initialData?.ai_button_enabled ?? true,
  );
    const [fixGrammarEnabled, setFixGrammarEnabled] = useState(
      initialData?.fix_grammar_enabled ?? true,
    );
    const [notePopupEnabled, setNotePopupEnabled] = useState(
      initialData?.note_popup_enabled ?? false,
    );
    const [showFriendlyNote, setShowFriendlyNote] = useState(
      initialData?.show_friendly_note ?? false,
    );
    const [friendlyNote, setFriendlyNote] = useState(
      initialData?.friendly_note ?? "",
    );
      const [kickstartersEnabled, setKickstartersEnabled] = useState(
    initialData?.kickstarters_enabled ?? false,
  );
    const [selectedKickstarters, setSelectedKickstarters] = useState<string[]>(
      initialData?.selected_kickstarters ?? [],
    );
      const [recentReviewsEnabled, setRecentReviewsEnabled] = useState(
    initialData?.recent_reviews_enabled ?? false,
  );
    const [recentReviewsScope, setRecentReviewsScope] = useState<'current_page' | 'all_pages'>(
      initialData?.recent_reviews_scope ?? 'current_page',
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
        setNotePopupEnabled((prev: boolean) => !prev);
      }
    };

    // Note: These handlers are no longer used since we switched to onEnabledChange
    // Keeping them for reference in case we need to revert
    const handleEmojiSentimentClick = () => {
      if (!emojiSentimentEnabled && showFriendlyNote) {
        setShowPopupConflictModal("emoji");
      } else {
        setEmojiSentimentEnabled(prev => !prev);
      }
    };

    const handleFriendlyNoteClick = () => {
      if (!showFriendlyNote && emojiSentimentEnabled) {
        setShowPopupConflictModal("note");
      } else {
        setShowFriendlyNote((prev: boolean) => !prev);
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
            offer_enabled: offerEnabled,
            offer_title: offerTitle,
            offer_body: offerBody,
            offer_url: offerUrl,
            emoji_sentiment_enabled: emojiSentimentEnabled,
            emoji_sentiment_question: emojiSentimentQuestion,
            emoji_feedback_message: emojiFeedbackMessage,
            emoji_thank_you_message: emojiThankYouMessage,
            emoji_feedback_popup_header: emojiFeedbackPopupHeader,
            emoji_feedback_page_header: emojiFeedbackPageHeader,
            review_platforms: reviewPlatforms,
            falling_enabled: fallingEnabled,
            falling_icon: fallingIcon,
            falling_icon_color: fallingIconColor,
            ai_button_enabled: aiButtonEnabled,
            fix_grammar_enabled: fixGrammarEnabled,
            note_popup_enabled: notePopupEnabled,
            show_friendly_note: showFriendlyNote,
            friendly_note: friendlyNote,
            kickstarters_enabled: kickstartersEnabled,
            selected_kickstarters: selectedKickstarters,
            recent_reviews_enabled: recentReviewsEnabled,
            recent_reviews_scope: recentReviewsScope,
          });
        },
        getCurrentState: () => ({
          offer_enabled: offerEnabled,
          offer_title: offerTitle,
          offer_body: offerBody,
          offer_url: offerUrl,
          emoji_sentiment_enabled: emojiSentimentEnabled,
          emoji_sentiment_question: emojiSentimentQuestion,
          emoji_feedback_message: emojiFeedbackMessage,
          emoji_thank_you_message: emojiThankYouMessage,
          emoji_feedback_popup_header: emojiFeedbackPopupHeader,
          emoji_feedback_page_header: emojiFeedbackPageHeader,
          review_platforms: reviewPlatforms,
          falling_enabled: fallingEnabled,
          falling_icon: fallingIcon,
          falling_icon_color: fallingIconColor,
          ai_button_enabled: aiButtonEnabled,
          fix_grammar_enabled: fixGrammarEnabled,
          note_popup_enabled: notePopupEnabled,
          show_friendly_note: showFriendlyNote,
          friendly_note: friendlyNote,
          kickstarters_enabled: kickstartersEnabled,
          selected_kickstarters: selectedKickstarters,
          recent_reviews_enabled: recentReviewsEnabled,
          recent_reviews_scope: recentReviewsScope,
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
        // reviewPlatforms, // REMOVED: Array causes infinite re-renders
        fallingEnabled,
        fallingIcon,
        fallingIconColor,
        aiButtonEnabled,
        fixGrammarEnabled,
        notePopupEnabled,
        showFriendlyNote,
        friendlyNote,
        kickstartersEnabled,
        // selectedKickstarters, // REMOVED: Array causes infinite re-renders
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
            offer_enabled: offerEnabled,
            offer_title: offerTitle,
            offer_body: offerBody,
            offer_url: offerUrl,
            emoji_sentiment_enabled: emojiSentimentEnabled,
            emoji_sentiment_question: emojiSentimentQuestion,
            emoji_feedback_message: emojiFeedbackMessage,
            emoji_thank_you_message:
              emojiThankYouMessage || "Thank you for your feedback!",
            emoji_feedback_popup_header: emojiFeedbackPopupHeader,
            emoji_feedback_page_header: emojiFeedbackPageHeader,
            review_platforms: reviewPlatforms,
            falling_enabled: fallingEnabled,
            falling_icon: fallingIcon,
            falling_icon_color: fallingIconColor,
            ai_button_enabled: aiButtonEnabled,
            fix_grammar_enabled: fixGrammarEnabled,
            note_popup_enabled: notePopupEnabled,
            show_friendly_note: showFriendlyNote,
            friendly_note: friendlyNote,
            kickstarters_enabled: kickstartersEnabled,
            selected_kickstarters: selectedKickstarters,
            recent_reviews_enabled: recentReviewsEnabled,
            recent_reviews_scope: recentReviewsScope,
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
            onToggle={() => setOfferEnabled((v: boolean) => !v)}
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
            onEnabledChange={setShowFriendlyNote}
            note={friendlyNote}
            onNoteChange={setFriendlyNote}
            emojiSentimentEnabled={emojiSentimentEnabled}
            editMode={true}
          />

          {/* Emoji Sentiment Feature */}
          <EmojiSentimentFeature
            enabled={emojiSentimentEnabled}
            onEnabledChange={setEmojiSentimentEnabled}
            question={emojiSentimentQuestion}
            onQuestionChange={setEmojiSentimentQuestion}
            feedbackMessage={emojiFeedbackMessage}
            onFeedbackMessageChange={setEmojiFeedbackMessage}
            feedbackPageHeader={emojiFeedbackPageHeader}
            onFeedbackPageHeaderChange={setEmojiFeedbackPageHeader}
            thankYouMessage={emojiThankYouMessage}
            onThankYouMessageChange={setEmojiThankYouMessage}
            personalizedNoteEnabled={showFriendlyNote}
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
