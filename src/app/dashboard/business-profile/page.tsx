"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAuthGuard } from "@/utils/authGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountSelection } from "@/utils/accountSelectionHooks";
import Icon from "@/components/Icon";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { isAdmin } from "@/utils/admin";
import BusinessProfileForm from "../components/BusinessProfileForm";
import DashboardCard from "../components/DashboardCard";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import imageCompression from 'browser-image-compression';
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import { trackEvent, GA_EVENTS } from "../../../utils/analytics";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";
import WelcomePopup from "@/app/components/WelcomePopup";

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

interface Platform {
  name: string;
  url: string;
  wordCount: number;
  customPlatform?: string;
}

export default function BusinessProfilePage() {
  const supabase = createClient();
  const { selectedAccount, loading: accountLoading, availableAccounts } = useAccountSelection();
  


  useAuthGuard();
  const { user } = useAuth();
  const [form, setForm] = useState({
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [noProfile, setNoProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<string[]>([""]);
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: "", url: "", wordCount: 200 },
  ]);
  const [platformErrors, setPlatformErrors] = useState<string[]>([]);
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
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Handler for closing the welcome popup
  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenBusinessWelcome', 'true');
    }
  };

  useEffect(() => {
    const loadBusinessProfile = async () => {
      try {
        // Wait for account selection to complete
        if (accountLoading || !selectedAccount) {
          console.log('Waiting for account selection to complete...');
          return;
        }

        console.log('🔄 Loading business profile for account:', selectedAccount.account_id);
        console.log('🔍 DEBUG: Full selectedAccount object:', selectedAccount);
        console.log('🔍 DEBUG: Account loading state:', accountLoading);
        setLoading(true);
        setError("");
        setSuccess("");

        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          router.push("/auth/sign-in");
          return;
        }

        // Use selected account ID instead of user ID
        const currentAccountId = selectedAccount.account_id;
        setAccountId(currentAccountId);

        // Load business profile for the selected account
        console.log('🔍 DEBUG: Querying businesses table with account_id:', currentAccountId);
        
        let businessProfiles, businessError;
        
        // DEVELOPMENT MODE: Use API endpoint to bypass RLS issues
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true') {
          console.log('🔧 DEV MODE: Using API endpoint to fetch businesses');
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
        
        console.log('🔍 DEBUG: Business query result:', { businessProfiles, businessError });
        const businessData = businessProfiles?.[0];
        console.log('🔍 DEBUG: Selected business data:', businessData);

        if (businessError) {
          console.error("Error loading business profile:", businessError);
          setError("Failed to load business profile");
          setNoProfile(true);
        } else if (!businessData) {
          // No business profile found for this account
          console.log('📝 No business profile found for account:', currentAccountId);
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
          setPlatforms([{ name: "", url: "", wordCount: 200 }]);
          setPlatformErrors([""]);
          setLogoUrl(null);
          setNoProfile(true);
        } else if (businessData) {
          console.log('✅ Business profile loaded for account:', currentAccountId, 'Business name:', businessData.name);
          setForm({
            ...businessData,
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
          // Initialize platforms from JSON or fallback
          let loadedPlatforms = [{ name: "", url: "", wordCount: 200 }];
          if (Array.isArray(businessData.review_platforms)) {
            loadedPlatforms = businessData.review_platforms;
          }
          setPlatforms(loadedPlatforms);
          setPlatformErrors(loadedPlatforms.map(() => ""));
          setLogoUrl(businessData.logo_url || null);
          setNoProfile(false);
        }

        // Check if this is the first time visiting the business profile page
        if (typeof window !== 'undefined') {
          const hasSeenBusinessWelcome = localStorage.getItem('hasSeenBusinessWelcome');
          if (!hasSeenBusinessWelcome) {
            setShowWelcomePopup(true);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading business profile:", error);
        setError("Failed to load business profile");
        setLoading(false);
      }
    };

    loadBusinessProfile();
  }, [router, supabase, selectedAccount, accountLoading]);

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

  const handlePlatformChange = (
    idx: number,
    field: "name" | "url" | "customPlatform" | "wordCount",
    value: string
  ) => {
    const newPlatforms = [...platforms];
    if (field === "wordCount") {
      newPlatforms[idx] = { ...newPlatforms[idx], wordCount: parseInt(value) || 200 };
    } else if (field === "customPlatform") {
      newPlatforms[idx] = { ...newPlatforms[idx], customPlatform: value };
    } else {
      newPlatforms[idx] = { ...newPlatforms[idx], [field]: value };
    }
    setPlatforms(newPlatforms);
  };

  const addPlatform = () => {
    setPlatforms([...platforms, { name: "", url: "", wordCount: 200 }]);
  };

  const removePlatform = (idx: number) => {
    setPlatforms(platforms.filter((_, i) => i !== idx));
  };

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
    
    console.log("Logo file selected:", file.name, file.size, file.type);
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setLogoError("Please upload an image under 10MB. Large images may fail to process.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      setLogoError("Only PNG, JPG, or WebP images are allowed.");
      return;
    }
    
    try {
      console.log("Starting image compression for web version...");
      // Create web version (optimized for fast loading)
      const webVersion = await imageCompression(file, {
        maxSizeMB: 0.3, // 300KB for web display
        maxWidthOrHeight: 400, // 400px for web
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.8,
      });
      
      console.log("Starting image compression for print version...");
      // Create print version (optimized for print quality)
      const printVersion = await imageCompression(file, {
        maxSizeMB: 2.0, // 2MB for better print quality
        maxWidthOrHeight: 1200, // 1200px for print quality
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.95, // Higher quality for print
      });
      
      console.log("Web version size:", webVersion.size, "Print version size:", printVersion.size);
      
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
      console.error("Missing logoUrl or croppedAreaPixels for crop confirmation");
      return;
    }
    
    try {
      console.log("Starting image cropping for web version...");
      const croppedWebBlob = await getCroppedImg(logoUrl, croppedAreaPixels);
      console.log("Web image cropping successful, blob size:", croppedWebBlob.size);
      
      const croppedWebFile = new File(
        [croppedWebBlob],
        (rawLogoFile?.name?.replace(/\.[^.]+$/, '') || "logo") + ".webp",
        { type: "image/webp" },
      );
      
      // If we have a print version, crop it too
      let croppedPrintFile = null;
      if (rawLogoPrintFile) {
        console.log("Starting image cropping for print version...");
        const printLogoUrl = URL.createObjectURL(rawLogoPrintFile);
        const croppedPrintBlob = await getCroppedImg(printLogoUrl, croppedAreaPixels);
        console.log("Print image cropping successful, blob size:", croppedPrintBlob.size);
        
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
      console.log("Form submission already in progress, ignoring duplicate submission");
      return;
    }
    
    console.log("Starting form submission...");
    setIsSubmitting(true);
    setLoading(true);
    setError("");
    setSuccess("");
    setLogoError("");
    
    // Add timeout to prevent endless loading
    const timeoutId = setTimeout(() => {
      console.error("Form submission timed out after 30 seconds");
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
      
      console.log("User authenticated, proceeding with logo upload...");
      let uploadedLogoUrl = logoUrl;
      let uploadedLogoPrintUrl = null;
      
      if (logoFile) {
        console.log("Logo file detected, starting upload process...");
        try {
          // Always use the 'logos' bucket and store in 'business-logos/{account_id}.webp' for consistency
          const bucketName = 'logos';
          const webFilePath = `business-logos/${selectedAccount?.account_id}.webp`;
          const printFilePath = `business-logos/${selectedAccount?.account_id}_print.webp`;
          
          console.log("Uploading web logo to:", bucketName, webFilePath, "with file:", logoFile);
          
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
            console.log("Web logo upload successful, getting public URL...");
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(webFilePath);
            console.log("Supabase publicUrlData:", publicUrlData);
            uploadedLogoUrl = publicUrlData?.publicUrl || null;
          }
          
          // Upload print version if available
          if (logoPrintFile) {
            console.log("Uploading print logo to:", bucketName, printFilePath, "with file:", logoPrintFile);
            
            const { error: printUploadError } = await supabase.storage
              .from(bucketName)
              .upload(printFilePath, logoPrintFile, {
                upsert: true,
                contentType: "image/webp",
              });
            
            if (!printUploadError) {
              console.log("Print logo upload successful, getting public URL...");
              const { data: printPublicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(printFilePath);
              console.log("Print logo publicUrlData:", printPublicUrlData);
              uploadedLogoPrintUrl = printPublicUrlData?.publicUrl || null;
            } else {
              console.error("Print logo upload failed:", printUploadError);
            }
          }
        } catch (uploadException) {
          console.error("Exception during logo upload:", uploadException);
          setLogoError("Failed to upload logo, but profile will be saved.");
        }
      } else {
        console.log("No logo file to upload, proceeding with profile update...");
      }
      
      console.log("Updating business profile in database...");
      console.log("Form data being sent:", {
        name: form.name,
        company_values: form.company_values,
        differentiators: form.differentiators,
        years_in_business: form.years_in_business,
        industries_served: form.industries_served,
        taglines: form.taglines,
        keywords: form.keywords,
        team_info: form.team_info,
        review_platforms: platforms,
        platform_word_counts: form.platform_word_counts,
        logo_url: uploadedLogoUrl,
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
        services_offered: services,
      });
      
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          name: form.name,
          company_values: form.company_values,
          differentiators: form.differentiators,
          years_in_business: form.years_in_business,
          industries_served: form.industries_served,
          taglines: form.taglines,
          keywords: form.keywords,
          team_info: form.team_info,
          about_us: form.about_us,
          review_platforms: platforms,
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
          services_offered: services,
        })
        .eq("account_id", selectedAccount?.account_id);
        
      if (updateError) {
        console.error("Database update error:", updateError);
        console.error("Error code:", updateError.code);
        console.error("Error message:", updateError.message);
        console.error("Error details:", updateError.details);
        console.error("Error hint:", updateError.hint);
        setError(`Database update failed: ${updateError.message}`);
        setLoading(false);
        setIsSubmitting(false);
        clearTimeout(timeoutId);
        return;
      }
      
      console.log("Profile update successful!");
      setSuccess("Profile updated successfully!");
      
      // Mark business profile task as completed when user successfully saves
      try {
        await markTaskAsCompleted(user.id, "business-profile");
        console.log("Business profile task marked as completed");
        
        // Dispatch custom event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('business-profile-completed'));
        }
      } catch (taskError) {
        console.error("Error marking business profile task as complete:", taskError);
        // Don't fail the entire operation if task marking fails
      }
      
      setLoading(false);
      setIsSubmitting(false);
      clearTimeout(timeoutId);
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

  if (loading || accountLoading) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
        <div className="page relative w-full max-w-[1000px] rounded-2xl bg-white shadow-lg pt-4 px-8 md:px-12 pb-8">
          <div className="icon absolute -top-4 -left-4 sm:-top-6 sm:-left-6 z-10 bg-white rounded-full shadow-lg p-3 sm:p-4 flex items-center justify-center">
            <Icon name="FaStore" className="w-9 h-9 text-slate-blue" size={36} />
          </div>
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <AppLoader />
          </div>
        </div>
      </div>
    );
  }

  if (noProfile) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-4">No Business Found</h1>
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

      {/* Top success message */}
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
        platforms={platforms}
        setPlatforms={setPlatforms}
        platformErrors={platformErrors}
        setPlatformErrors={setPlatformErrors}
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
        handlePlatformChange={handlePlatformChange}
        addPlatform={addPlatform}
        removePlatform={removePlatform}
        handleLogoChange={handleLogoChange}
        handleCropConfirm={handleCropConfirm}
        handleCropCancel={handleCropCancel}
        formId="business-profile-form"
      />
      {/* Bottom right Save button */}
      <div className="flex justify-end mt-8 pr-4 md:pr-6">
        <button
          type="submit"
          form="business-profile-form"
          disabled={isSubmitting}
          className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Bottom success message */}
      {success && (
        <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-md text-base font-medium border border-green-200">
          {success}
        </div>
      )}

      {/* Welcome Popup for first-time visitors */}
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={handleWelcomeClose}
        title="Welcome to Your Business Profile!"
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
      />
    </PageCard>
  );
}
