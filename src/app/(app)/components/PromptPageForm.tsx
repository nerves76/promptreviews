"use client";
import React from "react";
import { useState, useEffect } from "react";
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import { generateContextualReview, generateContextualTestimonial } from "@/utils/aiReviewGeneration";
import Icon from "@/components/Icon";
import dynamic from "next/dynamic";
import { slugify } from "@/utils/slugify";
import { useRouter } from "next/navigation";
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import { 
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature
} from "./prompt-features";
import { Input } from "@/app/(app)/components/ui/input";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import { useFallingStars } from "@/hooks/useFallingStars";
import { getFallingIcon } from "@/app/(app)/components/prompt-modules/fallingStarsConfig";
import RobotTooltip from "./RobotTooltip";
import SectionHeader from "./SectionHeader";
import ServicePromptPageForm from "./ServicePromptPageForm";
import PhotoPromptPageForm from "./PhotoPromptPageForm";
import ProductPromptPageForm from "./ProductPromptPageForm";
import EventPromptPageForm from "./EventPromptPageForm";
import EmployeePromptPageForm from "./EmployeePromptPageForm";
import UniversalPromptPageForm from "./UniversalPromptPageForm";


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
): { icon: string; label: string } {
  const lowerUrl = url?.toLowerCase?.() || "";
  const lowerPlatform = (platform || "").toLowerCase();
  if (lowerUrl.includes("google") || lowerPlatform.includes("google"))
    return { icon: "FaGoogle", label: "Google" };
  if (lowerUrl.includes("facebook") || lowerPlatform.includes("facebook"))
    return { icon: "FaFacebook", label: "Facebook" };
  if (lowerUrl.includes("yelp") || lowerPlatform.includes("yelp"))
    return { icon: "FaYelp", label: "Yelp" };
  if (lowerUrl.includes("tripadvisor") || lowerPlatform.includes("tripadvisor"))
    return { icon: "FaTripadvisor", label: "TripAdvisor" };
  if (lowerUrl.includes("amazon") || lowerPlatform.includes("amazon"))
    return { icon: "FaAmazon", label: "Amazon" };
  if (lowerUrl.includes("g2") || lowerPlatform.includes("g2"))
    return { icon: "SiG2", label: "G2" };
  return { icon: "FaRegStar", label: "Other" };
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
  }, [formData.first_name, formData.last_name, formData.phone, formData.email, formData.role]);

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
    setOfferTimelock(initialData.offer_timelock ?? initialData.offerTimelock ?? false);
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
    initialData.falling_enabled ?? (!!initialData.falling_icon) ?? true
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
  const [offerTimelock, setOfferTimelock] = useState(
    initialData.offer_timelock ?? initialData.offerTimelock ?? false,
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
      // Campaign type determination logic (debug logs removed for production)

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

    // Call onSave to save step 1 data - include all fields from initialData
    const dataToSave = {
      ...initialData,  // Include all original fields
      ...formData,     // Override with form's updates
      // Explicitly include critical fields that might be getting lost
      offer_timelock: offerTimelock,
      offer_enabled: offerEnabled,
      offer_title: offerTitle,
      offer_body: offerBody,
      offer_url: offerUrl,
      falling_icon: fallingIcon,
      falling_icon_color: fallingIconColor,
      falling_enabled: fallingEnabled,
      recent_reviews_scope: initialData.recent_reviews_scope || initialData.recentReviewsScope,
      recent_reviews_enabled: initialData.recent_reviews_enabled || initialData.recentReviewsEnabled,
      kickstarters_enabled: initialData.kickstarters_enabled || initialData.kickstartersEnabled,
      selected_kickstarters: initialData.selected_kickstarters || initialData.selectedKickstarters,
    };
    onSave(dataToSave);
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
        onGenerateReview={rest.onGenerateReview}
      />
    );
  }

  if (formData.review_type === "photo") {
    return (
      <PhotoPromptPageForm
        mode={mode}
        initialData={initialData}
        onSave={async (data) => Promise.resolve(onSave(data))}
        onPublish={onPublish}
        pageTitle={pageTitle}
        supabase={supabase}
        businessProfile={businessProfile}
        isUniversal={isUniversal}
        onPublishSuccess={onPublishSuccess}
        campaignType={campaignType}
        {...rest}
      />
    );
  }

  if (formData.review_type === "product") {
    return (
      <ProductPromptPageForm
        mode={mode}
        initialData={initialData}
        onSave={onSave}
        onPublish={onPublish}
        pageTitle={pageTitle}
        supabase={supabase}
        businessProfile={businessProfile}
        accountId={businessProfile?.account_id || ""}
        isUniversal={isUniversal}
        onPublishSuccess={onPublishSuccess}
        step={step}
        onStepChange={onStepChange}
        {...rest}
      />
    );
  }

  if (formData.review_type === "event") {
    return (
      <EventPromptPageForm
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
        onGenerateReview={rest.onGenerateReview}
      />
    );
  }

  if (formData.review_type === "employee") {
    return (
      <EmployeePromptPageForm
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
        onGenerateReview={rest.onGenerateReview}
      />
    );
  }

  if (formData.review_type === "universal" || isUniversal) {
    return (
      <UniversalPromptPageForm
        mode={mode}
        initialData={initialData}
        onSave={onSave}
        onPublish={onPublish}
        pageTitle={pageTitle}
        supabase={supabase}
        businessProfile={businessProfile}
        isUniversal={true}
        onPublishSuccess={onPublishSuccess}
        campaignType="public"
        onGenerateReview={rest.onGenerateReview}
      />
    );
  }

  // Default fallback for other review types or when no review_type is set
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">Unsupported review type: {formData.review_type}</p>
    </div>
  );
}
