import React, { useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  FaImage,
  FaShareAlt,
  FaGift,
  FaStar,
  FaList,
  FaMapMarkerAlt,
  FaClock,
  FaBuilding,
  FaInfoCircle,
  FaRobot,
} from "react-icons/fa";
import IndustrySelector from "@/app/components/IndustrySelector";

interface Platform {
  name: string;
  url: string;
  wordCount: number;
  customPlatform?: string;
}

interface BusinessFormProps {
  form: any;
  setForm: (form: any) => void;
  services: string[];
  setServices: (services: string[]) => void;
  platforms: Platform[];
  setPlatforms: (platforms: Platform[]) => void;
  platformErrors: string[];
  setPlatformErrors: (errors: string[]) => void;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  logoError: string;
  setLogoError: (err: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showCropper: boolean;
  setShowCropper: (show: boolean) => void;
  crop: { x: number; y: number };
  setCrop: (crop: { x: number; y: number }) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  croppedAreaPixels: Area | null;
  setCroppedAreaPixels: (area: Area | null) => void;
  rawLogoFile: File | null;
  setRawLogoFile: (file: File | null) => void;
  loading: boolean;
  error: string;
  success: string;
  onSubmit: (e: React.FormEvent) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleServiceChange: (idx: number, value: string) => void;
  addService: () => void;
  removeService: (idx: number) => void;
  handlePlatformChange: (
    idx: number,
    field: "name" | "url" | "customPlatform" | "wordCount",
    value: string,
  ) => void;
  addPlatform: () => void;
  removePlatform: (idx: number) => void;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCropConfirm: () => void;
  handleCropCancel: () => void;
  formId: string;
}

// Tooltip component (copied from edit-prompt-page)
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

function RobotTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-2">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show AI info"
        className="text-slate-blue hover:text-indigo-600 focus:outline-none"
        onClick={() => setShow((v) => !v)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <FaRobot
          className="inline-block w-4 h-4 align-middle cursor-pointer"
          title={text}
        />
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700">
          {text}
        </div>
      )}
    </span>
  );
}

export default function BusinessForm({
  form,
  setForm,
  services,
  setServices,
  platforms,
  setPlatforms,
  platformErrors,
  setPlatformErrors,
  logoUrl,
  setLogoUrl,
  logoFile,
  setLogoFile,
  logoError,
  setLogoError,
  fileInputRef,
  showCropper,
  setShowCropper,
  crop,
  setCrop,
  zoom,
  setZoom,
  croppedAreaPixels,
  setCroppedAreaPixels,
  rawLogoFile,
  setRawLogoFile,
  loading,
  error,
  success,
  onSubmit,
  handleChange,
  handleServiceChange,
  addService,
  removeService,
  handlePlatformChange,
  addPlatform,
  removePlatform,
  handleLogoChange,
  handleCropConfirm,
  handleCropCancel,
  formId,
}: BusinessFormProps) {
  const [industryType, setIndustryType] = useState<"B2B" | "B2C" | "Both">(
    "Both",
  );

  return (
    <form onSubmit={onSubmit} className="w-full mx-auto relative" id={formId}>
      {/* Logo Upload Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <FaImage className="w-7 h-7 text-slate-blue" />
          Logo (Optional)
        </h2>
        <div className="mb-10 flex flex-col md:flex-row items-center gap-10">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Business Logo"
              className="rounded-full max-h-32 max-w-32 object-contain border shadow"
            />
          )}
          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <FaImage className="w-5 h-5" />
              {logoUrl ? "Change Logo" : "Upload Logo"}
            </button>
            {logoError && (
              <p className="text-red-500 text-sm">{logoError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Business Information Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <FaBuilding className="w-7 h-7 text-slate-blue" />
          Business Information
        </h2>
        
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center gap-1">
            Business name *
            <RobotTooltip text="The official name of your business as you want it to appear to customers. This information is also made available for AI prompt generation." />
          </label>
          <input
            type="text"
            name="name"
            className="w-full border px-3 py-2 rounded"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1">
            Business website
          </label>
          <input
            type="url"
            name="business_website"
            className="w-full border px-3 py-2 rounded"
            value={form.business_website || ""}
            onChange={handleChange}
            placeholder="https://yourbusiness.com"
          />
        </div>
        
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              Business phone
            </label>
            <input
              type="tel"
              name="phone"
              className="w-full border px-3 py-2 rounded"
              value={form.phone || ""}
              onChange={handleChange}
              placeholder="e.g., (555) 123-4567"
            />
          </div>
          <div className="w-full md:w-1/2">
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              Business email
            </label>
            <input
              type="email"
              name="business_email"
              className="w-full border px-3 py-2 rounded"
              value={form.business_email || ""}
              onChange={handleChange}
              placeholder="contact@yourbusiness.com"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1">
            Business address
          </label>
          <label
            className="block text-xs font-medium text-gray-500 mb-1"
            htmlFor="address_street"
          >
            Street address
          </label>
          <input
            type="text"
            id="address_street"
            name="address_street"
            className="w-full border px-3 py-2 rounded mb-4"
            value={form.address_street}
            onChange={handleChange}
            required
            placeholder="Street address"
          />
          <div className="flex gap-2 mb-2">
            <div className="flex flex-col w-32">
              <label
                className="block text-xs font-medium text-gray-500 mb-1"
                htmlFor="address_city"
              >
                City *
              </label>
              <input
                type="text"
                id="address_city"
                name="address_city"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_city}
                onChange={handleChange}
                required
                placeholder="City"
              />
            </div>
            <div className="flex flex-col w-20">
              <label
                className="block text-xs font-medium text-gray-500 mb-1"
                htmlFor="address_state"
              >
                State *
              </label>
              <input
                type="text"
                id="address_state"
                name="address_state"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_state}
                onChange={handleChange}
                required
                placeholder="State"
              />
            </div>
            <div className="flex flex-col w-24">
              <label
                className="block text-xs font-medium text-gray-500 mb-1"
                htmlFor="address_zip"
              >
                ZIP *
              </label>
              <input
                type="text"
                id="address_zip"
                name="address_zip"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_zip}
                onChange={handleChange}
                required
                placeholder="ZIP"
              />
            </div>
          </div>
          <label
            className="block text-xs font-medium text-gray-500 mb-1"
            htmlFor="address_country"
          >
            Country *
          </label>
          <input
            type="text"
            id="address_country"
            name="address_country"
            className="w-full border px-3 py-2 rounded"
            value={form.address_country}
            onChange={handleChange}
            required
            placeholder="Country"
          />
        </div>
        
        {/* Industry Selector Integration */}
        <IndustrySelector
          value={form.industry || []}
          onChange={(industries, otherValue) =>
            setForm((f: any) => ({
              ...f,
              industry: industries,
              industry_other: otherValue ?? f.industry_other,
            }))
          }
          otherValue={form.industry_other || ""}
          onOtherChange={(val) =>
            setForm((f: any) => ({ ...f, industry_other: val }))
          }
          industryType={industryType}
          setIndustryType={setIndustryType}
          label={
            <span className="flex items-center gap-1">
              Your industry{" "}
              <RobotTooltip text="Made available for AI prompt generation." />
            </span>
          }
        />
      </div>

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
                onCropComplete={(croppedArea, croppedAreaPixels) => {
                  setCroppedAreaPixels(croppedAreaPixels);
                }}
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
                className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90"
              >
                Confirm Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
