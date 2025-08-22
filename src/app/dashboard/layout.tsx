"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
        <AppLoader variant="centered" />
      </div>
    );
  }


  return (
    <div className="w-full bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 pb-16 md:pb-24 lg:pb-32">
      <TrialBanner accountData={account} />
      {children}
    </div>
  );
}
