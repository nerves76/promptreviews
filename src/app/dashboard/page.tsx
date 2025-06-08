"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import DashboardContent from "./DashboardContent";
import { FaHome, FaBuilding, FaBullhorn, FaTimes } from "react-icons/fa";
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
  const searchParams = useSearchParams();
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
  const success = searchParams.get("success");
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
        const {
          data: { user },
        } = await getUserOrMock(supabase);
        if (!user) {
          router.push("/auth/sign-in");
          return;
        }
        setUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [supabase, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Debug: log current user/session before fetching account
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();
        console.log(
          "Current user before account fetch:",
          currentUser,
          "Error:",
          userError,
        );

        const {
          data: { session },
        } = await getSessionOrMock(supabase);
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
        console.log("Fetched accountData:", accountData);
        if (!accountError && accountData) {
          setAccount(accountData);
        }

        // Fetch business profile
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (businessError || !businessData) {
          setBusiness(null);
          setShowProfileModal(true);
          setIsLoading(false);
          return;
        }
        setBusiness(businessData);

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
  }, [user, searchParams, supabase]);

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
    if (success === "1") {
      setPendingAccountUpdate(true);
    }
  }, [success]);

  useEffect(() => {
    // Refetch account if payment was successful
    if (success === "1" && user) {
      const fetchAccount = async () => {
        const { data: accountData } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", user.id)
          .single();
        setAccount(accountData);
        // Logging for debug
        console.log("Fetched accountData after payment:", accountData);
      };
      fetchAccount();
    }
  }, [success, user, supabase]);

  useEffect(() => {
    if (isLoading) return;
    if (account === null) return;
    const paidPlans = ["grower", "builder", "maven"];
    const now = new Date();
    const trialStart = account?.trial_start
      ? new Date(account.trial_start)
      : null;
    const trialEnd = account?.trial_end ? new Date(account.trial_end) : null;
    const isOnPaidPlan = paidPlans.includes(account?.plan);
    const isActive = account?.subscription_status === "active";
    const planExpired =
      account?.plan === "grower" && trialEnd && now > trialEnd && !isActive;
    // Prevent redirect if plan success modal is open (flag in localStorage)
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("showPlanSuccess") === "1"
    ) {
      return;
    }
    if (!account?.plan || planExpired || (isOnPaidPlan && !isActive)) {
      console.log("[DASHBOARD REDIRECT DEBUG]", {
        account,
        plan: account?.plan,
        isActive,
        planExpired,
        isOnPaidPlan,
      });
      router.replace("/dashboard/plan");
      return;
    }
    if (!business) {
      router.replace("/dashboard/create-business");
      return;
    }
  }, [user, account, business, router, isLoading]);

  useEffect(() => {
    // Debug log for account and pendingAccountUpdate
    console.log("Dashboard debug:", { account, pendingAccountUpdate });
  }, [account, pendingAccountUpdate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !user.id) return;
      const { data: pages } = await supabase
        .from("prompt_pages")
        .select("id")
        .eq("account_id", user.id);
      const pageIds = (pages || []).map((p: any) => p.id);
      if (!pageIds.length) return;
      const { data: reviews } = await supabase
        .from("review_submissions")
        .select("created_at, verified")
        .in("prompt_page_id", pageIds);
      const now = new Date();
      const isThisWeek = (date: Date) => {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0);
        return date >= firstDayOfWeek && date <= now;
      };
      const isThisMonth = (date: Date) =>
        date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      const isThisYear = (date: Date) => date.getFullYear() === now.getFullYear();
      let totalWeek = 0, totalMonth = 0, totalYear = 0;
      let verifiedWeek = 0, verifiedMonth = 0, verifiedYear = 0;
      (reviews || []).forEach((r: any) => {
        const d = new Date(r.created_at);
        if (isThisWeek(d)) totalWeek++;
        if (isThisMonth(d)) totalMonth++;
        if (isThisYear(d)) totalYear++;
        if (r.verified) {
          if (isThisWeek(d)) verifiedWeek++;
          if (isThisMonth(d)) verifiedMonth++;
          if (isThisYear(d)) verifiedYear++;
        }
      });
      setReviewStats({
        total: { week: totalWeek, month: totalMonth, year: totalYear },
        verified: { week: verifiedWeek, month: verifiedMonth, year: verifiedYear },
      });
    };
    fetchStats();
  }, [user, supabase]);

  const handleCreatePromptPageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (!business) {
      e.preventDefault();
      setShowProfileModal(true);
    }
  };

  const handleCopyLink = async () => {
    if (universalUrl) {
      try {
        await navigator.clipboard.writeText(universalUrl);
        alert("Copied!");
      } catch (err) {
        window.prompt("Copy this link:", universalUrl);
      }
    }
  };

  const handleSelectTier = async (tierKey: string) => {
    if (!account) return;
    setShowPricingModal(false);
    // Update the account plan in Supabase
    await supabase
      .from("accounts")
      .update({ plan: tierKey })
      .eq("id", account.id);
    // Optionally, refetch account or update state
    setAccount({ ...account, plan: tierKey });
  };

  const isDashboardReady =
    !!user && !!account && !isLoading && !pendingAccountUpdate;

  if (!isDashboardReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
    </PageCard>
  );
}
