"use client";

import { useState } from "react";
import { FaImage, FaBuilding, FaList, FaStar, FaGift, FaShareAlt, FaInfoCircle, FaTrash } from "react-icons/fa";
import Cropper from "react-easy-crop";
import IndustrySelector from "../../components/IndustrySelector";
import RobotTooltip from "../../components/RobotTooltip";

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

interface BusinessProfileFormProps {
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
  handlePlatformChange: (idx: number, field: "name" | "url" | "customPlatform" | "wordCount", value: string) => void;
  addPlatform: () => void;
  removePlatform: (idx: number) => void;
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
  platforms,
  setPlatforms,
  platformErrors,
  setPlatformErrors,
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
  handlePlatformChange,
  addPlatform,
  removePlatform,
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
          <FaImage className="w-7 h-7 text-slate-blue" />
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
              <FaImage />
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
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
              <h2 className="text-lg font-bold mb-4">Crop Your Logo</h2>
              <div className="relative w-full h-64 bg-white">
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
                />
              </div>
              <div className="flex items-center gap-4 mt-4">
                <label className="text-sm">Zoom & Shrink</label>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.01}
                  value={zoom || 1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500 ml-2">{((zoom || 1) * 100).toFixed(0)}%</span>
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
          <FaInfoCircle className="w-7 h-7 text-slate-blue" />
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
            value={form.address_street || ""}
            onChange={handleChange}
            required
            placeholder="Street address"
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
          <FaList className="w-7 h-7 text-slate-blue" />
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
                  <FaTrash />
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
          <FaStar className="w-7 h-7 text-slate-blue" />
          What makes your business unique?
        </h2>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            Company values
            <RobotTooltip text="Made available for AI prompt generation." />
          </label>
          <textarea
            name="company_values"
            className="w-full border px-3 py-2 rounded"
            value={form.company_values || ""}
            onChange={handleChange}
            placeholder="e.g., Quality, Innovation, Customer Service"
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
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            Keywords (comma separated)
            <RobotTooltip text="Made available for AI prompt generation." />
          </label>
          <textarea
            name="keywords"
            className="w-full border px-3 py-2 rounded min-h-[80px]"
            value={
              typeof form.keywords === "string"
                ? form.keywords
                : Array.isArray(form.keywords)
                  ? form.keywords.join(", ")
                  : ""
            }
            onChange={handleChange}
            placeholder="best therapist in Portland, amazing ADHD therapist, group sessions, works with most insurance companies, compassionate"
            rows={4}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            AI Dos
            <RobotTooltip text="Made available for AI prompt generation." />
          </label>
          <textarea
            name="ai_dos"
            className="w-full border px-3 py-2 rounded"
            value={form.ai_dos || ""}
            onChange={handleChange}
            placeholder="e.g., Mention our 24/7 customer support, Highlight our eco-friendly practices"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            AI Don'ts
            <RobotTooltip text="Made available for AI prompt generation." />
          </label>
          <textarea
            name="ai_donts"
            className="w-full border px-3 py-2 rounded"
            value={form.ai_donts || ""}
            onChange={handleChange}
            placeholder="e.g., Don't mention our old location, Don't mention discontinued products"
          />
        </div>
      </div>

      {/* About Your Business/Team Section */}
      <div className="mb-8">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <FaBuilding className="w-7 h-7 text-slate-blue" />
          About your business
        </h2>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            About your business and team
            <RobotTooltip text="Share information about your business, team, history, or anything that helps customers understand who you are. Made available for AI prompt generation." />
          </label>
          <textarea
            name="team_info"
            className="w-full border px-3 py-2 rounded min-h-[120px]"
            value={form.team_info || ""}
            onChange={handleChange}
            placeholder="Tell us about your business, team, history, mission, or anything that helps customers understand who you are and what you stand for..."
            rows={6}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
            Additional about information (optional)
            <RobotTooltip text="Additional space for any other information about your business that doesn't fit elsewhere. Made available for AI prompt generation." />
          </label>
          <textarea
            name="about_us"
            className="w-full border px-3 py-2 rounded min-h-[100px]"
            value={form.about_us || ""}
            onChange={handleChange}
            placeholder="Any additional information about your business..."
            rows={4}
          />
        </div>
      </div>

      {/* Review Platforms Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-2 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <FaStar className="w-7 h-7 text-slate-blue" />
          Review platforms
        </h2>
        <div className="text-sm text-gray-600 mb-4">
          Get reviews where it matters most. Set up your review platforms here, and they will be made available for any Prompt Page.
        </div>
        <div className="space-y-4">
          {platforms.map((platform, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex gap-2 items-start">
                <div className="flex flex-col w-1/3">
                  <label className="text-xs font-semibold text-gray-500 mb-1">
                    Platform Name
                  </label>
                  <select
                    className="w-full border px-3 py-2 rounded-lg bg-white"
                    value={platform.name || ""}
                    onChange={(e) =>
                      handlePlatformChange(idx, "name", e.target.value)
                    }
                  >
                    <option value="">Select a platform</option>
                    <option value="Google Business Profile">
                      Google Business Profile
                    </option>
                    <option value="Yelp">Yelp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TripAdvisor">TripAdvisor</option>
                    <option value="G2">G2</option>
                    <option value="BBB">BBB</option>
                    <option value="Thumbtack">Thumbtack</option>
                    <option value="Clutch">Clutch</option>
                    <option value="Capterra">Capterra</option>
                    <option value="Angi">Angi</option>
                    <option value="Houzz">Houzz</option>
                    <option value="HomeAdvisor">HomeAdvisor</option>
                    <option value="Trustpilot">Trustpilot</option>
                    <option value="Other">Other</option>
                  </select>
                  {platform.name === "Other" && (
                    <input
                      type="text"
                      className="w-full border px-3 py-2 rounded-lg bg-white mt-1"
                      placeholder="Custom platform name"
                      value={platform.customPlatform || ""}
                      onChange={(e) =>
                        handlePlatformChange(idx, "customPlatform", e.target.value)
                      }
                    />
                  )}
                </div>
                <div className="flex flex-col w-1/2">
                  <label className="text-xs font-semibold text-gray-500 mb-1">
                    Platform URL
                  </label>
                  <input
                    type="url"
                    className="w-full border px-3 py-2 rounded-lg bg-white"
                    placeholder="Review URL"
                    value={platform.url || ""}
                    onChange={(e) =>
                      handlePlatformChange(idx, "url", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col w-1/6">
                  <label className="text-xs font-semibold text-gray-500 mb-1">
                    Word Count
                  </label>
                  <input
                    type="number"
                    className="w-full border px-3 py-2 rounded-lg bg-white"
                    placeholder="200"
                    value={platform.wordCount || ""}
                    onChange={(e) =>
                      handlePlatformChange(idx, "wordCount", e.target.value)
                    }
                    min={50}
                    max={1000}
                  />
                </div>
                {platforms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlatform(idx)}
                    className="text-red-600 font-bold text-xl mt-6"
                  >
                    &times;
                  </button>
                )}
              </div>
              {platformErrors[idx] && (
                <span className="text-red-500 text-xs">
                  {platformErrors[idx]}
                </span>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPlatform}
            className="text-blue-600 underline mt-2"
          >
            + Add Platform
          </button>
        </div>
      </div>

      {/* Special Offer Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-2 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <FaGift className="w-7 h-7 text-slate-blue" />
          Special offer
        </h2>
        <div className="text-sm text-gray-600 mt-0 mb-4">
          This is a global setting for a special offer. You can also set this at
          the prompt page level.
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-lg font-semibold text-indigo-800 flex items-center">
              Enable Special Offer
            </label>
            <button
              type="button"
              onClick={() =>
                setForm((f: any) => ({
                  ...f,
                  default_offer_enabled: !f.default_offer_enabled,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.default_offer_enabled ? "bg-slate-blue" : "bg-gray-300"}`}
              aria-pressed={!!form.default_offer_enabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.default_offer_enabled ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>
          <div
            className={`border border-indigo-200 p-4 ${!form.default_offer_enabled ? "opacity-60" : ""}`}
          >
            <input
              type="text"
              name="default_offer_title"
              value={form.default_offer_title || "Special Offer"}
              onChange={(e) =>
                setForm((f: any) => ({
                  ...f,
                  default_offer_title: e.target.value,
                }))
              }
              placeholder="Offer Title (e.g., Special Offer)"
              className="block w-full rounded-md border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mb-2 font-semibold"
              disabled={!form.default_offer_enabled}
            />
            <textarea
              name="default_offer_body"
              value={form.default_offer_body || ""}
              onChange={(e) =>
                setForm((f: any) => ({
                  ...f,
                  default_offer_body: e.target.value,
                }))
              }
              placeholder="Get 10% off your next visit"
              className="block w-full rounded-md border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4"
              rows={2}
              disabled={!form.default_offer_enabled}
            />
            <input
              type="url"
              name="default_offer_url"
              value={form.default_offer_url || ""}
              onChange={(e) =>
                setForm((f: any) => ({
                  ...f,
                  default_offer_url: e.target.value,
                }))
              }
              placeholder="Offer URL (e.g., https://yourbusiness.com/claim-reward)"
              className="block w-full rounded-md border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mt-2"
              disabled={!form.default_offer_enabled}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Note: Services like Google and Yelp have policies against providing
            rewards in exchange for reviews, so it's best not to promise a
            reward for "x" number of reviews, etc.
          </div>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-2 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <FaShareAlt className="w-7 h-7 text-slate-blue" />
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