"use client";
import React from "react";
import { useState, useEffect } from "react";
import { generateAIReview } from "@/utils/ai";
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
import RobotTooltip from "./RobotTooltip";
import SectionHeader from "./SectionHeader";
import { getFallingIcon } from "@/app/components/prompt-modules/fallingStarsConfig";

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

  useEffect(() => {
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
    setNotePopupEnabled(initialData.show_friendly_note ?? true);
  }, [initialData]);

  // Ensure slug is set for the View button
  useEffect(() => {
    if (!formData.slug) {
      // Try to get slug from initialData or from the URL
      let slug = initialData.slug;
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
  }, [formData.slug, initialData.slug]);

  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<string[]>(
    initialData.features_or_benefits || [],
  );
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
    "How was your experience?",
  );
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
    "We value your feedback! Let us know how we can do better.",
  );
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noPlatformReviewTemplate, setNoPlatformReviewTemplate] = useState(
    formData.no_platform_review_template || "",
  );
  const [aiLoadingPhoto, setAiLoadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiReviewEnabled, setAiReviewEnabled] = useState(
    initialData.aiReviewEnabled !== undefined
      ? initialData.aiReviewEnabled
      : true,
  );
  const [fallingEnabled, setFallingEnabled] = useState(true);
  const [iconUpdating, setIconUpdating] = useState(false);
  const [fallingIcon, setFallingIcon] = useState("star"); // default icon key

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

  const handleIconChange = (key: string) => {
    setFallingIcon(key);
    setFormData((prev: any) => ({ ...prev, falling_icon: key }));
  };

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
      const review = await generateAIReview(
        businessProfile,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          project_type: formData.features_or_benefits.join(", "),
          product_description: formData.product_description,
        },
        formData.review_platforms[index].platform,
        formData.review_platforms[index].wordCount || 200,
        formData.review_platforms[index].customInstructions,
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
      const review = await generateAIReview(
        businessProfile,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          project_type: formData.features_or_benefits?.join(", ") || "",
          product_description: formData.product_description,
        },
        "Photo Testimonial",
        120,
        formData.friendly_note,
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

  // Step 1 validation
  const handleStep1Continue = () => {
    setFormError(null);
    if (!formData.first_name.trim()) {
      setFormError("First name is required.");
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      setFormError("Please enter at least an email or phone number.");
      return;
    }
    setStep(2);
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
            });
          }}
        >
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3 text-slate-blue">
            {pageTitle || "Photo + Testimonial"}
          </h1>
          {/* Instructional text under header */}
          <div className="text-base text-gray-700 -mt-2 mb-8 max-w-2xl">
            Grab a glowing testimonial and display it on your site using our
            widget or use it in your promotional materials.
          </div>
          {/* Standard section header for customer info */}
          <div className="mb-6 flex items-center gap-3">
            <FaInfoCircle className="w-7 h-7 text-slate-blue" />
            <h2 className="text-2xl font-bold text-slate-blue">
              Customer/client details
            </h2>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
              >
                First name <span className="text-red-600">(required)</span>
                <RobotTooltip text="This field is passed to AI for prompt generation." />
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="First name"
                required
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700 mt-4 mb-2"
              >
                Last name
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mt-4 mb-2"
              >
                Phone number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Phone number"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mt-4 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Email"
              />
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="friendly_note"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Personalized note
            </label>
            {notePopupEnabled && (
              <textarea
                id="friendly_note"
                value={formData.friendly_note}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    friendly_note: e.target.value,
                  }))
                }
                rows={4}
                className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-inner"
                placeholder="Ty! It was so great having you in yesterday. You left your scarf! I can drop it by tomorrow on my way in. Thanks for leaving us a review, we need all the positivity we can get.  :)"
              />
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="testimonial"
              className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
            >
              Testimonial template
              <Tooltip text="Write the testimonial you would love for them to write and then give them creative license to customize it." />
            </label>
            <textarea
              id="testimonial"
              value={formData.no_platform_review_template || ""}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  no_platform_review_template: e.target.value,
                }))
              }
              rows={5}
              className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-inner"
              placeholder="Write your testimonial here..."
              required
            />
          </div>
          {/* AI Generate Button (only if enabled) */}
          {aiReviewEnabled && (
            <div className="mb-4 flex justify-start">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border rounded font-semibold shadow text-slate-blue border-slate-blue bg-white hover:bg-slate-blue/10 transition text-sm whitespace-nowrap w-auto min-w-[180px] self-start gap-2"
                onClick={handleGeneratePhotoTemplate}
                disabled={aiLoadingPhoto}
                title="Generate with AI"
              >
                <FaMagic className="w-4 h-4" />
                {aiLoadingPhoto ? "Generating..." : "Generate with AI"}
              </button>
            </div>
          )}
          {/* AI Generate On/Off Module */}
          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8 mt-10">
            <div className="flex flex-row justify-between items-start px-2 py-2">
              <SectionHeader
                icon={<FaRobot className="w-7 h-7 text-slate-blue" />}
                title="AI review generation"
                subCopy={
                  aiReviewEnabled
                    ? 'Customers will see the "Generate with AI" button to help them write a review.'
                    : "The AI review generation button will be hidden from customers on this prompt page."
                }
                className="!mb-0"
                subCopyLeftOffset="ml-9"
              />
              <div className="flex flex-col justify-start pt-1">
                <button
                  type="button"
                  onClick={() => setAiReviewEnabled((v: boolean) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiReviewEnabled ? "bg-slate-blue" : "bg-gray-200"}`}
                  aria-pressed={!!aiReviewEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${aiReviewEnabled ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>
          {/* Falling star module */}
          <FallingStarsSection
            enabled={fallingEnabled}
            onToggle={handleToggleFalling}
            icon={fallingIcon}
            onIconChange={setFallingIcon}
            description="Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below."
          />
          <div className="w-full flex justify-end gap-2 mt-8">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              disabled={isSaving}
            >
              {mode === "create"
                ? isSaving
                  ? "Publishing..."
                  : "Save & publish"
                : isSaving
                  ? "Saving..."
                  : "Save"}
            </button>
          </div>
        </form>
      </>
    );
  }
  if (formData.review_type === "service" && mode === "create") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...formData, ai_button_enabled: aiReviewEnabled });
        }}
      >
        <h1 className="text-4xl font-bold mb-10 mt-2 text-slate-blue">
          Create service prompt page
        </h1>
        {/* Top right button group for step 1 create flow */}
        {mode === "create" && step === 1 && (
          <div className="absolute top-4 right-8 z-20 flex gap-2">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              onClick={handleStep1Continue}
              disabled={isSaving}
            >
              Continue
            </button>
          </div>
        )}
        {/* Top right Save & publish button for step 2 create flow */}
        {mode === "create" &&
          formData.review_type === "service" &&
          step === 2 && (
            <div className="absolute top-4 right-8 z-20 flex gap-2">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                disabled={isSaving}
              >
                {isSaving ? "Publishing..." : "Save & publish"}
              </button>
            </div>
          )}
        <div>
          {step === 1 ? (
            <div className="custom-space-y">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {formError}
                </div>
              )}
              {/* Only show customer/client fields if not universal */}
              {!isUniversal && (
                <>
                  <div className="mb-6 flex items-center gap-3">
                    <FaInfoCircle className="w-7 h-7 text-slate-blue" />
                    <h2 className="text-2xl font-bold text-slate-blue">
                      Customer/client details
                    </h2>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
                      >
                        First name{" "}
                        <span className="text-red-600">(required)</span>
                        <RobotTooltip text="This field is passed to AI for prompt generation." />
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            first_name: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                      >
                        Last name
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            last_name: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                      >
                        Phone number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email || ""}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center max-w-[85ch] gap-1"
                    >
                      Role/position
                      <RobotTooltip text="This field is passed to AI for prompt generation." />
                    </label>
                    <input
                      type="text"
                      id="role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          role: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full max-w-md rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                      placeholder="e.g., store manager, marketing director, student"
                    />
                  </div>
                  {/* Product type fields */}
                  {formData.review_type === "product" ? (
                    <>
                      <div className="mt-20 mb-2 flex items-center gap-2">
                        <FaBoxOpen className="w-5 h-5 text-[#1A237E]" />
                        <h2 className="text-xl font-semibold text-slate-blue">
                          Product Description
                        </h2>
                      </div>
                      <textarea
                        id="product_description"
                        value={formData.product_description || ""}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            product_description: e.target.value,
                          }))
                        }
                        rows={4}
                        className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                        placeholder="Describe the product being reviewed"
                        required
                      />
                      <div className="mt-8 mb-2 flex items-center gap-2">
                        <FaStar className="w-5 h-5 text-[#1A237E]" />
                        <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
                          Features or Benefits{" "}
                          <RobotTooltip text="This field is passed to AI for prompt generation." />
                        </h2>
                      </div>
                      <div className="space-y-2">
                        {(formData.features_or_benefits || [""]).map(
                          (feature: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                className="w-full border px-3 py-2 rounded"
                                value={feature}
                                onChange={(e) => {
                                  const newFeatures = [
                                    ...(formData.features_or_benefits || []),
                                  ];
                                  newFeatures[idx] = e.target.value;
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    features_or_benefits: newFeatures,
                                  }));
                                }}
                                required
                                placeholder="e.g., Long battery life"
                              />
                              {formData.features_or_benefits?.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFeatures = (
                                      formData.features_or_benefits || []
                                    ).filter((_: any, i: number) => i !== idx);
                                    setFormData((prev: any) => ({
                                      ...prev,
                                      features_or_benefits: newFeatures,
                                    }));
                                  }}
                                  className="text-red-600 font-bold"
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          ),
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev: any) => ({
                              ...prev,
                              features_or_benefits: [
                                ...(formData.features_or_benefits || []),
                                "",
                              ],
                            }));
                          }}
                          className="text-blue-600 underline mt-2"
                        >
                          + Add Feature/Benefit
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Services Section (service type) */}
                      <div className="mt-20 mb-2 flex items-center gap-2">
                        <FaWrench className="w-5 h-5 text-[#1A237E]" />
                        <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
                          Services provided{" "}
                          <RobotTooltip text="This field is passed to AI for prompt generation." />
                        </h2>
                      </div>
                      <div className="space-y-2">
                        {services.map((service, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              className="w-full border px-3 py-2 rounded"
                              value={service}
                              onChange={(e) => {
                                const newServices = [...services];
                                newServices[idx] = e.target.value;
                                setServices(newServices);
                                setFormData((prev: any) => ({
                                  ...prev,
                                  features_or_benefits: newServices,
                                }));
                              }}
                              required
                              placeholder="e.g., Web Design"
                            />
                            {services.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newServices = services.filter(
                                    (_, i) => i !== idx,
                                  );
                                  setServices(newServices);
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    features_or_benefits: newServices,
                                  }));
                                }}
                                className="text-red-600 font-bold"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setServices([...services, ""]);
                            setFormData((prev: any) => ({
                              ...prev,
                              features_or_benefits: [...services, ""],
                            }));
                          }}
                          className="text-blue-600 underline mt-2"
                        >
                          + Add Service
                        </button>
                      </div>
                      <div className="mt-10 mb-2 flex items-center gap-2">
                        <FaTrophy className="w-5 h-5 text-[#1A237E]" />
                        <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
                          Outcome{" "}
                          <RobotTooltip text="This field is passed to AI for prompt generation." />
                        </h2>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 mb-5 max-w-[85ch]">
                        Describe the service you provided and how it benefited
                        this individual.
                      </p>
                      <textarea
                        id="product_description"
                        value={formData.product_description}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            product_description: e.target.value,
                          }))
                        }
                        rows={4}
                        className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                        placeholder="Describe the outcome for your client"
                        required
                      />
                    </>
                  )}
                  <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8 mt-10">
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
                            setShowPopupConflictModal("emoji");
                            return;
                          }
                          setNotePopupEnabled((v: boolean) => !v);
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
                    <div className="text-sm text-gray-700 px-2">
                      This note appears as a pop-up at the top of the review
                      page. Use it to set the context and tone for your
                      customer.
                    </div>
                  </div>
                </>
              )}
              <div className="w-full flex justify-end gap-2 mt-8">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  onClick={handleStep1Continue}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* --- NEW MODULAR STEP 2 UI (2024) --- */}
              {/* Review Platforms Section (modular) */}
              <ReviewWriteSection
                value={formData.review_platforms}
                onChange={(platforms) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    review_platforms: platforms,
                  }))
                }
                onGenerateReview={handleGenerateAIReview}
                hideReviewTemplateFields={isUniversal}
              />
              {/* Special Offer Section (modular) */}
              <OfferSection
                enabled={offerEnabled}
                onToggle={() => setOfferEnabled((v: boolean) => !v)}
                title={offerTitle}
                onTitleChange={setOfferTitle}
                description={offerBody}
                onDescriptionChange={setOfferBody}
                url={offerUrl}
                onUrlChange={setOfferUrl}
              />
              {/* Emoji Sentiment Section (modular) */}
              <EmojiSentimentSection
                enabled={emojiSentimentEnabled}
                onToggle={() => {
                  if (notePopupEnabled) {
                    setShowPopupConflictModal("emoji");
                    return;
                  }
                  setEmojiSentimentEnabled((v: boolean) => !v);
                }}
                question={emojiSentimentQuestion}
                onQuestionChange={setEmojiSentimentQuestion}
                feedbackMessage={emojiFeedbackMessage}
                onFeedbackMessageChange={setEmojiFeedbackMessage}
                thankYouMessage={formData.emojiThankYouMessage}
                onThankYouMessageChange={(val: string) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    emojiThankYouMessage: val,
                  }))
                }
                emojiLabels={formData.emojiLabels}
                onEmojiLabelChange={(idx: number, val: string) =>
                  setFormData((prev: any) => {
                    const newLabels = [...(prev.emojiLabels || [])];
                    newLabels[idx] = val;
                    return { ...prev, emojiLabels: newLabels };
                  })
                }
                disabled={!!notePopupEnabled}
              />
              {/* AI Generation Toggle (modular) */}
              <DisableAIGenerationSection
                enabled={aiReviewEnabled}
                onToggle={() => setAiReviewEnabled((v: boolean) => !v)}
              />
              {/* Falling Stars Section (modular, inline for now) */}
              <FallingStarsSection
                enabled={fallingEnabled}
                onToggle={handleToggleFalling}
                icon={fallingIcon}
                onIconChange={setFallingIcon}
                description="Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below."
              />
            </div>
          )}
        </div>
        {(mode !== "create" || step === 2) && (
          <>
            {/* Bottom right Save & publish/Save button */}
            <div className="w-full flex justify-end pr-6 pb-4 md:pb-6 mt-8">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                disabled={isSaving}
              >
                {mode === "create"
                  ? isSaving
                    ? "Publishing..."
                    : "Save & publish"
                  : isSaving
                    ? "Saving..."
                    : "Save"}
              </button>
            </div>
          </>
        )}
      </form>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...formData,
          ai_button_enabled: aiReviewEnabled,
          show_friendly_note: notePopupEnabled,
        });
      }}
    >
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3 text-slate-blue">
        {pageTitle}
      </h1>
      {/* Top right button group for step 1 create flow */}
      {mode === "create" && step === 1 && (
        <div className="absolute top-4 right-8 z-20 flex gap-2">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={handleStep1Continue}
            disabled={isSaving}
          >
            Continue
          </button>
        </div>
      )}
      <div>
        {step === 1 ? (
          <div className="custom-space-y">
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {formError}
              </div>
            )}
            {/* Only show customer/client fields if not universal */}
            {!isUniversal && (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <FaInfoCircle className="w-7 h-7 text-slate-blue" />
                  <h2 className="text-2xl font-bold text-slate-blue">
                    Customer/client details
                  </h2>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
                    >
                      First name{" "}
                      <span className="text-red-600">(required)</span>
                      <RobotTooltip text="This field is passed to AI for prompt generation." />
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                    >
                      Last name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                    >
                      Phone number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                      placeholder="Email"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center max-w-[85ch] gap-1"
                  >
                    Role/position
                    <RobotTooltip text="This field is passed to AI for prompt generation." />
                  </label>
                  <input
                    type="text"
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full max-w-md rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                    placeholder="e.g., store manager, marketing director, student"
                  />
                </div>
                {/* Product type fields */}
                {formData.review_type === "product" ? (
                  <>
                    <div className="mt-20 mb-2 flex items-center gap-2">
                      <FaBoxOpen className="w-5 h-5 text-[#1A237E]" />
                      <h2 className="text-xl font-semibold text-slate-blue">
                        Product Description
                      </h2>
                    </div>
                    <textarea
                      id="product_description"
                      value={formData.product_description || ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          product_description: e.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                      placeholder="Describe the product being reviewed"
                      required
                    />
                    <div className="mt-8 mb-2 flex items-center gap-2">
                      <FaStar className="w-5 h-5 text-[#1A237E]" />
                      <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
                        Features or Benefits{" "}
                        <RobotTooltip text="This field is passed to AI for prompt generation." />
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {(formData.features_or_benefits || [""]).map(
                        (feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              className="w-full border px-3 py-2 rounded"
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [
                                  ...(formData.features_or_benefits || []),
                                ];
                                newFeatures[idx] = e.target.value;
                                setFormData((prev: any) => ({
                                  ...prev,
                                  features_or_benefits: newFeatures,
                                }));
                              }}
                              required
                              placeholder="e.g., Long battery life"
                            />
                            {formData.features_or_benefits?.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newFeatures = (
                                    formData.features_or_benefits || []
                                  ).filter((_: any, i: number) => i !== idx);
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    features_or_benefits: newFeatures,
                                  }));
                                }}
                                className="text-red-600 font-bold"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            features_or_benefits: [
                              ...(formData.features_or_benefits || []),
                              "",
                            ],
                          }));
                        }}
                        className="text-blue-600 underline mt-2"
                      >
                        + Add Feature/Benefit
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Services Section (service type) */}
                    <div className="mt-20 mb-2 flex items-center gap-2">
                      <FaWrench className="w-5 h-5 text-[#1A237E]" />
                      <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
                        Services provided{" "}
                        <RobotTooltip text="This field is passed to AI for prompt generation." />
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {services.map((service, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            className="w-full border px-3 py-2 rounded"
                            value={service}
                            onChange={(e) => {
                              const newServices = [...services];
                              newServices[idx] = e.target.value;
                              setServices(newServices);
                              setFormData((prev: any) => ({
                                ...prev,
                                features_or_benefits: newServices,
                              }));
                            }}
                            required
                            placeholder="e.g., Web Design"
                          />
                          {services.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newServices = services.filter(
                                  (_, i) => i !== idx,
                                );
                                setServices(newServices);
                                setFormData((prev: any) => ({
                                  ...prev,
                                  features_or_benefits: newServices,
                                }));
                              }}
                              className="text-red-600 font-bold"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setServices([...services, ""]);
                          setFormData((prev: any) => ({
                            ...prev,
                            features_or_benefits: [...services, ""],
                          }));
                        }}
                        className="text-blue-600 underline mt-2"
                      >
                        + Add Service
                      </button>
                    </div>
                    <div className="mt-10 mb-2 flex items-center gap-2">
                      <FaTrophy className="w-5 h-5 text-[#1A237E]" />
                      <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
                        Outcome{" "}
                        <RobotTooltip text="This field is passed to AI for prompt generation." />
                      </h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mb-5 max-w-[85ch]">
                      Describe the service you provided and how it benefited
                      this individual.
                    </p>
                    <textarea
                      id="product_description"
                      value={formData.product_description}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          product_description: e.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                      placeholder="Describe the outcome for your client"
                      required
                    />
                  </>
                )}
                <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8 mt-10">
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
                          setShowPopupConflictModal("emoji");
                          return;
                        }
                        setNotePopupEnabled((v: boolean) => !v);
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
                  <div className="text-sm text-gray-700 px-2">
                    This note appears as a pop-up at the top of the review page.
                    Use it to set the context and tone for your customer.
                  </div>
                </div>
              </>
            )}
            <div className="w-full flex justify-end gap-2 mt-8">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                onClick={handleStep1Continue}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* --- NEW MODULAR STEP 2 UI (2024) --- */}
            {/* Review Platforms Section (modular) */}
            <ReviewWriteSection
              value={formData.review_platforms}
              onChange={(platforms) =>
                setFormData((prev: any) => ({
                  ...prev,
                  review_platforms: platforms,
                }))
              }
              onGenerateReview={handleGenerateAIReview}
              hideReviewTemplateFields={isUniversal}
            />
            {/* Special Offer Section (modular) */}
            <OfferSection
              enabled={offerEnabled}
              onToggle={() => setOfferEnabled((v: boolean) => !v)}
              title={offerTitle}
              onTitleChange={setOfferTitle}
              description={offerBody}
              onDescriptionChange={setOfferBody}
              url={offerUrl}
              onUrlChange={setOfferUrl}
            />
            {/* Emoji Sentiment Section (modular) */}
            <EmojiSentimentSection
              enabled={emojiSentimentEnabled}
              onToggle={() => {
                if (notePopupEnabled) {
                  setShowPopupConflictModal("emoji");
                  return;
                }
                setEmojiSentimentEnabled((v: boolean) => !v);
              }}
              question={emojiSentimentQuestion}
              onQuestionChange={setEmojiSentimentQuestion}
              feedbackMessage={emojiFeedbackMessage}
              onFeedbackMessageChange={setEmojiFeedbackMessage}
              thankYouMessage={formData.emojiThankYouMessage}
              onThankYouMessageChange={(val: string) =>
                setFormData((prev: any) => ({
                  ...prev,
                  emojiThankYouMessage: val,
                }))
              }
              emojiLabels={formData.emojiLabels}
              onEmojiLabelChange={(idx: number, val: string) =>
                setFormData((prev: any) => {
                  const newLabels = [...(prev.emojiLabels || [])];
                  newLabels[idx] = val;
                  return { ...prev, emojiLabels: newLabels };
                })
              }
              disabled={!!notePopupEnabled}
            />
            {/* AI Generation Toggle (modular) */}
            <DisableAIGenerationSection
              enabled={aiReviewEnabled}
              onToggle={() => setAiReviewEnabled((v: boolean) => !v)}
            />
            {/* Falling Stars Section (modular, inline for now) */}
            <FallingStarsSection
              enabled={fallingEnabled}
              onToggle={handleToggleFalling}
              icon={fallingIcon}
              onIconChange={setFallingIcon}
              description="Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below."
            />
          </div>
        )}
      </div>
      {(mode !== "create" || step === 2) && (
        <>
          {/* Bottom right Save & publish/Save button */}
          <div className="w-full flex justify-end pr-6 pb-4 md:pb-6 mt-8">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              disabled={isSaving}
            >
              {mode === "create"
                ? isSaving
                  ? "Publishing..."
                  : "Save & publish"
                : isSaving
                  ? "Saving..."
                  : "Save"}
            </button>
          </div>
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
              Popup Feature Conflict
            </h2>
            <p className="mb-6 text-gray-700">
              Two popup features can't be enabled at the same time.
              <br />
              {showPopupConflictModal === "emoji"
                ? "If you disable the Friendly Note, you can turn on Emoji Sentiment."
                : "If you disable Emoji Sentiment, you can turn on the Popup Note."}
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
  );
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show help"
        className="text-gray-400 hover:text-indigo-600 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-blue-100"
          style={{
            width: 16,
            height: 16,
            fontSize: 12,
            color: "#2563eb",
            fontWeight: 400,
          }}
        >
          ?
        </span>
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700">
          {text}
        </div>
      )}
    </span>
  );
}
