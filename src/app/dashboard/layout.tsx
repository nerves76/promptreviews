"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, getUserOrMock } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/components/AppLoader";
import { trackEvent, GA_EVENTS } from "../../utils/analytics";
import TrialBanner from "../components/TrialBanner";

// Use the singleton Supabase client instead of creating a new instance
// This prevents "Multiple GoTrueClient instances" warnings and ensures proper session persistence

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchAccountData = useCallback(async (userId: string) => {
    try {
      // Get the account ID for the user first
      const accountId = await getAccountIdForUser(userId, supabase);
      
      if (!accountId) {
        console.log("DashboardLayout: No account found for user:", userId);
        return;
      }

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('plan, trial_start, trial_end')
        .eq('id', accountId)
        .single();
      
      console.log("DashboardLayout: Fetched account data:", account);
      console.log("DashboardLayout: Account error:", accountError);
      setAccountData(account);
    } catch (accountError) {
      console.error("Error fetching account data:", accountError);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          attempt++;
          console.log(`🔍 DashboardLayout: Checking authentication (attempt ${attempt}/${maxRetries})...`);
          
          // Add a delay that increases with each attempt
          if (attempt > 1) {
            const delay = attempt * 500;
            console.log(`⏳ DashboardLayout: Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          console.log("🕒 DashboardLayout: Getting user authentication...");
          
          const { data: { user }, error } = await getUserOrMock(supabase);
          
          console.log("🔍 DashboardLayout: getUserOrMock result:", { user: user?.id, error, attempt });
          
          if (error || !user) {
            console.log(`❌ DashboardLayout: No authenticated user (attempt ${attempt})`);
            console.log("❌ DashboardLayout: Error details:", error);
            
            // If this is the last attempt, redirect to sign-in
            if (attempt >= maxRetries) {
              console.log("❌ DashboardLayout: Max retries reached, redirecting to sign-in");
              router.push("/auth/sign-in");
              return;
            }
            
            // Otherwise, continue to next attempt
            continue;
          }

          console.log("✅ DashboardLayout: User authenticated:", user.id);
          setUser(user);
          
          console.log("🔄 DashboardLayout: Fetching account data...");
          // Fetch account data for the TrialBanner
          await fetchAccountData(user.id);
          console.log("✅ DashboardLayout: Account data fetched");
          
          setLoading(false);
          console.log("✅ DashboardLayout: Authentication complete, showing dashboard");
          return; // Success, exit the retry loop
          
        } catch (error) {
          console.error(`💥 DashboardLayout: Auth check error (attempt ${attempt}):`, error);
          
          if (attempt >= maxRetries) {
            console.error("💥 DashboardLayout: Max retries reached, redirecting to sign-in");
            router.push("/auth/sign-in");
            return;
          }
        }
      }
    };

    if (isClient) {
      checkAuth();
    }
  }, [router, fetchAccountData, isClient]);

  // Listen for plan selection events to refresh account data
  useEffect(() => {
    const handlePlanSelection = async () => {
      console.log("DashboardLayout: Plan selection detected, refreshing account data");
      if (user) {
        await fetchAccountData(user.id);
      }
    };

    const handleBusinessCreated = async () => {
      console.log("DashboardLayout: Business created detected, refreshing account data");
      if (user) {
        await fetchAccountData(user.id);
      }
    };

    // Listen for custom events that indicate plan selection or business creation
    window.addEventListener('planSelected', handlePlanSelection);
    window.addEventListener('businessCreated', handleBusinessCreated);

    return () => {
      window.removeEventListener('planSelected', handlePlanSelection);
      window.removeEventListener('businessCreated', handleBusinessCreated);
    };
  }, [user, fetchAccountData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="centered" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    // Track sign out event
    trackEvent(GA_EVENTS.SIGN_OUT, {
      timestamp: new Date().toISOString(),
    });
    
    await supabase.auth.signOut();
    if (isClient) {
      sessionStorage.removeItem("hideTrialBanner");
    }
    router.push("/auth/sign-in");
  };

  return (
    <div className="w-full bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 pb-16 md:pb-24 lg:pb-32">
      <TrialBanner accountData={accountData} />
      {children}
    </div>
  );
}
