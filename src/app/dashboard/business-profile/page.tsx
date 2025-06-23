"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
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
} from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import BusinessForm from "../components/BusinessForm";
import DashboardCard from "../components/DashboardCard";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import imageCompression from 'browser-image-compression';

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
    default_offer_title: "Review Rewards",
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

  // Helper to validate review URLs for known platforms
  const validatePlatformUrl = (name: string, url: string) => {
    if (!name || !url) return "";
    if (name.toLowerCase() === "google") {
      return url.match(
        /^https:\/\/g\.page\/|^https:\/\/search\.google\.com\/local\/write\/review\?placeid=/,
      )
        ? ""
        : "Enter a valid Google review link.";
    }
    if (name.toLowerCase() === "facebook") {
      return url.match(/^https:\/\/www\.facebook\.com\/.+\/reviews/)
        ? ""
        : "Enter a valid Facebook review link.";
    }
    if (name.toLowerCase() === "yelp") {
      return url.match(/^https:\/\/www\.yelp\.com\/biz\/[a-zA-Z0-9\-_]+/)
        ? ""
        : "Please share a link to your business page on Yelp. Should look like: https://www.yelp.com/biz/your-business";
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

  useEffect(() => {
    const fetchProfileAndUser = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      // Fetch user
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (!user) {
        setError("You must be signed in to view your business profile.");
        setLoading(false);
        return;
      }
      setAccountId(user.id);
      // Fetch business profile (existing logic)
      const { data, error: fetchError } = await supabase
        .from("businesses")
        .select("*")
        .eq("account_id", user.id)
        .single();
      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No rows found
          setNoProfile(true);
          // Automatically log out the user if no business profile is found
          await supabase.auth.signOut();
          router.push("/auth/sign-in");
        } else {
          setError(fetchError.message);
        }
        setLoading(false);
        return;
      }
      setForm({
        ...data,
        business_website: data.business_website || "",
        phone: data.phone || "",
        address_street: data.address_street || "",
        address_city: data.address_city || "",
        address_state: data.address_state || "",
        address_zip: data.address_zip || "",
        address_country: data.address_country || "",
        default_offer_url: data.default_offer_url || "",
        business_email: data.business_email || "",
        ai_dos: data.ai_dos || "",
        ai_donts: data.ai_donts || "",
      });
      setServices(
        Array.isArray(data.features_or_benefits)
          ? data.features_or_benefits
          : typeof data.features_or_benefits === "string" &&
              data.features_or_benefits.length > 0
            ? data.features_or_benefits.trim().startsWith("[") &&
              data.features_or_benefits.trim().endsWith("]")
              ? (() => {
                  try {
                    return JSON.parse(data.features_or_benefits);
                  } catch {
                    return [data.features_or_benefits];
                  }
                })()
              : data.features_or_benefits.split("\n")
            : [""],
      );
      // Initialize platforms from JSON or fallback
      let loadedPlatforms = [{ name: "", url: "", wordCount: 200 }];
      if (Array.isArray(data.review_platforms)) {
        loadedPlatforms = data.review_platforms;
      }
      setPlatforms(loadedPlatforms);
      setPlatformErrors(loadedPlatforms.map(() => ""));
      setLogoUrl(data.logo_url || null);
      setLoading(false);
    };
    fetchProfileAndUser();
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
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3, // 300KB
        maxWidthOrHeight: 400,
        useWebWorker: true,
        fileType: 'image/webp', // Always convert to webp
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setLogoError("");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const {
      data: { user },
      error: userError,
    } = await getUserOrMock(supabase);
    if (userError || !user) {
      setError("You must be signed in to update your business profile.");
      setLoading(false);
      return;
    }
    let uploadedLogoUrl = logoUrl;
    if (logoFile) {
      // Upload to Supabase Storage
      const filePath = `business-logos/${user.id}.webp`;
      console.log("Uploading logo to:", filePath, "with file:", logoFile);
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, logoFile, {
          upsert: true,
          contentType: "image/webp",
        });
      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        setLogoError("Failed to upload logo.");
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);
      console.log("Supabase publicUrlData:", publicUrlData);
      uploadedLogoUrl = publicUrlData?.publicUrl || null;
    }
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
      })
      .eq("account_id", user.id);
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setSuccess("Profile updated successfully!");
    setLoading(false);
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
