"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaStore, FaPlus } from "react-icons/fa";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";

const supabase = createClient();
// Remove the AuthContext import since DashboardLayout already handles auth
// import { useAuth } from "@/contexts/AuthContext";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";

import { ensureAccountExists, getAccountIdForUser } from "@/utils/accountUtils";

export default function CreateBusinessClient() {
  console.log('🔍 CreateBusinessClient: Component rendered');
  
  // 🔧 FIXED: Remove the auth context dependency that was causing infinite loops
  // Since DashboardLayout already ensures user is authenticated, we don't need these
  // const { isAdminUser, adminLoading } = useAuth();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Memoize router functions to prevent infinite loops
  const redirectToDashboard = useCallback(() => {
    console.log("🔄 CreateBusinessClient: redirectToDashboard called");
    router.push("/dashboard");
    console.log("🔄 CreateBusinessClient: router.push called");
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

        // Ensure account exists for the user
        const finalAccountId = await ensureAccountExists(supabase, user.id);
        console.log('🔍 CreateBusinessClient: Final account ID:', finalAccountId);
        setAccountId(finalAccountId);
        
        console.log('✅ CreateBusinessClient: Setup complete, ready to create business');
        setLoading(false);
        
      } catch (error) {
        console.error('💥 CreateBusinessClient: Unexpected error:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          error: error,
        });
        setError("Failed to load user data. Please try refreshing the page.");
        setLoading(false);
      }
    };

    setupBusinessCreation();
  }, []); // Remove redirectToDashboard dependency to prevent infinite loops

  // Handle business creation success
  const handleBusinessCreated = useCallback(async () => {
    console.log("✅ CreateBusinessClient: Business created successfully");
    console.log("🔄 CreateBusinessClient: Starting redirect process...");
    
    // Redirect to dashboard with businessCreated parameter to trigger tier selection
    console.log("🔄 CreateBusinessClient: Redirecting to dashboard with tier selection");
    router.push("/dashboard?businessCreated=1");
    console.log("🔄 CreateBusinessClient: Redirect function called");
  }, [router]);

  // Show loading while setting up business creation
  // 🔧 FIXED: Remove adminLoading dependency that was causing infinite renders
  console.log('🔍 CreateBusinessClient: Render state - loading:', loading);
  
  if (loading) {
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
      <PageCard 
        icon={<FaStore className="w-9 h-9 text-slate-blue" />}
        topRightAction={
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 flex items-center"
          >
            <FaPlus className="mr-2" />
            Go to Dashboard
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
              Tell us about your business so we can create the perfect review prompts for you. This will help us personalize your experience and generate better AI-powered content.
            </p>
          </div>
          
          <SimpleBusinessForm
            onSuccess={handleBusinessCreated}
            accountId={accountId}
            user={user}
          />
        </div>
      </PageCard>
    </div>
  );
}