"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAuthGuard } from "@/utils/authGuard";
import {
  FaRegStar,
  FaPhone,
  FaMapMarkerAlt,
  FaImage,
  FaListAlt,
  FaInfoCircle,
  FaStar,
  FaShareAlt,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaStore,
  FaAddressBook,
  FaClock,
  FaList,
  FaQuestionCircle,
  FaGift,
  FaRegLightbulb,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { isAdmin } from "@/utils/admin";
import BusinessProfileForm from "../components/BusinessProfileForm";
import DashboardCard from "../components/DashboardCard";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import imageCompression from 'browser-image-compression';
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import { trackEvent, GA_EVENTS } from "../../../utils/analytics";

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
  useAuthGuard();
  const [form, setForm] = useState({
    name: "",
    company_values: "",
    differentiators: "",
    years_in_business: "",
    industries_served: "",
    taglines: "",
    keywords: "",
    team_info: "",
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [noProfile, setNoProfile] = useState(false);
  const [services, setServices] = useState<string[]>([""]);
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: "", url: "", wordCount: 200 },
  ]);
  const [platformErrors, setPlatformErrors] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [rawLogoFile, setRawLogoFile] = useState<File | null>(null);
  const [copySuccess, setCopySuccess] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinessProfile = async () => {
      try {
        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          router.push("/auth/sign-in");
          return;
        }

        setAccountId(user.id);

        // Load business profile
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", user.id)
          .single();

        if (businessError && businessError.code !== 'PGRST116') {
          console.error("Error loading business profile:", businessError);
          setError("Failed to load business profile");
          setNoProfile(true);
          await supabase.auth.signOut();
          router.push("/auth/sign-in");
        } else {
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
          });
          setServices(
            Array.isArray(businessData.features_or_benefits)
              ? businessData.features_or_benefits
              : typeof businessData.features_or_benefits === "string" &&
                  businessData.features_or_benefits.length > 0
                ? businessData.features_or_benefits.trim().startsWith("[") &&
                  businessData.features_or_benefits.trim().endsWith("]")
                  ? (() => {
                      try {
                        return JSON.parse(businessData.features_or_benefits);
                      } catch {
                        return [businessData.features_or_benefits];
                      }
                    })()
                  : businessData.features_or_benefits.split("\n")
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

        setLoading(false);
      } catch (error) {
        console.error("Error loading business profile:", error);
        setError("Failed to load business profile");
        setLoading(false);
      }
    };

    loadBusinessProfile();
  }, [router]);

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
      console.log("Starting image compression...");
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3, // 300KB
        maxWidthOrHeight: 400,
        useWebWorker: true,
        fileType: 'image/webp', // Always convert to webp
      });
      console.log("Image compression successful:", compressedFile.size);
      
      setRawLogoFile(compressedFile);
      setShowCropper(true);
      setLogoUrl(URL.createObjectURL(compressedFile));
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
      console.log("Starting image cropping...");
      const croppedBlob = await getCroppedImg(logoUrl, croppedAreaPixels);
      console.log("Image cropping successful, blob size:", croppedBlob.size);
      
      const croppedFile = new File(
        [croppedBlob],
        (rawLogoFile?.name?.replace(/\.[^.]+$/, '') || "logo") + ".webp",
        { type: "image/webp" },
      );
      setLogoFile(croppedFile);
      setLogoUrl(URL.createObjectURL(croppedFile));
      setShowCropper(false);
    } catch (err) {
      console.error("Image cropping failed:", err);
      setLogoError("Failed to crop image. Please try again.");
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setLogoFile(null);
    setLogoUrl(null);
    setRawLogoFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting form submission...");
    setLoading(true);
    setError("");
    setSuccess("");
    setLogoError("");
    
    try {
      const {
        data: { user },
        error: userError,
      } = await getUserOrMock(supabase);
      if (userError || !user) {
        setError("You must be signed in to update your business profile.");
        setLoading(false);
        return;
      }
      
      console.log("User authenticated, proceeding with logo upload...");
      let uploadedLogoUrl = logoUrl;
      
      if (logoFile) {
        console.log("Logo file detected, starting upload process...");
        try {
          // Log environment and bucket name for debugging
          console.log("NODE_ENV:", process.env.NODE_ENV);
          const bucketName = process.env.NODE_ENV === 'development' ? 'testimonial-photos' : 'logos';
          console.log("Using bucket:", bucketName);
          // If the bucket is not found, skip upload and show a clear error
          const filePath = `${user.id}.webp`;
          const uploadPath = filePath;
          
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(uploadPath, logoFile, {
              upsert: true,
              contentType: "image/webp",
            });
          
          if (uploadError) {
            if (uploadError.message && uploadError.message.includes("Bucket not found")) {
              setLogoError("Logo upload failed: Storage bucket not found in this environment. Please create the bucket or contact support. Profile will be saved without a logo.");
              console.error("Supabase upload error: Bucket not found. Skipping logo upload.");
            } else {
              setLogoError("Failed to upload logo, but profile will be saved.");
              console.error("Supabase upload error details:", uploadError);
              console.error("Error message:", uploadError.message);
            }
            // Continue without logo upload rather than failing the entire save
            uploadedLogoUrl = logoUrl;
          } else {
            console.log("Logo upload successful, getting public URL...");
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(uploadPath);
            console.log("Supabase publicUrlData:", publicUrlData);
            uploadedLogoUrl = publicUrlData?.publicUrl || null;
          }
        } catch (uploadException) {
          console.error("Exception during logo upload:", uploadException);
          setLogoError("Failed to upload logo, but profile will be saved.");
        }
      } else {
        console.log("No logo file to upload, proceeding with profile update...");
      }
      
      console.log("Updating business profile in database...");
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
          services_offered: services,
        })
        .eq("account_id", user.id);
        
      if (updateError) {
        console.error("Database update error:", updateError);
        setError(updateError.message);
        setLoading(false);
        return;
      }
      
      console.log("Profile update successful!");
      setSuccess("Profile updated successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Unexpected error during form submission:", error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
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
    <PageCard icon={<FaStore className="w-9 h-9 text-slate-blue" />}>
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md text-base font-medium border border-green-200">
          {success}
        </div>
      )}
      <div className="flex items-start justify-between mt-2 mb-4">
        <div className="flex flex-col mt-0 md:mt-[3px]">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            Your business
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
            Fill out your business profile thoroughly and consistently. This is
            rule #1 in local search engine optimization.
          </p>
        </div>
        <div
          className="flex items-start pr-4 md:pr-6"
          style={{ alignSelf: "flex-start" }}
        >
          <button
            type="submit"
            form="business-profile-form"
            disabled={loading}
            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ marginTop: "0.25rem" }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
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
        formId="business-profile-form"
      />
      {/* Bottom right Save button */}
      <div className="flex justify-end mt-8 pr-4 md:pr-6">
        <button
          type="submit"
          form="business-profile-form"
          disabled={loading}
          className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </PageCard>
  );
}
