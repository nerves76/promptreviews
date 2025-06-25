"use client";

// Deployment test comment - forcing a new commit to ensure Vercel builds the latest code

import { useState, useRef, useCallback, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAuthGuard } from "@/utils/authGuard";
import { sanitizePromptPageInsert } from "@/utils/sanitizePromptPageInsert";
import { slugify } from "@/utils/slugify";
import imageCompression from 'browser-image-compression';
import WelcomePopup from "@/app/components/WelcomePopup";
import {
  FaImage,
  FaBuilding,
  FaInfoCircle,
  FaAddressBook,
  FaList,
  FaShareAlt,
  FaClock,
  FaMapMarkerAlt,
  FaGift,
  FaStore,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { getUserOrMock, getSessionOrMock } from "@/utils/supabase";
import BusinessForm from "../components/BusinessForm";
import { useRequirePlan } from "@/utils/useRequirePlan";
import PageCard from "@/app/components/PageCard";
import { isAdmin } from "@/utils/admin";
import { trackEvent } from "@/utils/analytics";

interface Platform {
  name: string;
  url: string;
  wordCount: number;
  customPlatform?: string;
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show help"
        className="text-gray-400 hover:text-dustyPlum focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-softPeach"
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
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-dustyPlum">
          {text}
        </div>
      )}
    </span>
  );
}

export default function CreateBusinessPage() {
  useAuthGuard({ requireBusinessProfile: false });
  const [form, setForm] = useState({
    name: "",
    features_or_benefits: "",
    company_values: "",
    differentiators: "",
    years_in_business: "",
    industries_served: "",
    taglines: "",
    team_info: "",
    review_platforms: [],
    platform_word_counts: "",
    keywords: "",
    facebook_url: "",
    instagram_url: "",
    bluesky_url: "",
    tiktok_url: "",
    youtube_url: "",
    linkedin_url: "",
    pinterest_url: "",
    default_offer_enabled: false,
    default_offer_title: "Special Offer",
    default_offer_body: "",
    default_offer_url: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "",
    business_website: "",
    business_email: "",
    industry: "",
    industry_other: "",
    ai_dos: "",
    ai_donts: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: "", url: "", wordCount: 200 },
  ]);
  const [platformErrors, setPlatformErrors] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [services, setServices] = useState<string[]>([""]);
  const [success, setSuccess] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rawLogoFile, setRawLogoFile] = useState<File | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [showTrialConfirmation, setShowTrialConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [userFirstName, setUserFirstName] = useState<string>("");
  const [isAdminUser, setIsAdminUser] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Fetch account info for plan modal and welcome popup
  useEffect(() => {
    const fetchAccount = async () => {
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (!user) return;
      
      // Extract first name from user_metadata or fallback to email
      let firstName = "";
      if (user.user_metadata && user.user_metadata.first_name) {
        firstName = user.user_metadata.first_name;
      } else if (user.email) {
        firstName = user.email.split("@")[0];
      } else {
        firstName = "there";
      }
      setUserFirstName(firstName);
      
      // Check if user is admin
      const adminStatus = await isAdmin(user.id);
      setIsAdminUser(adminStatus);
      
      // Fetch account data
      const { data: accountData } = await supabase
        .from("accounts")
        .select(
          "id, plan, is_free_account, subscription_status, has_had_paid_plan, has_seen_welcome",
        )
        .eq("id", user.id)
        .single();
      setAccount(accountData);
      
      // Fetch business data
      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", user.id)
        .single();
      setBusiness(businessData);
      
      // Show welcome popup if user hasn't seen it
      if (accountData && !accountData.has_seen_welcome) {
        setShowWelcomePopup(true);
      }
    };
    fetchAccount();
  }, [supabase]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("showGrowerSuccess") === "1"
    ) {
      setShowTrialConfirmation(true);
      localStorage.removeItem("showGrowerSuccess");
      setTimeout(() => setShowTrialConfirmation(false), 4000);
    }
  }, []);

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

  const handleWelcomePopupClose = () => {
    setShowWelcomePopup(false);
    
    // Mark user as having seen the welcome popup (async operation)
    if (account) {
      const updateWelcomeStatus = async () => {
        try {
          await supabase
            .from("accounts")
            .update({ has_seen_welcome: true })
            .eq("id", account.id);
          
          // Update local state
          setAccount({ ...account, has_seen_welcome: true });
        } catch (error) {
          console.error('Error updating welcome status:', error);
        }
      };
      
      updateWelcomeStatus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLogoError("");
    setSuccess("");
    const {
      data: { user },
      error: userError,
    } = await getUserOrMock(supabase);
    if (userError || !user) {
      setError("You must be signed in to create a business profile.");
      setLoading(false);
      return;
    }
    // Ensure account exists
    await supabase
      .from("accounts")
      .upsert([{ id: user.id }], { onConflict: "id" });
    let uploadedLogoUrl = logoUrl;
    if (logoFile) {
      // Upload to Supabase Storage
      const fileExt = logoFile.name.split(".").pop();
      const filePath = `business-logos/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, logoFile, {
          upsert: true,
          contentType: logoFile.type,
        });
      if (uploadError) {
        setLogoError("Failed to upload logo.");
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);
      uploadedLogoUrl = publicUrlData?.publicUrl || null;
    }
    // Set word count to 200 for each platform
    const platformsWithWordCount = platforms.map((p) => ({
      ...p,
      wordCount: 200,
    }));
    // Create business profile
    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .upsert({
        id: user.id,
        account_id: user.id,
        name: form.name,
        features_or_benefits: Array.isArray(services)
          ? services.filter((s: string) => s && s.trim())
          : typeof services === "string"
            ? [services].filter((s: string) => s && s.trim())
            : [],
        company_values: form.company_values,
        differentiators: form.differentiators,
        years_in_business: form.years_in_business,
        industry: Array.isArray(form.industry)
          ? form.industry
          : form.industry
            ? [form.industry]
            : [],
        industries_served: form.industries_served,
        industries_other: form.industry_other,
        taglines: form.taglines,
        team_info: form.team_info,
        review_platforms: platforms,
        logo_url: uploadedLogoUrl,
        keywords: form.keywords,
        facebook_url: form.facebook_url,
        instagram_url: form.instagram_url,
        bluesky_url: form.bluesky_url,
        tiktok_url: form.tiktok_url,
        youtube_url: form.youtube_url,
        linkedin_url: form.linkedin_url,
        pinterest_url: form.pinterest_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        default_offer_enabled: form.default_offer_enabled,
        default_offer_title: form.default_offer_title,
        default_offer_body: form.default_offer_body,
        default_offer_url: form.default_offer_url,
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
        address_country: form.address_country,
        business_website: form.business_website,
        business_email: form.business_email,
        signup_email: user.email,
        ai_dos: form.ai_dos,
        ai_donts: form.ai_donts,
      })
      .select()
      .single();
    if (businessError) {
      setError(businessError.message);
      setLoading(false);
      return;
    }
    // Create Universal Prompt Page
    console.log("About to insert universal prompt page");
    const promptPageData = sanitizePromptPageInsert({
      account_id: user.id,
      slug: `universal-${slugify(form.name)}`,
      client_name: "",
      location: "",
      tone_of_voice: "",
      project_type: "",
      features_or_benefits:
        typeof services === "string"
          ? [services].filter((s: string) => s && s.trim())
          : Array.isArray(services)
            ? (services as string[]).filter((s: string) => s && s.trim())
            : [],
      product_description: "",
      date_completed: "",
      team_member: null,
      review_platforms: platformsWithWordCount,
      status: "draft",
      is_universal: true,
    });
    // Log for debugging
    console.log(
      "UNIVERSAL PROMPT PAGE features_or_benefits:",
      promptPageData.features_or_benefits,
      Array.isArray(promptPageData.features_or_benefits),
    );
    // Force remove date_completed if falsy
    if (!promptPageData.date_completed) {
      delete promptPageData.date_completed;
    }
    console.log(
      "Prompt page data being inserted:",
      JSON.stringify(promptPageData, null, 2),
    );
    const { error: universalError } = await supabase
      .from("prompt_pages")
      .upsert([promptPageData], { onConflict: "slug" });
    console.log("Insert result:", universalError);
    if (universalError) {
      setError(
        "Business created, but failed to create Universal Prompt Page: " +
          universalError.message,
      );
      setLoading(false);
      return;
    }
    router.push("/dashboard/plan");
  };

  // Helper to validate review URLs for known platforms
  const validatePlatformUrl = (name: string, url: string) => {
    if (!name || !url) return "";
    if (name.toLowerCase() === "google") {
      return url.match(
        /^https:\/\/g\.page\/|^https:\/\/search\.google\.com\/local\/write\/review\?placeid=/,
      )
        ? ""
        : 'Get Your Google Review Link.<br>Your Google review link can be accessed when you are logged into your Google business account. <a href="https://support.google.com/business/answer/3474122?hl=en#:~:text=Share%20a%20link%20or%20QR,used%20to%20send%20the%20email." target="_blank" rel="noopener noreferrer" class="underline text-dustyPlum">Click here for instructions.</a>';
    }
    if (name.toLowerCase() === "facebook") {
      return url.match(/^https:\/\/www\.facebook\.com\/.+\/reviews/)
        ? ""
        : "Enter a valid Facebook review link.";
    }
    if (name.toLowerCase() === "yelp") {
      return url.match(/^https:\/\/www\.yelp\.com\/writeareview\?/)
        ? ""
        : "Enter a valid Yelp review link.";
    }
    return "";
  };

  const handlePlatformChange = (
    idx: number,
    field: "name" | "url" | "customPlatform" | "wordCount",
    value: string,
  ) => {
    const newPlatforms = [...platforms];
    if (field === "name") {
      newPlatforms[idx].name = value;
    } else if (field === "url") {
      newPlatforms[idx].url = value;
    } else if (field === "customPlatform") {
      newPlatforms[idx] = { ...newPlatforms[idx], customPlatform: value };
    } else if (field === "wordCount") {
      newPlatforms[idx].wordCount = Number(value);
    }
    setPlatforms(newPlatforms);
    // Validate on change
    const error = validatePlatformUrl(
      newPlatforms[idx].name,
      newPlatforms[idx].url,
    );
    const newErrors = [...platformErrors];
    newErrors[idx] = error;
    setPlatformErrors(newErrors);
  };

  const addPlatform = () => {
    setPlatforms([...platforms, { name: "", url: "", wordCount: 200 }]);
    setPlatformErrors([...platformErrors, ""]);
  };

  const removePlatform = (idx: number) => {
    setPlatforms(platforms.filter((_, i) => i !== idx));
    setPlatformErrors(platformErrors.filter((_, i) => i !== idx));
  };

  // Helper to get cropped image as a blob
  const getCroppedImg = async (imageSrc: string, cropPixels: Area) => {
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
      }, "image/png");
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
      // Use 800x800 for larger screens, but compress to 400x400 for smaller displays
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3, // 300KB
        maxWidthOrHeight: 800, // Support larger images for better quality on larger screens
        useWebWorker: true,
        fileType: 'image/webp', // Always convert to webp for better compression
      });
      setRawLogoFile(compressedFile);
      setShowCropper(true);
      setLogoUrl(URL.createObjectURL(compressedFile));
    } catch (err) {
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
    if (!logoUrl || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(logoUrl, croppedAreaPixels);
    const croppedFile = new File(
      [croppedBlob],
      (rawLogoFile?.name?.replace(/\.[^.]+$/, '') || "logo") + ".webp",
      { type: "image/webp" },
    );
    setLogoFile(croppedFile);
    setLogoUrl(URL.createObjectURL(croppedFile));
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setLogoFile(null);
    setLogoUrl(null);
    setRawLogoFile(null);
  };

  useRequirePlan(account, business, ["/dashboard/account", "/dashboard/billing"]);

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <PageCard icon={<FaStore className="w-9 h-9 text-slate-blue" />}>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Business Profile
            </h1>
            <p className="text-gray-600">
              Set up your business profile to get started with PromptReviews.
            </p>
            
            {/* Debug button to manually trigger welcome popup */}
            {isAdminUser && (
              <button
                onClick={() => setShowWelcomePopup(true)}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
              >
                🐛 Debug: Show Welcome Popup
              </button>
            )}
          </div>

          {showTrialConfirmation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span className="text-green-800 font-medium">
                  Welcome! You're now on a free trial. Complete your business profile to get started.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <FaTimesCircle className="text-red-500 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}

          <div className="space-y-8">
            <BusinessForm
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
              logoError={logoError}
              setLogoError={setLogoError}
              // @ts-expect-error: React.RefObject<HTMLInputElement> can be initialized with null
              fileInputRef={fileInputRef}
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
              loading={loading}
              error={error}
              success={success}
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
              formId="create-business-form"
            />
            
            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                form="create-business-form"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? "Saving..." : "Create Business Profile"}
              </button>
            </div>
          </div>
        </div>
      </PageCard>

      {/* Trial Confirmation Modal */}
      {showTrialConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-100 border border-green-300 text-green-900 px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 text-lg font-semibold pointer-events-auto">
            Your free trial has started! You have 14 days to explore all
            features.
            <button
              onClick={() => setShowTrialConfirmation(false)}
              className="ml-2 text-green-900 hover:text-green-700 text-2xl font-bold"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg max-w-2xl w-full mx-4">
            <div className="relative h-96">
              <Cropper
                image={logoUrl || ""}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleCropCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Confirm Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={handleWelcomePopupClose}
        title={"Oh hi " + userFirstName + "—I'm Prompty!"}
        message={"Welcome to Prompt Reviews!\n\nDid you know you're a star? Carl Sagan said it best:\n\n\"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.\"\n\nBeautiful right! There is a flaming gas giant in you too! Wait, that didn't come out right . . .\n\nAnyway, I am here to help you get the stars you deserve—on Google, Facebook, TripAdvisor, TrustPilot—you name it.\n\nHere's your first tip: [icon] ← Click here"}
        imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-600kb.png"
        imageAlt="Prompty - Get Reviews"
        buttonText="Let's Wrangle Some Reviews!"
        onButtonClick={handleWelcomePopupClose}
      />
    </div>
  );
}
