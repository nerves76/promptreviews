"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/(app)/components/AppLoader";
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

  // Check for cancelled accounts and redirect to dashboard (which will show pricing modal)
  useEffect(() => {
    if (isInitialized && account && isClient) {
      const isCancelled = account.deleted_at !== null && account.deleted_at !== undefined;
      const hasNoPlan = !account.plan || account.plan === 'no_plan' || account.plan === 'NULL';
      
      // Allow access to /dashboard and /dashboard/plan for reactivation
      const currentPath = window.location.pathname;
      const isAllowedPath = currentPath === '/dashboard' || currentPath === '/dashboard/plan';
      
      if ((isCancelled || hasNoPlan) && !isAllowedPath) {
        console.log('🚫 Cancelled account detected, redirecting to dashboard for reactivation');
        router.push('/dashboard?reactivation=true');
      }
    }
  }, [isInitialized, account, isClient, router]);

  // Check if we're on plan page with success parameter (to avoid flash)
  const isPlanPageSuccess = typeof window !== 'undefined' && 
    window.location.pathname === '/dashboard/plan' && 
    (window.location.search.includes('success=1') || 
     sessionStorage.getItem('showPlanSuccessModal') === 'true');

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


  // Final check: Block access if account is cancelled (except for allowed paths)
  const isCancelled = account?.deleted_at !== null && account?.deleted_at !== undefined;
  const hasNoPlan = !account?.plan || account?.plan === 'no_plan' || account?.plan === 'NULL';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAllowedPath = currentPath === '/dashboard' || currentPath === '/dashboard/plan';
  
  if ((isCancelled || hasNoPlan) && !isAllowedPath) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center text-white p-8">
          <h1 className="text-3xl font-bold mb-4">Account Reactivation Required</h1>
          <p className="mb-6">Your account needs to be reactivated to continue.</p>
          <button 
            onClick={() => router.push('/dashboard?reactivation=true')}
            className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            Reactivate Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-16 md:pb-24 lg:pb-32">
      <TrialBanner accountData={account} />
      {children}
    </div>
  );
}
