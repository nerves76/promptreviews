/**
 * SimpleBusinessForm.tsx
 * 
 * A simplified version of the business form for onboarding that only includes
 * essential business information fields without logo upload functionality.
 * This component is used specifically for the create business page to provide
 * a streamlined onboarding experience.
 */

import React, { useState, forwardRef, useEffect, useCallback } from "react";
import Icon from "@/components/Icon";
import IndustrySelector from "@/app/(app)/components/IndustrySelector";
import { createClient } from "@/auth/providers/supabase";
import { apiClient } from "@/utils/apiClient";
import { useRouter } from "next/navigation";
import { slugify } from "@/utils/slugify";

interface SimpleBusinessFormProps {
  user: any;
  accountId: string | null;
  onSuccess: () => void;
  initialValues?: Partial<FormState>;
}

type FormState = {
  name: string;
  industries_other: string;
  industry: string[];
  business_website: string;
  business_email: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  tagline: string;
  company_values: string;
  ai_dos: string;
  ai_donts: string;
  services_offered: string;
  differentiators: string;
  years_in_business: string;
  industries_served: string;
  promotion_code: string;
  referral_source?: string;
  referral_source_other?: string;
};

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
        <Icon name="prompty" className="inline-block w-4 h-4 align-middle cursor-pointer" color="#2E4A7D" size={16} />
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

const SimpleBusinessForm = forwardRef<HTMLFormElement, SimpleBusinessFormProps>(({
  user,
  accountId,
  onSuccess,
  initialValues,
}, ref) => {
  const supabase = createClient();
  const router = useRouter();
  
  // Storage key for form persistence
  const formStorageKey = 'createBusinessForm';
  
  // Initialize form with saved data if available
  const defaults: FormState = {
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
  } as FormState;

  const [form, setForm] = useState<FormState>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return { ...defaults, ...(initialValues || {}), ...parsed };
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
    }
    return { ...defaults, ...(initialValues || {}) };
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<'creating' | 'redirecting' | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [industryType, setIndustryType] = useState<"B2B" | "B2C" | "Both">("Both");
  const [promotionCodeError, setPromotionCodeError] = useState("");
  const [promotionCodeSuccess, setPromotionCodeSuccess] = useState("");
  
  // Auto-save form data to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(formStorageKey, JSON.stringify(form));
      }
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(saveTimeout);
  }, [form, formStorageKey]);

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
    setForm((prev: any) => ({ ...prev, [name]: value }));
    
    // Validate promotion code as user types
    if (name === "promotion_code") {
      validatePromotionCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      return;
    }
    
    
    // Validate promotion code before submission
    if (!validatePromotionCode(form.promotion_code)) {
      setLoading(false);
      setLoadingState(null);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setLoadingState('creating');
    setError("");
    setSuccess("");
    setPromotionCodeError("");
    setPromotionCodeSuccess("");

    if (!accountId) {
      setError("Account not found. Your session may have expired. Please sign out and sign back in.");
      setLoading(false);
      setLoadingState(null);
      return;
    }

    // Check if all required fields are filled
    const requiredFields = ['name', 'business_email', 'address_city', 'address_state', 'address_zip'];
    const missingFields = requiredFields.filter(field => !form[field as keyof typeof form]);
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      setLoadingState(null);
      return;
    }

    try {
      
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
        referral_source: form.referral_source || null,
        referral_source_other: form.referral_source_other || null,
      };


      console.log('[SimpleBusinessForm] Submitting with accountId:', accountId);

      const responseData = await apiClient.post<{ business: any; accountId?: string }>('/businesses', businessData);
      
      const business = responseData.business || responseData;
      const newAccountId = responseData.accountId; // Get the new account ID if created

      // Update loading state to show redirecting
      setLoadingState('redirecting');
      setSuccess("Business created successfully! Redirecting to dashboard...");
      
      // Dispatch event to refresh navigation state with new account ID
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('businessCreated', { 
          detail: { 
            businessId: business.id,
            accountId: newAccountId || accountId // Include the account ID
          } 
        }));
      }
      
      // Set flag that this account has created a business
      // Use the new account ID if one was created
      const accountToFlag = newAccountId || accountId;
      if (accountToFlag && user?.id) {
        localStorage.setItem(`promptreviews_has_created_business_${user.id}_${accountToFlag}`, 'true');
        // Store the new account ID for the context to pick up
        if (newAccountId && user?.id) {
          localStorage.setItem(`promptreviews_new_account_${user.id}`, newAccountId);
        }
        // Also pre-select this account for the dashboard/account context to avoid redirect loops
        localStorage.setItem(`promptreviews_selected_account_${user.id}`, accountToFlag);
      }
      
      // Clear the saved form data since business was created successfully
      localStorage.removeItem(formStorageKey);
      
      // Dispatch event to trigger account data refresh
      window.dispatchEvent(new CustomEvent('businessCreated'));
      
      // Call the success callback
      onSuccess();

    } catch (err) {
      console.error("Error creating business:", err);
      console.error("Error details:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Error creating business: ${errorMessage}`);
      setLoading(false);
      setLoadingState(null);
      setIsSubmitting(false);
    } finally {
      // Note: We don't reset loading state here for successful redirects
      // as we want to show "Redirecting..." until the page changes
      // But we do reset isSubmitting to prevent future submissions
      if (loadingState !== 'redirecting') {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto relative" id="create-business-form" ref={ref}>
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
          <Icon name="FaInfoCircle" size={28} className="text-slate-blue" />
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
                placeholder="City"
                required
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
                placeholder="State/Province"
                required
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
                placeholder="ZIP/Postal Code"
                required
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

      {/* How Did You Hear About Us Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue">
          Question
        </h2>
        <p className="text-gray-700 mb-4">
          We're curious — how did you first hear about Prompt Reviews?
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="referral_source"
              value="google_search"
              checked={form.referral_source === "google_search"}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Google search</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="referral_source"
              value="chatgpt"
              checked={form.referral_source === "chatgpt"}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">ChatGPT</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="referral_source"
              value="social_media"
              checked={form.referral_source === "social_media"}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Social media (Instagram, Facebook, LinkedIn, etc.)</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="referral_source"
              value="podcast_blog"
              checked={form.referral_source === "podcast_blog"}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Podcast or blog</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="referral_source"
              value="online_community"
              checked={form.referral_source === "online_community"}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Online community / Slack group</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="referral_source"
              value="word_of_mouth"
              checked={form.referral_source === "word_of_mouth"}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Word of mouth (friend or colleague)</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="referral_source"
              value="conference_event"
              checked={form.referral_source === "conference_event"}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Conference or event</span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="radio"
              name="referral_source"
              value="other"
              checked={form.referral_source === "other"}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 mt-1"
            />
            <div className="flex-1">
              <span className="text-gray-700">Other (please specify)</span>
              {form.referral_source === "other" && (
                <input
                  type="text"
                  name="referral_source_other"
                  className="w-full mt-2 border px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-300"
                  value={form.referral_source_other || ""}
                  onChange={handleChange}
                  placeholder="Please tell us how you heard about us"
                />
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Promotion Code Section */}
      <div className="mb-16">
        <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
          <Icon name="FaGift" size={28} className="text-slate-blue" />
          Promotion code
        </h2>
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
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="bg-slate-blue text-white py-2 px-6 rounded hover:bg-slate-blue/90 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white fill-current">
              <use href="/icons-sprite.svg#FaPlus" />
            </svg>
          )}
          {loading ? (
            loadingState === 'creating' ? "Creating..." : "Redirecting..."
          ) : "Create business"}
        </button>
      </div>
    </form>
  );
});

SimpleBusinessForm.displayName = 'SimpleBusinessForm';

export default SimpleBusinessForm; 
