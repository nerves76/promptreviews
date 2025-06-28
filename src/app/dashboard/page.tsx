"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { FaHome } from "react-icons/fa";
import DashboardContent from "./DashboardContent";
import { getUserOrMock, getSessionOrMock } from "@/utils/supabase";
import PricingModal from "../components/PricingModal";
import FiveStarSpinner from "../components/FiveStarSpinner";
import PageCard from "../components/PageCard";
import AppLoader from "../components/AppLoader";
import TopLoaderOverlay from "../components/TopLoaderOverlay";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import QuoteDisplay from "../components/QuoteDisplay";
import WelcomePopup from "../components/WelcomePopup";
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
  showWelcomePopup: boolean;
  accountLimits: any;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const createPromptPageRef = useRef<HTMLAnchorElement>(null);
  const [showQR, setShowQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [universalPromptPage, setUniversalPromptPage] = useState<any>(null);
  const [customPromptPages, setCustomPromptPages] = useState<any[]>([]);
  const [universalUrl, setUniversalUrl] = useState("");
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [savedPromptPageUrl, setSavedPromptPageUrl] = useState<string | null>(
    null,
  );
  const [showPricingModal, setShowPricingModal] = useState(true);
  const [pendingAccountUpdate, setPendingAccountUpdate] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    total: { week: 0, month: 0, year: 0 },
    verified: { week: 0, month: 0, year: 0 },
  });
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

  // Use auth guard to redirect new users to create business page
  useAuthGuard({ redirectToCreateBusiness: true });

  useEffect(() => {
    const loadDashboardData = async () => {
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
            showWelcomePopup: true,
            accountLimits: null
          });
          setIsLoading(false);
          return;
        }

        // Use admin status from context instead of checking here
        const adminStatus = isAdminUser;
        
        // Load account data
        let accountData = null;
        if (accountId) {
          const { data: account } = await supabase
            .from("accounts")
            .select("*")
            .eq("id", accountId)
            .single();
          accountData = account;
        }
        
        // Load businesses
        const { data: businesses } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", accountId);

        // Check if user has any businesses
        if (!businesses || businesses.length === 0) {
          setIsNewUser(true);
        }

        // Load prompt pages
        const { data: promptPages } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false });

        // Load widgets
        const { data: widgets } = await supabase
          .from("widgets")
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false });

        // Check account limits for prompt pages
        const limits = await checkAccountLimits(supabase, user.id, "prompt_page");

        // Check if welcome popup should be shown
        const showWelcome = !accountData?.has_seen_welcome && 
          (typeof window !== "undefined" ? !localStorage.getItem("welcomeShown") : true);

        setData({
          user,
          account: accountData,
          businesses: businesses || [],
          promptPages: promptPages || [],
          widgets: widgets || [],
          isAdminUser: adminStatus,
          showWelcomePopup: showWelcome,
          accountLimits: limits
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
        setIsLoading(false);
      }
    };

    // Only load data if admin status is not loading
    if (!adminLoading) {
      loadDashboardData();
    }
  }, [adminLoading, isAdminUser]);

  useEffect(() => {
    if (!data?.user) return;
    const fetchData = async () => {
      try {
        // Get account ID using the utility function
        const accountId = await getAccountIdForUser(data.user.id, supabase);
        
        if (!accountId) {
          throw new Error("No account data found");
        }

        // Fetch account details using the account ID
        const accountResult = await supabase
          .from("accounts")
          .select("*")
          .eq("id", accountId)
          .single();

        if (accountResult.error) {
          throw new Error(`Error fetching account: ${accountResult.error.message}`);
        }

        if (!accountResult.data) {
          throw new Error("No account data found");
        }
        setData(prev => prev ? { 
          ...prev, 
          account: accountResult.data,
          showWelcomePopup: prev.showWelcomePopup // Preserve the welcome popup state
        } : null);

        // Now fetch business and prompt pages with the correct account ID
        const businessResult = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", accountId)
          .single();

        if (businessResult.data) {
          setBusiness(businessResult.data);
        }

        // Fetch custom prompt pages
        const promptPagesResult = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .neq("is_universal", true)
          .order("created_at", { ascending: false });

        if (promptPagesResult.data) {
          setCustomPromptPages(promptPagesResult.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(`Error fetching dashboard data: ${error}`);
      }
    };

    fetchData();
  }, [data?.user, supabase]);

  useEffect(() => {
    // Check for post-save modal flag in localStorage
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

  useEffect(() => {
    if (isLoading) return;
    
    if (data?.account === null) return;
    
    const paidPlans = ["grower", "builder", "maven"];
    const now = new Date();
    const trialStart = data?.account?.trial_start
      ? new Date(data.account.trial_start)
      : null;
    const trialEnd = data?.account?.trial_end ? new Date(data.account.trial_end) : null;

    // Check if user is on a paid plan
    const isPaidUser = paidPlans.includes(data?.account?.plan || "free");

    // Check if trial has expired
    const isTrialExpired =
      trialEnd && now > trialEnd && data?.account?.plan === "free";

    // Show pricing modal if user is on free plan and trial has expired
    if (isTrialExpired && !isPaidUser) {
      setShowPricingModal(true);
    } else {
      setShowPricingModal(false);
    }
  }, [data?.account, isLoading]);

  useEffect(() => {
    if (!data?.user || !business) return;

    // REVIEW STATS SOURCE OF TRUTH:
    // This should be the only place where review stats are calculated
    const fetchStats = async () => {
      try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        // Fetch reviews for the business
        const { data: reviews } = await supabase
          .from("reviews")
          .select("*")
          .eq("business_id", business.id);

        if (reviews) {
          const stats = {
            total: {
              week: reviews.filter(r => new Date(r.created_at) >= weekAgo).length,
              month: reviews.filter(r => new Date(r.created_at) >= monthAgo).length,
              year: reviews.filter(r => new Date(r.created_at) >= yearAgo).length,
            },
            verified: {
              week: reviews.filter(r => new Date(r.created_at) >= weekAgo && r.is_verified).length,
              month: reviews.filter(r => new Date(r.created_at) >= monthAgo && r.is_verified).length,
              year: reviews.filter(r => new Date(r.created_at) >= yearAgo && r.is_verified).length,
            },
          };

          setReviewStats(stats);
        }
      } catch (error) {
        console.error("Error fetching review stats:", error);
      }
    };

    fetchStats();
  }, [data?.user, business, supabase]);

  const handleCreatePromptPageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (data?.account?.plan === "free" && customPromptPages.length >= 1) {
      e.preventDefault();
      setShowPricingModal(true);
    }
  };

  const handleCopyLink = async () => {
    if (universalUrl) {
      await navigator.clipboard.writeText(universalUrl);
      setCopySuccess("Link copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    }
  };

  const handleSelectTier = async (tierKey: string) => {
    try {
      setPendingAccountUpdate(true);
      const response = await fetch("/api/update-account-tier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier: tierKey,
          accountId: data?.account?.id,
        }),
      });

      if (response.ok) {
        // Refresh the page to show updated plan
        window.location.reload();
      } else {
        console.error("Failed to update account tier");
      }
    } catch (error) {
      console.error("Error updating account tier:", error);
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

  // Handler for closing the welcome popup and marking as seen
  const handleCloseWelcome = () => {
    setData(prev => prev ? { ...prev, showWelcomePopup: false } : null);
    localStorage.setItem("welcomeShown", "true");
    
    // Update account to mark welcome as seen
    if (data?.user) {
      supabase
        .from("accounts")
        .update({ has_seen_welcome: true })
        .eq("id", data.user.id)
        .then(() => console.log("Welcome popup marked as seen"));
    }
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
    return <FiveStarSpinner />;
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
      
      {/* Welcome message for new users */}
      {isNewUser && (
        <div className="flex justify-center items-center mb-6">
          <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6 border-2 border-slate-blue">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to PromptReviews! 🎉</h2>
              <p className="text-gray-600 mb-6">
                We're excited to help you get more reviews for your business. To get started, 
                you'll need to create your business profile first.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/create-business">
                  <Button className="bg-slate-blue hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold">
                    <FaStore className="mr-2" />
                    Create Business Profile
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewUser(false)}
                  className="px-6 py-3 rounded-lg font-semibold"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
            customPromptPages={customPromptPages}
            universalPromptPage={universalPromptPage}
            createPromptPageRef={createPromptPageRef}
            handleCreatePromptPageClick={handleCreatePromptPageClick}
            showQR={showQR}
            handleCopyLink={handleCopyLink}
            copySuccess={copySuccess}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            showSuccessModal={showSuccessModal}
            setShowSuccessModal={setShowSuccessModal}
            universalUrl={universalUrl}
            QRCode={QRCodeSVG}
            setShowQR={setShowQR}
            account={data?.account}
            parentLoading={isLoading}
            reviewStats={reviewStats}
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
      
      {/* Welcome Popup for first-time users */}
      {data?.showWelcomePopup && (
        <WelcomePopup
          isOpen={data.showWelcomePopup}
          onClose={handleCloseWelcome}
          title="Oh hi there—I'm Prompty!"
          message={`Welcome to Prompt Reviews!

Did you know you're a miracle? Carl Sagan said it best:
"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."

Beautiful right! There is a flaming gas giant in you too! Wait, that didn't come out right . . . Anyway, I am here to help you get the stars you deserve—on Google, Facebook, TripAdvisor, Clutch—you name it.

Here's your first tip: [icon] <----Click here

OK, that's it for now—let's go get some stars! 🌟`}
          imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-600kb.png"
          imageAlt="Prompty - Get Reviews"
          buttonText="Let's Go Get Some Stars! 🌟"
          onButtonClick={handleCloseWelcome}
        />
      )}
    </div>
  );
}
