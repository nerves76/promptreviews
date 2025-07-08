"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/components/AppLoader";
import { trackEvent, GA_EVENTS } from "../../utils/analytics";
import TrialBanner from "../components/TrialBanner";
import Header from "../components/Header";

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

  // Create supabase client instance
  const supabase = createClient();

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkOnboardingStatus = useCallback(async (userId: string, accountId: string): Promise<boolean> => {
    try {
      // Don't redirect if already on onboarding pages
      const currentPath = window.location.pathname;
      const onboardingPaths = ['/dashboard/create-business', '/dashboard/plan'];
      
      if (onboardingPaths.some(path => currentPath.includes(path))) {
        console.log("🔍 DashboardLayout: Already on onboarding page, no redirect needed");
        return false; // No redirect needed
      }

      // Check if user has created a business
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('account_id', accountId)
        .limit(1);

      if (businessError) {
        console.error("❌ DashboardLayout: Error checking businesses:", businessError);
        return false;
      }

      // If no business, redirect to create business
      if (!businesses || businesses.length === 0) {
        console.log("🔄 DashboardLayout: No business found, redirecting to create business");
        router.push("/dashboard/create-business");
        return true; // Redirect happening
      }

      // Check if user has selected a plan
      const { data: account } = await supabase
        .from('accounts')
        .select('plan')
        .eq('id', accountId)
        .single();

      if (!account?.plan || account.plan === 'none' || account.plan === 'no_plan') {
        console.log("🔄 DashboardLayout: No plan selected, redirecting to plan selection");
        router.push("/dashboard/plan");
        return true; // Redirect happening
      }

      console.log("✅ DashboardLayout: Onboarding complete, user can access dashboard");
      return false; // No redirect needed
    } catch (error) {
      console.error("💥 DashboardLayout: Error checking onboarding status:", error);
      return false;
    }
  }, [router]);

  const fetchAccountData = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log("🔍 DashboardLayout: Starting fetchAccountData for user:", userId);
      
      // Get the account ID for the user first
      const accountId = await getAccountIdForUser(userId, supabase);
      
      if (!accountId) {
        console.log("❌ DashboardLayout: No account found for user:", userId);
        return false;
      }

      console.log("✅ DashboardLayout: Found account ID:", accountId);

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('plan, trial_start, trial_end')
        .eq('id', accountId)
        .single();
      
      if (accountError) {
        console.error("❌ DashboardLayout: Account error:", accountError);
        return false;
      }

      console.log("✅ DashboardLayout: Fetched account data:", account);
      setAccountData(account);
      
      // Check onboarding status after account data is loaded
      console.log("🔍 DashboardLayout: Starting onboarding check...");
      const redirected = await checkOnboardingStatus(userId, accountId);
      console.log("✅ DashboardLayout: Onboarding check complete, redirected:", redirected);
      
      return redirected; // Return whether a redirect happened
      
    } catch (accountError) {
      console.error("💥 DashboardLayout: Error in fetchAccountData:", accountError);
      return false;
    }
  }, [router, checkOnboardingStatus]);

  // 🔧 AUTH & ONBOARDING: Complete auth check including onboarding flow
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 DashboardLayout: Checking authentication...');
        
        // Quick auth check using getUser (faster than getUserOrMock)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          console.log('❌ DashboardLayout: No authenticated user, redirecting to sign-in');
          router.push("/auth/sign-in");
          return;
        }

        console.log('✅ DashboardLayout: User authenticated:', user.id);
        setUser(user);
        
        // Fetch account data and check onboarding (WAIT for completion)
        const redirected = await fetchAccountData(user.id);
        
        // Only show dashboard if no redirect is happening
        if (!redirected) {
          console.log('✅ DashboardLayout: Auth and onboarding check complete, showing children');
          setLoading(false);
        } else {
          console.log('🔄 DashboardLayout: Redirect in progress, keeping loading state');
        }
        
      } catch (error) {
        console.error('💥 DashboardLayout: Unexpected error:', error);
        router.push("/auth/sign-in");
      }
    };

    if (isClient) {
      checkAuth();
    }
  }, [router, fetchAccountData, isClient]);

  // Listen for plan selection events to refresh account data
  useEffect(() => {
    const handlePlanSelection = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("DashboardLayout: Plan selection detected, refreshing account data");
      }
      if (user) {
        await fetchAccountData(user.id);
      }
    };

    const handleBusinessCreated = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("DashboardLayout: Business created detected, refreshing account data");
      }
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
        <AppLoader variant="compact" />
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
