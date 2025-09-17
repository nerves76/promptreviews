/**
 * Business Guard Component
 * 
 * ⚠️ CRITICAL FOR MULTI-ACCOUNT/MULTI-BUSINESS SUPPORT ⚠️
 * =======================================================
 * 
 * This component ensures users have a business profile when required.
 * 
 * IMPORTANT RULES:
 * 1. Only redirect ACCOUNT OWNERS without businesses
 * 2. NEVER redirect team members (they don't own the business)
 * 3. NEVER redirect paid accounts (they should have businesses)
 * 4. Only redirect new accounts (< 24 hours old)
 * 
 * COMMON ISSUES:
 * - Using old BusinessGuard from /components instead of this one
 * - Not checking if user is account owner vs team member
 * - Redirecting everyone without businesses (breaks team accounts)
 * 
 * This component was rewritten to fix the 8-hour debugging session
 * where team members were being incorrectly redirected.
 * 
 * See MULTI_ACCOUNT_TROUBLESHOOTING.md for more details.
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../hooks";

interface BusinessGuardProps {
  children: React.ReactNode;
}

function BusinessGuard({ children }: BusinessGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    isAuthenticated, 
    hasBusiness, 
    isLoading, 
    businessLoading,
    accountLoading,
    account,
    user
  } = useAuth();

  useEffect(() => {
    // Don't do anything while ANY loading is happening
    // This prevents false redirects during auth state changes
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
    }

    // Skip business requirements if user is coming from plan change
    if (isComingFromPlanChange) {
      return;
    }
    
    // If Google OAuth is in progress, don't interfere to prevent session logout
    if (googleOAuthInProgress) {
      // Clean up the flag after a longer delay (OAuth can take time)
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('googleOAuthInProgress');
        }
      }, 30000); // 30 seconds to allow OAuth to complete
      return;
    }
    
    // If business creation is in progress, don't interfere
    if (businessCreationInProgress) {
      // Clean up the flag after a delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('businessCreationInProgress');
        }
      }, 2000);
      return;
    }

    // If we're intentionally on create-business page for a new account, don't redirect
    const intentionallyOnCreateBusiness = typeof window !== 'undefined' ?
      sessionStorage.getItem('intentionallyOnCreateBusiness') === 'true' : false;
    if (intentionallyOnCreateBusiness && pathname === '/dashboard/create-business') {
      // Clean up the flag after a delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('intentionallyOnCreateBusiness');
        }
      }, 5000);
      return;
    }
    
    // If business was just created, give the state time to update before checking
    if (businessJustCreated) {
      
      // Clean up the URL parameter after a longer delay to prevent conflicts
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('businessCreated');
          window.history.replaceState({}, '', url.toString());
        }
      }, 3000); // Increased from 1000ms to 3000ms
      return;
    }

    // Use the business_creation_complete flag for navigation decisions
    if (pathname !== '/dashboard/create-business' && account) {
      const plan = account.plan;
      const businessCreationComplete = account.business_creation_complete || false;
      const isFreeAccount = account.is_free_account || plan === 'free';

      // Navigation logic based on business_creation_complete flag
      if (!businessCreationComplete && (!plan || plan === 'no_plan') && !isFreeAccount) {
        // Business not created yet and not a free account - redirect to create business
        console.log('[BusinessGuard] Redirecting to create-business: business_creation_complete=false');

        // Add a delay to allow state to stabilize
        const timeoutId = setTimeout(() => {
          // Re-check states after delay
          if (isAuthenticated && !isLoading && !businessLoading && !accountLoading &&
              pathname !== '/dashboard/create-business') {
            router.push("/dashboard/create-business");
          }
        }, 2000); // 2 seconds to allow state to stabilize

        // Clean up timeout if component unmounts or deps change
        return () => clearTimeout(timeoutId);
      }
      // If business_creation_complete is true and plan is no_plan,
      // let them go to dashboard where pricing modal will show
    }

  }, [isAuthenticated, hasBusiness, isLoading, businessLoading, accountLoading, pathname, router, account, user]);

  return <>{children}</>;
}

export { BusinessGuard };
export default BusinessGuard; 