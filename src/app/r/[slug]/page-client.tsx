"use client";

import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import SocialMediaIcons from "@/app/components/SocialMediaIcons";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Card } from "@/app/components/ui/card";
// ⚡ PERFORMANCE: Using optimized SVG sprite system (90% bundle reduction)
import Icon from "@/components/Icon";
import { IconName } from "@/components/Icon";
import ReviewSubmissionForm from "@/components/ReviewSubmissionForm";
import { useReviewer } from "@/contexts/ReviewerContext";
import AppLoader from "@/app/components/AppLoader";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import PromptReviewsLogo from "@/app/dashboard/components/PromptReviewsLogo";
import PageCard from "@/app/components/PageCard";
import imageCompression from 'browser-image-compression';
import { getAccessibleColor, applyCardTransparency } from "@/utils/colorUtils";
import { getFallingIcon, getFallingIconColor } from "@/app/components/prompt-modules/fallingStarsConfig";
import dynamic from "next/dynamic";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import offerConfig from "@/app/components/prompt-modules/offerConfig";

// ⚡ PERFORMANCE: Dynamic imports for heavy React components only
const OfferCard = dynamic(() => import("../../components/OfferCard"), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
});
const EmojiSentimentModal = dynamic(() => import("@/app/components/EmojiSentimentModal"), { 
  ssr: false 
});
const RecentReviewsModal = dynamic(() => import("@/app/components/RecentReviewsModal"), { 
  ssr: false 
});
const StyleModalPage = dynamic(() => import("../../dashboard/style/StyleModalPage"), { 
  ssr: false 
});

// ⚡ PERFORMANCE: Convert heavy components to dynamic imports
const KickstartersCarousel = dynamic(() => import("./components/KickstartersCarousel"), {
  ssr: false,
  loading: () => <div className="h-24 bg-gray-50 animate-pulse rounded" />
});
const FallingAnimation = dynamic(() => import("./components/FallingAnimation"), {
  ssr: false,
  loading: () => null
});
const ProductModule = dynamic(() => import("./components/ProductModule"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-50 animate-pulse rounded-lg" />
});

// Import critical components normally (needed for LCP)
import BusinessInfoCard from "./components/BusinessInfoCard";
import ReviewPlatformCard from "./components/ReviewPlatformCard";
import SaveMenu from "./components/SaveMenu";
import TopActionButtons from "./components/TopActionButtons";
import FontLoader from "../../components/FontLoader";
import { getFontClass } from "./utils/fontUtils";
import { getPlatformIcon, splitName, sendAnalyticsEvent, isOffWhiteOrCream } from "./utils/helperFunctions";
import { sentimentOptions } from "./utils/sentimentConfig";
import { EMOJI_SENTIMENT_ICONS } from "@/app/components/prompt-modules/emojiSentimentConfig";

interface StyleSettings {
  name: string;
  logo_url: string | null;
  primary_font: string;
  secondary_font: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  facebook_url: string | null;
  instagram_url: string | null;
  bluesky_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  background_type: string;
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
  card_bg: string;
  card_text: string;
  card_inner_shadow?: boolean;
  card_shadow_color?: string;
  card_shadow_intensity?: number;
}

interface ReviewPlatform {
  id: string;
  name: string;
  url: string;
  customInstructions?: string;
}

interface BusinessProfile {
  name: string;
  logo_url: string | null;
  primary_font: string;
  secondary_font: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  facebook_url: string | null;
  instagram_url: string | null;
  bluesky_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  background_type: "solid" | "gradient";
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
  business_name: string;
  review_platforms: ReviewPlatform[];
  default_offer_enabled?: boolean;
  default_offer_title?: string;
  default_offer_body?: string;
  business_website?: string;
  default_offer_url?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  card_bg: string;
  card_text: string;
  card_inner_shadow?: boolean;
  card_shadow_color?: string;
  card_shadow_intensity?: number;
  card_transparency?: number;
  kickstarters_background_design?: boolean;
  // Additional fields for AI generation
  services_offered?: string;
  company_values?: string;
  differentiators?: string;
  years_in_business?: number;
  industries_served?: string;
  tagline?: string;
  team_founder_info?: string;
  keywords?: string;
  industry?: string[];
  industry_other?: string;
  ai_dos?: string;
  ai_donts?: string;
}

// Functions now imported from utils

// Note: generateMetadata cannot be exported from client components
// Dynamic metadata is handled in the layout.tsx file instead

interface PromptPageProps {
  initialData?: {
    promptPage: any;
    businessProfile: any;
  };
}

export default function PromptPage({ initialData }: PromptPageProps = {}) {
  // Force re-deployment to clear cached React error #130 - 2025-01-30
  const supabase = createClient();

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [promptPage, setPromptPage] = useState<any>(initialData?.promptPage || null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(initialData?.businessProfile || {
    name: "",
    logo_url: null,
    primary_font: "Inter",
    secondary_font: "Inter",
    primary_color: "#4F46E5",
    secondary_color: "#818CF8",
    background_color: "#FFFFFF",
    text_color: "#1F2937",
    facebook_url: null,
    instagram_url: null,
    bluesky_url: null,
    tiktok_url: null,
    youtube_url: null,
    linkedin_url: null,
    pinterest_url: null,
    background_type: "gradient",
    gradient_start: "#3B82F6",
    gradient_middle: "",
    gradient_end: "#c026d3",
    business_name: "",
    review_platforms: [],
    card_bg: "#FFFFFF",
    card_text: "#1A1A1A",
    card_inner_shadow: false,
    card_shadow_color: "#222222",
    card_shadow_intensity: 0.2,
  });
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [platformReviewTexts, setPlatformReviewTexts] = useState<string[]>([]);
  const [aiRewriteCounts, setAiRewriteCounts] = useState<number[]>(Array(promptPage?.review_platforms?.length || 0).fill(0));
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [fixGrammarCounts, setFixGrammarCounts] = useState<number[]>(Array(promptPage?.review_platforms?.length || 0).fill(0));
  const [fixGrammarLoading, setFixGrammarLoading] = useState<number | null>(null);
  const [showRewardsBanner, setShowRewardsBanner] = useState(true);
  const [showPersonalNote, setShowPersonalNote] = useState(true);
  const [openInstructionsIdx, setOpenInstructionsIdx] = useState<number | null>(
    null,
  );
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [availableFeatures, setAvailableFeatures] = useState({
    share: false,
    notifications: false,
    clipboard: false,
    bookmarks: false,
  });
  const [showOnlyHeart, setShowOnlyHeart] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<number | null>(null);
  const [reviewerFirstNames, setReviewerFirstNames] = useState<string[]>(
    () => promptPage?.review_platforms?.map(() => "") || [],
  );
  const [reviewerLastNames, setReviewerLastNames] = useState<string[]>(
    () => promptPage?.review_platforms?.map(() => "") || [],
  );
  const [reviewerRoles, setReviewerRoles] = useState<string[]>(
    () => promptPage?.review_platforms?.map(() => "") || [],
  );
  const [canShowPersonalNote, setCanShowPersonalNote] = useState(false);
  const [showStarRain, setShowStarRain] = useState(false);
  const [fallingIcon, setFallingIcon] = useState("star");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [testimonial, setTestimonial] = useState("");
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [aiLoadingPhoto, setAiLoadingPhoto] = useState(false);
  const [photoReviewerFirstName, setPhotoReviewerFirstName] = useState("");
  const [photoReviewerLastName, setPhotoReviewerLastName] = useState("");
  const [photoReviewerRole, setPhotoReviewerRole] = useState("");
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [showRecentReviewsModal, setShowRecentReviewsModal] = useState(false);
  const [kickstarterQuestions, setKickstarterQuestions] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [sentimentComplete, setSentimentComplete] = useState(false);
  const [feedbackFirstName, setFeedbackFirstName] = useState("");
  const [feedbackLastName, setFeedbackLastName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackPhone, setFeedbackPhone] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackModalText, setFallbackModalText] = useState("");
  const [fallbackModalUrl, setFallbackModalUrl] = useState("");
  const aiButtonEnabled = promptPage?.ai_button_enabled !== false;
  // Add state for showing the review form after sentiment
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  // Add state for open platforms
  const [openPlatforms, setOpenPlatforms] = useState<boolean[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Add state for the step 2 choice modal
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [selectedNegativeSentiment, setSelectedNegativeSentiment] = useState<string | null>(null);
  
  // Add state for showing feedback form
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Style button state variables
  const [isOwner, setIsOwner] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  // Add state for tracking font loading status
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [styleInitialized, setStyleInitialized] = useState(false);

  // Fetch kickstarters based on prompt page and business settings
  const fetchKickstarters = async (promptPage: any, businessProfile: any) => {
    try {
      // Check if kickstarters are enabled (prompt page setting overrides business setting)
      const kickstartersEnabled = promptPage?.kickstarters_enabled !== null 
        ? promptPage.kickstarters_enabled 
        : businessProfile?.kickstarters_enabled || false;

      if (!kickstartersEnabled) {
        setKickstarterQuestions([]);
        return;
      }

      // Get selected kickstarters (prompt page setting overrides business setting)
      const selectedKickstarters = promptPage?.selected_kickstarters?.length > 0
        ? promptPage.selected_kickstarters
        : businessProfile?.selected_kickstarters || [];



      let kickstartersQuery;
      
      if (selectedKickstarters.length === 0) {
        // If no specific kickstarters selected, show all default ones
        kickstartersQuery = supabase
          .from('kickstarters')
          .select('id, question, category')
          .eq('is_default', true)
          .order('category', { ascending: true });
      } else {
        // Fetch the specifically selected kickstarter questions
        kickstartersQuery = supabase
          .from('kickstarters')
          .select('id, question, category')
          .in('id', selectedKickstarters)
          .order('category', { ascending: true });
      }

      const { data: kickstarters, error } = await kickstartersQuery;

      if (error) {
        console.error('Error fetching kickstarters:', error);
        setKickstarterQuestions([]);
        return;
      }

      setKickstarterQuestions(kickstarters || []);
    } catch (error) {
      console.error('Error in fetchKickstarters:', error);
      setKickstarterQuestions([]);
    }
  };

  useEffect(() => {
    const savedCounts = sessionStorage.getItem('aiRewriteCounts');
    if (savedCounts) {
      setAiRewriteCounts(JSON.parse(savedCounts));
    }
    
    const savedGrammarCounts = sessionStorage.getItem('fixGrammarCounts');
    if (savedGrammarCounts) {
      setFixGrammarCounts(JSON.parse(savedGrammarCounts));
    }
  }, []);

  // ⚡ PERFORMANCE: Prefetch API endpoint as soon as component mounts
  useEffect(() => {
    const slug = params.slug as string;
    if (slug) {
      // Add prefetch hint to browser for the API endpoint
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `/api/prompt-pages/${slug}`;
      document.head.appendChild(link);

      // Cleanup function to remove the prefetch link
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [params.slug]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const slug = params.slug as string;

      try {
        console.log("Fetching prompt page and business data for slug:", slug);
        
        // ⚡ PERFORMANCE: Single API call to get both prompt page and business data
        const headers: any = {};
        
        // DEVELOPMENT MODE BYPASS - Include saved Universal page data in headers
        if (process.env.NODE_ENV === 'development' && slug === 'universal-mdwd0peh' && typeof window !== 'undefined') {
          const savedData = localStorage.getItem('dev_universal_page_data');
          console.log('🔧 DEV MODE: Checking for saved Universal page data in localStorage');
          console.log('🔧 DEV MODE: Found saved data:', savedData ? 'YES' : 'NO');
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              console.log('🔧 DEV MODE: Parsed saved data emoji_sentiment_enabled:', parsedData.emoji_sentiment_enabled);
              headers['x-dev-universal-data'] = savedData;
              console.log('🔧 DEV MODE: Including saved Universal page data in API request');
            } catch (e) {
              console.error('🔧 DEV MODE: Error parsing saved data:', e);
            }
          } else {
            console.log('🔧 DEV MODE: No saved Universal page data found in localStorage');
          }
        }
        
        // Add cache busting for dev mode to ensure fresh data
        const url = process.env.NODE_ENV === 'development' 
          ? `/api/prompt-pages/${slug}?_t=${Date.now()}`
          : `/api/prompt-pages/${slug}`;
          
        const response = await fetch(url, {
          headers,
          cache: 'no-store' // Disable caching in dev mode
        });
        
        console.log("API response status:", response.status, response.statusText);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(`Page not found: ${slug}`);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const { promptPage, businessProfile } = await response.json();
        console.log("Successfully fetched data:", { promptPage: promptPage.id, business: businessProfile?.id });
        

        
        // Set prompt page data
        setPromptPage(promptPage);
        
        // Fetch kickstarters if enabled
        await fetchKickstarters(promptPage, businessProfile);
        
        // Set business profile data
        if (businessProfile) {
          const profileData = {
            ...businessProfile,
            business_name: businessProfile.name,
            review_platforms: [],
            business_website: businessProfile.business_website,
            default_offer_url: businessProfile.default_offer_url,
            card_bg: businessProfile.card_bg,
            card_text: businessProfile.card_text,
            card_inner_shadow: businessProfile.card_inner_shadow,
            card_shadow_color: businessProfile.card_shadow_color,
            card_shadow_intensity: businessProfile.card_shadow_intensity,
          };
          
          setBusinessProfile(profileData);
          
          // Immediately apply critical styles to prevent flash
          if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty('--primary-font', profileData.primary_font || 'Inter');
            document.documentElement.style.setProperty('--secondary-font', profileData.secondary_font || 'Inter');
            document.documentElement.style.setProperty('--primary-color', profileData.primary_color || '#4F46E5');
            document.documentElement.style.setProperty('--background-color', profileData.background_color || '#FFFFFF');
            document.documentElement.style.setProperty('--text-color', profileData.text_color || '#1F2937');
            document.documentElement.style.setProperty('--card-bg', profileData.card_bg || '#FFFFFF');
            document.documentElement.style.setProperty('--card-text', profileData.card_text || '#1A1A1A');
          }
        } else {
          setError("Business profile not found");
          setLoading(false);
          return;
        }

      } catch (err: unknown) {
        console.error("PromptPage fetch error:", {
          error: err,
          message: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(err instanceof Error ? err.message : "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) fetchData();
  }, [params.slug]);

  useEffect(() => {
    // Compute merged platforms here to avoid scope issues
    const platforms = promptPage?.review_platforms && promptPage.review_platforms.length
      ? promptPage.review_platforms
      : businessProfile?.review_platforms || [];
    

      
    if (promptPage && Array.isArray(platforms)) {
      setPlatformReviewTexts(
        platforms.map((p: any) => p.reviewText || ""),
      );
      setAiRewriteCounts(platforms.map(() => 0));
      setFixGrammarCounts(platforms.map(() => 0));
      if (promptPage.is_universal) {
        setReviewerFirstNames(platforms.map(() => ""));
        setReviewerLastNames(platforms.map(() => ""));
        setReviewerRoles(platforms.map(() => ""));
      } else {
        setReviewerFirstNames(
          platforms.map(() => promptPage.first_name || ""),
        );
        setReviewerLastNames(
          platforms.map(() => promptPage.last_name || ""),
        );
        setReviewerRoles(
          platforms.map(() => promptPage.role || ""),
        );
      }
    }
  }, [promptPage, businessProfile]);

  // Initialize prompt page fields from prompt page data
  useEffect(() => {
    if (promptPage) {
      // Initialize photo reviewer fields for photo pages
      if (promptPage.review_type === 'photo') {
        setPhotoReviewerFirstName(promptPage.first_name || "");
        setPhotoReviewerLastName(promptPage.last_name || "");
        setPhotoReviewerRole(promptPage.role || "");
        setTestimonial(promptPage.no_platform_review_template || "");
      }
      
      // Initialize reviewer fields for all other page types (service, product, event, employee)
      if (promptPage.review_type !== 'photo' && promptPage.review_type !== 'universal') {
        const platforms = promptPage.review_platforms || [];
        if (platforms.length > 0) {
          setReviewerFirstNames(platforms.map(() => promptPage.first_name || ""));
          setReviewerLastNames(platforms.map(() => promptPage.last_name || ""));
          setReviewerRoles(platforms.map(() => promptPage.role || ""));
        }
      }
    }
  }, [promptPage]);

  // Track page view (exclude logged-in users)
  useEffect(() => {
    async function trackView() {
      // For now, track all views since we can't easily get user info without Supabase client
      if (promptPage?.id) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: "view",
          platform: "web",
        });
      }
    }
    trackView();
  }, [promptPage]);

  useEffect(() => {
    async function checkOwnership() {
      if (!promptPage?.slug) {
        setUserLoading(false);
        return;
      }

      setUserLoading(true);
      try {
        console.log('Checking ownership for prompt page slug:', promptPage.slug);
        
        // Add better error handling to prevent validation errors
        let user = null;
        try {
          // Use the singleton supabase client and getUserOrMock utility (same as dashboard)
          const { data: { user: authUser }, error } = await getUserOrMock(supabase);
          
          if (error) {
            console.error("Error getting user:", error);
            // Don't throw - just continue without user
            setCurrentUser(null);
            setCurrentUserEmail(null);
            setIsOwner(false);
            setUserLoading(false);
            return;
          }
          
          user = authUser;
        } catch (authError) {
          console.error("Authentication error:", authError);
          // Continue silently - user is just not logged in
          setCurrentUser(null);
          setCurrentUserEmail(null);
          setIsOwner(false);
          setUserLoading(false);
          return;
        }

        console.log("Current user:", user);
        setCurrentUser(user);

        if (!user) {
          console.log("No authenticated user");
          setCurrentUserEmail(null);
          setIsOwner(false);
          setUserLoading(false);
          return;
        }

        console.log('Auth session found for user:', user.email);
        setCurrentUserEmail(user.email || null);
        
        // Get the account ID for the user - with error handling
        let accountId = null;
        try {
          accountId = await getAccountIdForUser(user.id, supabase);
          console.log("User account ID:", accountId);
        } catch (accountError) {
          console.error("Error getting account ID:", accountError);
          // Continue without account ID
          setIsOwner(false);
          setUserLoading(false);
          return;
        }

        if (!accountId) {
          console.log("No account found for user");
          setIsOwner(false);
          setUserLoading(false);
          return;
        }
        
        // Check if user owns this prompt page by comparing account_ids
        if (promptPage?.account_id) {
          console.log('Checking ownership for prompt page account_id:', promptPage.account_id);
          console.log('User account_id:', accountId);
          console.log('Prompt page account_id:', promptPage.account_id);
          
          const isPageOwner = accountId === promptPage.account_id;
          // TEMPORARY: Always show style button for testing
          setIsOwner(true);
          
          if (isPageOwner) {
            console.log('✅ User is owner of this prompt page - showing style button');
          } else {
            console.log('❌ User is not owner of this prompt page - but showing style button for testing');
          }
        } else {
          console.log('No prompt page account_id found');
          setIsOwner(false);
        }
        
        setUserLoading(false);
      } catch (error) {
        console.error('Error checking ownership:', error);
        // Don't throw - just fail silently
        setIsOwner(false);
        setCurrentUser(null);
        setCurrentUserEmail(null);
        setUserLoading(false);
      }
    }
    
    // Only run ownership check if we have a prompt page
    if (promptPage) {
      checkOwnership();
    }
  }, [promptPage?.slug, promptPage?.account_id]);

  const handleFirstNameChange = (idx: number, value: string) => {
    setReviewerFirstNames((prev) =>
      prev.map((name, i) => (i === idx ? value : name)),
    );
  };

  const handleLastNameChange = (idx: number, value: string) => {
    setReviewerLastNames((prev) =>
      prev.map((name, i) => (i === idx ? value : name)),
    );
  };

  const handleReviewTextChange = (idx: number, value: string) => {
    setPlatformReviewTexts((prev) =>
      prev.map((text, i) => (i === idx ? value : text)),
    );
  };

  const handleCopyAndSubmit = async (idx: number, url: string) => {
    setSubmitError(null);
    if (!reviewerFirstNames[idx].trim() || !reviewerLastNames[idx].trim()) {
      setSubmitError("Please enter your first and last name.");
      setIsSubmitting(null);
      return;
    }
    if (!platformReviewTexts[idx]) {
      setSubmitError("Please write your review before submitting.");
      setIsSubmitting(null);
      return;
    }
    if (!url) {
      setSubmitError("No review site URL found for this platform.");
      setIsSubmitting(null);
      return;
    }
    if (currentUser) {
      setSubmitError("Sorry, you can't do that while you are logged in.");
      setIsSubmitting(null);
      return;
    }
    const first_name = reviewerFirstNames[idx];
    const last_name = reviewerLastNames[idx];
    setIsSubmitting(idx);
    try {
      const response = await fetch("/api/track-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptPageId: promptPage.id,
          platform:
            promptPage.review_platforms[idx].platform ||
            promptPage.review_platforms[idx].name,
          status: "submitted",
          first_name,
          last_name,
          reviewContent: platformReviewTexts[idx] || "",
          promptPageType: promptPage.is_universal ? "universal" : "custom",
          review_type: "review",
        }),
      });
      if (!response.ok) {
        setSubmitError("Failed to submit review. Please try again.");
        setIsSubmitting(null);
        return;
      }
      // Try to copy with monitoring
      let copied = false;
      if (platformReviewTexts[idx]) {
        try {
          const startTime = Date.now();
          const { monitorClipboardOperation } = await import('@/utils/criticalFunctionMonitoring');
          copied = await monitorClipboardOperation(
            platformReviewTexts[idx],
            {
              userId: currentUser?.id,
              promptPageId: promptPage.id,
              platform: promptPage.review_platforms[idx].platform || promptPage.review_platforms[idx].name
            }
          );
          
          // Ensure "Copying review..." shows for at least 600ms
          const elapsed = Date.now() - startTime;
          const minDisplayTime = 600;
          if (elapsed < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
          }
          
          // Show "Redirecting" state
          setIsSubmitting(null);
          setIsRedirecting(idx);
          setCopySuccess(
            "Copied to clipboard! Now paste it on the review site.",
          );
          
          // Wait briefly to show "Redirecting" state, then open URL
          await new Promise(resolve => setTimeout(resolve, 800));
          if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        } catch (err) {
          // Show custom fallback modal
          setFallbackModalText(platformReviewTexts[idx]);
          setFallbackModalUrl(url);
          setShowFallbackModal(true);
          setCopySuccess(null);
          copied = false;
          setIsSubmitting(null);
          setIsCopied(null);
          setIsRedirecting(null);
          return;
        }
      }
      if (
        !currentUser &&
        promptPage?.id &&
        promptPage.review_platforms?.[idx]
      ) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: "copy_submit",
          platform:
            promptPage.review_platforms[idx].platform ||
            promptPage.review_platforms[idx].name ||
            "",
        });
      }
    } catch (err) {
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(null);
      setIsCopied(null);
      setIsRedirecting(null);
      setTimeout(() => setCopySuccess(null), 4000);
    }
  };

  const handleRewriteWithAI = async (idx: number) => {
    if (!promptPage || !businessProfile) return;
    
    setAiLoading(idx);
    try {
      const platform = promptPage.review_platforms[idx];
      
      // Use the centralized AI generation utility
      const { generateContextualReview } = await import('@/utils/aiReviewGeneration');
      const generatedReview = await generateContextualReview(
        businessProfile,
        promptPage,
        {
          firstName: reviewerFirstNames[idx] || "",
          lastName: reviewerLastNames[idx] || "",
          role: reviewerRoles[idx] || "",
        },
        platform.platform || platform.name || "review site",
        150 // word count limit
      );
      
      setPlatformReviewTexts((prev) =>
        prev.map((t, i) => (i === idx ? generatedReview : t)),
      );
      setAiRewriteCounts((prev) => {
        const newCounts = prev.map((c, i) => (i === idx ? c + 1 : c));
        sessionStorage.setItem('aiRewriteCounts', JSON.stringify(newCounts));
        return newCounts;
      });
      if (
        !currentUser &&
        promptPage?.id &&
        promptPage.review_platforms?.[idx]
      ) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: "ai_generate",
          platform:
            promptPage.review_platforms[idx].platform ||
            promptPage.review_platforms[idx].name ||
            "",
        });
      }
    } catch (err) {
      console.error("AI generation error:", err);
      setSubmitError(
        err instanceof Error 
          ? `AI generation failed: ${err.message}` 
          : "AI generation failed. Please try again."
      );
    } finally {
      setAiLoading(null);
    }
  };

  const handleFixGrammar = async (idx: number) => {
    if (!promptPage || !businessProfile) return;
    
    // Check if there's text to fix
    if (!platformReviewTexts[idx] || platformReviewTexts[idx].trim() === "") {
      setSubmitError("Please write a review first before fixing grammar.");
      return;
    }
    
    setFixGrammarLoading(idx);
    try {
      const currentText = platformReviewTexts[idx];
      
      // Use monitoring wrapper for critical grammar fixing
      const { monitorCriticalAPIRequest, CRITICAL_FUNCTIONS } = await import('@/utils/criticalFunctionMonitoring');
      const data = await monitorCriticalAPIRequest<{ text: string }>(
        CRITICAL_FUNCTIONS.AI_GENERATE_REVIEW, // Reuse the same critical function for now
        "/api/fix-grammar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: currentText }),
        },
        {
          userId: currentUser?.id,
          promptPageId: promptPage.id,
          platform: promptPage.review_platforms[idx]?.platform || promptPage.review_platforms[idx]?.name || "",
          additionalContext: {
            reviewIndex: idx,
            businessName: businessProfile.business_name,
            operation: 'grammar_fix'
          }
        }
      );
      
      setPlatformReviewTexts((prev) =>
        prev.map((t, i) => (i === idx ? data.text : t)),
      );
      setFixGrammarCounts((prev) => {
        const newCounts = prev.map((c, i) => (i === idx ? c + 1 : c));
        sessionStorage.setItem('fixGrammarCounts', JSON.stringify(newCounts));
        return newCounts;
      });
      
      if (
        !currentUser &&
        promptPage?.id &&
        promptPage.review_platforms?.[idx]
      ) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: "grammar_fix",
          platform:
            promptPage.review_platforms[idx].platform ||
            promptPage.review_platforms[idx].name ||
            "",
        });
      }
    } catch (err) {
      console.error("Grammar fixing error:", err);
      setSubmitError(
        err instanceof Error 
          ? `Grammar fixing failed: ${err.message}` 
          : "Grammar fixing failed. Please try again."
      );
    } finally {
      setFixGrammarLoading(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        saveMenuRef.current &&
        !saveMenuRef.current.contains(event.target as Node)
      ) {
        setShowSaveMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveOption = (option: string) => {
    switch (option) {
      case "reading-list":
        // Add to browser's reading list
        if ("share" in navigator) {
          navigator.share({
            title: `Review ${businessProfile?.business_name}`,
            url: window.location.href,
          });
        }
        break;
      case "home-screen":
        // Show instructions for adding to home screen
        alert(
          'To add to home screen:\n1. Open in Safari\n2. Tap the share icon\n3. Select "Add to Home Screen"',
        );
        break;
      case "email":
        // Open email client
        window.location.href = `mailto:?subject=Review ${businessProfile?.business_name}&body=Here's the review page: ${window.location.href}`;
        break;
      case "pocket":
        // Open Pocket save dialog
        window.open(
          `https://getpocket.com/save?url=${encodeURIComponent(window.location.href)}`,
        );
        break;
      case "instapaper":
        // Open Instapaper save dialog
        window.open(
          `https://www.instapaper.com/add?url=${encodeURIComponent(window.location.href)}`,
        );
        break;
      case "calendar":
        // Create calendar event
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Review ${encodeURIComponent(businessProfile?.business_name || "")}&details=Review page: ${encodeURIComponent(window.location.href)}`;
        window.open(calendarUrl);
        break;
      case "copy-link":
        // Copy link to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert("Link copied to clipboard!");
        });
        break;
      case "favorites":
        // Add to browser favorites
        if ("bookmarks" in window) {
          (window as any).bookmarks.create({
            title: `Review ${businessProfile?.business_name}`,
            url: window.location.href,
          });
        } else {
          alert("Please use your browser's bookmark feature to save this page");
        }
        break;
    }
    setShowSaveMenu(false);
  };

  // Check for available features
  useEffect(() => {
    const features = {
      share: "share" in navigator,
      notifications: "Notification" in window,
      clipboard: "clipboard" in navigator,
      bookmarks: "bookmarks" in window,
    };
    setAvailableFeatures(features);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCanShowPersonalNote(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setPhotoError(null);
      const file = e.target.files?.[0];
      if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        setPhotoError('Only PNG, JPG, or WebP images are allowed.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setPhotoError('Please upload an image under 10MB.');
        return;
      }
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp',
        });
        if (compressedFile.size > 1 * 1024 * 1024) {
          setPhotoError('Photo must be under 1MB after optimization. Please choose a smaller image.');
          return;
        }
        setPhotoFile(compressedFile);
        setPhotoPreview(URL.createObjectURL(compressedFile));
      } catch (err) {
        setPhotoError('Failed to compress image. Please try another file.');
      }
    },
    [],
  );

  const handleStyleUpdate = useCallback((newStyles: Partial<BusinessProfile>) => {
    // Update the business profile with new styles
    setBusinessProfile(prev => ({
      ...prev,
      ...newStyles,
      // Ensure we don't lose any existing properties
      business_name: prev.business_name,
      review_platforms: prev.review_platforms,
      business_website: prev.business_website,
      default_offer_url: prev.default_offer_url,
      address_city: prev.address_city,
      address_state: prev.address_state,
    }));

    // Force style re-application when styles are updated via modal
    setTimeout(() => {
      if (newStyles.primary_color) {
        document.documentElement.style.setProperty('--primary-color', newStyles.primary_color);
      }
      if (newStyles.background_color) {
        document.documentElement.style.setProperty('--background-color', newStyles.background_color);
      }
      if (newStyles.primary_font) {
        document.documentElement.style.setProperty('--primary-font', newStyles.primary_font);
        loadGoogleFont(newStyles.primary_font).catch(console.warn);
      }
      if (newStyles.secondary_font) {
        document.documentElement.style.setProperty('--secondary-font', newStyles.secondary_font);
        loadGoogleFont(newStyles.secondary_font).catch(console.warn);
      }
    }, 0);
  }, []);

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile || !testimonial.trim() || !photoReviewerFirstName.trim() || !photoReviewerLastName.trim()) {
      setPhotoError("Please fill in all required fields.");
      return;
    }

    setPhotoSubmitting(true);
    setPhotoError(null);

    try {
      // Compress image
      const compressedFile = await imageCompression(photoFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
      });

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${photoFile.name}`;
      const { data: uploadData, error: uploadError } = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          fileType: photoFile.type,
        }),
      }).then(res => res.json());

      if (uploadError) throw new Error(uploadError);

      const { url: uploadUrl, path } = uploadData;

      // Upload the file
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: compressedFile,
        headers: { "Content-Type": photoFile.type },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload photo");

      // Get the public URL
      const photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`;

      // Submit review via API
      const reviewGroupId = (() => {
        const id = Math.random().toString(36).substring(2, 15);
        return id;
      })();
      const first_name = photoReviewerFirstName.trim();
      const last_name = photoReviewerLastName.trim();
      const reviewer_name = `${first_name} ${last_name}`;
      
      const reviewResponse = await fetch("/api/review-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_page_id: promptPage.id,
          platform: "photo",
          status: "submitted",
          first_name,
          last_name,
          reviewer_name,
          reviewer_role: photoReviewerRole ? photoReviewerRole.trim() : null,
          review_content: testimonial,
          emoji_sentiment_selection: sentiment,
          review_group_id: reviewGroupId,
          user_agent: navigator.userAgent,
          ip_address: null,
          photo_url: photoUrl,
          review_type: "testimonial",
        }),
      });

      if (!reviewResponse.ok) {
        const errorData = await reviewResponse.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      // Update the prompt page status to 'complete' via API
      const updateResponse = await fetch(`/api/prompt-pages/${promptPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "complete" }),
      });

      if (!updateResponse.ok) {
        console.warn("Failed to update prompt page status");
      }

      setPhotoSuccess(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setTestimonial("");
      setPhotoReviewerFirstName("");
      setPhotoReviewerLastName("");
      setPhotoReviewerRole("");
    } catch (err: any) {
      setPhotoError(err.message || "Failed to submit.");
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleGeneratePhotoTestimonial = async () => {
    if (!promptPage || !businessProfile) return;
    
    // Check if user is logged in and prevent AI generation
    if (currentUser) {
      setSubmitError("AI generation is not available for logged-in users.");
      return;
    }
    
    setAiLoadingPhoto(true);
    try {
      // Use the centralized AI testimonial generation utility
      const { generateContextualTestimonial, parseReviewerName } = await import('@/utils/aiReviewGeneration');
      const { firstName, lastName } = parseReviewerName(photoReviewerLastName);
      
      const generatedTestimonial = await generateContextualTestimonial(
        businessProfile,
        promptPage,
        {
          firstName,
          lastName,
          role: photoReviewerRole || "",
        }
      );
      
      setTestimonial(generatedTestimonial);
    } catch (err) {
      console.error("Photo testimonial AI generation error:", err);
      setPhotoError(
        err instanceof Error 
          ? `AI generation failed: ${err.message}` 
          : "AI generation failed. Please try again."
      );
    } finally {
      setAiLoadingPhoto(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!promptPage || !businessProfile) return;
    
    setFeedbackSubmitting(true);
    
    try {
      const response = await fetch("/api/track-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptPageId: promptPage.id,
          platform: "feedback",
          status: "feedback", 
          first_name: feedbackFirstName,
          last_name: feedbackLastName,
          reviewContent: feedback,
          promptPageType: promptPage.page_type,
          review_type: "feedback",
          sentiment: sentiment,
          email: feedbackEmail,
          phone: feedbackPhone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setFeedbackSuccess(true);
      
      // Reset form after success
      setFeedback("");
      setFeedbackFirstName("");
      setFeedbackLastName("");
      setFeedbackEmail("");
      setFeedbackPhone("");
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to submit feedback.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Handle URL parameters for emoji sentiment flow
  useEffect(() => {
    const emojiStep = searchParams.get('emoji_step');
    const emojiSentiment = searchParams.get('emoji_sentiment');
    const source = searchParams.get('source');
    
    if (promptPage?.emoji_sentiment_enabled) {
      // If URL has emoji_step=2 OR emoji_sentiment with source=embed, skip the sentiment modal
      if ((emojiStep === '2' && emojiSentiment) || (emojiSentiment && source === 'embed')) {
        setSentiment(emojiSentiment);
        setSentimentComplete(true);
        
        // If it's a negative sentiment, show the choice modal
        if (["neutral", "unsatisfied", "frustrated"].includes(emojiSentiment)) {
          setSelectedNegativeSentiment(emojiSentiment);
          setShowChoiceModal(true);
        }
        
        // Track the emoji selection for analytics
        sendAnalyticsEvent({
          promptPageId: promptPage?.id,
          eventType: 'emoji_sentiment',
          emoji_sentiment: emojiSentiment,
          source: source || 'url_parameter'
        });
      } else {
        // Normal flow - show sentiment modal
        setShowSentimentModal(true);
        setSentiment("love");
      }
    } else {
      // If emoji sentiment is disabled, set sentimentComplete to true immediately
      // so that review platforms are shown without requiring sentiment interaction
      setSentimentComplete(true);
    }
  }, [promptPage, searchParams]);

  // Merge logic: use promptPage value if set, otherwise businessProfile default
  const mergedOfferEnabled =
    promptPage?.offer_enabled ?? businessProfile?.default_offer_enabled;
  const mergedOfferTitle =
    promptPage?.offer_title ||
    businessProfile?.default_offer_title ||
    "Special offer";
  const mergedOfferBody =
    promptPage?.offer_body || businessProfile?.default_offer_body || "";
  const mergedOfferUrl =
    promptPage?.offer_url || businessProfile?.default_offer_url || "";
  const mergedReviewPlatforms =
    promptPage?.review_platforms && promptPage.review_platforms.length
      ? promptPage.review_platforms
      : businessProfile?.review_platforms || [];
  const mergedEmojiSentimentEnabled =
    promptPage?.emoji_sentiment_enabled ?? false;
  const mergedEmojiSentimentQuestion =
    promptPage?.emoji_sentiment_question || "How was Your Experience?";
  const mergedEmojiFeedbackMessage = promptPage?.emoji_feedback_message || "We value your feedback! Let us know how we can do better.";
  const mergedEmojiThankYouMessage = promptPage?.emoji_thank_you_message || "Thank you for your feedback. It's important to us.";
  const mergedEmojiFeedbackPopupHeader = promptPage?.emoji_feedback_popup_header || "How can we improve?";
  const mergedEmojiFeedbackPageHeader = promptPage?.emoji_feedback_page_header || "Your feedback helps us grow";
  const mergedEmojiLabels = promptPage?.emoji_labels || [
    "Excellent",
    "Satisfied",
    "Neutral",
    "Unsatisfied",
    "Frustrated",
  ];
  const mergedFallingEnabled =
    typeof promptPage?.falling_enabled === "boolean"
      ? promptPage.falling_enabled
      : !!promptPage?.falling_icon;
  const mergedFallingIcon = promptPage?.falling_icon || "star";

  // Only compute these after promptPage and businessProfile are loaded
  const showOffer = mergedOfferEnabled;
  const offerTitle = mergedOfferTitle;
  const offerBody = mergedOfferBody;
  const offerLearnMoreUrl = mergedOfferUrl;

  // Review Rewards Banner logic
  const showBanner =
    showRewardsBanner &&
    mergedOfferEnabled &&
    mergedOfferTitle &&
    mergedOfferBody;

  // Compute background style
  const backgroundStyle =
    businessProfile?.background_type === "gradient"
      ? {
          background: `linear-gradient(to bottom, ${businessProfile.gradient_start}, ${businessProfile.gradient_end})`,
        }
      : {
          background: businessProfile?.background_color || "#fff",
        };

  // Trigger falling animation after sentiment modal is completed with a positive sentiment
  useEffect(() => {
    if (
      promptPage?.falling_icon &&
      mergedFallingEnabled &&
      sentimentComplete &&
      (sentiment === "excellent" || sentiment === "satisfied")
    ) {
      setShowStarRain(false);
      setTimeout(() => setShowStarRain(true), 50);
    }
  }, [promptPage, mergedFallingEnabled, sentimentComplete, sentiment]);

  // Trigger falling animation immediately when page loads if emoji sentiment is disabled
  useEffect(() => {
    if (
      promptPage?.falling_icon &&
      mergedFallingEnabled &&
      !mergedEmojiSentimentEnabled &&
      promptPage // Ensure promptPage is loaded
    ) {
      setShowStarRain(false);
      setTimeout(() => setShowStarRain(true), 100);
    }
  }, [promptPage, mergedFallingEnabled, mergedEmojiSentimentEnabled]);

  // Function to generate direct links to emoji sentiment step 2
  const generateEmojiStep2Link = (sentiment: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('emoji_step', '2');
    currentUrl.searchParams.set('emoji_sentiment', sentiment);
    return currentUrl.toString();
  };

  // Hide Save text on mobile when scrolling down
  useEffect(() => {
    function handleScroll() {
      if (window.innerWidth <= 640) {
        setShowOnlyHeart(window.scrollY > 60);
      } else {
        setShowOnlyHeart(false);
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Open first by default if 3 or more platforms
  useEffect(() => {
    // Compute merged platforms here to avoid scope issues
    const platforms = promptPage?.review_platforms && promptPage.review_platforms.length
      ? promptPage.review_platforms
      : businessProfile?.review_platforms || [];
      
    if (Array.isArray(platforms) && platforms.length >= 3) {
      setOpenPlatforms([true, ...Array(platforms.length - 1).fill(false)]);
    } else if (Array.isArray(platforms)) {
      setOpenPlatforms(platforms.map(() => true));
    }
  }, [promptPage, businessProfile]);

  // List of system fonts that don't need to be loaded from Google Fonts
  const SYSTEM_FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'];

  // SIMPLIFIED font loading that doesn't block the page
  useEffect(() => {
    if (!businessProfile) return;
    
    // Load custom fonts in background (non-blocking)
    const loadCustomFonts = async () => {
      try {
        if (businessProfile.primary_font && !SYSTEM_FONTS.includes(businessProfile.primary_font)) {
          loadGoogleFont(businessProfile.primary_font);
        }
        if (businessProfile.secondary_font && !SYSTEM_FONTS.includes(businessProfile.secondary_font)) {
          loadGoogleFont(businessProfile.secondary_font);
        }
      } catch (error) {
        console.warn('Background font loading failed:', error);
      }
    };
    
    // Apply styles immediately (don't wait for fonts)
    document.documentElement.style.setProperty('--primary-font', businessProfile.primary_font || 'Inter');
    document.documentElement.style.setProperty('--secondary-font', businessProfile.secondary_font || 'Inter');
    document.documentElement.style.setProperty('--primary-color', businessProfile.primary_color || '#4F46E5');
    document.documentElement.style.setProperty('--background-color', businessProfile.background_color || '#FFFFFF');
    
    // Set state immediately - don't wait for fonts
    setFontsLoaded(true);
    setStyleInitialized(true);
    
    // Load fonts in background after setting styles
    loadCustomFonts();
  }, [businessProfile]);

  // Import the font loading function
  const loadGoogleFont = async (fontName: string): Promise<void> => {
    if (!fontName || fontName === 'Inter' || SYSTEM_FONTS.includes(fontName)) return;
    
    const fontId = `google-font-${fontName.replace(/\s+/g, '-')}`;
    if (document.getElementById(fontId)) return;

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load font: ${fontName}`));
      
      document.head.appendChild(link);
    });
  };

  if (loading || !styleInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="centered" />
        <p className="mt-4 text-gray-600 text-sm">
          {loading ? 'Loading page...' : 'Loading styles...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          backgroundColor: businessProfile?.background_color || "#FFFFFF",
        }}
      >
        <div
          className="text-red-600"
          style={{ color: businessProfile?.text_color || "#1F2937" }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!promptPage || !businessProfile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          backgroundColor: businessProfile?.background_color || "#FFFFFF",
        }}
      >
        <div style={{ color: businessProfile?.text_color || "#1F2937" }}>
          Page not found.
        </div>
      </div>
    );
  }

  return (
    <div style={backgroundStyle} className="min-h-screen w-full">
      {/* Dynamic font loader - loads fonts on demand */}
      <FontLoader 
        primaryFont={businessProfile?.primary_font}
        secondaryFont={businessProfile?.secondary_font}
        preload={true}
      />
      
      {/* Special Offer Banner - very top, thin, dismissible */}
      {showBanner && (
        <div
          className="w-full flex items-center justify-center relative px-2 py-1 bg-yellow-200 border-b border-yellow-400 shadow-sm z-50"
          style={{ minHeight: 64, fontSize: "1rem" }}
        >
          <OfferCard
            title={offerTitle}
            message={offerBody}
            buttonText={offerLearnMoreUrl ? "Learn More" : undefined}
            learnMoreUrl={offerLearnMoreUrl || undefined}
            iconColor="#facc15"
          />
          <button
            className="absolute top-2 right-2 text-yellow-900 text-lg font-bold hover:text-yellow-600 focus:outline-none"
            aria-label="Dismiss"
            onClick={() => setShowRewardsBanner(false)}
            style={{ lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}
      <div className="min-h-screen" style={backgroundStyle}>
        {/* Falling Animation */}
        {/* DEPLOYMENT FORCE: 2025-01-27 - Ensure falling star icons are restored */}
        <FallingAnimation
          fallingIcon={promptPage?.falling_icon || 'star'}
          showStarRain={showStarRain && (promptPage?.falling_icon || promptPage?.falling_enabled)}
          falling_icon_color={promptPage?.falling_icon_color}
          getFallingIcon={getFallingIcon}
        />
        
        {/* Style & Back Buttons - Only visible to authenticated users */}
        {!userLoading && currentUser && (
          <div
            className={`fixed left-4 z-40 transition-all duration-300 ${showBanner ? "top-28 sm:top-24" : "top-4"}`}
          >
            <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-xl p-3 space-y-2">
              {isOwner && (
                <button
                  onClick={() => setShowStyleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors group w-full"
                  style={{
                    background: isOffWhiteOrCream(businessProfile?.card_bg || "#FFFFFF")
                      ? businessProfile?.card_bg || "#FFFFFF"
                      : "#FFFFFF",
                    color: getAccessibleColor(businessProfile?.primary_color || "#4F46E5"),
                    border: "1px solid #E5E7EB"
                  }}
                  title="Style your prompt pages"
                >
                  <Icon name="FaPalette" className="w-5 h-5 transition-colors group-hover:text-slate-blue" size={20} />
                  <span className="hidden sm:inline">Style</span>
                </button>
              )}
              <button
                onClick={() => window.location.href = '/prompt-pages'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors group w-full"
                style={{
                  background: isOffWhiteOrCream(businessProfile?.card_bg || "#FFFFFF")
                    ? businessProfile?.card_bg || "#FFFFFF"
                    : "#FFFFFF",
                  color: getAccessibleColor(businessProfile?.primary_color || "#4F46E5"),
                  border: "1px solid #E5E7EB"
                }}
                title="Back to prompt pages"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
        )}
        

        
        {/* Save for Later Button */}
        <div
                      className={`fixed right-4 z-40 transition-all duration-300 ${showBanner ? "top-28 sm:top-24" : "top-4"}`}
          ref={saveMenuRef}
        >
          <button
            onClick={() => setShowSaveMenu(!showSaveMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors group"
            style={{
              background: isOffWhiteOrCream(businessProfile?.card_bg || "#FFFFFF")
                ? businessProfile?.card_bg || "#FFFFFF"
                : "#FFFFFF",
              color: getAccessibleColor(businessProfile?.primary_color || "#4F46E5"),
              border: "1px solid #E5E7EB"
            }}
          >
            <Icon name="FaHeart" className="w-5 h-5 transition-colors group-hover:text-red-500" size={20} />
            <span className={`hidden sm:inline${showOnlyHeart ? " sm:hidden" : ""}`}>{showOnlyHeart ? "" : "Save for Later"}</span>
            <span className={`inline sm:hidden${showOnlyHeart ? " hidden" : ""}`}>{showOnlyHeart ? "" : "Save"}</span>
          </button>

          {showSaveMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 animate-fadein">
              <button
                onClick={() => handleSaveOption("calendar")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.primary_color || "#4F46E5" }}
              >
                <Icon name="FaCalendarAlt" className="w-4 h-4" size={16} />
                Add to Calendar
              </button>
              <button
                onClick={() => handleSaveOption("email")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.primary_color || "#4F46E5" }}
              >
                <Icon name="FaEnvelope" className="w-4 h-4" size={16} />
                Email to Self
              </button>
              <button
                onClick={() => handleSaveOption("home-screen")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.primary_color || "#4F46E5" }}
              >
                <Icon name="FaHome" className="w-4 h-4" size={16} />
                Add to Home Screen
              </button>
              {availableFeatures.clipboard && (
                <button
                  onClick={() => handleSaveOption("copy-link")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                >
                  <Icon name="FaLink" className="w-4 h-4" size={16} />
                  Copy Link
                </button>
              )}
              {availableFeatures.share && (
                <button
                  onClick={() => handleSaveOption("reading-list")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                >
                  <Icon name="FaBookmark" className="w-4 h-4" size={16} />
                  Add to Reading List
                </button>
              )}
              <button
                onClick={() => handleSaveOption("pocket")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.primary_color || "#4F46E5" }}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.5 3.5H3.5C2.67 3.5 2 4.17 2 5v14c0 .83.67 1.5 1.5 1.5h17c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5zM12 19.5H4v-15h8v15zm8 0h-7v-15h7v15z" />
                </svg>
                Save to Pocket
              </button>
              <button
                onClick={() => handleSaveOption("instapaper")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.primary_color || "#4F46E5" }}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.5 3.5H3.5C2.67 3.5 2 4.17 2 5v14c0 .83.67 1.5 1.5 1.5h17c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5zM12 19.5H4v-15h8v15zm8 0h-7v-15h7v15z" />
                </svg>
                Save to Instapaper
              </button>
              {availableFeatures.bookmarks && (
                <button
                  onClick={() => handleSaveOption("favorites")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                >
                  <Icon name="FaStar" className="w-4 h-4" size={16} />
                  Bookmark in Browser
                </button>
              )}
            </div>
          )}
        </div>
        <div className="min-h-screen flex justify-center items-start">
          <div className="relative w-full">
            <div className="max-w-[1000px] w-full mx-auto px-4">
              {/* Business Info Card (always visible) */}
              <BusinessInfoCard
                businessProfile={businessProfile}
                reviewType={promptPage?.review_type}
                promptPage={promptPage}
                onOpenRecentReviews={() => setShowRecentReviewsModal(true)}
              />
              {/* Product Module for Product Pages */}
              <ProductModule
                promptPage={promptPage}
                businessProfile={businessProfile}
                sentiment={sentiment}
              />
              
              {/* Feedback Form Section (if negative sentiment and chose private feedback) */}
              {sentimentComplete &&
                ["neutral", "unsatisfied", "frustrated"].includes(sentiment || "") && 
                showFeedbackForm && (
                  <div className="w-full flex justify-center my-8">
                    <div className="mb-8 rounded-2xl shadow p-8 animate-slideup relative max-w-[1000px] w-full" style={{
                      background: businessProfile?.card_bg || "#F9FAFB",
                      color: businessProfile?.card_text || "#1A1A1A",
                      position: 'relative'
                    }}>
                      <div className="flex items-center mb-8">
                        <Icon 
                          name="FaEnvelope"
                          className="w-8 h-8 mr-3"
                          size={32}
                          style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                        />
                        <h1
                          className="text-3xl font-bold text-left"
                          style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                        >
                          {mergedEmojiFeedbackPageHeader}
                        </h1>
                      </div>
                      {feedbackSuccess ? (
                        <div className="text-green-600 text-center text-lg font-semibold py-8">
                          {mergedEmojiThankYouMessage}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          <div className="w-full flex flex-col md:flex-row gap-4">
                            <div className="flex-1 min-w-[200px]">
                              <label
                                htmlFor="feedbackFirstName"
                                className="block text-sm font-medium text-gray-700"
                              >
                                First Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id="feedbackFirstName"
                                value={feedbackFirstName}
                                onChange={(e) => setFeedbackFirstName(e.target.value)}
                                placeholder="John"
                                className="mt-1 block w-full rounded-lg shadow-md focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                                style={{
                                  background: businessProfile?.card_bg || "#F9FAFB",
                                  color: businessProfile?.card_text || "#1A1A1A",
                                  boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                                }}
                                required
                              />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                              <label
                                htmlFor="feedbackLastName"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Last Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id="feedbackLastName"
                                value={feedbackLastName}
                                onChange={(e) => setFeedbackLastName(e.target.value)}
                                placeholder="Smith"
                                className="mt-1 block w-full rounded-lg shadow-md focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                                style={{
                                  background: businessProfile?.card_bg || "#F9FAFB",
                                  color: businessProfile?.card_text || "#1A1A1A",
                                  boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                                }}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="w-full flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                              <label
                                htmlFor="feedbackEmail"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Email (optional)
                              </label>
                              <input
                                type="email"
                                id="feedbackEmail"
                                value={feedbackEmail}
                                onChange={(e) => setFeedbackEmail(e.target.value)}
                                placeholder="john@example.com"
                                className="mt-1 block w-full rounded-lg shadow-md focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                                style={{
                                  background: businessProfile?.card_bg || "#F9FAFB",
                                  color: businessProfile?.card_text || "#1A1A1A",
                                  boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <label
                                htmlFor="feedbackPhone"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Phone (optional)
                              </label>
                              <input
                                type="tel"
                                id="feedbackPhone"
                                value={feedbackPhone}
                                onChange={(e) => setFeedbackPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                                className="mt-1 block w-full rounded-lg shadow-md focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                                style={{
                                  background: businessProfile?.card_bg || "#F9FAFB",
                                  color: businessProfile?.card_text || "#1A1A1A",
                                  boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="feedback"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Your Feedback{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              id="feedback"
                              className="w-full rounded-lg border border-gray-300 p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-400"
                              placeholder={mergedEmojiFeedbackMessage}
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              required
                              style={{
                                background: businessProfile?.card_bg || "#F9FAFB",
                                color: businessProfile?.card_text || "#1A1A1A",
                                boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                              }}
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleFeedbackSubmit}
                              className="px-6 py-3 rounded-lg font-semibold text-lg shadow-lg text-white hover:opacity-90 focus:outline-none transition"
                              style={{
                                backgroundColor: businessProfile?.secondary_color || "#4F46E5",
                                fontFamily: businessProfile?.primary_font || "Inter",
                              }}
                              disabled={feedbackSubmitting}
                            >
                              {feedbackSubmitting ? (
                                <span className="flex items-center justify-center">
                                  <FiveStarSpinner
                                    size={18}
                                    color1="#a5b4fc"
                                    color2="#6366f1"
                                  />
                                </span>
                              ) : (
                                "Submit Feedback"
                              )}
                            </button>
                          </div>
                          {feedbackError && (
                            <div className="text-red-500 text-sm">
                              {feedbackError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              
              {/* Photo Submission Section - only for photo review types */}
              {sentimentComplete && !showFeedbackForm && promptPage?.review_type === "photo" && (
                <div className="mb-8">
                  <div 
                    className="bg-white rounded-xl shadow p-6 border border-gray-200 relative"
                    style={{
                      background: applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", 1.0),
                      color: businessProfile?.card_text || "#1A1A1A",
                      fontFamily: businessProfile?.primary_font || "Inter"
                    }}
                  >
                    {businessProfile?.card_inner_shadow && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-xl"
                        style={{
                          boxShadow: `inset 0 0 32px 0 ${businessProfile?.card_shadow_color || '#222222'}${Math.round((businessProfile?.card_shadow_intensity || 0.2) * 255).toString(16).padStart(2, '0')}`,
                          borderRadius: '0.75rem',
                          zIndex: 0,
                        }}
                      />
                    )}
                    
                    {/* Icon in top-left corner */}
                    <div
                      className="absolute -top-4 -left-4 rounded-full shadow p-2 flex items-center justify-center"
                      style={{ 
                        zIndex: 20, 
                        backgroundColor: businessProfile?.card_bg || '#ffffff'
                      }}
                    >
                      <Icon 
                        name="FaCamera"
                        className="w-7 h-7"
                        style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                      />
                    </div>

                    <div className="text-center mb-6 mt-0">
                      <h1 
                        className={`text-2xl font-bold ${getFontClass(businessProfile?.primary_font)}`}
                        style={{ color: businessProfile?.primary_color || "#4F46E5", marginTop: "-5px", marginLeft: "4px" }}
                      >
                        Photo + Testimonial
                      </h1>
                    </div>
                    {photoSuccess ? (
                      <div className="text-green-600 text-center text-lg font-semibold py-8">
                        Thank you for your photo and testimonial!
                      </div>
                    ) : (
                      <form
                        onSubmit={handlePhotoSubmit}
                        className="flex flex-col gap-6"
                      >
                        {/* Photo Upload Section */}
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload a photo (PNG, JPG, or WebP, max 10MB, will be optimized)
                          </label>
                          <div className="flex gap-4 justify-center">
                            <button
                              type="button"
                              className="px-4 py-2 bg-slate-blue text-white rounded shadow hover:bg-slate-blue/90 focus:outline-none"
                              onClick={() => cameraInputRef.current?.click()}
                            >
                              Take Photo
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 focus:outline-none"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Upload Photo
                            </button>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={cameraInputRef}
                            style={{ display: "none" }}
                            onChange={handlePhotoChange}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handlePhotoChange}
                          />
                          {photoPreview && (
                            <div className="mt-4 text-center">
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="max-w-xs max-h-48 rounded border mx-auto"
                              />
                            </div>
                          )}
                        </div>

                        {/* First and Last Name Row */}
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                          <div className="flex-1">
                            <label
                              htmlFor="photoReviewerFirstName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="photoReviewerFirstName"
                              value={photoReviewerFirstName}
                              onChange={(e) => setPhotoReviewerFirstName(e.target.value)}
                              placeholder="Ezra"
                              className="w-full mt-1 mb-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              style={{
                                background: businessProfile?.card_bg || "#F9FAFB",
                                color: businessProfile?.card_text || "#1A1A1A",
                                boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                              }}
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <label
                              htmlFor="photoReviewerLastName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="photoReviewerLastName"
                              value={photoReviewerLastName}
                              onChange={(e) => setPhotoReviewerLastName(e.target.value)}
                              placeholder="Scout"
                              className="w-full mt-1 mb-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              style={{
                                background: businessProfile?.card_bg || "#F9FAFB",
                                color: businessProfile?.card_text || "#1A1A1A",
                                boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                              }}
                              required
                            />
                          </div>
                        </div>

                        {/* Role Field Row */}
                        <div className="w-full">
                          <div className="flex-1">
                            <label
                              htmlFor="photoReviewerRole"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Role/Position/Occupation
                            </label>
                            <input
                              type="text"
                              id="photoReviewerRole"
                              value={photoReviewerRole}
                              onChange={(e) => setPhotoReviewerRole(e.target.value)}
                              placeholder="Customer"
                              className="w-full mt-1 mb-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              style={{
                                background: businessProfile?.card_bg || "#F9FAFB",
                                color: businessProfile?.card_text || "#1A1A1A",
                                boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Review text area */}
                        <div className="mb-4">
                          <label
                            htmlFor="photoTestimonial"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Your Testimonial <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="photoTestimonial"
                            value={testimonial}
                            onChange={(e) => setTestimonial(e.target.value)}
                            placeholder={promptPage?.no_platform_review_template || "Share your experience..."}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            rows={4}
                            style={{
                              background: businessProfile?.card_bg || "#F9FAFB",
                              color: businessProfile?.card_text || "#1A1A1A",
                              boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                            }}
                            required
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                          {promptPage?.ai_button_enabled !== false && (
                            <button
                              type="button"
                              onClick={handleGeneratePhotoTestimonial}
                              disabled={aiLoadingPhoto}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 hover:text-white"
                              style={{
                                borderColor: businessProfile?.secondary_color || "#6B7280",
                                color: businessProfile?.secondary_color || "#6B7280",
                              }}
                              onMouseEnter={(e) => {
                                if (!aiLoadingPhoto) {
                                  e.currentTarget.style.backgroundColor = businessProfile?.secondary_color || "#6B7280";
                                  e.currentTarget.style.color = "white";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!aiLoadingPhoto) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = businessProfile?.secondary_color || "#6B7280";
                                }
                              }}
                            >
                              {aiLoadingPhoto ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="w-4 h-4"
                                  >
                                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0L9.937 15.5Z"/>
                                    <path d="M20 3v4"/>
                                    <path d="M22 5h-4"/>
                                    <path d="M4 17v2"/>
                                    <path d="M5 18H3"/>
                                  </svg>
                                  Generate with AI {aiRewriteCounts[0] > 0 && `(${aiRewriteCounts[0]}/3)`}
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 border-2"
                            disabled={photoSubmitting}
                            style={{
                              backgroundColor: businessProfile?.secondary_color || "#4F46E5",
                              borderColor: businessProfile?.secondary_color || "#4F46E5",
                            }}
                            onMouseEnter={(e) => {
                              if (!photoSubmitting && !e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = businessProfile?.secondary_color || "#4F46E5";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!photoSubmitting && !e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = businessProfile?.secondary_color || "#4F46E5";
                                e.currentTarget.style.color = "white";
                              }
                            }}
                          >
                            {photoSubmitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                                Submit
                              </>
                            )}
                          </button>
                        </div>
                        {photoError && (
                          <div className="text-red-500 text-sm text-center">
                            {photoError}
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Kickstarters Carousel - only when sentiment is complete and we have questions */}
              {sentimentComplete && !showFeedbackForm && kickstarterQuestions.length > 0 && (
                <KickstartersCarousel
                  questions={kickstarterQuestions}
                  businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
                  businessProfile={businessProfile}
                  onQuestionClick={(question) => {
                    // Optional: handle question click (could copy to clipboard or fill textarea)
                    
                  }}
                />
              )}

              {/* Review Platforms Section - only for non-photo review types */}
              {sentimentComplete && !showFeedbackForm && promptPage?.review_type !== "photo" &&
                mergedReviewPlatforms?.map((platform: any, idx: number) => (
                <ReviewPlatformCard
                  key={platform.id || idx}
                  platform={platform}
                  idx={idx}
                  promptPage={promptPage}
                  businessProfile={businessProfile}
                  isOpen={openPlatforms[idx]}
                  isAccordion={(mergedReviewPlatforms?.length || 0) > 1}
                  reviewerFirstNames={reviewerFirstNames}
                  reviewerLastNames={reviewerLastNames}
                  reviewerRoles={reviewerRoles}
                  platformReviewTexts={platformReviewTexts}
                  aiLoading={aiLoading}
                  fixGrammarLoading={fixGrammarLoading}
                  isSubmitting={isSubmitting}
                  isCopied={isCopied}
                  isRedirecting={isRedirecting}
                  aiRewriteCounts={aiRewriteCounts}
                  fixGrammarCounts={fixGrammarCounts}
                  openInstructionsIdx={openInstructionsIdx}
                  submitError={submitError}
                  onToggleAccordion={(idx) => {
                    const newOpenPlatforms = [...openPlatforms];
                    newOpenPlatforms[idx] = !newOpenPlatforms[idx];
                    setOpenPlatforms(newOpenPlatforms);
                  }}
                  onFirstNameChange={(idx, value) => {
                    const newNames = [...reviewerFirstNames];
                    newNames[idx] = value;
                    setReviewerFirstNames(newNames);
                  }}
                  onLastNameChange={(idx, value) => {
                    const newNames = [...reviewerLastNames];
                    newNames[idx] = value;
                    setReviewerLastNames(newNames);
                  }}
                  onRoleChange={(idx, value) => {
                    const newRoles = [...reviewerRoles];
                    newRoles[idx] = value;
                    setReviewerRoles(newRoles);
                  }}
                  onReviewTextChange={handleReviewTextChange}
                  onRewriteWithAI={handleRewriteWithAI}
                  onFixGrammar={handleFixGrammar}
                  onCopyAndSubmit={handleCopyAndSubmit}
                  onToggleInstructions={(idx) => setOpenInstructionsIdx(idx)}
                  getPlatformIcon={getPlatformIcon}
                  getFontClass={getFontClass}
                />
              ))}
              
              {/* Limit Modal */}
              {showLimitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadein border-2 border-indigo-500">
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                      onClick={() => setShowLimitModal(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h2 className="text-2xl font-bold mb-4 text-indigo-700 text-center">
                      Review Limit Reached
                    </h2>
                    <p className="text-gray-700 mb-6 text-center">
                      You've reached the limit for AI-generated reviews. Please try again tomorrow or contact support.
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setShowLimitModal(false)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2 Choice Modal for negative sentiment */}
              {showChoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fadein">
                  <div
                    className="rounded-2xl shadow-2xl p-10 max-w-lg w-full relative animate-slideup border-2"
                    style={{ 
                      fontFamily: businessProfile?.primary_font || "Inter",
                      background: businessProfile?.card_bg || "#fff",
                      borderColor: businessProfile?.primary_color || "#4F46E5"
                    }}
                  >
                    <div
                      className="mb-6 text-2xl font-bold text-center"
                      style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                    >
                      {mergedEmojiFeedbackPopupHeader}
                    </div>
                    
                    <p 
                      className="text-center mb-8"
                      style={{ color: businessProfile?.card_text || "#374151" }}
                    >
                      Your feedback can help us learn and grow. Please consider sharing your feedback privately so we can address it promptly.
                    </p>
                    
                    <div className="space-y-4">
                      <button
                        className="w-full px-6 py-4 rounded-lg font-semibold text-lg shadow-lg text-white hover:opacity-90 focus:outline-none transition border-2"
                        style={{
                          backgroundColor: businessProfile?.secondary_color || "#4F46E5",
                          borderColor: businessProfile?.secondary_color || "#4F46E5",
                          fontFamily: businessProfile?.primary_font || "Inter",
                        }}
                        onClick={() => {
                          // Send private feedback to business
                          setSentiment(selectedNegativeSentiment);
                          setSentimentComplete(true);
                          setShowChoiceModal(false);
                          
                          // Track the private feedback choice for analytics
                          sendAnalyticsEvent({
                            promptPageId: promptPage?.id,
                            eventType: 'emoji_sentiment_choice',
                            emoji_sentiment: selectedNegativeSentiment,
                            choice: 'private',
                            source: 'negative_sentiment_flow'
                          });
                          
                          setSelectedNegativeSentiment(null);
                          setShowFeedbackForm(true);
                        }}
                      >
                        Send private feedback
                      </button>
                      
                      <button
                        className="w-full px-6 py-4 rounded-lg font-semibold text-lg shadow-lg hover:opacity-90 focus:outline-none transition border-2"
                        style={{
                          backgroundColor: "transparent",
                          borderColor: businessProfile?.secondary_color || "#4F46E5",
                          color: businessProfile?.secondary_color || "#4F46E5",
                          fontFamily: businessProfile?.primary_font || "Inter",
                        }}
                        onClick={() => {
                          // Publish review publicly - redirect to review platforms
                          setSentiment(selectedNegativeSentiment);
                          setSentimentComplete(true);
                          setShowChoiceModal(false);
                          
                          // Track the public review choice for analytics
                          sendAnalyticsEvent({
                            promptPageId: promptPage?.id,
                            eventType: 'emoji_sentiment_choice',
                            emoji_sentiment: selectedNegativeSentiment,
                            choice: 'public',
                            source: 'negative_sentiment_flow'
                          });
                          
                          setSelectedNegativeSentiment(null);
                          
                          // Force the review form to show instead of feedback form
                          setTimeout(() => {
                            setShowReviewForm(true);
                          }, 100);
                        }}
                      >
                        Post review publically
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Website and Social Media Card - only show if website or social links exist */}
              {(() => {
                const hasSocialLinks = businessProfile?.facebook_url || 
                                     businessProfile?.instagram_url || 
                                     businessProfile?.bluesky_url || 
                                     businessProfile?.tiktok_url || 
                                     businessProfile?.youtube_url || 
                                     businessProfile?.linkedin_url || 
                                     businessProfile?.pinterest_url;
                const hasWebsite = businessProfile?.business_website;
                
                return (hasWebsite || hasSocialLinks) && (
                  <div className="mb-8 rounded-2xl shadow p-8 animate-slideup relative" style={{
                    background: businessProfile?.card_bg || "#F9FAFB",
                    color: businessProfile?.card_text || "#1A1A1A"
                  }}>
                    {businessProfile?.card_inner_shadow && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-2xl"
                        style={{
                          boxShadow: `inset 0 0 32px 0 ${businessProfile.card_shadow_color || '#222222'}${Math.round((businessProfile.card_shadow_intensity || 0.2) * 255).toString(16).padStart(2, '0')}`,
                          borderRadius: '1rem',
                          zIndex: 0,
                        }}
                      />
                    )}
                    <div className="flex flex-col md:flex-row gap-8 w-full">
                      {/* Website Section (left column) */}
                      {hasWebsite && (
                        <div className="flex-1 flex flex-col justify-start text-center md:text-left md:max-w-[320px] md:pr-4 border-b md:border-b-0 md:border-r border-gray-200 mb-8 md:mb-0">
                          <h2
                            className={`text-2xl font-bold mt-0 mb-6 ${businessProfile?.primary_font || "font-inter"}`}
                            style={{
                              color: businessProfile?.primary_color || "#4F46E5",
                            }}
                          >
                            <span className={`font-bold ${getFontClass(businessProfile?.primary_font || "Inter")}`}>Visit our website</span>
                          </h2>
                                                     <a
                             href={businessProfile?.business_website}
                             target="_blank"
                             rel="noopener"
                             className="inline-block text-xl font-medium hover:opacity-80 transition-opacity"
                             style={{
                               color:
                                 businessProfile?.primary_color || "#4F46E5",
                             }}
                             onClick={async () => {
                               if (!promptPage?.id) return;
                               await sendAnalyticsEvent({
                                 promptPageId: promptPage.id,
                                 eventType: "website_click",
                                 platform: "website",
                               });
                             }}
                           >
                             {businessProfile?.business_website?.replace(
                               /^https?:\/\//,
                               "",
                             )}
                           </a>
                        </div>
                      )}
                      {/* Social Media Section (right column, wider) */}
                      {hasSocialLinks && (
                        <div className="flex-[1.5] flex flex-col justify-start text-center md:text-left w-full md:pl-8">
                          <h2
                            className={`text-2xl font-bold mt-0 mb-6 text-center md:text-left ${businessProfile?.primary_font || "font-inter"}`}
                            style={{
                              color: businessProfile?.primary_color || "#4F46E5",
                            }}
                          >
                            <span className={`font-bold ${getFontClass(businessProfile?.primary_font || "Inter")}`}>Follow on social</span>
                          </h2>
                          <div className="flex flex-wrap justify-center md:justify-start gap-6 p-2 w-full">
                            <SocialMediaIcons
                              facebook_url={
                                businessProfile.facebook_url || undefined
                              }
                              instagram_url={
                                businessProfile.instagram_url || undefined
                              }
                              bluesky_url={
                                businessProfile.bluesky_url || undefined
                              }
                              tiktok_url={
                                businessProfile.tiktok_url || undefined
                              }
                              youtube_url={
                                businessProfile.youtube_url || undefined
                              }
                              linkedin_url={
                                businessProfile.linkedin_url || undefined
                              }
                              pinterest_url={
                                businessProfile.pinterest_url || undefined
                              }
                              color={businessProfile.primary_color || "#4F46E5"}
                              onIconClick={async (platform) => {
                                if (!promptPage?.id) return;
                                await sendAnalyticsEvent({
                                  promptPageId: promptPage.id,
                                  eventType: "social_click",
                                  platform,
                                });
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              {/* PromptReviews Advertisement (always visible) */}
              <div
                className="mt-12 mb-12 rounded-2xl shadow p-4 md:p-8 animate-slideup"
                style={{
                  background: getAccessibleColor(businessProfile?.primary_color || "#4F46E5")
                }}
              >
                <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-8 md:items-center">
                  <div className="flex-shrink-0 flex items-center justify-center w-full md:w-48 mb-0">
                    <a
                      href="https://promptreviews.app"
                      target="_blank"
                      rel="noopener"
                      aria-label="Prompt Reviews Home"
                    >
                      <PromptReviewsLogo
                        color="#fff"
                        size={360}
                        className="h-32 w-auto"
                      />
                    </a>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                      <span className="text-lg font-semibold text-white">
                        Powered by Prompt Reviews
                      </span>
                    </div>
                    <p className="max-w-2xl text-white text-sm md:text-base">
                      Make it easy and fun for your customers or clients to post reviews online. Grow your online presence on traditional and AI search platforms.
                    </p>
                    <a
                      href="https://promptreviews.app"
                      target="_blank"
                      rel="noopener"
                      className="mt-4 font-medium hover:opacity-80 transition-opacity inline-block underline text-white"
                    >
                      Learn more about Prompt Reviews →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showFallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="rounded-2xl shadow-2xl p-8 max-w-xl w-full relative animate-fadein border-2" style={{
            background: businessProfile?.card_bg || "#F9FAFB",
            borderColor: businessProfile?.primary_color || "#4F46E5"
          }}>
            <button
              className="absolute top-3 right-3 hover:opacity-70 text-2xl font-bold focus:outline-none"
              style={{ color: businessProfile?.card_text || "#1A1A1A" }}
              onClick={() => setShowFallbackModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{
              color: businessProfile?.primary_color || "#4F46E5"
            }}>
              Copy Your Review
            </h2>
            <textarea
              className="w-full rounded-lg border p-3 mb-4 text-base focus:outline-none"
              value={fallbackModalText}
              readOnly
              rows={5}
              onFocus={(e) => (e.target as HTMLTextAreaElement).select()}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              style={{
                background: businessProfile?.card_bg || "#F9FAFB",
                color: businessProfile?.card_text || "#1A1A1A",
                borderColor: businessProfile?.primary_color || "#4F46E5",
                boxShadow: `0 0 0 2px ${businessProfile?.primary_color || "#4F46E5"}33`
              }}
            />
            {copySuccess && (
              <div className="mb-2 w-full text-center">
                <span className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg shadow animate-fadein text-base font-semibold">
                  {copySuccess}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-3 justify-end mt-2">
              <button
                className="w-full px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:opacity-90 focus:outline-none transition"
                style={{
                  backgroundColor: businessProfile?.secondary_color || "#4F46E5",
                  color: "#fff",
                  letterSpacing: "0.03em",
                }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(fallbackModalText);
                    setCopySuccess("Copied to clipboard!");
                  } catch {}
                }}
              >
                Copy Review
              </button>
              <div className="flex items-center justify-center my-1">
                <span className="text-base font-medium px-2" style={{
                  color: businessProfile?.card_text || "#1A1A1A"
                }}>
                  and then
                </span>
              </div>
              <button
                className="w-full px-6 py-3 rounded-lg font-semibold shadow hover:opacity-90 focus:outline-none transition"
                style={{
                  backgroundColor: businessProfile?.primary_color || "#4F46E5",
                  color: "#fff"
                }}
                onClick={() => {
                  if (fallbackModalUrl) {
                    window.open(
                      fallbackModalUrl,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }
                  setShowFallbackModal(false);
                }}
              >
                Go to Review Site
              </button>
            </div>
          </div>
        </div>
      )}
      {showSentimentModal && (
        <EmojiSentimentModal
          open={showSentimentModal}
          onClose={() => setShowSentimentModal(false)}
          question={mergedEmojiSentimentQuestion}
          feedbackMessage={mergedEmojiFeedbackMessage}
          thankYouMessage={mergedEmojiThankYouMessage}
          onPositive={(sentimentValue) => {
            setShowSentimentModal(false);
            
            // Check if sentiment is negative (neutral, unsatisfied, frustrated)
            if (["neutral", "unsatisfied", "frustrated"].includes(sentimentValue)) {
              // Show choice modal for negative sentiment
              setSelectedNegativeSentiment(sentimentValue);
              setShowChoiceModal(true);
            } else {
              // Positive sentiment - proceed normally
              setSentiment(sentimentValue);
              setSentimentComplete(true);
            }
          }}
          headerColor={businessProfile?.primary_color || "#4F46E5"}
          buttonColor={businessProfile?.secondary_color || "#4F46E5"}
          fontFamily={businessProfile?.primary_font || "Inter"}
          promptPageId={promptPage?.id}
        />
      )}
      
      {/* Step 2 Choice Modal for negative sentiment */}
      {showChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fadein">
          <div
            className="rounded-2xl shadow-2xl p-10 max-w-lg w-full relative animate-slideup border-2"
            style={{ 
              fontFamily: businessProfile?.primary_font || "Inter",
              backgroundColor: businessProfile?.card_bg || "#fff",
              borderColor: businessProfile?.primary_color || "#4F46E5"
            }}
          >
            <div
              className="mb-6 text-2xl font-bold text-center"
              style={{ color: businessProfile?.primary_color || "#4F46E5" }}
            >
              {mergedEmojiFeedbackPopupHeader}
            </div>
            
            <p 
              className="text-center mb-8"
              style={{ color: businessProfile?.card_text || "#374151" }}
            >
              Your feedback can help us learn and grow. Please consider sharing your feedback privately so we can address it promptly.
            </p>
            
            <div className="space-y-4">
              <button
                className="w-full px-6 py-4 rounded-lg font-semibold text-lg shadow-lg text-white hover:opacity-90 focus:outline-none transition border-2"
                style={{
                  backgroundColor: businessProfile?.secondary_color || "#4F46E5",
                  borderColor: businessProfile?.secondary_color || "#4F46E5",
                  fontFamily: businessProfile?.primary_font || "Inter",
                }}
                onClick={() => {
                  // Send private feedback to business
                  setSentiment(selectedNegativeSentiment);
                  setSentimentComplete(true);
                  setShowChoiceModal(false);
                  
                  // Track the private feedback choice for analytics
                  sendAnalyticsEvent({
                    promptPageId: promptPage?.id,
                    eventType: 'emoji_sentiment_choice',
                    emoji_sentiment: selectedNegativeSentiment,
                    choice: 'private',
                    source: 'negative_sentiment_flow'
                  });
                  
                  setSelectedNegativeSentiment(null);
                  setShowFeedbackForm(true);
                }}
              >
                Send private feedback
              </button>
              
              <button
                className="w-full px-6 py-4 rounded-lg font-semibold text-lg shadow-lg hover:opacity-90 focus:outline-none transition border-2"
                style={{
                  backgroundColor: "transparent",
                  borderColor: businessProfile?.secondary_color || "#4F46E5",
                  color: businessProfile?.secondary_color || "#4F46E5",
                  fontFamily: businessProfile?.primary_font || "Inter",
                }}
                onClick={() => {
                  // Publish review publicly - redirect to review platforms
                  setSentiment(selectedNegativeSentiment);
                  setSentimentComplete(true);
                  setShowChoiceModal(false);
                  
                  // Track the public review choice for analytics
                  sendAnalyticsEvent({
                    promptPageId: promptPage?.id,
                    eventType: 'emoji_sentiment_choice',
                    emoji_sentiment: selectedNegativeSentiment,
                    choice: 'public',
                    source: 'negative_sentiment_flow'
                  });
                  
                  setSelectedNegativeSentiment(null);
                  
                  // Force the review form to show instead of feedback form
                  setTimeout(() => {
                    setShowReviewForm(true);
                  }, 100);
                }}
              >
                Post review publically
              </button>
            </div>
            

          </div>
        </div>
      )}
      
      {/* Friendly Note Popup */}
      {promptPage?.show_friendly_note &&
        promptPage?.friendly_note &&
        showPersonalNote &&
        canShowPersonalNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-w-lg mx-4 relative animate-slideup shadow-lg">
              {/* Standardized red X close button */}
              <button
                className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
                style={{ width: 48, height: 48 }}
                onClick={() => setShowPersonalNote(false)}
                aria-label="Close note"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-slate-blue text-base">
                {promptPage.friendly_note}
              </div>
            </div>
          </div>
        )}
      


      {/* Style Modal */}
      {showStyleModal && (
        <StyleModalPage 
          onClose={() => setShowStyleModal(false)} 
          onStyleUpdate={handleStyleUpdate}
        />
      )}

      {/* Recent Reviews Modal */}
      {showRecentReviewsModal && promptPage?.id && (
        <RecentReviewsModal 
          isOpen={showRecentReviewsModal}
          onClose={() => setShowRecentReviewsModal(false)} 
          promptPageId={promptPage.id}
          businessProfile={businessProfile}
        />
      )}
    </div>
  );
}
