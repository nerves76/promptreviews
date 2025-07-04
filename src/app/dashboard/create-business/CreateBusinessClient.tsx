"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaStore } from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabaseClient";
import { useAdmin } from "@/contexts/AdminContext";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import WelcomePopup from "@/app/components/WelcomePopup";
import { supabase } from "@/utils/supabaseClient";
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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError("");

        // Wait for session to be initialized with retry logic
        let session = null;
        let sessionError = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
          
          if (currentSession) {
            session = currentSession;
            break;
          }
          
          if (currentError) {
            sessionError = currentError;
            console.log(`Session attempt ${retryCount + 1} failed:`, currentError);
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!session) {
          console.log("No session after retries, redirecting to sign-in");
          router.push("/auth/sign-in");
          return;
        }

        // Get user data
        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          console.log("User error:", userError);
          setError("Failed to load user data");
          setLoading(false);
          return;
        }

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
            router.push("/dashboard");
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
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load user data");
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

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
            onClick={() => router.push("/auth/sign-in")}
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
          onSuccess={() => {
            console.log("SimpleBusinessForm onSuccess called, redirecting to dashboard with business created flag");
            router.push("/dashboard?businessCreated=true");
          }}
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