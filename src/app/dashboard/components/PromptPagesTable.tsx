import React, { useState } from "react";
import Link from "next/link";
import { FaLink, FaGlobe } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import QRCodeModal from "../../components/QRCodeModal";

export interface PromptPage {
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

interface PromptPagesTableProps {
  promptPages: PromptPage[];
  business: any;
  account: any;
  universalUrl: string;
  onStatusUpdate: (pageId: string, newStatus: PromptPage["status"]) => void;
  onDeletePages: (pageIds: string[]) => void;
  onCreatePromptPage?: () => void;
}

const STATUS_COLORS = {
  in_queue: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  complete: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-800",
};

export default function PromptPagesTable({
  promptPages,
  business,
  account,
  universalUrl,
  onStatusUpdate,
  onDeletePages,
  onCreatePromptPage,
}: PromptPagesTableProps) {
  // Table state
  const [selectedType, setSelectedType] = useState("");
  const [selectedTab, setSelectedTab] = useState<"draft" | "in_queue" | "in_progress" | "complete">("draft");
  const [sortField, setSortField] = useState<"first_name" | "last_name" | "review_type" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<PromptPage["status"]>("in_queue");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [qrModal, setQrModal] = useState<{ open: boolean; url: string; clientName: string; logoUrl?: string } | null>(null);
  const [copyLinkId, setCopyLinkId] = useState<string | null>(null);

  // Filtering and sorting
  const filteredPromptPages = promptPages.filter((page) => {
    if (page.is_universal) return false;
    if (selectedType && page.review_type !== selectedType) return false;
    if (selectedTab === "in_queue") return page.status === "in_queue";
    if (selectedTab === "in_progress") return page.status === "in_progress";
    if (selectedTab === "complete") return page.status === "complete";
    if (selectedTab === "draft") return page.status === "draft";
    return true;
  });

  const inQueueCount = promptPages.filter((p) => p.status === "in_queue" && !p.is_universal).length;
  const inProgressCount = promptPages.filter((p) => p.status === "in_progress" && !p.is_universal).length;
  const completeCount = promptPages.filter((p) => p.status === "complete" && !p.is_universal).length;
  const draftCount = promptPages.filter((p) => p.status === "draft" && !p.is_universal).length;

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
    let aValue = (a[sortField] || "").toLowerCase();
    let bValue = (b[sortField] || "").toLowerCase();
    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Selection
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

  // Batch actions
  const handleBatchStatusUpdate = () => {
    selectedPages.forEach((id) => onStatusUpdate(id, batchStatus));
    setSelectedPages([]);
  };
  const handleBatchDelete = () => {
    if (deleteConfirmation !== "DELETE") return;
    onDeletePages(selectedPages);
    setSelectedPages([]);
    setShowDeleteModal(false);
    setDeleteConfirmation("");
  };

  // Plan lock logic
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <button
            className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors
              ${selectedTab === "draft"
                ? "border-slate-blue bg-white text-slate-blue shadow-sm z-10"
                : "border-transparent bg-slate-blue text-white hover:bg-slate-blue/90"}
            `}
            onClick={() => setSelectedTab("draft")}
          >
            Draft ({draftCount})
          </button>
          <button
            className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors
              ${selectedTab === "in_queue"
                ? "border-slate-blue bg-white text-slate-blue shadow-sm z-10"
                : "border-transparent bg-slate-blue text-white hover:bg-slate-blue/90"}
            `}
            onClick={() => setSelectedTab("in_queue")}
          >
            In queue ({inQueueCount})
          </button>
          <button
            className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors
              ${selectedTab === "in_progress"
                ? "border-slate-blue bg-white text-slate-blue shadow-sm z-10"
                : "border-transparent bg-slate-blue text-white hover:bg-slate-blue/90"}
            `}
            onClick={() => setSelectedTab("in_progress")}
          >
            In progress ({inProgressCount})
          </button>
          <button
            className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors
              ${selectedTab === "complete"
                ? "border-slate-blue bg-white text-slate-blue shadow-sm z-10"
                : "border-transparent bg-slate-blue text-white hover:bg-slate-blue/90"}
            `}
            onClick={() => setSelectedTab("complete")}
          >
            Complete ({completeCount})
          </button>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">All types</option>
          <option value="service">Service review</option>
          <option value="product">Product review</option>
          <option value="event">Events & spaces</option>
          <option value="video">Video testimonial</option>
          <option value="photo">Photo + testimonial</option>
        </select>
      </div>
      {/* Batch Actions */}
      {selectedPages.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected
            </span>
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value as PromptPage["status"])}
              className="rounded-md border-gray-300 text-sm"
            >
              <option value="in_queue">In queue</option>
              <option value="in_progress">In progress</option>
              <option value="complete">Complete</option>
              <option value="draft">Draft</option>
            </select>
            <button
              onClick={handleBatchStatusUpdate}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
            >
              Update Status
            </button>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}
      {/* Table */}
      <div className="overflow-x-auto shadow sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="relative w-12 px-3 py-3.5">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  checked={selectedPages.length === filteredPromptPages.length && filteredPromptPages.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100 group" onClick={() => handleSort("first_name")}>First {sortField === "first_name" ? (sortDirection === "asc" ? "↑" : "↓") : <span className="text-xs">↕</span>}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100 group" onClick={() => handleSort("last_name")}>Last {sortField === "last_name" ? (sortDirection === "asc" ? "↑" : "↓") : <span className="text-xs">↕</span>}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100 group" onClick={() => handleSort("review_type")}>Type {sortField === "review_type" ? (sortDirection === "asc" ? "↑" : "↓") : <span className="text-xs">↕</span>}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Edit</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">Send</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accessiblePromptPages.map((page, index) => (
              <tr key={page.id} className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                <td className="relative w-12 px-3 py-4">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    checked={selectedPages.includes(page.id)}
                    onChange={(e) => handleSelectPage(page.id, e.target.checked)}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{page.first_name || ""}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{page.last_name || ""}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 capitalize">
                  {page.review_type === "service" && "Service"}
                  {page.review_type === "photo" && "Photo"}
                  {page.review_type === "video" && "Video"}
                  {page.review_type === "event" && "Event"}
                  {page.review_type === "product" && "Product"}
                  {!["service", "photo", "video", "event", "product"].includes(page.review_type || "") && (page.review_type ? page.review_type.charAt(0).toUpperCase() + page.review_type.slice(1) : "Service")}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm flex gap-2 items-center">
                  <div className="mt-[6px] flex gap-2">
                    <Link href={`/r/${page.slug}`} className="text-slate-blue underline hover:text-slate-blue/80 hover:underline">View</Link>
                    {page.slug && (
                      <Link
                        href={page.is_universal
                          ? "/dashboard/edit-prompt-page/universal"
                          : `/dashboard/edit-prompt-page/${page.slug}`}
                        className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <select
                    value={page.status}
                    onChange={(e) => onStatusUpdate(page.id, e.target.value as PromptPage["status"])}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[page.status] || "bg-gray-100 text-gray-800"}`}
                  >
                    <option value="in_queue">In queue</option>
                    <option value="in_progress">In progress</option>
                    <option value="complete">Complete</option>
                    <option value="draft">Draft</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(page.created_at).toLocaleDateString()}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex flex-row gap-2 items-center justify-end">
                    {!page.is_universal && page.phone && (
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
                        onClick={() => {
                          const name = page.first_name || "[name]";
                          const businessName = business?.name || "[Business]";
                          const reviewUrl = `${window.location.origin}/r/${page.slug}`;
                          const message = `Hi ${name}, do you have 1-3 minutes to leave a review for ${businessName}? I have a review you can use and everything. Positive reviews really help small business get found online. Thanks so much! ${reviewUrl}`;
                          window.location.href = `sms:${page.phone}?&body=${encodeURIComponent(message)}`;
                        }}
                      >
                        Send SMS
                      </button>
                    )}
                    {!page.is_universal && page.email && (
                      <a
                        href={`mailto:${page.email}?subject=${encodeURIComponent("Quick Review Request")}&body=${encodeURIComponent(`Hi ${page.first_name || "[name]"}, do you have 1-3 minutes to leave a review for ${business?.name || "[Business]"}? I have a review you can use and everything. Positive reviews really help small business get found online. Thanks so much! ${window.location.origin}/r/${page.slug}`)}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
                      >
                        Send Email
                      </a>
                    )}
                    {!page.is_universal && (
                      <button
                        type="button"
                        className="inline-flex items-center px-2 py-1.5 bg-slate-blue text-white rounded hover:bg-slate-blue/80 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
                        title="Copy link"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/r/${page.slug}`);
                            setCopyLinkId(page.id);
                            setTimeout(() => setCopyLinkId(null), 2000);
                          } catch (err) {
                            alert("Could not copy to clipboard. Please copy manually.");
                          }
                        }}
                      >
                        <FaLink className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setQrModal({
                          open: true,
                          url: `${window.location.origin}/r/${page.slug}`,
                          clientName: page.first_name || "Customer",
                        });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-blue text-white rounded hover:bg-slate-blue/90 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                    >
                      <MdDownload size={22} color="#fff" />
                      QR code
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-red-600">Delete Prompt Pages</h3>
            <p className="mb-4 text-gray-600">
              You are about to delete {selectedPages.length} prompt page{selectedPages.length !== 1 ? "s" : ""}. This action cannot be undone.
            </p>
            <p className="mb-4 text-gray-600">Please type DELETE in the box below to continue.</p>
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
                className={`px-4 py-2 rounded ${deleteConfirmation === "DELETE" ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* QR Code Modal - Now using reusable component */}
      <QRCodeModal
        isOpen={qrModal?.open || false}
        onClose={() => setQrModal(null)}
        url={qrModal?.url || ""}
        clientName={qrModal?.clientName || ""}
        logoUrl={qrModal?.logoUrl}
      />
    </div>
  );
} 