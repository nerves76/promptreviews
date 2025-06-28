"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/utils/authGuard";
import { FaStore } from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import { useAdmin } from "@/contexts/AdminContext";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import WelcomePopup from "@/app/components/WelcomePopup";
import { supabase } from "@/utils/supabaseClient";

export default function CreateBusinessClient() {
  // Use the singleton Supabase client instead of creating a new instance
  // This prevents "Multiple GoTrueClient instances" warnings and ensures proper session persistence

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
    industry: "",
    industry_other: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const router = useRouter();
  
  // Use the centralized admin context instead of local state
  const { isAdminUser, isLoading: adminLoading } = useAdmin();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for the test welcome button
  const handleTestWelcome = () => {
    setShowWelcomePopup(true);
  };

  // Handler for closing the welcome popup
  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
  };

  // Simple account creation using API endpoint
  const ensureAccountExists = async (user: any) => {
    try {
      console.log("🔍 Creating account via API for user:", user.id);
      
      const response = await fetch('/api/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("❌ API error:", result.error);
        return false;
      }

      console.log("✅ Account created successfully via API");
      return true;
    } catch (error) {
      console.error("❌ Account creation error:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
      error: userError,
    } = await getUserOrMock(supabase);

    if (userError || !user) {
      setError("You must be signed in to create a business.");
      setLoading(false);
      return;
    }

    try {
      // Ensure account exists before creating business
      const accountCreated = await ensureAccountExists(user);
      
      if (!accountCreated) {
        setError("Failed to set up account. Please try again.");
        setLoading(false);
        return;
      }

      // Create business profile
      const { data: existingBusiness, error: checkError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (existingBusiness) {
        setError("You already have a business profile. Please go to your business profile page to update it.");
        setLoading(false);
        return;
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing business:", checkError);
        setError(`Error checking existing business profile: ${checkError.message || 'Unknown error'}. Please try again.`);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
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
        setError(`Failed to create business profile: ${insertError.message || 'Unknown error'}. Please try again.`);
        setLoading(false);
        return;
      }

      setSuccess("Business profile created successfully!");
      setLoading(false);
      
      // Redirect to plan selection after a short delay
      setTimeout(() => {
        router.push("/dashboard/plan");
      }, 1500);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError("An error occurred. Please try again later.");
      setLoading(false);
    }
  };

  // Ensure no invisible characters or syntax issues before return
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
          className="flex items-start pr-4 md:pr-6 gap-2"
          style={{ alignSelf: "flex-start" }}
        >
          {isAdminUser && (
            <button
              type="button"
              onClick={handleTestWelcome}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
              style={{ marginTop: "0.25rem" }}
            >
              Test Welcome
            </button>
          )}
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
      {showWelcomePopup && (
        <WelcomePopup
          isOpen={showWelcomePopup}
          onClose={handleCloseWelcome}
          title="Oh hi there—I'm Prompty!"
          message={`Welcome to Prompt Reviews!

Did you know you're a miracle? Carl Sagan said it best:
"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."

Beautiful right! There is a flaming gas giant in you too! Wait, that didn't come out right . . . Anyway, I am here to help you get the stars you deserve—on Google, Facebook, TripAdvisor, Clutch—you name it.

Here's your first tip: [icon] <----Click here

OK, that's it for now—let's go get some stars! 🌟`}
          imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-600kb.png"
          imageAlt="Prompty - Get Reviews"
          buttonText="Let's Go Get Some Stars! 🌟"
          onButtonClick={handleCloseWelcome}
        />
      )}
    </PageCard>
  );
}