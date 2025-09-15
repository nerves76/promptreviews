"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import Cropper from "react-easy-crop";
import IndustrySelector from "../../components/IndustrySelector";
import RobotTooltip from "../../components/RobotTooltip";
import { KickstartersFeature } from "../../components/prompt-features";

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

interface BusinessProfileFormProps {
  form: any;
  setForm: (form: any) => void;
  services: string[];
  setServices: (services: string[]) => void;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  logoPrintFile: File | null;
  setLogoPrintFile: (file: File | null) => void;
  logoError: string;
  setLogoError: (error: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showCropper: boolean;
  setShowCropper: (show: boolean) => void;
  crop: { x: number; y: number };
  setCrop: (crop: { x: number; y: number }) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  croppedAreaPixels: any;
  setCroppedAreaPixels: (pixels: any) => void;
  rawLogoFile: File | null;
  setRawLogoFile: (file: File | null) => void;
  rawLogoPrintFile: File | null;
  setRawLogoPrintFile: (file: File | null) => void;
  loading: boolean;
  error: string;
  success: string;
  onSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleServiceChange: (idx: number, value: string) => void;
  addService: () => void;
  removeService: (idx: number) => void;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCropConfirm: () => void;
  handleCropCancel: () => void;
  formId: string;
}

export default function BusinessProfileForm({
  form,
  setForm,
  services,
  setServices,
  logoUrl,
  setLogoUrl,
  logoFile,
  setLogoFile,
  logoPrintFile,
  setLogoPrintFile,
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
  rawLogoPrintFile,
  setRawLogoPrintFile,
  loading,
  error,
  success,
  onSubmit,
  handleChange,
  handleServiceChange,
  addService,
  removeService,
  handleLogoChange,
  handleCropConfirm,
  handleCropCancel,
  formId,
}: BusinessProfileFormProps) {
  const [industryType, setIndustryType] = useState<"B2B" | "B2C" | "Both">("Both");

  return (
    <form onSubmit={onSubmit} className="w-full mx-auto relative" id={formId}>
      {/* Logo Upload Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <Icon name="FaImage" className="w-7 h-7 text-slate-blue" size={28} />
          Logo
        </h2>
        <div className="mb-10 flex flex-col md:flex-row items-center gap-10">
          {logoUrl && logoUrl.trim() !== "" ? (
            <img
              src={logoUrl}
              alt="Business Logo"
              className="rounded-full max-h-32 max-w-32 object-contain border shadow"
            />
          ) : (
            <div className="rounded-full max-h-32 max-w-32 w-32 h-32 flex items-center justify-center border shadow bg-gray-50 text-slate-blue text-5xl">
              <Icon name="FaImage" size={48} />
            </div>
          )}
          <div className="flex-1 w-full max-w-[700px]">
            <label className="block font-bold text-lg text-slate-blue mb-1">
              Upload your logo or your face (whichever is more iconic).
            </label>
            <div className="text-sm text-gray-500 mb-2">
              PNG, JPG, or WEBP supported - optimized for both web and print quality
            </div>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">
                QR Code Template Printing:
              </p>
              <p className="text-xs text-blue-700">
                If you plan on printing a QR code template with your logo included, we recommend uploading at 1200x1200px
              </p>
            </div>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              ref={fileInputRef}
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-blue file:text-white hover:file:bg-slate-blue/90"
            />
            {logoError && (
              <p className="text-sm text-red-600 mt-1">{logoError}</p>
            )}
          </div>
        </div>
        {/* Cropping Modal */}
        {showCropper && logoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
              <h2 className="text-lg font-bold mb-4">Crop Your Logo</h2>
              
              {/* Preview guidance */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  🎯 Cropping Preview
                </p>
                <p className="text-xs text-blue-700">
                  This circle matches exactly how your logo will appear on prompt pages and QR codes. 
                  Position and size your logo to look perfect within this circular boundary.
                </p>
              </div>

              {/* Adjusted container to match prompt page sizing (192px = h-48) */}
              <div className="relative w-full h-48 bg-white border-2 border-gray-200 rounded-lg">
                <Cropper
                  image={logoUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedAreaPixels) =>
                    setCroppedAreaPixels(croppedAreaPixels)
                  }
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      borderRadius: '0.5rem'
                    }
                  }}
                />
              </div>
              
              {/* Zoom controls with better labeling */}
              <div className="flex items-center gap-4 mt-4">
                <label className="text-sm font-medium">Zoom & Shrink</label>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.01}
                  value={zoom || 1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500 ml-2 min-w-[45px]">{((zoom || 1) * 100).toFixed(0)}%</span>
              </div>
              
              {/* Size reference guide */}
              <div className="mt-2 text-xs text-gray-500 text-center">
                50% = Smaller • 100% = Normal • 300% = Larger
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={handleCropCancel}
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  type="button"
                  className="px-4 py-2 rounded bg-slate-blue text-white hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  Crop & Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business Info Section */}
      <div className="mb-8">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <Icon name="FaInfoCircle" className="w-7 h-7 text-slate-blue" size={28} />
          Business info
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
            value={form.name || ""}
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
            value={form.address_street || ""}
            onChange={handleChange}
            placeholder="Street address (optional)"
          />
          <div className="flex gap-2 mb-2">
            <div className="flex flex-col w-32">
              <label
                className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"
                htmlFor="address_city"
              >
                City{" "}
                <RobotTooltip text="Made available for AI prompt generation." />
              </label>
              <input
                type="text"
                id="address_city"
                name="address_city"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_city || ""}
                onChange={handleChange}
                required
                placeholder="City"
              />
            </div>
            <div className="flex flex-col w-20">
              <label
                className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"
                htmlFor="address_state"
              >
                State{" "}
                <RobotTooltip text="Made available for AI prompt generation." />
              </label>
              <input
                type="text"
                id="address_state"
                name="address_state"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_state || ""}
                onChange={handleChange}
                required
                placeholder="State"
              />
            </div>
            <div className="flex flex-col w-24">
              <label
                className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"
                htmlFor="address_zip"
              >
                ZIP{" "}
                <RobotTooltip text="Made available for AI prompt generation." />
              </label>
              <input
                type="text"
                id="address_zip"
                name="address_zip"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_zip || ""}
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
            Country
          </label>
          <input
            type="text"
            id="address_country"
            name="address_country"
            className="w-full border px-3 py-2 rounded"
            value={form.address_country || ""}
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
        {(industryType === "B2B" || industryType === "Both") && (
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
              Industries you serve (if applicable)
              <Tooltip text="This helps Prompt AI understand your target audience and tailor reviews for your typical clients or customers." />
            </label>
            <textarea
              name="industries_served"
              className="w-full border px-3 py-2 rounded"
              value={
                typeof form.industries_served === "string"
                  ? form.industries_served
                  : Array.isArray(form.industries_served)
                    ? form.industries_served.join(", ")
                    : ""
              }
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {/* Services Section */}
      <div className="mb-8">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <Icon name="FaHandshake" className="w-7 h-7 text-slate-blue" size={28} />
          Services or Offerings
          <RobotTooltip text="Made available for AI prompt generation." />
        </h2>
        {/* Only show input fields if there are services, otherwise show just the button */}
        {services.length === 0 ? (
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-slate-blue text-slate-blue rounded hover:bg-slate-blue hover:text-white transition-colors font-semibold"
            onClick={() => setServices([""])}
          >
            + Add a Service or Offering
          </button>
        ) : (
          <div className="space-y-4">
            {services.map((service, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={service || ""}
                  onChange={e => handleServiceChange(idx, e.target.value)}
                  placeholder="e.g., Web Design"
                />
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 px-2"
                  onClick={() => removeService(idx)}
                  aria-label="Remove service"
                >
                  <Icon name="FaTrash" size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-slate-blue text-slate-blue rounded hover:bg-slate-blue hover:text-white transition-colors font-semibold mt-2"
              onClick={() => setServices([...services, ""])}
            >
              + Add a Service or Offering
            </button>
          </div>
        )}
      </div>

      {/* What Makes Your Business Unique Section */}
      <div className="mb-8">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <Icon name="FaStar" className="w-7 h-7 text-slate-blue" size={28} />
          What makes your business unique?
        </h2>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            About us
            <RobotTooltip text="Tell your story. This will be used for AI prompt generation and may appear on your public profile." />
          </label>
          <textarea
            name="about_us"
            className="w-full border px-3 py-2 rounded min-h-[100px]"
            value={form.about_us || ""}
            onChange={handleChange}
            placeholder="Tell us about your business, your story, or anything you want customers to know."
            rows={4}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            Differentiators / unique selling points
            <RobotTooltip text="Made available for AI prompt generation." />
          </label>
          <textarea
            name="differentiators"
            className="w-full border px-3 py-2 rounded"
            value={form.differentiators || ""}
            onChange={handleChange}
            placeholder="What makes your business unique?"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            Years in business
            <RobotTooltip text="Made available for AI prompt generation." />
          </label>
          <input
            type="number"
            name="years_in_business"
            className="w-full border px-3 py-2 rounded"
            value={form.years_in_business || ""}
            onChange={handleChange}
            placeholder="e.g., 5"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            Taglines
            <RobotTooltip text="Made available for AI prompt generation." />
          </label>
          <textarea
            name="taglines"
            className="w-full border px-3 py-2 rounded"
            value={form.taglines || ""}
            onChange={handleChange}
            placeholder="e.g., 'Quality you can trust'"
          />
        </div>
      </div>

      {/* Social Media Section */}
      <div className="mb-16 mt-12">
        <hr className="border-gray-300 mb-8" />
        <h2 className="mt-4 mb-2 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <Icon name="FaShare" className="w-7 h-7 text-slate-blue" size={28} />
          Social media
        </h2>
        <div className="text-sm text-gray-600 mb-4">
          Add social media links to your prompt pages.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              Facebook URL
            </label>
            <input
              type="url"
              name="facebook_url"
              className="w-full border px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-300"
              value={form.facebook_url || ""}
              onChange={handleChange}
              placeholder="https://facebook.com/yourbusiness"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              Instagram URL
            </label>
            <input
              type="url"
              name="instagram_url"
              className="w-full border px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-300"
              value={form.instagram_url || ""}
              onChange={handleChange}
              placeholder="https://instagram.com/yourbusiness"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              Bluesky URL
            </label>
            <input
              type="url"
              name="bluesky_url"
              className="w-full border px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-300"
              value={form.bluesky_url || ""}
              onChange={handleChange}
              placeholder="https://bsky.app/profile/yourbusiness"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              TikTok URL
            </label>
            <input
              type="url"
              name="tiktok_url"
              className="w-full border px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-300"
              value={form.tiktok_url || ""}
              onChange={handleChange}
              placeholder="https://tiktok.com/@yourbusiness"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              YouTube URL
            </label>
            <input
              type="url"
              name="youtube_url"
              className="w-full border px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-300"
              value={form.youtube_url || ""}
              onChange={handleChange}
              placeholder="https://youtube.com/@yourbusiness"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              LinkedIn URL
            </label>
            <input
              type="url"
              name="linkedin_url"
              className="w-full border px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-300"
              value={form.linkedin_url || ""}
              onChange={handleChange}
              placeholder="https://linkedin.com/company/yourbusiness"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-gray-500 mb-1">
              Pinterest URL
            </label>
            <input
              type="url"
              name="pinterest_url"
              className="w-full border px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-300"
              value={form.pinterest_url || ""}
              onChange={handleChange}
              placeholder="https://pinterest.com/yourbusiness"
            />
          </div>
        </div>
      </div>


      {/* Contact Information Section */}
      <div className="mb-8">
        <hr className="border-gray-300 mb-8" />
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <Icon name="FaPhone" className="w-7 h-7 text-slate-blue" size={28} />
          Contact information
        </h2>
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
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg mb-4">
          {success}
        </div>
      )}
    </form>
  );
} 