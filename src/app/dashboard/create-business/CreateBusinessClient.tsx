"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaStore } from "react-icons/fa";
import { supabase, getUserOrMock } from "@/utils/supabaseClient";
import { useAdmin } from "@/contexts/AdminContext";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import WelcomePopup from "@/app/components/WelcomePopup";
import { ensureAccountExists, getAccountIdForUser } from "@/utils/accountUtils";

export default function CreateBusinessClient() {
  // Use the centralized admin context instead of local state
  const { isAdminUser, isLoading: adminLoading } = useAdmin();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Memoize router functions to prevent infinite loops
  const redirectToSignIn = useCallback(() => {
    router.push("/auth/sign-in");
  }, [router]);

  const redirectToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const redirectToDashboardWithFlag = useCallback(() => {
    router.push("/dashboard?businessCreated=true");
  }, [router]);

  useEffect(() => {
    const loadUserData = async () => {
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          attempt++;
          console.log(`🔍 CreateBusinessClient: Checking authentication (attempt ${attempt}/${maxRetries})...`);
          
          // Add a delay that increases with each attempt
          if (attempt > 1) {
            const delay = attempt * 500;
            console.log(`⏳ CreateBusinessClient: Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          console.log("🕒 CreateBusinessClient: Getting user authentication...");
          
          const { data: { user }, error: userError } = await getUserOrMock(supabase);
          
          console.log("🔍 CreateBusinessClient: getUserOrMock result:", { user: user?.id, error: userError, attempt });
          
          if (userError || !user) {
            console.log(`❌ CreateBusinessClient: No authenticated user (attempt ${attempt})`);
            console.log("❌ CreateBusinessClient: Error details:", userError);
            
            // If this is the last attempt, redirect to sign-in
            if (attempt >= maxRetries) {
              console.log("❌ CreateBusinessClient: Max retries reached, redirecting to sign-in");
              redirectToSignIn();
              return;
            }
            
            // Otherwise, continue to next attempt
            continue;
          }

          console.log("✅ CreateBusinessClient: User authenticated:", user.id);
          setUser(user);

          // Check if user already has an account
          const accountId = await getAccountIdForUser(user.id, supabase);
          
          if (accountId) {
            // Check if user already has businesses
            const { data: businesses } = await supabase
              .from("businesses")
              .select("id")
              .eq("account_id", accountId);

            if (businesses && businesses.length > 0) {
              // User already has businesses, redirect to dashboard
              console.log("User already has businesses, redirecting to dashboard");
              redirectToDashboard();
              return;
            }
          }

          // Set as new user to show welcome popup
          setIsNewUser(true);
          
          // Ensure account exists for the user
          const finalAccountId = await ensureAccountExists(supabase, user.id);
          setAccountId(finalAccountId);
          
          // Show welcome popup for new users
          setShowWelcomePopup(true);
          
          setLoading(false);
          console.log("✅ CreateBusinessClient: Authentication complete, showing create business form");
          return;
          
        } catch (error) {
          console.error(`💥 CreateBusinessClient: Error on attempt ${attempt}:`, error);
          
          // If this is the last attempt, show error
          if (attempt >= maxRetries) {
            console.error("💥 CreateBusinessClient: Max retries reached, showing error");
            setError("Failed to load user data");
            setLoading(false);
            return;
          }
          
          // Otherwise, continue to next attempt
          continue;
        }
      }
    };

    loadUserData();
  }, [redirectToSignIn, redirectToDashboard]); // Only depend on memoized functions

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("welcomeShown", "true");
    }
    
    // Update account to mark welcome as seen (same as main dashboard)
    if (user && accountId) {
      (async () => {
        try {
          await supabase
            .from("accounts")
            .update({ has_seen_welcome: true })
            .eq("id", accountId);
          console.log("Welcome popup marked as seen");
        } catch (error) {
          console.error("Error updating welcome status:", error);
        }
      })();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={redirectToSignIn}
            className="text-blue-600 underline"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <PageCard 
        icon={<FaStore className="w-9 h-9 text-slate-blue" />}
        bottomRightImage={{
          src: "/images/prompty-catching-stars.png",
          alt: "Prompty catching stars",
          maxWidth: 400,
          maxHeight: 400
        }}
      >
        <div className="flex items-start justify-between mt-2 mb-4">
          <div className="flex flex-col mt-0 md:mt-[3px]">
            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
              Create your business
            </h1>
            <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
              Set up your business profile to get started with PromptReviews. This information will be used to generate personalized review requests.
            </p>
          </div>
        </div>

        <SimpleBusinessForm 
          user={user}
          accountId={accountId}
          onSuccess={redirectToDashboardWithFlag}
        />

        {isNewUser && showWelcomePopup && (
          <WelcomePopup 
            isOpen={showWelcomePopup}
            onClose={handleCloseWelcome}
            title="Welcome to Prompt Reviews!"
            message={`Did you know you're a star? Carl Sagan said it best:

"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."

Beautiful right! There is a flaming gas giant in you too! Wait, that didn't come out right . . .

Anyway, I am here to help you get the stars you deserve—on Google, Facebook, TripAdvisor, TrustPilot—you name it.

Here's your first tip: [icon] ← Click here`}
            imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-600kb.png"
            buttonText="Let's Wrangle Some Reviews!"
          />
        )}
      </PageCard>
    </div>
  );
}