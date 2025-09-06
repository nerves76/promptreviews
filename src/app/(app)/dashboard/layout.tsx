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
  }, []);


  // 🔧 SIMPLIFIED AUTH: Use AuthContext instead of independent auth checking
  // AuthContext already handles all authentication, session management, and account loading
  // This eliminates the race condition that caused infinite redirects



  // DEBUG: Log authentication state (DISABLED - was causing infinite re-renders)
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //   }
  // }, [isInitialized, isLoading, user, accountLoading, account]);

  // Handle redirect to sign-in in useEffect to avoid render-time side effects
  // This must be called before any conditional returns to follow React hooks rules
  useEffect(() => {
    if (isInitialized && !user && isClient) {
      if (process.env.NODE_ENV === 'development') {
      }
      router.push('/auth/sign-in');
    }
  }, [isInitialized, user, isClient, router]);

  // Check for users without accounts and redirect to create-business
  useEffect(() => {
    // Skip this check on the create-business page
    const isOnCreateBusinessPage = window.location.pathname === '/dashboard/create-business';
    
    // Skip this check if we just created a business
    const justCreatedBusiness = window.location.search.includes('businessCreated=1');
    
    if (justCreatedBusiness) {
      return; // Skip the account check
    }
    
    // Wait before checking - give the account context time to load
    const checkTimeout = setTimeout(() => {
      // Only check after account loading is complete and user is authenticated
      if (isInitialized && user && !accountLoading && isClient && !isOnCreateBusinessPage) {
        // Check localStorage for stored selection (using correct key format)
        const storedSelection = localStorage.getItem(`promptreviews_selected_account_${user.id}`);
        
        // If no account exists after loading is complete AND no account is selected
        // This prevents redirect loops when switching accounts
        if (!account && !accountLoading && !storedSelection) {
          console.warn('User authenticated but no account found and none selected:', user.id);
          // No account and no selection, redirect to create-business
          router.push('/dashboard/create-business');
        }
      }
    }, 2000); // Wait 2 seconds before checking
    
    return () => clearTimeout(checkTimeout);
  }, [isInitialized, user, account, accountLoading, isClient, router]);

  // Check for accounts without plans and redirect to plan selection
  useEffect(() => {
    if (isInitialized && account && isClient) {
      const hasNoPlan = !account.plan || account.plan === 'no_plan' || account.plan === 'NULL';
      
      // Allow access to /dashboard and /dashboard/plan for plan selection
      const currentPath = window.location.pathname;
      const isAllowedPath = currentPath === '/dashboard' || currentPath === '/dashboard/plan';
      
      if (hasNoPlan && !isAllowedPath) {
        router.push('/dashboard');
      }
    }
  }, [isInitialized, account, isClient, router]);

  // Check if we're on plan page with success parameter (to avoid flash)
  const [isPlanPageSuccess, setIsPlanPageSuccess] = useState(false);
  
  useEffect(() => {
    // Only check on client side after mount
    const isSuccess = window.location.pathname === '/dashboard/plan' && 
      window.location.search.includes('success=1');
    setIsPlanPageSuccess(isSuccess);
  }, []);

  // Show loading while AuthContext initializes
  if (!isInitialized && !isPlanPageSuccess) {
    if (process.env.NODE_ENV === 'development') {
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
