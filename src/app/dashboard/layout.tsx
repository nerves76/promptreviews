"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
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

  // Create supabase client instance
  const supabase = createClient();

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkOnboardingStatus = useCallback(async (userId: string, accountId: string) => {
    try {
      // Don't redirect if already on onboarding pages
      const currentPath = window.location.pathname;
      const onboardingPaths = ['/dashboard/create-business', '/dashboard/plan'];
      
      if (onboardingPaths.some(path => currentPath.includes(path))) {
        return;
      }

      // Check if user has created a business
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('account_id', accountId)
        .limit(1);

      if (businessError) {
        console.error("Error checking businesses:", businessError);
        return;
      }

      // If no business, redirect to create business
      if (!businesses || businesses.length === 0) {
        console.log("DashboardLayout: No business found, redirecting to create business");
        router.push("/dashboard/create-business");
        return;
      }

      // Check if user has selected a plan
      const { data: account } = await supabase
        .from('accounts')
        .select('plan')
        .eq('id', accountId)
        .single();

      if (!account?.plan || account.plan === 'none') {
        console.log("DashboardLayout: No plan selected, redirecting to plan selection");
        router.push("/dashboard/plan");
        return;
      }

      console.log("DashboardLayout: Onboarding complete, user can access dashboard");
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  }, [router]);

  const fetchAccountData = useCallback(async (userId: string) => {
    try {
      // Get the account ID for the user first
      const accountId = await getAccountIdForUser(userId, supabase);
      
      if (!accountId) {
        if (process.env.NODE_ENV === 'development') {
          console.log("DashboardLayout: No account found for user:", userId);
        }
        return;
      }

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('plan, trial_start, trial_end')
        .eq('id', accountId)
        .single();
      
      if (process.env.NODE_ENV === 'development') {
        console.log("DashboardLayout: Fetched account data:", account);
      }
      if (accountError && process.env.NODE_ENV === 'development') {
        console.log("DashboardLayout: Account error:", accountError);
      }
      setAccountData(account);
      
      // Check onboarding status after account data is loaded
      await checkOnboardingStatus(userId, accountId);
    } catch (accountError) {
      console.error("Error fetching account data:", accountError);
    }
  }, [router, checkOnboardingStatus]);

  // 🔧 SIMPLIFIED: Quick auth check, then let children handle their own logic
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
        
        // Fetch account data in background (don't block children)
        fetchAccountData(user.id).catch(console.error);
        
        console.log('✅ DashboardLayout: Auth complete, showing children');
        setLoading(false);
        
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
