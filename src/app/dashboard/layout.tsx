"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/components/AppLoader";
import { trackEvent, GA_EVENTS } from "../../utils/analytics";
import TrialBanner from "../components/TrialBanner";
import Header from "../components/Header";
import { getOnboardingStatus } from "@/utils/onboardingUtils";

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
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const router = useRouter();

  // Create supabase client instance
  const supabase = createClient();

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);



  const fetchAccountData = useCallback(async (userId: string) => {
    try {
      // Get the account ID for the user first
      const accountId = await getAccountIdForUser(userId, supabase);
      
      if (!accountId) {
        console.log("❌ DashboardLayout: No account found for user:", userId);
        return;
      }

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('plan, trial_start, trial_end')
        .eq('id', accountId)
        .single();
      
      if (accountError) {
        console.error("❌ DashboardLayout: Account error:", accountError);
        return;
      }

      setAccountData(account);
      
    } catch (accountError) {
      console.error("💥 DashboardLayout: Error in fetchAccountData:", accountError);
    }
  }, []);

  // 🔧 AUTH & ONBOARDING: Authentication and onboarding check
  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        // DEVELOPMENT MODE BYPASS - Check for dev bypass flag  
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
          const devBypass = localStorage.getItem('dev_auth_bypass');
          if (devBypass === 'true') {
            console.log('🔧 DEV MODE: DashboardLayout using authentication bypass');
            const mockUser = {
              id: 'dev-user-12345',
              email: 'dev@example.com',
              user_metadata: {
                first_name: 'Dev',
                last_name: 'User'
              }
            };
            setUser(mockUser);
            setLoading(false);
            return;
          }
        }
        
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/auth/sign-in");
          return;
        }

        setUser(user);
        
        // Check if user is coming from a successful plan change
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const isComingFromPlanChange = urlParams?.get("success") === "1" && (urlParams?.get("change") === "upgrade" || urlParams?.get("change") === "downgrade");
        
        // Skip business redirects if user is coming from a successful plan change
        // The global BusinessGuard will handle business requirements for other cases
        if (isComingFromPlanChange) {
          console.log('🔄 DashboardLayout: User coming from plan change, skipping business redirect');
          // Fetch account data for TrialBanner
          await fetchAccountData(user.id);
          setLoading(false);
          return;
        }
        
        // Get onboarding status for reference but don't redirect (BusinessGuard handles it)
        console.log('🔍 DashboardLayout: Getting onboarding status for user:', user.id);
        const userOnboardingStatus = await getOnboardingStatus(supabase, user.id);
        
        console.log('🔍 DashboardLayout: Onboarding status:', userOnboardingStatus);
        setOnboardingStatus(userOnboardingStatus);
        
        // Fetch account data for TrialBanner
        await fetchAccountData(user.id);
        
        setLoading(false);
        
      } catch (error) {
        console.error('💥 DashboardLayout: Unexpected error:', error);
        router.push("/auth/sign-in");
      }
    };

    if (isClient) {
      checkAuthAndOnboarding();
    }
  }, [router, isClient]);



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
