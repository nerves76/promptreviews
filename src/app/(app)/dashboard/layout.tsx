"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/(app)/components/AppLoader";
import { trackEvent, GA_EVENTS } from "@/utils/analytics";
import TrialBanner from "../components/TrialBanner";
import Header from "../components/Header";

// Use the singleton Supabase client instead of creating a new instance
// This prevents "Multiple GoTrueClient instances" warnings and ensures proper session persistence

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use AuthContext instead of managing auth state independently
  const { 
    user, 
    isLoading, 
    isInitialized, 
    account, 
    accountLoading,
    signOut 
  } = useAuth();
  
  const [isClient, setIsClient] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
    
    // Check for redirect flags to maintain smooth transitions
    const authRedirect = sessionStorage.getItem('auth-redirect-in-progress');
    const businessCreated = sessionStorage.getItem('business-creation-complete');
    const redirectInProgress = sessionStorage.getItem('redirect-in-progress');
    
    if (authRedirect || businessCreated || redirectInProgress) {
      setIsTransitioning(true);
      
      // Clear flags and stop transitioning after a brief delay
      setTimeout(() => {
        sessionStorage.removeItem('auth-redirect-in-progress');
        sessionStorage.removeItem('business-creation-complete');
        sessionStorage.removeItem('redirect-in-progress');
        setIsTransitioning(false);
      }, 500);
    }
  }, []);


  // 🔧 SIMPLIFIED AUTH: Use AuthContext instead of independent auth checking
  // AuthContext already handles all authentication, session management, and account loading
  // This eliminates the race condition that caused infinite redirects



  // DEBUG: Log authentication state (DISABLED - was causing infinite re-renders)
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log('🔍 Dashboard Layout State:', {
  //       isInitialized,
  //       isLoading,
  //       hasUser: !!user,
  //       userEmail: user?.email,
  //       accountLoading,
  //       hasAccount: !!account,
  //       accountId: account?.id,
  //       timestamp: new Date().toISOString()
  //     });
  //   }
  // }, [isInitialized, isLoading, user, accountLoading, account]);

  // Handle redirect to sign-in in useEffect to avoid render-time side effects
  // This must be called before any conditional returns to follow React hooks rules
  useEffect(() => {
    if (isInitialized && !user && isClient) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Dashboard: No user found after initialization, redirecting to sign-in');
      }
      router.push('/auth/sign-in');
    }
  }, [isInitialized, user, isClient, router]);

  // Check for users without accounts and redirect to sign-up
  useEffect(() => {
    // Skip this check on the create-business page - users need to be able to create their first business!
    const isOnCreateBusinessPage = window.location.pathname === '/dashboard/create-business';
    
    // Skip this check if we just created a business (coming from create-business page)
    const justCreatedBusiness = window.location.search.includes('businessCreated=1') || 
                               sessionStorage.getItem('business-creation-complete') === 'true';
    
    // Skip this check if we just came from signup (give the account time to be created)
    const justSignedUp = sessionStorage.getItem('just-signed-up') === 'true';
    
    if (justSignedUp || justCreatedBusiness) {
      console.log('⏳ Dashboard: Skipping account check - user just signed up or created business');
      // Clear the flags after a delay to allow future checks
      setTimeout(() => {
        sessionStorage.removeItem('just-signed-up');
        sessionStorage.removeItem('business-creation-complete');
      }, 5000);
      return; // Skip the account check
    }
    
    // Only check after account loading is complete and user is authenticated
    if (isInitialized && user && !accountLoading && isClient && !isOnCreateBusinessPage) {
      // If no account exists after loading is complete, redirect to sign-up/onboarding
      if (!account && !accountLoading) {
        console.log('❌ Dashboard: User has no accounts, redirecting to sign-up/onboarding');
        // Clear any auth session and redirect to sign-up
        signOut();
        router.push('/auth/sign-up');
      }
    }
  }, [isInitialized, user, account, accountLoading, isClient, router, signOut]);

  // Check for accounts without plans and redirect to plan selection
  useEffect(() => {
    if (isInitialized && account && isClient) {
      const hasNoPlan = !account.plan || account.plan === 'no_plan' || account.plan === 'NULL';
      
      // Allow access to /dashboard and /dashboard/plan for plan selection
      const currentPath = window.location.pathname;
      const isAllowedPath = currentPath === '/dashboard' || currentPath === '/dashboard/plan';
      
      if (hasNoPlan && !isAllowedPath) {
        console.log('📋 No plan detected, redirecting to dashboard for plan selection');
        router.push('/dashboard');
      }
    }
  }, [isInitialized, account, isClient, router]);

  // Check if we're on plan page with success parameter (to avoid flash)
  // Initialize to false on both server and client to avoid hydration mismatch
  const [isPlanPageSuccess, setIsPlanPageSuccess] = useState(false);
  
  useEffect(() => {
    // Only check on client side after mount
    const isSuccess = window.location.pathname === '/dashboard/plan' && 
      (window.location.search.includes('success=1') || 
       sessionStorage.getItem('showPlanSuccessModal') === 'true');
    setIsPlanPageSuccess(isSuccess);
  }, []);

  // Show loading while AuthContext initializes or during transitions
  if ((!isInitialized || isTransitioning) && !isPlanPageSuccess) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Dashboard: Loading state', { isInitialized, isTransitioning });
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="centered" />
      </div>
    );
  }

  // Show nothing while redirecting
  if (isInitialized && !user && isClient) {
    return null;
  }
  
  // Show loading while user data or account data is still loading
  // BUT skip if we're showing plan success modal
  if ((isLoading || accountLoading) && !isPlanPageSuccess) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Dashboard: Loading user or account data...');
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="centered" />
      </div>
    );
  }


  // If account has no plan and not on allowed paths, the useEffect above will redirect
  // No need to show any special UI here

  return (
    <div className="w-full min-h-screen pb-16 md:pb-24 lg:pb-32">
      <TrialBanner accountData={account} />
      {children}
    </div>
  );
}
