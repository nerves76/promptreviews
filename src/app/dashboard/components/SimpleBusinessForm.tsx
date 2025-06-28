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
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

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

export default function SimpleBusinessForm({
  user,
  accountId,
  onSuccess,
}: SimpleBusinessFormProps) {
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [industryType, setIndustryType] = useState<"B2B" | "B2C" | "Both">("Both");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!accountId) {
      setError("Account not found. Please try again.");
      setLoading(false);
      return;
    }

    try {
      // Create business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert([
          {
            account_id: accountId,
            name: form.name,
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
          },
        ])
        .select()
        .single();

      if (businessError) {
        console.error("Business creation error:", businessError);
        setError(`Failed to create business: ${businessError.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      setSuccess("Business created successfully! Redirecting to dashboard...");
      
      // Call the success callback
      onSuccess();

    } catch (err) {
      console.error("Error creating business:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Error creating business: ${errorMessage}`);
    } finally {
      setLoading(false);
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
                value={form.address_city}
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
                State *
                <RobotTooltip text="Your business state location. This information is made available for AI prompt generation." />
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
                className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"
                htmlFor="address_zip"
              >
                Zip *
                <RobotTooltip text="Your business zip code. This information is made available for AI prompt generation." />
              </label>
              <input
                type="text"
                id="address_zip"
                name="address_zip"
                className="w-full border px-3 py-2 rounded mb-4"
                value={form.address_zip}
                onChange={handleChange}
                required
                placeholder="Zip"
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
          className="bg-slate-blue text-white py-2 px-6 rounded hover:bg-slate-blue/90 transition-colors font-semibold disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Business"}
        </button>
      </div>
    </form>
  );
} 