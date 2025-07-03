import React, { useState, useEffect, forwardRef } from "react";

import OfferToggle from "../components/OfferToggle";
import EmojiSentimentSection from "../components/EmojiSentimentSection";
import ReviewPlatformsSection, {
  ReviewPlatformLink,
} from "../components/ReviewPlatformsSection";
import { Input } from "@/app/components/ui/input";
import OfferSection from "../components/OfferSection";
import DisableAIGenerationSection from "@/app/components/DisableAIGenerationSection";
import FallingStarsSection from "@/app/components/FallingStarsSection";
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
        getCurrentState: () => ({
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
        emojiLabels,
        reviewPlatforms,
        fallingEnabled,
        fallingIcon,
        aiButtonEnabled,
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
            emojiLabels,
            reviewPlatforms,
            fallingEnabled,
            fallingIcon,
            aiButtonEnabled,
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
        {/* Falling Stars Section (using new component) */}
        <FallingStarsSection
          enabled={fallingEnabled}
          onToggle={() => setFallingEnabled((v) => !v)}
          icon={fallingIcon}
          onIconChange={setFallingIcon}
        />
        {/* No Save button here; Save is handled by parent */}
      </form>
      

    </>
  );
  },
);

UniversalPromptPageForm.displayName = 'UniversalPromptPageForm';

export default UniversalPromptPageForm;
