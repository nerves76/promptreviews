"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { FaHome } from "react-icons/fa";
import DashboardContent from "./DashboardContent";
import { getUserOrMock, getSessionOrMock } from "@/utils/supabaseClient";
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
import { getAccountIdForUser } from "@/utils/accountUtils";
import { useAuthGuard } from "@/utils/authGuard";
import { FaStore, FaChartLine, FaUser, FaCog, FaSignOutAlt, FaPlus } from "react-icons/fa";
import { checkAccountLimits } from "@/utils/accountLimits";
import { useAdmin } from "@/contexts/AdminContext";

interface DashboardData {
  user: any;
  account: any;
  businesses: any[];
  promptPages: any[];
  widgets: any[];
  isAdminUser: boolean;
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
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const createPromptPageRef = useRef<HTMLAnchorElement>(null);
  const [showQR, setShowQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [savedPromptPageUrl, setSavedPromptPageUrl] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(true);
  const [pendingAccountUpdate, setPendingAccountUpdate] = useState(false);
  const [showStarfallCelebration, setShowStarfallCelebration] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showTopLoader, setShowTopLoader] = useState(false);
  const [accountData, setAccountData] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Use the centralized admin context instead of local state
  const { isAdminUser, isLoading: adminLoading } = useAdmin();

  // Use auth guard with loading state
  const { loading: authLoading, shouldRedirect } = useAuthGuard({ redirectToCreateBusiness: true });

  // Consolidated data loading function
  const loadAllDashboardData = async (user: any, accountId: string) => {
    try {
      // Batch all database queries together for better performance
      const [
        accountResult,
        businessesResult,
        promptPagesResult,
        widgetsResult,
        reviewStatsResult,
        limitsResult
      ] = await Promise.all([
        // Account data
        supabase
          .from("accounts")
          .select("*")
          .eq("id", accountId)
          .single(),
        
        // Businesses
        supabase
          .from("businesses")
          .select("*")
          .eq("account_id", accountId),
        
        // All prompt pages
        supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false }),
        
        // Widgets
        supabase
          .from("widgets")
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false }),
        
        // Review statistics
        supabase
          .from("widget_reviews")
          .select("id, is_verified")
          .eq("account_id", accountId),
        
        // Account limits
        checkAccountLimits(supabase, user.id, "prompt_page")
      ]);

      // Process the results
      const account = accountResult.data;
      const businesses = businessesResult.data || [];
      const allPromptPages = promptPagesResult.data || [];
      const widgets = widgetsResult.data || [];
      const reviews = reviewStatsResult.data || [];
      const limits = limitsResult;

      // Separate universal and custom prompt pages
      const universalPromptPage = allPromptPages.find(pp => pp.is_universal);
      const customPromptPages = allPromptPages.filter(pp => !pp.is_universal);
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

      // Check if user has any businesses
      if (!businesses || businesses.length === 0) {
        setIsNewUser(true);
      }

      // Set business state
      if (businesses.length > 0) {
        setBusiness(businesses[0]);
      }

      // Compile all data
      const dashboardData: DashboardData = {
        user,
        account,
        businesses,
        promptPages: allPromptPages,
        widgets,
        isAdminUser,
        accountLimits: limits,
        reviewStats: stats,
        universalPromptPage,
        customPromptPages,
        universalUrl
      };

      setData(dashboardData);
      setBusinesses(businesses);
      setAccountData(account);
      setUser(user);
      setIsAdmin(isAdminUser);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data");
    }
  };

  // Single useEffect for all data loading
  useEffect(() => {
    // Only load data if admin status is not loading
    if (adminLoading) return;
    
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          setError("You must be signed in to access the dashboard.");
          setIsLoading(false);
          return;
        }

        // Get account ID using the utility function
        const accountId = await getAccountIdForUser(user.id, supabase);
        
        if (!accountId) {
          // New user - show welcome message and guide to create business
          setIsNewUser(true);
          setData({
            user,
            account: null,
            businesses: [],
            promptPages: [],
            widgets: [],
            isAdminUser: isAdminUser,
            accountLimits: null,
            reviewStats: { total: { week: 0, month: 0, year: 0 }, verified: { week: 0, month: 0, year: 0 } },
            universalPromptPage: null,
            customPromptPages: [],
            universalUrl: ""
          });
          setIsLoading(false);
          return;
        }

        // Load all data in parallel
        await loadAllDashboardData(user, accountId);
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        setError("Failed to initialize dashboard");
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [adminLoading, isAdminUser]);

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

  // Handle pricing modal logic
  useEffect(() => {
    if (isLoading || !data?.account) return;
    
    const paidPlans = ["grower", "builder", "maven"];
    const now = new Date();
    const trialStart = data?.account?.trial_start
      ? new Date(data.account.trial_start)
      : null;
    const trialEnd = data?.account?.trial_end ? new Date(data.account.trial_end) : null;

    // Check if user is on a paid plan
    const isPaidUser = paidPlans.includes(data?.account?.plan || "");

    // Check if trial has expired
    const isTrialExpired =
      trialEnd && now > trialEnd && data?.account?.plan === "grower";

    // Show pricing modal for new users who need to choose their initial plan
    // or for users on grower plan with expired trial
    const shouldShowPricingModal = 
      // New user who hasn't selected a plan yet (no plan or 'no_plan' and has created a business)
      ((!data?.account?.plan || data?.account?.plan === 'no_plan') && (data?.businesses?.length || 0) > 0) ||
      // Or trial has expired
      (isTrialExpired && !isPaidUser);

    setShowPricingModal(!!shouldShowPricingModal);
  }, [isLoading, data?.account, data?.businesses]);

  // Handle business created query param and celebration
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("businessCreated") === "true") {
      setShowPricingModal(true);
      // Remove the query param from the URL
      params.delete("businessCreated");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }
    

  }, []);

  // Handle loading and redirect states after all hooks are called
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  // Don't render anything if we're redirecting
  if (shouldRedirect) {
    return null;
  }

  const handleCreatePromptPageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (data?.account?.plan === "free" && data?.customPromptPages?.length >= 1) {
      e.preventDefault();
      setShowPricingModal(true);
    }
  };

  const handleCopyLink = async () => {
    if (data?.universalUrl) {
      await navigator.clipboard.writeText(data.universalUrl);
      setCopySuccess("Link copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    }
  };

  const handleSelectTier = async (tierKey: string) => {
    try {
      setPendingAccountUpdate(true);
      
      // Get current plan and target tier info
      const currentPlan = data?.account?.plan;
      const currentTier = tiers.find((t) => t.key === currentPlan);
      const targetTier = tiers.find((t) => t.key === tierKey);
      
      // Determine if this is an upgrade, downgrade, or same plan
      const isUpgrade = currentTier && targetTier && targetTier.order > currentTier.order;
      const isDowngrade = currentTier && targetTier && targetTier.order < currentTier.order;
      const isSamePlan = currentPlan === tierKey;
      
      // For Grower plan (free trial), bypass Stripe and update directly
      if (tierKey === "grower" || isSamePlan) {
        await supabase
          .from("accounts")
          .update({ 
            plan: tierKey,
            // Set trial start and end dates for grower plan
            ...(tierKey === "grower" && {
              trial_start: new Date().toISOString(),
              trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
            })
          })
          .eq("id", data?.account?.id);
        
        // Close the pricing modal
        setShowPricingModal(false);
        
        // Show starfall celebration
        setShowStarfallCelebration(true);
        
        // Dispatch event to refresh navigation state
        window.dispatchEvent(new CustomEvent('planSelected', { detail: { plan: tierKey } }));
        
        return;
      }
      
      // For upgrades, redirect to Stripe checkout
      if (isUpgrade) {
        // If user already has a Stripe customer ID, send to billing portal for upgrades
        if (data?.account?.stripe_customer_id) {
          const res = await fetch("/api/create-stripe-portal-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: data.account.stripe_customer_id }),
          });
          const portalData = await res.json();
          if (portalData.url) {
            window.location.href = portalData.url;
            return;
          } else {
            alert("Could not open billing portal.");
            return;
          }
        }
        
        // Otherwise, proceed with checkout session (for new users)
        const email = data?.user?.email;
        if (!email) {
          alert("No valid email address found for checkout.");
          return;
        }
        
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: tierKey,
            userId: data?.account?.id,
            email,
          }),
        });
        
        const checkoutData = await res.json();
        if (checkoutData.url) {
          // Set flag to show success modal after Stripe redirect
          localStorage.setItem("showPlanSuccess", "1");
          window.location.href = checkoutData.url;
          return;
        } else {
          alert("Failed to start checkout: " + (checkoutData.error || "Unknown error"));
          return;
        }
      }
      
      // For downgrades, update directly (you might want to add confirmation modal here)
      if (isDowngrade) {
        await supabase
          .from("accounts")
          .update({ plan: tierKey })
          .eq("id", data?.account?.id);
        
        // Close the pricing modal
        setShowPricingModal(false);
        
        // Show starfall celebration
        setShowStarfallCelebration(true);
        
        // Dispatch event to refresh navigation state
        window.dispatchEvent(new CustomEvent('planSelected', { detail: { plan: tierKey } }));
        
        return;
      }
      
    } catch (error) {
      console.error("Error updating account tier:", error);
      alert("Failed to update account tier. Please try again.");
    } finally {
      setPendingAccountUpdate(false);
    }
  };

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
  };

  const handleClosePostSaveModal = () => {
    setShowPostSaveModal(false);
    setSavedPromptPageUrl(null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return <AppLoader variant="centered" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log("Dashboard rendering with data:", { data, isLoading });

  const userName =
    (data?.account?.first_name && data.account.first_name.trim().split(" ")[0]) ||
    (business?.first_name && business.first_name.trim().split(" ")[0]) ||
    (business?.name && business.name.trim().split(" ")[0]) ||
    (data?.user?.user_metadata?.full_name &&
      data.user.user_metadata.full_name.trim().split(" ")[0]) ||
    data?.user?.email?.split("@")[0] ||
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
            business={business}
            customPromptPages={data?.customPromptPages || []}
            universalPromptPage={data?.universalPromptPage}
            createPromptPageRef={createPromptPageRef}
            handleCreatePromptPageClick={handleCreatePromptPageClick}
            showQR={showQR}
            handleCopyLink={handleCopyLink}
            copySuccess={copySuccess}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            showSuccessModal={showSuccessModal}
            setShowSuccessModal={setShowSuccessModal}
                         universalUrl={data?.universalUrl || ""}
            QRCode={QRCodeSVG}
            setShowQR={setShowQR}
            account={data?.account}
            parentLoading={isLoading}
                         reviewStats={data?.reviewStats || { total: { week: 0, month: 0, year: 0 }, verified: { week: 0, month: 0, year: 0 } }}
            hasBusiness={!!(data?.businesses && data.businesses.length > 0)}
            hasCustomPromptPages={!!(data?.promptPages && data.promptPages.filter(p => !p.is_universal).length > 0)}
            hasUniversalPromptPage={!!(data?.promptPages && data.promptPages.some(p => p.is_universal))}
            userId={data?.user?.id}
            setShowStarfallCelebration={setShowStarfallCelebration}
          />
        </PageCard>
      </div>
      
      {/* Pricing Modal */}
      {showPricingModal && (
        <PricingModal
          onSelectTier={handleSelectTier}
          currentPlan={data?.account?.plan}
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
