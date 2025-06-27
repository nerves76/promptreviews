"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthGuard } from "@/utils/authGuard";
import { FaStore } from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";

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
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

    // Create business profile
    console.log("User ID:", accountId);
    console.log("Attempting to create business with data:", {
      reviewer_id: accountId,
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
    });

    // Check if user already has a business
    console.log("Checking for existing business with reviewer_id:", accountId);
    const { data: existingBusiness, error: checkError } = await supabase
      .from("businesses")
      .select("id")
      .eq("reviewer_id", accountId)
      .single();

    console.log("Existing business check result:", { existingBusiness, checkError });

    if (existingBusiness) {
      setError("You already have a business profile. Please go to your business profile page to update it.");
      setLoading(false);
      return;
    }

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking existing business:", checkError);
      console.error("Error details:", {
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
        code: checkError.code,
        error: JSON.stringify(checkError)
      });
      setError(`Error checking existing business profile: ${checkError.message || 'Unknown error'}. Please try again.`);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("businesses")
      .insert({
        reviewer_id: accountId,
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
      });

    if (insertError) {
      console.error("Error creating business:", insertError);
      console.error("Error details:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        error: JSON.stringify(insertError)
      });
      setError(`Failed to create business profile: ${insertError.message || 'Unknown error'}. Please try again.`);
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
    <PageCard icon={<FaStore className="w-9 h-9 text-slate-blue" />}>
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
            Your business basics
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
            Let's get started by setting up your basic business information.
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
      <SimpleBusinessForm
        form={form}
        setForm={setForm}
        loading={loading}
        error={error}
        success={success}
        onSubmit={handleSubmit}
        handleChange={handleChange}
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