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
  // Use the centralized admin context instead of local state
  const { isAdminUser, isLoading: adminLoading } = useAdmin();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Use auth guard to ensure user is authenticated
  useAuthGuard();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError("");

        // Wait for session to be initialized
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Authentication error. Please sign in again.");
          setLoading(false);
          return;
        }

        if (!session) {
          setError("No active session. Please sign in.");
          setLoading(false);
          return;
        }

        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          setError("You must be signed in to create a business.");
          setLoading(false);
          return;
        }

        setUser(user);

        // Ensure account exists for the user
        const accountId = await ensureAccountExists(supabase, user.id);
        setAccountId(accountId);

        // Show welcome popup for new users
        setShowWelcomePopup(true);

        setLoading(false);
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load user data. Please try signing in again.");
        setLoading(false);
      }
    };

    // Only load data if admin status is not loading
    if (!adminLoading) {
      loadUserData();
    }
  }, [adminLoading]);

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("welcomeShown", "true");
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
        bottomLeftImage={{
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
            router.push("/dashboard");
          }}
        />

        {showWelcomePopup && (
          <WelcomePopup onClose={handleCloseWelcome} />
        )}
      </PageCard>
    </div>
  );
}