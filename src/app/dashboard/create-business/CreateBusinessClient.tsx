"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaStore, FaPlus } from "react-icons/fa";
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

  const [user, setUser] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  
  // Ref to trigger form submission from top button
  const formRef = useRef<HTMLFormElement>(null);

  // Memoize router functions to prevent infinite loops
  const redirectToDashboard = useCallback(() => {
    console.log("🔄 CreateBusinessClient: redirectToDashboard called");
    router.push("/dashboard");
    console.log("🔄 CreateBusinessClient: router.push called");
  }, [router]);

  // Handler for closing the welcome popup
  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenCreateBusinessWelcome', 'true');
    }
  };

  // 🔧 SIMPLIFIED: Since DashboardLayout already handles authentication, just get user and do business logic
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
        setLoading(false);

        // Check if user has seen the welcome popup before
        if (typeof window !== 'undefined') {
          const hasSeenWelcome = localStorage.getItem('hasSeenCreateBusinessWelcome');
          if (!hasSeenWelcome) {
            // Small delay to let the page load before showing popup
            setTimeout(() => {
              setShowWelcomePopup(true);
            }, 1000);
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
    redirectToDashboard();
  }, [redirectToDashboard]);

  // Handle top save button click
  const handleTopSaveClick = useCallback(() => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  }, []);

  console.log('🔍 CreateBusinessClient: Render state - loading:', loading);

  if (loading) {
    return <AppLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard 
          icon={<FaStore className="w-9 h-9 text-slate-blue" />}
        >
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-slate-blue text-white px-6 py-2 rounded-lg hover:bg-slate-blue/90"
            >
              Try Again
            </button>
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard 
          icon={<FaStore className="w-9 h-9 text-slate-blue" />}
          topRightAction={
            <button
              onClick={handleTopSaveClick}
              className="bg-slate-blue text-white px-6 py-2 rounded-lg hover:bg-slate-blue/90 transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Create Business
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
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={handleWelcomeClose}
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'}
        imageUrl="/images/prompty-catching-stars.png"
        imageAlt="Prompty catching stars"
        buttonText="Let's wrangle some stars!"
        onButtonClick={handleWelcomeClose}
      />
    </>
  );
}