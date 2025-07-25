"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { generateContextualReview, generateContextualTestimonial } from "@/utils/aiReviewGeneration";
import {
  FaFileAlt,
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
  FaHandsHelping,
  FaBoxOpen,
} from "react-icons/fa";
import { checkAccountLimits } from "@/utils/accountLimits";
import { Dialog } from "@headlessui/react";
import { getUserOrMock, supabase } from "@/utils/supabaseClient";
import dynamic from "next/dynamic";
import { slugify } from "@/utils/slugify";
import PromptPageForm from "../components/PromptPageForm";
import PageCard from "../components/PageCard";
import ProductPromptPageForm from "../components/ProductPromptPageForm";
import FiveStarSpinner from "../components/FiveStarSpinner";
import AppLoader from "../components/AppLoader";

interface ReviewPlatformLink {
  platform: string;
  url: string;
  wordCount?: number;
  customInstructions?: string;
  reviewText?: string;
  customPlatform?: string;
}

interface BusinessProfile {
  business_name: string;
  services_offered: string[];
  features_or_benefits: string[];
  company_values: string;
  differentiators: string;
  years_in_business: number;
  industries_served: string;
  taglines: string;
  team_founder_info: string;
  keywords: string;
  default_offer_enabled: boolean;
  default_offer_title: string;
  default_offer_body: string;
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
  background_type: string;
  background_color: string;
  text_color: string;
  header_color: string;
}

const initialFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  product_description: "",
  review_platforms: [] as ReviewPlatformLink[],
  services_offered: [],
  features_or_benefits: [],
  friendly_note: "",
  status: "draft",
  role: "",
  offer_enabled: false,
  offer_title: "Special Offer",
  offer_body: 'Use this code "1234" to get a discount on your next purchase.',
  offer_url: "",
  review_type: "service",
  video_recipient: "",
  video_note: "",
  video_tips: "",
  video_questions: [""],
  video_preset: "quick",
  video_max_length: 30,
  video_quality: "720p",
  falling_icon: "star",
  no_platform_review_template: "",
  emojiThankYouMessage: "Thank you for your feedback. It's important to us.",
  emojiSentimentEnabled: false,
  emojiSentimentQuestion: "How was your experience?",
  emojiFeedbackMessage:
    "We value your feedback! Let us know how we can do better.",
  emojiLabels: [
    "Excellent",
    "Satisfied",
    "Neutral",
    "Unsatisfied",
    "Frustrated",
  ],
  fallingEnabled: true,
  aiButtonEnabled: true,
  business_name: "",
  contact_id: "",
};

// Utility function to map camelCase form data to snake_case DB columns and filter allowed columns
function mapToDbColumns(formData: any): any {
  const insertData: any = { ...formData };
  insertData["emoji_sentiment_enabled"] = formData.emojiSentimentEnabled;
  insertData["emoji_sentiment_question"] = formData.emojiSentimentQuestion;
  insertData["emoji_feedback_message"] = formData.emojiFeedbackMessage;
  insertData["emoji_thank_you_message"] = formData.emojiThankYouMessage || "";
  insertData["ai_button_enabled"] = formData.aiButtonEnabled ?? true;
  insertData["falling_icon"] = formData.fallingIcon;
  
  // Map review_type to type for database
  if (formData.review_type) {
    insertData["type"] = formData.review_type;
  }
  
  // Remove camelCase keys
  delete insertData.emojiSentimentEnabled;
  delete insertData.emojiSentimentQuestion;
  delete insertData.emojiFeedbackMessage;
  delete insertData.emojiThankYouMessage;
  delete insertData.aiButtonEnabled;
  delete insertData.fallingEnabled;
  delete insertData.fallingIcon;
  delete insertData.emojiLabels;
  
  // Remove type-specific fields if not relevant
  if (formData.review_type === "service") {
    delete insertData.features_or_benefits;
    delete insertData.product_description;
  }
  if (formData.review_type === "product") {
    delete insertData.services_offered;
    delete insertData.product_description;
  }
  
  // Filter to only allowed DB columns (from your schema)
  const allowedColumns = [
    "id",
    "account_id",
    "slug",
    "client_name",
    "location",
    "project_type",
    "services_offered",
    "outcomes",
    "date_completed",
    "assigned_team_members",
    "review_platforms",
    "qr_code_url",
    "created_at",
    "is_universal",
    "team_member",
    "first_name",
    "last_name",
    "phone",
    "email",
    "offer_enabled",
    "offer_title",
    "offer_body",
    "category",
    "friendly_note",
    "offer_url",
    "status",
    "role",
    "falling_icon",
    "review_type",
    "type",
    "no_platform_review_template",
    "video_max_length",
    "video_quality",
    "video_preset",
    "video_questions",
    "video_note",
    "video_tips",
    "video_recipient",
    "emoji_sentiment_enabled",
    "emoji_sentiment_question",
    "emoji_feedback_message",
    "emoji_thank_you_message",
    "ai_button_enabled",
    "product_description",
    "features_or_benefits",
  ];
  return Object.fromEntries(
    Object.entries(insertData).filter(([k]) => allowedColumns.includes(k)),
  );
}

const promptTypes = [
  {
    key: "service",
    label: "Service review",
    icon: <FaHandsHelping className="w-7 h-7 text-slate-blue" />,
    description:
      "Capture a review from a customer or client who loves what you do",
  },
  {
    key: "photo",
    label: "Photo + testimonial",
    icon: <FaCamera className="w-7 h-7 text-[#1A237E]" />,
    description:
      "Capture a headshot and testimonial to display on your website or in marketing materials.",
  },
  {
    key: "product",
    label: "Product review",
    icon: <FaBoxOpen className="w-7 h-7 text-slate-blue" />,
    description: "Get a review from a customer who fancies your products",
  },
  {
    key: "video",
    label: "Video testimonial",
    icon: <FaVideo className="w-7 h-7 text-[#1A237E]" />,
    description: "Request a video testimonial from your client.",
    comingSoon: true,
  },
  {
    key: "event",
    label: "Events & spaces",
    icon: <FaGift className="w-7 h-7 text-[#1A237E]" />,
    description: "For events, rentals, tours, and more.",
    comingSoon: true,
  },
];

export default function CreatePromptPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  
  // Initialize formData with the review_type from URL params if available
  const initialReviewType = searchParams.get("type") || "service";
  const [formData, setFormData] = useState({
    ...initialFormData,
    review_type: initialReviewType
  });
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState<string | null>(
    null,
  );
  const [noPlatformReviewTemplate, setNoPlatformReviewTemplate] = useState("");
  const [aiLoadingPhoto, setAiLoadingPhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [savedPromptPageUrl, setSavedPromptPageUrl] = useState<string | null>(
    null,
  );
  const [services, setServices] = useState<string[]>([]);
  const [pageOrigin, setPageOrigin] = useState("");
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
    "How was your experience?",
  );
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
    "We value your feedback! Let us know how we can do better.",
  );
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
    initialFormData.emojiThankYouMessage,
  );
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadBusinessProfile = async () => {
      try {
        const {
          data: { user },
        } = await getUserOrMock(supabase);
        if (!user) {
          console.log("No user found");
          return;
        }
        setCurrentUser(user);
        const { data: businessData } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", user.id)
          .single();
        if (businessData) {
          setBusinessProfile({
            ...businessData,
            business_name: businessData.name || businessData.business_name,
            services_offered: Array.isArray(businessData.services_offered)
              ? businessData.services_offered
              : typeof businessData.services_offered === "string"
                ? [businessData.services_offered]
                : [],
            features_or_benefits: Array.isArray(
              businessData.features_or_benefits,
            )
              ? businessData.features_or_benefits
              : typeof businessData.features_or_benefits === "string"
                ? [businessData.features_or_benefits]
                : [],
          });
          if (businessData.default_offer_enabled) {
            setFormData((prev) => ({
              ...prev,
              offer_enabled: true,
              offer_title: businessData.default_offer_title || "Special Offer",
              offer_body:
                businessData.default_offer_body ||
                'Use this code "1234" to get a discount on your next purchase.',
            }));
          }
          if (
            (!formData.review_platforms ||
              formData.review_platforms.length === 0) &&
            businessData.review_platforms
          ) {
            let platforms = businessData.review_platforms;
            if (typeof platforms === "string") {
              try {
                platforms = JSON.parse(platforms);
              } catch {
                platforms = [];
              }
            }
            if (!Array.isArray(platforms)) platforms = [];
            setFormData((prev) => ({
              ...prev,
              review_platforms: platforms.map((p: any) => ({
                name: p.name || p.platform || "",
                url: p.url || "",
                wordCount: p.wordCount || 200,
                customInstructions: p.customInstructions || "",
                reviewText: p.reviewText || "",
                customPlatform: p.customPlatform || "",
              })),
            }));
          }
          if (businessData.services_offered) {
            let arr = businessData.services_offered;
            if (typeof arr === "string") {
              try {
                arr = JSON.parse(arr);
              } catch {
                arr = arr.split(/\r?\n/);
              }
            }
            if (!Array.isArray(arr)) arr = [];
            setServices(arr.filter(Boolean));
            setFormData((prev) => ({
              ...prev,
              services_offered: arr.filter(Boolean),
            }));
          }
        }
      } catch (err) {
        console.error("Error loading business profile:", err);
      }
    };
    loadBusinessProfile();
  }, []);

  // Prefill contact info from query params
  useEffect(() => {
    const first_name = searchParams.get("first_name");
    const last_name = searchParams.get("last_name");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const business_name = searchParams.get("business_name");
    const contact_id = searchParams.get("contact_id");
    setFormData((prev) => ({
      ...prev,
      first_name: first_name ?? prev.first_name,
      last_name: last_name ?? prev.last_name,
      email: email ?? prev.email,
      phone: phone ?? prev.phone,
      business_name: business_name ?? prev.business_name,
      contact_id: contact_id ?? prev.contact_id,
    }));
  }, [searchParams]);

  // Show modal if no type is set
  useEffect(() => {
    const type = searchParams.get("type") || formData.review_type;
    if (!type) {
      setShowTypeModal(true);
    }
  }, [searchParams, formData.review_type]);

  // Handler for selecting a prompt type
  function handlePromptTypeSelect(typeKey: string) {
    setShowTypeModal(false);
    setFormData((prev) => ({ ...prev, review_type: typeKey }));
    // Optionally update the URL query param for type
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("type", typeKey);
    router.replace(`/create-prompt-page?${params.toString()}`);
  }

  // Add platform handlers
  const handleAddPlatform = () => {
    setFormData((prev) => ({
      ...prev,
      review_platforms: [...prev.review_platforms, { platform: "", url: "" }],
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
    field: keyof (typeof formData.review_platforms)[0],
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      review_platforms: prev.review_platforms.map((platform, i) =>
        i === index ? { ...platform, [field]: value } : platform,
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
      // Create comprehensive page context
      const pageData = {
        review_type: formData.review_type || 'general',
        project_type: formData.services_offered?.join(", ") || "",
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
        formData.review_platforms[index].platform,
        formData.review_platforms[index].wordCount || 200,
        formData.review_platforms[index].customInstructions
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

  const handleOfferFieldsChange = (offerBody: string) => {
    if (offerBody) {
      setFormData((prev) => ({ ...prev, offer_body: offerBody }));
    } else {
      setFormData((prev) => ({
        ...prev,
        offer_body:
          'Use this code "1234" to get a discount on your next purchase.',
      }));
    }
  };

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
        project_type: formData.services_offered?.join(", ") || "",
        product_description: formData.product_description,
        outcomes: "",
        client_name: "",
        location: "",
        friendly_note: formData.friendly_note,
        photo_context: "Photo testimonial submission",
        date_completed: "",
        team_member: "",
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
      
      const review = await generateContextualTestimonial(
        aiBusinessProfile,
        pageData,
        reviewerData,
        formData.friendly_note
      );
      setNoPlatformReviewTemplate(review);
      setFormData((prev) => ({ ...prev, no_platform_review_template: review }));
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

  const handleStep1Submit = async (formData: any) => {
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (!user) throw new Error("No user found");
      const { allowed, reason } = await checkAccountLimits(
        supabase,
        user.id,
        "prompt_page",
      );
      if (!allowed) {
        setUpgradeModalMessage(
          reason ||
            "You have reached your plan limit. Please upgrade to create more prompt pages.",
        );
        setShowUpgradeModal(true);
        return;
      }
      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("account_id", user.id)
        .single();
      if (!businessData) throw new Error("No business found");
      // Ensure all customer/client fields are present
      let insertData: any = {
        ...formData,
        first_name: formData.first_name || "",
        last_name: formData.last_name || "",
        phone: formData.phone || "",
        email: formData.email || "",
        role: formData.role || "",
        account_id: user.id,
        status: "draft",
      };
      insertData.slug = slugify(
        (businessProfile?.business_name || "business") +
          "-" +
          formData.first_name +
          "-" +
          formData.last_name,
        // Only generate unique ID on client side to prevent hydration mismatch
        typeof window !== "undefined" 
          ? Date.now() + "-" + Math.random().toString(36).substring(2, 8)
          : "temp-id",
      );
      if (formData.review_type === "photo") {
        insertData.review_platforms = undefined;
      } else {
        insertData.review_platforms = formData.review_platforms.map(
          (link: any) => ({
            ...link,
            wordCount: link.wordCount
              ? Math.max(200, Number(link.wordCount))
              : 200,
          }),
        );
      }
      if (formData.review_type === "product") {
        insertData.product_description = formData.product_description || "";
        insertData.features_or_benefits = formData.features_or_benefits || [];
        insertData.services_offered = undefined;
      } else {
        if (typeof insertData.services_offered === "string") {
          const arr = insertData.services_offered
            .split(/\r?\n/)
            .map((s: string) => s.trim())
            .filter(Boolean);
          insertData.services_offered = arr.length > 0 ? arr : null;
        }
      }
      if (formData.review_type !== "video") {
        delete insertData.video_max_length;
        delete insertData.video_quality;
        delete insertData.video_preset;
        delete insertData.video_questions;
        delete insertData.video_note;
        delete insertData.video_tips;
        delete insertData.video_recipient;
      }
      insertData = mapToDbColumns(insertData);
      // Double-check customer/client fields are present in insertData
      insertData.first_name = formData.first_name || "";
      insertData.last_name = formData.last_name || "";
      insertData.phone = formData.phone || "";
      insertData.email = formData.email || "";
      insertData.role = formData.role || "";
      
      console.log("[DEBUG] handleStep1Submit insertData:", insertData);
      const { data, error } = await supabase
        .from("prompt_pages")
        .insert([insertData])
        .select()
        .single();
      console.log("[DEBUG] handleStep1Submit Supabase response:", { data, error });
      if (error) throw error;
      if (data && data.slug) {
        console.log("[DEBUG] handleStep1Submit setting createdSlug to:", data.slug);
        setCreatedSlug(data.slug);
        setStep(2);
        setSaveSuccess("Step 1 saved! Continue to step 2.");
        return;
      }
      setSaveSuccess("Step 1 saved! Continue to next step.");
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to save. Please try again.";
      setSaveError(errorMessage);
      console.error("[DEBUG] handleStep1Submit error:", error);
      throw new Error(errorMessage); // Re-throw so ProductPromptPageForm can catch it
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2Submit = async (formData: any) => {
    console.log("[DEBUG] handleStep2Submit called with createdSlug:", createdSlug);
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);
    try {
      if (!createdSlug) {
        console.error("[DEBUG] createdSlug is null/undefined");
        throw new Error("No prompt page slug found.");
      }
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (!user) throw new Error("No user found");
      // Always set review_type to 'product' if this is a product page
      let reviewType = formData.review_type;
      if (reviewType !== 'product' && formData.product_name) {
        reviewType = 'product';
      }
      let updateData = mapToDbColumns({ ...formData, account_id: user.id, review_type: reviewType });
      console.log("[DEBUG] handleStep2Submit updateData:", updateData);
      const { data, error } = await supabase
        .from("prompt_pages")
        .update(updateData)
        .eq("slug", createdSlug)
        .select()
        .single();
      console.log("[DEBUG] handleStep2Submit Supabase response:", {
        data,
        error,
      });
      if (error) throw error;
      if (data && data.slug) {
        setSavedPromptPageUrl(`/r/${data.slug}`);
        localStorage.setItem(
          "showPostSaveModal",
          JSON.stringify({ 
            url: `/r/${data.slug}`,
            first_name: formData.first_name,
            phone: formData.phone,
            email: formData.email
          }),
        );
        console.log("[DEBUG] handleStep2Submit redirecting to /prompt-pages");
        router.push("/prompt-pages");
        return;
      }
      setSaveSuccess("Prompt page updated successfully!");
    } catch (error) {
      console.error("[DEBUG] handleStep2Submit error:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to update. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  // Get the appropriate icon based on review type
  const getPageIcon = (reviewType: string) => {
    switch (reviewType) {
      case "service":
        return <FaHandsHelping className="w-9 h-9 text-slate-blue" />;
      case "product":
        return <FaBoxOpen className="w-9 h-9 text-slate-blue" />;
      case "photo":
        return <FaCamera className="w-9 h-9 text-slate-blue" />;
      default:
        return undefined; // No icon for fallback
    }
  };

  // Get the appropriate form component based on review type
  const getFormComponent = () => {
    console.log("[DEBUG] getFormComponent called with review_type:", formData.review_type);
    console.log("[DEBUG] Full formData:", formData);
    
    if (formData.review_type === "service") {
      console.log("[DEBUG] Service page render - createdSlug:", createdSlug, "step:", step);
      // Ensure all required fields for service are present
      const serviceInitialData = {
        ...initialFormData,
        ...formData,
        review_type: "service",
        // Ensure all required fields for PromptPageForm are present
        offer_enabled: formData.offer_enabled ?? false,
        offer_title: formData.offer_title ?? "",
        offer_body: formData.offer_body ?? "",
        offer_url: formData.offer_url ?? "",
        emojiSentimentEnabled: formData.emojiSentimentEnabled ?? false,
        emojiSentimentQuestion:
          formData.emojiSentimentQuestion ?? "How was your experience?",
        emojiFeedbackMessage:
          formData.emojiFeedbackMessage ??
          "We value your feedback! Let us know how we can do better.",
        emojiThankYouMessage:
          formData.emojiThankYouMessage ?? initialFormData.emojiThankYouMessage,
        emojiLabels: formData.emojiLabels ?? [
          "Excellent",
          "Satisfied",
          "Neutral",
          "Unsatisfied",
          "Frustrated",
        ],
        review_platforms: formData.review_platforms ?? [],
        fallingEnabled: formData.fallingEnabled ?? initialFormData.fallingEnabled,
        fallingIcon: formData.falling_icon ?? "star",
        falling_icon_color: "#fbbf24", // Default color
        aiButtonEnabled: formData.aiButtonEnabled ?? true,
      };
      return (
        <PromptPageForm
          mode="create"
          initialData={serviceInitialData}
          onSave={handleStep1Submit}
          onPublish={handleStep2Submit}
          pageTitle="Create service prompt page"
          supabase={supabase}
          businessProfile={businessProfile}
          step={step}
          onStepChange={setStep}
        />
      );
    }
    
    if (formData.review_type === "product") {
      console.log("[DEBUG] Product page render - createdSlug:", createdSlug, "step:", step);
      return (
        <ProductPromptPageForm
          mode="create"
          initialData={{ ...formData, review_type: "product" }}
          onSave={handleStep1Submit}
          onPublish={handleStep2Submit}
          pageTitle="Create product prompt page"
          supabase={supabase}
          businessProfile={businessProfile}
          step={step}
          onStepChange={setStep}
          accountId={currentUser?.id || ""}
          onGenerateReview={handleGenerateAIReview}
          isLoading={isSaving}
        />
      );
    }
    
    if (formData.review_type === "photo") {
      console.log("[DEBUG] Photo page render - createdSlug:", createdSlug, "step:", step);
      return (
        <PromptPageForm
          mode="create"
          initialData={formData}
          onSave={handleStep1Submit}
          onPublish={handleStep2Submit}
          pageTitle="Photo + Testimonial"
          supabase={supabase}
          businessProfile={businessProfile}
          step={step}
          onStepChange={setStep}
        />
      );
    }
    
    // Fallback for when no type is selected
    console.log("[DEBUG] Fallback page render - createdSlug:", createdSlug, "step:", step);
    return (
      <PromptPageForm
        mode="create"
        initialData={formData}
        onSave={handleStep1Submit}
        onPublish={handleStep2Submit}
        pageTitle="Create Your Prompt Page"
        supabase={supabase}
        businessProfile={businessProfile}
        step={step}
        onStepChange={setStep}
      />
    );
  };

  return (
    <>
      {mounted && showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowTypeModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-slate-blue mb-6">
              Select prompt page type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {promptTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() =>
                    !type.comingSoon && handlePromptTypeSelect(type.key)
                  }
                  className={`flex flex-col items-center gap-2 p-6 rounded-lg border border-gray-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all bg-gray-50 hover:bg-indigo-50 focus:outline-none ${type.comingSoon ? "opacity-60 cursor-not-allowed relative" : ""}`}
                  disabled={!!type.comingSoon}
                  tabIndex={type.comingSoon ? -1 : 0}
                >
                  {type.icon}
                  <span className="font-semibold text-lg text-slate-blue">
                    {type.label}
                  </span>
                  <span className="text-sm text-gray-600 text-center">
                    {type.description}
                  </span>
                  {type.comingSoon && (
                    <span className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
                      Coming soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Limit Exceeded Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowUpgradeModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-slate-blue mb-2">
              Prompt page limit exceeded
            </h2>
            <p className="mb-6 text-gray-700">
              {upgradeModalMessage || "You have reached the maximum number of prompt pages for your plan. Upgrade to create more."}
            </p>
            {/* Show 'Contact us' for 500+ prompt pages, otherwise 'Upgrade Plan' */}
            {upgradeModalMessage && /500|\b[5-9][0-9]{2,}|[1-9][0-9]{3,}/.test(upgradeModalMessage) ? (
              <a
                href="https://promptreviews.app/contact"
                className="inline-block px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition mb-2 w-full text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact us
              </a>
            ) : (
              <a
                href="/dashboard/plan"
                className="inline-block px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition mb-2 w-full text-center"
              >
                Upgrade Plan
              </a>
            )}
          </div>
        </div>
      )}

      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard icon={getPageIcon(formData.review_type)}>
          {getFormComponent()}
        </PageCard>
      </div>
    </>
  );
}
