import React, { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import QRCodeModal from "./QRCodeModal";

export interface PromptPage {
  id: string;
  slug: string;
  created_at: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  is_universal: boolean;
  review_type?: string;
  nfc_text_enabled?: boolean;
}

interface PublicPromptPagesTableProps {
  promptPages: PromptPage[];
  business: any;
  account: any;
  universalUrl: string;
  onDeletePages: (pageIds: string[]) => void;
  onCreatePromptPage?: () => void;
}

export default function PublicPromptPagesTable({
  promptPages,
  business,
  account,
  universalUrl,
  onDeletePages,
  onCreatePromptPage,
}: PublicPromptPagesTableProps) {
  // Table state
  const [selectedType, setSelectedType] = useState("");
  const [sortField, setSortField] = useState<"name" | "review_type" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [qrModal, setQrModal] = useState<{ open: boolean; url: string; clientName: string; logoUrl?: string; showNfcText?: boolean } | null>(null);
  const [copyLinkId, setCopyLinkId] = useState<string | null>(null);

  // Filtering and sorting
  const filteredPromptPages = promptPages.filter((page) => {
    if (page.is_universal) return false;
    if (selectedType && page.review_type !== selectedType) return false;
    return true;
  });

  const handleSort = (field: "name" | "review_type") => {
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

  const handleBatchDelete = () => {
    if (deleteConfirmation === "DELETE") {
      onDeletePages(selectedPages);
      setSelectedPages([]);
      setShowDeleteModal(false);
      setDeleteConfirmation("");
    }
  };

  const accessiblePromptPages = sortedPromptPages.filter((page) => {
    return page.slug;
  });

  return (
    <div className="space-y-4">
      {/* Filter and Table Container */}
      <div className="border border-gray-200 rounded-lg">
        {/* Filter dropdown */}
        <div className="flex justify-start p-4">
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
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="relative w-12 px-3 py-3.5">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    checked={selectedPages.length === filteredPromptPages.length && filteredPromptPages.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100" onClick={() => handleSort("name")}>Name {sortField === "name" ? (sortDirection === "asc" ? "↑" : "↓") : <span className="text-xs">↕</span>}</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100" onClick={() => handleSort("review_type")}>Type {sortField === "review_type" ? (sortDirection === "asc" ? "↑" : "↓") : <span className="text-xs">↕</span>}</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Edit</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">Share</th>
              </tr>
            </thead>
            <tbody>
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
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{page.name || "Unnamed"}</td>
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
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(page.created_at).toLocaleDateString()}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex flex-row gap-2 items-center justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center px-2 py-1.5 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
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
                        <Icon name="FaLink" className="w-4 h-4" size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQrModal({
                            open: true,
                            url: `${window.location.origin}/r/${page.slug}`,
                            clientName: page.name || "Customer",
                            logoUrl: business?.logo_print_url || business?.logo_url,
                            showNfcText: page?.nfc_text_enabled ?? false,
                          });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                      >
                        <Icon name="MdDownload" size={22} style={{ color: "#b45309" }} />
                        QR code
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Batch Actions */}
      {selectedPages.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type DELETE to confirm"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBatchDelete}
                disabled={deleteConfirmation !== "DELETE"}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* QR Code Modal */}
      {qrModal && (
        <QRCodeModal
          isOpen={qrModal.open}
          onClose={() => setQrModal(null)}
          url={qrModal.url}
          clientName={qrModal.clientName}
          logoUrl={qrModal.logoUrl}
          showNfcText={qrModal.showNfcText}
        />
      )}
    </div>
  );
} 