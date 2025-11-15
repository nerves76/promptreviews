"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { generateContextualReview } from "@/utils/aiReviewGeneration";
import Icon from "@/components/Icon";
import Link from "next/link";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import { useAuth } from "@/auth";
import IndustrySelector from "@/app/(app)/components/IndustrySelector";
import PromptPageForm from "@/app/(app)/components/PromptPageForm";
import PhotoPromptPageForm from "@/app/(app)/components/PhotoPromptPageForm";
import EmployeePromptPageForm from "@/app/(app)/components/EmployeePromptPageForm";
import EventPromptPageForm from "@/app/(app)/components/EventPromptPageForm";
import PageCard from "@/app/(app)/components/PageCard";
import { 
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature
} from "@/app/(app)/components/prompt-features";
import ReviewWriteSection, { ReviewWritePlatform } from "../components/ReviewWriteSection";
import ServicePromptPageForm, {
  ServicePromptFormState,
} from "./ServicePromptPageForm";
import ProductPromptPageForm from "@/app/(app)/components/ProductPromptPageForm";
import React from "react";
import AppLoader from "@/app/(app)/components/AppLoader";
import RobotTooltip from "@/app/(app)/components/RobotTooltip";
import { createClient } from "@/auth/providers/supabase";
import { clampWordLimit, getWordLimitOrDefault, PROMPT_PAGE_WORD_LIMITS } from "@/constants/promptPageWordLimits";

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
): { icon: any; label: string } {
  const lowerUrl = url.toLowerCase();
  const lowerPlatform = (platform || "").toLowerCase();
  if (lowerUrl.includes("google") || lowerPlatform.includes("google"))
    return { icon: "FaGoogle", label: "Google" };
  if (lowerUrl.includes("facebook") || lowerPlatform.includes("facebook"))
    return { icon: "FaFacebook", label: "Facebook" };
  if (lowerUrl.includes("yelp") || lowerPlatform.includes("yelp"))
    return { icon: "FaYelp", label: "Yelp" };
  if (lowerUrl.includes("tripadvisor") || lowerPlatform.includes("tripadvisor"))
    return { icon: "FaTripadvisor", label: "TripAdvisor" };
  if (lowerUrl.includes("g2") || lowerPlatform.includes("g2"))
    return { icon: "SiG2", label: "G2" };
  return { icon: "FaRegStar", label: "Other" };
}

// Utility function to map camelCase form data to snake_case DB columns
function mapToDbColumns(formData: any): any {
  const insertData: any = { ...formData };
  
  // Map camelCase to snake_case
  insertData["emoji_sentiment_enabled"] = formData.emojiSentimentEnabled;
  insertData["emoji_sentiment_question"] = formData.emojiSentimentQuestion;
  insertData["emoji_feedback_message"] = formData.emojiFeedbackMessage;
  insertData["emoji_thank_you_message"] = formData.emojiThankYouMessage || "";
  insertData["ai_button_enabled"] = formData.aiButtonEnabled ?? true;
  insertData["offer_enabled"] = formData.offerEnabled;
  insertData["offer_title"] = formData.offerTitle;
  insertData["offer_body"] = formData.offerBody;
  insertData["offer_url"] = formData.offerUrl;
  insertData["offer_timelock"] = formData.offerTimelock;
  
  // Handle falling stars properly
  if (formData.fallingIcon) {
    insertData["falling_icon"] = formData.fallingIcon;
  }
  if (formData.falling_icon_color || formData.fallingIconColor) {
    insertData["falling_icon_color"] = formData.falling_icon_color || formData.fallingIconColor;
  }
  
  // Handle reviewPlatforms -> review_platforms mapping
  if (formData.reviewPlatforms) {
    insertData["review_platforms"] = formData.reviewPlatforms;
    delete insertData.reviewPlatforms;
  }
  
  // Remove camelCase keys (but keep the snake_case database columns we set above)
  delete insertData.emojiSentimentEnabled;
  delete insertData.emojiSentimentQuestion;
  delete insertData.emojiFeedbackMessage;
  delete insertData.emojiThankYouMessage;
  delete insertData.aiButtonEnabled;
  delete insertData.fallingEnabled;
  // Remove the camelCase versions, but keep falling_icon and falling_icon_color (snake_case)
  delete insertData.fallingIcon;      // Remove camelCase version
  delete insertData.fallingIconColor; // Remove camelCase version
  delete insertData.offerEnabled;
  delete insertData.offerTitle;
  delete insertData.offerBody;
  delete insertData.offerUrl;
  
  return insertData;
}

export default function EditPromptPage() {
  const supabase = createClient();
  const { user, account } = useAuth();

  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  // Removed step state - now single step
  const [originalFormData, setOriginalFormData] = useState<any>(null);
  const [showNameChangeDialog, setShowNameChangeDialog] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<"save" | "publish" | null>(null);
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
  const [offerTimelock, setOfferTimelock] = useState(false);
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
      
      // Use account from auth context
      if (!user || !account?.id) {
        setIsLoading(false);
        return;
      }
      
      // Use the account ID from the auth context (respects account switcher)
      const accountId = account.id;
      
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
      
      // CRITICAL: Verify the prompt page belongs to the correct account
      if (promptData.account_id !== accountId) {
        setError("This prompt page belongs to a different account. Access denied.");
        setIsLoading(false);
        return;
      }
      // Fetch business profile using accountId
      // ⚠️ CRITICAL: DO NOT use .single() - accounts can have multiple businesses!
      // Using .single() will fail with PGRST116 error if multiple businesses exist
      const { data: businessDataArray, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: true });
      
      if (businessError) {
        console.error("Failed to load businesses:", businessError);
        setError("Could not load business profile. Please try again.");
        setIsLoading(false);
        return;
      }
      
      if (!businessDataArray || businessDataArray.length === 0) {
        setError("Business profile not found. Please create a business profile first.");
        setIsLoading(false);
        return;
      }
      
      // Use the first business if multiple exist (oldest one)
      const businessData = businessDataArray[0];
      if (businessDataArray.length > 1) {
      }
      
      // CRITICAL: Verify the business belongs to the correct account
      // This prevents ALL business defaults from leaking across accounts
      if (businessData && businessData.account_id !== accountId) {
        setError("Account data mismatch detected. Please refresh the page and try again.");
        setIsLoading(false);
        return;
      }
      // Store original data for comparison
      setOriginalFormData({
        ...promptData,
        review_platforms: promptData.review_platforms || [],
        services_offered: Array.isArray(promptData.services_offered)
          ? promptData.services_offered
          : typeof promptData.services_offered === "string"
            ? [promptData.services_offered]
            : [],
      });
      
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
      setOfferTimelock(!!promptData.offer_timelock);
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
    if (params.slug && user && account?.id) {
      loadData();
    }
  }, [params.slug, user, account?.id]); // Re-fetch when account changes

  useEffect(() => {
    if (offerEnabled) {
      setFormData((prev) => ({ ...prev, custom_incentive: offerBody }));
    } else {
      setFormData((prev) => ({ ...prev, custom_incentive: "" }));
    }
  }, [offerEnabled, offerBody]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!params.slug || !account?.id) {
        setAnalytics(null);
        return;
      }

      setAnalyticsLoading(true);
      try {
        // First, get the prompt page ID by slug
        const { data: promptPage, error: fetchError } = await supabase
          .from("prompt_pages")
          .select("id")
          .eq("slug", params.slug)
          .eq("account_id", account.id)
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
  }, [params.slug, account?.id, supabase]);

  useEffect(() => {
    const logCurrentUserUid = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && session.user) {
      } else {
      }
    };
    logCurrentUserUid();
  }, [supabase]);

  const handleAddPlatform = () => {
    setFormData((prev) => ({
      ...prev,
      review_platforms: [
        ...prev.review_platforms,
        { name: "", url: "", wordCount: PROMPT_PAGE_WORD_LIMITS.DEFAULT },
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
                  ? clampWordLimit(value)
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
      
      // Create comprehensive page context
      const pageData = {
        review_type: 'general',
        project_type: Array.isArray(formData.services_offered)
          ? formData.services_offered.join(", ")
          : formData.services_offered || "",
        product_description: formData.product_description,
        outcomes: "",
        client_name: "",
        location: "",
        friendly_note: formData.friendly_note,
        date_completed: "",
        team_member: "",
        assigned_team_members: "",
        // Service-specific fields
        service_name: "",
        service_description: "",
        // Product-specific fields
        product_name: formData.product_name,
        product_subcopy: "",
        features_or_benefits: formData.features_or_benefits,
        // Universal page fields
        is_universal: false,
      };
      
      const reviewerData = {
        firstName: formData.first_name || "",
        lastName: formData.last_name || "",
        role: formData.role || "",
      };
      
      // Convert businessProfile to match AI function interface
      const aiBusinessProfile = businessProfile ? {
        ...businessProfile,
        services_offered: Array.isArray(businessProfile.services_offered) 
          ? businessProfile.services_offered.join(", ")
          : businessProfile.services_offered || ""
      } : {
        business_name: "Business",
        services_offered: ""
      };
      
      const review = await generateContextualReview(
        aiBusinessProfile,
        pageData,
        reviewerData,
        formData.review_platforms[index].name,
        getWordLimitOrDefault(formData.review_platforms[index].wordCount),
        formData.review_platforms[index].customInstructions,
        reviewerType
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
    skipNameCheck?: boolean,
  ) => {
    e.preventDefault();
    
    // Check for name changes if this is an individual prompt page
    if (!skipNameCheck && originalFormData && originalFormData.contact_id) {
      const nameChanged = 
        (data?.first_name || formData.first_name) !== originalFormData.first_name ||
        (data?.last_name || formData.last_name) !== originalFormData.last_name;
      
      if (nameChanged) {
        // Show confirmation dialog
        setPendingUpdateData(data || formData);
        setPendingAction(action);
        setShowNameChangeDialog(true);
        return;
      }
    }
    
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
                    wordCount: clampWordLimit(link?.wordCount ?? PROMPT_PAGE_WORD_LIMITS.DEFAULT),
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
          offer_timelock: data.offer_timelock,
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
          offer_timelock: offerTimelock,
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
              wordCount: clampWordLimit(link?.wordCount ?? PROMPT_PAGE_WORD_LIMITS.DEFAULT),
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
        "offer_timelock",
        "emoji_sentiment_enabled",
        "emoji_sentiment_question",
        "emoji_feedback_message",
        "kickstarters_enabled",
        "selected_kickstarters",
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


      const { data: updateDataResult, error: updateError } = await supabase
        .from("prompt_pages")
        .update(payload)
        .eq("id", promptPage.id)
        .select()
        .single();

      // Log the full response for debugging
      
      if (updateError) {
        console.error("[DEBUG] Update error object:", updateError);
        throw updateError;
      }
      
      // If we're also updating the contact (from name change dialog)
      if (pendingUpdateData && originalFormData?.contact_id) {
        const { error: contactError } = await supabase
          .from("contacts")
          .update({
            first_name: payload.first_name,
            last_name: payload.last_name,
          })
          .eq("id", originalFormData.contact_id);
        
        if (contactError) {
          console.error("Failed to update contact:", contactError);
          setError("Prompt page updated but failed to update contact");
        } else {
          setSuccessMessage("Prompt page and contact updated successfully!");
        }
      } else {
        setSuccessMessage("Prompt page updated successfully!");
      }
      
      // Update original form data with the new values
      setOriginalFormData(updateDataResult);
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
      // Removed step logic
    } finally {
      setIsLoading(false);
    }
  };

  // Removed step logic - now single step

  // Simple single-step save for product pages (like universal prompt page)
  const handleProductSave = async (formState: any) => {
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
        .select("id, slug, campaign_type")
        .eq("slug", params.slug)
        .single();
      if (fetchError) throw fetchError;
      if (!promptPage) throw new Error("Prompt page not found");
      
      // Apply the mapping to convert camelCase to snake_case for database
      const rawData = { ...formData, ...formState };
      const updateData = mapToDbColumns(rawData);
      
      // Only include valid columns in the payload
      const validColumns = [
        "first_name",
        "last_name",
        "email", 
        "phone",
        "role",
        "friendly_note",
        "offer_enabled",
        "offer_title",
        "offer_body",
        "offer_url",
        "offer_timelock",
        "emoji_sentiment_enabled",
        "emoji_sentiment_question",
        "emoji_feedback_message",
        "emoji_thank_you_message",
        "review_platforms",
        "falling_icon",
        "ai_button_enabled",
        "show_friendly_note",
        "product_name",
        "product_description",
        "product_photo",
        "features_or_benefits",
        "kickstarters_enabled",
        "selected_kickstarters",
        "recent_reviews_enabled",
        "status"
      ];
      const payload = Object.fromEntries(
        Object.entries(updateData).filter(([key]) =>
          validColumns.includes(key),
        ),
      );
      
      
      // Ensure features_or_benefits is properly formatted as JSON
      if (payload.features_or_benefits && typeof payload.features_or_benefits === 'string') {
        try {
          payload.features_or_benefits = JSON.parse(payload.features_or_benefits);
        } catch (e) {
          // If it's not valid JSON, treat it as a single string in an array
          payload.features_or_benefits = [payload.features_or_benefits];
        }
      }
      
      
      // Update the prompt page
      const { error: updateError } = await supabase
        .from("prompt_pages")
        .update(payload)
        .eq("id", promptPage.id);
      
      if (updateError) {
        console.error("❌ PRODUCT SAVE FAILED:", updateError);
        console.error("❌ Full error details:", JSON.stringify(updateError, null, 2));
        console.error("❌ Payload that failed:", JSON.stringify(payload, null, 2));
        setError(`Database error: ${updateError.message}`);
        return;
      }
      
      
      // Set localStorage flag for post-save modal and redirect to prompt-pages
      if (promptPage?.slug) {
        const modalData = { 
          url: `/r/${promptPage.slug}`,
          first_name: formData.first_name,
          phone: formData.phone,
          email: formData.email
        };
        localStorage.setItem(
          "showPostSaveModal",
          JSON.stringify(modalData),
        );
      }
      
      // Navigate immediately to prompt-pages with appropriate tab to show the modal
      
      // Redirect based on campaign type
      let redirectUrl = '/prompt-pages'; // Default to main page (public tab)
      
      if (promptPage.campaign_type === 'individual') {
        redirectUrl = '/prompt-pages?tab=individual';
      } else if (promptPage.campaign_type === 'locations') {
        redirectUrl = '/prompt-pages?tab=locations';
      }
      // If campaign_type is 'public' or anything else, use default /prompt-pages
      
      
      router.push(redirectUrl);
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update prompt page",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneralSave = async (formState: any) => {
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
        .select("id, slug, campaign_type")
        .eq("slug", params.slug)
        .single();
      if (fetchError) throw fetchError;
      if (!promptPage) throw new Error("Prompt page not found");
      
      // Map all fields from formState, including camelCase to snake_case conversions
      const updateData = {
        // Basic fields
        first_name: formState.first_name || null,
        last_name: formState.last_name || null,
        email: formState.email || null,
        phone: formState.phone || null,
        role: formState.role || null,
        friendly_note: formState.friendly_note || "",
        
        // Product/Service fields
        product_name: formState.product_name || null,
        product_description: formState.product_description || null,
        product_photo: formState.product_photo || null,
        services_offered: formState.services_offered || formState.servicesOffered || null,
        features_or_benefits: formState.features_or_benefits || formState.featuresOrBenefits || null,
        
        // Offer fields
        offer_enabled: formState.offer_enabled ?? formState.offerEnabled ?? false,
        offer_title: formState.offer_title || formState.offerTitle || "Special Offer",
        offer_body: formState.offer_body || formState.offerBody || "",
        offer_url: formState.offer_url || formState.offerUrl || "",
        offer_timelock: formState.offer_timelock ?? formState.offerTimelock ?? false,
        
        // Emoji sentiment fields
        emoji_sentiment_enabled: formState.emoji_sentiment_enabled ?? formState.emojiSentimentEnabled ?? false,
        emoji_sentiment_question: formState.emoji_sentiment_question || formState.emojiSentimentQuestion || "How was your experience?",
        emoji_feedback_message: formState.emoji_feedback_message || formState.emojiFeedbackMessage || "We value your feedback! Let us know how we can do better.",
        emoji_feedback_popup_header: formState.emoji_feedback_popup_header || formState.emojiFeedbackPopupHeader || "How can we improve?",
        emoji_feedback_page_header: formState.emoji_feedback_page_header || formState.emojiFeedbackPageHeader || "Please share your feedback",
        emoji_thank_you_message: formState.emoji_thank_you_message || formState.emojiThankYouMessage || "Thank you for your feedback!",
        emoji_labels: formState.emoji_labels || formState.emojiLabels || null,
        
        // Falling icons
        falling_enabled: formState.falling_enabled ?? formState.fallingEnabled ?? false,
        falling_icon: formState.falling_icon || formState.fallingIcon || null,
        falling_icon_color: formState.falling_icon_color || formState.fallingIconColor || null,
        
        // Review platforms
        review_platforms: formState.review_platforms || formState.reviewPlatforms || [],
        
        // Other features
        ai_button_enabled: formState.ai_button_enabled ?? formState.aiButtonEnabled ?? true,
        fix_grammar_enabled: formState.fix_grammar_enabled ?? formState.fixGrammarEnabled ?? false,
        nfc_text_enabled: formState.nfc_text_enabled ?? formState.nfcTextEnabled ?? false,
        note_popup_enabled: formState.note_popup_enabled ?? formState.notePopupEnabled ?? false,
        show_friendly_note: formState.show_friendly_note ?? formState.showFriendlyNote ?? false,
        kickstarters_enabled: formState.kickstarters_enabled ?? formState.kickstartersEnabled ?? false,
        selected_kickstarters: formState.selected_kickstarters || formState.selectedKickstarters || null,
        recent_reviews_enabled: formState.recent_reviews_enabled ?? formState.recentReviewsEnabled ?? false,
      };
      
      // Only include valid columns in the payload
      const validColumns = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "role",
        "friendly_note",
        "product_name",
        "product_description",
        "product_photo",
        "services_offered",
        "features_or_benefits",
        "offer_enabled",
        "offer_title",
        "offer_body",
        "offer_url",
        "offer_timelock",
        "emoji_sentiment_enabled",
        "emoji_sentiment_question",
        "emoji_feedback_message",
        "emoji_feedback_popup_header",
        "emoji_feedback_page_header",
        "emoji_thank_you_message",
        "emoji_labels",
        "falling_enabled",
        "falling_icon",
        "falling_icon_color",
        "review_platforms",
        "ai_button_enabled",
        "fix_grammar_enabled",
        "nfc_text_enabled",
        "note_popup_enabled",
        "show_friendly_note",
        "kickstarters_enabled",
        "selected_kickstarters",
        "recent_reviews_enabled",
      ];
      const payload = Object.fromEntries(
        Object.entries(updateData).filter(([key]) =>
          validColumns.includes(key),
        ),
      );
      // Debug logs for troubleshooting
      // Update the prompt page
      const { data: updatedPromptPage, error: updateError } = await supabase
        .from("prompt_pages")
        .update(payload)
        .eq("id", promptPage.id)
        .select()
        .single();
      
      // Debug log for Supabase response
      if (updateError) {
        setError(updateError.message);
        return;
      }
      
      // If we need to update the contact as well (from name change dialog)
      if (formState.updateContact && originalFormData?.contact_id) {
        const { error: contactError } = await supabase
          .from("contacts")
          .update({
            first_name: formState.first_name,
            last_name: formState.last_name,
          })
          .eq("id", originalFormData.contact_id);
        
        if (contactError) {
          console.error("Failed to update contact:", contactError);
          // Don't fail the whole operation, just log the error
        }
      }
      
      // Update originalFormData with the new values
      if (updatedPromptPage) {
        setOriginalFormData(updatedPromptPage);
      }
      
      // Set localStorage flag for post-save modal and redirect to dashboard
      if (promptPage?.slug) {
        const modalData = { 
          url: `/r/${promptPage.slug}`,
          first_name: formData.first_name,
          phone: formData.phone,
          email: formData.email
        };
        localStorage.setItem(
          "showPostSaveModal",
          JSON.stringify(modalData),
        );
      }
      // Navigate immediately to prompt-pages to show the modal
      
      // Redirect based on campaign type
      let redirectUrl = '/prompt-pages'; // Default to main page (public tab)
      
      if (promptPage.campaign_type === 'individual') {
        redirectUrl = '/prompt-pages?tab=individual';
      } else if (promptPage.campaign_type === 'locations') {
        redirectUrl = '/prompt-pages?tab=locations';
      }
      // If campaign_type is 'public' or anything else, use default /prompt-pages
      
      
      router.push(redirectUrl);
      
      // Return the result object for proper callback handling
      return { slug: promptPage.slug };
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update prompt page",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Keep the old handleStep2Save for backward compatibility
  const handleStep2Save = handleGeneralSave;

  const handleFormSave = async (formState: ServicePromptFormState | any) => {
    // Check for name changes if this is an individual prompt page
    
    if (originalFormData && originalFormData.contact_id) {
      const nameChanged = 
        formState.first_name !== originalFormData.first_name ||
        formState.last_name !== originalFormData.last_name;
      
      
      if (nameChanged) {
        // Show confirmation dialog
        setPendingUpdateData(formState);
        setPendingAction("save");
        setShowNameChangeDialog(true);
        return;
      }
    } else {
    }
    
    // For product pages, use the specialized handler
    if (formState.review_type === "product" || formData.type === "product") {
      return handleProductSave(formState);
    }
    
    // For all other types, use the general save handler
    return handleGeneralSave(formState);
  };

  const handleFormPublish = (data: any) => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent, "publish");
  };

  const iconOptions = [
    {
      key: "star",
      label: "Stars",
      icon: <Icon name="FaStar" className="w-6 h-6 text-yellow-400" />,
    },
    {
      key: "heart",
      label: "Hearts",
      icon: <Icon name="FaHeart" className="w-6 h-6 text-red-500" />,
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
      <div className="min-h-screen">
        <AppLoader />
      </div>
    );
  }

  if (!businessProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AppLoader />
      </div>
    );
  }


  // Ensure all required fields are present and not undefined
  const safeBusinessProfile = {
    ...businessProfile,
    features_or_benefits: businessProfile.features_or_benefits || [],
    business_name: businessProfile.business_name || "",
  };

  // Unified approach: All prompt pages are editable using PromptPageForm

  // Determine the appropriate icon based on page type
  const getPageIcon = () => {
    if (formData.type === "product" || (formData as any).review_type === "product") {
      return <svg className="w-9 h-9" style={{ color: "#1A237E" }}><use href="/icons-sprite.svg#FaBox" /></svg>;
    }
    if (formData.type === "service" || (formData as any).review_type === "service") {
      return <svg className="w-9 h-9" style={{ color: "#1A237E" }}><use href="/icons-sprite.svg#FaHandshake" /></svg>;
    }
    if ((formData as any).review_type === "photo") {
      return <Icon name="FaCamera" className="w-9 h-9" style={{ color: "#1A237E" }} />;
    }
    if ((formData as any).review_type === "employee") {
      return <Icon name="FaUser" className="w-9 h-9" style={{ color: "#1A237E" }} />;
    }
    if ((formData as any).review_type === "event") {
      return <Icon name="MdEvent" className="w-9 h-9" style={{ color: "#1A237E" }} />;
    }
    if ((formData as any).review_type === "review_builder") {
      return <Icon name="FaTools" className="w-9 h-9" style={{ color: "#1A237E" }} />;
    }
    if (formData.type === "universal") {
      return <Icon name="FaGlobe" className="w-9 h-9" style={{ color: "#1A237E" }} size={36} />;
    }
    // Default icon
    return <svg className="w-9 h-9" style={{ color: "#1A237E" }}><use href="/icons-sprite.svg#FaHandshake" /></svg>;
  };

  // Determine the page title based on type
  const getPageTitle = () => {
    if (formData.type === "product" || (formData as any).review_type === "product") {
      return "Edit Product Prompt Page";
    }
    if (formData.type === "service" || (formData as any).review_type === "service") {
      return "Edit Service Prompt Page";
    }
    if ((formData as any).review_type === "photo") {
      return "Edit Photo Prompt Page";
    }
    if ((formData as any).review_type === "employee") {
      return "Edit Employee Spotlight Page";
    }
    if ((formData as any).review_type === "event") {
      return "Edit Event Review Page";
    }
    if ((formData as any).review_type === "review_builder") {
      return "Edit Review Builder";
    }
    if (formData.type === "universal") {
      return "Edit Universal Prompt Page";
    }
    return "Edit Prompt Page";
  };

  return (
    <PageCard icon={getPageIcon()}>
      <PromptPageForm
        mode="edit"
        initialData={{
          ...formData,
          offer_enabled: offerEnabled,
          offer_title: offerTitle,
          offer_body: offerBody,
          offer_url: offerUrl,
          offer_timelock: offerTimelock,
          emoji_sentiment_enabled: emojiSentimentEnabled,
          emoji_feedback_message: emojiFeedbackMessage,
          emoji_sentiment_question: emojiSentimentQuestion,
          emoji_thank_you_message: emojiThankYouMessage,
          falling_icon: fallingIcon,
          show_friendly_note: notePopupEnabled,
        }}
        onSave={handleFormSave}
        pageTitle={getPageTitle()}
        supabase={supabase}
        businessProfile={businessProfile}
        campaignType={(formData as any).campaign_type || "individual"}
        onGenerateReview={handleGenerateAIReview}
        accountId={accountId}
        slug={params.slug as string}
        successMessage={successMessage}
        error={error}
        isLoading={isLoading}
      />
      
      {/* Name Change Confirmation Dialog */}
      {showNameChangeDialog && pendingUpdateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Name Change Detected
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                You're changing the name from <strong>{originalFormData?.first_name} {originalFormData?.last_name}</strong> to <strong>{pendingUpdateData.first_name} {pendingUpdateData.last_name}</strong>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Icon name="FaExclamationTriangle" className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">This prompt page is linked to a contact.</p>
                    <p className="mb-2">To maintain data consistency, the contact must be updated along with the prompt page.</p>
                    <p className="font-medium">Is this a correction to the existing person's name?</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setShowNameChangeDialog(false);
                  // Update both prompt page and contact
                  const updatedData = { ...pendingUpdateData, updateContact: true };
                  setPendingUpdateData(updatedData);
                  
                  // Call handleStep2Save directly for form saves
                  if (pendingAction === "save") {
                    await handleStep2Save(updatedData);
                  } else {
                    await handleSubmit(
                      { preventDefault: () => {} } as React.FormEvent,
                      pendingAction || "save",
                      updatedData,
                      true // Skip name check
                    );
                  }
                }}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon name="FaCheck" className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">Yes, Update Everything</div>
                    <div className="text-sm opacity-90">This is a correction - update prompt page and contact</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowNameChangeDialog(false);
                  setPendingUpdateData(null);
                  setPendingAction(null);
                }}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon name="FaTimes" className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">No, Cancel Changes</div>
                    <div className="text-sm opacity-90">Keep the original name</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800">
                <strong>Important:</strong> If you're trying to change this to a different person, you should instead:
                <br />1. Create a new prompt page for the new person
                <br />2. Delete or complete this prompt page
              </p>
            </div>
          </div>
        </div>
      )}
    </PageCard>
  );
}
