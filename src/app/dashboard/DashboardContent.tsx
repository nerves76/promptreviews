"use client";
import Link from "next/link";
import { RefObject, useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthGuard } from "@/utils/authGuard";
import {
  FaGlobe,
  FaHome,
  FaBuilding,
  FaHistory,
  FaBolt,
  FaRegComment,
  FaLink,
  FaHandsHelping,
  FaBoxOpen,
  FaChartBar,
  FaQuestionCircle,
  FaPalette,
} from "react-icons/fa";
import {
  MdDownload,
  MdEvent,
  MdVideoLibrary,
  MdPhotoCamera,
} from "react-icons/md";
import { getUserOrMock } from "@/utils/supabase";
import QRCodeGenerator, { QR_FRAME_SIZES } from "./components/QRCodeGenerator";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/components/AppLoader";
import React from "react";

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

export default function DashboardContent({
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
  universalUrl,
  QRCode,
  setShowQR,
  account,
  parentLoading,
  reviewStats,
}: DashboardContentProps) {
  console.log("DASHBOARD RENDERED");
  useAuthGuard();
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  } | null>(null);
  const [selectedFrameSize, setSelectedFrameSize] = useState(QR_FRAME_SIZES[0]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [copyLinkId, setCopyLinkId] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [postSaveData, setPostSaveData] = useState<{
    url: string;
    phone?: string;
    email?: string;
    first_name?: string;
  } | null>(null);
  const [showStars, setShowStars] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const promptTypes = [
    {
      key: "service",
      label: "Service review",
      icon: <FaHandsHelping size={28} color="#1A237E" />,
      description:
        "Capture a review from a customer or client who loves what you do",
    },
    {
      key: "photo",
      label: "Photo + testimonial",
      icon: <MdPhotoCamera size={28} color="#1A237E" />,
      description:
        "Capture a headshot and testimonial to display on your website or in marketing materials.",
    },
    {
      key: "product",
      label: "Product review",
      icon: <FaBoxOpen size={28} color="#1A237E" />,
      description: "Get a review from a customer who fancies your products",
    },
    {
      key: "video",
      label: "Video testimonial",
      icon: <MdVideoLibrary size={28} color="#1A237E" />,
      description: "Request a video testimonial from your client.",
      comingSoon: true,
    },
    {
      key: "experience",
      label: "Experiences & spaces",
      icon: <MdEvent size={28} color="#1A237E" />,
      description: "For events, rentals, tours, and more.",
      comingSoon: true,
    },
  ];

  function handlePromptTypeSelect(typeKey: string) {
    if (
      (isGrower &&
        account &&
        account.custom_prompt_page_count >= maxGrowerPages) ||
      (isBuilder &&
        account &&
        account.custom_prompt_page_count >= maxBuilderPages)
    ) {
      setShowLimitModal(true);
      return;
    }
    setShowTypeModal(false);
    router.push(`/create-prompt-page?type=${typeKey}`);
  }

  useEffect(() => {
    const fetchPromptPages = async () => {
      try {
        // Log environment variables (without exposing the actual values)
        console.log("Environment check:", {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        });

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
        console.log("Supabase connection test:", { testData, testError });

        const {
          data: { user },
          error: userError,
        } = await getUserOrMock(supabase);
        console.log("Auth check:", {
          hasUser: !!user,
          userId: user?.id,
          userError: userError || null,
        });

        if (userError) {
          console.error("Auth error:", userError);
          throw new Error("Authentication error");
        }

        if (!user) {
          setError("You must be signed in to view prompt pages");
          return;
        }

        console.log("Fetching prompt pages for user:", user.id);

        // Try a simpler query first
        const { data, error } = await supabase
          .from("prompt_pages")
          .select(
            "id, slug, status, created_at, phone, email, first_name, last_name, is_universal, review_type",
          )
          .eq("account_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase query error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }

        if (!data) {
          console.log("No data returned from query");
          setPromptPages([]);
          return;
        }

        console.log("Fetched prompt pages:", data);
        setPromptPages(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load prompt pages";
        setError(errorMessage);
        console.error("Error loading prompt pages:", {
          message: errorMessage,
          error: err,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "not set",
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? "set"
            : "not set",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromptPages();
  }, [supabase]);

  useEffect(() => {
    const flag = localStorage.getItem("showPostSaveModal");
    if (flag) {
      try {
        const data = JSON.parse(flag);
        setPostSaveData(data);
        setShowPostSaveModal(true);
        localStorage.removeItem("showPostSaveModal");
      } catch {}
    }
  }, []);

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

  // Soft lock for Grower plan: only allow access to first 4 prompt pages
  const isGrower = account?.plan === "grower";
  const isBuilder = account?.plan === "builder";
  const maxGrowerPages = 4;
  const maxBuilderPages = 100;
  const accessiblePromptPages = isGrower
    ? sortedPromptPages.slice(0, maxGrowerPages)
    : isBuilder
      ? sortedPromptPages.slice(0, maxBuilderPages)
      : sortedPromptPages;
  const lockedPromptPages = isGrower
    ? sortedPromptPages.slice(maxGrowerPages)
    : isBuilder
      ? sortedPromptPages.slice(maxBuilderPages)
      : [];

  if (isLoading && !parentLoading) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 w-full gap-2 relative">
        <div className="absolute z-10" style={{ left: "-69px", top: "-37px" }}>
          <div className="rounded-full bg-white w-16 h-16 flex items-center justify-center shadow-lg">
            <FaHome className="w-8 h-8 text-slate-blue" />
          </div>
        </div>
        <h1 className="text-4xl font-bold flex items-center gap-3 text-slate-blue pl-1.5 pt-2">
          Dashboard
        </h1>
      </div>
      {/* Existing welcome section (standard design) */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-slate-blue">
          Welcome, {userName}!
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-[650px]">
          Put the kettle on! Let's chat with some customers and get some
          reviews to grow your business.
        </p>
      </div>
      {/* Review Stats Section (standard section style) */}
      <div className="mb-16">
        <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex flex-col md:flex-row items-center gap-8 shadow">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-4">
              <FaChartBar className="w-6 h-6 text-slate-blue" />
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
                    <FaQuestionCircle className="w-4 h-4 text-slate-blue cursor-pointer" />
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                      Total number of reviews submitted for your prompt pages. Week/month/year are based on the review submission date.
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
                    <FaQuestionCircle className="w-4 h-4 text-green-700 cursor-pointer" />
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
      <div className="min-h-screen flex justify-center items-start w-full">
        <div className="relative w-full">
          {/* Main dashboard content, remove pt-12 so title is at the top */}
          <div>
            <div className="mt-2 space-y-4">
              {/* Universal Prompt Page Card */}
              {universalPromptPage && (
                <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative mb-16">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3">
                          <FaGlobe size={28} color="#1A237E" />
                          Universal Prompt Page
                        </h2>
                      </div>
                      <div className="flex gap-4 items-center">
                        <Link
                          href={`/r/${universalPromptPage.slug}`}
                          className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                        >
                          View
                        </Link>
                        <Link
                          href={"/dashboard/edit-prompt-page/universal"}
                          className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                    <p className="mt-2 text-blue-900 mb-2 text-sm">
                      Your Universal Prompt Page is general-use and not customer
                      specific. The reviews are not prewritten but there is an
                      AI button that will generate a unique review instantly
                      based on your business profile. Your customers/clients can
                      edit before they post. Print your QR code, frame it, and
                      hang it in your place of business for a super-easy way to
                      get customers/clients to post a review. Add the QR code to
                      business cards, menus, flyers, etc.
                    </p>
                    <div className="flex flex-wrap gap-2 items-center mt-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                        >
                          <FaLink size={20} color="#1A237E" />
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQrModal({
                              open: true,
                              url: universalUrl,
                              clientName: business?.name || "PromptReviews",
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-blue text-white rounded hover:bg-slate-blue/90 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                        >
                          <MdDownload size={22} color="#fff" />
                          QR code
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

          {/* QR Code Download Modal */}
          {qrModal?.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setQrModal(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-lg font-bold mb-4 text-indigo-900">
                  Download QR Code
                </h3>
                <div className="mb-4">
                  <label
                    htmlFor="frame-size"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select frame size
                  </label>
                  <select
                    id="frame-size"
                    value={selectedFrameSize.label}
                    onChange={(e) =>
                      setSelectedFrameSize(
                        QR_FRAME_SIZES.find(
                          (s) => s.label === e.target.value,
                        ) || QR_FRAME_SIZES[0],
                      )
                    }
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {QR_FRAME_SIZES.map((size) => (
                      <option key={size.label} value={size.label}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
                <QRCodeGenerator
                  url={qrModal.url}
                  clientName={qrModal.clientName}
                  frameSize={selectedFrameSize}
                />
                <div className="mt-6 flex flex-col gap-2">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-paleGold hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    style={{ background: "#FFD700", color: "#1A237E" }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buy Frame/Display
                  </a>
                </div>
              </div>
            </div>
          )}

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
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
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
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative overflow-hidden">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setShowSuccessModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold mb-4 text-indigo-800 relative z-10">
                  It's official.
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
                  onClick={() => setShowSuccessModal(false)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-semibold mt-2 relative z-10"
                >
                  Let's Go!
                </button>
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

          {/* Prompt page limit exceeded modal */}
          {showLimitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowLimitModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold text-slate-blue mb-2">
                  Prompt page limit exceeded
                </h2>
                <p className="mb-6 text-gray-700">
                  You have reached the maximum number of prompt pages for your
                  plan. Upgrade to create more.
                </p>
                <a
                  href="/dashboard/plan"
                  className="inline-block px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition"
                >
                  Upgrade Plan
                </a>
              </div>
            </div>
          )}

          {/* Post-save share modal with star fall animation */}
          {showPostSaveModal && postSaveData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              {/* Star Falling Animation - behind modal, only after button click */}
              {showStars && (
                <div className="absolute inset-0 pointer-events-none z-0">
                  {starProps.map((props, i) => (
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
                </div>
              )}
              {/* Modal content above animation */}
              {!showStars && (
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative z-10 overflow-hidden">
                  <button
                    className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-white text-red-500 border border-red-200 shadow hover:bg-red-500 hover:text-white transition-colors text-xl z-20"
                    onClick={() => {
                      setShowStars(true);
                      setTimeout(() => {
                        setShowPostSaveModal(false);
                        setShowStars(false);
                      }, 6000);
                    }}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <h2 className="text-2xl font-bold mb-4 text-indigo-800 relative z-10">
                    Prompt Page Created!
                  </h2>
                  <p className="mb-4 text-gray-700 relative z-10">
                    Share your new prompt page with your customer:
                  </p>
                  <div className="flex flex-col gap-3 mb-6 relative z-10">
                    <a
                      href={postSaveData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition"
                    >
                      View Prompt Page
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
                      setShowStars(true);
                      setTimeout(() => {
                        setShowPostSaveModal(false);
                        setShowStars(false);
                      }, 6000);
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 font-semibold mt-2 relative z-10"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
