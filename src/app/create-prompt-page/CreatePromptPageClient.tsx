"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { generateContextualReview, generateContextualTestimonial } from "@/utils/aiReviewGeneration";
import Icon from "@/components/Icon";
import { checkAccountLimits } from "@/utils/accountLimits";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { Dialog } from "@headlessui/react";
import { getUserOrMock, supabase } from "@/utils/supabaseClient";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";
import dynamic from "next/dynamic";
import { slugify } from "@/utils/slugify";
import { preparePromptPageData, validatePromptPageData } from "@/utils/promptPageDataMapping";
import PromptPageForm from "../components/PromptPageForm";
import PageCard from "../components/PageCard";
import { promptTypes } from "@/config/promptTypes";
import ProductPromptPageForm from "../components/ProductPromptPageForm";
import PhotoPromptPageForm from "../components/PhotoPromptPageForm";
import EmployeePromptPageForm from "../components/EmployeePromptPageForm";
import EventPromptPageForm from "../components/EventPromptPageForm";
import FiveStarSpinner from "../components/FiveStarSpinner";

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
  company_values?: string;
  differentiators?: string;
  years_in_business?: number;
  industries_served?: string;
  taglines?: string;
  team_founder_info?: string;
  keywords?: string;
  default_offer_enabled?: boolean;
  default_offer_title?: string;
  default_offer_body?: string;
  gradient_start?: string;
  gradient_middle?: string;
  gradient_end?: string;
  background_type?: string;
  background_color?: string;
  text_color?: string;
  header_color?: string;
  // Additional properties from database
  name?: string;
  review_platforms?: any;
  facebook_url?: string;
  instagram_url?: string;
  bluesky_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  pinterest_url?: string;
  created_at?: string;
  updated_at?: string;
}

const initialFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  product_description: "",
  review_platforms: [] as ReviewPlatformLink[],
  services_offered: [],
  friendly_note: "",
  status: "draft",
  role: "",
  offer_enabled: false,
  offer_title: "Special Offer",
  offer_body: 'Use this code "1234" to get a discount on your next purchase.',
  offer_url: "",
  review_type: "service",
  campaign_type: typeof window !== 'undefined' ? localStorage.getItem('campaign_type') || 'individual' : 'individual',
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

// Note: mapToDbColumns function replaced with centralized preparePromptPageData utility



interface CreatePromptPageClientProps {
  markOnboardingComplete?: boolean;
}

export default function CreatePromptPageClient({ 
  markOnboardingComplete = false 
}: CreatePromptPageClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [createdSlug, setCreatedSlug] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('createdSlug');
    }
    return null;
  });
  
  // Update localStorage when createdSlug changes
  useEffect(() => {
    if (createdSlug && typeof window !== 'undefined') {
      localStorage.setItem('createdSlug', createdSlug);
    }
  }, [createdSlug]);

  // Clear createdSlug from localStorage when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('createdSlug');
      }
    };
  }, []);

  // Initialize formData with the review_type from URL params if available
  const initialReviewType = searchParams.get("type") || "service";
  const [formData, setFormData] = useState(() => {
    // Get campaign type from URL params first, then localStorage, then default to individual
    const urlCampaignType = searchParams.get("campaign_type");
    const localStorageCampaignType = typeof window !== 'undefined' 
      ? localStorage.getItem('campaign_type')
      : null;
    const campaignType = urlCampaignType || localStorageCampaignType || 'individual';
    
    // Campaign type determination logic (debug logs removed for production)
    
    const initialData = {
      ...initialFormData,
      review_type: initialReviewType,
      campaign_type: campaignType
    };
    return initialData;
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
  
  // 🔒 Race condition prevention
  const [isSubmissionLocked, setIsSubmissionLocked] = useState(false);
  const submissionLockRef = useRef(false);
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
  const [isLoadingBusinessProfile, setIsLoadingBusinessProfile] = useState(true);

  // Mark create prompt page task as completed when accessed from dashboard
  useEffect(() => {
    if (markOnboardingComplete) {
      const markCreatePromptTaskComplete = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await markTaskAsCompleted(user.id, "create-prompt-page");
          }
        } catch (error) {
          console.error("Error marking create prompt task as complete:", error);
        }
      };
      markCreatePromptTaskComplete();
    }
  }, [markOnboardingComplete]);

  useEffect(() => {
    const loadBusinessProfile = async () => {
      setIsLoadingBusinessProfile(true);
      try {
        const {
          data: { user },
        } = await getUserOrMock(supabase);
        if (!user) {
          return;
        }
        setCurrentUser(user);
        
        // Check if we're in a post-business-creation flow
        const isPostBusinessCreation = typeof window !== 'undefined' && 
          (window.location.search.includes('businessCreated') || 
           sessionStorage.getItem('businessCreatedHandled') === 'true');
        
        // Add retry logic for business fetching (in case of timing issues)
        let businessData = null;
        let businessError = null;
        let retryCount = 0;
        const maxRetries = isPostBusinessCreation ? 5 : 3; // More retries after business creation
        
        // Get the user's account_id using the proper utility function
        // This handles multiple account_user records correctly
        const accountId = await getAccountIdForUser(user.id, supabase);
        
        if (!accountId) {
          console.error("🎯 No account found for user:", user.id);
          throw new Error("No account found for user");
        }
        
        console.log('🎯 Using account ID:', accountId);
        
        console.log("🔑 Using account_id:", accountId, "for user:", user.id);
        
        while (retryCount < maxRetries && !businessData && !businessError) {
          console.log(`🔄 Fetching business profile (attempt ${retryCount + 1}/${maxRetries}) for account:`, accountId);
          if (isPostBusinessCreation) {
            console.log("🆕 Post-business-creation flow detected, using extended retry logic");
          }
          
                  const result = await supabase
          .from("businesses")
          .select("name, services_offered, default_offer_enabled, default_offer_title, default_offer_body, review_platforms, facebook_url, instagram_url, bluesky_url, tiktok_url, youtube_url, linkedin_url, pinterest_url, created_at, updated_at")
          .eq("account_id", accountId)
          .maybeSingle();
            
          businessData = result.data;
          businessError = result.error;
          
          if (!businessData && !businessError && retryCount < maxRetries - 1) {
            const delay = isPostBusinessCreation ? (retryCount + 1) * 1000 : (retryCount + 1) * 500;
            console.log(`🔄 No business found, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          retryCount++;
        }
          
        if (businessError) {
          console.error("🎯 Business query failed!");
          console.error("🎯 Account ID used:", accountId);
          console.error("🎯 User ID:", user.id);
          console.error("🎯 Raw error:", businessError);
          console.error("🎯 Error toString:", String(businessError));
          
          // Let's also check if account_users query worked
          console.log("🔍 Account ID:", accountId);
          
          // Use default business profile on error
        }
        
        if (!businessData) {
          console.warn("🎯 No business found for account ID:", accountId);
          console.log("🔍 This is normal if the user hasn't created a business yet");
          // Use default business profile when no business exists
          setBusinessProfile({
            business_name: "Your Business",
            services_offered: [],
            company_values: "",
            differentiators: "",
            years_in_business: 0,
            industries_served: "",
            taglines: "",
            team_founder_info: "",
            keywords: "",
            default_offer_enabled: false,
            default_offer_title: "",
            default_offer_body: "",
            gradient_start: "",
            gradient_middle: "",
            gradient_end: "",
            background_type: "",
            background_color: "",
            text_color: "",
            header_color: "",
          });
          setIsLoadingBusinessProfile(false);
          return;
        }
        
        if (!businessData) {
          setBusinessProfile({
            business_name: "Your Business",
            services_offered: [],
            company_values: "",
            differentiators: "",
            years_in_business: 0,
            industries_served: "",
            taglines: "",
            team_founder_info: "",
            keywords: "",
            default_offer_enabled: false,
            default_offer_title: "",
            default_offer_body: "",
            gradient_start: "",
            gradient_middle: "",
            gradient_end: "",
            background_type: "",
            background_color: "",
            text_color: "",
            header_color: "",
          });
          setIsLoadingBusinessProfile(false);
          return;
        }
        
        // Check if business profile has a name (basic requirement)
        const hasBusinessName = businessData.name && businessData.name.trim() !== '';
        
        if (!hasBusinessName) {
          setBusinessProfile({
            business_name: businessData.name || "Your Business",
            services_offered: [],
            company_values: "",
            differentiators: "",
            years_in_business: 0,
            industries_served: "",
            taglines: "",
            team_founder_info: "",
            keywords: "",
            default_offer_enabled: false,
            default_offer_title: "",
            default_offer_body: "",
            gradient_start: "",
            gradient_middle: "",
            gradient_end: "",
            background_type: "",
            background_color: "",
            text_color: "",
            header_color: "",
          });
          setIsLoadingBusinessProfile(false);
          return;
        }
        if (businessData) {
          
          // Batch state updates to reduce re-renders
          const updates = {
            businessProfile: {
              ...businessData,
              business_name: businessData.name || "Your Business",
              services_offered: Array.isArray(businessData.services_offered)
                ? businessData.services_offered
                : typeof businessData.services_offered === "string"
                  ? [businessData.services_offered]
                  : [],
                        // features_or_benefits column doesn't exist in database - using services_offered instead
            },
            formDataUpdates: {} as any,
            services: [] as string[]
          };
          
          // Process offer data
          if (businessData.default_offer_enabled) {
            updates.formDataUpdates.offer_enabled = true;
            updates.formDataUpdates.offer_title = businessData.default_offer_title || "Special Offer";
            updates.formDataUpdates.offer_body = businessData.default_offer_body || 'Use this code "1234" to get a discount on your next purchase.';
          }
          
          // Process review platforms
          if (businessData.review_platforms) {
            let platforms = businessData.review_platforms;
            if (typeof platforms === "string") {
              try {
                platforms = JSON.parse(platforms);
              } catch {
                platforms = [];
              }
            }
            if (!Array.isArray(platforms)) platforms = [];
            updates.formDataUpdates.review_platforms = platforms.map((p: any) => ({
              name: p.name || p.platform || "",
              url: p.url || "",
              wordCount: p.wordCount || 200,
              customInstructions: p.customInstructions || "",
              reviewText: p.reviewText || "",
              customPlatform: p.customPlatform || "",
            }));
          }
          
          // Process services
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
            const filteredServices = arr.filter(Boolean);
            updates.services = filteredServices;
            updates.formDataUpdates.services_offered = filteredServices;
            // features_or_benefits column doesn't exist - using services_offered instead
          }
          
          // Process social media URLs
          if (businessData.facebook_url || businessData.instagram_url || businessData.bluesky_url || 
              businessData.tiktok_url || businessData.youtube_url || businessData.linkedin_url || 
              businessData.pinterest_url) {
            updates.formDataUpdates.facebook_url = businessData.facebook_url || "";
            updates.formDataUpdates.instagram_url = businessData.instagram_url || "";
            updates.formDataUpdates.bluesky_url = businessData.bluesky_url || "";
            updates.formDataUpdates.tiktok_url = businessData.tiktok_url || "";
            updates.formDataUpdates.youtube_url = businessData.youtube_url || "";
            updates.formDataUpdates.linkedin_url = businessData.linkedin_url || "";
            updates.formDataUpdates.pinterest_url = businessData.pinterest_url || "";
          }
          
          // Apply all updates in batch
          setBusinessProfile(updates.businessProfile);
          setServices(updates.services);
          setFormData((prev) => ({
            ...prev,
            ...updates.formDataUpdates
          }));
        }
      } catch (err) {
        console.error("Error loading business profile:", err);
      } finally {
        setIsLoadingBusinessProfile(false);
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

  // Update localStorage when campaign_type is provided in URL params
  useEffect(() => {
    const urlCampaignType = searchParams.get("campaign_type");
    if (urlCampaignType && typeof window !== 'undefined') {
      localStorage.setItem('campaign_type', urlCampaignType);
    }
  }, [searchParams]);

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
        service_name: (formData as any).service_name || (formData.services_offered && formData.services_offered[0]) || "",
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

  // 🔒 Submission lock utility to prevent race conditions
  const withSubmissionLock = async (fn: () => Promise<void>) => {
    if (submissionLockRef.current) {
      console.warn("Submission already in progress, ignoring duplicate request");
      return;
    }
    
    submissionLockRef.current = true;
    setIsSubmissionLocked(true);
    setIsSaving(true);
    
    try {
      await fn();
    } finally {
      submissionLockRef.current = false;
      setIsSubmissionLocked(false);
      setIsSaving(false);
    }
  };

  const handleStep1Submit = async (formData: any) => {
    await withSubmissionLock(async () => {
      setSaveError(null);
      setSaveSuccess(null);
      try {
        // First, try to refresh the session to prevent session expiration issues
        try {
          await supabase.auth.refreshSession();
        } catch (refreshError) {
          console.warn("Session refresh failed, proceeding anyway:", refreshError);
        }
        
        let user = null;
        let userError = null;
        
        // Try to get user with retry mechanism
        for (let attempt = 1; attempt <= 3; attempt++) {
          const userResult = await getUserOrMock(supabase);
          const { data, error } = userResult;
          
          if (data.user && !error) {
            user = data.user;
            userError = null;
            break;
          }
          
          userError = error;
          console.warn(`User fetch attempt ${attempt} failed:`, error);
          
          if (attempt < 3) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 200 * attempt));
          }
        }
        
        if (!user) {
          console.error("Failed to get user after 3 attempts");
          throw new Error(`No user found. Please sign in again and try saving. Last error: ${userError?.message || 'Unknown error'}`);
        }

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

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("account_id", user.id)
        .single();
      
      if (businessError) {
        throw new Error("Failed to fetch business data");
      }
      if (!businessData) {
        throw new Error("No business found");
      }
      
      // Get the campaign type from localStorage or formData
      const campaignType = formData.campaign_type || (typeof window !== 'undefined' 
        ? localStorage.getItem('campaign_type') || 'individual'
        : 'individual');
      
      console.log('🔍 Campaign type resolution:', {
        from_formData: formData.campaign_type,
        from_localStorage: typeof window !== 'undefined' ? localStorage.getItem('campaign_type') : null,
        final_value: campaignType
      });

      // Prepare the data for insertion
      let insertData = {
        ...formData,
        account_id: user.id,
        status: formData.review_type === "product" ? "published" : "draft",
        campaign_type: formData.campaign_type || campaignType,
        // Convert camelCase to snake_case
        emoji_sentiment_enabled: formData.emojiSentimentEnabled,
        emoji_sentiment_question: formData.emojiSentimentQuestion,
        emoji_feedback_message: formData.emojiFeedbackMessage,
        emoji_feedback_popup_header: formData.emojiFeedbackPopupHeader,
        emoji_feedback_page_header: formData.emojiFeedbackPageHeader,
        emoji_thank_you_message: formData.emojiThankYouMessage,
        ai_button_enabled: formData.aiButtonEnabled ?? true,
        fix_grammar_enabled: formData.fixGrammarEnabled ?? false,
        falling_enabled: formData.fallingEnabled ?? false,
        falling_icon: formData.fallingIcon ?? "star",
        falling_icon_color: formData.fallingIconColor ?? "#fbbf24",
        offer_enabled: formData.offerEnabled ?? false,
        offer_title: formData.offerTitle ?? "",
        offer_body: formData.offerBody ?? "",
        offer_url: formData.offerUrl ?? "",
        note_popup_enabled: formData.notePopupEnabled ?? false,
        nfc_text_enabled: formData.nfcTextEnabled ?? false,
        show_friendly_note: formData.showFriendlyNote ?? false,
        friendly_note: formData.friendlyNote ?? "",
        // Social media URLs inherited from business profile
        facebook_url: formData.facebook_url || "",
        instagram_url: formData.instagram_url || "",
        bluesky_url: formData.bluesky_url || "",
        tiktok_url: formData.tiktok_url || "",
        youtube_url: formData.youtube_url || "",
        linkedin_url: formData.linkedin_url || "",
        pinterest_url: formData.pinterest_url || ""
      };


      // Generate slug based on form data or business name
      insertData.slug = slugify(
        formData.name ||
          businessData.business_name +
          "-" +
          (formData.first_name || "customer") +
          "-" +
          (formData.last_name || "page"),
        // Only generate unique ID on client side to prevent hydration mismatch
        typeof window !== "undefined" 
          ? Date.now() + "-" + Math.random().toString(36).substring(2, 8)
          : "temp-id",
      );


      // Handle review platforms
      if (formData.review_type === "photo") {
        insertData.review_platforms = undefined;
      } else {
        insertData.review_platforms = formData.review_platforms?.map(
          (link: any) => ({
            ...link,
            wordCount: link.wordCount
              ? Math.max(200, Number(link.wordCount))
              : 200,
          }),
        ) || [];
      }

      // Handle type-specific fields
      if (formData.review_type === "product") {
        insertData.product_description = formData.product_description || "";
        // features_or_benefits column doesn't exist in database
        insertData.services_offered = undefined;
        insertData.product_name = formData.product_name || "";
        insertData.product_photo = formData.product_photo || null;
      } else if (formData.review_type === "service") {
        if (typeof insertData.services_offered === "string") {
          const arr = insertData.services_offered
            .split(/\r?\n/)
            .map((s: string) => s.trim())
            .filter(Boolean);
          insertData.services_offered = arr.length > 0 ? arr : null;
        }
        insertData.product_description = undefined;
        // features_or_benefits column doesn't exist in database
        insertData.product_name = undefined;
        insertData.product_photo = undefined;
      }

      // Use centralized data mapping utility
      const mappedData = preparePromptPageData(insertData);
      
      
      // Validate the prepared data
      const validation = validatePromptPageData(mappedData);
      if (!validation.isValid) {
        console.error("[DEBUG] Product Save - Validation failed with errors:", validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }


      // Insert the prompt page
      const { data, error } = await supabase
        .from("prompt_pages")
        .insert(mappedData)
        .select()
        .single();


      if (error) {
        console.error("[DEBUG] Product Save - Database error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (data && data.slug) {
        setCreatedSlug(data.slug);
        if (typeof window !== 'undefined') {
          localStorage.setItem('createdSlug', data.slug);
        }
        
        // Auto-create contact for individual prompt pages
        console.log('🎯 Contact creation check:', {
          campaign_type_from_formData: formData.campaign_type,
          campaign_type_from_insertData: data.campaign_type,
          has_first_name: !!formData.first_name,
          first_name: formData.first_name,
          should_create_contact: formData.campaign_type === 'individual' && formData.first_name
        });
        
        if (formData.campaign_type === 'individual' && formData.first_name) {
          try {
            console.log('🔍 Creating contact for prompt page:', data.id);
            
            const contactResponse = await fetch('/api/contacts/create-from-prompt-page', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
              body: JSON.stringify({
                promptPageData: {
                  first_name: formData.first_name,
                  last_name: formData.last_name,
                  email: formData.email,
                  phone: formData.phone,
                  business_name: formData.business_name,
                  role: formData.role,
                  address_line1: formData.address_line1,
                  address_line2: formData.address_line2,
                  city: formData.city,
                  state: formData.state,
                  postal_code: formData.postal_code,
                  country: formData.country,
                  category: formData.category,
                  notes: formData.notes,
                },
                promptPageId: data.id
              }),
            });

            if (contactResponse.ok) {
              const contactResult = await contactResponse.json();
              console.log('✅ Contact created successfully:', contactResult);
              
              // Update success message to mention contact creation
              const contactName = `${formData.first_name} ${formData.last_name || ''}`.trim();
              setSaveSuccess(`Prompt page created successfully! Contact '${contactName}' was also created.`);
            } else {
              console.error('❌ Failed to create contact:', await contactResponse.text());
              // Don't fail the entire operation if contact creation fails
              setSaveSuccess("Prompt page created successfully!");
            }
          } catch (contactError) {
            console.error('❌ Error creating contact:', contactError);
            // Don't fail the entire operation if contact creation fails
            setSaveSuccess("Prompt page created successfully!");
          }
        } else {
          setSaveSuccess("Prompt page created successfully!");
        }
        
        // For product pages, set success message and then redirect
        if (formData.review_type === "product") {
          // Set success modal data before navigation
          const modalData = { 
            url: `/r/${data.slug}`,
            first_name: formData.first_name,
            phone: formData.phone,
            email: formData.email
          };
          localStorage.setItem("showPostSaveModal", JSON.stringify(modalData));
          
          // Navigate immediately to prompt-pages
          router.push("/prompt-pages");
          return;
        }

        setStep(2);
        return;
      }

      throw new Error("Failed to save. Please try again.");
      } catch (error: any) {
        console.error("[DEBUG] handleStep1Submit - Full error:", error);
        console.error("[DEBUG] handleStep1Submit - Error type:", typeof error);
        console.error("[DEBUG] handleStep1Submit - Error constructor:", error?.constructor?.name);
        console.error("[DEBUG] handleStep1Submit - Error properties:", Object.keys(error || {}));
        console.error("[DEBUG] handleStep1Submit - Error own properties:", Object.getOwnPropertyNames(error || {}));
        console.error("[DEBUG] handleStep1Submit - Error message:", error?.message);
        console.error("[DEBUG] handleStep1Submit - Error code:", error?.code);
        console.error("[DEBUG] handleStep1Submit - Error status:", error?.status);
        console.error("[DEBUG] handleStep1Submit - Error hint:", error?.hint);
        console.error("[DEBUG] handleStep1Submit - Error details:", error?.details);
        console.error("[DEBUG] handleStep1Submit - Error stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.error("[DEBUG] handleStep1Submit - Error toString:", error?.toString());
        console.error("[DEBUG] handleStep1Submit - Error stack:", error?.stack);
        
        // If it's a PostgrestError, log specific fields
        if (error?.code && error?.details) {
          console.error("[DEBUG] PostgrestError - code:", error.code);
          console.error("[DEBUG] PostgrestError - details:", error.details);
          console.error("[DEBUG] PostgrestError - hint:", error.hint);
          console.error("[DEBUG] PostgrestError - message:", error.message);
        }
        
        setSaveError(
          error instanceof Error
            ? error.message
            : "Failed to save. Please try again."
        );
      }
    });
  };

  const handleServicePageSubmit = async (formData: any) => {
    // Service page submission handler
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);
    
    try {
      // First, try to refresh the session to prevent session expiration issues
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        console.warn("Session refresh failed, proceeding anyway:", refreshError);
      }
      
      let user = null;
      let userError = null;
      
      // Try to get user with retry mechanism
      for (let attempt = 1; attempt <= 3; attempt++) {
        const userResult = await getUserOrMock(supabase);
        const { data, error } = userResult;
        
        if (data.user && !error) {
          user = data.user;
          userError = null;
          break;
        }
        
        userError = error;
        console.warn(`User fetch attempt ${attempt} failed:`, error);
        
        if (attempt < 3) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        }
      }
      
      if (!user) {
        console.error("Failed to get user after 3 attempts");
        throw new Error(`No user found. Please sign in again and try saving. Last error: ${userError?.message || 'Unknown error'}`);
      }

      const limitResult = await checkAccountLimits(
        supabase,
        user.id,
        "prompt_page",
      );
      
      const { allowed, reason } = limitResult;
      if (!allowed) {
        setUpgradeModalMessage(
          reason ||
            "You have reached your plan limit. Please upgrade to create more prompt pages.",
        );
        setShowUpgradeModal(true);
        return;
      }

      // Get the correct account ID for this user
      const accountId = await getAccountIdForUser(user.id, supabase);
      if (!accountId) {
        throw new Error("No account found for user");
      }
      
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("account_id", accountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (businessError) {
        console.error("Business fetch error:", businessError);
        throw new Error(`Failed to fetch business data: ${businessError.message}`);
      }
      
      if (!businessData) {
        throw new Error("No business profile found. Please create a business profile first.");
      }

      // Create complete prompt page data (only include valid prompt_pages columns)
      const campaignType = formData.campaign_type || 'public';
      const insertData = {
        account_id: accountId,
        // Note: business_name column doesn't exist - removed
        review_type: formData.review_type || "service", // Use the review_type from form data
        status: "draft", // Start as draft for individual prompt pages
        campaign_type: campaignType,
        falling_icon_color: "#fbbf24",
        // Include only valid prompt_pages fields from formData
        name: formData.name || '',
        notes: formData.description || '', // Using 'notes' instead of 'description'
        services_offered: formData.services_offered || [],
        // features_or_benefits column doesn't exist in database
        product_description: formData.product_description || '',
        review_platforms: formData.review_platforms || [],
        falling_enabled: formData.fallingEnabled ?? false,
        falling_icon: formData.falling_icon || 'star',
        offer_enabled: formData.offer_enabled ?? false,
        offer_title: formData.offer_title || '',
        offer_body: formData.offer_body || '',
        offer_url: formData.offer_url || '',
        emoji_sentiment_enabled: formData.emojiSentimentEnabled ?? false,
        emoji_sentiment_question: formData.emojiSentimentQuestion || 'How was your experience?',
        emoji_feedback_message: formData.emojiFeedbackMessage || 'We value your feedback! Let us know how we can do better.',
        emoji_thank_you_message: formData.emojiThankYouMessage || 'Thank you for your feedback!',
        emoji_labels: formData.emojiLabels || ['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'],
        // Social media URLs inherited from business profile
        facebook_url: formData.facebook_url || '',
        instagram_url: formData.instagram_url || '',
        bluesky_url: formData.bluesky_url || '',
        tiktok_url: formData.tiktok_url || '',
        youtube_url: formData.youtube_url || '',
        linkedin_url: formData.linkedin_url || '',
        pinterest_url: formData.pinterest_url || ''
      };

      // Only include customer fields for individual campaigns
      if (campaignType === 'individual') {
        (insertData as any).first_name = (formData as any).first_name || '';
        (insertData as any).last_name = (formData as any).last_name || '';
        (insertData as any).email = (formData as any).email || '';
        (insertData as any).phone = (formData as any).phone || '';
        (insertData as any).role = (formData as any).role || '';
      }

      // Add Employee-specific fields for employee pages
      if (formData.review_type === 'employee') {
        (insertData as any).emp_first_name = (formData as any).emp_first_name || '';
        (insertData as any).emp_last_name = (formData as any).emp_last_name || '';
        (insertData as any).emp_pronouns = (formData as any).emp_pronouns || '';
        (insertData as any).emp_headshot_url = (formData as any).emp_headshot_url || '';
        (insertData as any).emp_position = (formData as any).emp_position || '';
        (insertData as any).emp_location = (formData as any).emp_location || '';
        (insertData as any).emp_years_at_business = (formData as any).emp_years_at_business || '';
        (insertData as any).emp_bio = (formData as any).emp_bio || '';
        (insertData as any).emp_fun_facts = (formData as any).emp_fun_facts || [];
        (insertData as any).emp_skills = (formData as any).emp_skills || [];
        (insertData as any).emp_review_guidance = (formData as any).emp_review_guidance || '';
      }

      // Add Service-specific fields for service pages
      if (formData.review_type === 'service') {
        (insertData as any).service_name = (formData as any).service_name || (formData.services_offered && formData.services_offered[0]) || '';
        (insertData as any).service_description = (formData as any).service_description || '';
      }

      // Add Event-specific fields for event pages
      if (formData.review_type === 'event') {
        (insertData as any).eve_name = (formData as any).eve_name || '';
        (insertData as any).eve_type = (formData as any).eve_type || '';
        (insertData as any).eve_date = (formData as any).eve_date || null;
        (insertData as any).eve_location = (formData as any).eve_location || '';
        (insertData as any).eve_description = (formData as any).eve_description || '';
        (insertData as any).eve_duration = (formData as any).eve_duration || '';
        (insertData as any).eve_capacity = (formData as any).eve_capacity || null;
        (insertData as any).eve_organizer = (formData as any).eve_organizer || '';
        (insertData as any).eve_special_features = (formData as any).eve_special_features || [];
        (insertData as any).eve_review_guidance = (formData as any).eve_review_guidance || '';
      }

      // Generate slug
              const businessName = businessData.name || "business";
      (insertData as any).slug = slugify(
        businessName +
          "-" +
          (formData.name || formData.first_name || "service") +
          "-prompt",
        typeof window !== "undefined" 
          ? Date.now() + "-" + Math.random().toString(36).substring(2, 8)
          : "temp-id",
      );

      // Save to database
      
      let data, error;
      try {
        const result = await supabase
          .from("prompt_pages")
          .insert(insertData)
          .select("*")
          .single();
        data = result.data;
        error = result.error;
      } catch (insertError) {
        console.error("Database insert exception:", insertError);
        throw insertError;
      }

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      // Auto-create contact for individual prompt pages (same logic as handleStep1Submit)
      console.log('🎯 Service page contact creation check:', {
        campaign_type_from_formData: formData.campaign_type,
        campaign_type_from_insertData: data.campaign_type,
        has_first_name: !!formData.first_name,
        first_name: formData.first_name,
        should_create_contact: formData.campaign_type === 'individual' && formData.first_name
      });
      
      if (formData.campaign_type === 'individual' && formData.first_name) {
        try {
          console.log('🔍 Creating contact for service page:', data.id);
          
          const contactResponse = await fetch('/api/contacts/create-from-prompt-page', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              promptPageData: {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                business_name: formData.business_name,
                role: formData.role,
                address_line1: formData.address_line1,
                address_line2: formData.address_line2,
                city: formData.city,
                state: formData.state,
                postal_code: formData.postal_code,
                country: formData.country,
                category: formData.category,
                notes: formData.notes,
              },
              promptPageId: data.id
            }),
          });

          if (contactResponse.ok) {
            const contactResult = await contactResponse.json();
            console.log('✅ Contact created successfully for service page:', contactResult);
          } else {
            console.error('❌ Failed to create contact for service page:', await contactResponse.text());
            // Don't fail the entire operation if contact creation fails
          }
        } catch (contactError) {
          console.error('❌ Error creating contact for service page:', contactError);
          // Don't fail the entire operation if contact creation fails
        }
      }

      // Set success modal data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('showPostSaveModal', JSON.stringify({
          name: data.name || 'Service Campaign',
          slug: data.slug,
          url: `${window.location.origin}/r/${data.slug}`,
          timestamp: new Date().toISOString(),
          isLocationCreation: false
        }));
      }

      // Redirect to prompt pages list
      router.push('/prompt-pages');
      return data;
      
    } catch (error) {
      console.error("🚨 Service page submit error:", error);
      console.error("🚨 Error type:", typeof error);
      console.error("🚨 Error constructor:", error?.constructor?.name);
      console.error("🚨 Error properties:", Object.keys(error || {}));
      console.error("🚨 Error own properties:", Object.getOwnPropertyNames(error || {}));
      console.error("🚨 Error message:", (error as any)?.message);
      console.error("🚨 Error code:", (error as any)?.code);
      console.error("🚨 Error status:", (error as any)?.status);
      console.error("🚨 Error hint:", (error as any)?.hint);
      console.error("🚨 Error details:", (error as any)?.details);
      console.error("🚨 Error stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error("🚨 Error toString:", error?.toString());
      console.error("🚨 Error stack:", (error as any)?.stack);
      
      // If it's a PostgrestError, log specific fields
      if ((error as any)?.code && (error as any)?.details) {
        console.error("🚨 PostgrestError - code:", (error as any).code);
        console.error("🚨 PostgrestError - details:", (error as any).details);
        console.error("🚨 PostgrestError - hint:", (error as any).hint);
        console.error("🚨 PostgrestError - message:", (error as any).message);
      }
      
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save service page. Please try again."
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2Submit = async (formData: any) => {
    await withSubmissionLock(async () => {
      setSaveError(null);
      setSaveSuccess(null);
      try {
      // Get the campaign type from localStorage - this determines the page's behavior
      const campaignType = typeof window !== 'undefined' 
        ? localStorage.getItem('campaign_type') || 'individual'
        : 'individual';

      // Use centralized data mapping utility
      const updateData = preparePromptPageData({
        ...formData,
        campaign_type: campaignType,  // Ensure campaign_type is included in final submission
        status: 'published'
      });
      
      // Validate the prepared data
      const validation = validatePromptPageData(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      if (!createdSlug) {
        throw new Error("No slug found. The prompt page may not have been created in step 1.");
      }

      // First, verify the record exists
      const { data: existingData, error: existingError } = await supabase
        .from("prompt_pages")
        .select("*")
        .eq('slug', createdSlug)
        .single();

      if (existingError || !existingData) {
        throw new Error("Could not find the prompt page to update. It may have been deleted.");
      }

      // Update the existing prompt page using its slug
      const { data, error } = await supabase
        .from("prompt_pages")
        .update(updateData)
        .eq('slug', createdSlug)  // Use the slug from step 1
        .select()
        .single();
        
      if (error) {
        throw error;
      }
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
        // Success - redirecting to prompt pages
        router.push("/prompt-pages");

        // Show success message and redirect
        setShowPostSaveModal(true);
        return;
      }
        setSaveSuccess("Prompt page updated successfully!");
      } catch (error) {
        console.error("Step 2 submit error:", error);
        setSaveError(
          error instanceof Error
            ? error.message
            : "Failed to update prompt page. Please try again."
        );
      }
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <FiveStarSpinner size={24} />
      </div>
    );
  }

  // Get the appropriate icon based on review type
  const getPageIcon = (reviewType: string) => {
    switch (reviewType) {
      case "service":
        return <Icon name="FaHandshake" className="w-9 h-9 text-slate-blue" size={36} />;
      case "product":
        return <Icon name="FaBoxOpen" className="w-9 h-9 text-slate-blue" size={36} />;
      case "photo":
        return <Icon name="FaCamera" className="w-9 h-9 text-slate-blue" size={36} />;
      case "employee":
        return <Icon name="FaUser" className="w-9 h-9 text-slate-blue" size={36} />;
      case "event":
        return <Icon name="FaCalendarAlt" className="w-9 h-9 text-slate-blue" size={36} />;
      default:
        return undefined; // No icon for fallback
    }
  };

  // Get the appropriate form component based on review type
  const getFormComponent = () => {
    if (formData.review_type === "service") {
      // Ensure all required fields for service are present
      const serviceInitialData = {
        ...initialFormData,
        ...formData,
        review_type: "service",
        // Use the already correctly determined campaign type from formData
        campaign_type: formData.campaign_type,
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

              // Service form submission handler
      return (
        <PromptPageForm
          mode="create"
          initialData={serviceInitialData}
          onSave={handleServicePageSubmit}
          pageTitle="Create service prompt page"
          supabase={supabase}
          businessProfile={businessProfile}
          onGenerateReview={handleGenerateAIReview}
        />
      );
    }
    
    if (formData.review_type === "product") {
      return (
        <ProductPromptPageForm
          mode="create"
          initialData={formData}
          onSave={handleServicePageSubmit}
          pageTitle="Create product prompt page"
          supabase={supabase}
          businessProfile={businessProfile}
          accountId={currentUser?.id || ""}
          isLoading={isSaving}
          error={saveError}
          successMessage={saveSuccess}
          campaignType={formData.campaign_type || 'individual'}
          onGenerateReview={handleGenerateAIReview}
        />
      );
    }
    
    if (formData.review_type === "photo") {
      return (
        <PhotoPromptPageForm
          mode="create"
          initialData={formData}
          onSave={handleServicePageSubmit}
          pageTitle="Photo + Testimonial"
          supabase={supabase}
          businessProfile={businessProfile}
          isLoading={isSaving}
          onPublishSuccess={(slug) => {
            setSavedPromptPageUrl(`/r/${slug}`);
            localStorage.setItem(
              "showPostSaveModal",
              JSON.stringify({ 
                url: `/r/${slug}`,
                first_name: formData.first_name,
                phone: formData.phone,
                email: formData.email
              }),
            );
            router.push("/prompt-pages");
          }}
          campaignType={formData.campaign_type || 'individual'}
          onGenerateReview={handleGenerateAIReview}
        />
      );
    }
    
    if (formData.review_type === "employee") {
      return (
        <EmployeePromptPageForm
          mode="create"
          initialData={formData}
          onSave={handleServicePageSubmit}
          pageTitle="Employee Spotlight"
          supabase={supabase}
          businessProfile={businessProfile}
          onPublishSuccess={(slug) => {
            setSavedPromptPageUrl(`/r/${slug}`);
            localStorage.setItem(
              "showPostSaveModal",
              JSON.stringify({ 
                url: `/r/${slug}`,
                first_name: formData.first_name,
                phone: formData.phone,
                email: formData.email
              }),
            );
            router.push("/prompt-pages");
          }}
          campaignType={formData.campaign_type || 'individual'}
          onGenerateReview={handleGenerateAIReview}
        />
      );
    }
    
    if (formData.review_type === "event") {
      return (
        <EventPromptPageForm
          mode="create"
          initialData={formData}
          onSave={handleServicePageSubmit}
          pageTitle="Event Review Page"
          supabase={supabase}
          businessProfile={businessProfile}
          onPublishSuccess={(slug) => {
            setSavedPromptPageUrl(`/r/${slug}`);
            localStorage.setItem(
              "showPostSaveModal",
              JSON.stringify({ 
                url: `/r/${slug}`,
                first_name: formData.first_name,
                phone: formData.phone,
                email: formData.email
              }),
            );
            router.push("/prompt-pages");
          }}
          campaignType={formData.campaign_type || 'individual'}
          onGenerateReview={handleGenerateAIReview}
        />
      );
    }
    
    // Fallback for when no type is selected
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
          {isLoadingBusinessProfile ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-blue"></div>
                <p className="mt-4 text-gray-600">Loading business profile...</p>
              </div>
            </div>
          ) : (
            getFormComponent()
          )}
        </PageCard>
      </div>
    </>
  );
}
