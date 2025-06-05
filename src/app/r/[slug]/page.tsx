"use client";

import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
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
} from "react-icons/fa";
import { IconType } from "react-icons";
import ReviewSubmissionForm from "@/components/ReviewSubmissionForm";
import { useReviewer } from "@/contexts/ReviewerContext";
import { getUserOrMock } from "@/utils/supabase";
import AppLoader from "@/app/components/AppLoader";
import OfferCard from "../../components/OfferCard";
import offerConfig from "@/app/components/prompt-modules/offerConfig";
import EmojiSentimentModal from "@/app/components/EmojiSentimentModal";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import PromptReviewsLogo from "@/app/dashboard/components/PromptReviewsLogo";
import PageCard from "@/app/components/PageCard";
import imageCompression from 'browser-image-compression';
import { getAccessibleColor } from "@/utils/colorUtils";

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
}

// Helper to get platform icon based on URL or platform name
function getPlatformIcon(
  url: string,
  platform: string,
): { icon: IconType; label: string } {
  const lowerUrl = url?.toLowerCase() || "";
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

// Helper to split full name into first and last
function splitName(fullName: string) {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

async function sendAnalyticsEvent(event: Record<string, any>) {
  try {
    await fetch("/api/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (e) {
    // Optionally log error
  }
}

const sentimentOptions = [
  {
    value: "love",
    icon: <FaGrinHearts className="text-pink-400" />,
    label: "Excellent",
  },
  {
    value: "satisfied",
    icon: <FaSmile className="text-green-500" />,
    label: "Satisfied",
  },
  {
    value: "neutral",
    icon: <FaMeh className="text-gray-400" />,
    label: "Neutral",
  },
  {
    value: "unsatisfied",
    icon: <FaFrown className="text-orange-400" />,
    label: "Unsatisfied",
  },
  {
    value: "angry",
    icon: <FaAngry className="text-red-500" />,
    label: "Angry",
  },
];

// Helper to determine if card_bg is off-white or cream
function isOffWhiteOrCream(color: string) {
  const offWhites = ["#F8FAFC", "#F9FAFB", "#F3F4F6", "#FAF3E3", "#FFF9E3", "#FFF8E1", "#FDF6EC", "#F5F5DC", "#FFFDD0", "#FFFDE7", "#FFFBEA"];
  return offWhites.map(c => c.toUpperCase()).includes(color.toUpperCase());
}

// Helper to get font class from fontOptions (should match StyleModalPage)
const fontClassMap: Record<string, string> = {
  "Inter": "font-inter",
  "Roboto": "font-roboto",
  "Open Sans": "font-open-sans",
  "Lato": "font-lato",
  "Montserrat": "font-montserrat",
  "Poppins": "font-poppins",
  "Source Sans 3": "font-source-sans",
  "Raleway": "font-raleway",
  "Nunito": "font-nunito",
  "Playfair Display": "font-playfair",
  "Merriweather": "font-merriweather",
  "Roboto Slab": "font-roboto-slab",
  "PT Sans": "font-pt-sans",
  "Oswald": "font-oswald",
  "Roboto Condensed": "font-roboto-condensed",
  "Source Serif 4": "font-source-serif",
  "Noto Sans": "font-noto-sans",
  "Ubuntu": "font-ubuntu",
  "Work Sans": "font-work-sans",
  "Quicksand": "font-quicksand",
  "Josefin Sans": "font-josefin-sans",
  "Mukta": "font-mukta",
  "Rubik": "font-rubik",
  "IBM Plex Sans": "font-ibm-plex-sans",
  "Barlow": "font-barlow",
  "Mulish": "font-mulish",
  "Comfortaa": "font-comfortaa",
  "Outfit": "font-outfit",
  "Plus Jakarta Sans": "font-plus-jakarta-sans",
  "Courier Prime": "font-courier-prime",
  "IBM Plex Mono": "font-ibm-plex-mono",
  // System fonts
  "Arial": "font-arial",
  "Helvetica": "font-helvetica",
  "Verdana": "font-verdana",
  "Tahoma": "font-tahoma",
  "Trebuchet MS": "font-trebuchet-ms",
  "Times New Roman": "font-times-new-roman",
  "Georgia": "font-georgia",
  "Courier New": "font-courier-new",
  "Lucida Console": "font-lucida-console",
  "Palatino": "font-palatino",
  "Garamond": "font-garamond",
};
function getFontClass(fontName: string) {
  return fontClassMap[fontName] || "";
}

export default function PromptPage() {
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [platformReviewTexts, setPlatformReviewTexts] = useState<string[]>([]);
  const [aiRewriteCounts, setAiRewriteCounts] = useState<number[]>([]);
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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

        // First query - Get prompt page
        try {
          const { data: promptData, error: promptError } = await supabase
            .from("prompt_pages")
            .select("*")
            .eq("slug", slug)
            .maybeSingle(); // Use maybeSingle() instead of single()

          if (promptError) {
            console.error("PromptPage Supabase error details:", {
              message: promptError.message,
              details: promptError.details,
              hint: promptError.hint,
              code: promptError.code
            });
            throw promptError;
          }

          if (!promptData) {
            setError(`Page not found: ${slug}`);
            setLoading(false);
            return;
          }

          console.log("Successfully fetched prompt page:", promptData);
          setPromptPage(promptData);

          // Second query - Get business profile
          try {
            const { data: businessData, error: businessError } = await supabase
              .from("businesses")
              .select("*")
              .eq("account_id", promptData.account_id)
              .maybeSingle(); // Use maybeSingle() instead of single()

            if (businessError) {
              console.error("BusinessProfile Supabase error details:", {
                message: businessError.message,
                details: businessError.details,
                hint: businessError.hint,
                code: businessError.code
              });
              throw businessError;
            }

            if (!businessData) {
              setError(`Business profile not found for account: ${promptData.account_id}`);
              setLoading(false);
              return;
            }

            console.log("Successfully fetched business profile:", businessData);
            setBusinessProfile({
              ...businessData,
              business_name: businessData.name,
              review_platforms: [],
              business_website: businessData.business_website,
              default_offer_url: businessData.default_offer_url,
              card_bg: businessData.card_bg,
              card_text: businessData.card_text,
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
  }, [params.slug, supabase]);

  useEffect(() => {
    if (promptPage && Array.isArray(promptPage.review_platforms)) {
      setPlatformReviewTexts(
        promptPage.review_platforms.map((p: any) => p.reviewText || ""),
      );
      setAiRewriteCounts(promptPage.review_platforms.map(() => 0));
      if (promptPage.is_universal) {
        setReviewerFirstNames(promptPage.review_platforms.map(() => ""));
        setReviewerLastNames(promptPage.review_platforms.map(() => ""));
        setReviewerRoles(promptPage.review_platforms.map(() => ""));
      } else {
        setReviewerFirstNames(
          promptPage.review_platforms.map(() => promptPage.first_name || ""),
        );
        setReviewerLastNames(
          promptPage.review_platforms.map(() => promptPage.last_name || ""),
        );
        setReviewerRoles(
          promptPage.review_platforms.map(() => promptPage.role || ""),
        );
      }
    }
  }, [promptPage]);

  // Track page view (exclude logged-in users)
  useEffect(() => {
    async function trackView() {
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (!user && promptPage?.id) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: "view",
          platform: "web",
        });
      }
    }
    trackView();
  }, [promptPage, supabase]);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      setCurrentUser(user);
    }
    fetchUser();
  }, [supabase]);

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
      setAiRewriteCounts((prev) => prev.map((c, i) => (i === idx ? c + 1 : c)));
      if (
        !currentUser &&
        promptPage?.id &&
        promptPage.review_platforms?.[idx]
      ) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: "generate_with_ai",
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

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoSubmitting(true);
    setPhotoError(null);
    // Prevent logged-in users from submitting testimonials
    if (currentUser) {
      setPhotoError(
        "You are logged in as the business owner. Testimonials submitted while logged in are not saved. Please log out to test the public review flow.",
      );
      setPhotoSubmitting(false);
      return;
    }
    try {
      if (!photoFile) {
        setPhotoError("Please select or take a photo.");
        setPhotoSubmitting(false);
        return;
      }
      if (!testimonial.trim()) {
        setPhotoError("Please enter a testimonial.");
        setPhotoSubmitting(false);
        return;
      }
      // Upload photo to API route
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("promptPageId", promptPage.id);
      const uploadRes = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok)
        throw new Error(uploadData.error || "Failed to upload photo");
      const photoUrl = uploadData.url;
      // Save testimonial + photo URL to review_submissions
      const reviewGroupId =
        localStorage.getItem("reviewGroupId") ||
        (() => {
          const id = crypto.randomUUID();
          localStorage.setItem("reviewGroupId", id);
          return id;
        })();
      const { first: first_name, last: last_name } =
        splitName(photoReviewerName);
      const { error: submissionError } = await supabase
        .from("review_submissions")
        .insert({
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
        });
      if (submissionError) throw submissionError;
      // Update the prompt page status to 'complete'
      await supabase
        .from("prompt_pages")
        .update({ status: "complete" })
        .eq("id", promptPage.id);
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
    debugger;
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
    "Review Rewards";
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
    promptPage?.emoji_sentiment_question || "";
  const mergedEmojiFeedbackMessage = promptPage?.emoji_feedback_message || "";
  const mergedEmojiThankYouMessage = promptPage?.emoji_thank_you_message || "";
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
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
    <div style={backgroundStyle} className={`min-h-screen w-full ${getFontClass(businessProfile?.primary_font)}`}>
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
                let IconComp;
                if (promptPage.falling_icon === "star")
                  IconComp = (
                    <FaStar
                      className="absolute animate-fall"
                      style={{
                        color: "#facc15",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "heart")
                  IconComp = (
                    <FaHeart
                      className="absolute animate-fall"
                      style={{
                        color: "#ef4444",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "smile")
                  IconComp = (
                    <FaSmile
                      className="absolute animate-fall"
                      style={{
                        color: "#facc15",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "thumb")
                  IconComp = (
                    <FaThumbsUp
                      className="absolute animate-fall"
                      style={{
                        color: "#3b82f6",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "bolt")
                  IconComp = (
                    <FaBolt
                      className="absolute animate-fall"
                      style={{
                        color: "#fbbf24",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "rainbow")
                  IconComp = (
                    <FaRainbow
                      className="absolute animate-fall"
                      style={{
                        color: "#d946ef",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "coffee")
                  IconComp = (
                    <FaCoffee
                      className="absolute animate-fall"
                      style={{
                        color: "#92400e",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "wrench")
                  IconComp = (
                    <FaWrench
                      className="absolute animate-fall"
                      style={{
                        color: "#6b7280",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "confetti")
                  IconComp = (
                    <FaGlassCheers
                      className="absolute animate-fall"
                      style={{
                        color: "#ec4899",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "barbell")
                  IconComp = (
                    <FaDumbbell
                      className="absolute animate-fall"
                      style={{
                        color: "#4b5563",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "flower")
                  IconComp = (
                    <FaPagelines
                      className="absolute animate-fall"
                      style={{
                        color: "#22c55e",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "peace")
                  IconComp = (
                    <FaPeace
                      className="absolute animate-fall"
                      style={{
                        color: "#a21caf",
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "bicycle")
                  IconComp = (
                    <FaBicycle
                      className="absolute animate-fall"
                      style={{
                        color: "#22c55e", // green
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                else if (promptPage.falling_icon === "anchor")
                  IconComp = (
                    <FaAnchor
                      className="absolute animate-fall"
                      style={{
                        color: "#3b82f6", // blue
                        fontSize: size,
                        left: 0,
                        top: 0,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                const top = -40 - Math.random() * 360; // increase vertical spread: -40px to -400px
                return (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${left}%`,
                      top: `${top}px`,
                      pointerEvents: "none",
                      zIndex: 50,
                    }}
                  >
                    {IconComp}
                  </span>
                );
              })}
            </div>
          )}
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
              <div className="bg-gray-50 rounded-2xl shadow p-6 mb-8 flex flex-col items-center max-w-xl mx-auto animate-slideup relative mt-32">
                {/* Business Logo - No drop-down animation */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-52 h-52 aspect-square flex items-center justify-center mb-10"
                  style={{ pointerEvents: "none", top: "-100px" }}
                >
                  <div className="bg-white rounded-full p-1 shadow-lg flex items-center justify-center w-full h-full aspect-square">
                    {businessProfile?.logo_url ? (
                      <img
                        src={businessProfile.logo_url}
                        alt={`${businessProfile?.business_name || "Business"} logo`}
                        className="h-48 w-48 aspect-square object-contain rounded-full"
                      />
                    ) : (
                      <div className="h-48 w-48 aspect-square bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-5xl text-gray-500">
                          {businessProfile?.business_name?.[0] || "B"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Business Name - Added more space above */}
                <h1
                  className={`text-3xl font-bold text-center mb-1 mt-24 ${getFontClass(businessProfile?.primary_font)}`}
                  style={{ color: businessProfile?.primary_color || "#4F46E5" }}
                >
                  {businessProfile?.business_name || "Business Name"}
                </h1>
                {/* City/State under business name */}
                {(businessProfile?.address_city ||
                  businessProfile?.address_state) && (
                  <div className="text-center text-base text-gray-600 font-medium">
                    {[
                      businessProfile.address_city,
                      businessProfile.address_state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
              {/* Product Module for Product Pages */}
              {promptPage?.review_type === "product" &&
                promptPage.product_name && (
                  <div className="bg-white rounded-2xl shadow p-8 mb-8 flex flex-col md:flex-row items-center md:items-start max-w-[1000px] mx-auto animate-slideup relative mt-12 gap-8">
                    {promptPage.product_photo && (
                      <div className="flex-shrink-0 mb-4 md:mb-0">
                      <img
                        src={promptPage.product_photo}
                        alt={promptPage.product_name}
                          className="rounded-2xl w-[300px] h-[300px] object-cover border"
                      />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                      <h2 className={`text-2xl font-bold text-slate-blue mb-2 ${getFontClass(businessProfile?.primary_font)}`}>
                        {promptPage.product_name}
                      </h2>
                      {/* Only show details if not neutral/frustrated sentiment */}
                      {(!sentiment ||
                        (sentiment !== "neutral" &&
                          sentiment !== "frustrated")) && (
                        <>
                          {promptPage.product_description && (
                            <div className={`text-lg text-gray-700 mb-3 ${getFontClass(businessProfile?.secondary_font)}`}>
                              {promptPage.product_description}
                            </div>
                          )}
                          {promptPage.features_or_benefits?.length > 0 && (
                            <ul className="mb-3 text-gray-700 text-base list-disc list-inside">
                              {promptPage.features_or_benefits.map(
                                (f: string, i: number) =>
                                  f && <li key={i}>{f}</li>,
                              )}
                            </ul>
                          )}
                          <div className={`text-sm text-gray-500 ${getFontClass(businessProfile?.secondary_font)}`}>
                            Share your experience with this product below!
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              {/* Feedback Form Section (if negative sentiment) */}
              {sentimentComplete &&
                ["neutral", "unsatisfied", "angry"].includes(
                  sentiment || "",
                ) && (
                  <div className="w-full flex justify-center my-8">
                    <div
                      className="rounded-2xl shadow-2xl p-8 max-w-[1000px] w-full flex flex-col items-center animate-fadein relative"
                      style={{
                        background: businessProfile.card_bg || "#fff",
                        color: businessProfile.card_text || "#1A1A1A",
                        fontFamily: businessProfile.primary_font || "Inter",
                      }}
                    >
                      <h2
                        className="text-2xl font-bold mb-4"
                        style={{ color: businessProfile.primary_color || "#4F46E5" }}
                      >
                        {promptPage.emoji_feedback_message ||
                          "We value your feedback! Let us know how we can do better."}
                      </h2>
                      <form
                        className="w-full flex flex-col items-center"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setFeedbackSubmitting(true);
                          setFeedbackError(null);
                          setFeedbackSuccess(false);
                          // Prevent logged-in users from submitting feedback
                          if (currentUser) {
                            setFeedbackError(
                              "You are logged in as the business owner. Feedback submitted while logged in is not saved. Please log out to test the public review flow.",
                            );
                            setFeedbackSubmitting(false);
                            return;
                          }
                          try {
                            // POST feedback to the API endpoint for review tracking and notification
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
                                promptPageType: "feedback",
                                sentiment: sentiment,
                                email: feedbackEmail,
                                phone: feedbackPhone || null,
                                review_type: "feedback",
                              }),
                            });
                            if (!response.ok)
                              throw new Error("Failed to submit feedback.");
                            setFeedbackSuccess(true);
                            setFeedbackFirstName("");
                            setFeedbackLastName("");
                            setFeedbackEmail("");
                            setFeedbackPhone("");
                            setFeedback("");
                            if (
                              !currentUser &&
                              promptPage?.id &&
                              sentiment &&
                              feedback
                            ) {
                              sendAnalyticsEvent({
                                promptPageId: promptPage.id,
                                eventType: "constructive_feedback",
                                platform: "web",
                                sentiment,
                                feedback,
                              });
                            }
                          } catch (err: any) {
                            setFeedbackError(
                              err.message || "Failed to submit feedback.",
                            );
                          } finally {
                            setFeedbackSubmitting(false);
                          }
                        }}
                      >
                        <div className="flex flex-col md:flex-row gap-4 w-full mb-4">
                          <div className="flex-1">
                            <label
                              htmlFor="feedbackFirstName"
                              className="block text-sm font-medium"
                              style={{ color: businessProfile.card_text || "#1A1A1A" }}
                            >
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="feedbackFirstName"
                              value={feedbackFirstName}
                              onChange={(e) => setFeedbackFirstName(e.target.value)}
                              required
                              className="mt-1 block w-full rounded-lg border border-gray-300 p-3"
                              style={{
                                background: businessProfile.card_bg || "#fff",
                                color: businessProfile.card_text || "#1A1A1A",
                                fontFamily: businessProfile.primary_font || "Inter",
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label
                              htmlFor="feedbackLastName"
                              className="block text-sm font-medium"
                              style={{ color: businessProfile.card_text || "#1A1A1A" }}
                            >
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="feedbackLastName"
                              value={feedbackLastName}
                              onChange={(e) => setFeedbackLastName(e.target.value)}
                              required
                              className="mt-1 block w-full rounded-lg border border-gray-300 p-3"
                              style={{
                                background: businessProfile.card_bg || "#fff",
                                color: businessProfile.card_text || "#1A1A1A",
                                fontFamily: businessProfile.primary_font || "Inter",
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 w-full mb-4">
                          <div className="flex-1">
                            <label
                              htmlFor="feedbackEmail"
                              className="block text-sm font-medium"
                              style={{ color: businessProfile.card_text || "#1A1A1A" }}
                            >
                              Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              id="feedbackEmail"
                              value={feedbackEmail}
                              onChange={(e) => setFeedbackEmail(e.target.value)}
                              required
                              className="mt-1 block w-full rounded-lg border border-gray-300 p-3"
                              style={{
                                background: businessProfile.card_bg || "#fff",
                                color: businessProfile.card_text || "#1A1A1A",
                                fontFamily: businessProfile.primary_font || "Inter",
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label
                              htmlFor="feedbackPhone"
                              className="block text-sm font-medium"
                              style={{ color: businessProfile.card_text || "#1A1A1A" }}
                            >
                              Phone (optional)
                            </label>
                            <input
                              type="tel"
                              id="feedbackPhone"
                              value={feedbackPhone}
                              onChange={(e) => setFeedbackPhone(e.target.value)}
                              className="mt-1 block w-full rounded-lg border border-gray-300 p-3"
                              style={{
                                background: businessProfile.card_bg || "#fff",
                                color: businessProfile.card_text || "#1A1A1A",
                                fontFamily: businessProfile.primary_font || "Inter",
                              }}
                            />
                          </div>
                        </div>
                        <textarea
                          className="w-full rounded-lg border border-gray-300 p-4 min-h-[120px] focus:ring-2 mb-4"
                          placeholder="Your feedback..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          required
                          style={{
                            background: businessProfile.card_bg || "#fff",
                            color: businessProfile.card_text || "#1A1A1A",
                            fontFamily: businessProfile.primary_font || "Inter",
                          }}
                        />
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-lg font-semibold shadow transition"
                          style={{
                            background: businessProfile.secondary_color || "#818CF8",
                            color: "#fff",
                            fontFamily: businessProfile.primary_font || "Inter",
                          }}
                          disabled={feedbackSubmitting}
                        >
                          Submit Feedback
                        </button>
                        {feedbackSuccess && (
                          <div className="text-green-600 mt-4">
                            {promptPage.emoji_thank_you_message ||
                              "Thank you for your feedback!"}
                          </div>
                        )}
                        {feedbackError && (
                          <div className="text-red-600 mt-4">
                            {feedbackError}
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                )}
              {/* Main Content (hidden if feedback form is shown) */}
              {!(
                sentimentComplete &&
                ["neutral", "unsatisfied", "angry"].includes(sentiment || "")
              ) && (
                <>
                  {/* Photo + Testimonial Module */}
                  {(promptPage?.review_type === "photo" ||
                    promptPage?.review_type === "photo_testimonial") && (
                    <div className="mb-8 bg-gray-50 rounded-2xl shadow p-8 animate-slideup">
                      <div className="flex items-center mb-8">
                        <FaCamera
                          className="w-8 h-8 mr-3"
                          style={{ color: "#1A237E" }}
                        />
                        <h1
                          className="text-3xl font-bold text-left"
                          style={{ color: "#1A237E" }}
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
                          className="flex flex-col gap-6 items-center"
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload a photo (PNG, JPG, or WebP, max 1MB, will be optimized)
                          </label>
                          <div className="flex gap-4">
                            <button
                              type="button"
                              className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 focus:outline-none"
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
                          <div className="w-full flex flex-col md:flex-row gap-4">
                            <div className="flex-1 min-w-[200px] max-w-[400px]">
                              <label
                                htmlFor="photoReviewerName"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Your Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id="photoReviewerName"
                                value={photoReviewerName}
                                onChange={(e) =>
                                  setPhotoReviewerName(e.target.value)
                                }
                                placeholder="Ezra C"
                                className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                                required
                              />
                            </div>
                            <div className="flex-1 min-w-[200px] max-w-[400px]">
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
                                onChange={(e) =>
                                  setPhotoReviewerRole(e.target.value)
                                }
                                placeholder="Store Manager, GreenSprout Co-Op"
                                className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                              />
                            </div>
                          </div>
                          <textarea
                            className="w-full rounded-lg border border-gray-300 p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-400"
                            placeholder="Write your testimonial here..."
                            value={testimonial}
                            onChange={(e) => setTestimonial(e.target.value)}
                            required
                          />
                          <div className="flex justify-between w-full gap-2">
                            <button
                              type="button"
                              onClick={handleGeneratePhotoTestimonial}
                              disabled={aiLoadingPhoto}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <FaPenFancy
                                style={{
                                  color:
                                    businessProfile?.primary_color || "#4F46E5",
                                }}
                              />
                              <span
                                style={{
                                  color:
                                    businessProfile?.primary_color || "#4F46E5",
                                }}
                              >
                                {aiLoadingPhoto
                                  ? "Generating..."
                                  : "Generate with AI"}
                              </span>
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-gray-50 transition-colors"
                              style={{
                                color:
                                  businessProfile?.primary_color || "#4F46E5",
                              }}
                              disabled={photoSubmitting}
                              title="Copies your review and takes you to review site"
                            >
                              {photoSubmitting ? (
                                <span className="flex items-center justify-center">
                                  <FiveStarSpinner
                                    size={18}
                                    color1="#a5b4fc"
                                    color2="#6366f1"
                                  />
                                </span>
                              ) : (
                                "Submit"
                              )}
                            </button>
                          </div>
                          {photoError && (
                            <div className="text-red-500 text-sm">
                              {photoError}
                            </div>
                          )}
                        </form>
                      )}
                    </div>
                  )}
                  {/* Personalized Note */}
                  {promptPage?.show_friendly_note &&
                    promptPage?.friendly_note &&
                    !promptPage?.is_universal &&
                    showPersonalNote &&
                    canShowPersonalNote && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein">
                        <div className="bg-white rounded-lg p-6 max-w-lg mx-4 relative animate-slideup">
                          <button
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                            onClick={() => setShowPersonalNote(false)}
                            aria-label="Close note"
                          >
                            ×
                          </button>
                          <div className="text-gray-900 text-base">
                            {promptPage.friendly_note}
                          </div>
                        </div>
                      </div>
                    )}
                  {/* Review Platforms Section */}
                  {Array.isArray(promptPage?.review_platforms) &&
                    promptPage.review_platforms.length > 0 && (
                      <div className="mb-8">
                        <div className="flex flex-col gap-8">
                          {promptPage.review_platforms.map(
                            (platform: any, idx: number) => {
                              const { icon: Icon, label } = getPlatformIcon(
                                platform.url,
                                platform.platform || platform.name,
                              );
                              const isUniversal = !!promptPage.is_universal;
                              return (
                                <div
                                  key={idx}
                                  className="relative bg-gray-50 rounded-xl shadow p-4 pt-8 flex flex-col items-start border border-gray-100 animate-slideup"
                                  style={{
                                    animationDelay: `${300 + idx * 100}ms`,
                                  }}
                                >
                                  {/* Icon in top-left corner */}
                                  <div
                                    className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center"
                                    title={label}
                                  >
                                    <Icon
                                      className="w-7 h-7"
                                      style={{
                                        color:
                                          businessProfile?.primary_color ||
                                          "#4F46E5",
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-3 mb-4 mt-0">
                                    <div
                                      className={`text-2xl font-bold ${businessProfile?.primary_font || "font-inter"}`}
                                      style={{
                                        color: businessProfile?.primary_color || "#4F46E5",
                                        marginTop: "-5px",
                                        marginLeft: "4px"
                                      }}
                                    >
                                      Leave a review on {(platform.platform || platform.name) === "Google Business Profile" ? "Google" : (platform.platform || platform.name)}
                                    </div>
                                    {platform.customInstructions &&
                                      platform.customInstructions.trim() && (
                                        <button
                                          type="button"
                                          className="ml-2 focus:outline-none"
                                          onClick={() =>
                                            setOpenInstructionsIdx(
                                              openInstructionsIdx === idx
                                                ? null
                                                : idx,
                                            )
                                          }
                                          aria-label="Show custom instructions"
                                          style={{ verticalAlign: "middle" }}
                                        >
                                          <FaQuestionCircle
                                            className="inline-block w-5 h-5 align-middle relative"
                                            style={{
                                              color:
                                                businessProfile?.primary_color ||
                                                "#1A237E",
                                              top: "-2px",
                                            }}
                                          />
                                        </button>
                                      )}
                                  </div>
                                  {/* Popup for custom instructions */}
                                  {openInstructionsIdx === idx &&
                                    platform.customInstructions &&
                                    platform.customInstructions.trim() && (
                                      <div
                                        className="absolute z-50 left-1/2 -translate-x-1/2 top-10 bg-white border border-yellow-300 rounded shadow-lg p-4 text-yellow-900 text-sm max-w-xs w-max animate-fadein"
                                        style={{ minWidth: 220 }}
                                      >
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="font-semibold">
                                            Instructions
                                          </span>
                                          <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-700 ml-2"
                                            onClick={() =>
                                              setOpenInstructionsIdx(null)
                                            }
                                            aria-label="Close instructions"
                                          >
                                            ×
                                          </button>
                                        </div>
                                        <div>{platform.customInstructions}</div>
                                      </div>
                                    )}
                                  <div className="flex flex-col md:flex-row gap-4 mb-2 w-full">
                                    <div className="flex-1 min-w-[150px] max-w-[200px]">
                                      <label
                                        htmlFor={`reviewerFirstName-${idx}`}
                                        className="block text-sm font-medium text-gray-700"
                                      >
                                        First Name{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        id={`reviewerFirstName-${idx}`}
                                        value={reviewerFirstNames[idx]}
                                        onChange={(e) =>
                                          handleFirstNameChange(
                                            idx,
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ezra"
                                        className="w-full mt-1 mb-2 p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                      />
                                    </div>
                                    <div className="flex-1 min-w-[150px] max-w-[200px]">
                                      <label
                                        htmlFor={`reviewerLastName-${idx}`}
                                        className="block text-sm font-medium text-gray-700"
                                      >
                                        Last Name{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        id={`reviewerLastName-${idx}`}
                                        value={reviewerLastNames[idx]}
                                        onChange={(e) =>
                                          handleLastNameChange(
                                            idx,
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Scout"
                                        className="w-full mt-1 mb-2 p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                      />
                                    </div>
                                    <div className="flex-1 min-w-[200px] max-w-[400px]">
                                      <label
                                        htmlFor={`reviewerRole-${idx}`}
                                        className="block text-sm font-medium text-gray-700"
                                      >
                                        Role/Position/Occupation
                                      </label>
                                      <input
                                        type="text"
                                        id={`reviewerRole-${idx}`}
                                        value={reviewerRoles[idx]}
                                        onChange={(e) =>
                                          setReviewerRoles((roles) =>
                                            roles.map((r, i) =>
                                              i === idx ? e.target.value : r,
                                            ),
                                          )
                                        }
                                        placeholder="Store Manager, GreenSprout Co-Op"
                                        className="w-full mt-1 mb-2 p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                      />
                                    </div>
                                  </div>
                                  <textarea
                                    className="w-full mt-2 mb-4 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Write your review here..."
                                    value={
                                      isUniversal
                                        ? platformReviewTexts[idx] || ""
                                        : platformReviewTexts[idx] || ""
                                    }
                                    onChange={(e) =>
                                      handleReviewTextChange(
                                        idx,
                                        e.target.value,
                                      )
                                    }
                                    rows={5}
                                  />
                                  {submitError && (
                                    <div className="text-red-500 text-sm mb-2">
                                      {submitError}
                                    </div>
                                  )}
                                  <div className="flex justify-between w-full">
                                    {aiButtonEnabled && (
                                      <button
                                        onClick={() => handleRewriteWithAI(idx)}
                                        disabled={aiLoading === idx}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        type="button"
                                      >
                                        <FaPenFancy
                                          style={{
                                            color:
                                              businessProfile?.primary_color ||
                                              "#4F46E5",
                                          }}
                                        />
                                        <span
                                          style={{
                                            color:
                                              businessProfile?.primary_color ||
                                              "#4F46E5",
                                          }}
                                        >
                                          {aiLoading === idx
                                            ? "Generating..."
                                            : "Generate with AI"}
                                        </span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        handleCopyAndSubmit(idx, platform.url)
                                      }
                                      className="px-4 py-2 text-white rounded hover:opacity-90 transition-colors"
                                      style={{
                                        backgroundColor:
                                          businessProfile?.secondary_color ||
                                          "#4F46E5",
                                      }}
                                      disabled={isSubmitting === idx}
                                      type="button"
                                      title="Copies your review and takes you to review site"
                                    >
                                      {isSubmitting === idx ? (
                                        <span className="flex items-center justify-center">
                                          <FiveStarSpinner
                                            size={18}
                                            color1="#a5b4fc"
                                            color2="#6366f1"
                                          />
                                        </span>
                                      ) : (
                                        "Copy & Submit"
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  {/* Website and Social Media Card */}
                  {(businessProfile?.facebook_url ||
                    businessProfile?.instagram_url ||
                    businessProfile?.bluesky_url ||
                    businessProfile?.tiktok_url ||
                    businessProfile?.youtube_url ||
                    businessProfile?.linkedin_url ||
                    businessProfile?.pinterest_url) && (
                    <div className="mb-8 bg-gray-50 rounded-2xl shadow p-8 animate-slideup">
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
                              Visit Our Website
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
                            {`Follow ${businessProfile?.business_name || "us"} on Social`}
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
                  )}
                </>
              )}

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
                      href="https://promptreviews.com"
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
              className="w-full rounded-lg border border-gray-300 p-3 mb-4 text-base bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              value={fallbackModalText}
              readOnly
              rows={5}
              onFocus={(e) => e.target.select()}
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
            setSentiment(sentimentValue);
            setSentimentComplete(true);
          }}
          headerColor={businessProfile?.primary_color || "#4F46E5"}
          buttonColor={businessProfile?.secondary_color || "#818CF8"}
          fontFamily={businessProfile?.primary_font || "Inter"}
        />
      )}
    </div>
  );
}
