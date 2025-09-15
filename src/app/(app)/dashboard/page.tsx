/**
 * Dashboard Page
 * 
 * Main dashboard page that displays user stats, businesses, and quick actions.
 * Uses centralized AuthContext for authentication and core data.
 */

"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/auth/providers/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Icon from "@/components/Icon";
import DashboardContent from "./DashboardContent";
import PricingModal, { tiers } from "../components/PricingModal";
import FiveStarSpinner from "../components/FiveStarSpinner";
import PageCard from "../components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import TopLoaderOverlay from "../components/TopLoaderOverlay";
import { Button } from "@/app/(app)/components/ui/button";
import Link from "next/link";
import QuoteDisplay from "../components/QuoteDisplay";
import StarfallCelebration from "../components/StarfallCelebration";
import { trackEvent, GA_EVENTS } from "@/utils/analytics";
import { useAuth } from "@/auth";
import { checkAccountLimits } from "@/utils/accountLimits";
import React from "react";

interface DashboardData {
  promptPages: any[];
  widgets: any[];
  accountLimits: any;
  reviewStats: {
    total: { week: number; month: number; year: number };
    verified: { week: number; month: number; year: number };
  };
  universalPromptPage: any;
  customPromptPages: any[];
  universalUrl: string;
}

const Dashboard = React.memo(function Dashboard() {
  const router = useRouter();
  
  // Use centralized auth context - this provides all the core data
  const { 
    user, 
    account, 
    isAdminUser, 
    isAuthenticated, 
    isLoading: authLoading,
    accountLoading,
    hasBusiness,
    selectedAccountId,
    signOut,
    refreshSession,
    refreshAccount
  } = useAuth();
  
  // Remove auth guard - authentication is handled by dashboard layout
  // useAuthGuard(); // This was causing premature redirects
  
  // Create supabase client instance (memoized to prevent re-creation)
  const supabase = useMemo(() => createClient(), []);
  
  // Only dashboard-specific data (not duplicating what AuthContext provides)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const createPromptPageRef = useRef<HTMLAnchorElement>(null);
  const [showQR, setShowQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [savedPromptPageUrl, setSavedPromptPageUrl] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingAccountUpdate, setPendingAccountUpdate] = useState(false);
  const [showStarfallCelebration, setShowStarfallCelebration] = useState(false);
  const [showTopLoader, setShowTopLoader] = useState(false);
  const [justCanceledStripe, setJustCanceledStripe] = useState(false);
  const [planSelectionRequired, setPlanSelectionRequired] = useState(false);
  const [paymentChangeType, setPaymentChangeType] = useState<string | null>(null);
  const [justCompletedPayment, setJustCompletedPayment] = useState(false);
  const [lastAccountUpdate, setLastAccountUpdate] = useState<Date | null>(null);
  const [isPendingPricingModal, setIsPendingPricingModal] = useState(false);

  // State for businesses data (loaded separately from AuthContext)
  const [businessesData, setBusinessesData] = useState<any[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  
  // Memoized business data
  const businessData = useMemo(() => {
    if (!account || accountLoading) return null;
    
    return {
      businesses: businessesData,
      currentBusiness: businessesData[0] || null,
      businessCount: businessesData.length,
      hasBusinesses: businessesData.length > 0
    };
  }, [account, accountLoading, businessesData]);
  
  // Load businesses data
  const loadBusinessesData = useCallback(async () => {
    const currentAccountId = selectedAccountId || account?.id;
    if (!user?.id || !currentAccountId || businessesLoading) return;
    
    try {
      setBusinessesLoading(true);
      
      
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', currentAccountId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Dashboard: Error loading businesses:', error);
        setBusinessesData([]);
        // Don't throw - just set empty data to prevent reload
        return;
      }
      
      setBusinessesData(businesses || []);
      
    } catch (error) {
      console.error('❌ Dashboard: Error loading businesses:', error);
      setBusinessesData([]);
      // Don't throw - just set empty data to prevent reload
    } finally {
      setBusinessesLoading(false);
    }
  }, [user?.id, account?.id, selectedAccountId, businessesLoading, supabase]);

  // Load dashboard-specific data (widgets, prompt pages, reviews)
  const loadDashboardSpecificData = useCallback(async () => {
    const currentAccountId = selectedAccountId || account?.id;
    if (!user?.id || !currentAccountId) return;
    
    try {
      setIsDashboardLoading(true);
      setError(null);
      
      
      // Fetch only dashboard-specific data (not what AuthContext already provides)
      const [promptPagesResult, widgetsResult, reviewsResult, limitsResult] = await Promise.allSettled([
        supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", currentAccountId)
          .order("created_at", { ascending: false }),
        
        supabase
          .from("widgets")
          .select("*")
          .eq("account_id", currentAccountId)
          .order("created_at", { ascending: false }),
        
        // Fetch review submissions using JOIN for better performance
        (async () => {
          try {
            
            // Use a single query with JOIN instead of two sequential queries
            const result = await supabase
              .from("review_submissions")
              .select(`
                id, 
                created_at, 
                verified,
                prompt_pages!inner(account_id)
              `)
              .eq("prompt_pages.account_id", currentAccountId);
            
            if (result.error) {
              console.error('❌ Dashboard: review_submissions JOIN query failed:', result.error);
              return { data: [], error: null };
            }
            
            // Transform the data to match expected format
            const reviewData = result.data?.map(row => ({
              id: row.id,
              created_at: row.created_at,
              verified: row.verified
            })) || [];
            
            return { data: reviewData, error: null };
          } catch (error) {
            console.error('❌ Dashboard: review_submissions query exception:', error);
            return { data: [], error: null };
          }
        })(),
        
        checkAccountLimits(supabase, user.id, "prompt_page")
      ]);

      // Process results with better error handling
      const promptPages = promptPagesResult.status === 'fulfilled' ? promptPagesResult.value.data || [] : [];
      const widgets = widgetsResult.status === 'fulfilled' ? widgetsResult.value.data || [] : [];
      const reviews = reviewsResult.status === 'fulfilled' ? (reviewsResult.value?.data || []) : [];
      const limits = limitsResult.status === 'fulfilled' ? limitsResult.value : null;

      // Log any failed results
      if (promptPagesResult.status === 'rejected') {
        console.error('❌ Dashboard: prompt_pages query failed:', promptPagesResult.reason);
      }
      if (widgetsResult.status === 'rejected') {
        console.error('❌ Dashboard: widgets query failed:', widgetsResult.reason);
      }
      if (reviewsResult.status === 'rejected') {
        console.error('❌ Dashboard: review_submissions query failed:', reviewsResult.reason);
      }
      if (limitsResult.status === 'rejected') {
        console.error('❌ Dashboard: account limits check failed:', limitsResult.reason);
      }

      // Separate universal and custom prompt pages
      let universalPromptPage = promptPages.find(pp => pp.is_universal);
      const customPromptPages = promptPages.filter(pp => !pp.is_universal);
      let universalUrl = universalPromptPage ? `${window.location.origin}/r/${universalPromptPage.slug}` : "";

      // Ensure the universal prompt page exists for this account via API (service role)
      if (!universalPromptPage) {
        try {
          // Include Authorization header to ensure server can authenticate
          let authHeaders: Record<string, string> = { 'X-Selected-Account': (selectedAccountId || account.id) as string };
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              authHeaders['Authorization'] = `Bearer ${session.access_token}`;
            }
          } catch {}

          const ensureRes = await fetch('/api/prompt-pages/ensure-universal', {
            method: 'POST',
            credentials: 'include',
            headers: authHeaders,
          });
          if (ensureRes.ok) {
            const ensureData = await ensureRes.json();
            universalPromptPage = ensureData.page || null;
            if (universalPromptPage?.slug) {
              universalUrl = `${window.location.origin}/r/${universalPromptPage.slug}`;
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              try { const err = await ensureRes.json(); console.warn('ensure-universal failed', ensureRes.status, err); } catch {}
            }
          }
        } catch {}
      }

      // Calculate review statistics with proper date filtering
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const stats = {
        total: { week: 0, month: 0, year: 0 },
        verified: { week: 0, month: 0, year: 0 },
      };

      reviews.forEach((review) => {
        const reviewDate = new Date(review.created_at);
        
        // Count total reviews by time period
        if (reviewDate >= yearAgo) {
          stats.total.year++;
        }
        if (reviewDate >= monthAgo) {
          stats.total.month++;
        }
        if (reviewDate >= weekAgo) {
          stats.total.week++;
        }
        
        // Count verified reviews by time period
        if (review.verified) {
          if (reviewDate >= yearAgo) {
            stats.verified.year++;
          }
          if (reviewDate >= monthAgo) {
            stats.verified.month++;
          }
          if (reviewDate >= weekAgo) {
            stats.verified.week++;
          }
        }
      });

      // Set dashboard data
      setDashboardData({
        promptPages,
        widgets,
        accountLimits: limits,
        reviewStats: stats,
        universalPromptPage,
        customPromptPages,
        universalUrl
      });
      
      
    } catch (error) {
      console.error("❌ Dashboard: Error loading dashboard data:", error);
      setError("Failed to load dashboard data");
      // Don't throw - just set error state to prevent reload
    } finally {
      setIsDashboardLoading(false);
    }
  }, [user?.id, account?.id, selectedAccountId, supabase]);

  // Add a ref to track if businessCreated param was handled
  const businessCreatedHandled = useRef(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/sign-in');
    }
  }, [authLoading, isAuthenticated, router]);

  // Check for missing account only after initial load completes
  // Use a ref to track if we've done the initial check to avoid duplicate warnings
  const accountCheckDone = useRef(false);
  
  useEffect(() => {
    // Only check once after everything is loaded
    if (!authLoading && !accountLoading && !accountCheckDone.current) {
      accountCheckDone.current = true;
      
      // Only warn if user is authenticated with ID but no account after loading
      if (isAuthenticated && user?.id && !account) {
        console.warn('⚠️ Dashboard: No account found for user:', {
          userId: user.id,
          email: user.email || 'no-email'
        });
        // Don't auto-create - let the user go through proper onboarding
      }
    }
  }, [authLoading, accountLoading, isAuthenticated, user?.id, account?.id]);

  // Load dashboard data when auth is ready
  useEffect(() => {
    if (authLoading || accountLoading) return;
    if (!isAuthenticated || !user || !account) return;
    // Prevent double load if businessCreated was just handled
    if (businessCreatedHandled.current) return;
    
    // For new users who just created a business, prioritize plan selection over data loading
    const urlParams = new URLSearchParams(window.location.search);
    const justCreatedBusiness = urlParams.get("businessCreated") === "1";
    
    if (justCreatedBusiness) {
      // For new users, just load businesses data (needed for plan selection)
      // Skip loading widgets, prompt pages, reviews until after plan selection
      loadBusinessesData();
    } else {
      // For existing users, load all data
      loadDashboardSpecificData();
      loadBusinessesData();
    }
  }, [authLoading, accountLoading, isAuthenticated, user?.id, account?.id]);

  // Handle post-save modal flag
  useEffect(() => {
    if (typeof window !== "undefined") {
      const flag = localStorage.getItem("showPostSaveModal");
      if (flag) {
        try {
          const { url } = JSON.parse(flag);
          setSavedPromptPageUrl(url);
          setShowPostSaveModal(true);
        } catch {}
        localStorage.removeItem("showPostSaveModal");
      }
    }
  }, []);

  // Enhanced plan selection logic using AuthContext data
  useEffect(() => {
    if (authLoading || accountLoading || businessesLoading || !account || !businessData) return;
    
    const now = new Date();
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    const plan = account.plan;
    const hasStripeCustomer = !!account.stripe_customer_id;
    const subscriptionStatus = account.subscription_status;
    const businessCount = businessData.businessCount;

    // Determine if payment is required based on plan, trial, and subscription status
    let paymentRequired = false;

    // Active subscription never requires payment
    if (subscriptionStatus === 'active') {
      paymentRequired = false;
    } else if (plan === 'grower') {
      const trialActive = trialEnd && now <= trialEnd && !hasStripeCustomer;
      if (trialActive) {
        paymentRequired = false;
      } else if (hasStripeCustomer) {
        // Paying grower but not active -> needs attention/payment
        paymentRequired = subscriptionStatus !== 'active';
      } else {
        // Not paying grower: require payment only after trial expires
        paymentRequired = !!trialEnd && now > trialEnd;
      }
    } else if (plan === 'builder' || plan === 'maven') {
      // Paid plans require active subscription
      paymentRequired = subscriptionStatus !== 'active';
    } else {
      // No plan selected but business exists -> require plan/payment
      paymentRequired = ((!plan || plan === 'no_plan' || plan === 'NULL') && businessCount > 0);
    }

    setPlanSelectionRequired(!!paymentRequired);
    
    // Check if we just came back from Stripe success or have success modal showing
    const urlParams = typeof window !== "undefined" ? 
      new URLSearchParams(window.location.search) : null;
    const hasSuccessParam = urlParams?.get('success') === '1';
    const hasPlanSuccessModal = typeof window !== "undefined" ? 
      sessionStorage.getItem('showPlanSuccessModal') === 'true' : false;
    
    // Check if account was updated recently (within 15 seconds)
    const accountRecentlyUpdated = lastAccountUpdate && 
      (new Date().getTime() - lastAccountUpdate.getTime()) < 15000;
    
    // Show pricing modal when plan selection is required (but not during initial load)
    // Only show if user hasn't dismissed it and it's not already showing
    // AND we haven't just completed a payment or showing success modal
    // AND account wasn't recently updated
    if (isPlanSelectionRequired && !showPricingModal && !isDashboardLoading && 
        !justCompletedPayment && !hasSuccessParam && !hasPlanSuccessModal && 
        !accountRecentlyUpdated) {
      // Check if user hasn't recently dismissed the modal
      const modalDismissed = typeof window !== "undefined" ? 
        sessionStorage.getItem('pricingModalDismissed') === 'true' : false;
      
      if (!modalDismissed) {
        setShowPricingModal(true);
      }
    }
    
  }, [authLoading, accountLoading, businessesLoading, isDashboardLoading, account, businessData, justCompletedPayment, dashboardData]);

  // Close modal automatically whenever payment is not required
  useEffect(() => {
    if (!planSelectionRequired && showPricingModal) {
      setShowPricingModal(false);
      setJustCompletedPayment(false);
      // Clear all modal-related session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
        localStorage.removeItem('showPostSaveModal');
      }
    }
  }, [planSelectionRequired, showPricingModal]);

  // Handle URL parameters and celebrations
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    
    
    // Handle return from Stripe Customer Portal
    if (params.get("portal_return") === "1") {
      
      // Show a message that billing was updated
      // Note: We can't know exactly what changed, but we can show a generic message
      setShowSuccessModal(true);
      setPaymentChangeType("billing_update");
      
      // Refresh account data to get any plan changes
      if (user?.id) {
        refreshAccount().catch(error => {
          console.error("Error refreshing account after portal return:", error);
        });
      }
      
      // Clean up the URL
      params.delete("portal_return");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
      
      return;
    }
    
    // Handle reactivation flow
    if (params.get("reactivation") === "true") {
      
      // Get any stored reactivation offer
      const offerData = sessionStorage.getItem('reactivation_offer');
      if (offerData) {
        try {
          const offer = JSON.parse(offerData);
          // You can pass this to the pricing modal
        } catch (e) {
          console.error('Error parsing reactivation offer:', e);
        }
      }
      
      setShowPricingModal(true);
      setPlanSelectionRequired(true);
      
      // Clean up the URL
      params.delete("reactivation");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
      
      return;
    }
    
    // Handle successful Stripe payment
    if (params.get("success") === "1") {
      const changeType = params.get("change");
      const planName = params.get("plan");
      
      setPaymentChangeType(changeType);
      
      // Clear any pending modal timeout to prevent it from re-showing
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
        modalTimeoutRef.current = null;
      }
      
      // Close pricing modal and refresh account data after successful payment
      setShowPricingModal(false);
      setPlanSelectionRequired(false);
      setJustCompletedPayment(true);
      
      // Clear any dismissal flags since user now has a valid plan
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
      }
      
      // Refresh account data to get updated plan
      if (user?.id) {
        refreshAccount().then(() => {
          // Track when account was updated
          setLastAccountUpdate(new Date());
          // Reset the flag after account data is refreshed (give more time for data to settle)
          setTimeout(() => setJustCompletedPayment(false), 10000);
        }).catch(error => {
          console.error("Error refreshing account data:", error);
          // Reset the flag even if refresh fails
          setTimeout(() => setJustCompletedPayment(false), 10000);
        });
      }
      
      // Show celebration for upgrades and new signups
      if (changeType === "upgrade" || changeType === "new") {
        setShowStarfallCelebration(true);
        setTimeout(() => setShowSuccessModal(true), 1000);
      } else if (changeType === "downgrade") {
        setTimeout(() => setShowSuccessModal(true), 500);
      }
      
      // Clean up the URL
      params.delete("success");
      params.delete("change");
      params.delete("plan");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
      
      return;
    }
    
    // Handle Stripe cancellation
    if (params.get("canceled") === "1") {
      setJustCanceledStripe(true);
      setShowPricingModal(true);
      
      // Clear any previous modal dismissal since user needs to select a plan
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
      }
      
      // Clean up the URL
      params.delete("canceled");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
      
      return;
    }
    
    // Handle business creation success
    if (params.get("businessCreated") === "1") {
      // Check if we've already handled this business creation
      if (typeof window !== "undefined" && sessionStorage.getItem('businessCreatedHandled') === 'true') {
        // Already handled, just clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return;
      }
      
      // Clear any previous modal dismissal from sessionStorage since user just created business
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
        // Set a flag to prevent multiple triggers
        sessionStorage.setItem('businessCreatedHandled', 'true');
      }
      
      // Set pending state immediately to maintain loading state
      setIsPendingPricingModal(true);
      
      // Force reload of account data to pick up the newly created account
      if (refreshAccount) {
        console.log('🔄 Refreshing account data after business creation');
        // Wait for refresh to complete before showing modal
        refreshAccount().then(() => {
          console.log('✅ Account data refreshed, now showing pricing modal');
          // Double-check that user still needs to select a plan
          // (in case they completed Stripe checkout in the meantime)
          const params = new URLSearchParams(window.location.search);
          const hasJustPaid = params.get('success') === '1';
          
          if (!hasJustPaid) {
            setIsPendingPricingModal(false);
            setShowPricingModal(true);
            setPlanSelectionRequired(true); // Make it required so user can't dismiss
          } else {
            setIsPendingPricingModal(false);
          }
        }).catch(error => {
          console.error('❌ Error refreshing account after business creation:', error);
          // Show modal anyway after a delay
          setTimeout(() => {
            setIsPendingPricingModal(false);
            setShowPricingModal(true);
            setPlanSelectionRequired(true);
          }, 2000);
        });
      } else {
        // Fallback if refreshAccount is not available
        modalTimeoutRef.current = setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const hasJustPaid = params.get('success') === '1';
          
          if (!hasJustPaid) {
            setIsPendingPricingModal(false);
            setShowPricingModal(true);
            setPlanSelectionRequired(true);
          } else {
            setIsPendingPricingModal(false);
          }
        }, 3000); // Wait 3 seconds for page to fully load
      }
      
      // Clean up the URL immediately
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      return;
    }
  }, []);

  // Get URL search params
  const searchParams = useSearchParams();

  // Enhanced debugging and safety checks
  useEffect(() => {
    // SAFETY CHECK: Detect if user has paid but account wasn't updated
    if (user && account && searchParams.get('success') === '1') {
      const planFromUrl = searchParams.get('plan');
      const changeType = searchParams.get('change');
      
      if (planFromUrl && changeType === 'upgrade' && account.plan !== planFromUrl) {
        console.error('🚨 PAYMENT SUCCESS BUT PLAN NOT UPDATED!');
        console.error('  URL Plan:', planFromUrl);
        console.error('  Account Plan:', account.plan);
        console.error('  Customer ID:', account.stripe_customer_id);
        
        // Show user-friendly message
        console.error('💬 User Message: Payment successful but account update pending. Please refresh in a few minutes or contact support if the issue persists.');
      }
    }
  }, [user, account, searchParams]);

  // Debug logging for Maven users - simplified to prevent re-renders
  useEffect(() => {
    if (user && account && account.plan !== 'maven') {
    }
  }, [user?.email, account?.plan, businessData?.businessCount, account?.stripe_customer_id]);

  // Load dashboard data immediately when account is available (don't wait for pricing modal)
  useEffect(() => {
    if (!dashboardData && businessData && !isDashboardLoading && account?.id) {
      loadDashboardSpecificData();
    }
  }, [dashboardData, businessData, isDashboardLoading, account]);

  // Loading state
  const isLoading = authLoading || accountLoading || isDashboardLoading;

  // Progressive data loading - show content as it becomes available
  const consolidatedData = useMemo(() => {
    // Always return an object, populate fields as data becomes available
    return {
      user: user || null,
      account: account || null,
      businesses: businessData?.businesses || [],
      promptPages: dashboardData?.promptPages || [],
      widgets: dashboardData?.widgets || [],
      isAdminUser,
      accountLimits: dashboardData?.accountLimits || null,
      reviewStats: dashboardData?.reviewStats || { 
        total: { week: 0, month: 0, year: 0 }, 
        verified: { week: 0, month: 0, year: 0 } 
      },
      universalPromptPage: dashboardData?.universalPromptPage || null,
      customPromptPages: dashboardData?.customPromptPages || [],
      universalUrl: dashboardData?.universalUrl || "",
      // Loading states for progressive rendering
      isAccountLoaded: !!account,
      isBusinessDataLoaded: !!businessData,
      isDashboardDataLoaded: !!dashboardData
    };
  }, [
    user?.id,
    user?.email,
    account?.id,
    account?.plan,
    businessData?.businessCount,
    dashboardData?.promptPages?.length,
    dashboardData?.widgets?.length,
    isAdminUser,
    dashboardData?.universalPromptPage?.id,
    dashboardData?.customPromptPages?.length,
    dashboardData?.universalUrl,
    account,
    businessData,
    dashboardData
  ]);

  // Clean up timeout on unmount - moved before early returns to comply with React hooks rules
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, []);

  // Early returns for loading and error states
  if (authLoading) {
    return <StandardLoader isLoading={true} />;
  }
  
  if (!isAuthenticated) {
    return <StandardLoader isLoading={true} />; // Auth guard will handle redirect
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
        <div className="text-center bg-white/10 backdrop-blur-md rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Error loading dashboard</h2>
          <p className="text-white/90 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Show loading screen while essential data loads to prevent dashboard flash
  // This prevents briefly showing dashboard before redirect to create-business
  // Also show loading when pricing modal is pending after business creation
  // Note: We only check businessesLoading, not !businessData, because businessData can be null while loading
  if (!account || businessesLoading || isPendingPricingModal) {
    return <StandardLoader isLoading={true} />;
  }

  // Early business check to prevent dashboard flash before BusinessGuard redirect
  // Only apply if not coming from business creation or other exempt flows
  if (businessData && !businessData.hasBusinesses) {
    const urlParams = new URLSearchParams(window.location.search);
    const businessJustCreated = urlParams.get("businessCreated") === "1";
    const businessCreationInProgress = typeof window !== "undefined" ? 
      sessionStorage.getItem('businessCreationInProgress') === 'true' : false;
    
    // If no business and not in an exempt flow, show loading while BusinessGuard redirects
    if (!businessJustCreated && !businessCreationInProgress) {
      return <StandardLoader isLoading={true} />;
    }
  }

  // Rest of component handlers...
  const handleCreatePromptPageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    setShowTopLoader(true);
    setTimeout(() => router.push("/dashboard/create-prompt-page"), 100);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(consolidatedData.universalUrl);
      setCopySuccess("Link copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      setCopySuccess("Copy failed");
    }
  };

  const handleSelectTier = async (tierKey: string, billingPeriod: 'monthly' | 'annual' = 'monthly') => {
    try {
      setShowTopLoader(true);
      
      // Track the plan selection
      await trackEvent(GA_EVENTS.PLAN_SELECTED, {
        plan: tierKey,
        billing_period: billingPeriod,
        source: 'dashboard_modal'
      });
      
      // Handle grower plan (free trial) - update directly without Stripe ONLY if eligible for trial
      if (tierKey === "grower") {
        if (!account?.id) {
          throw new Error("Account not found");
        }
        
        // Check if this account is eligible for a trial
        // Eligible if they've never had a paid plan before AND it's not an additional account
        const isEligibleForTrial = !account.has_had_paid_plan && 
                                   !account.is_additional_account && 
                                   account.plan === 'no_plan';
        
        // If eligible for trial, handle locally without Stripe
        if (isEligibleForTrial) {
          // Update account to grower plan with trial dates
          const updateData = { 
            plan: tierKey,
            billing_period: billingPeriod,
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          };
          
          const { error: updateError } = await supabase
            .from("accounts")
            .update(updateData)
            .eq("id", account.id);
          
          if (updateError) {
            throw updateError;
          }
          
          // Close modal and show celebration
          setShowPricingModal(false);
          setPlanSelectionRequired(false);
          setShowStarfallCelebration(true);
          
          // Clear any dismissal flags since user now has a valid plan
          if (typeof window !== "undefined") {
            sessionStorage.removeItem('pricingModalDismissed');
            sessionStorage.removeItem('businessCreatedHandled');
          }
          
          // Instead of window.location.reload(), reload data and update state
          await Promise.all([
            refreshSession(),
            refreshAccount(),
            loadDashboardSpecificData()
          ]);
          setShowTopLoader(false);
          return;
        }
        
        // If NOT eligible for trial (expired trial or had paid plan), go through Stripe for payment
      }
      
      // For paid plans, use Stripe checkout
      if (!account?.id) {
        throw new Error("Account not found");
      }
      
      const checkoutData = {
        plan: tierKey,
        userId: account.id,
        email: user?.email,
        billingPeriod: billingPeriod,
      };
      
      
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Stripe checkout API error:`, errorData);
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const responseData = await response.json();
      
      const { url } = responseData;
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError("Failed to start checkout. Please try again.");
      setShowTopLoader(false);
    }
  };

  const handleClosePricingModal = () => {
    // Check if user has invalid plan and needs to select one
    const hasInvalidPlan = (!account?.plan || account.plan === 'no_plan' || account.plan === 'NULL') && 
                          businessData && businessData.businessCount > 0;
    
    if (planSelectionRequired || hasInvalidPlan) {
      return;
    }
    
    setShowPricingModal(false);
    setJustCanceledStripe(false);
    
    // Remember that user dismissed the modal for this session
    if (typeof window !== "undefined") {
      sessionStorage.setItem('pricingModalDismissed', 'true');
      sessionStorage.removeItem('businessCreatedHandled');
    }
    
    // Load remaining dashboard data if it hasn't been loaded yet
    if (!dashboardData) {
      loadDashboardSpecificData();
    }
  };

  const handleClosePostSaveModal = () => {
    setShowPostSaveModal(false);
    setSavedPromptPageUrl(null);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setPaymentChangeType(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const userName =
    (account?.first_name && account.first_name.trim().split(" ")[0]) ||
    (businessData?.currentBusiness?.first_name && businessData.currentBusiness.first_name.trim().split(" ")[0]) ||
    (businessData?.currentBusiness?.name && businessData.currentBusiness.name.trim().split(" ")[0]) ||
    (user?.user_metadata?.full_name &&
      user.user_metadata.full_name.trim().split(" ")[0]) ||
    user?.email?.split("@")[0] ||
    "there";

  // Add development refresh function
  const handleForceRefresh = async () => {
    try {
      setShowTopLoader(true);
      
      // Call the refresh session API
      const response = await fetch('/api/refresh-session', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        
        // Refresh all auth context data
        await Promise.all([
          refreshSession(),
          refreshAccount(),
          loadDashboardSpecificData()
        ]);
        
        // Force page reload to ensure all components pick up new data
        window.location.reload();
      } else {
        console.error('❌ Session refresh failed:', result);
      }
    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      setShowTopLoader(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-start px-4 sm:px-0">
      {/* Quotes Display - positioned between nav and PageCard */}
      <div className="h-96 flex justify-center items-center pt-0 -mt-2">
        <QuoteDisplay />
      </div>
      
      {/* PageCard with consistent spacing */}
      <div className="flex justify-center items-start pt-0 pb-8 -mt-10">
        <PageCard
          icon={<Icon name="FaHome" className="w-8 h-8 text-slate-blue" size={32} />}
          topMargin="mt-0"
          bottomLeftImage={{
            src: "https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-fishing-for-stars.png",
            alt: "Prompty fishing for stars",
            maxWidth: 1280,
            maxHeight: 1280
          }}
        >
          <DashboardContent
            userName={userName}
            business={businessData?.currentBusiness}
            customPromptPages={consolidatedData?.customPromptPages || []}
            universalPromptPage={consolidatedData?.universalPromptPage}
            createPromptPageRef={createPromptPageRef}
            handleCreatePromptPageClick={handleCreatePromptPageClick}
            showQR={showQR}
            handleCopyLink={handleCopyLink}
            copySuccess={copySuccess}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            showSuccessModal={showSuccessModal}
            setShowSuccessModal={setShowSuccessModal}
            handleCloseSuccessModal={handleCloseSuccessModal}
            universalUrl={consolidatedData?.universalUrl || ""}
            QRCode={QRCodeSVG}
            setShowQR={setShowQR}
            account={account}
            parentLoading={isLoading}
            reviewStats={consolidatedData?.reviewStats || { total: { week: 0, month: 0, year: 0 }, verified: { week: 0, month: 0, year: 0 } }}
            hasBusiness={!!(businessData?.hasBusinesses)}
            hasCustomPromptPages={!!(consolidatedData?.promptPages && consolidatedData.promptPages.filter(p => !p.is_universal).length > 0)}
            hasUniversalPromptPage={!!(consolidatedData?.promptPages && consolidatedData.promptPages.some(p => p.is_universal))}
            accountId={account?.id}
            setShowStarfallCelebration={setShowStarfallCelebration}
            paymentChangeType={paymentChangeType}
          />
        </PageCard>
      </div>
      
      {/* Pricing Modal */}
      {showPricingModal && (
        <PricingModal
          onSelectTier={handleSelectTier}
          currentPlan={account?.plan}
          currentBillingPeriod={account?.billing_period}
          hasHadPaidPlan={account?.has_had_paid_plan || false}
          showCanceledMessage={justCanceledStripe}
          onClose={handleClosePricingModal}
          onSignOut={handleSignOut}
          isPlanSelectionRequired={planSelectionRequired}
          isReactivation={account?.deleted_at !== null || (account?.plan === 'no_plan' && account?.has_had_paid_plan && !account?.is_additional_account)}
          hadPreviousTrial={account?.has_had_paid_plan || account?.is_additional_account || false}
          reactivationOffer={
            (account?.deleted_at || (account?.plan === 'no_plan' && account?.has_had_paid_plan && !account?.is_additional_account)) ? {
              hasOffer: true,
              offerType: 'percentage',
              discount: 20,
              message: 'Welcome back! Enjoy 20% off'
            } : undefined
          }
        />
      )}
      
      {/* Starfall Celebration */}
      <StarfallCelebration 
        isVisible={showStarfallCelebration}
        onComplete={() => setShowStarfallCelebration(false)}
        duration={3000}
      />
        {/* Top Loader */}
        {showTopLoader && (
          <div className="fixed top-0 left-0 w-full h-1 bg-slate-blue z-50">
            <div className="h-full bg-white animate-pulse"></div>
          </div>
        )}
    </div>
  );
});

export default Dashboard;
