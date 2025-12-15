"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAuthGuard } from "@/utils/authGuard";
import { useBusinessData, useAuthUser, useAccountData } from "@/auth/hooks/granularAuthHooks";
import { useAuth } from "@/auth";
import Icon from "@/components/Icon";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import { isAdmin } from "@/utils/admin";
import BusinessProfileForm from "../components/BusinessProfileForm";
import DashboardCard from "../components/DashboardCard";
import PageLoader from "@/app/(app)/components/PageLoader";
import PageCard from "@/app/(app)/components/PageCard";
import imageCompression from 'browser-image-compression';
import { trackEvent, GA_EVENTS } from "@/utils/analytics";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";
import WelcomePopup from "@/app/(app)/components/WelcomePopup";
import ImportFromWebsite from "./components/ImportFromWebsite";

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


export default function BusinessProfilePage() {
  const supabase = createClient();
  const { selectedAccountId, account } = useAccountData();
  const { accountLoading } = useAuth();
  
  // Consolidated loading state to prevent flickering
  const [pageState, setPageState] = useState<'initial' | 'loading' | 'ready' | 'no-profile'>('initial');
  const mountedRef = useRef(true);
  
  // Debug logging for account selection (moved after state initialization)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
    }
  }, [selectedAccountId, accountLoading, pageState]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (pageState === 'initial' || pageState === 'loading') {
      const timeout = setTimeout(() => {
        if (mountedRef.current) {
          setPageState('ready');
          setError('Loading timeout - please refresh the page');
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [pageState]);
  
  // Preload welcome image to prevent loading delay
  useEffect(() => {
    const img = new Image();
    img.src = "https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-telescope-capturing-reviews.png";
  }, []);

  useAuthGuard();
  const { user } = useAuthUser();
  const { business } = useBusinessData();
  
  // Storage key for form data persistence
  const formStorageKey = 'businessProfileForm';
  
  const [form, setForm] = useState(() => {
    // Try to restore from localStorage first
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed;
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
    }
    
    // Fall back to default values
    return {
    name: "",
    company_values: "",
    differentiators: "",
    years_in_business: "",
    industries_served: "",
    taglines: "",
    keywords: "",
    team_info: "",
    about_us: "",
    review_platforms: [],
    platform_word_counts: "",
    facebook_url: "",
    instagram_url: "",
    bluesky_url: "",
    tiktok_url: "",
    youtube_url: "",
    linkedin_url: "",
    pinterest_url: "",
    default_offer_enabled: false,
    default_offer_title: "Special offer",
    default_offer_body: "",
    default_offer_url: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "",
    phone: "",
    business_website: "",
    offer_learn_more_url: "",
    business_email: "",
    ai_dos: "",
    ai_donts: "",
    kickstarters_enabled: false,
    selected_kickstarters: [],
    custom_kickstarters: [],
    kickstarters_background_design: false,
    };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [noProfile, setNoProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Restore services from localStorage
  const [services, setServices] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('businessProfileServices');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [""];
  });
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPrintFile, setLogoPrintFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [rawLogoFile, setRawLogoFile] = useState<File | null>(null);
  const [rawLogoPrintFile, setRawLogoPrintFile] = useState<File | null>(null);
  const [copySuccess, setCopySuccess] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Handler for closing the welcome popup
  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenBusinessWelcome', 'true');
    }
  };

  // Handler for importing business info from website
  const handleWebsiteImport = (data: {
    name?: string;
    about_us?: string;
    services_offered?: string[];
    keywords?: string;
    taglines?: string;
    phone?: string;
    business_email?: string;
    industry?: string;
    differentiators?: string;
    facebook_url?: string;
    instagram_url?: string;
    linkedin_url?: string;
    youtube_url?: string;
    tiktok_url?: string;
    pinterest_url?: string;
    bluesky_url?: string;
  }, websiteUrl: string) => {
    // Only fill empty fields - don't overwrite existing data
    const updates: Record<string, string> = {};

    // Map imported data to form fields, only if current field is empty
    if (data.name && !form.name?.trim()) updates.name = data.name;
    if (data.about_us && !form.about_us?.trim()) updates.about_us = data.about_us;
    if (data.keywords && !form.keywords?.trim()) updates.keywords = data.keywords;
    if (data.taglines && !form.taglines?.trim()) updates.taglines = data.taglines;
    if (data.differentiators && !form.differentiators?.trim()) updates.differentiators = data.differentiators;
    if (data.phone && !form.phone?.trim()) updates.phone = data.phone;
    if (data.business_email && !form.business_email?.trim()) updates.business_email = data.business_email;
    if (websiteUrl && !form.business_website?.trim()) updates.business_website = websiteUrl;

    // Industry - store in industries_served field (text field)
    if (data.industry && !form.industries_served?.trim()) updates.industries_served = data.industry;

    // Social media URLs
    if (data.facebook_url && !form.facebook_url?.trim()) updates.facebook_url = data.facebook_url;
    if (data.instagram_url && !form.instagram_url?.trim()) updates.instagram_url = data.instagram_url;
    if (data.linkedin_url && !form.linkedin_url?.trim()) updates.linkedin_url = data.linkedin_url;
    if (data.youtube_url && !form.youtube_url?.trim()) updates.youtube_url = data.youtube_url;
    if (data.tiktok_url && !form.tiktok_url?.trim()) updates.tiktok_url = data.tiktok_url;
    if (data.pinterest_url && !form.pinterest_url?.trim()) updates.pinterest_url = data.pinterest_url;
    if (data.bluesky_url && !form.bluesky_url?.trim()) updates.bluesky_url = data.bluesky_url;

    // Update form state
    if (Object.keys(updates).length > 0) {
      setForm((prev: typeof form) => ({ ...prev, ...updates }));
    }

    // Handle services separately - only add if services are empty
    if (data.services_offered && data.services_offered.length > 0) {
      const currentServicesEmpty = services.length === 0 || (services.length === 1 && !services[0]?.trim());
      if (currentServicesEmpty) {
        setServices(data.services_offered);
      }
    }

    // Show success message
    const fieldCount = Object.keys(updates).length + (data.services_offered?.length ? 1 : 0);
    if (fieldCount > 0) {
      setSuccess(`Imported ${fieldCount} field${fieldCount > 1 ? 's' : ''} from your website. Review and edit as needed.`);
      setTimeout(() => setSuccess(""), 5000);
    }
  };

  // Auto-save form data to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && form) {
        localStorage.setItem(formStorageKey, JSON.stringify(form));
      }
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(saveTimeout);
  }, [form, formStorageKey]);

  // Also save services separately
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('businessProfileServices', JSON.stringify(services));
      }
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [services]);

  useEffect(() => {
    const loadBusinessProfile = async () => {
      try {
        // Wait for account selection to complete
        if (accountLoading) {
          return;
        }
        
        if (!selectedAccountId) {
          // If we have no selected account and loading is done, set to ready to prevent infinite loading
          if (!accountLoading && mountedRef.current) {
            setPageState('ready');
            setNoProfile(true);
          }
          return;
        }

        // Skip if we're already in a ready state
        if (pageState === 'ready' && !loading) {
          return;
        }
        
        // Set loading state only if we're in initial state
        if (pageState === 'initial') {
          setPageState('loading');
        }

        setLoading(true);
        setError("");
        setSuccess("");

        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          router.push("/auth/sign-in");
          return;
        }

        // Use selected account ID instead of user ID
        const currentAccountId = selectedAccountId;
        setAccountId(currentAccountId);

        // Load business profile for the selected account
        
        let businessProfiles, businessError;
        
        // DEVELOPMENT MODE: Use API endpoint to bypass RLS issues
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true') {
          try {
            const response = await fetch(`/api/businesses?account_id=${currentAccountId}`);
            const apiResult = await response.json();
            if (response.ok) {
              businessProfiles = apiResult.businesses || [];
              businessError = null;
            } else {
              businessProfiles = [];
              businessError = { message: apiResult.error || 'API error' };
            }
          } catch (err) {
            businessProfiles = [];
            businessError = { message: err instanceof Error ? err.message : String(err) };
          }
        } else {
          // Normal mode: Use Supabase client directly
          const result = await supabase
            .from("businesses")
            .select("*")
            .eq("account_id", currentAccountId)
            .order("created_at", { ascending: false })
            .limit(1);
          businessProfiles = result.data;
          businessError = result.error;
        }
        
        const businessData = businessProfiles?.[0];

        if (businessError) {
          console.error("Error loading business profile:", businessError);
          setError("Failed to load business profile");
          setNoProfile(true);
        } else if (!businessData) {
          // No business profile found for this account
          // Reset form to empty state
          setForm({
            name: "",
            company_values: "",
            differentiators: "",
            years_in_business: "",
            industries_served: "",
            taglines: "",
            keywords: "",
            team_info: "",
            about_us: "",
            review_platforms: [],
            platform_word_counts: "",
            facebook_url: "",
            instagram_url: "",
            bluesky_url: "",
            tiktok_url: "",
            youtube_url: "",
            linkedin_url: "",
            pinterest_url: "",
            default_offer_enabled: false,
            default_offer_title: "Special offer",
            default_offer_body: "",
            default_offer_url: "",
            address_street: "",
            address_city: "",
            address_state: "",
            address_zip: "",
            address_country: "",
            phone: "",
            business_website: "",
            offer_learn_more_url: "",
            business_email: "",
            ai_dos: "",
            ai_donts: "",
            kickstarters_enabled: false,
            selected_kickstarters: [],
            kickstarters_background_design: false,
          });
          setServices([""]);
          setLogoUrl(null);
          setNoProfile(true);
        } else if (businessData) {
          if (process.env.NODE_ENV === 'development') {
            console.log("=== Loading business data into form ===");
            console.log("businessData.about_us:", businessData.about_us);
            console.log("businessData.services_offered:", businessData.services_offered);
          }
          setForm({
            ...businessData,
            // Explicitly set about_us to ensure it's loaded (handles null case)
            about_us: businessData.about_us || "",
            business_website: businessData.business_website || "",
            phone: businessData.phone || "",
            address_street: businessData.address_street || "",
            address_city: businessData.address_city || "",
            address_state: businessData.address_state || "",
            address_zip: businessData.address_zip || "",
            address_country: businessData.address_country || "",
            default_offer_url: businessData.default_offer_url || "",
            business_email: businessData.business_email || "",
            ai_dos: businessData.ai_dos || "",
            ai_donts: businessData.ai_donts || "",
            kickstarters_enabled: businessData.kickstarters_enabled || false,
            selected_kickstarters: businessData.selected_kickstarters || [],
            custom_kickstarters: businessData.custom_kickstarters || [],
            kickstarters_background_design: businessData.kickstarters_background_design ?? false,
          });
          setServices(
            Array.isArray(businessData.services_offered)
              ? businessData.services_offered
              : typeof businessData.services_offered === "string" &&
                  businessData.services_offered.length > 0
                ? businessData.services_offered.trim().startsWith("[") &&
                  businessData.services_offered.trim().endsWith("]")
                  ? (() => {
                      try {
                        return JSON.parse(businessData.services_offered);
                      } catch {
                        return [businessData.services_offered];
                      }
                    })()
                  : businessData.services_offered.split("\n")
                : [],
          );
          setLogoUrl(businessData.logo_url || null);
          setBusinessId(businessData.id); // Store business ID for updates
          setNoProfile(false);

          // Set page to ready immediately when business data is loaded
          setPageState('ready');
        }

        // Check if this is the first time visiting the business profile page
        // TEMPORARILY DISABLED due to positioning issues
        if (typeof window !== 'undefined') {
          const hasSeenBusinessWelcome = localStorage.getItem('hasSeenBusinessWelcome');
          if (!hasSeenBusinessWelcome) {
            // setShowWelcomePopup(true); // DISABLED TEMPORARILY
            // Auto-mark as seen to prevent future popups until issue is fixed
            localStorage.setItem('hasSeenBusinessWelcome', 'true');
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading business profile:", error);
        setError("Failed to load business profile");
        setLoading(false);
        if (mountedRef.current) {
          setPageState('ready');
        }
      }
    };

    loadBusinessProfile();
  }, [router, supabase, selectedAccountId, accountLoading, loading, pageState]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleServiceChange = (idx: number, value: string) => {
    const newServices = [...services];
    newServices[idx] = value;
    setServices(newServices);
  };

  const addService = () => setServices([...services, ""]);

  const removeService = (idx: number) =>
    setServices(services.filter((_, i) => i !== idx));


  // Helper to get cropped image as a blob
  const getCroppedImg = async (imageSrc: string, cropPixels: any) => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement("canvas");
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height,
    );
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, "image/webp");
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError("");
    const file = e.target.files?.[0];
    if (!file) return;
    
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setLogoError("Please upload an image under 10MB. Large images may fail to process.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      setLogoError("Only PNG, JPG, or WebP images are allowed.");
      return;
    }
    
    try {
      // Create web version (optimized for fast loading)
      const webVersion = await imageCompression(file, {
        maxSizeMB: 0.3, // 300KB for web display
        maxWidthOrHeight: 400, // 400px for web
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.8,
      });
      
      // Create print version (optimized for print quality)
      const printVersion = await imageCompression(file, {
        maxSizeMB: 2.0, // 2MB for better print quality
        maxWidthOrHeight: 1200, // 1200px for print quality
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.95, // Higher quality for print
      });
      
      
      // Store both versions for upload after cropping
      setRawLogoFile(webVersion); // Use web version for cropping preview
      setRawLogoPrintFile(printVersion); // Store print version for later upload
      setShowCropper(true);
      setLogoUrl(URL.createObjectURL(webVersion));
    } catch (err) {
      console.error("Image compression failed:", err);
      setLogoError("Failed to compress image. Please try another file.");
      return;
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCropConfirm = async () => {
    if (!logoUrl || !croppedAreaPixels) {
      return;
    }
    
    try {
      const croppedWebBlob = await getCroppedImg(logoUrl, croppedAreaPixels);
      
      const croppedWebFile = new File(
        [croppedWebBlob],
        (rawLogoFile?.name?.replace(/\.[^.]+$/, '') || "logo") + ".webp",
        { type: "image/webp" },
      );
      
      // If we have a print version, crop it too
      let croppedPrintFile = null;
      if (rawLogoPrintFile) {
        const printLogoUrl = URL.createObjectURL(rawLogoPrintFile);
        const croppedPrintBlob = await getCroppedImg(printLogoUrl, croppedAreaPixels);
        
        croppedPrintFile = new File(
          [croppedPrintBlob],
          (rawLogoPrintFile?.name?.replace(/\.[^.]+$/, '') || "logo") + "_print.webp",
          { type: "image/webp" },
        );
      }
      
      setLogoFile(croppedWebFile);
      setLogoPrintFile(croppedPrintFile); // Store print version for upload
      setLogoUrl(URL.createObjectURL(croppedWebFile));
      setShowCropper(false);
    } catch (err) {
      console.error("Image cropping failed:", err);
      setLogoError("Failed to crop image. Please try again.");
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setLogoFile(null);
    setLogoPrintFile(null);
    setLogoUrl(null);
    setRawLogoFile(null);
    setRawLogoPrintFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    // Verify account is selected before saving
    if (!selectedAccountId) {
      console.error("No account selected - cannot save");
      setError("No account selected. Please refresh the page and try again.");
      return;
    }

    // Debug logging - always enabled to help troubleshoot save issues
    console.log("=== handleSubmit START ===");
    console.log("Selected Account ID:", selectedAccountId);
    console.log("Business ID:", businessId);
    console.log("Form about_us:", form.about_us);
    console.log("Form about_us length:", form.about_us?.length);
    console.log("Services state:", services);
    console.log("Services length:", services?.length);

    setIsSubmitting(true);
    setLoading(true);
    setError("");
    setSuccess("");
    setLogoError("");

    // Add timeout to prevent endless loading
    const timeoutId = setTimeout(() => {
      setError("Request timed out. Please try again.");
      setLoading(false);
      setIsSubmitting(false);
    }, 30000);
    
    try {
      const {
        data: { user },
        error: userError,
      } = await getUserOrMock(supabase);
      if (userError || !user) {
        console.error("User authentication error:", userError);
        setError("You must be signed in to update your business profile.");
        setLoading(false);
        setIsSubmitting(false);
        clearTimeout(timeoutId);
        return;
      }
      
      let uploadedLogoUrl = logoUrl;
      let uploadedLogoPrintUrl = null;
      
      if (logoFile) {
        try {
          // Always use the 'logos' bucket and store in 'business-logos/{account_id}.webp' for consistency
          const bucketName = 'logos';
          const webFilePath = `business-logos/${selectedAccountId}.webp`;
          const printFilePath = `business-logos/${selectedAccountId}_print.webp`;
          
          
          // Upload web version
          const { error: webUploadError } = await supabase.storage
            .from(bucketName)
            .upload(webFilePath, logoFile, {
              upsert: true,
              contentType: "image/webp",
            });
          
          if (webUploadError) {
            if (webUploadError.message && webUploadError.message.includes("Bucket not found")) {
              setLogoError("Logo upload failed: Storage bucket not found in this environment. Please create the bucket or contact support. Profile will be saved without a logo.");
              console.error("Supabase upload error: Bucket not found. Skipping logo upload.");
            } else {
              setLogoError("Failed to upload logo, but profile will be saved.");
              console.error("Supabase upload error details:", webUploadError);
              console.error("Error message:", webUploadError.message);
            }
            // Continue without logo upload rather than failing the entire save
            uploadedLogoUrl = logoUrl;
          } else {
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(webFilePath);
            uploadedLogoUrl = publicUrlData?.publicUrl || null;
          }
          
          // Upload print version if available
          if (logoPrintFile) {
            
            const { error: printUploadError } = await supabase.storage
              .from(bucketName)
              .upload(printFilePath, logoPrintFile, {
                upsert: true,
                contentType: "image/webp",
              });
            
            if (!printUploadError) {
              const { data: printPublicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(printFilePath);
              uploadedLogoPrintUrl = printPublicUrlData?.publicUrl || null;
            } else {
              console.error("Print logo upload failed:", printUploadError);
            }
          }
        } catch (uploadException) {
          setLogoError("Failed to upload logo, but profile will be saved.");
        }
      } else {
      }
      
      
      // Filter out empty services before saving
      const filteredServices = services
        .map(s => s?.trim())
        .filter(s => s && s.length > 0);

      // Build the update payload
      const updatePayload = {
        name: form.name,
        company_values: form.company_values,
        differentiators: form.differentiators,
        years_in_business: form.years_in_business,
        industries_served: form.industries_served,
        taglines: form.taglines,
        keywords: form.keywords,
        team_info: form.team_info,
        about_us: form.about_us,
        review_platforms: form.review_platforms || [],
        platform_word_counts: form.platform_word_counts,
        logo_url: uploadedLogoUrl,
        logo_print_url: uploadedLogoPrintUrl,
        facebook_url: form.facebook_url,
        instagram_url: form.instagram_url,
        bluesky_url: form.bluesky_url,
        tiktok_url: form.tiktok_url,
        youtube_url: form.youtube_url,
        linkedin_url: form.linkedin_url,
        pinterest_url: form.pinterest_url,
        default_offer_enabled: form.default_offer_enabled,
        default_offer_title: form.default_offer_title,
        default_offer_body: form.default_offer_body,
        default_offer_url: form.default_offer_url,
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
        address_country: form.address_country,
        phone: form.phone,
        business_website: form.business_website,
        offer_learn_more_url: form.offer_learn_more_url,
        business_email: form.business_email,
        ai_dos: form.ai_dos,
        ai_donts: form.ai_donts,
        kickstarters_enabled: form.kickstarters_enabled,
        selected_kickstarters: form.selected_kickstarters,
        kickstarters_background_design: form.kickstarters_background_design,
        services_offered: filteredServices,
        industry: form.industry || [],
        industries_other: form.industries_other || null,
      };

      // Debug logging - always enabled to help troubleshoot save issues
      console.log("=== Update Payload ===");
      console.log("about_us in payload:", updatePayload.about_us);
      console.log("services_offered in payload:", updatePayload.services_offered);

      let updateData: any = null;
      let updateError: any = null;

      // Use API endpoint to update business (bypasses RLS issues)
      if (businessId) {
        try {
          const response = await fetch('/api/businesses', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Selected-Account': selectedAccountId,
            },
            credentials: 'include',
            body: JSON.stringify({
              businessId,
              ...updatePayload,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            updateError = {
              message: result.error || 'Failed to update business',
              details: result.details,
              code: response.status.toString(),
            };
          } else {
            updateData = result.business;
          }
        } catch (fetchError) {
          console.error("API call failed:", fetchError);
          updateError = {
            message: fetchError instanceof Error ? fetchError.message : 'Network error',
            code: 'NETWORK_ERROR',
          };
        }
      } else {
        // Create new business via API
        try {
          const response = await fetch('/api/businesses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Selected-Account': selectedAccountId,
            },
            credentials: 'include',
            body: JSON.stringify({
              ...updatePayload,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            updateError = {
              message: result.error || 'Failed to create business',
              details: result.details,
              code: response.status.toString(),
            };
          } else {
            updateData = result.business;
            // Store the new business ID for future saves
            if (result.business?.id) {
              setBusinessId(result.business.id);
            }
          }
        } catch (fetchError) {
          console.error("API call failed:", fetchError);
          updateError = {
            message: fetchError instanceof Error ? fetchError.message : 'Network error',
            code: 'NETWORK_ERROR',
          };
        }
      }

      if (updateError) {
        console.error("Database update error:", updateError);
        console.error("Error code:", updateError.code);
        console.error("Error message:", updateError.message);
        console.error("Error details:", updateError.details);
        setError(`Database update failed: ${updateError.message}`);
        setLoading(false);
        setIsSubmitting(false);
        clearTimeout(timeoutId);
        return;
      }

      // Verify the update was successful
      if (!updateData) {
        console.error("No data returned from update - business profile may not exist for this account");
        setError("Could not update business profile. Please refresh and try again.");
        setLoading(false);
        setIsSubmitting(false);
        clearTimeout(timeoutId);
        return;
      }

      // Debug logging - always enabled
      console.log("=== Update Response ===");
      console.log("updateData:", updateData);
      console.log("services_offered returned:", updateData.services_offered);
      console.log("about_us returned:", updateData.about_us);
      
      
      // Also update the business_name in the accounts table to sync with account switcher
      // This is especially important for the primary account
      if (form.name && selectedAccountId) {
        const { error: accountUpdateError } = await supabase
          .from("accounts")
          .update({ business_name: form.name })
          .eq("id", selectedAccountId);
        
        if (accountUpdateError) {
          console.error("Failed to update business_name in accounts table:", accountUpdateError);
          // Don't fail the whole update, just log the error
        } else {
          // Dispatch event to refresh account data in the account switcher
          window.dispatchEvent(new CustomEvent('businessUpdated'));
        }
      }
      
      setSuccess("Profile updated successfully!");

      // Clear saved form data after successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem(formStorageKey);
        localStorage.removeItem('businessProfilePlatforms');
        localStorage.removeItem('businessProfileServices');
      }

      // Mark business profile task as completed when user successfully saves
      try {
        if (accountId) {
          await markTaskAsCompleted(accountId, "business-profile");
        }

        // Dispatch custom event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('business-profile-completed'));
        }
      } catch (taskError) {
        console.error("Error marking business profile task as complete:", taskError);
        // Don't fail the entire operation if task marking fails
      }

      // Reload the business profile data to sync UI with database
      // This ensures the form shows exactly what was saved
      try {
        const { data: refreshedBusiness } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", selectedAccountId)
          .single();

        if (refreshedBusiness) {
          setForm({
            ...form,
            industry: refreshedBusiness.industry || [],
            industries_other: refreshedBusiness.industries_other || "",
            // Update other fields that might have been transformed during save
            services_offered: refreshedBusiness.services_offered || [],
          });

          // Update logo URL to display the newly uploaded logo without page refresh
          if (refreshedBusiness.logo_url) {
            setLogoUrl(refreshedBusiness.logo_url);
          }

          // Update services state to reflect what was actually saved
          setServices(
            Array.isArray(refreshedBusiness.services_offered)
              ? refreshedBusiness.services_offered
              : typeof refreshedBusiness.services_offered === "string" &&
                  refreshedBusiness.services_offered.length > 0
                ? refreshedBusiness.services_offered.trim().startsWith("[") &&
                  refreshedBusiness.services_offered.trim().endsWith("]")
                  ? (() => {
                      try {
                        return JSON.parse(refreshedBusiness.services_offered);
                      } catch {
                        return [refreshedBusiness.services_offered];
                      }
                    })()
                  : refreshedBusiness.services_offered.split("\n")
                : []
          );
        }
      } catch (refetchError) {
        console.error("Error refetching business profile after save:", refetchError);
        // Don't fail - the save was successful, this is just a UI sync issue
      }

      setLoading(false);
      setIsSubmitting(false);
      clearTimeout(timeoutId);

      // Redirect to dashboard after successful save
      router.push("/dashboard");
    } catch (error) {
      console.error("Unexpected error during form submission:", error);
      console.error("Error type:", typeof error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
      setIsSubmitting(false);
      clearTimeout(timeoutId);
    }
  };

  // Show loading state only during initial load
  if (pageState === 'initial' || pageState === 'loading') {
    return <PageLoader showText={true} text="Loading business profile..." />;
  }

  if (noProfile) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-4">No business found</h1>
          <p className="mb-4">You don't have a business yet.</p>
          <a
            href="/dashboard/create-business"
            className="text-blue-600 underline"
          >
            Create your business
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <div className="w-full max-w-4xl">
        {/* Import from website section */}
        <ImportFromWebsite onImport={handleWebsiteImport} />

        <PageCard icon={<Icon name="FaStore" className="w-9 h-9 text-slate-blue" size={36} />}>
      
      <div className="flex items-start justify-between mt-2 mb-4">
        <div className="flex flex-col mt-0 md:mt-[3px]">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            Your business
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
            Fill out your business info to help Prompty AI generate authentic reviews. Refine your answers over time to get even better reviews.
          </p>
        </div>
        <div
          className="flex items-start pr-4 md:pr-6"
          style={{ alignSelf: "flex-start" }}
        >
          <button
            type="submit"
            form="business-profile-form"
            disabled={isSubmitting}
            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ marginTop: "0.25rem" }}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Top error and success messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md text-base font-medium border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md text-base font-medium border border-green-200">
          {success}
        </div>
      )}

      <BusinessProfileForm
        form={form}
        setForm={setForm}
        services={services}
        setServices={setServices}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        logoFile={logoFile}
        setLogoFile={setLogoFile}
        logoPrintFile={logoPrintFile}
        setLogoPrintFile={setLogoPrintFile}
        logoError={logoError}
        setLogoError={setLogoError}
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        showCropper={showCropper}
        setShowCropper={setShowCropper}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        croppedAreaPixels={croppedAreaPixels}
        setCroppedAreaPixels={setCroppedAreaPixels}
        rawLogoFile={rawLogoFile}
        setRawLogoFile={setRawLogoFile}
        rawLogoPrintFile={rawLogoPrintFile}
        setRawLogoPrintFile={setRawLogoPrintFile}
        loading={isSubmitting}
        error={error}
        success=""
        onSubmit={handleSubmit}
        handleChange={handleChange}
        handleServiceChange={handleServiceChange}
        addService={addService}
        removeService={removeService}
        handleLogoChange={handleLogoChange}
        handleCropConfirm={handleCropConfirm}
        handleCropCancel={handleCropCancel}
        formId="business-profile-form"
      />
      {/* Bottom right Save button */}
      <div className="flex justify-end mt-8">
        <button
          type="submit"
          form="business-profile-form"
          disabled={isSubmitting}
          className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Bottom error and success messages */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md text-base font-medium border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-md text-base font-medium border border-green-200">
          {success}
        </div>
      )}

      {/* Welcome Popup for first-time visitors - TEMPORARILY DISABLED */}
      {/* <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={handleWelcomeClose}
        title={`Hello again${selectedAccount?.first_name ? `, ${selectedAccount.first_name}` : ''}!`}
        message={`Welcome to "Your business!" This section is all about highlighting what makes your business stand out.

What you enter here can improve your AI-assisted reviews. Especially these two areas:

**1. Keywords**
Reviews can help you rank better in search engines when they contain relevant topics and keyword phrases. For example, if you sell Goose Juice (or Moose Juice) in Seattle, you might want reviewers to use phrases like **"Best Moose Juice this side of The Space Needle."** When those keywords show up in reviews, it can improve your visibility in search engines as well as AI tools like ChatGPT.

**2. AI Dos and Don'ts**
• AI Dos are preferences: e.g., **"Always imply our Goose Juice is fly"**
• AI Don'ts are things to avoid: e.g., **"And never dare say our Goose Juice is dry"**

You can update your don'ts over time by testing outputs and reviewing what gets generated.`}
        imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-teaching-about-your-business.png"
        imageAlt="Prompty teaching about your business"
        buttonText="Got it, let's go!"
      /> */}
      </PageCard>
      </div>
    </div>
  );
}
