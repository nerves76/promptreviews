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
  console.log('🔍 CreateBusinessClient: Component function called');
  
  // TEMP: Bypass admin loading to test if this is causing the infinite loading
  // const { isAdminUser, isLoading: adminLoading } = useAdmin();
  const isAdminUser = false;
  const adminLoading = false;
  
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

  // 🔧 SIMPLIFIED: Since DashboardLayout already handles authentication, just do the business logic
  useEffect(() => {
    const setupBusinessCreation = async () => {
      try {
        console.log('🔍 CreateBusinessClient: Starting business creation setup...');
        
        // 🔧 SIMPLIFIED: Use the same reliable session pattern as authGuard
        const { data: { user }, error } = await getUserOrMock(supabase);

        if (error || !user) {
          console.log('❌ CreateBusinessClient: No user found, redirecting to sign-in');
          redirectToSignIn();
          return;
        }

        console.log('✅ CreateBusinessClient: User found:', user.id);
        setUser(user);

        // Check if user already has businesses
        const accountId = await getAccountIdForUser(user.id, supabase);
        
        if (accountId) {
          const { data: businesses } = await supabase
            .from("businesses")
            .select("id")
            .eq("account_id", accountId);

          if (businesses && businesses.length > 0) {
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

    setupBusinessCreation();
  }, [redirectToDashboard, redirectToSignIn]);

  // Handle business creation success
  const handleBusinessCreated = useCallback(async () => {
    console.log("✅ CreateBusinessClient: Business created successfully");
    
    // Redirect to dashboard with success flag
    redirectToDashboardWithFlag();
  }, [redirectToDashboardWithFlag]);

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
  };

  // Show loading while checking authentication or admin status
  console.log('🔍 CreateBusinessClient: Render state check - loading:', loading, 'adminLoading:', adminLoading);
  
  if (loading || adminLoading) {
    console.log('🔄 CreateBusinessClient: Showing loading spinner');
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
        <PageCard icon={<FaStore className="h-8 w-8 text-blue-600" />}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Create Your Business Profile
            </h1>
            <p className="text-lg text-gray-600">
              Tell us about your business so we can create the perfect review prompts for you.
            </p>
          </div>
          <SimpleBusinessForm
            onSuccess={handleBusinessCreated}
            accountId={accountId}
            user={user}
          />
        </PageCard>
      </div>

      {/* Welcome popup for new users */}
      {showWelcomePopup && (
        <WelcomePopup
          isOpen={showWelcomePopup}
          onClose={handleCloseWelcome}
          title="Did you know you're a miracle?"
          message={`Carl Sagan said it best:

"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."

Beautiful right! There is a flaming gas giant in you too! Er . . . that didn't come out quite right . . .

Anyway, I am here to help you get the stars you deserve—on Google, Facebook, TripAdvisor, Trust Pilot—you name it.

Here's your first tip: [icon]. <- click here`}
        />
      )}
    </div>
  );
}