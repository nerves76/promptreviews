"use client";
import React from "react";
import { useState, useEffect } from "react";
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import { generateContextualReview, generateContextualTestimonial } from "@/utils/aiReviewGeneration";
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
  FaMobile,
} from "react-icons/fa";
import dynamic from "next/dynamic";
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
import ServicePromptPageForm from "./ServicePromptPageForm";


/**
 * PromptPageForm component
 *
 * Usage: Main form for all prompt page types (service, product, photo+testimonial, universal).
 * - Composes all modular sections: SectionHeader, ReviewWriteSection, OfferSection, EmojiSentimentSection, etc.
 * - Always use SectionHeader for section/module headers.
 * - Use PageCard for page layout and floating icon.
 * - AI Gen buttons must use the standardized style (see ReviewWriteSection).
 *
 * See DESIGN_GUIDELINES.md and README.md for structure, section header, and button conventions.
 */

function getPlatformIcon(
  url: string,
  platform: string,
): { icon: any; label: string } {
  const lowerUrl = url?.toLowerCase?.() || "";
  const lowerPlatform = (platform || "").toLowerCase();
  if (lowerUrl.includes("google") || lowerPlatform.includes("google"))
    return { icon: FaGoogle, label: "Google" };
  if (lowerUrl.includes("facebook") || lowerPlatform.includes("facebook"))
    return { icon: FaFacebook, label: "Facebook" };
  if (lowerUrl.includes("yelp") || lowerPlatform.includes("yelp"))
    return { icon: FaYelp, label: "Yelp" };
  if (lowerUrl.includes("tripadvisor") || lowerPlatform.includes("tripadvisor"))
    return { icon: FaTripadvisor, label: "TripAdvisor" };
  return { icon: FaRegStar, label: "Other" };
}

export default function PromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = false,
  onPublishSuccess,
  step = 1,
  onStepChange,
  ...rest
}: {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  step?: number;
  onStepChange?: (step: number) => void;
  [key: string]: any;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ...initialData,
    emojiThankYouMessage:
      initialData.emoji_thank_you_message ||
      initialData.emojiThankYouMessage ||
      "",
    show_friendly_note: initialData.show_friendly_note ?? true,
  });

  // Debug log for formData changes
  useEffect(() => {
    console.log("[DEBUG] formData updated:", {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      email: formData.email,
      role: formData.role,
    });
  }, [formData.first_name, formData.last_name, formData.phone, formData.email, formData.role]);

  useEffect(() => {
    console.log("[DEBUG] PromptPageForm useEffect - initialData:", initialData);
    console.log("[DEBUG] Customer details from initialData:", {
      first_name: initialData.first_name,
      last_name: initialData.last_name,
      phone: initialData.phone,
      email: initialData.email,
      role: initialData.role,
    });
    
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
    setNfcTextEnabled(initialData.nfc_text_enabled ?? false);
    setFallingEnabled(!!initialData.falling_icon);
    handleIconChange(initialData.falling_icon || "star");
    setNoPlatformReviewTemplate(initialData.no_platform_review_template || "");
    setServices(initialData.features_or_benefits || []);
  }, [initialData]);

  // Ensure slug is set for the View button
  useEffect(() => {
    if (!formData.slug) {
      // Try to get slug from initialData, props, or from the URL
      let slug = initialData.slug || rest.slug;
      if (!slug && typeof window !== "undefined") {
        // Try to extract slug from the pathname (e.g. /dashboard/edit-prompt-page/universal-foo)
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


  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<string[]>(
    initialData.features_or_benefits || [],
  );
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
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
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
  
  // NFC text toggle state
  const [nfcTextEnabled, setNfcTextEnabled] = useState(
    initialData.nfc_text_enabled ?? false,
  );
  
  // Sync notePopupEnabled with initialData when it changes
  useEffect(() => {
    if (initialData.show_friendly_note !== undefined) {
      setNotePopupEnabled(initialData.show_friendly_note);
    }
  }, [initialData.show_friendly_note]);

  const [submitted, setSubmitted] = useState(false);

  // Add state for warning modal
  const [showPopupConflictModal, setShowPopupConflictModal] = useState<
    null | "emoji" | "note"
  >(null);





  // Handlers for review platforms
  const handleAddPlatform = () => {
    setFormData((prev: any) => ({
      ...prev,
      review_platforms: [...prev.review_platforms, { platform: "", url: "" }],
    }));
  };
  const handleRemovePlatform = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      review_platforms: prev.review_platforms.filter(
        (_: any, i: number) => i !== index,
      ),
    }));
  };
  const handlePlatformChange = (
    index: number,
    field: keyof (typeof formData.review_platforms)[0],
    value: any,
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      review_platforms: prev.review_platforms.map((platform: any, i: number) =>
        i === index ? { ...platform, [field]: value } : platform,
      ),
    }));
  };

  // AI review generation
  const handleGenerateAIReview = async (index: number) => {
    if (!businessProfile) {
      setError("Business profile not loaded. Please try again.");
      return;
    }
    setGeneratingReview(index);
    try {
      // Create comprehensive page context based on review type
      const pageData = {
        review_type: formData.review_type || 'general',
        project_type: formData.features_or_benefits?.join(", ") || formData.project_type || "",
        product_description: formData.product_description,
        outcomes: formData.outcomes,
        client_name: formData.client_name,
        location: formData.location,
        friendly_note: formData.friendly_note,
        date_completed: formData.date_completed,
        team_member: formData.team_member,
        assigned_team_members: formData.assigned_team_members,
        // Service-specific fields
        service_name: formData.service_name,
        service_description: formData.service_description,
        // Universal page fields
        is_universal: formData.is_universal,
      };
      
      const reviewerData = {
        firstName: formData.first_name || "",
        lastName: formData.last_name || "",
        role: formData.role || "",
      };
      
      const review = await generateContextualReview(
        businessProfile,
        pageData,
        reviewerData,
        formData.review_platforms[index].platform,
        formData.review_platforms[index].wordCount || 200,
        formData.review_platforms[index].customInstructions
      );
      setFormData((prev: any) => ({
        ...prev,
        review_platforms: prev.review_platforms.map((link: any, i: number) =>
          i === index ? { ...link, reviewText: review } : link,
        ),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate review",
      );
    } finally {
      setGeneratingReview(null);
    }
  };

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

  // Get campaign type from initialData or localStorage
  const campaignType = initialData.campaign_type || (typeof window !== 'undefined' ? localStorage.getItem('campaign_type') || 'individual' : 'individual');
  
  // Debug logging
  console.log('🚨 PromptPageForm - initialData.campaign_type:', initialData.campaign_type);
  console.log('🚨 PromptPageForm - localStorage campaign_type:', typeof window !== 'undefined' ? localStorage.getItem('campaign_type') : 'N/A');
  console.log('🚨 PromptPageForm - final campaignType:', campaignType);

  // Step 1 validation
  const handleStep1Continue = () => {
    setFormError(null);
    
    // For individual campaigns, require personal information
    if (campaignType === 'individual') {
      if (!formData.first_name.trim()) {
        setFormError("First name is required for individual prompt pages.");
        return;
      }
      if (!formData.email.trim() && !formData.phone.trim()) {
        setFormError("Please enter at least an email or phone number for individual prompt pages.");
        return;
      }
    } else {
      // For public campaigns, require a campaign name
      if (!formData.name?.trim()) {
        setFormError("Campaign name is required for public prompt pages.");
        return;
      }
    }

    // Call onSave to save step 1 data
    onSave(formData);
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

  // Render logic
  if (formData.review_type === "service") {
    return (
      <ServicePromptPageForm
        mode={mode}
        initialData={initialData}
        onSave={onSave}
        onPublish={onPublish}
        pageTitle={pageTitle}
        supabase={supabase}
        businessProfile={businessProfile}
        isUniversal={isUniversal}
        onPublishSuccess={onPublishSuccess}
        campaignType={campaignType}
      />
    );
  }

  if (formData.review_type === "photo") {
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
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            onSave({
              ...formData,
              aiReviewEnabled,
              show_friendly_note: notePopupEnabled,
              friendly_note: formData.friendly_note,
            });
          }}
        >
          {/* Top right button */}
          <div className="absolute top-4 right-8 z-20 flex gap-2">
            {step === 1 ? (
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                onClick={handleStep1Continue}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save & continue"}
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                disabled={isSaving}
              >
                {isSaving ? "Publishing..." : "Save & publish"}
              </button>
            )}
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
            onFormDataChange={(data) => setFormData((prev: any) => ({ ...prev, ...data }))}
            campaignType={campaignType}
          />
          
         
      {/* Step 2 bottom buttons */}
      {step === 2 && (
        <>
          {/* Bottom action row for step 2 create mode */}
          {mode === "create" && (
            <div className="w-full flex justify-between items-center pr-2 pb-4 md:pr-6 md:pb-6 mt-8">
              {/* Bottom left Back button */}
              <div>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-slate-blue shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  onClick={() => onStepChange?.(1)}
                  disabled={isSaving}
                >
                  Back
                </button>
              </div>
              {/* Bottom right Save & publish button */}
              <div>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  disabled={isSaving}
                >
                  {isSaving ? "Publishing..." : "Save & publish"}
                </button>
              </div>
            </div>
          )}
          {/* Bottom action row for step 2 edit mode */}
          {mode === "edit" && (
            <div className="w-full flex justify-between items-center pr-2 pb-4 md:pr-6 md:pb-6 mt-8">
              {/* Bottom left Back button */}
              <div>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-slate-blue shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  onClick={() => onStepChange?.(1)}
                  disabled={isSaving}
                >
                  Back
                </button>
              </div>
              {/* Bottom right Save & publish button */}
              <div>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  disabled={isSaving}
                >
                  {isSaving ? "Publishing..." : "Save & publish"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
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

  // Default fallback for other review types or when no review_type is set
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">Unsupported review type: {formData.review_type}</p>
    </div>
  );
}
