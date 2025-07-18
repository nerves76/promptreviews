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
        // Don't throw - just set empty data to prevent reload
        return;
      }
      
      console.log('✅ Dashboard: Loaded businesses:', { count: businesses?.length || 0, businesses });
      setBusinessesData(businesses || []);
      
    } catch (error) {
      console.error('❌ Dashboard: Error loading businesses:', error);
      setBusinessesData([]);
      // Don't throw - just set empty data to prevent reload
    } finally {
      setBusinessesLoading(false);
    }
  }, [user?.id, account?.id, businessesLoading, supabase]);

  // Load dashboard-specific data (widgets, prompt pages, reviews)
  const loadDashboardSpecificData = useCallback(async () => {
    if (!user?.id || !account?.id) return;
    
    try {
      setIsDashboardLoading(true);
      setError(null);
      
      console.log('📊 Dashboard: Loading dashboard-specific data...');
      
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
        
        // Use a more defensive approach for widget_reviews
        (async () => {
          try {
            console.log('🔍 Dashboard: Attempting to fetch widget_reviews...');
            // First get the widget IDs for this account
            const widgetIdsResult = await supabase
              .from("widgets")
              .select("id")
              .eq("account_id", account.id);
            
            if (widgetIdsResult.error) {
              console.error("Error fetching widget IDs:", widgetIdsResult.error);
              return;
            }
            
            const widgetIds = widgetIdsResult.data?.map(w => w.id) || [];
            
            if (widgetIds.length === 0) {
              return; // No widgets, no reviews to check
            }
            
            const result = await supabase
              .from("widget_reviews")
              .select("id, verified")
              .in("widget_id", widgetIds);
            
            if (result.error) {
              console.error('❌ Dashboard: widget_reviews query failed:', result.error);
              // Return empty data instead of throwing
              return { data: [], error: null };
            }
            return result;
          } catch (error) {
            console.error('❌ Dashboard: widget_reviews query exception:', error);
            // Return empty data instead of throwing
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
        console.error('❌ Dashboard: widget_reviews query failed:', reviewsResult.reason);
      }
      if (limitsResult.status === 'rejected') {
        console.error('❌ Dashboard: account limits check failed:', limitsResult.reason);
      }

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
        if (review.verified) {
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
      // Don't throw - just set error state to prevent reload
    } finally {
      setIsDashboardLoading(false);
    }
  }, [user?.id, user?.email, account?.id, supabase]);

  // Add a ref to track if businessCreated param was handled
  const businessCreatedHandled = useRef(false);

  // Load dashboard data when auth is ready
  useEffect(() => {
    if (authLoading || accountLoading) return;
    if (!isAuthenticated || !user || !account) return;
    // Prevent double load if businessCreated was just handled
    if (businessCreatedHandled.current) return;
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
      setShowPricingModal(false);
      return;
    }
    
    if (hasInvalidPlan) {
      // Clear any dismissal flags for users with invalid plans
      if (typeof window !== "undefined" && sessionStorage.getItem('pricingModalDismissed') === 'true') {
        sessionStorage.removeItem('pricingModalDismissed');
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
    

    
    setPlanSelectionRequired(!!isPlanSelectionRequired);
    setShowPricingModal(!!shouldShowPricingModal);
  }, [authLoading, accountLoading, businessesLoading, account, businessData, justCompletedPayment]);

  // Close modal and clear flags for Maven users
  useEffect(() => {
    if (account?.plan === 'maven' && showPricingModal) {
      setShowPricingModal(false);
      setPlanSelectionRequired(false);
      setJustCompletedPayment(false);
      
      // Clear all modal-related session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pricingModalDismissed');
        localStorage.removeItem('showPostSaveModal');
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
      
      setPaymentChangeType(changeType);
      
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
        refreshAccountDetails().then(() => {
          // Reset the flag after account data is refreshed
          setTimeout(() => setJustCompletedPayment(false), 1000);
        }).catch(error => {
          console.error("Error refreshing account data:", error);
          // Reset the flag even if refresh fails
          setTimeout(() => setJustCompletedPayment(false), 1000);
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
      
      // Show pricing modal after business creation - new users need to select a plan
      setShowPricingModal(true);
      setPlanSelectionRequired(true); // Make it required so user can't dismiss
      
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-slate-700 hover:bg-slate-800"
          >
            Try again
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
          sessionStorage.removeItem('businessCreatedHandled');
          console.log("🧹 Cleared modal dismissal flag after grower plan selection");
        }
        
        // Instead of window.location.reload(), reload data and update state
        await Promise.all([
          refreshAuth(),
          refreshAccountDetails(),
          loadDashboardSpecificData()
        ]);
        setShowTopLoader(false);
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
      sessionStorage.removeItem('businessCreatedHandled');
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
      <div className="h-96 flex justify-center items-center pt-0 -mt-2">
        <QuoteDisplay />
      </div>
      
      {/* PageCard with consistent spacing */}
      <div className="flex justify-center items-start pt-0 pb-8 -mt-10">
        <PageCard
          icon={<FaHome className="w-8 h-8 text-slate-blue" />}
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
