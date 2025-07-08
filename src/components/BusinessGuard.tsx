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
      "/payment-demo",
      
      // Upgrade page (users can upgrade without business)
      "/upgrade"
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

    // Check if user is coming from a successful plan change
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isComingFromPlanChange = urlParams?.get("success") === "1" && 
      (urlParams?.get("change") === "upgrade" || urlParams?.get("change") === "downgrade");

    // Skip business requirements if user is coming from plan change
    if (isComingFromPlanChange) {
      return;
    }

    // If authenticated user doesn't have a business, redirect to create-business
    if (!hasBusiness) {
      console.log("🔄 BusinessGuard: User authenticated but no business found, redirecting to create-business");
      router.push("/dashboard/create-business");
      return;
    }

  }, [isAuthenticated, hasBusiness, isLoading, businessLoading, accountLoading, pathname, router]);

  return <>{children}</>;
} 