/**
 * PhotoPromptPageForm Component
 * 
 * Single-step form for creating photo prompt pages.
 * Handles form submission with save and publish in one action, similar to ServicePromptPageForm.
 * Includes all photo-specific features like falling stars, emoji sentiment, offers, etc.
 */

"use client";

import React, { useState, useEffect } from "react";
import { 
  FaCamera, 
  FaStar, 
  FaCommentDots,
  FaGift,
  FaHeart,
  FaSmile,
  FaThumbsUp,
  FaFlower,
  FaPeace,
  FaSun 
} from "react-icons/fa";

import SectionHeader from "./SectionHeader";
import ReviewWriteSection from "./sections/ReviewWriteSection";
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import FallingStarsSection from "./sections/FallingStarsSection";
import EmojiSentimentSection from "./sections/EmojiSentimentSection";
import OfferSection from "./sections/OfferSection";
import PersonalizedNotePopup from "./sections/PersonalizedNotePopup";
import PopupConflictModal from "./modals/PopupConflictModal";

// Helper function to get falling icon
const getFallingIcon = (iconKey: string) => {
  const icons = {
    star: { icon: FaStar, key: "star" },
    heart: { icon: FaHeart, key: "heart" },
    smile: { icon: FaSmile, key: "smile" },
    thumbsup: { icon: FaThumbsUp, key: "thumbsup" },
    flower: { icon: FaFlower, key: "flower" },
    peace: { icon: FaPeace, key: "peace" },
    sun: { icon: FaSun, key: "sun" },
  };
  return icons[iconKey as keyof typeof icons] || icons.star;
};

interface PhotoPromptPageFormProps {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  campaignType: string;
  [key: string]: any;
}

export default function PhotoPromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = false,
  onPublishSuccess,
  campaignType,
  ...rest
}: PhotoPromptPageFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    first_name: initialData.first_name || "",
    last_name: initialData.last_name || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    role: initialData.role || "",
    review_platforms: initialData.review_platforms || [],
    friendly_note: initialData.friendly_note || "",
    name: initialData.name || "", // For public campaigns
    ...initialData,
  });

  // Form submission state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Feature states
  const [aiReviewEnabled, setAiReviewEnabled] = useState(
    initialData.ai_review_enabled ?? initialData.aiReviewEnabled ?? false,
  );
  const [fixGrammarEnabled, setFixGrammarEnabled] = useState(
    initialData.fix_grammar_enabled ?? initialData.fixGrammarEnabled ?? false,
  );

  // Emoji Sentiment states
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(
    initialData.emoji_sentiment_enabled ?? initialData.emojiSentimentEnabled ?? false,
  );
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
    initialData.emoji_sentiment_question ?? initialData.emojiSentimentQuestion ?? "How are you feeling?",
  );
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
    initialData.emoji_feedback_message ?? initialData.emojiFeedbackMessage ?? "Thank you for sharing your experience with us!",
  );
  const [emojiFeedbackPopupHeader, setEmojiFeedbackPopupHeader] = useState(
    initialData.emoji_feedback_popup_header ?? initialData.emojiFeedbackPopupHeader ?? "Tell us more",
  );
  const [emojiFeedbackPageHeader, setEmojiFeedbackPageHeader] = useState(
    initialData.emoji_feedback_page_header ?? initialData.emojiFeedbackPageHeader ?? "Your feedback helps us grow",
  );
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
    initialData.emoji_thank_you_message ?? initialData.emojiThankYouMessage ?? "Thank you for your feedback. It's important to us.",
  );

  // Falling Stars states
  const [fallingEnabled, setFallingEnabled] = useState(
    initialData.falling_enabled ?? initialData.fallingEnabled ?? false,
  );
  const [fallingIcon, setFallingIcon] = useState(
    initialData.falling_icon ?? initialData.fallingIcon ?? "star",
  );
  const [fallingIconColor, setFallingIconColor] = useState(
    initialData.falling_icon_color ?? initialData.fallingIconColor ?? "#facc15",
  );

  // Offer states
  const [offerEnabled, setOfferEnabled] = useState(
    initialData.offer_enabled ?? initialData.offerEnabled ?? false,
  );
  const [offerTitle, setOfferTitle] = useState(
    initialData.offer_title ?? initialData.offerTitle ?? "",
  );
  const [offerBody, setOfferBody] = useState(
    initialData.offer_body ?? initialData.offerBody ?? "",
  );
  const [offerUrl, setOfferUrl] = useState(
    initialData.offer_url ?? initialData.offerUrl ?? "",
  );

  // Personalized Note Popup states
  const [notePopupEnabled, setNotePopupEnabled] = useState(
    initialData.show_friendly_note ?? initialData.notePopupEnabled ?? false,
  );

  // Modal states
  const [showPopupConflictModal, setShowPopupConflictModal] = useState(false);

  // Form validation
  const validateForm = () => {
    setFormError("");

    // For individual campaigns, require personal information
    if (campaignType === 'individual') {
      if (!formData.first_name.trim()) {
        setFormError("First name is required for individual prompt pages.");
        return false;
      }
      if (!formData.email.trim() && !formData.phone.trim()) {
        setFormError("Please enter at least an email or phone number for individual prompt pages.");
        return false;
      }
    } else {
      // For public campaigns, require a campaign name
      if (!formData.name?.trim()) {
        setFormError("Campaign name is required for public prompt pages.");
        return false;
      }
    }

    return true;
  };

  // Handle toggle functions
  const handleToggleFalling = () => {
    setFallingEnabled((prev: boolean) => !prev);
  };

  const handleIconChange = (icon: string) => {
    setFallingIcon(icon);
  };

  const handleColorChange = (color: string) => {
    setFallingIconColor(color);
  };

  // Handle form submission (single-step: save and publish)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setFormError("");
    
    try {
      const saveData = {
        ...formData,
        review_type: "photo",
        formComplete: true,
        ai_review_enabled: aiReviewEnabled,
        fix_grammar_enabled: fixGrammarEnabled,
        show_friendly_note: notePopupEnabled,
        friendly_note: formData.friendly_note,
        falling_enabled: fallingEnabled,
        falling_icon: fallingIcon,
        falling_icon_color: fallingIconColor,
        emoji_sentiment_enabled: emojiSentimentEnabled,
        emoji_sentiment_question: emojiSentimentQuestion,
        emoji_feedback_message: emojiFeedbackMessage,
        emoji_feedback_popup_header: emojiFeedbackPopupHeader,
        emoji_feedback_page_header: emojiFeedbackPageHeader,
        emoji_thank_you_message: emojiThankYouMessage,
        offer_enabled: offerEnabled,
        offer_title: offerTitle,
        offer_body: offerBody,
        offer_url: offerUrl,
      };
      
      console.log('🔥 PhotoPromptPageForm calling onSave with:', saveData);
      const result = await onSave(saveData);
      console.log('🔥 PhotoPromptPageForm onSave result:', result);
      
      // Call success callback if provided (this triggers redirect)
      if (onPublishSuccess && result && typeof result === 'object' && 'slug' in result) {
        const typedResult = result as { slug: string };
        console.log('🔥 PhotoPromptPageForm calling onPublishSuccess with slug:', typedResult.slug);
        onPublishSuccess(typedResult.slug);
      } else {
        console.log('🔥 PhotoPromptPageForm - no onPublishSuccess callback or slug');
      }
    } catch (error) {
      console.error('Error saving photo prompt page:', error);
      setFormError('Failed to save prompt page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // When notePopupEnabled changes, update formData
  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      show_friendly_note: notePopupEnabled,
    }));
  }, [notePopupEnabled]);

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto bg-white px-6 py-8"
    >
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold leading-6 text-slate-blue">
            {pageTitle}
          </h1>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Save & Publish"}
          </button>
        </div>
        
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {formError}
          </div>
        )}

        {/* Photo Prompt Page Header */}
        <SectionHeader
          icon={<FaCamera className="w-7 h-7 text-slate-blue" />}
          title="Photo testimonial template"
          subCopy="Create a template that your client will see when submitting their photo + testimonial"
        />

        {/* Customer details section - only for individual campaigns */}
        {!isUniversal && campaignType !== 'public' && (
          <CustomerDetailsSection
            formData={formData}
            onFormDataChange={(updateFn) => {
              if (typeof updateFn === 'function') {
                setFormData(updateFn);
              } else {
                // Legacy: direct object passed
                setFormData((prev: any) => ({ ...prev, ...updateFn }));
              }
            }}
            campaignType={campaignType}
          />
        )}

        {/* Campaign name for public campaigns */}
        {campaignType === 'public' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                placeholder="Enter a name for this campaign"
              />
            </div>
          </div>
        )}

        {/* Review platforms section */}
        <ReviewWriteSection
          value={formData.review_platforms}
          onChange={(platforms) => setFormData((prev: any) => ({ ...prev, review_platforms: platforms }))}
          aiReviewEnabled={aiReviewEnabled}
          onAiReviewToggle={setAiReviewEnabled}
          fixGrammarEnabled={fixGrammarEnabled}
          onFixGrammarToggle={setFixGrammarEnabled}
        />

        {/* Photo-specific features */}
        <div className="space-y-8">
          {/* Falling Stars Section */}
          <FallingStarsSection
            enabled={fallingEnabled}
            onToggle={handleToggleFalling}
            icon={fallingIcon}
            onIconChange={handleIconChange}
            color={fallingIconColor}
            onColorChange={handleColorChange}
          />

          {/* Offer Section */}
          <OfferSection
            enabled={offerEnabled}
            onToggle={() => setOfferEnabled(!offerEnabled)}
            title={offerTitle}
            onTitleChange={setOfferTitle}
            description={offerBody}
            onDescriptionChange={setOfferBody}
            url={offerUrl}
            onUrlChange={setOfferUrl}
          />

          {/* Personalized Note Popup Section */}
          <PersonalizedNotePopup
            enabled={notePopupEnabled}
            onToggle={() => {
              if (emojiSentimentEnabled) {
                setShowPopupConflictModal(true);
              } else {
                setNotePopupEnabled(!notePopupEnabled);
              }
            }}
            note={formData.friendly_note || ""}
            onNoteChange={(note) => setFormData((prev: any) => ({ ...prev, friendly_note: note }))}
            icon={<FaCommentDots className="w-6 h-6" />}
            placeholderText="Enter your personalized note that will appear after your client submits their photo testimonial..."
          />

          {/* Emoji Sentiment Section */}
          <EmojiSentimentSection
            enabled={emojiSentimentEnabled}
            onToggle={() => {
              if (notePopupEnabled) {
                setShowPopupConflictModal(true);
              } else {
                setEmojiSentimentEnabled(!emojiSentimentEnabled);
              }
            }}
            question={emojiSentimentQuestion}
            onQuestionChange={setEmojiSentimentQuestion}
            feedbackMessage={emojiFeedbackMessage}
            onFeedbackMessageChange={setEmojiFeedbackMessage}
            feedbackPopupHeader={emojiFeedbackPopupHeader}
            onFeedbackPopupHeaderChange={setEmojiFeedbackPopupHeader}
            feedbackPageHeader={emojiFeedbackPageHeader}
            onFeedbackPageHeaderChange={setEmojiFeedbackPageHeader}
            thankYouMessage={emojiThankYouMessage}
            onThankYouMessageChange={setEmojiThankYouMessage}
            disabled={!!notePopupEnabled}
            slug={formData.slug}
          />
        </div>
      </div>

      {/* Popup Conflict Modal */}
      <PopupConflictModal
        isOpen={showPopupConflictModal}
        onClose={() => setShowPopupConflictModal(false)}
        onConfirm={(choice) => {
          if (choice === "note") {
            setEmojiSentimentEnabled(false);
            setNotePopupEnabled(true);
          } else {
            setNotePopupEnabled(false);
            setEmojiSentimentEnabled(true);
          }
          setShowPopupConflictModal(false);
        }}
      />
    </form>
  );
} 