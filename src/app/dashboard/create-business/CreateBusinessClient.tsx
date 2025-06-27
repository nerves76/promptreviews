"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAuthGuard } from "@/utils/authGuard";
import { FaImage, FaBuilding } from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import BusinessForm from "../components/BusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import imageCompression from 'browser-image-compression';

export default function CreateBusinessClient() {
  useAuthGuard();
  const [form, setForm] = useState({
    name: "",
    business_website: "",
    phone: "",
    business_email: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "",
    industry: [],
    industry_other: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [services, setServices] = useState<string[]>([""]);
  const [platforms, setPlatforms] = useState<any[]>([
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    const newErrors = [...platformErrors];
    newErrors[idx] = "";
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

  const getCroppedImg = async (imageSrc: string, cropPixels: any) => {
    const image = new Image();
    image.src = imageSrc;
    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        canvas.width = cropPixels.width;
        canvas.height = cropPixels.height;
        ctx.drawImage(
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
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "cropped-logo.webp", {
              type: "image/webp",
            });
            resolve(file);
          } else {
            resolve(null);
          }
        }, "image/webp");
      };
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLogoError("File size must be less than 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setLogoError("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    setLogoError("");
    setRawLogoFile(file);

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onload = () => {
        setLogoUrl(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image:", error);
      setLogoError("Error processing image");
    }
  };

  const handleCropConfirm = async () => {
    if (!logoUrl || !croppedAreaPixels) return;

    try {
      const croppedFile = await getCroppedImg(logoUrl, croppedAreaPixels);
      if (croppedFile) {
        setLogoFile(croppedFile);
        setShowCropper(false);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
      setLogoError("Error cropping image");
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setLogoUrl(null);
    setRawLogoFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const {
      data: { user },
      error: userError,
    } = await getUserOrMock(supabase);

    if (userError || !user) {
      setError("You must be signed in to create a business profile.");
      setLoading(false);
      return;
    }

    // Create or get account
    let accountId = user.id;
    const { data: existingAccount } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingAccount) {
      const { error: accountError } = await supabase
        .from("accounts")
        .insert({ id: user.id });
      
      if (accountError) {
        console.error("Error creating account:", accountError);
        setError("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }
    }

    let uploadedLogoUrl = logoUrl;
    if (logoFile) {
      const filePath = `business-logos/${user.id}.webp`;
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
      uploadedLogoUrl = publicUrlData?.publicUrl || null;
    }

    // Create business profile
    const { error: insertError } = await supabase
      .from("businesses")
      .insert({
        account_id: accountId,
        name: form.name,
        business_website: form.business_website,
        phone: form.phone,
        business_email: form.business_email,
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
        address_country: form.address_country,
        industry: form.industry,
        industry_other: form.industry_other,
        logo_url: uploadedLogoUrl,
      });

    if (insertError) {
      console.error("Error creating business:", insertError);
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess("Business profile created successfully!");
    setLoading(false);
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <PageCard icon={<FaBuilding className="w-9 h-9 text-slate-blue" />}>
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md text-base font-medium border border-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md text-base font-medium border border-red-200">
          {error}
        </div>
      )}
      <div className="flex items-start justify-between mt-2 mb-4">
        <div className="flex flex-col mt-0 md:mt-[3px]">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            Create Your Business Profile
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
            Let's get started by setting up your basic business information. You can add more details later.
          </p>
        </div>
        <div
          className="flex items-start pr-4 md:pr-6"
          style={{ alignSelf: "flex-start" }}
        >
          <button
            type="submit"
            form="create-business-form"
            disabled={loading}
            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ marginTop: "0.25rem" }}
          >
            {loading ? "Creating..." : "Save and Continue"}
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
        formId="create-business-form"
      />
      {/* Bottom right Save button */}
      <div className="flex justify-end mt-8 pr-4 md:pr-6">
        <button
          type="submit"
          form="create-business-form"
          disabled={loading}
          className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Save and Continue"}
        </button>
      </div>
    </PageCard>
  );
} 