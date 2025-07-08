"use client";

import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useRouter, useParams } from "next/navigation";
import SocialMediaIcons from "@/app/components/SocialMediaIcons";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Card } from "@/app/components/ui/card";
import {
  FaStar,
  FaGoogle,
  FaFacebook,
  FaYelp,
  FaTripadvisor,
  FaRegStar,
  FaQuestionCircle,
  FaPenFancy,
  FaHeart,
  FaBookmark,
  FaHome,
  FaEnvelope,
  FaStar as FaFavorites,
  FaCalendarAlt,
  FaBell,
  FaThumbsUp,
  FaLink,
  FaImage,
  FaCamera,
  FaSmile,
  FaMeh,
  FaFrown,
  FaAngry,
  FaGrinHearts,
  FaBolt,
  FaCoffee,
  FaWrench,
  FaRainbow,
  FaGlassCheers,
  FaDumbbell,
  FaPagelines,
  FaPeace,
  FaBicycle,
  FaAnchor,
  FaGripLines,
  FaPalette,
  FaCopy,
} from "react-icons/fa";
import { IconType } from "react-icons";
import ReviewSubmissionForm from "@/components/ReviewSubmissionForm";
import { useReviewer } from "@/contexts/ReviewerContext";
import AppLoader from "@/app/components/AppLoader";
import OfferCard from "../../components/OfferCard";
import offerConfig from "@/app/components/prompt-modules/offerConfig";
import EmojiSentimentModal from "@/app/components/EmojiSentimentModal";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import PromptReviewsLogo from "@/app/dashboard/components/PromptReviewsLogo";
import PageCard from "@/app/components/PageCard";
import imageCompression from 'browser-image-compression';
import { getAccessibleColor } from "@/utils/colorUtils";
import { getFallingIcon, getFallingIconColor } from "@/app/components/prompt-modules/fallingStarsConfig";
import dynamic from "next/dynamic";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/utils/accountUtils";

// Import our extracted components
import BusinessInfoCard from "./components/BusinessInfoCard";
import ProductModule from "./components/ProductModule";
import ReviewPlatformCard from "./components/ReviewPlatformCard";
import SaveMenu from "./components/SaveMenu";
import FallingAnimation from "./components/FallingAnimation";
import TopActionButtons from "./components/TopActionButtons";
import { getFontClass } from "./utils/fontUtils";
import { getPlatformIcon, splitName, sendAnalyticsEvent, isOffWhiteOrCream } from "./utils/helperFunctions";
import { sentimentOptions } from "./utils/sentimentConfig";

const StyleModalPage = dynamic(() => import("../../dashboard/style/StyleModalPage"), { ssr: false });

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
  card_bg: string;
  card_text: string;
  card_inner_shadow?: boolean;
  card_shadow_color?: string;
  card_shadow_intensity?: number;
}

// Functions now imported from utils

export default function PromptPage() {
  const supabase = createClient();

  const router = useRouter();
  const params = useParams();
  const [promptPage, setPromptPage] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [platformReviewTexts, setPlatformReviewTexts] = useState<string[]>([]);
  const [aiRewriteCounts, setAiRewriteCounts] = useState<number[]>(Array(promptPage?.review_platforms?.length || 0).fill(0));
  const [aiLoading, setAiLoading] = useState<number | null>(null);
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
  const [showStarRain, setShowStarRain] = useState(true);
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
  const [photoReviewerName, setPhotoReviewerName] = useState("");
  const [photoReviewerRole, setPhotoReviewerRole] = useState("");
  const [showSentimentModal, setShowSentimentModal] = useState(false);
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
  
  // Style button state variables
  const [isOwner, setIsOwner] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const savedCounts = sessionStorage.getItem('aiRewriteCounts');
    if (savedCounts) {
      setAiRewriteCounts(JSON.parse(savedCounts));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const slug = params.slug as string;

      try {
        // Log Supabase configuration (without sensitive data)
        console.log("Supabase configuration:", {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "not set",
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "not set"
        });

        // First query - Get prompt page via API to bypass RLS
        try {
          console.log("Fetching prompt page via API for slug:", slug);
          
          const promptResponse = await fetch(`/api/prompt-pages/${slug}`);
          
          if (!promptResponse.ok) {
            if (promptResponse.status === 404) {
              setError(`Page not found: ${slug}`);
              setLoading(false);
              return;
            }
            throw new Error(`Failed to fetch prompt page: ${promptResponse.statusText}`);
          }

          const promptData = await promptResponse.json();
          console.log("Successfully fetched prompt page:", promptData);
          setPromptPage(promptData);

          // Second query - Get business profile via API to bypass RLS
          try {
            console.log("Fetching business profile via API for account:", promptData.account_id);
            
            const response = await fetch(`/api/businesses/${promptData.account_id}`);
            
            if (!response.ok) {
              if (response.status === 404) {
                setError(`Business profile not found for account: ${promptData.account_id}`);
                setLoading(false);
                return;
              }
              throw new Error(`Failed to fetch business: ${response.statusText}`);
            }

            const businessData = await response.json();
            console.log("Successfully fetched business profile:", businessData);
            setBusinessProfile({
              ...businessData,
              business_name: businessData.name,
              review_platforms: [],
              business_website: businessData.business_website,
              default_offer_url: businessData.default_offer_url,
              card_bg: businessData.card_bg,
              card_text: businessData.card_text,
              card_inner_shadow: businessData.card_inner_shadow,
              card_shadow_color: businessData.card_shadow_color,
              card_shadow_intensity: businessData.card_shadow_intensity,
            });
          } catch (businessErr: unknown) {
            console.error("Error fetching business profile:", businessErr);
            throw businessErr;
          }
        } catch (promptErr: unknown) {
          console.error("Error fetching prompt page:", promptErr);
          throw promptErr;
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
        
        // Use the singleton supabase client and getUserOrMock utility (same as dashboard)
        const { data: { user }, error } = await getUserOrMock(supabase);
        
        if (error) {
          console.error("Error getting user:", error);
          setUserLoading(false);
          return;
        }

        console.log("Current user:", user);
        setCurrentUser(user);

        if (!user) {
          console.log("No authenticated user");
          setCurrentUserEmail(null);
          setUserLoading(false);
          return;
        }

        console.log('Auth session found for user:', user.email);
        setCurrentUserEmail(user.email || null);
        
        // Get the account ID for the user
        const accountId = await getAccountIdForUser(user.id, supabase);
        console.log("User account ID:", accountId);

        if (!accountId) {
          console.log("No account found for user");
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
        setIsOwner(false);
        setCurrentUserEmail(null);
        setUserLoading(false);
      }
    }
    
    checkOwnership();
  }, [promptPage?.slug]);

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
      setSubmitError("For logged in users, submits are not saved to account.");
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
      // Try to copy
      let copied = false;
      if (platformReviewTexts[idx]) {
        try {
          await navigator.clipboard.writeText(platformReviewTexts[idx]);
          setCopySuccess(
            "Copied to clipboard! Now paste it on the review site.",
          );
          copied = true;
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
      setTimeout(() => setCopySuccess(null), 4000);
    }
  };

  const handleRewriteWithAI = async (idx: number) => {
    if (!promptPage || !businessProfile) return;
    setAiLoading(idx);
    try {
      const platform = promptPage.review_platforms[idx];
      const prompt = `Generate a positive review for ${businessProfile.business_name} on ${platform.platform || platform.name}. The review should be authentic, specific, and highlight the business's strengths.`;
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Failed to generate review");
      const { text } = await response.json();
      setPlatformReviewTexts((prev) =>
        prev.map((t, i) => (i === idx ? text : t)),
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
      // Optionally show error
    } finally {
      setAiLoading(null);
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
  }, []);

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile || !testimonial.trim() || !photoReviewerName.trim()) {
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
      const { first: first_name, last: last_name } =
        splitName(photoReviewerName);
      
      const reviewResponse = await fetch("/api/review-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_page_id: promptPage.id,
          platform: "photo",
          status: "submitted",
          first_name,
          last_name,
          reviewer_name: photoReviewerName,
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
      setPhotoReviewerName("");
      setPhotoReviewerRole("");
    } catch (err: any) {
      setPhotoError(err.message || "Failed to submit.");
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleGeneratePhotoTestimonial = async () => {
    if (!promptPage || !businessProfile) return;
    setAiLoadingPhoto(true);
    try {
      const prompt = `Generate a positive testimonial for ${businessProfile.business_name}. The testimonial should be authentic, specific, and highlight the business's strengths.`;
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Failed to generate testimonial");
      const { text } = await response.json();
      setTestimonial(text);
    } catch (err) {
      // Optionally show error
    } finally {
      setAiLoadingPhoto(false);
    }
  };

  // Show modal on load if enabled
  useEffect(() => {
    console.log(
      "PromptPage.emoji_sentiment_enabled:",
      promptPage?.emoji_sentiment_enabled,
      "PromptPage.emoji_sentiment_question:",
      promptPage?.emoji_sentiment_question,
    );
    if (promptPage?.emoji_sentiment_enabled) {
      setShowSentimentModal(true);
      setSentiment("love");
    }
  }, [promptPage]);

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
    promptPage?.default_offer_url || businessProfile?.default_offer_url || "";
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
  const mergedEmojiFeedbackPopupHeader = promptPage?.emoji_feedback_popup_header || "How can we Improve?";
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="centered" />
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
      {/* Special Offer Banner - very top, thin, dismissible */}
      {showBanner && (
        <div
          className="w-full flex items-center justify-center relative px-2 py-1 bg-yellow-50 border-b border-yellow-300 shadow-sm z-50"
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
        {promptPage?.falling_icon &&
          showStarRain &&
          (!promptPage.emoji_sentiment_enabled ||
            (sentimentComplete &&
              (sentiment === "excellent" || sentiment === "satisfied"))) && (
            <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
              {[...Array(60)].map((_, i) => {
                const left = Math.random() * 98 + Math.random() * 2;
                const duration = 3 + Math.random() * 1.5;
                const delay = Math.random() * 0.5;
                const size = 32 + Math.random() * 8;
                
                // Get icon from configuration
                const iconConfig = getFallingIcon(promptPage.falling_icon);
                
                // Guard clause to ensure iconConfig is defined
                if (!iconConfig) {
                  return null;
                }
                
                const IconComponent = iconConfig.icon;
                
                // Convert Tailwind color class to hex
                const getColorFromClass = (colorClass: string) => {
                  const colorMap: { [key: string]: string } = {
                    "text-yellow-400": "#facc15",
                    "text-red-500": "#ef4444",
                    "text-amber-400": "#fbbf24",
                    "text-fuchsia-400": "#d946ef",
                    "text-amber-800": "#92400e",
                    "text-gray-500": "#6b7280",
                    "text-pink-400": "#ec4899",
                    "text-gray-600": "#4b5563",
                    "text-green-500": "#22c55e",
                    "text-purple-500": "#a21caf",
                    "text-blue-500": "#3b82f6",
                    "text-yellow-500": "#eab308",
                    "text-blue-300": "#93c5fd",
                    "text-gray-400": "#9ca3af",
                    "text-blue-200": "#bfdbfe",
                    "text-orange-500": "#f97316",
                    "text-green-600": "#16a34a",
                    "text-red-400": "#f87171",
                    "text-orange-600": "#ea580c",
                    "text-yellow-600": "#ca8a04",
                    "text-pink-300": "#f9a8d4",
                    "text-blue-600": "#2563eb",
                    "text-yellow-300": "#fde047",
                    "text-purple-400": "#c084fc",
                    "text-blue-400": "#60a5fa",
                    "text-purple-300": "#d8b4fe",
                    "text-gray-300": "#d1d5db",
                    "text-orange-400": "#fb923c",
                    "text-amber-600": "#d97706",
                    "text-red-600": "#dc2626",
                    "text-purple-600": "#9333ea",
                    "text-amber-500": "#f59e0b",
                    "text-amber-700": "#b45309",
                    "text-indigo-500": "#6366f1",
                    "text-indigo-600": "#4f46e5",
                    "text-pink-500": "#ec4899",
                    "text-teal-500": "#14b8a6",
                  };
                  return colorMap[colorClass] || "#6b7280";
                };

                const iconColor = getColorFromClass(iconConfig.color);

                return (
                  <IconComponent
                    key={i}
                    className="absolute animate-fall"
                    style={{
                      color: iconColor,
                      fontSize: size,
                      left: `${left}%`,
                      top: -40,
                      animationDuration: `${duration}s`,
                      animationDelay: `${delay}s`,
                    }}
                  />
                );
              })}
            </div>
          )}
        
        {/* Style & Back Buttons - Style button only visible to page owners */}
        <div
          className={`fixed left-4 z-50 transition-all duration-300 ${showBanner ? "top-28 sm:top-24" : "top-4"}`}
        >
          <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-xl p-3 space-y-2">
            {!userLoading && isOwner && (
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
                <FaPalette className="w-5 h-5 transition-colors group-hover:text-slate-blue" />
                <span className="hidden sm:inline">Style</span>
              </button>
            )}
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors group w-full"
              style={{
                background: isOffWhiteOrCream(businessProfile?.card_bg || "#FFFFFF")
                  ? businessProfile?.card_bg || "#FFFFFF"
                  : "#FFFFFF",
                color: getAccessibleColor(businessProfile?.primary_color || "#4F46E5"),
                border: "1px solid #E5E7EB"
              }}
              title="Back to dashboard"
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
        

        
        {/* Save for Later Button */}
        <div
          className={`fixed right-4 z-50 transition-all duration-300 ${showBanner ? "top-28 sm:top-24" : "top-4"}`}
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
            <FaHeart className="w-5 h-5 transition-colors group-hover:text-red-500" />
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
                <FaCalendarAlt className="w-4 h-4" />
                Add to Calendar
              </button>
              <button
                onClick={() => handleSaveOption("email")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.primary_color || "#4F46E5" }}
              >
                <FaEnvelope className="w-4 h-4" />
                Email to Self
              </button>
              <button
                onClick={() => handleSaveOption("home-screen")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.primary_color || "#4F46E5" }}
              >
                <FaHome className="w-4 h-4" />
                Add to Home Screen
              </button>
              {availableFeatures.clipboard && (
                <button
                  onClick={() => handleSaveOption("copy-link")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                >
                  <FaLink className="w-4 h-4" />
                  Copy Link
                </button>
              )}
              {availableFeatures.share && (
                <button
                  onClick={() => handleSaveOption("reading-list")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                >
                  <FaBookmark className="w-4 h-4" />
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
                  <FaFavorites className="w-4 h-4" />
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
              />
              {/* Product Module for Product Pages */}
              <ProductModule
                promptPage={promptPage}
                businessProfile={businessProfile}
                sentiment={sentiment}
              />
              {/* Review Platforms Section */}
              {mergedReviewPlatforms?.map((platform: any, idx: number) => (
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
                  isSubmitting={isSubmitting}
                  aiRewriteCounts={aiRewriteCounts}
                  openInstructionsIdx={openInstructionsIdx}
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
              
              {/* Choice Modal */}
              {showChoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadein border-2 border-indigo-500">
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                      onClick={() => setShowChoiceModal(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h2 className="text-2xl font-bold mb-4 text-indigo-700 text-center">
                      Choose Your Experience
                    </h2>
                    <p className="text-gray-700 mb-6 text-center">
                      How would you rate your overall experience?
                    </p>
                    <div className="flex flex-col gap-3">
                                             {sentimentOptions.map((option) => (
                         <button
                           key={option.value}
                           onClick={() => {
                             setSelectedNegativeSentiment(option.value);
                             setShowChoiceModal(false);
                           }}
                           className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                         >
                           <span className="text-2xl">{option.icon}</span>
                           <div className="text-left">
                             <div className="font-medium">{option.label}</div>
                           </div>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              )}
              {/* Website and Social Media Card */}
              <div className="mb-8 rounded-2xl shadow p-8 animate-slideup" style={{
                background: businessProfile?.card_bg || "#F9FAFB",
                color: businessProfile?.card_text || "#1A1A1A"
              }}>
                <div className="flex flex-col md:flex-row gap-8 w-full">
                  {/* Website Section (left column) */}
                  {businessProfile?.business_website && (
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
                        href={businessProfile.business_website}
                        target="_blank"
                        rel="noopener noreferrer"
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
                        {businessProfile.business_website.replace(
                          /^https?:\/\//,
                          "",
                        )}
                      </a>
                    </div>
                  )}
                  {/* Social Media Section (right column, wider) */}
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
                </div>
              </div>
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
                      rel="noopener noreferrer"
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
                      Get more reviews for your business with our easy-to-use
                      review management platform. Create custom review pages,
                      track your progress, and grow your online presence.
                    </p>
                    <a
                      href="https://promptreviews.app"
                      target="_blank"
                      rel="noopener noreferrer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full relative animate-fadein border-2 border-indigo-500">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setShowFallbackModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-3 text-indigo-700 text-center">
              Copy Your Review
            </h2>
            <p className="text-gray-700 mb-4 text-center">
              Copy the review below, then click{" "}
              <span className="font-semibold">Go to Review Site</span> to paste
              it.
            </p>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 mb-4 text-base focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              value={fallbackModalText}
              readOnly
              rows={5}
              onFocus={(e) => e.target.select()}
              style={{
                background: businessProfile?.card_bg || "#F9FAFB",
                color: businessProfile?.card_text || "#1A1A1A"
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
                className="w-full px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:opacity-90 focus:outline-none transition border-2"
                style={{
                  backgroundColor:
                    businessProfile?.secondary_color || "#4F46E5",
                  color: "#fff",
                  borderColor: businessProfile?.secondary_color || "#4F46E5",
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
                <span className="text-gray-500 text-base font-medium px-2">
                  and then
                </span>
              </div>
              <button
                className="w-full px-6 py-3 bg-slate-blue text-white rounded-lg font-semibold shadow hover:bg-indigo-900 focus:outline-none transition"
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
          buttonColor={businessProfile?.secondary_color || "#818CF8"}
          fontFamily={businessProfile?.primary_font || "Inter"}
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
              We appreciate your feedback and want to make sure it's handled appropriately.
            </p>
            
            <div className="space-y-4">
              <button
                className="w-full px-6 py-4 rounded-lg font-semibold text-lg shadow-lg text-white hover:opacity-90 focus:outline-none transition border-2"
                style={{
                  backgroundColor: businessProfile?.secondary_color || "#818CF8",
                  borderColor: businessProfile?.secondary_color || "#818CF8",
                  fontFamily: businessProfile?.primary_font || "Inter",
                }}
                onClick={() => {
                  // Send private feedback to business
                  setSentiment(selectedNegativeSentiment);
                  setSentimentComplete(true);
                  setShowChoiceModal(false);
                  setSelectedNegativeSentiment(null);
                }}
              >
                Send Private Feedback to Business
              </button>
              
              <button
                className="w-full px-6 py-4 rounded-lg font-semibold text-lg shadow-lg hover:opacity-90 focus:outline-none transition border-2"
                style={{
                  backgroundColor: "transparent",
                  borderColor: businessProfile?.secondary_color || "#818CF8",
                  color: businessProfile?.secondary_color || "#818CF8",
                  fontFamily: businessProfile?.primary_font || "Inter",
                }}
                onClick={() => {
                  // Publish review publicly - redirect to review platforms
                  setSentiment(selectedNegativeSentiment);
                  setSentimentComplete(true);
                  setShowChoiceModal(false);
                  setSelectedNegativeSentiment(null);
                  
                  // Force the review form to show instead of feedback form
                  setTimeout(() => {
                    setShowReviewForm(true);
                  }, 100);
                }}
              >
                Publish Review Publicly
              </button>
            </div>
            

          </div>
        </div>
      )}
      
      {/* Style Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <StyleModalPage 
            onClose={() => setShowStyleModal(false)} 
            onStyleUpdate={handleStyleUpdate}
          />
        </div>
      )}
    </div>
  );
}
