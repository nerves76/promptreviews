/**
 * SimpleBusinessForm.tsx
 * 
 * A simplified version of the business form for onboarding that only includes
 * essential business information fields without logo upload functionality.
 * This component is used specifically for the create business page to provide
 * a streamlined onboarding experience.
 */

import React, { useState } from "react";
import { FaBuilding, FaRobot } from "react-icons/fa";
import IndustrySelector from "@/app/components/IndustrySelector";
import { createClient } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { slugify } from "@/utils/slugify";
import { OptimizedSpinner } from "@/app/components/OptimizedComponents";

interface SimpleBusinessFormProps {
  user: any;
  accountId: string | null;
  onSuccess: () => void;
}

// RobotTooltip component for AI-related field explanations
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

// Add the mapToDbColumns function from CreatePromptPageClient
function mapToDbColumns(formData: any): any {
  const insertData: any = { ...formData };
  insertData["emoji_sentiment_enabled"] = formData.emojiSentimentEnabled;
  insertData["emoji_sentiment_question"] = formData.emojiSentimentQuestion;
  insertData["emoji_feedback_message"] = formData.emojiFeedbackMessage;
  insertData["emoji_thank_you_message"] = formData.emojiThankYouMessage || "";
  insertData["ai_button_enabled"] = formData.aiButtonEnabled ?? true;
  insertData["falling_icon"] = formData.fallingIcon;
  
  // Map review_type to type for database
  if (formData.review_type) {
    insertData["type"] = formData.review_type;
  }
  
  // Remove camelCase keys
  delete insertData.emojiSentimentEnabled;
  delete insertData.emojiSentimentQuestion;
  delete insertData.emojiFeedbackMessage;
  delete insertData.emojiThankYouMessage;
  delete insertData.aiButtonEnabled;
  delete insertData.fallingEnabled;
  delete insertData.fallingIcon;
  delete insertData.emojiLabels;
  
  // Filter to only allowed DB columns - updated with all required columns
  const allowedColumns = [
    "id",
    "account_id",
    "slug",
    "client_name",
    "location",
    "project_type",
    "services_offered",
    "outcomes",
    "date_completed",
    "assigned_team_members",
    "review_platforms",
    "qr_code_url",
    "created_at",
    "is_universal",
    "team_member",
    "first_name",
    "last_name",
    "phone",
    "email",
    "offer_enabled",
    "offer_title",
    "offer_body",
    "category",
    "friendly_note",
    "offer_url",
    "status",
    "role",
    "falling_icon",
    "review_type",
    "type",
    "no_platform_review_template",
    "video_max_length",
    "video_quality",
    "video_preset",
    "video_questions",
    "video_note",
    "video_tips",
    "video_recipient",
    "emoji_sentiment_enabled",
    "emoji_sentiment_question",
    "emoji_feedback_message",
    "emoji_thank_you_message",
    "ai_button_enabled",
    "product_description",
    "features_or_benefits",
    "product_name",
    "product_photo",
    "product_subcopy",
    "show_friendly_note"
  ];
  return Object.fromEntries(
    Object.entries(insertData).filter(([k]) => allowedColumns.includes(k)),
  );
}

export default function SimpleBusinessForm({
  user,
  accountId,
  onSuccess,
}: SimpleBusinessFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    industries_other: "",
    industry: [],
    business_website: "",
    business_email: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "United States",
    tagline: "",
    company_values: "",
    ai_dos: "",
    ai_donts: "",
    services_offered: "",
    differentiators: "",
    years_in_business: "",
    industries_served: "",
    promotion_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<'creating' | 'redirecting' | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [industryType, setIndustryType] = useState<"B2B" | "B2C" | "Both">("Both");
  const [promotionCodeError, setPromotionCodeError] = useState("");
  const [promotionCodeSuccess, setPromotionCodeSuccess] = useState("");

  // Valid promotion codes
  const VALID_PROMOTION_CODES = ["grower49-offer2025"];
  
  const validatePromotionCode = (code: string): boolean => {
    if (!code || code.trim() === "") {
      setPromotionCodeError("");
      setPromotionCodeSuccess("");
      return true; // Empty is valid (optional field)
    }
    
    if (VALID_PROMOTION_CODES.includes(code.trim())) {
      setPromotionCodeError("");
      setPromotionCodeSuccess("✓ Valid promotion code applied!");
      return true;
    } else {
      setPromotionCodeError("Invalid promotion code. Please check your code and try again.");
      setPromotionCodeSuccess("");
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Validate promotion code as user types
    if (name === "promotion_code") {
      validatePromotionCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started");
    console.log("Form data:", form);
    console.log("Account ID:", accountId);
    
    // Validate promotion code before submission
    if (!validatePromotionCode(form.promotion_code)) {
      setLoading(false);
      setLoadingState(null);
      return;
    }

    setLoading(true);
    setLoadingState('creating');
    setError("");
    setSuccess("");
    setPromotionCodeError("");
    setPromotionCodeSuccess("");

    if (!accountId) {
      setError("Account not found. Please try again.");
      setLoading(false);
      setLoadingState(null);
      return;
    }

    // Check if all required fields are filled
    const requiredFields = ['name', 'business_email', 'address_city', 'address_state', 'address_zip', 'address_country'];
    const missingFields = requiredFields.filter(field => !form[field as keyof typeof form]);
    
    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      setLoadingState(null);
      return;
    }

    try {
      console.log("Starting business creation process via API...");
      console.log("Account ID:", accountId);
      console.log("Form data:", form);
      
      // Create business via API endpoint instead of direct database access
      const businessData = {
        name: form.name,
        account_id: accountId, // Include the account_id that the API expects
        industry: form.industry,
        industries_other: form.industries_other,
        business_website: form.business_website,
        business_email: form.business_email,
        phone: form.phone,
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
        address_country: form.address_country,
        tagline: form.tagline || null,
        company_values: form.company_values || null,
        ai_dos: form.ai_dos || null,
        ai_donts: form.ai_donts || null,
        services_offered: form.services_offered || null,
        differentiators: form.differentiators || null,
        years_in_business: form.years_in_business || null,
        industries_served: form.industries_served || null,
        promotion_code: form.promotion_code || null,
      };

      console.log("Making API call to /api/businesses");
      console.log("Request body:", JSON.stringify(businessData, null, 2));
      
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData),
      });
      
      console.log("API response status:", response.status);
      console.log("API response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Business creation API error:", errorData);
        setError(`Failed to create business: ${errorData.error || response.statusText}`);
        setLoading(false);
        setLoadingState(null);
        return;
      }

      const business = await response.json();
      console.log("Business created successfully via API:", business);

      // Update loading state to show redirecting
      setLoadingState('redirecting');
      setSuccess("Business created successfully! Redirecting to dashboard...");
      
      // Dispatch event to refresh navigation state
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('businessCreated', { detail: { businessId: business.id } }));
        console.log("🎉 Dispatched businessCreated event for navigation refresh");
      }
      
      console.log("Business created successfully, calling onSuccess callback");
      // Call the success callback
      onSuccess();
      console.log("onSuccess callback completed");

    } catch (err) {
      console.error("Error creating business:", err);
      console.error("Error details:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Error creating business: ${errorMessage}`);
      setLoading(false);
      setLoadingState(null);
    } finally {
      console.log("Form submission completed");
      // Note: We don't reset loading state here for successful redirects
      // as we want to show "Redirecting..." until the page changes
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto relative" id="create-business-form">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {/* Business Information Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <FaBuilding className="w-7 h-7 text-slate-blue" />
          Business information
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
            Promotion code (optional)
          </label>
          <input
            type="text"
            name="promotion_code"
            className={`w-full border px-3 py-2 rounded ${
              promotionCodeError 
                ? 'border-red-500 focus:border-red-500' 
                : promotionCodeSuccess 
                  ? 'border-green-500 focus:border-green-500' 
                  : 'border-gray-300 focus:border-slate-blue'
            }`}
            value={form.promotion_code || ""}
            onChange={handleChange}
            placeholder="Enter promotion code if you have one"
          />
          {promotionCodeError ? (
            <p className="text-xs text-red-600 mt-1">
              {promotionCodeError}
            </p>
          ) : promotionCodeSuccess ? (
            <p className="text-xs text-green-600 mt-1">
              {promotionCodeSuccess}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              Have a special offer code? Enter it here to unlock benefits.
            </p>
          )}
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
              Business email *
            </label>
            <input
              type="email"
              name="business_email"
              className="w-full border px-3 py-2 rounded"
              value={form.business_email || ""}
              onChange={handleChange}
              required
              placeholder="contact@yourbusiness.com"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block font-semibold text-sm text-gray-500 mb-1">
            Business location
          </label>
          <p className="text-xs text-gray-500 mb-3 italic">
            You do not need to have a street address listed, but knowing your approximate location can help Prompty AI.
          </p>
          <label
            className="block text-xs font-medium text-gray-500 mb-1"
            htmlFor="address_street"
          >
            Street address (optional)
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
          <div className="flex flex-col md:flex-row gap-2 mb-2">
            <div className="flex flex-col flex-1">
              <label
                className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"
                htmlFor="address_city"
              >
                City *
                <RobotTooltip text="Your business city location. This information is made available for AI prompt generation." />
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
            <div className="flex flex-col flex-1">
              <label
                className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"
                htmlFor="address_state"
              >
                State/Province *
                <RobotTooltip text="Your business state or province location. This information is made available for AI prompt generation." />
              </label>
              <input
                type="text"
                id="address_state"
                name="address_state"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_state || ""}
                onChange={handleChange}
                required
                placeholder="State/Province"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label
                className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"
                htmlFor="address_zip"
              >
                ZIP/Postal Code *
                <RobotTooltip text="Your business zip or postal code. This information is made available for AI prompt generation." />
              </label>
              <input
                type="text"
                id="address_zip"
                name="address_zip"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_zip || ""}
                onChange={handleChange}
                required
                placeholder="ZIP/Postal Code"
              />
            </div>
          </div>
          <label
            className="block text-xs font-medium text-gray-500 mb-1"
            htmlFor="address_country"
          >
            Country *
          </label>
          <select
            id="address_country"
            name="address_country"
            className="w-full border px-3 py-2 rounded"
            value={form.address_country || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select a country</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Australia">Australia</option>
            <option value="New Zealand">New Zealand</option>
            <option value="Ireland">Ireland</option>
            <option value="South Africa">South Africa</option>
            <option value="India">India</option>
            <option value="Singapore">Singapore</option>
            <option value="Hong Kong">Hong Kong</option>
            <option value="Philippines">Philippines</option>
            <option value="Malaysia">Malaysia</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="Ghana">Ghana</option>
            <option value="Uganda">Uganda</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Zimbabwe">Zimbabwe</option>
            <option value="Zambia">Zambia</option>
            <option value="Botswana">Botswana</option>
            <option value="Namibia">Namibia</option>
            <option value="Mauritius">Mauritius</option>
            <option value="Seychelles">Seychelles</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        {/* Industry Selector Integration */}
        <IndustrySelector
          value={form.industry || []}
          onChange={(industries, otherValue) =>
            setForm((f: any) => ({
              ...f,
              industry: industries,
              industries_other: otherValue ?? f.industries_other,
            }))
          }
          otherValue={form.industries_other || ""}
          onOtherChange={(val) =>
            setForm((f: any) => ({ ...f, industries_other: val }))
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

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-blue text-white py-2 px-6 rounded hover:bg-slate-blue/90 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <OptimizedSpinner size="sm" className="text-white" />}
          {loading ? (
            loadingState === 'creating' ? "Creating..." : "Redirecting..."
          ) : "Create Business"}
        </button>
      </div>
    </form>
  );
} 