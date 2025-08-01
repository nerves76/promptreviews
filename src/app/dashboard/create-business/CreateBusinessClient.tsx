"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";

const supabase = createClient();
// Remove the AuthContext import since DashboardLayout already handles auth
// import { useAuth } from "@/contexts/AuthContext";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import WelcomePopup from "@/app/components/WelcomePopup";
import { ensureAccountExists, getAccountIdForUser } from "@/utils/accountUtils";


export default function CreateBusinessClient() {
  console.log('🔍 CreateBusinessClient: Component rendered');
  
  // 🔧 FIXED: Remove the auth context dependency that was causing infinite loops
  // Since DashboardLayout already ensures user is authenticated, we don't need these
  // const { isAdminUser, adminLoading } = useAuth();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  
  // Ref to trigger form submission from top button
  const formRef = useRef<HTMLFormElement>(null);

  // Memoize router functions to prevent infinite loops
  const redirectToDashboard = useCallback(() => {
    console.log("🔄 CreateBusinessClient: redirectToDashboard called");
    router.replace("/dashboard?businessCreated=1");
    console.log("🔄 CreateBusinessClient: router.replace called with businessCreated=1");
  }, [router]);

  // Handler for closing the welcome popup
  const handleWelcomeClose = () => {
    console.log('🎉 CreateBusinessClient: Welcome popup closed');
    setShowWelcomePopup(false);
    localStorage.setItem('hasSeenCreateBusinessWelcome', 'true');
  };

  useEffect(() => {
    const setupBusinessCreation = async () => {
      try {
        console.log('🔍 CreateBusinessClient: Setting up business creation...');
        
        // Get current user (should already be authenticated by layout)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          console.error('❌ CreateBusinessClient: User not authenticated:', error);
          setError("Authentication required");
          setLoading(false);
          return;
        }

        console.log('✅ CreateBusinessClient: User authenticated:', user.id);
        setUser(user);

        // Ensure account exists and get account ID
        const accountId = await getAccountIdForUser(user.id, supabase);
        if (!accountId) {
          console.error('❌ CreateBusinessClient: No account found for user');
          setError("Account setup required");
          setLoading(false);
          return;
        }

        console.log('✅ CreateBusinessClient: Account ID:', accountId);
        setAccountId(accountId);

        // Fetch account data including first_name and last_name
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id, first_name, last_name, email')
          .eq('id', accountId)
          .single();

        if (accountError) {
          console.error('❌ CreateBusinessClient: Error fetching account data:', accountError);
        } else {
          console.log('✅ CreateBusinessClient: Account data fetched:', account);
          setAccountData(account);
        }

        setLoading(false);

        // Check if user has seen the welcome popup before
        if (typeof window !== 'undefined') {
          const hasSeenWelcome = localStorage.getItem('hasSeenCreateBusinessWelcome');
          console.log('🎉 CreateBusinessClient: Welcome popup check - hasSeenWelcome:', hasSeenWelcome);
          if (!hasSeenWelcome) {
            console.log('🎉 CreateBusinessClient: Showing welcome popup for new user');
            // Small delay to let the page load before showing popup
            setTimeout(() => {
              setShowWelcomePopup(true);
            }, 1000);
          } else {
            console.log('🎉 CreateBusinessClient: User has already seen welcome popup');
          }
        }

      } catch (err) {
        console.error('❌ CreateBusinessClient: Setup error:', err);
        setError("Setup failed");
        setLoading(false);
      }
    };

    setupBusinessCreation();
  }, []);

  // Handle successful business creation
  const handleBusinessCreated = useCallback(() => {
    console.log("✅ CreateBusinessClient: Business created successfully, redirecting...");
    setIsSubmitting(false);
    redirectToDashboard();
  }, [redirectToDashboard]);

  // Handle top save button click
  const handleTopSaveClick = useCallback(() => {
    if (isSubmitting) {
      console.log("Top button click blocked - already submitting");
      return;
    }
    
    if (formRef.current) {
      setIsSubmitting(true);
      formRef.current.requestSubmit();
    }
  }, [isSubmitting]);

  // Helper function to get a proper user name for the welcome popup
  const getUserDisplayName = () => {
    // Priority 1: Use account first_name if available
    if (accountData?.first_name?.trim()) {
      return accountData.first_name.trim();
    }
    
    // Priority 2: Use user metadata first_name if available
    if (user?.user_metadata?.first_name?.trim()) {
      return user.user_metadata.first_name.trim();
    }
    
    // Priority 3: Use user metadata full_name (first part) if available
    if (user?.user_metadata?.full_name?.trim()) {
      return user.user_metadata.full_name.trim().split(' ')[0];
    }
    
    // Priority 4: Extract a reasonable name from email
    const email = user?.email || accountData?.email || '';
    if (email) {
      const emailPart = email.split('@')[0];
      // If email part contains numbers at the end (like nerves76), remove them for a cleaner name
      const cleanName = emailPart.replace(/\d+$/, '');
      // Capitalize first letter
      if (cleanName.length > 0) {
        return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
      }
    }
    
    // Final fallback
    return 'there';
  };

  console.log('🔍 CreateBusinessClient: Render state - loading:', loading);

  if (loading) {
    return <AppLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Setup Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-slate-blue text-white px-6 py-2 rounded-lg hover:bg-slate-blue/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard
          title=""
          headerAction={
            <button
              onClick={handleTopSaveClick}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-slate-blue text-white hover:bg-slate-blue/90"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4">
                    <use href="/icons-sprite.svg#FaPlus" />
                  </svg>
                  Create Business
                </>
              )}
            </button>
          }
        >
          <div className="max-w-4xl mx-auto">
            {/* Welcome Message */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 w-full gap-2 relative">
              <h1 className="text-4xl font-bold flex items-center gap-3 text-slate-blue pt-2">
                Create your business profile
              </h1>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-blue">
                Welcome! Let's get started
              </h2>
              <p className="mt-2 text-sm text-gray-600 max-w-[650px]">
                Let's create your business profile so you can start collecting reviews and growing your reputation online.
              </p>
            </div>

            {/* Business Form */}
            {user && accountId && (
              <SimpleBusinessForm
                ref={formRef}
                user={user}
                accountId={accountId}
                onSuccess={handleBusinessCreated}
              />
            )}
          </div>
        </PageCard>
      </div>

      {/* Welcome Popup with Carl Sagan quote */}
      {console.log('🎉 CreateBusinessClient: Rendering popup - showWelcomePopup:', showWelcomePopup, 'userName will be:', getUserDisplayName())}
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={handleWelcomeClose}
        userName={getUserDisplayName()}
        imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-telescope-capturing-reviews.png"
        imageAlt="Prompty with telescope capturing reviews"
        buttonText="Let's wrangle some stars!"
        onButtonClick={handleWelcomeClose}
      />
    </>
  );
}