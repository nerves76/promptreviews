/**
 * Dashboard Page
 * 
 * Main dashboard page that displays user stats, businesses, and quick actions.
 * Uses centralized AuthContext for authentication and core data.
 */

"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { FaHome, FaStore, FaChartLine, FaUser, FaCog, FaSignOutAlt, FaPlus } from "react-icons/fa";
import DashboardContent from "./DashboardContent";
import PricingModal, { tiers } from "../components/PricingModal";
import FiveStarSpinner from "../components/FiveStarSpinner";
import PageCard from "../components/PageCard";
import AppLoader from "../components/AppLoader";
import TopLoaderOverlay from "../components/TopLoaderOverlay";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import QuoteDisplay from "../components/QuoteDisplay";
import StarfallCelebration from "../components/StarfallCelebration";
import { trackEvent, GA_EVENTS } from "../../utils/analytics";
import { useAuth, useAuthGuard } from "@/contexts/AuthContext";
import { checkAccountLimits } from "@/utils/accountLimits";

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

export default function Dashboard() {
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
    signOut,
    refreshAuth,
    refreshAccountDetails
  } = useAuth();
  
  // Apply auth guard
  useAuthGuard();
  
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
  const [pendingAccountUpdate, setPendingAccountUpdate] = useState(false);
  const [showStarfallCelebration, setShowStarfallCelebration] = useState(false);
  const [showTopLoader, setShowTopLoader] = useState(false);
  const [justCanceledStripe, setJustCanceledStripe] = useState(false);
  const [planSelectionRequired, setPlanSelectionRequired] = useState(false);
  const [paymentChangeType, setPaymentChangeType] = useState<string | null>(null);
  const [justCompletedPayment, setJustCompletedPayment] = useState(false);

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
    if (!user?.id || !account?.id || businessesLoading) return;
    
    try {
      setBusinessesLoading(true);
      console.log('🏢 Dashboard: Loading businesses data...');
      
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Dashboard: Error loading businesses:', error);
        setBusinessesData([]);
        return;
      }
      
      console.log('✅ Dashboard: Loaded businesses:', { 
        count: businesses?.length || 0, 
        businesses: businesses?.map(b => ({ id: b.id, name: b.name })) || []
      });
      
      setBusinessesData(businesses || []);
      
    } catch (error) {
      console.error('❌ Dashboard: Error loading businesses:', error);
      setBusinessesData([]);
    } finally {
      setBusinessesLoading(false);
    }
  }, [user?.id, account?.id, businessesLoading, supabase]);

  // Load dashboard-specific data (widgets, prompt pages, reviews)
  const loadDashboardSpecificData = useCallback(async () => {
    if (!user?.id || !account?.id) return;
    
    try {
      console.log('📊 Dashboard: Loading dashboard-specific data...');
      setIsDashboardLoading(true);
      setError(null);
      
      // EMERGENCY DEBUG: Check what businesses exist for this user
      if (user.email === 'boltro3000@gmail.com') {
        console.log('🔍 DEBUGGING: Checking businesses AND account for boltro3000@gmail.com');
      
      // EMERGENCY DEBUG: Check current account state in database
      const { data: debugAccount, error: debugAccountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', account.id)
        .single();
      
      console.log('👤 DEBUG Account from database (FULL):', { 
        account: debugAccount, 
        error: debugAccountError,
        account_id: account.id 
      });
      
      // Check if there are any customer records in Stripe
      if (debugAccount?.stripe_customer_id) {
        console.log('🔍 STRIPE CUSTOMER ID FOUND:', debugAccount.stripe_customer_id);
      } else {
        console.log('❌ NO STRIPE CUSTOMER ID FOUND');
      }
        const { data: debugBusinesses, error: debugError } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', account.id);
        
        console.log('🏢 DEBUG Businesses query result:', { 
          businesses: debugBusinesses, 
          count: debugBusinesses?.length || 0,
          error: debugError,
          account_id: account.id 
        });
        
        // Also check all accounts with Maven plan to see if webhook is working for anyone
        const { data: mavenAccounts, error: mavenError } = await supabase
          .from('accounts')
          .select('id, email, plan, stripe_customer_id, subscription_status, created_at, updated_at')
          .eq('plan', 'maven')
          .limit(5);
        
        console.log('🔍 DEBUG Maven accounts (sample):', { 
          mavenAccounts, 
          error: mavenError 
        });
      }
      
      // Fetch only dashboard-specific data (not what AuthContext already provides)
      const [promptPagesResult, widgetsResult, reviewsResult, limitsResult] = await Promise.allSettled([
        supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", account.id)
          .order("created_at", { ascending: false }),
        
        supabase
          .from("widgets")
          .select("*")
          .eq("account_id", account.id)
          .order("created_at", { ascending: false }),
        
        supabase
          .from("widget_reviews")
          .select("id, is_verified")
          .eq("account_id", account.id),
        
        checkAccountLimits(supabase, user.id, "prompt_page")
      ]);

      // Process results
      const promptPages = promptPagesResult.status === 'fulfilled' ? promptPagesResult.value.data || [] : [];
      const widgets = widgetsResult.status === 'fulfilled' ? widgetsResult.value.data || [] : [];
      const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value.data || [] : [];
      const limits = limitsResult.status === 'fulfilled' ? limitsResult.value : null;

      console.log('📊 Dashboard: Dashboard data loaded:', {
        promptPageCount: promptPages.length,
        widgetCount: widgets.length,
        reviewCount: reviews.length
      });

      // Separate universal and custom prompt pages
      const universalPromptPage = promptPages.find(pp => pp.is_universal);
      const customPromptPages = promptPages.filter(pp => !pp.is_universal);
      const universalUrl = universalPromptPage ? `${window.location.origin}/r/${universalPromptPage.slug}` : "";

      // Calculate review statistics
      const stats = {
        total: { week: 0, month: 0, year: 0 },
        verified: { week: 0, month: 0, year: 0 },
      };

      reviews.forEach((review) => {
        // For now, count all reviews as recent since we don't have created_at
        stats.total.week++;
        stats.total.month++;
        stats.total.year++;
        if (review.is_verified) {
          stats.verified.week++;
          stats.verified.month++;
          stats.verified.year++;
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

      console.log('✅ Dashboard: Dashboard data loaded successfully');
      
    } catch (error) {
      console.error("❌ Dashboard: Error loading dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsDashboardLoading(false);
    }
  }, [user?.id, user?.email, account?.id, supabase]);

  // Load dashboard data when auth is ready
  useEffect(() => {
    if (authLoading || accountLoading) return;
    if (!isAuthenticated || !user || !account) return;
    
    loadDashboardSpecificData();
    loadBusinessesData();
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
    const trialStart = account.trial_start ? new Date(account.trial_start) : null;
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    const plan = account.plan;
    const hasStripeCustomer = !!account.stripe_customer_id;
    const businessCount = businessData.businessCount;

    // User is on a paid plan
    const isPaidUser = 
      plan === "builder" || 
      plan === "maven" || 
      (plan === "grower" && hasStripeCustomer);

    // Check if trial has expired
    const isTrialExpired = trialEnd && now > trialEnd;

    // Determine if plan selection is required
    const isPlanSelectionRequired = 
      ((!plan || plan === 'no_plan' || plan === 'NULL') && businessCount > 0) ||
      (plan === "grower" && isTrialExpired && !hasStripeCustomer);
    
    // Users with no valid plan should ALWAYS see the modal - never allow dismissal
    const hasInvalidPlan = (!plan || plan === 'no_plan' || plan === 'NULL') && businessCount > 0;
    
    // Check if user has manually dismissed the modal (only applies to users who don't need a plan)
    const hasManuallyDismissed = !isPlanSelectionRequired && !hasInvalidPlan && typeof window !== "undefined" && 
      sessionStorage.getItem('pricingModalDismissed') === 'true';
    
    if (hasManuallyDismissed) {
      console.log("❌ Modal dismissed: User previously dismissed and plan selection not required");
      setShowPricingModal(false);
      return;
    }
    
    if (hasInvalidPlan) {
      console.log("🔒 Invalid plan detected - modal cannot be dismissed:", { plan, businessCount });
      // Clear any dismissal flags for users with invalid plans
      if (typeof window !== "undefined" && sessionStorage.getItem('pricingModalDismissed') === 'true') {
        sessionStorage.removeItem('pricingModalDismissed');
        console.log("🧹 Cleared dismissal flag for user with invalid plan");
      }
    }
    
    // Show pricing modal for users who need to choose plan (but not if they just completed payment)
    const paidPlans = ['builder', 'maven'];
    const isPaidUserCheck = plan ? paidPlans.includes(plan) : false;
    const shouldShowPricingModal = 
      !justCompletedPayment && 
      !isPaidUser &&
      !isPaidUserCheck &&
      (((!plan || plan === 'no_plan' || plan === 'NULL') && businessCount > 0) ||
      (plan === "grower" && isTrialExpired && !hasStripeCustomer));
    
    // Debug logging (simplified for Maven users)
    if (plan !== 'maven') {
      console.log('🔍 Plan selection debug:', {
        accountPlan: plan,
        businessCount,
        shouldShowModal: shouldShowPricingModal,
        isPaidUser: isPaidUser,
        isPaidUserCheck: isPaidUserCheck,
        showPricingModal,
        modalDecision: {
          justCompletedPayment: !!justCompletedPayment,
          isPaidUser: !!isPaidUser,
          isPaidUserCheck: !!isPaidUserCheck,
          hasNoPlan: (!plan || plan === 'no_plan' || plan === 'NULL'),
          hasBusinesses: businessCount > 0
        }
      });
    } else {
      console.log('✅ Maven user - no modal needed');
    }
    
    setPlanSelectionRequired(!!isPlanSelectionRequired);
    setShowPricingModal(!!shouldShowPricingModal);
  }, [authLoading, accountLoading, businessesLoading, account, businessData, justCompletedPayment]);

  // EMERGENCY FIX: Close modal and clear flags for Maven users
  useEffect(() => {
    if (account?.plan === 'maven' && showPricingModal) {
      console.log('🎉 Maven plan detected - closing modal and clearing flags');
      setShowPricingModal(false);
      setPlanSelectionRequired(false);
      setJustCompletedPayment(false);
      
      // Clear all modal-related session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
        localStorage.removeItem('showPostSaveModal');
        console.log('🧹 Cleared all modal storage flags');
      }
    }
  }, [account?.plan, showPricingModal]);

  // Handle URL parameters and celebrations
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    
    // Handle successful Stripe payment
    if (params.get("success") === "1") {
      const changeType = params.get("change");
      const planName = params.get("plan");
      
      console.log("🎉 Successful payment detected:", { changeType, planName });
      
      setPaymentChangeType(changeType);
      
      // CRITICAL: Close pricing modal and refresh account data after successful payment
      console.log("🎯 Closing pricing modal and refreshing account data after successful payment");
      setShowPricingModal(false);
      setPlanSelectionRequired(false);
      setJustCompletedPayment(true);
      
      // Clear any dismissal flags since user now has a valid plan
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
        console.log("🧹 Cleared modal dismissal flag after successful payment");
      }
      
      // Refresh account data to get updated plan
      if (user?.id) {
        console.log("🔄 Refreshing account data to get updated plan...");
        refreshAccountDetails().then(() => {
          console.log("✅ Account data refreshed after successful payment");
          // Reset the flag after account data is refreshed
          setTimeout(() => setJustCompletedPayment(false), 1000);
        }).catch(error => {
          console.error("❌ Error refreshing account data:", error);
          // Reset the flag even if refresh fails
          setTimeout(() => setJustCompletedPayment(false), 1000);
        });
      }
      
      // Show celebration for upgrades and new signups
      if (changeType === "upgrade" || changeType === "new") {
        console.log("🎉 Showing celebration for upgrade/new signup");
        setShowStarfallCelebration(true);
        setTimeout(() => setShowSuccessModal(true), 1000);
      } else if (changeType === "downgrade") {
        console.log("📉 Downgrade detected - no celebration");
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
      console.log("🔄 User canceled Stripe checkout, showing pricing modal again");
      setJustCanceledStripe(true);
      setShowPricingModal(true);
      
      // Clear any previous modal dismissal since user needs to select a plan
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
        console.log("🧹 Cleared modal dismissal flag after Stripe cancellation");
      }
      
      // Clean up the URL
      params.delete("canceled");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
      
      return;
    }
    
    // Handle business creation success
    if (params.get("businessCreated") === "1") {
      console.log("🎉 Business created successfully");
      
      // Clear any previous modal dismissal from sessionStorage since user just created business
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
        console.log("🧹 Cleared previous modal dismissal flag");
      }
      
      // Force refresh of dashboard data after business creation
      if (user?.id) {
        console.log("🔄 Forcing data refresh after business creation...");
        
        // Refresh both AuthContext data and dashboard-specific data
        Promise.all([
          refreshAuth(),
          refreshAccountDetails(),
          loadDashboardSpecificData()
        ]).then(() => {
          console.log("✅ Data refresh completed after business creation");
          
          // Force show pricing modal after business creation - new users need to select a plan
          console.log("✅ Forcing pricing modal to show after business creation");
          setShowPricingModal(true);
          setPlanSelectionRequired(true); // Make it required so user can't dismiss
          
        }).catch(error => {
          console.error("❌ Error refreshing data after business creation:", error);
          // Still show pricing modal even if refresh fails
          console.log("🔄 Still showing pricing modal despite refresh error");
          setShowPricingModal(true);
          setPlanSelectionRequired(true);
        });
      }
      
      // Clean up the URL
      params.delete("businessCreated");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
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
        console.error('  User:', user.email);
        console.error('  Customer ID:', account.stripe_customer_id);
        
        // Show user-friendly message
        console.error('💬 User Message: Payment successful but account update pending. Please refresh in a few minutes or contact support if the issue persists.');
      }
    }
  }, [user, account, searchParams]);

  // Debug logging for Maven users - simplified to prevent re-renders
  useEffect(() => {
    if (user && account && account.plan !== 'maven') {
      console.log('📊 Dashboard Debug Info:');
      console.log('  Email:', user.email);
      console.log('  Plan:', account.plan);
      console.log('  Business Count:', businessData?.businessCount || 0);
      console.log('  Stripe Customer ID:', account.stripe_customer_id || 'MISSING');
      console.log('  Subscription Status:', account.subscription_status || 'MISSING');
    }
  }, [user?.email, account?.plan, businessData?.businessCount, account?.stripe_customer_id]);

  // Loading state
  const isLoading = authLoading || accountLoading || isDashboardLoading;

  // Consolidated data for components (combining AuthContext + dashboard data)
  const consolidatedData = useMemo(() => {
    if (!account || !businessData || !dashboardData) return null;
    
    return {
      user,
      account,
      businesses: businessData.businesses,
      promptPages: dashboardData.promptPages,
      widgets: dashboardData.widgets,
      isAdminUser,
      accountLimits: dashboardData.accountLimits,
      reviewStats: dashboardData.reviewStats,
      universalPromptPage: dashboardData.universalPromptPage,
      customPromptPages: dashboardData.customPromptPages,
      universalUrl: dashboardData.universalUrl
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
    dashboardData?.universalUrl
  ]);

  // Early returns for loading and error states
  if (authLoading) {
    return <AppLoader />;
  }
  
  if (!isAuthenticated) {
    return <AppLoader />; // Auth guard will handle redirect
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-slate-700 hover:bg-slate-800"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isDashboardLoading || businessesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FiveStarSpinner />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show welcome message for new users
  if (!hasBusiness) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to PromptReviews! 🎉</h2>
          <p className="text-gray-600 mb-8">
            Let's get you started by creating your first business profile.
          </p>
          <Link 
            href="/dashboard/create-business"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800"
          >
            <FaPlus className="mr-2" />
            Create Your Business
          </Link>
        </div>
      </div>
    );
  }

  if (!consolidatedData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <FiveStarSpinner />
      </div>
    );
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

  const handleSelectTier = async (tierKey: string) => {
    try {
      console.log(`🎯 Selected tier: ${tierKey}`);
      console.log(`📊 Account details:`, { 
        accountId: account?.id, 
        currentPlan: account?.plan, 
        userEmail: user?.email 
      });
      setShowTopLoader(true);
      
      // Track the plan selection
      await trackEvent(GA_EVENTS.PLAN_SELECTED, {
        plan: tierKey,
        source: 'dashboard_modal'
      });
      
      // Handle grower plan (free trial) - update directly without Stripe
      if (tierKey === "grower") {
        if (!account?.id) {
          throw new Error("Account not found");
        }
        
        // Update account to grower plan with trial dates
        const { error: updateError } = await supabase
          .from("accounts")
          .update({ 
            plan: tierKey,
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          })
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
          console.log("🧹 Cleared modal dismissal flag after grower plan selection");
        }
        
        // Refresh page to show updated data
        setTimeout(() => window.location.reload(), 1000);
        return;
      }
      
      // For paid plans, use Stripe checkout
      if (!account?.id) {
        throw new Error("Account not found");
      }
      
      const checkoutData = {
        plan: tierKey,
        userId: account.id,
        email: user?.email,
      };
      
      console.log(`💳 Creating Stripe checkout session for:`, checkoutData);
      
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
      console.log(`✅ Stripe checkout response:`, responseData);
      
      const { url } = responseData;
      
      if (url) {
        console.log(`🚀 Redirecting to Stripe Checkout for ${tierKey}:`, url);
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
      console.log("⚠️ Plan selection required - cannot close modal", { 
        planSelectionRequired, 
        hasInvalidPlan, 
        currentPlan: account?.plan,
        businessCount: businessData?.businessCount 
      });
      return;
    }
    
    setShowPricingModal(false);
    setJustCanceledStripe(false);
    
    // Remember that user dismissed the modal for this session
    if (typeof window !== "undefined") {
      sessionStorage.setItem('pricingModalDismissed', 'true');
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

  return (
    <div className="min-h-screen flex flex-col justify-start px-4 sm:px-0">
      {/* Quotes Display - positioned between nav and PageCard */}
      <div className="flex justify-center items-center pt-12 pb-4">
        <QuoteDisplay />
      </div>
      
      {/* PageCard with extra top margin to accommodate quotes */}
      <div className="flex justify-center items-start flex-1">
        <PageCard
          icon={<FaHome className="w-8 h-8 text-slate-blue" />}
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
            userId={user?.id}
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
          hasHadPaidPlan={account?.has_had_paid_plan || false}
          showCanceledMessage={justCanceledStripe}
          onClose={handleClosePricingModal}
          isPlanSelectionRequired={planSelectionRequired}
        />
      )}
      
      {/* Starfall Celebration */}
      <StarfallCelebration 
        isVisible={showStarfallCelebration}
        onComplete={() => setShowStarfallCelebration(false)}
        duration={3000}
      />
    </div>
  );
}
