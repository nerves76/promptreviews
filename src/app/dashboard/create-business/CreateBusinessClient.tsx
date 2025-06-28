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
import { ensureAccountExists } from "@/utils/accountUtils";

export default function CreateBusinessClient() {
  // Use the singleton Supabase client instead of creating a new instance
  // This prevents "Multiple GoTrueClient instances" warnings and ensures proper session persistence

  useAuthGuard();
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: [],
    industry_other: "",
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
  const [showWelcomePopup, setShowWelcomePopup] = useState(true); // Show popup automatically for new users
  const router = useRouter();
  
  // Use the centralized admin context instead of local state
  const { isAdminUser, isLoading: adminLoading } = useAdmin();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handler for closing the welcome popup
  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
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

      // Get account ID for the user
      const { getAccountIdForUser } = await import("@/utils/accountUtils");
      const accountId = await getAccountIdForUser(user.id);
      
      if (!accountId) {
        setError("Failed to get account information. Please try again.");
        setLoading(false);
        return;
      }

      // Create business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert([
          {
            account_id: accountId,
            name: form.name,
            description: form.description,
            industry: form.industry,
            industry_other: form.industry_other,
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
        setError("Failed to create business. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess("Business created successfully! Redirecting to dashboard...");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (err) {
      console.error("Error creating business:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Ensure no invisible characters or syntax issues before return
  return (
    <div className="min-h-screen flex flex-col justify-start px-4 sm:px-0">
      <div className="flex justify-center items-start pt-12 pb-8">
        <div className="w-full max-w-4xl">
          <PageCard>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-blue mb-4 flex items-center justify-center gap-3">
                <FaStore className="w-8 h-8" />
                Create Your Business Profile
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Set up your business information to start collecting reviews and growing your online presence.
              </p>
            </div>

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

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="submit"
                form="create-business-form"
                disabled={loading}
                className="bg-slate-blue text-white py-2 px-6 rounded hover:bg-slate-blue/90 transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Business"}
              </button>
            </div>
          </PageCard>
        </div>
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
    </div>
  );
}