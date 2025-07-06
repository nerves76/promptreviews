"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaStore } from "react-icons/fa";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";

const supabase = createClient();
import { useAdmin } from "@/contexts/AdminContext";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import WelcomePopup from "@/app/components/WelcomePopup";
import { ensureAccountExists, getAccountIdForUser } from "@/utils/accountUtils";

export default function CreateBusinessClient() {
  console.log('🔍 CreateBusinessClient: Component rendered');
  
  // 🔧 FIXED: Use the admin context properly without causing infinite loops
  const { isAdminUser, isLoading: adminLoading } = useAdmin();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Memoize router functions to prevent infinite loops
  const redirectToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const redirectToDashboardWithFlag = useCallback(() => {
    router.push("/dashboard?businessCreated=true");
  }, [router]);

  // 🔧 SIMPLIFIED: Since DashboardLayout already handles authentication, just get user and do business logic
  useEffect(() => {
    const setupBusinessCreation = async () => {
      try {
        console.log('🔍 CreateBusinessClient: Setting up business creation...');
        
        // Get current user (should already be authenticated by layout)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          console.log('❌ CreateBusinessClient: No user found (layout should have handled this)');
          setError("Authentication error. Please refresh the page.");
          setLoading(false);
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

        // Ensure account exists for the user
        const finalAccountId = await ensureAccountExists(supabase, user.id);
        setAccountId(finalAccountId);
        
        // Show welcome popup for new users
        setShowWelcomePopup(true);
        
        console.log('✅ CreateBusinessClient: Setup complete, ready to create business');
        setLoading(false);
        
      } catch (error) {
        console.error('💥 CreateBusinessClient: Unexpected error:', error);
        setError("Failed to load user data. Please try refreshing the page.");
        setLoading(false);
      }
    };

    setupBusinessCreation();
  }, [redirectToDashboard]);

  // Handle business creation success
  const handleBusinessCreated = useCallback(async () => {
    console.log("✅ CreateBusinessClient: Business created successfully");
    
    // Redirect to dashboard with success flag
    redirectToDashboardWithFlag();
  }, [redirectToDashboardWithFlag]);

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
  };

  // Show loading while setting up business creation
  console.log('🔍 CreateBusinessClient: Render state - loading:', loading, 'adminLoading:', adminLoading);
  
  if (loading || adminLoading) {
    console.log('🔄 CreateBusinessClient: Showing loading spinner');
    return <AppLoader variant="default" />;
  }

  // Show error if setup failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <FaStore className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Setup Error
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
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <PageCard icon={<FaStore className="w-9 h-9 text-slate-blue" />}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mt-2 mb-4">
            <div className="flex flex-col mt-0 md:mt-[3px]">
              <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
                Create Your Business Profile
              </h1>
              <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
                Tell us about your business so we can create the perfect review prompts for you.
              </p>
            </div>
          </div>
          
          <SimpleBusinessForm
            onSuccess={handleBusinessCreated}
            accountId={accountId}
            user={user}
          />
        </div>
      </PageCard>

      {/* Welcome popup for new users */}
      {showWelcomePopup && (
        <WelcomePopup
          isOpen={showWelcomePopup}
          onClose={handleCloseWelcome}
          title={`Howdy ${user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there'},`}
          message={`Did you know you're a star?

Carl Sagan said it best:

"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."

Beautiful right! There is a flaming gas giant in you too! Er . . . that didn't come out quite right . . .

Anyway, I am here to help you get the stars you deserve—on Google, Facebook, TripAdvisor, Trust Pilot—you name it.

Here's your first tip: [icon]. <- click here`}
          buttonText="Let's wrangle some reviews!"
        />
      )}
    </div>
  );
}