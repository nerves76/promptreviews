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
  FaLeaf,
  FaPeace,
  FaSun,
  FaBoxOpen
} from "react-icons/fa";

import SectionHeader from "./SectionHeader";
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import FallingStarsSection from "@/app/components/FallingStarsSection";
import EmojiSentimentSection from "../dashboard/edit-prompt-page/components/EmojiSentimentSection";
import OfferSection from "../dashboard/edit-prompt-page/components/OfferSection";

// Helper function to get falling icon
const getFallingIcon = (iconKey: string) => {
  const icons = {
    star: { icon: FaStar, key: "star" },
    heart: { icon: FaHeart, key: "heart" },
    smile: { icon: FaSmile, key: "smile" },
    thumbsup: { icon: FaThumbsUp, key: "thumbsup" },
    flower: { icon: FaLeaf, key: "flower" },
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
          title="Photo testimonial page"
          subCopy="Create a page where customers can submit photos with their testimonials"
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

        {/* Product/Service Description - always visible */}
        <div className="space-y-6">
          <SectionHeader
            icon={<FaBoxOpen className="w-7 h-7 text-slate-blue" />}
            title="What are they reviewing?"
            subCopy="Describe the product, service, or experience your customer will be providing a photo testimonial about"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product/Service Description <span className="text-red-600">(required)</span>
            </label>
            <textarea
              value={formData.product_description || ""}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, product_description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              placeholder="e.g., our custom wedding photography service, handmade jewelry from our boutique, the new patio renovation we completed"
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              This helps set context for what the customer should focus on in their photo testimonial.
            </div>
          </div>
        </div>

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
          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative">
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
                    setShowPopupConflictModal(true);
                  } else {
                    setNotePopupEnabled(!notePopupEnabled);
                  }
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
                value={formData.friendly_note || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    friendly_note: e.target.value,
                  }))
                }
                rows={4}
                className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-inner"
                placeholder="Enter your personalized note that will appear after your client submits their photo testimonial..."
              />
            )}
          </div>

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

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-8 border-t border-gray-200">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Save & Publish"}
          </button>
        </div>
      </div>

      {/* Popup Conflict Modal */}
      {showPopupConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowPopupConflictModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-red-700 mb-4">
              Cannot Enable Multiple Popups
            </h2>
            <p className="mb-6 text-gray-700">
              You cannot have 2 popups enabled at the same time. You must disable one
              to enable the other.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setEmojiSentimentEnabled(false);
                  setNotePopupEnabled(true);
                  setShowPopupConflictModal(false);
                }}
                className="bg-slate-blue text-white px-4 py-2 rounded hover:bg-slate-blue/90 font-semibold"
              >
                Use Note Popup
              </button>
              <button
                onClick={() => {
                  setNotePopupEnabled(false);
                  setEmojiSentimentEnabled(true);
                  setShowPopupConflictModal(false);
                }}
                className="bg-slate-blue text-white px-4 py-2 rounded hover:bg-slate-blue/90 font-semibold"
              >
                Use Emoji Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
} 