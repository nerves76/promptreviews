"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

  // Show loading while AuthContext initializes
  if (!isInitialized) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Dashboard: Waiting for AuthContext initialization...');
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="compact" />
      </div>
    );
  }

  // After initialization, if no user, redirect to sign-in  
  if (isInitialized && !user) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Dashboard: No user found after initialization, redirecting to sign-in');
    }
    router.push('/auth/sign-in');
    return null;
  }

  // Show loading while user data or account data is still loading
  if (isLoading || accountLoading) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Dashboard: Loading user or account data...');
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="compact" />
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
