"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthGuard } from "@/utils/authGuard";
import { FaStore } from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import { isAdmin } from "@/utils/admin";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import WelcomePopup from "@/app/components/WelcomePopup";

export default function CreateBusinessClient() {
  // Initialize supabase client at the top so it's available everywhere
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Check admin status when component mounts
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await getUserOrMock(supabase);
        if (user) {
          const adminStatus = await isAdmin(user.id, supabase);
          setIsAdminUser(adminStatus);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    checkAdminStatus();
  }, []);

  // Handler for the test welcome button
  const handleTestWelcome = () => {
    setShowWelcomePopup(true);
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

    console.log("Starting business creation process...");
    console.log("Current user:", user);
    console.log("Form data:", form);

    if (userError || !user) {
      setError("You must be signed in to create a business.");
      setLoading(false);
      return;
    }

    try {
      console.log("Step 1: Checking for existing account...");
      // Create or get account
      let accountId = user.id;
      const { data: existingAccount, error: accountCheckError } = await supabase
        .from("accounts")
        .select("id")
        .eq("id", user.id)
        .single();

      console.log("Account check result:", { existingAccount, accountCheckError });

      if (accountCheckError && accountCheckError.code !== 'PGRST116') {
        console.error("Error checking account:", accountCheckError);
        setError("Failed to check account. Please try again.");
        setLoading(false);
        return;
      }

      if (!existingAccount) {
        console.log("Step 2: Creating new account...");
        const { error: accountError } = await supabase
          .from("accounts")
          .insert({ id: user.id });
        
        if (accountError) {
          console.error("Error creating account:", {
            error: accountError,
            errorType: typeof accountError,
            errorKeys: Object.keys(accountError || {}),
            errorStringified: JSON.stringify(accountError, null, 2)
          });
          setError("Failed to create account. Please try again.");
          setLoading(false);
          return;
        }
        console.log("Account created successfully");
      } else {
        console.log("Account already exists");
      }

      // Ensure user is in account_users table as owner
      // First check if the user exists in auth.users
      const { data: authUser, error: authUserError } = await supabase.auth.getUser();
      
      if (authUserError || !authUser.user) {
        console.error("Error getting auth user:", authUserError);
        setError("Authentication error. Please sign in again.");
        setLoading(false);
        return;
      }

      // Only try to insert into account_users if we have a valid auth user
      if (authUser.user.id === user.id) {
        const { error: accountUserError } = await supabase
          .from("account_users")
          .upsert({ 
            account_id: accountId, 
            user_id: user.id, 
            role: 'owner' 
          }, { 
            onConflict: 'account_id,user_id' 
          });

        if (accountUserError) {
          console.error("Error setting up account user:", {
            error: accountUserError,
            errorType: typeof accountUserError,
            errorKeys: Object.keys(accountUserError || {}),
            errorStringified: JSON.stringify(accountUserError, null, 2),
            message: accountUserError?.message,
            details: accountUserError?.details,
            hint: accountUserError?.hint,
            code: accountUserError?.code
          });
          // Don't fail the entire process if account_users fails
          console.warn("Account user setup failed, but continuing with business creation");
        } else {
          console.log("Account user setup completed successfully");
        }
      } else {
        console.warn("User ID mismatch, skipping account_users setup");
      }

      // Create business profile
      console.log("User ID:", accountId);
      console.log("Attempting to create business with data:", {
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
      });

      // Check if user already has a business
      console.log("Checking for existing business with account_id:", accountId);
      const { data: existingBusiness, error: checkError } = await supabase
        .from("businesses")
        .select("id")
        .eq("account_id", accountId)
        .single();

      console.log("Existing business check result:", { existingBusiness, checkError });

      if (existingBusiness) {
        setError("You already have a business profile. Please go to your business profile page to update it.");
        setLoading(false);
        return;
      }

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error("Error checking existing business:", {
          error: checkError,
          errorType: typeof checkError,
          errorKeys: Object.keys(checkError || {}),
          errorStringified: JSON.stringify(checkError, null, 2),
          message: checkError?.message,
          details: checkError?.details,
          hint: checkError?.hint,
          code: checkError?.code
        });
        setError(`Error checking existing business profile: ${checkError.message || 'Unknown error'}. Please try again.`);
        setLoading(false);
        return;
      }

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
        });

      if (insertError) {
        console.error("Error creating business:", {
          error: insertError,
          errorType: typeof insertError,
          errorKeys: Object.keys(insertError || {}),
          errorStringified: JSON.stringify(insertError, null, 2),
          message: insertError?.message,
          details: insertError?.details,
          hint: insertError?.hint,
          code: insertError?.code
        });
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