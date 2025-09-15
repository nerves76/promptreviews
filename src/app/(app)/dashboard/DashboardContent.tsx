"use client";
import Link from "next/link";
import { RefObject, useState, useEffect, useMemo } from "react";
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import React from "react";

const supabase = createClient();
// Removed useAuthGuard - authentication is handled by dashboard layout with AuthContext
import Icon from "@/components/Icon";
import QRCodeModal from "../components/QRCodeModal";
import QuoteDisplay from "../components/QuoteDisplay";
import GettingStarted from "../components/GettingStarted";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/(app)/components/AppLoader";
import StarfallCelebration from "@/app/(app)/components/StarfallCelebration";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import BusinessLocationModal from "@/app/(app)/components/BusinessLocationModal";
import { BusinessLocation } from "@/types/business";
import { hasLocationAccess, formatLocationAddress, getLocationDisplayName } from "@/utils/locationUtils";
import EmojiEmbedButton from "@/app/(app)/components/EmojiEmbedButton";
import { promptTypes } from "@/config/promptTypes";

interface DashboardContentProps {
  userName: string;
  business: any;
  customPromptPages: any[];
  universalPromptPage: any;
  createPromptPageRef: RefObject<HTMLAnchorElement | null>;
  handleCreatePromptPageClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  showQR: boolean;
  handleCopyLink: () => void;
  copySuccess: string;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean) => void;
  handleCloseSuccessModal?: () => void;
  universalUrl: string;
  QRCode: any;
  setShowQR: (show: boolean) => void;
  account: any;
  successMessage?: string;
  parentLoading?: boolean;
  reviewStats: {
    total: { week: number; month: number; year: number };
    verified: { week: number; month: number; year: number };
  };
  // GettingStarted props
  hasBusiness: boolean;
  hasCustomPromptPages: boolean;
  hasUniversalPromptPage: boolean;
  accountId?: string;
  setShowStarfallCelebration?: (show: boolean) => void;
  paymentChangeType?: string | null;
}

interface PromptPage {
  id: string;
  slug: string;
  status: "in_queue" | "in_progress" | "complete" | "draft";
  created_at: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_universal: boolean;
  review_type?: string;
  nfc_text_enabled?: boolean;
}

const STATUS_COLORS = {
  in_queue: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  complete: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS = {
  in_queue: "In queue",
  in_progress: "In progress",
  complete: "Complete",
  draft: "Draft",
};

const DashboardContent = React.memo(function DashboardContent({
  userName,
  business,
  customPromptPages,
  universalPromptPage,
  createPromptPageRef,
  handleCreatePromptPageClick,
  showQR,
  handleCopyLink,
  copySuccess,
  showProfileModal,
  setShowProfileModal,
  showSuccessModal,
  setShowSuccessModal,
  handleCloseSuccessModal,
  universalUrl,
  QRCode,
  setShowQR,
  account,
  parentLoading,
  reviewStats,
  hasBusiness,
  hasCustomPromptPages,
  hasUniversalPromptPage,
  accountId,
  setShowStarfallCelebration,
  paymentChangeType,
}: DashboardContentProps) {
  // Note: Authentication is handled by the dashboard layout
  const router = useRouter();
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "in_queue" | "in_progress" | "complete" | "draft"
  >("draft");
  const [sortField, setSortField] = useState<
    "first_name" | "last_name" | "review_type" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [batchStatus, setBatchStatus] = useState<
    "in_queue" | "in_progress" | "complete" | "draft"
  >("in_queue");
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    url: string;
    clientName: string;
    logoUrl?: string;
    showNfcText?: boolean;
  } | null>(null);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [postSaveData, setPostSaveData] = useState<{
    url: string;
    phone?: string;
    email?: string;
    first_name?: string;
  } | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [copyLinkId, setCopyLinkId] = useState<string | null>(null);
  const [showStars, setShowStars] = useState(false);

  // Using singleton Supabase client from supabaseClient.ts



  function handlePromptTypeSelect(typeKey: string) {
    if (
      (isGrower &&
        account &&
        account.custom_prompt_page_count >= maxGrowerPages) ||
      (isBuilder &&
        account &&
        account.custom_prompt_page_count >= maxBuilderPages)
    ) {
      router.push('/dashboard/plan');
      return;
    }
    setShowTypeModal(false);
    router.push(`/create-prompt-page?type=${typeKey}`);
  }

  useEffect(() => {
    const fetchPromptPages = async () => {
      try {
        // Only fetch if we have an account
        if (!account?.id) {
          return;
        }

        // Log environment variables (without exposing the actual values)

        if (
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ) {
          throw new Error("Supabase environment variables are not configured");
        }

        // Test Supabase connection
        const { data: testData, error: testError } = await supabase
          .from("prompt_pages")
          .select("count")
          .limit(1);

        if (testError) {
          console.error("Supabase connection test failed:", testError);
          throw new Error(`Database connection failed: ${testError.message}`);
        }


        // Fetch prompt pages for the current account
        const { data, error } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", account.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching prompt pages:", error);
          throw new Error(`Failed to fetch prompt pages: ${error.message}`);
        }

        setPromptPages(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading prompt pages:", error);
        setError(error instanceof Error ? error.message : "Unknown error occurred");
        setLoading(false);
      }
    };

    fetchPromptPages();
  }, [account?.id]); // Only depend on account.id

  useEffect(() => {
    const flag = localStorage.getItem("showPostSaveModal");
    if (flag) {
      try {
        const data = JSON.parse(flag);
        setPostSaveData(data);
        setShowPostSaveModal(true);
        // Trigger starfall celebration automatically when modal appears
        setShowStars(true);
        // Also trigger global starfall celebration
        setShowStarfallCelebration?.(true);
        localStorage.removeItem("showPostSaveModal");
      } catch {}
    }
  }, []); // Empty dependency array since this should only run once on mount

  // Note: Modal stays open so users can access sharing options
  // Stars fall automatically when modal appears, but modal remains open

  const starProps = useMemo(() => {
    if (!showPostSaveModal) return [];
    return Array.from({ length: 60 }).map(() => {
      const left = Math.random() * 98 + Math.random() * 2;
      const top = -40 - Math.random() * 360;
      const fontSize = 32 + Math.random() * 8;
      const animationDuration = 4 + Math.random() * 2;
      const animationDelay = Math.random() * 0.5;
      return {
        left: `${left}%`,
        top: `${top}px`,
        fontSize: `${fontSize}px`,
        color: "#FFD700",
        opacity: 1,
        animationDuration: `${animationDuration}s`,
        animationDelay: `${animationDelay}s`,
      };
    });
  }, [showPostSaveModal]);

  const updateStatus = async (
    pageId: string,
    newStatus: "in_queue" | "in_progress" | "complete" | "draft",
  ) => {
    try {
      const { error } = await supabase
        .from("prompt_pages")
        .update({ status: newStatus })
        .eq("id", pageId);

      if (error) throw error;

      setPromptPages((pages) =>
        pages.map((page) =>
          page.id === pageId ? { ...page, status: newStatus } : page,
        ),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status";
      console.error("Error updating status:", {
        message: errorMessage,
        error: err,
      });
      setError(errorMessage);
    }
  };

  const filteredPromptPages = promptPages.filter((page) => {
    if (page.is_universal) return false;
    if (selectedType && page.review_type !== selectedType) return false;
    if (selectedTab === "in_queue") return page.status === "in_queue";
    if (selectedTab === "in_progress") return page.status === "in_progress";
    if (selectedTab === "complete") return page.status === "complete";
    if (selectedTab === "draft") return page.status === "draft";
    return true;
  });

  const inQueueCount = promptPages.filter(
    (page) => page.status === "in_queue" && !page.is_universal,
  ).length;
  const inProgressCount = promptPages.filter(
    (page) => page.status === "in_progress" && !page.is_universal,
  ).length;
  const completeCount = promptPages.filter(
    (page) => page.status === "complete" && !page.is_universal,
  ).length;
  const draftCount = promptPages.filter(
    (page) => page.status === "draft" && !page.is_universal,
  ).length;

  const handleSort = (field: "first_name" | "last_name" | "review_type") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedPromptPages = [...filteredPromptPages].sort((a, b) => {
    if (!sortField) return 0;
    let aValue = "";
    let bValue = "";
    if (sortField === "review_type") {
      aValue = (a.review_type || "").toLowerCase();
      bValue = (b.review_type || "").toLowerCase();
    } else {
      aValue = (a[sortField] || "").toLowerCase();
      bValue = (b[sortField] || "").toLowerCase();
    }
    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPages(filteredPromptPages.map((page) => page.id));
    } else {
      setSelectedPages([]);
    }
  };

  const handleSelectPage = (pageId: string, checked: boolean) => {
    if (checked) {
      setSelectedPages([...selectedPages, pageId]);
    } else {
      setSelectedPages(selectedPages.filter((id) => id !== pageId));
    }
  };

  const handleBatchStatusUpdate = async () => {
    try {
      const { error } = await supabase
        .from("prompt_pages")
        .update({ status: batchStatus })
        .in("id", selectedPages);

      if (error) throw error;

      setPromptPages((pages) =>
        pages.map((page) =>
          selectedPages.includes(page.id)
            ? { ...page, status: batchStatus }
            : page,
        ),
      );
      setSelectedPages([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status";
      console.error("Error updating status:", {
        message: errorMessage,
        error: err,
      });
      setError(errorMessage);
    }
  };

  const handleBatchDelete = async () => {
    if (deleteConfirmation !== "DELETE") return;

    try {
      const { error } = await supabase
        .from("prompt_pages")
        .delete()
        .in("id", selectedPages);

      if (error) throw error;

      setPromptPages((pages) =>
        pages.filter((page) => !selectedPages.includes(page.id)),
      );
      setSelectedPages([]);
      setShowDeleteModal(false);
      setDeleteConfirmation("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete pages";
      console.error("Error deleting pages:", {
        message: errorMessage,
        error: err,
      });
      setError(errorMessage);
    }
  };

  // Soft lock for plan-based limits
  const isGrower = account?.plan === "grower";
  const isBuilder = account?.plan === "builder";
  const isMaven = account?.plan === "maven";
  
  // Use proper plan limits from accountLimits.ts
  const maxGrowerPages = 4;
  const maxBuilderPages = 100;
  const maxMavenPages = 500;
  
  const accessiblePromptPages = isGrower
    ? sortedPromptPages.slice(0, maxGrowerPages)
    : isBuilder
      ? sortedPromptPages.slice(0, maxBuilderPages)
      : isMaven
        ? sortedPromptPages.slice(0, maxMavenPages)
        : sortedPromptPages; // No limit for other plans or unlimited access
  const lockedPromptPages = isGrower
    ? sortedPromptPages.slice(maxGrowerPages)
    : isBuilder
      ? sortedPromptPages.slice(maxBuilderPages)
      : isMaven
        ? sortedPromptPages.slice(maxMavenPages)
        : [];

  if (isLoading && !parentLoading) {
    return <AppLoader variant="compact" />;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 w-full gap-2 relative">
        <h1 className="text-4xl font-bold flex items-center gap-3 text-slate-blue pt-2">
          Dashboard
        </h1>
      </div>
      {/* Existing welcome section (standard design) */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-blue">
          Welcome, {userName}!
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-[650px]">
          Put the kettle on! Let's chat with some customers and get some
          reviews to grow your business.
        </p>
      </div>

      {/* Getting Started Checklist */}
      <div className="mb-8">
        <GettingStarted 
          hasBusiness={hasBusiness}
          hasCustomPromptPages={hasCustomPromptPages}
          hasUniversalPromptPage={hasUniversalPromptPage}
          onComplete={() => {
            // Optional: Handle completion if needed
          }}
          accountId={accountId}
        />
      </div>

      {/* Review Stats Section (standard section style) */}
      <div className="mb-8">
        <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex flex-col md:flex-row items-center gap-8 shadow">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="MdBarChart" className="w-6 h-6 text-slate-blue" size={24} />
              <h3 className="text-xl font-bold text-slate-blue mr-4">Review stats</h3>
              <Link href="/dashboard/analytics" className="text-slate-blue underline text-base font-medium hover:text-indigo-800 transition ml-auto">
                View more stats
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-indigo-50 rounded-lg p-6 flex flex-col items-center w-full">
                <p className="text-lg font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                  Total reviews
                  <span className="relative group">
                    <Icon name="FaQuestionCircle" className="w-4 h-4 text-slate-blue cursor-pointer" size={16} />
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 p-3 bg-white border border-gray-200 rounded shadow text-xs text-gray-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                      These numbers reflect how many users clicked "copy & submit" on your prompt pages and, presumably, submitted a review.
                      <br /><br />
                      Note: It may take anywhere from a few hours to a week or more for a review site to approve and publish a review. Google usually publishes within 48 hours if the review is not flagged. Some reviews may get denied. Users with low review histories are usually more susceptible to this.
                    </span>
                  </span>
                </p>
                <div className="flex gap-6 text-4xl font-extrabold text-slate-blue">
                  <div className="flex flex-col items-center">
                    <span>{reviewStats.total.week}</span>
                    <span className="text-xs text-gray-500 mt-1">This week</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>{reviewStats.total.month}</span>
                    <span className="text-xs text-gray-500 mt-1">This month</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>{reviewStats.total.year}</span>
                    <span className="text-xs text-gray-500 mt-1">This year</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center w-full">
                <p className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-1">
                  Reviews verified
                  <span className="relative group">
                    <Icon name="FaQuestionCircle" className="w-4 h-4 text-green-700 cursor-pointer" size={16} />
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                      Number of reviews you have marked as verified. Week/month/year are based on the review verification date.
                    </span>
                  </span>
                </p>
                <div className="flex gap-6 text-4xl font-extrabold text-green-700">
                  <div className="flex flex-col items-center">
                    <span>{reviewStats.verified.week}</span>
                    <span className="text-xs text-gray-500 mt-1">This week</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>{reviewStats.verified.month}</span>
                    <span className="text-xs text-gray-500 mt-1">This month</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>{reviewStats.verified.year}</span>
                    <span className="text-xs text-gray-500 mt-1">This year</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center items-start w-full">
        <div className="relative w-full">
          {/* Main dashboard content, remove pt-12 so title is at the top */}
          <div>
            <div className="mt-2 space-y-8">
              {/* Universal Prompt Page Card */}
              {universalPromptPage && (
                <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3">
                          <Icon name="FaGlobe" className="w-7 h-7 text-slate-blue" size={28} />
                          Universal prompt page
                        </h2>
                        <UniversalTooltip />
                      </div>
                      <div className="flex gap-4 items-center">
                        <Link
                          href={`/r/${universalPromptPage.slug}`}
                          className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                        >
                          View
                        </Link>
                        {universalPromptPage?.slug && (
                          <Link
                            href={"/dashboard/edit-prompt-page/universal"}
                            className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                    <p className="mt-4 text-blue-900 mb-4 text-sm">
                      Your Universal Prompt Page is your general-use Prompt Page that can be shared with one or many.
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                        >
                          <Icon name="FaLink" className="w-4 h-4" style={{ color: "#1A237E" }} size={16} />
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQrModal({
                              open: true,
                              url: universalUrl,
                              clientName: business?.name || "PromptReviews",
                              logoUrl: business?.logo_print_url || business?.logo_url,
                              showNfcText: universalPromptPage?.nfc_text_enabled ?? false,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                        >
                          <Icon name="MdDownload" size={22} color="#b45309" />
                          QR code
                        </button>
                        
                        {/* Emoji Embed Button - only show when sentiment flow is enabled */}
                        {universalPromptPage?.emoji_sentiment_enabled && universalPromptPage?.slug && (
                          <EmojiEmbedButton slug={universalPromptPage.slug} />
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            const businessName = business?.name || "your business";
                            const reviewUrl = universalUrl;
                            const message = `Hi! I'd love to get your feedback on ${businessName}. Please leave a review here: ${reviewUrl}`;
                            window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                        >
                          Send SMS
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const businessName = business?.name || "your business";
                            const reviewUrl = universalUrl;
                            const subject = "Please leave a review";
                            const message = `Hi,\n\nI'd love to get your feedback on ${businessName}. Please leave a review here: ${reviewUrl}\n\nThank you!`;
                            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                        >
                          Send Email
                        </button>

                        {copySuccess && (
                          <span className="ml-2 text-green-600 text-xs font-semibold">
                            {copySuccess}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
      {/* Game Card */}
      <div className="mb-8 mt-8">
        <div className="rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Get Found Online: The Game</h3>
                <p className="text-sm text-slate-600">Take a break and play!</p>
              </div>
            </div>
            <Link
              href="/game"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              <span>Play Game</span>
              <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-slate-700">Convert angry customers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-slate-700">Collect power-ups</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-700">Defeat Boss Karen</span>
            </div>
          </div>
        </div>
      </div>

          {/* QR Code Download Modal */}
          <QRCodeModal
            isOpen={qrModal?.open || false}
            onClose={() => setQrModal(null)}
            url={qrModal?.url || ""}
            clientName={qrModal?.clientName || ""}
            logoUrl={qrModal?.logoUrl}
            showNfcText={qrModal?.showNfcText}
          />

          {/* Profile Modal */}
          {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <h2 className="text-xl font-bold mb-4">
                  Let's Get Your Business More Reviews!
                </h2>
                <p className="mb-6">
                  First we need to set up your business profile.
                </p>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    window.location.href = "/dashboard/create-business";
                  }}
                  className="bg-slate-blue text-white px-4 py-2 rounded hover:bg-slate-blue/90"
                >
                  Go to Business Profile
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="ml-4 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success Modal for Payment Confirmation */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
                <button
                  onClick={handleCloseSuccessModal || (() => setShowSuccessModal(false))}
                  className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
                  style={{ width: 48, height: 48 }}
                  aria-label="Close modal"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {paymentChangeType === "downgrade" || paymentChangeType === "billing_update" ? (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 relative z-10">
                      {paymentChangeType === "billing_update" ? "Billing Updated" : "Plan Updated"}
                    </h2>
                    <p className="mb-6 text-lg text-gray-700 relative z-10">
                      {paymentChangeType === "billing_update" 
                        ? "Your billing settings have been updated successfully. Any changes to your subscription are now active."
                        : `Your plan has been updated to ${
                            account?.plan
                              ? account.plan.charAt(0).toUpperCase() + account.plan.slice(1)
                              : "your new plan"
                          }.`
                      }
                    </p>
                                         <button
                       onClick={handleCloseSuccessModal || (() => setShowSuccessModal(false))}
                       className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 font-semibold mt-2 relative z-10"
                     >
                       Continue
                     </button>
                  </>
                ) : (
                  <>
                    {/* Crompty Image */}
                    <div className="mb-3 flex justify-center">
                      <img
                        src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/small-prompty-success.png"
                        alt="Crompty Success"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-blue relative z-10">
                      It's official!
                    </h2>
                    <p className="mb-6 text-lg text-gray-700 font-semibold relative z-10">
                      You're a{" "}
                      {account?.plan
                        ? account.plan.charAt(0).toUpperCase() +
                          account.plan.slice(1)
                        : "Member"}
                      .<br />
                      Now let's get some amazing reviews and boost your online
                      presence!
                    </p>
                    <button
                      onClick={handleCloseSuccessModal || (() => setShowSuccessModal(false))}
                      className="bg-slate-blue text-white px-6 py-2 rounded hover:bg-slate-blue/90 font-semibold mt-2 relative z-10"
                    >
                      Let's do this!
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4 text-red-600">
                  Delete Prompt Pages
                </h3>
                <p className="mb-4 text-gray-600">
                  You are about to delete {selectedPages.length} prompt page
                  {selectedPages.length !== 1 ? "s" : ""}. This action cannot be
                  undone.
                </p>
                <p className="mb-4 text-gray-600">
                  Please type DELETE in the box below to continue.
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                  placeholder="Type DELETE to confirm"
                />
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmation("");
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={deleteConfirmation !== "DELETE"}
                    className={`px-4 py-2 rounded ${
                      deleteConfirmation === "DELETE"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Type Selection Modal */}
          {showTypeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setShowTypeModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold text-slate-blue mb-6">
                  Select prompt page type
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {promptTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() =>
                        !type.comingSoon && handlePromptTypeSelect(type.key)
                      }
                      className={`flex flex-col items-center gap-2 p-6 rounded-lg border border-gray-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all bg-gray-50 hover:bg-indigo-50 focus:outline-none ${type.comingSoon ? "opacity-60 cursor-not-allowed relative" : ""}`}
                      disabled={!!type.comingSoon}
                      tabIndex={type.comingSoon ? -1 : 0}
                    >
                      {type.icon}
                      <span className="font-semibold text-lg text-slate-blue">
                        {type.label}
                      </span>
                      <span className="text-sm text-gray-600 text-center">
                        {type.description}
                      </span>
                      {type.comingSoon && (
                        <span className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
                          Coming soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Post-save share modal with star fall animation */}
          {showPostSaveModal && postSaveData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              {/* Star Falling Animation - always visible when modal is shown */}
              {showStars && starProps.map((props, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: props.left,
                    top: props.top,
                    pointerEvents: "none",
                    zIndex: 50,
                  }}
                >
                  <span
                    className="absolute animate-fall"
                    style={{
                      color: props.color,
                      fontSize: props.fontSize,
                      left: 0,
                      top: 0,
                      animationDuration: props.animationDuration,
                      animationDelay: props.animationDelay,
                    }}
                  >
                    ★
                  </span>
                </span>
              ))}
              {/* Modal content - always visible */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl shadow-2xl max-w-md w-full text-center relative z-10 border border-white/20 backdrop-blur-sm">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-t-2xl p-6">
                  <h2 className="text-2xl font-bold text-white">
                    Prompt Page Published! 🎉
                  </h2>
                </div>
                
                {/* Content */}
                <div className="p-8">
                {/* Glassmorphic close button */}
                <button
                  onClick={() => {
                    setShowPostSaveModal(false);
                    setShowStars(false);
                  }}
                  className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
                  style={{ width: 36, height: 36 }}
                  aria-label="Close modal"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 mb-6">
                    {/* Prompty Success Image */}
                    <div className="mb-6 flex justify-center">
                      <img
                        src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/small-prompty-success.png"
                        alt="Prompty Success"
                        className="w-24 h-24 object-contain"
                      />
                    </div>

                    <p className="mb-4 text-gray-700">
                      Your prompt page is now live and ready to collect reviews.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 mb-6">
                  <a
                    href={postSaveData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition"
                  >
                    Open
                  </a>
                  {postSaveData.phone && (
                    <button
                      className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                      onClick={() => {
                        const name = postSaveData.first_name || "[name]";
                        const businessName = business?.name || "[Business]";
                        const reviewUrl = `${window.location.origin}${postSaveData.url}`;
                        const message = `Hi ${name}, do you have 1-3 minutes to leave a review for ${businessName}? I have a review you can use and everything. Positive reviews really help small business get found online. Thanks so much! ${reviewUrl}`;
                        window.location.href = `sms:${postSaveData.phone}?&body=${encodeURIComponent(message)}`;
                      }}
                    >
                      Send SMS
                    </button>
                  )}
                  {postSaveData.email && (
                    <a
                      href={`mailto:${postSaveData.email}?subject=${encodeURIComponent("Quick Review Request")}&body=${encodeURIComponent(`Hi ${postSaveData.first_name || "[name]"}, do you have 1-3 minutes to leave a review for ${business?.name || "[Business]"}? I have a review you can use and everything. Positive reviews really help small business get found online. Thanks so much! ${window.location.origin}${postSaveData.url}`)}`}
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Send Email
                    </a>
                  )}
                </div>
                  <button
                    onClick={() => {
                      setShowPostSaveModal(false);
                      setShowStars(false);
                    }}
                    className="bg-slate-blue text-white px-6 py-2 rounded hover:bg-slate-blue/90 font-semibold mt-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

function UniversalTooltip() {
  const [show, setShow] = useState(false);
  
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show Universal Prompt Page info"
        className="text-slate-blue hover:text-indigo-600 focus:outline-none"
        onClick={() => setShow((v) => !v)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <Icon 
          name="FaQuestionCircle"
          className="inline-block w-4 h-4 align-middle cursor-pointer"
          size={16}
        />
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-80 p-3 bg-white border border-gray-200 rounded shadow text-sm text-gray-700">
          Your Universal Prompt Page is a great choice for a QR code featured at your front desk or on tables at your restaurant or even a business card or lanyard. You could also feature it in a newsletter or an auto-reply (For best results, we highly recommend reaching out personally for reviews.) To avoid duplicate or similar reviews, Universal Prompt Pages don't allow pre-written reviews, but users can use Prompty AI to get an optimized review template.
        </div>
      )}
    </span>
  );
}

export default DashboardContent;
