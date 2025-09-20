"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AppLoader from "@/app/(app)/components/AppLoader";
import { useGlobalLoader } from "@/app/(app)/components/GlobalLoaderProvider";
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
  
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useGlobalLoader();

  const businessCreatedFlag = searchParams?.get('businessCreated') ?? null;
  const successFlag = searchParams?.get('success') ?? null;

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setHasMounted(true);
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
    if (isInitialized && !user && hasMounted) {
      if (process.env.NODE_ENV === 'development') {
      }
      router.push('/auth/sign-in');
    }
  }, [isInitialized, user, hasMounted, router]);

  // Check for users without accounts and redirect to create-business
  useEffect(() => {
    // Skip this check on the create-business page - ALWAYS skip for this page
    if (!hasMounted) {
      return;
    }

    const isOnCreateBusinessPage = pathname === '/dashboard/create-business';
    if (isOnCreateBusinessPage) {
      return; // Never redirect from create-business page
    }

    // Skip this check if we just created a business
    const justCreatedBusiness = businessCreatedFlag === '1';

    if (justCreatedBusiness) {
      return; // Skip the account check
    }
    
    // Wait before checking - give the account context time to load
    const checkTimeout = setTimeout(() => {
      // Only check after account loading is complete and user is authenticated
      if (isInitialized && user && !accountLoading && hasMounted) {
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
  }, [hasMounted, isInitialized, user, account, accountLoading, pathname, businessCreatedFlag, router]);

  // Check for accounts without plans and redirect to plan selection
  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    if (isInitialized && account) {
      const hasNoPlan = !account.plan || account.plan === 'no_plan' || account.plan === 'NULL';

      const isAllowedPath =
        pathname === '/dashboard' ||
        pathname === '/dashboard/plan' ||
        pathname.startsWith('/dashboard/create-business');

      if (hasNoPlan && !isAllowedPath) {
        router.push('/dashboard/create-business');
      }
    }
  }, [hasMounted, isInitialized, account, pathname, router]);

  const isOnCreateBusinessPage = pathname === '/dashboard/create-business';
  const isPlanPageSuccess = useMemo(() => {
    return pathname === '/dashboard/plan' && successFlag === '1';
  }, [pathname, successFlag]);

  // Check if we're on create-business page
  // Show loading while AuthContext initializes (but not on create-business page)
  useEffect(() => {
    const showOverlay = (!isInitialized && !isPlanPageSuccess && !isOnCreateBusinessPage) ||
      ((isLoading || accountLoading) && !isPlanPageSuccess && !isOnCreateBusinessPage);
    if (showOverlay) loader.show('layout'); else loader.hide('layout');
    return () => loader.hide('layout');
  }, [isInitialized, isPlanPageSuccess, isOnCreateBusinessPage, isLoading, accountLoading, loader]);
  if (!isInitialized && !isPlanPageSuccess && !isOnCreateBusinessPage) return null;

  // Show nothing while redirecting
  if (isInitialized && !user && hasMounted) {
    return null;
  }
  
  // Show loading while user data or account data is still loading
  // BUT skip if we're showing plan success modal OR on create-business page
  if ((isLoading || accountLoading) && !isPlanPageSuccess && !isOnCreateBusinessPage) return null;


  // If account has no plan and not on allowed paths, the useEffect above will redirect
  // No need to show any special UI here

  return (
    <div className="w-full min-h-screen pb-16 md:pb-24 lg:pb-32">
      <TrialBanner accountData={account} />
      {children}
    </div>
  );
}
