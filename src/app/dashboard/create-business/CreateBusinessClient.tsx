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
  const [authStateListening, setAuthStateListening] = useState(false);

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

  // Enhanced session validation function
  const validateSession = useCallback(async () => {
    try {
      const { data: { user }, error } = await getUserOrMock(supabase);
      if (error) {
        console.log("🔍 CreateBusinessClient: Session validation error:", error);
        return { valid: false, user: null, error };
      }
      if (!user) {
        console.log("🔍 CreateBusinessClient: No user in session");
        return { valid: false, user: null, error: null };
      }
      console.log("✅ CreateBusinessClient: Session valid for user:", user.id);
      return { valid: true, user, error: null };
    } catch (error) {
      console.error("💥 CreateBusinessClient: Session validation failed:", error);
      return { valid: false, user: null, error };
    }
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const maxRetries = 5; // Increased from 3 to 5
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          attempt++;
          console.log(`🔍 CreateBusinessClient: Checking authentication (attempt ${attempt}/${maxRetries})...`);
          
          // Enhanced exponential backoff: 1s, 2s, 3s, 4s, 5s
          if (attempt > 1) {
            const delay = attempt * 1000; // Changed from 500ms to 1000ms
            console.log(`⏳ CreateBusinessClient: Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          console.log("🕒 CreateBusinessClient: Getting user authentication...");
          
          // Use enhanced session validation
          const sessionResult = await validateSession();
          
          console.log("🔍 CreateBusinessClient: Session validation result:", { 
            valid: sessionResult.valid, 
            userId: sessionResult.user?.id, 
            error: sessionResult.error, 
            attempt 
          });
          
          if (!sessionResult.valid || !sessionResult.user) {
            console.log(`❌ CreateBusinessClient: Invalid session (attempt ${attempt})`);
            console.log("❌ CreateBusinessClient: Error details:", sessionResult.error);
            
            // If this is the last attempt, redirect to sign-in
            if (attempt >= maxRetries) {
              console.log("❌ CreateBusinessClient: Max retries reached, redirecting to sign-in");
              redirectToSignIn();
              return;
            }
            
            // Otherwise, continue to next attempt
            continue;
          }

          const authenticatedUser = sessionResult.user;
          console.log("✅ CreateBusinessClient: User authenticated:", authenticatedUser.id);
          setUser(authenticatedUser);

          // Check if user already has an account
          const accountId = await getAccountIdForUser(authenticatedUser.id, supabase);
          
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
          const finalAccountId = await ensureAccountExists(supabase, authenticatedUser.id);
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
            setError("Failed to load user data after multiple attempts. Please try refreshing the page.");
            setLoading(false);
            return;
          }
          
          // Otherwise, continue to next attempt
          continue;
        }
      }
    };

    // Set up auth state change listener as secondary detection method
    const setupAuthStateListener = () => {
      if (authStateListening) return; // Prevent duplicate listeners
      
      setAuthStateListening(true);
      console.log("🔍 CreateBusinessClient: Setting up auth state change listener...");
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("🔍 CreateBusinessClient: Auth state changed:", { event, hasSession: !!session, userId: session?.user?.id });
          
          if (event === 'SIGNED_IN' && session?.user && loading) {
            console.log("✅ CreateBusinessClient: User signed in via auth state change, stopping loading loop");
            setLoading(false);
            setUser(session.user);
            
            // Process the newly signed-in user
            try {
              const accountId = await getAccountIdForUser(session.user.id, supabase);
              if (accountId) {
                const { data: businesses } = await supabase
                  .from("businesses")
                  .select("id")
                  .eq("account_id", accountId);

                if (businesses && businesses.length > 0) {
                  redirectToDashboard();
                  return;
                }
              }
              
              setIsNewUser(true);
              const finalAccountId = await ensureAccountExists(supabase, session.user.id);
              setAccountId(finalAccountId);
              setShowWelcomePopup(true);
            } catch (error) {
              console.error("💥 CreateBusinessClient: Error processing auth state change:", error);
            }
          }
        }
      );

      // Cleanup function
      return () => {
        console.log("🔍 CreateBusinessClient: Cleaning up auth state listener");
        subscription.unsubscribe();
        setAuthStateListening(false);
      };
    };

    // Start both the retry logic and auth state listener
    loadUserData();
    const cleanup = setupAuthStateListener();

    // Return cleanup function
    return cleanup;
  }, [redirectToSignIn, redirectToDashboard, validateSession, loading, authStateListening]); // Added dependencies

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
        <div className="mt-4 text-center">
          <p className="text-gray-600">Setting up your account...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
          <p className="mb-4">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
            <button
              onClick={redirectToSignIn}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Sign In Again
            </button>
          </div>
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