"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import DashboardContent from "./DashboardContent";
import { getUserOrMock, getSessionOrMock } from "@/utils/supabase";
import PricingModal from "../components/PricingModal";
import FiveStarSpinner from "../components/FiveStarSpinner";
import PageCard from "../components/PageCard";
import AppLoader from "../components/AppLoader";
import TopLoaderOverlay from "../components/TopLoaderOverlay";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [promptPages, setPromptPages] = useState<any[]>([]);
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
  const [account, setAccount] = useState<any>(null);
  const [showPricingModal, setShowPricingModal] = useState(true);
  const [pendingAccountUpdate, setPendingAccountUpdate] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    total: { week: 0, month: 0, year: 0 },
    verified: { week: 0, month: 0, year: 0 },
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        console.log("Getting user...");
        const { data: { user }, error } = await getUserOrMock(supabase);
        if (error) {
          console.error("Auth error:", error);
          setIsLoading(false);
          router.push("/auth/sign-in");
          return;
        }
        if (!user) {
          console.log("No user found, redirecting to sign-in");
          setIsLoading(false);
          router.push("/auth/sign-in");
          return;
        }
        console.log("User found:", user.email);
        setUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
        setIsLoading(false);
        router.push("/auth/sign-in");
      }
    };

    getUser();
  }, [supabase, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const { data: { session }, error: sessionError } = await getSessionOrMock(supabase);
        if (sessionError) {
          throw new Error("Session error: " + (sessionError as Error).message);
        }
        if (!session) {
          throw new Error("No active session found. Please sign in again.");
        }

        // Fetch account profile
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select(
            "id, plan, is_free_account, subscription_status, first_name, last_name, trial_start, trial_end, custom_prompt_page_count, contact_count, created_at",
          )
          .eq("id", session.user.id)
          .single();

        if (accountError) {
          throw new Error("Error fetching account: " + (accountError as Error).message);
        }
        if (!accountData) {
          throw new Error("No account data found");
        }
        setAccount(accountData);

        // Fetch business profile
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (businessError || !businessData) {
          setBusiness(null);
          setShowProfileModal(true);
          // Don't return early - continue to fetch prompt pages
        } else {
          setBusiness(businessData);
        }

        // Fetch prompt pages
        const { data: promptPagesData, error: promptPagesError } =
          await supabase
            .from("prompt_pages")
            .select("*")
            .eq("account_id", session.user.id)
            .order("created_at", { ascending: false });

        if (promptPagesError) {
          throw promptPagesError;
        }

        // Separate universal and custom prompt pages
        const universal = promptPagesData?.find((page) => page.is_universal);
        const custom =
          promptPagesData?.filter((page) => !page.is_universal) || [];

        setUniversalPromptPage(universal);
        setCustomPromptPages(custom);

        if (universal) {
          setUniversalUrl(`${window.location.origin}/r/${universal.slug}`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, supabase]);

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
    if (account === null) return;
    const paidPlans = ["grower", "builder", "maven"];
    const now = new Date();
    const trialStart = account?.trial_start
      ? new Date(account.trial_start)
      : null;
    const trialEnd = account?.trial_end ? new Date(account.trial_end) : null;

    // Check if user is on a paid plan
    const isPaidUser = paidPlans.includes(account.plan);

    // Check if trial has expired
    const isTrialExpired =
      trialEnd && now > trialEnd && account.plan === "free";

    // Show pricing modal if user is on free plan and trial has expired
    if (!isPaidUser && isTrialExpired) {
      setShowPricingModal(true);
    } else {
      setShowPricingModal(false);
    }
  }, [account, isLoading]);

  useEffect(() => {
    if (!user || !business) return;

    // REVIEW STATS SOURCE OF TRUTH:
    // We use business_id as the only source of truth for review stats.
    // This ensures that stats are robust to prompt page deletion and always reflect all reviews for the business.
    // If a review is deleted, stats will update accordingly. If a prompt page is deleted, reviews with the correct business_id are still counted.
    // See README for rationale.
    const fetchStats = async () => {
      try {
        const { data: reviews } = await supabase
          .from("review_submissions")
          .select("created_at, verified")
          .eq("business_id", business.id);

        const now = new Date();

        const isThisWeek = (date: Date) => {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        };

        const isThisMonth = (date: Date) =>
          date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

        const isThisYear = (date: Date) => date.getFullYear() === now.getFullYear();

        const stats = {
          total: { week: 0, month: 0, year: 0 },
          verified: { week: 0, month: 0, year: 0 },
        };

        reviews?.forEach((review) => {
          const reviewDate = new Date(review.created_at);
          if (isThisWeek(reviewDate)) {
            stats.total.week++;
            if (review.verified) stats.verified.week++;
          }
          if (isThisMonth(reviewDate)) {
            stats.total.month++;
            if (review.verified) stats.verified.month++;
          }
          if (isThisYear(reviewDate)) {
            stats.total.year++;
            if (review.verified) stats.verified.year++;
          }
        });

        setReviewStats(stats);
      } catch (error) {
        console.error("Error fetching review stats:", error);
      }
    };

    fetchStats();
  }, [user, business, supabase]);

  const handleCreatePromptPageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (account?.plan === "free" && customPromptPages.length >= 1) {
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
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier: tierKey,
          accountId: account?.id,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
  };

  const handleClosePostSaveModal = () => {
    setShowPostSaveModal(false);
    setSavedPromptPageUrl(null);
  };

  if (isLoading) {
    console.log("Dashboard loading state:", { isLoading, user, account, business });
    return <AppLoader />;
  }

  if (error) {
    console.log("Dashboard error state:", { error, user, account, business });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  console.log("Dashboard rendering with data:", { user, account, business, isLoading });

  const userName =
    (account?.first_name && account.first_name.trim().split(" ")[0]) ||
    (business?.first_name && business.first_name.trim().split(" ")[0]) ||
    (business?.name && business.name.trim().split(" ")[0]) ||
    (user?.user_metadata?.full_name &&
      user.user_metadata.full_name.trim().split(" ")[0]) ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <PageCard>
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
        account={account}
        parentLoading={isLoading}
        reviewStats={reviewStats}
      />
      
      {/* Pricing Modal */}
      {showPricingModal && (
        <PricingModal
          onSelectTier={handleSelectTier}
          currentPlan={account?.plan}
        />
      )}
    </PageCard>
  );
}
