"use client";

import React from "react";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { FaGlobe, FaLink, FaTimes, FaPalette, FaPlus } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import PageCard from "@/app/components/PageCard";
import UniversalPromptPageForm from "../dashboard/edit-prompt-page/universal/UniversalPromptPageForm";
import AppLoader from "@/app/components/AppLoader";
import QRCodeGenerator, { QR_FRAME_SIZES } from "../dashboard/components/QRCodeGenerator";
import dynamic from "next/dynamic";
import PromptPagesTable from "@/app/components/PromptPagesTable";
import PromptTypeSelectModal from "@/app/components/PromptTypeSelectModal";
import { FaHandsHelping, FaBoxOpen } from "react-icons/fa";
import { MdPhotoCamera, MdVideoLibrary, MdEvent } from "react-icons/md";
import { useRouter } from "next/navigation";

const StylePage = dynamic(() => import("../dashboard/style/StyleModalPage"), { ssr: false });

export default function PromptPages() {
  const [loading, setLoading] = useState(true);
  const [promptPages, setPromptPages] = useState<any[]>([]);
  const [universalPromptPage, setUniversalPromptPage] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [universalUrl, setUniversalUrl] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    url: string;
    clientName: string;
    logoUrl?: string;
  } | null>(null);
  const [selectedFrameSize, setSelectedFrameSize] = useState(QR_FRAME_SIZES[0]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<"draft" | "in_queue" | "in_progress" | "complete">("draft");
  const [sortField, setSortField] = useState<"first_name" | "last_name" | "review_type" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [error, setError] = useState<string | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (showStyleModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showStyleModal]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { data: businessProfile } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", user.id)
          .single();
        setBusiness(businessProfile);
        const { data: universalPage } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", user.id)
          .eq("is_universal", true)
          .single();
        setUniversalPromptPage(universalPage);
        if (universalPage?.slug) {
          setUniversalUrl(`${window.location.origin}/r/${universalPage.slug}`);
        }
        const { data: pages } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", user.id)
          .eq("is_universal", false)
          .order("created_at", { ascending: false });
        setPromptPages(pages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  const handleSort = (field: "first_name" | "last_name" | "review_type") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredPromptPages = promptPages.filter((page) => {
    if (selectedTab === "in_queue") return page.status === "in_queue";
    if (selectedTab === "in_progress") return page.status === "in_progress";
    if (selectedTab === "complete") return page.status === "complete";
    if (selectedTab === "draft") return page.status === "draft";
    return true;
  });

  const sortedPromptPages = [...filteredPromptPages].sort((a, b) => {
    if (!sortField) return 0;
    let aValue = (a[sortField] || "").toLowerCase();
    let bValue = (b[sortField] || "").toLowerCase();
    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handleCopyLink = async () => {
    if (universalUrl) {
      try {
        await navigator.clipboard.writeText(universalUrl);
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000);
      } catch (err) {
        window.prompt("Copy this link:", universalUrl);
      }
    }
  };

  const promptTypes = [
    {
      key: "service",
      label: "Service review",
      icon: <FaHandsHelping className="w-7 h-7 text-slate-blue" />,
      description: "Capture a review from a customer or client who loves what you do",
    },
    {
      key: "photo",
      label: "Photo + testimonial",
      icon: <MdPhotoCamera className="w-7 h-7 text-[#1A237E]" />,
      description: "Capture a headshot and testimonial to display on your website or in marketing materials.",
    },
    {
      key: "product",
      label: "Product review",
      icon: <FaBoxOpen className="w-7 h-7 text-slate-blue" />,
      description: "Get a review from a customer who fancies your products",
    },
    {
      key: "video",
      label: "Video testimonial",
      icon: <MdVideoLibrary className="w-7 h-7 text-[#1A237E]" />,
      description: "Request a video testimonial from your client.",
      comingSoon: true,
    },
    {
      key: "experience",
      label: "Experiences & spaces",
      icon: <MdEvent className="w-7 h-7 text-[#1A237E]" />,
      description: "For events, rentals, tours, and more.",
      comingSoon: true,
    },
  ];

  function handlePromptTypeSelect(typeKey: string) {
    setShowTypeModal(false);
    router.push(`/create-prompt-page?type=${typeKey}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return (
    <>
      <PromptTypeSelectModal
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelectType={handlePromptTypeSelect}
        promptTypes={promptTypes}
      />
      <div className="min-h-screen flex flex-col items-start px-4 sm:px-0">
        <PageCard icon={<span className="text-3xl font-bold align-middle text-slate-blue" style={{ fontFamily: 'Inter, sans-serif' }}>[P]</span>}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-blue mb-0">Prompt pages</h1>
                <p className="text-gray-600 text-base max-w-2xl mb-6">Create and manage your prompt pages and outreach efforts.</p>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button
                  type="button"
                  className="bg-blue-100 text-slate-blue rounded font-semibold px-4 py-2 hover:bg-blue-200 transition whitespace-nowrap flex items-center gap-2"
                  onClick={() => setShowStyleModal(true)}
                >
                  <FaPalette className="w-4 h-4" />
                  Style
                </button>
                <button
                  type="button"
                  className="bg-slate-blue text-white rounded font-semibold px-4 py-2 hover:bg-slate-blue/90 transition whitespace-nowrap flex items-center gap-2"
                  onClick={() => setShowTypeModal(true)}
                >
                  <FaPlus className="w-4 h-4" />
                  Create Prompt Page
                </button>
              </div>
            </div>
            {/* Universal Prompt Page Card (dashboard port) */}
            {universalPromptPage && (
              <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative my-8">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3">
                        <FaGlobe className="w-7 h-7 text-slate-blue" />
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
                  <p className="mt-2 text-blue-900 mb-2 text-sm">
                    Your Universal Prompt Page is general-use and not customer specific.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center mt-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                      >
                        <FaLink className="w-4 h-4" />
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
                        <MdDownload className="w-5 h-5" />
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
                          QR_FRAME_SIZES.find((s) => s.label === e.target.value) || QR_FRAME_SIZES[0],
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
          </div>
        </PageCard>
        <div className="w-full max-w-[1000px] mx-auto mt-0">
          {/* Prompt Pages Table (replica of dashboard) */}
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg mb-6">
            <PromptPagesTable
              promptPages={promptPages}
              business={business}
              account={business}
              universalUrl={universalUrl}
              onStatusUpdate={async (pageId, newStatus) => {
                await supabase.from("prompt_pages").update({ status: newStatus }).eq("id", pageId);
                setPromptPages((pages) =>
                  pages.map((page) =>
                    page.id === pageId ? { ...page, status: newStatus } : page
                  )
                );
              }}
              onDeletePages={async (pageIds) => {
                await supabase.from("prompt_pages").delete().in("id", pageIds);
                setPromptPages((pages) => pages.filter((page) => !pageIds.includes(page.id)));
              }}
              onCreatePromptPage={() => setShowTypeModal(true)}
            />
          </div>
        </div>
      </div>
      {/* Style Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative">
            {/* Close button */}
            <button
              className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-gray-100 focus:outline-none z-20"
              style={{ width: 40, height: 40 }}
              onClick={() => setShowStyleModal(false)}
              aria-label="Close style modal"
            >
              <FaTimes className="w-5 h-5 text-red-600" />
            </button>
            <StylePage />
          </div>
        </div>
      )}
    </>
  );
} 