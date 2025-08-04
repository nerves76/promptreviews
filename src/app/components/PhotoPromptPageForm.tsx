/**
 * PhotoPromptPageForm Component
 * 
 * Single-step form for creating photo prompt pages.
 * Handles form submission with save and publish in one action, similar to ServicePromptPageForm.
 * Includes all photo-specific features like falling stars, emoji sentiment, offers, etc.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

import SectionHeader from "./SectionHeader";
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import { 
  PersonalizedNoteFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  OfferFeature,
  KickstartersFeature,
  AISettingsFeature,
  RecentReviewsFeature
} from "./prompt-features";

// Helper function to get falling icon
const getFallingIcon = (iconKey: string) => {
  const icons = {
    star: { icon: "FaStar", key: "star" },
    heart: { icon: "FaHeart", key: "heart" },
    smile: { icon: "FaSmile", key: "smile" },
    thumbsup: { icon: "FaHeart", key: "thumbsup" },
    flower: { icon: "FaHeart", key: "flower" },
    peace: { icon: "FaCircle", key: "peace" },
    sun: { icon: "FaCircle", key: "sun" },
  };
  return icons[iconKey as keyof typeof icons] || icons.star;
};

interface PhotoPromptPageFormProps {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => Promise<any>;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  campaignType: string;
  isLoading?: boolean;
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
  isLoading = false,
  ...rest
}: PhotoPromptPageFormProps) {
  const router = useRouter();
  
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
    recent_reviews_enabled: initialData.recent_reviews_enabled ?? false,
    ...initialData,
  });

  // Form submission state
  const [formError, setFormError] = useState("");

  // AI Generation loading state
  const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);

  // Falling Stars states
  const [fallingEnabled, setFallingEnabled] = useState(
    initialData.falling_enabled ?? initialData.fallingEnabled ?? true,
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

  // Emoji Sentiment states
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(
    initialData.emoji_sentiment_enabled ?? false,
  );
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
    initialData.emoji_sentiment_question || "How was Your Experience?",
  );
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
    initialData.emoji_feedback_message || "We value your feedback! Let us know how we can do better.",
  );
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
    initialData.emoji_thank_you_message || "Thank you for your feedback. It's important to us.",
  );
  const [emojiFeedbackPopupHeader, setEmojiFeedbackPopupHeader] = useState(
    initialData.emoji_feedback_popup_header || "How can we improve?",
  );
  const [emojiFeedbackPageHeader, setEmojiFeedbackPageHeader] = useState(
    initialData.emoji_feedback_page_header || "Your feedback helps us grow",
  );

  // AI Settings states
  const [aiButtonEnabled, setAiButtonEnabled] = useState(
    initialData.ai_button_enabled ?? true,
  );
  const [fixGrammarEnabled, setFixGrammarEnabled] = useState(
    initialData.fix_grammar_enabled ?? true,
  );



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
    
    setFormError("");
    
    try {
      const saveData = {
        ...formData,
        review_type: "photo",
        formComplete: true,
        show_friendly_note: notePopupEnabled,
        friendly_note: formData.friendly_note,
        falling_enabled: fallingEnabled,
        falling_icon: fallingIcon,
        falling_icon_color: fallingIconColor,
        offer_enabled: offerEnabled,
        offer_title: offerTitle,
        offer_body: offerBody,
        offer_url: offerUrl,
        // Emoji sentiment fields
        emoji_sentiment_enabled: emojiSentimentEnabled,
        emoji_sentiment_question: emojiSentimentQuestion,
        emoji_feedback_message: emojiFeedbackMessage,
        emoji_thank_you_message: emojiThankYouMessage,
        emoji_feedback_popup_header: emojiFeedbackPopupHeader,
        emoji_feedback_page_header: emojiFeedbackPageHeader,
        // AI settings fields
        ai_button_enabled: aiButtonEnabled,
        fix_grammar_enabled: fixGrammarEnabled,
        // Explicitly include kickstarters fields to ensure they're saved
        kickstarters_enabled: formData.kickstarters_enabled,
        selected_kickstarters: formData.selected_kickstarters,
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold leading-6 text-slate-blue">
            {pageTitle}
          </h1>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save & Publish"}
          </button>
        </div>
        
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {formError}
          </div>
        )}

        {/* Photo Prompt Page Header - only for public campaigns */}
        {campaignType === 'public' && (
          <SectionHeader
            icon={<Icon name="FaCamera" className="w-7 h-7 text-slate-blue" size={28} />}
            title="Prompt page name"
            subCopy="Give your photo prompt page a clear, descriptive name"
          />
        )}

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
            icon={<Icon name="FaCamera" className="w-7 h-7 text-slate-blue" size={28} />}
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

        {/* Review Platforms Section */}
        <ReviewWriteSection
          value={formData.review_platforms || []}
          onChange={(platforms) => setFormData((prev: any) => ({ ...prev, review_platforms: platforms }))}
          onGenerateReview={handleGenerateAIReview}
          hideReviewTemplateFields={campaignType === 'public'}
          aiGeneratingIndex={aiGeneratingIndex}
        />

        {/* Photo-specific features */}
        <div className="space-y-8">
          {/* Kickstarters Feature */}
          <KickstartersFeature
            enabled={formData.kickstarters_enabled || false}
            selectedKickstarters={formData.selected_kickstarters || []}
            businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
            onEnabledChange={(enabled) => setFormData((prev: any) => ({ ...prev, kickstarters_enabled: enabled }))}
            onKickstartersChange={(kickstarters) => setFormData((prev: any) => ({ ...prev, selected_kickstarters: kickstarters }))}
            initialData={{
              kickstarters_enabled: formData.kickstarters_enabled,
              selected_kickstarters: formData.selected_kickstarters,
            }}
            editMode={true}
          />

          {/* Recent Reviews Feature */}
          <RecentReviewsFeature
            enabled={formData.recent_reviews_enabled}
            onEnabledChange={(enabled) => 
              setFormData(prev => ({ ...prev, recent_reviews_enabled: enabled }))
            }
            initialData={{
              recent_reviews_enabled: formData.recent_reviews_enabled,
            }}
            editMode={true}
          />

          {/* Falling Stars Feature */}
          <FallingStarsFeature
            enabled={fallingEnabled}
            onToggle={handleToggleFalling}
            icon={fallingIcon}
            onIconChange={handleIconChange}
            color={fallingIconColor}
            onColorChange={handleColorChange}
            editMode={true}
          />

          {/* Offer Feature */}
          <OfferFeature
            enabled={offerEnabled}
            onToggle={() => setOfferEnabled(!offerEnabled)}
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
            onToggle={() => setNotePopupEnabled(!notePopupEnabled)}
            content={formData.friendly_note}
            onContentChange={(content) => setFormData((prev: any) => ({ ...prev, friendly_note: content }))}
            disabled={emojiSentimentEnabled}
            editMode={true}
          />

          {/* Emoji Sentiment Feature */}
          <EmojiSentimentFeature
            enabled={emojiSentimentEnabled}
            onToggle={() => setEmojiSentimentEnabled(!emojiSentimentEnabled)}
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
            disabled={notePopupEnabled}
            editMode={true}
          />

          {/* AI Settings Feature */}
          <AISettingsFeature
            aiGenerationEnabled={aiButtonEnabled}
            fixGrammarEnabled={fixGrammarEnabled}
            onAIEnabledChange={setAiButtonEnabled}
            onGrammarEnabledChange={setFixGrammarEnabled}
          />

        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-between pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/prompt-pages')}
            className="inline-flex justify-center rounded-md border border-gray-300 py-2 px-4 text-sm font-medium text-gray-700 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? "Publishing..." : "Save & Publish"}
          </button>
        </div>
      </div>


    </form>
  );
} 