"use client";
import React, { useState, useEffect } from "react";
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import { generateContextualTestimonial } from "@/utils/aiReviewGeneration";
import {
  FaRobot,
  FaInfoCircle,
  FaStar,
  FaGift,
  FaVideo,
  FaImage,
  FaQuoteRight,
  FaCamera,
  FaHeart,
  FaGoogle,
  FaYelp,
  FaFacebook,
  FaTripadvisor,
  FaRegStar,
  FaSmile,
  FaGlobe,
  FaBoxOpen,
  FaThumbsUp,
  FaBolt,
  FaRainbow,
  FaCoffee,
  FaWrench,
  FaGlassCheers,
  FaDumbbell,
  FaPagelines,
  FaPeace,
  FaQuestionCircle,
  FaHandsHelping,
  FaBullseye,
  FaTrophy,
  FaCommentDots,
  FaMagic,
} from "react-icons/fa";
import { slugify } from "@/utils/slugify";
import { useRouter } from "next/navigation";
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import OfferSection from "../dashboard/edit-prompt-page/components/OfferSection";
import EmojiSentimentSection from "../dashboard/edit-prompt-page/components/EmojiSentimentSection";
import DisableAIGenerationSection from "./DisableAIGenerationSection";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import FallingStarsSection from "@/app/components/FallingStarsSection";
import { useFallingStars } from "@/hooks/useFallingStars";
import { getFallingIcon } from "@/app/components/prompt-modules/fallingStarsConfig";
import RobotTooltip from "./RobotTooltip";
import SectionHeader from "./SectionHeader";

/**
 * PhotoPromptPageForm component
 *
 * Purpose: Handles the creation and editing of photo testimonial prompt pages.
 * This component is extracted from the main PromptPageForm to improve maintainability
 * and reduce complexity. It includes photo-specific features like testimonial templates,
 * falling animations, and photo upload capabilities.
 */

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
  const router = useRouter();
  const [formData, setFormData] = useState({
    ...initialData,
    emojiThankYouMessage:
      initialData.emoji_thank_you_message ||
      initialData.emojiThankYouMessage ||
      "",
    show_friendly_note: initialData.show_friendly_note ?? true,
  });

  // Form data tracking for validation (debug logs removed for production)

  useEffect(() => {
    // Initialize form data from props (debug logs removed for production)
    setFormData({
      ...initialData,
      emojiThankYouMessage:
        initialData.emoji_thank_you_message ||
        initialData.emojiThankYouMessage ||
        "",
      show_friendly_note: initialData.show_friendly_note ?? true,
    });
    setOfferEnabled(
      initialData.offer_enabled ?? initialData.offerEnabled ?? false,
    );
    setOfferTitle(initialData.offer_title ?? initialData.offerTitle ?? "");
    setOfferBody(initialData.offer_body ?? initialData.offerBody ?? "");
    setOfferUrl(initialData.offer_url ?? initialData.offerUrl ?? "");
    setEmojiSentimentEnabled(
      initialData.emoji_sentiment_enabled ??
        initialData.emojiSentimentEnabled ??
        false,
    );
    setEmojiSentimentQuestion(
      initialData.emoji_sentiment_question ??
        initialData.emojiSentimentQuestion ??
        "How was your experience?",
    );
    setEmojiFeedbackMessage(
      initialData.emoji_feedback_message ??
        initialData.emojiFeedbackMessage ??
        "We value your feedback! Let us know how we can do better.",
    );
    setEmojiFeedbackPopupHeader(
      initialData.emoji_feedback_popup_header ??
        initialData.emojiFeedbackPopupHeader ??
        "How can we improve?",
    );
    setEmojiFeedbackPageHeader(
      initialData.emoji_feedback_page_header ??
        initialData.emojiFeedbackPageHeader ??
        "Your feedback helps us grow",
    );
    setNotePopupEnabled(initialData.show_friendly_note ?? true);
    setFallingEnabled(!!initialData.falling_icon);
    handleIconChange(initialData.falling_icon || "star");
    setNoPlatformReviewTemplate(initialData.no_platform_review_template || "");
  }, [initialData]);

  // Ensure slug is set for the View button
  useEffect(() => {
    if (!formData.slug) {
      let slug = initialData.slug || rest.slug;
      if (!slug && typeof window !== "undefined") {
        const match = window.location.pathname.match(/edit-prompt-page\/(.+)$/);
        if (match && match[1]) {
          slug = match[1];
        }
      }
      if (slug) {
        setFormData((prev: any) => ({ ...prev, slug }));
      }
    }
  }, [formData.slug, initialData.slug, rest.slug]);

  // State variables
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(
    initialData.emoji_sentiment_enabled ?? initialData.emojiSentimentEnabled ?? false,
  );
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
    initialData.emoji_sentiment_question ?? initialData.emojiSentimentQuestion ?? "How was your experience?",
  );
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
    initialData.emoji_feedback_message ?? initialData.emojiFeedbackMessage ?? "We value your feedback! Let us know how we can do better.",
  );
  const [emojiFeedbackPopupHeader, setEmojiFeedbackPopupHeader] = useState(
    initialData.emoji_feedback_popup_header ?? initialData.emojiFeedbackPopupHeader ?? "How can we improve?",
  );
  const [emojiFeedbackPageHeader, setEmojiFeedbackPageHeader] = useState(
    initialData.emoji_feedback_page_header ?? initialData.emojiFeedbackPageHeader ?? "Your feedback helps us grow",
  );
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
    initialData.emoji_thank_you_message ?? initialData.emojiThankYouMessage ?? "Thank you for your feedback. It's important to us.",
  );
  const [error, setError] = useState<string | null>(null);
  const [noPlatformReviewTemplate, setNoPlatformReviewTemplate] = useState(
    initialData.no_platform_review_template || "",
  );
  const [aiLoadingPhoto, setAiLoadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiReviewEnabled, setAiReviewEnabled] = useState(
    initialData.aiReviewEnabled !== undefined
      ? initialData.aiReviewEnabled
      : true,
  );
  const [fixGrammarEnabled, setFixGrammarEnabled] = useState(
    initialData.fixGrammarEnabled !== undefined
      ? initialData.fixGrammarEnabled
      : true,
  );
  const [fallingEnabled, setFallingEnabled] = useState(
    !!initialData.falling_icon
  );
  const [iconUpdating, setIconUpdating] = useState(false);

  // Use shared falling stars hook
  const { fallingIcon, fallingIconColor, handleIconChange, handleColorChange, initializeValues } = useFallingStars({
    initialIcon: initialData?.falling_icon ?? "star",
    initialColor: initialData?.falling_icon_color ?? "#fbbf24",
    onFormDataChange: (data) => {
      setFormData((prev: any) => ({ ...prev, ...data }));
    }
  });

  // Special Offer state
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

  const [notePopupEnabled, setNotePopupEnabled] = useState(
    initialData.show_friendly_note ?? true,
  );
  
  const [submitted, setSubmitted] = useState(false);

  // Add state for warning modal
  const [showPopupConflictModal, setShowPopupConflictModal] = useState<
    null | "emoji" | "note"
  >(null);

  // Photo testimonial AI template
  const handleGeneratePhotoTemplate = async () => {
    if (!businessProfile) {
      setError("Business profile not loaded. Please try again.");
      return;
    }
    setAiLoadingPhoto(true);
    try {
      // Create photo-specific context
      const pageData = {
        review_type: 'photo',
        project_type: formData.features_or_benefits?.join(", ") || formData.project_type || "",
        product_description: formData.product_description,
        outcomes: formData.outcomes,
        client_name: formData.client_name,
        location: formData.location,
        friendly_note: formData.friendly_note,
        photo_context: "Photo testimonial submission",
        date_completed: formData.date_completed,
        team_member: formData.team_member,
      };
      
      const reviewerData = {
        firstName: formData.first_name || "",
        lastName: formData.last_name || "",
        role: formData.role || "",
      };
      
      const review = await generateContextualTestimonial(
        businessProfile,
        pageData,
        reviewerData,
        formData.friendly_note
      );
      setFormData((prev: any) => ({
        ...prev,
        no_platform_review_template: review,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate testimonial template",
      );
    } finally {
      setAiLoadingPhoto(false);
    }
  };

  // Form validation
  const validateForm = () => {
    setFormError(null);
    
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

  const handleToggleFalling = () => {
    setFallingEnabled((prev: boolean) => !prev);
  };

  // Sync special offer and emoji sentiment state into formData for universal pages
  useEffect(() => {
    if (isUniversal) {
      setFormData((prev: any) => ({
        ...prev,
        offer_enabled: offerEnabled,
        offer_title: offerTitle,
        offer_body: offerBody,
        offer_url: offerUrl,
        emoji_sentiment_enabled: emojiSentimentEnabled,
      }));
    }
  }, [
    offerEnabled,
    offerTitle,
    offerBody,
    offerUrl,
    emojiSentimentEnabled,
    isUniversal,
  ]);

  // When notePopupEnabled changes, update formData
  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      show_friendly_note: notePopupEnabled,
    }));
  }, [notePopupEnabled]);

  return (
    <>
      {submitted && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const left = Math.random() * 98 + Math.random() * 2;
            const duration = 3 + Math.random() * 1.5;
            const delay = Math.random() * 0.5;
            const size = 32 + Math.random() * 8;
            const top = -40 - Math.random() * 360;
            const iconObj = getFallingIcon(fallingIcon);
            
            // Guard clause to ensure iconObj is defined
            if (!iconObj) {
              return null;
            }
            
            const IconComp = iconObj.icon;
            return (
              <IconComp
                key={i}
                className="absolute animate-fall"
                style={{
                  color:
                    iconObj.key === "star"
                      ? "#facc15"
                      : iconObj.key === "heart"
                        ? "#ef4444"
                        : iconObj.key === "smile"
                          ? "#facc15"
                          : iconObj.key === "bolt"
                            ? "#f59e42"
                            : iconObj.key === "rainbow"
                              ? "#d946ef"
                              : iconObj.key === "coffee"
                                ? "#92400e"
                                : iconObj.key === "wrench"
                                  ? "#6b7280"
                                  : iconObj.key === "confetti"
                                    ? "#ec4899"
                                    : iconObj.key === "barbell"
                                      ? "#4b5563"
                                      : iconObj.key === "flower"
                                        ? "#22c55e"
                                        : iconObj.key === "peace"
                                          ? "#a21caf"
                                          : "#facc15",
                  fontSize: size,
                  left: `${left}%`,
                  top,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          
          if (!validateForm()) {
            return;
          }
          
          try {
            await onSave({
              ...formData,
              aiReviewEnabled,
              show_friendly_note: notePopupEnabled,
              friendly_note: formData.friendly_note,
            });
            
            // Only trigger falling animation after successful save
            setSubmitted(true);
          } catch (error) {
            console.error("Save failed:", error);
            // Don't show falling animation on error
          }
        }}
      >
        {/* Top right button */}
        <div className="absolute top-4 right-8 z-20 flex gap-2">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Save & Publish"}
          </button>
        </div>
        <div className="flex flex-col mt-0 md:mt-[3px]">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            {pageTitle || "Photo + Testimonial"}
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
            Grab a glowing testimonial and display it on your site using our widget or use it in your promotional materials.
          </p>
        </div>
        
        {/* Campaign name for public campaigns */}
        {(isUniversal || campaignType === 'public') && (
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              {isUniversal ? 'Prompt page name' : 'Campaign name'} <span className="text-red-600">(required)</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name || ""}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value.slice(0, 50) }))}
              className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
              placeholder={isUniversal ? "Holiday email campaign" : "Summer product launch"}
              maxLength={50}
              required
            />
          </div>
        )}
        
        {/* Customer details section - uses component that handles campaign type logic */}
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

        {/* Form content */}
            {/* Project description */}
            <div className="mb-6">
              <label
                htmlFor="product_description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What was the project? <span className="text-gray-500">(optional)</span>
              </label>
              <Textarea
                id="product_description"
                value={formData.product_description || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    product_description: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Kitchen remodel, website redesign, family photos, etc."
                maxLength={500}
                rows={3}
              />
            </div>

            {/* What went well */}
            <div className="mb-6">
              <label
                htmlFor="outcomes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What went really well? <span className="text-gray-500">(optional)</span>
              </label>
              <Textarea
                id="outcomes"
                value={formData.outcomes || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    outcomes: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="The team was professional, project finished early, exceeded expectations, etc."
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Friendly note */}
            <div className="mb-6">
              <label
                htmlFor="friendly_note"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Personal note <span className="text-gray-500">(optional)</span>
              </label>
              <Textarea
                id="friendly_note"
                value={formData.friendly_note || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    friendly_note: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Thanks for choosing us! We'd love a quick photo + testimonial..."
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Error display */}
            {formError && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{formError}</p>
              </div>
            )}

        {/* Photo testimonial template section */}
            {/* Photo upload section */}
            <SectionHeader
              icon={<FaCamera className="w-7 h-7 text-slate-blue" />}
              title="Photo testimonial template"
              subCopy="Create a template that your client will see when submitting their photo + testimonial"
            />

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="no_platform_review_template"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Testimonial template
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePhotoTemplate}
                    disabled={aiLoadingPhoto}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {aiLoadingPhoto ? (
                      <>
                        <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FaRobot className="h-3 w-3" />
                        <span>AI Generate</span>
                      </>
                    )}
                  </button>
                </div>
                <Textarea
                  id="no_platform_review_template"
                  value={noPlatformReviewTemplate}
                  onChange={(e) => setNoPlatformReviewTemplate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="We had a great experience working with [Business Name]. They were professional, timely, and exceeded our expectations..."
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This template will be pre-filled for clients to edit and personalize
                </p>
              </div>
            </div>

            {/* Additional Settings Sections */}
            <div className="space-y-6">
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

              {/* Personalized Note Pop-up Section */}
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
                        setShowPopupConflictModal("note");
                        return;
                      }
                      setNotePopupEnabled(!notePopupEnabled);
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
                    placeholder="Hi Sarah! It was great working with you on your family photos today. We'd love to hear about your experience. Would you mind sharing a quick review along with one of your favorite photos? Thanks!"
                  />
                )}
              </div>

              {/* Emoji Sentiment Section */}
              <EmojiSentimentSection
                enabled={emojiSentimentEnabled}
                onToggle={() => {
                  if (notePopupEnabled) {
                    setShowPopupConflictModal("emoji");
                    return;
                  }
                  setEmojiSentimentEnabled(!emojiSentimentEnabled);
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

              {/* Disable AI Generation Section */}
              <DisableAIGenerationSection
                aiGenerationEnabled={aiReviewEnabled}
                fixGrammarEnabled={fixGrammarEnabled}
                onToggleAI={() => setAiReviewEnabled(!aiReviewEnabled)}
                onToggleGrammar={() => setFixGrammarEnabled(!fixGrammarEnabled)}
              />

              {/* Falling Stars Section */}
              <FallingStarsSection
                enabled={fallingEnabled}
                onToggle={handleToggleFalling}
                icon={fallingIcon}
                onIconChange={handleIconChange}
                color={fallingIconColor}
                onColorChange={handleColorChange}
              />
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
      </form>
    </>
  );
} 