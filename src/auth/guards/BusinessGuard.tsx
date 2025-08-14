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
      console.log('⏳ BusinessGuard: Skipping checks - still loading', {
        isLoading,
        businessLoading,
        accountLoading,
        isAuthenticated,
        hasBusiness
      });
      return;
    }

    // Only apply business requirements to authenticated users
    if (!isAuthenticated) {
      console.log('🔒 BusinessGuard: User not authenticated, skipping business check');
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

    // Business creation redirect should ONLY happen for:
    // 1. Account owners (not team members)
    // 2. Who don't have a business yet
    // 3. On their first login (detected by checking if account was created recently)
    
    // Team members and support users should NEVER be redirected to create-business
    // They should use the dashboard normally even without a business
    
    if (!hasBusiness && pathname !== '/dashboard/create-business' && account) {
      // Check if user is the owner of this account
      const isAccountOwner = account.id === user?.id; // In this system, account ID equals user ID for owners
      
      // Check if this account has NEVER had a business
      // We can check this by looking for a flag in the account or by checking if this is their first real login
      // For now, we'll check if they have the 'has_seen_welcome' flag which gets set after business creation
      const hasNeverHadBusiness = !account.has_seen_welcome && isAccountOwner;
      
      // Also check if account has a paid plan - paid accounts should have businesses
      const hasPaidPlan = account.plan && account.plan !== 'free' && account.plan !== 'no_plan';
      
      console.log('🔍 BusinessGuard: Checking business requirements', {
        hasBusiness,
        isAccountOwner,
        hasNeverHadBusiness,
        hasPaidPlan,
        hasSeenWelcome: account.has_seen_welcome,
        accountId: account.id,
        userId: user?.id,
        plan: account.plan,
        pathname,
        timestamp: new Date().toISOString()
      });
      
      // Only redirect if:
      // 1. User is the account owner (not a team member)
      // 2. Account has never had a business (hasn't seen welcome)
      // 3. Account doesn't have a paid plan (paid plans should already have businesses)
      if (isAccountOwner && hasNeverHadBusiness && !hasPaidPlan) {
        console.log('🔄 BusinessGuard: Account owner without business (never created one), will redirect after delay', {
          pathname,
          timestamp: new Date().toISOString()
        });
        
        // Add a delay to allow state to stabilize
        const timeoutId = setTimeout(() => {
          // Re-check states after delay
          if (isAuthenticated && !hasBusiness && !isLoading && !businessLoading && !accountLoading && 
              pathname !== '/dashboard/create-business' && isAccountOwner && hasNeverHadBusiness && !hasPaidPlan) {
            console.log('🔄 BusinessGuard: Redirecting account owner to create-business', {
              pathname,
              timestamp: new Date().toISOString()
            });
            router.push("/dashboard/create-business");
          }
        }, 2000); // 2 seconds to allow state to stabilize
        
        // Clean up timeout if component unmounts or deps change
        return () => clearTimeout(timeoutId);
      } else if (!isAccountOwner) {
        console.log('ℹ️ BusinessGuard: User is a team member, no business required', {
          accountId: account.id,
          userId: user?.id,
          timestamp: new Date().toISOString()
        });
      } else if (hasPaidPlan) {
        console.log('ℹ️ BusinessGuard: Paid account, should have business - not redirecting', {
          plan: account.plan,
          timestamp: new Date().toISOString()
        });
      } else if (account.has_seen_welcome) {
        console.log('ℹ️ BusinessGuard: User has seen welcome (likely had business before), not redirecting', {
          timestamp: new Date().toISOString()
        });
      }
    }

  }, [isAuthenticated, hasBusiness, isLoading, businessLoading, accountLoading, pathname, router, account, user]);

  return <>{children}</>;
}

export { BusinessGuard };
export default BusinessGuard; 