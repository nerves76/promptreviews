"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessGuardProps {
  children: React.ReactNode;
}

export default function BusinessGuard({ children }: BusinessGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    isAuthenticated, 
    hasBusiness, 
    isLoading, 
    businessLoading,
    accountLoading 
  } = useAuth();

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading || businessLoading || accountLoading) {
      return;
    }

    // Only apply business requirements to authenticated users
    if (!isAuthenticated) {
      return;
    }

    // Define exempt routes where business requirements don't apply
    const exemptRoutes = [
      // Auth pages
      "/auth/sign-in",
      "/auth/sign-up",
      "/auth/callback",
      "/auth/clear-session",
      "/auth/debug-auth",
      "/sign-in",
      "/sign-up",
      "/sign-out",
      "/reset-password",
      
      // Business creation pages
      "/dashboard/create-business",
      
      // Public pages (review pages)
      "/r/",
      
      // Public pages and legal
      "/privacy",
      "/terms",
      
      // Team invitation pages
      "/team/accept",
      
      // Debug and test pages
      "/debug-cookies",
      "/debug-nav",
      "/test-auth-browser",
      "/test-auth-context",
      "/test-console",
      "/test-env",
      "/test-ga",
      "/test-sentry",
      "/auth-test",
      
      // API routes
      "/api/",
      
      // Payment demo
      "/payment-demo"
    ];

    // Check if current path is exempt
    const isExempt = exemptRoutes.some(route => {
      if (route.endsWith("/")) {
        return pathname.startsWith(route);
      }
      return pathname === route || pathname.startsWith(route + "/");
    });

    // If path is exempt, don't enforce business requirements
    if (isExempt) {
      return;
    }

    // Get URL parameters and session flags
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isComingFromPlanChange = urlParams?.get("success") === "1" && 
      (urlParams?.get("change") === "upgrade" || urlParams?.get("change") === "downgrade");
    const businessJustCreated = urlParams?.get("businessCreated") === "1";
    const businessCreationInProgress = typeof window !== "undefined" ? 
      sessionStorage.getItem('businessCreationInProgress') === 'true' : false;
    const googleOAuthInProgress = typeof window !== "undefined" ? 
      sessionStorage.getItem('googleOAuthInProgress') === 'true' : false;

    // Debug URL parameters
    if (typeof window !== "undefined" && process.env.NODE_ENV === 'development') {
      console.log('🔍 BusinessGuard: URL debug', {
        pathname,
        search: window.location.search,
        businessCreatedParam: urlParams?.get("businessCreated"),
        businessJustCreated,
        businessCreationInProgress,
        googleOAuthInProgress,
        isComingFromPlanChange,
        hasBusiness,
        timestamp: new Date().toISOString()
      });
    }

    // Skip business requirements if user is coming from plan change
    if (isComingFromPlanChange) {
      return;
    }
    
    // If Google OAuth is in progress, don't interfere to prevent session logout
    if (googleOAuthInProgress) {
      console.log('🔒 BusinessGuard: Google OAuth in progress, skipping check to preserve session');
      // Clean up the flag after a longer delay (OAuth can take time)
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('googleOAuthInProgress');
          console.log('🔒 BusinessGuard: Cleared googleOAuthInProgress flag');
        }
      }, 30000); // 30 seconds to allow OAuth to complete
      return;
    }
    
    // If business creation is in progress, don't interfere
    if (businessCreationInProgress) {
      console.log('🚫 BusinessGuard: Business creation in progress, skipping check');
      // Clean up the flag after a delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('businessCreationInProgress');
          console.log('🚫 BusinessGuard: Cleared businessCreationInProgress flag');
        }
      }, 2000);
      return;
    }
    
    // If business was just created, give the state time to update before checking
    if (businessJustCreated) {
      console.log('🎉 BusinessGuard: Business just created, allowing state to update');
      console.log('🎉 BusinessGuard: Skipping business check for 3 seconds to allow auth context update');
      
      // Clean up the URL parameter after a longer delay to prevent conflicts
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('businessCreated');
          window.history.replaceState({}, '', url.toString());
          console.log('🎉 BusinessGuard: Cleaned up businessCreated parameter');
        }
      }, 3000); // Increased from 1000ms to 3000ms
      return;
    }

    // If authenticated user doesn't have a business, redirect to create-business
    if (!hasBusiness && pathname !== '/dashboard/create-business') {
      console.log('🔄 BusinessGuard: No business found, redirecting to create-business', {
        isAuthenticated,
        hasBusiness,
        isLoading,
        businessLoading,
        accountLoading,
        pathname,
        timestamp: new Date().toISOString()
      });
      router.push("/dashboard/create-business");
      return;
    }

  }, [isAuthenticated, hasBusiness, isLoading, businessLoading, accountLoading, pathname, router]);

  return <>{children}</>;
} 