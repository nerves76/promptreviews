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

  // 🔧 SIMPLIFIED: Use the same reliable session pattern as authGuard
  useEffect(() => {
    const checkAuthAndSetup = async () => {
      try {
        console.log('🔍 CreateBusinessClient: Starting authentication check...');
        
        // Use the same simple session check as authGuard (no retries, no complex logic)
        const { data: { user }, error } = await getUserOrMock(supabase);

        if (error) {
          console.log('❌ CreateBusinessClient: Authentication check failed:', error.message);
          redirectToSignIn();
          return;
        }

        if (!user) {
          console.log('ℹ️  CreateBusinessClient: No authenticated user found, redirecting to sign-in');
          redirectToSignIn();
          return;
        }

        console.log('✅ CreateBusinessClient: User authenticated:', user.id);
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
            console.log("✅ CreateBusinessClient: User already has businesses, redirecting to dashboard");
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
        
        console.log('✅ CreateBusinessClient: Setup complete, showing create business form');
        setLoading(false);
        
      } catch (error) {
        console.error('💥 CreateBusinessClient: Unexpected error:', error);
        setError("Failed to load user data. Please try refreshing the page.");
        setLoading(false);
      }
    };

    checkAuthAndSetup();
  }, [redirectToSignIn, redirectToDashboard]);

  // Handle business creation success
  const handleBusinessCreated = useCallback(async (businessData: any) => {
    console.log("✅ CreateBusinessClient: Business created successfully:", businessData);
    
    // Initialize onboarding tasks
    try {
      const response = await fetch("/api/initialize-onboarding-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId: businessData.id }),
      });

      if (!response.ok) {
        console.error("❌ CreateBusinessClient: Failed to initialize onboarding tasks");
      } else {
        console.log("✅ CreateBusinessClient: Onboarding tasks initialized");
      }
    } catch (error) {
      console.error("💥 CreateBusinessClient: Error initializing onboarding tasks:", error);
    }

    // Redirect to dashboard with success flag
    redirectToDashboardWithFlag();
  }, [redirectToDashboardWithFlag]);

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
  };

  // Show loading while checking authentication or admin status
  if (loading || adminLoading) {
    return <AppLoader variant="default" />;
  }

  // Show error if authentication failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <FaStore className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Authentication Error
            </h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <PageCard
          title="Create Your Business Profile"
          description="Tell us about your business so we can create the perfect review prompts for you."
          icon={<FaStore className="h-8 w-8 text-blue-600" />}
        >
          <SimpleBusinessForm
            onSuccess={handleBusinessCreated}
            accountId={accountId}
            user={user}
            isAdminUser={isAdminUser}
          />
        </PageCard>
      </div>

      {/* Welcome popup for new users */}
      {showWelcomePopup && (
        <WelcomePopup
          isOpen={showWelcomePopup}
          onClose={handleCloseWelcome}
          userName={user?.user_metadata?.first_name || user?.email || ""}
        />
      )}
    </div>
  );
}