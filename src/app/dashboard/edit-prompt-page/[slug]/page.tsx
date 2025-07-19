"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { generateAIReview } from "@/utils/ai";
import {
  FaGoogle,
  FaFacebook,
  FaYelp,
  FaTripadvisor,
  FaRegStar,
  FaGift,
  FaStar,
  FaHeart,
  FaThumbsUp,
  FaStore,
  FaSmile,
  FaGlobe,
  FaHandsHelping,
  FaUser,
  FaWrench,
  FaBoxOpen,
  FaTrophy,
  FaCommentDots,
  FaCamera,
} from "react-icons/fa";
import { IconType } from "react-icons";
import Link from "next/link";
import { getAccountIdForUser } from "@/utils/accountUtils";
import IndustrySelector from "@/app/components/IndustrySelector";
import PromptPageForm from "@/app/components/PromptPageForm";
import PageCard from "@/app/components/PageCard";
import EmojiSentimentSection from "../components/EmojiSentimentSection";
import FallingStarsSection from "@/app/components/FallingStarsSection";
import DisableAIGenerationSection from "@/app/components/DisableAIGenerationSection";
import ReviewWriteSection, { ReviewWritePlatform } from "../components/ReviewWriteSection";
import ServicePromptPageForm, {
  ServicePromptFormState,
} from "./ServicePromptPageForm";
import ProductPromptPageForm from "@/app/components/ProductPromptPageForm";
import React from "react";
import AppLoader from "@/app/components/AppLoader";
import RobotTooltip from "@/app/components/RobotTooltip";
import { createClient } from "@/utils/supabaseClient";

interface ReviewPlatformLink {
  name: string;
  url: string;
  wordCount?: number;
  reviewText?: string;
  customInstructions?: string;
  customPlatform?: string;
  platform?: string;
}

interface BusinessProfile {
  business_name: string;
  services_offered: string[];
  company_values: string;
  differentiators: string;
  years_in_business: number;
  industries_served: string;
  taglines: string;
  team_founder_info: string;
  keywords: string;
  industry: string[];
  industry_other: string;
  features_or_benefits: string[];
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

// Helper to get platform icon based on URL or platform name
function getPlatformIcon(
  url: string,
  platform: string,
): { icon: IconType; label: string } {
  const lowerUrl = url.toLowerCase();
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

export default function EditPromptPage() {
  const supabase = createClient();

  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    product_name: "",
    product_description: "",
    features_or_benefits: [""],
    review_platforms: [] as ReviewPlatformLink[],
    services_offered: [] as string[],
    friendly_note: "",
    status: "in_queue" as "in_queue" | "in_progress" | "complete" | "draft",
    role: "",
    industry: [] as string[],
    industry_other: "",
    type: "custom",
    product_photo: "",
    emojiThankYouMessage: "",
    falling_icon: "",
  });
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUniversal, setIsUniversal] = useState(false);
  const [offerEnabled, setOfferEnabled] = useState(false);
  const [offerTitle, setOfferTitle] = useState("Special Offer");
  const [offerBody, setOfferBody] = useState("");
  const [offerUrl, setOfferUrl] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "in_queue" | "in_progress" | "complete" | "draft"
  >("in_queue");
  const [fallingIcon, setFallingIcon] = useState("star");
  const [fallingEnabled, setFallingEnabled] = useState(true);
  const [aiButtonEnabled, setAiButtonEnabled] = useState(true);
  const [lastIcon, setLastIcon] = useState("star");
  const [industryType, setIndustryType] = useState<"B2B" | "B2C" | "Both">(
    "Both",
  );
  const [services, setServices] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
    "We value your feedback! Let us know how we can do better.",
  );
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
    "How was your experience?",
  );
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState("");
  const [friendlyNote, setFriendlyNote] = useState("");

  // Add state for ServicePromptPageForm
  const formRef = React.useRef<any>(null);
  const [initialData, setInitialData] =
    useState<Partial<ServicePromptFormState> | undefined>(undefined);
  const [showResetButton, setShowResetButton] = useState(false);
  const [businessReviewPlatforms, setBusinessReviewPlatforms] = useState<
    ReviewWritePlatform[]
  >([]);
  const [accountId, setAccountId] = useState("");
  const [notePopupEnabled, setNotePopupEnabled] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use the singleton Supabase client for session/auth (matches Universal Prompt page)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setError("Error fetching user session.");
        setIsLoading(false);
        return;
      }
      if (!user) {
        setError("You must be signed in to access this page.");
        setIsLoading(false);
        return;
      }
      // Get account ID for user (same as Universal)
      const accountId = await getAccountIdForUser(user.id, supabase);
      if (!accountId) {
        setError("No account found for user.");
        setIsLoading(false);
        return;
      }
      // Fetch the prompt page data
      const { data: promptData, error: promptError } = await supabase
        .from("prompt_pages")
        .select("*")
        .eq("slug", params.slug)
        .single();
      if (promptError) {
        setError("Could not load prompt page data. Please try again.");
        setIsLoading(false);
        return;
      }
      if (!promptData) {
        setError("Prompt page not found.");
        setIsLoading(false);
        return;
      }
      // Fetch business profile using accountId
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("account_id", accountId)
        .single();
      if (businessError) {
        setError("Could not load business profile. Please try again.");
        setIsLoading(false);
        return;
      }
      if (!businessData) {
        setError("Business profile not found. Please create a business profile first.");
        setIsLoading(false);
        return;
      }
      // Set the prompt page data to form state
      setFormData((prev) => ({
        ...prev,
        ...promptData,
        review_platforms: promptData.review_platforms || [],
        services_offered: Array.isArray(promptData.services_offered)
          ? promptData.services_offered
          : typeof promptData.services_offered === "string"
            ? [promptData.services_offered]
            : [],
        features_or_benefits: promptData.features_or_benefits || [],
        industry: businessData.industry || [],
        industry_other: businessData.industry_other || "",
      }));
      
      // Set business profile
      setBusinessProfile({
        ...businessData,
        business_name: businessData.name,
        services_offered: Array.isArray(businessData.services_offered)
          ? businessData.services_offered
          : typeof businessData.services_offered === "string"
            ? [businessData.services_offered]
            : [],
        features_or_benefits: businessData.features_or_benefits || [],
      });
      
      // Set initial data for ServicePromptPageForm
      setInitialData({
        ...promptData,
        review_platforms: promptData.review_platforms || [],
        services_offered: Array.isArray(promptData.services_offered)
          ? promptData.services_offered
          : typeof promptData.services_offered === "string"
            ? [promptData.services_offered]
            : [],
        features_or_benefits: promptData.features_or_benefits || [],
      });
      
      // Set account ID
      setAccountId(accountId);
      
      // Set other state based on prompt page data
      setOfferEnabled(!!promptData.custom_incentive);
      setOfferBody(promptData.custom_incentive || "");
      setOfferTitle(promptData.offer_title || "Special Offer");
      setOfferUrl(promptData.offer_url || "");
      setFallingEnabled(!!promptData.falling_icon);
      setFallingIcon(promptData.falling_icon || "star");
      setLastIcon(promptData.falling_icon || "star");
      setEmojiSentimentEnabled(!!promptData.emoji_sentiment_enabled);
      setEmojiSentimentQuestion(promptData.emoji_sentiment_question || "How was your experience?");
      setEmojiFeedbackMessage(promptData.emoji_feedback_message || "We value your feedback! Let us know how we can do better.");
      setEmojiThankYouMessage(promptData.emoji_thank_you_message || "");
      setNotePopupEnabled(!!promptData.note_popup_enabled);
      setFriendlyNote(promptData.friendly_note || "");
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.slug) {
      loadData();
    }
  }, [params.slug, supabase]);

  useEffect(() => {
    if (offerEnabled) {
      setFormData((prev) => ({ ...prev, custom_incentive: offerBody }));
    } else {
      setFormData((prev) => ({ ...prev, custom_incentive: "" }));
    }
  }, [offerEnabled, offerBody]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!params.slug) return;

      setAnalyticsLoading(true);
      try {
        // First, get the prompt page ID by slug
        const { data: promptPage, error: fetchError } = await supabase
          .from("prompt_pages")
          .select("id")
          .eq("slug", params.slug)
          .single();

        if (fetchError || !promptPage)
          throw fetchError || new Error("Prompt page not found");

        const { data: events, error } = await supabase
          .from("analytics_events")
          .select("*")
          .eq("prompt_page_id", promptPage.id);

        if (error) throw error;

        const analyticsData = {
          totalClicks: events.length,
          aiGenerations: events.filter(
            (e: any) => e.event_type === "ai_generate",
          ).length,
          copySubmits: events.filter((e: any) => e.event_type === "copy_submit")
            .length,
        };
        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [params.slug, supabase]);

  useEffect(() => {
    const logCurrentUserUid = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && session.user) {
        console.log("[DEBUG] Current user UID:", session.user.id);
      } else {
        console.log("[DEBUG] No user session found");
      }
    };
    logCurrentUserUid();
  }, [supabase]);

  const handleAddPlatform = () => {
    setFormData((prev) => ({
      ...prev,
      review_platforms: [
        ...prev.review_platforms,
        { name: "", url: "", wordCount: 200 },
      ],
    }));
  };

  const handleRemovePlatform = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      review_platforms: prev.review_platforms.filter((_, i) => i !== index),
    }));
  };

  const handlePlatformChange = (
    index: number,
    field: keyof ReviewPlatformLink,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      review_platforms: prev.review_platforms.map((link, i) =>
        i === index
          ? {
              ...link,
              [field]:
                field === "wordCount"
                  ? Math.max(200, Number(value) || 200)
                  : value,
            }
          : link,
      ),
    }));
  };

  const handleGenerateAIReview = async (index: number) => {
    if (!businessProfile) {
      setError("Business profile not loaded. Please try again.");
      return;
    }
    setGeneratingReview(index);
    try {
      // Determine reviewerType based on industryType
      let reviewerType: "customer" | "client" | "customer or client" =
        "customer or client";
      if (industryType === "B2B") reviewerType = "client";
      else if (industryType === "B2C") reviewerType = "customer";
      // Call generateAIReview with reviewerType
      const review = await generateAIReview(
        businessProfile,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          project_type: Array.isArray(formData.services_offered)
            ? formData.services_offered.join(", ")
            : formData.services_offered,
          product_description: formData.product_description,
        },
        formData.review_platforms[index].name,
        formData.review_platforms[index].wordCount || 200,
        formData.review_platforms[index].customInstructions,
        reviewerType,
      );
      setFormData((prev) => ({
        ...prev,
        review_platforms: prev.review_platforms.map((link, i) =>
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

  const handleSubmit = async (
    e: React.FormEvent,
    action: "save" | "publish",
    data?: any,
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be signed in to edit a prompt page");
      }

      // First, get the prompt page ID
      const { data: promptPage, error: fetchError } = await supabase
        .from("prompt_pages")
        .select("id")
        .eq("slug", params.slug)
        .single();

      if (fetchError) throw fetchError;
      if (!promptPage) throw new Error("Prompt page not found");

      // Build update object
      let updateData: any = {};
      if (isUniversal) {
        updateData = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          product_name: data.product_name,
          product_description: data.product_description,
          product_photo: data.product_photo,
          review_platforms:
            data.review_platforms && data.review_platforms.length > 0
              ? data.review_platforms
                  .map((link: any) => ({
                    name: link.name,
                    url: link.url,
                    wordCount: Math.max(200, Number(link.wordCount) || 200),
                    customInstructions: link.customInstructions || "",
                    reviewText: link.reviewText || "",
                  }))
                  .filter((link: any) => link.name && link.url)
              : null,
          services_offered:
            data.services_offered && data.services_offered.length > 0
              ? data.services_offered
              : null,
          friendly_note: data.friendly_note,
          status: "draft",
          role: data.role,
          review_type: data.review_type,
          offer_enabled: data.offer_enabled,
          offer_title: data.offer_title,
          offer_body: data.offer_body,
          offer_url: data.offer_url,
          emoji_sentiment_enabled: data.emoji_sentiment_enabled,
          emoji_feedback_message: data.emoji_feedback_message,
          emoji_sentiment_question: data.emoji_sentiment_question,
          emoji_thank_you_message: data.emoji_thank_you_message,
          falling_icon: data.falling_icon,
        };
      } else {
        updateData = {
          offer_enabled: offerEnabled,
          offer_title: offerTitle,
          offer_body: offerBody,
          offer_url: offerUrl || null,
          status: (formData.status || "in_queue") as
            | "in_queue"
            | "in_progress"
            | "complete"
            | "draft",
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          phone: formData.phone || null,
          email: formData.email || null,
          product_name: formData.product_name || null,
          product_description: formData.product_description || null,
          product_photo: formData.product_photo || null,
          friendly_note: formData.friendly_note || null,
          role: formData.role || null,
          type: formData.type || "custom",
          emoji_thank_you_message: formData.emojiThankYouMessage || "",
          falling_icon: formData.falling_icon,
          emoji_sentiment_enabled: emojiSentimentEnabled,
          emoji_feedback_message: emojiFeedbackMessage,
          emoji_sentiment_question: emojiSentimentQuestion,
          show_friendly_note: notePopupEnabled,
        };

        // Handle review_platforms
        if (formData.review_platforms && formData.review_platforms.length > 0) {
          updateData.review_platforms = formData.review_platforms
            .map((link) => ({
              name: link.name,
              url: link.url,
              wordCount: link.wordCount
                ? Math.max(200, Number(link.wordCount))
                : 200,
              customInstructions: link.customInstructions || "",
              reviewText: link.reviewText || "",
            }))
            .filter((link) => link.name && link.url);
        } else {
          updateData.review_platforms = null;
        }

        // Handle services_offered
        if (formData.services_offered && formData.services_offered.length > 0) {
          updateData.services_offered = formData.services_offered;
        } else {
          updateData.services_offered = null;
        }

        if (action === "publish") {
          updateData.status = "in_queue" as const;
        }
      }

      // Only include valid columns in the payload
      const validColumns = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "product_name",
        "product_description",
        "product_photo",
        "review_platforms",
        "services_offered",
        "friendly_note",
        "status",
        "role",
        "type",
        "offer_enabled",
        "offer_title",
        "offer_body",
        "offer_url",
        "emoji_sentiment_enabled",
        "emoji_sentiment_question",
        "emoji_feedback_message",
        "emoji_thank_you_message",
        "falling_icon",
        "is_universal",
        "slug",
        "account_id",
        "category",
        "no_platform_review_template",
        "ai_button_enabled",
        "show_friendly_note",
      ];
      const payload = Object.fromEntries(
        Object.entries(updateData).filter(([key]) =>
          validColumns.includes(key),
        ),
      );

      console.log("[DEBUG] Payload sent to Supabase:", payload);

      const { data: updateDataResult, error: updateError } = await supabase
        .from("prompt_pages")
        .update(payload)
        .eq("id", promptPage.id);

      // Log the full response for debugging
      console.log("[DEBUG] Supabase update response:", {
        updateDataResult,
        updateError,
      });
      if (updateError) {
        console.error("[DEBUG] Update error object:", updateError);
      }

      setShowShareModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update prompt page",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndContinue = async (
    e: React.MouseEvent | React.FormEvent,
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await handleSubmit(
        { preventDefault: () => {} } as React.FormEvent,
        "save",
      );
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep1Save = async (formState: any) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be signed in to edit a prompt page");
      }
      // Get the prompt page ID
      const { data: promptPage, error: fetchError } = await supabase
        .from("prompt_pages")
        .select("id, slug")
        .eq("slug", params.slug)
        .single();
      if (fetchError) throw fetchError;
      if (!promptPage) throw new Error("Prompt page not found");
      
      // For step 1, only update the basic customer/client fields
      const updateData = {
        first_name: formState.first_name,
        last_name: formState.last_name,
        email: formState.email,
        phone: formState.phone,
        role: formState.role,
        friendly_note: formState.friendly_note,
      };
      
      // Update the prompt page
      const { error: updateError } = await supabase
        .from("prompt_pages")
        .update(updateData)
        .eq("id", promptPage.id);
      
      if (updateError) {
        setError(updateError.message);
        return;
      }
      
      // Update local form data
      setFormData(prev => ({ ...prev, ...updateData }));
      
      // Move to step 2
      setStep(2);
      setSuccessMessage("Step 1 saved! Continue to step 2.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update prompt page",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Save = async (formState: any) => {
    console.log("[DEBUG] handleStep2Save called with formState:", formState);
    console.log('🔄 SAVE HANDLER: Setting loading state and starting save operation');
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be signed in to edit a prompt page");
      }
      // Get the prompt page ID
      const { data: promptPage, error: fetchError } = await supabase
        .from("prompt_pages")
        .select("id, slug")
        .eq("slug", params.slug)
        .single();
      if (fetchError) throw fetchError;
      if (!promptPage) throw new Error("Prompt page not found");
      
      let updateData: any;
      if (formData.type === "product") {
        // For product pages, formState is a flat object with all fields
        updateData = { ...formData, ...formState };
      } else {
        // For service pages, formState contains the form data directly
        // Extract the step 2 fields from the form data
        updateData = {
          // Step 2 fields - these come from the form state
          offer_enabled: formState.offer_enabled || false,
          offer_title: formState.offer_title || "",
          offer_body: formState.offer_body || "",
          offer_url: formState.offer_url || "",
          emoji_sentiment_enabled: formState.emoji_sentiment_enabled || false,
          emoji_sentiment_question: formState.emoji_sentiment_question || "How was your experience?",
          emoji_feedback_message: formState.emoji_feedback_message || "We value your feedback! Let us know how we can do better.",
          emoji_thank_you_message: formState.emoji_thank_you_message || "",
          review_platforms: formState.review_platforms || [],
          falling_icon: formState.falling_icon || null,
          ai_button_enabled: formState.ai_button_enabled !== false, // Default to true
          show_friendly_note: formState.show_friendly_note || false,
        };
      }
      // Only include valid columns in the payload
      const validColumns = [
        "offer_enabled",
        "offer_title",
        "offer_body",
        "offer_url",
        "emoji_sentiment_enabled",
        "emoji_sentiment_question",
        "emoji_feedback_message",
        "emoji_thank_you_message",
        "review_platforms",
        "falling_icon",
        "ai_button_enabled",
        "show_friendly_note",
      ];
      const payload = Object.fromEntries(
        Object.entries(updateData).filter(([key]) =>
          validColumns.includes(key),
        ),
      );
      // Debug logs for troubleshooting
      console.log("[DEBUG] Service Save formState:", formState);
      console.log("[DEBUG] Service Save updateData:", updateData);
      console.log("[DEBUG] Service Save payload:", payload);
      // Update the prompt page
      const { error: updateError } = await supabase
        .from("prompt_pages")
        .update(payload)
        .eq("id", promptPage.id);
      // Debug log for Supabase response
      console.log("[DEBUG] Supabase update error:", updateError);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      
      // Set localStorage flag for post-save modal and redirect to dashboard
      if (promptPage?.slug) {
        const modalData = { 
          url: `/r/${promptPage.slug}`,
          first_name: formData.first_name,
          phone: formData.phone,
          email: formData.email
        };
        console.log('🔍 Setting localStorage showPostSaveModal:', modalData);
        localStorage.setItem(
          "showPostSaveModal",
          JSON.stringify(modalData),
        );
      }
      // Add a longer delay to ensure user sees the "Saving..." state before navigation
      console.log('✅ SAVE COMPLETED: Data saved successfully to database');
      console.log('⏱️ DELAY START: Waiting 1.5 seconds for user to see "Saving..." state...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Give user 1.5s to see "Saving..."
      console.log('⏱️ DELAY END: 1.5 seconds elapsed, proceeding with navigation'); 
      
      // Smooth navigation to prompt-pages to show the modal
      console.log('🔍 Navigating smoothly to prompt-pages');
      router.push("/prompt-pages");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update prompt page",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSave = async (formState: ServicePromptFormState | any) => {
    // For backward compatibility, route to appropriate step handler
    if (step === 1) {
      return handleStep1Save(formState);
    } else {
      return handleStep2Save(formState);
    }
  };

  const handleFormPublish = (data: any) => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent, "publish");
  };

  const iconOptions = [
    {
      key: "star",
      label: "Stars",
      icon: <FaStar className="w-6 h-6 text-yellow-400" />,
    },
    {
      key: "heart",
      label: "Hearts",
      icon: <FaHeart className="w-6 h-6 text-red-500" />,
    },
    {
      key: "rainbow",
      label: "Rainbows",
      icon: <span className="w-6 h-6 text-2xl">🌈</span>,
    },
    {
      key: "thumb",
      label: "Thumbs Up",
      icon: <span className="w-6 h-6 text-2xl">👍</span>,
    },
    {
      key: "flex",
      label: "Flex",
      icon: <span className="w-6 h-6 text-2xl">💪</span>,
    },
  ];

  const handleToggleFalling = async () => {
    if (aiButtonEnabled) return;
    setAiButtonEnabled(true);
    try {
      const { data: promptPage, error: fetchError } = await supabase
        .from("prompt_pages")
        .select("id")
        .eq("slug", params.slug)
        .single();
      if (fetchError || !promptPage)
        throw fetchError || new Error("Prompt page not found");
      if (fallingEnabled) {
        // Turn off
        await supabase
          .from("prompt_pages")
          .update({ falling_icon: null })
          .eq("id", promptPage.id);
        setFallingEnabled(false);
      } else {
        // Turn on, always set to 'star' by default
        await supabase
          .from("prompt_pages")
          .update({ falling_icon: "star" })
          .eq("id", promptPage.id);
        setFallingIcon("star");
        setLastIcon("star");
        setFallingEnabled(true);
      }
    } finally {
      setAiButtonEnabled(false);
    }
  };

  const handleIconChangeAndSave = async (iconKey: string) => {
    if (aiButtonEnabled) return;
    setAiButtonEnabled(true);
    setFallingIcon(iconKey);
    setLastIcon(iconKey);
    try {
      const { data: promptPage, error: fetchError } = await supabase
        .from("prompt_pages")
        .select("id")
        .eq("slug", params.slug)
        .single();
      if (fetchError || !promptPage)
        throw fetchError || new Error("Prompt page not found");
      const { error } = await supabase
        .from("prompt_pages")
        .update({ falling_icon: iconKey })
        .eq("id", promptPage.id);
      if (error) {
        setFallingIcon("star");
      }
    } finally {
      setAiButtonEnabled(false);
    }
  };

  // Add this handler for toggling offerEnabled with debug logging
  const handleToggleOffer = () => {
    setOfferEnabled((v) => {
      const newValue = !v;
      console.log("[DEBUG] Toggling offerEnabled:", newValue);
      return newValue;
    });
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Page
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: -190,
          left: 0,
          width: "100%",
          zIndex: 9999,
        }}
      >
        <AppLoader />
      </div>
    );
  }

  if (!businessProfile) {
    console.log('🔍 No businessProfile loaded yet');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AppLoader />
      </div>
    );
  }

  console.log('🔍 Rendering edit page with:', { 
    type: formData.type, 
    businessProfile: !!businessProfile,
    initialData: !!initialData 
  });

  // Ensure all required fields are present and not undefined
  const safeBusinessProfile = {
    ...businessProfile,
    features_or_benefits: businessProfile.features_or_benefits || [],
    business_name: businessProfile.business_name || "",
  };

  // In the main render, for product pages, render only the unified ProductPromptPageForm and return immediately
  if (formData.type === "product") {
    return (
      <PageCard icon={<FaBoxOpen className="w-9 h-9 text-slate-blue" />}>
        <ProductPromptPageForm
          mode="edit"
          initialData={formData}
          onSave={handleStep2Save}
          pageTitle="Edit Product Prompt Page"
          supabase={supabase}
          businessProfile={businessProfile}
          accountId={accountId}
          slug={params.slug as string}
        />
      </PageCard>
    );
  }

  // For service pages, use the PromptPageForm component (same as photo pages)
  if (formData.type === "service") {
    console.log('🔍 Rendering PromptPageForm for service with:', { formData, businessProfile, step });
    return (
      <PageCard icon={<FaHandsHelping className="w-9 h-9 text-slate-blue" />}>
        <PromptPageForm
          mode="edit"
          initialData={formData}
          onSave={handleStep1Save}
          onPublish={handleStep2Save}
          pageTitle="Edit Service Prompt Page"
          supabase={supabase}
          businessProfile={businessProfile}
          step={step}
          onStepChange={setStep}
        />
      </PageCard>
    );
  }

  // For photo pages, use the PromptPageForm component
  if (formData.type === "photo") {
    console.log('🔍 Rendering PromptPageForm for photo with:', { formData, businessProfile, step });
    return (
      <PageCard icon={<FaCamera className="w-9 h-9 text-slate-blue" />}>
        <PromptPageForm
          mode="edit"
          initialData={formData}
          onSave={handleStep1Save}
          onPublish={handleStep2Save}
          pageTitle="Edit Photo + Testimonial Prompt Page"
          supabase={supabase}
          businessProfile={businessProfile}
          step={step}
          onStepChange={setStep}
        />
      </PageCard>
    );
  }

  // For universal pages, use the ServicePromptPageForm component (similar to service pages)
  if (formData.type === "universal") {
    console.log('🔍 Rendering ServicePromptPageForm for universal with:', { initialData, isLoading, businessReviewPlatforms });
    return (
      <PageCard icon={<FaHandsHelping className="w-9 h-9 text-slate-blue" />}>
        <ServicePromptPageForm
          initialData={initialData}
          onSave={handleFormSave}
          isLoading={isLoading}
          showResetButton={showResetButton}
          businessReviewPlatforms={businessReviewPlatforms}
          onGenerateReview={handleGenerateAIReview}
          slug={params.slug as string}
        />
      </PageCard>
    );
  }

  // Fallback for unknown types
  return (
    <PageCard icon={<FaHandsHelping className="w-9 h-9 text-slate-blue" />}>
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-slate-blue mb-4">
          Unknown Prompt Page Type
        </h1>
        <p className="text-gray-600">
          This prompt page type ({formData.type}) is not supported for editing.
        </p>
      </div>
    </PageCard>
  );
}
