import React, { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import CommunicationButtons from "./communication/CommunicationButtons";
import ActivityTimeline from "./ActivityTimeline";
import type { PromptPage } from "./PromptPagesTable";
import type { WMUserInfo } from "@/types/workManager";
import { apiClient } from "@/utils/apiClient";

interface PromptPageDetailsPanelProps {
  page: PromptPage;
  business?: any;
  onClose?: () => void;
  onLocalStatusUpdate?: (pageId: string, newStatus: PromptPage["status"], lastContactAt?: string | null) => void;
  accountUsers?: WMUserInfo[];
  onAssigneeUpdate?: (pageId: string, assignedTo: string | null) => void;
}

export default function PromptPageDetailsPanel({
  page,
  business,
  onClose,
  onLocalStatusUpdate,
  accountUsers,
  onAssigneeUpdate,
}: PromptPageDetailsPanelProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [assigneeLoading, setAssigneeLoading] = useState(false);

  const contactForShare = {
    id: page.contact_id || page.contacts?.id || '', // Use contact_id or joined contacts.id
    first_name: page.first_name || page.contacts?.first_name || "",
    last_name: page.last_name || page.contacts?.last_name || "",
    email: page.email || page.contacts?.email,
    phone: page.phone || page.contacts?.phone,
  };

  const promptPageShareContext = {
    id: page.id,
    slug: page.slug,
    status: page.status,
    account_id: page.account_id,
    client_name: `${page.first_name || ""} ${page.last_name || ""}`.trim() || page.client_name || undefined,
    location: page.location || business?.name,
  };

  // Show communication buttons if there's contact info (email or phone)
  const hasContactInfo = Boolean(contactForShare.email || contactForShare.phone);

  const reviewTypeDisplay =
    page.review_type === "service"
      ? "Service"
      : page.review_type === "photo"
      ? "Photo"
      : page.review_type === "video"
      ? "Video"
      : page.review_type === "event"
      ? "Event"
      : page.review_type === "product"
      ? "Product"
      : page.review_type
      ? page.review_type.charAt(0).toUpperCase() + page.review_type.slice(1)
      : "Service";

  const handleAssigneeChange = async (newAssignedTo: string | null) => {
    setAssigneeLoading(true);
    try {
      await apiClient.patch('/prompt-pages/assign', {
        id: page.id,
        assigned_to: newAssignedTo,
      });
      onAssigneeUpdate?.(page.id, newAssignedTo);
    } catch (err) {
      console.error('Failed to update assignee:', err);
    } finally {
      setAssigneeLoading(false);
    }
  };

  const currentAssignee = accountUsers?.find(u => u.id === page.assigned_to);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/r/${page.slug}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert("Could not copy to clipboard. Please copy manually.");
    }
  };

  return (
    <div className="flex flex-col h-full backdrop-blur-xl shadow-2xl">
      {/* Close button */}
      {onClose && (
        <div className="flex justify-end px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white hover:text-white/80 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close details"
          >
            <Icon name="FaTimes" size={18} />
          </button>
        </div>
      )}

      {/* Header section on glass card */}
      <div className="mx-4 p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Prompt Page</p>
            <h2 className="text-xl font-semibold text-gray-900">
              {page.first_name || page.last_name
                ? `${page.first_name || ""} ${page.last_name || ""}`.trim()
                : "Unnamed Contact"}
            </h2>
            {(page.contacts?.business_name || page.business_name) && (
              <p className="text-sm text-gray-600 mt-0.5">
                {page.contacts?.business_name || page.business_name}
              </p>
            )}
          </div>
          {page.contact_id && (
            <Link
              href={`/dashboard/contacts?contactId=${page.contact_id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-blue bg-slate-blue/10 hover:bg-slate-blue/20 rounded-lg transition-colors whitespace-nowrap"
            >
              <Icon name="FaUser" size={12} />
              Go to contact
            </Link>
          )}
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
            <Icon name="FaFileAlt" size={12} />
            {reviewTypeDisplay}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 capitalize whitespace-nowrap">
            <Icon name="FaClock" size={12} />
            {page.status.replace("_", " ")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white text-gray-700 border border-gray-200 whitespace-nowrap">
            <Icon name="FaCalendarAlt" size={12} />
            Created {new Date(page.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {(page.phone || page.email || page.contacts || page.contact_id) && (
          <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {(page.contacts?.business_name || page.business_name) && (
                <div className="flex items-center gap-2">
                  <Icon name="FaBuilding" size={12} className="text-gray-500" />
                  <span>{page.contacts?.business_name || page.business_name}</span>
                </div>
              )}
              {page.email && (
                <div className="flex items-center gap-2">
                  <Icon name="FaEnvelope" size={12} className="text-gray-500" />
                  <span>{page.email}</span>
                </div>
              )}
              {page.phone && (
                <div className="flex items-center gap-2">
                  <Icon name="FaPhone" size={12} className="text-gray-500" />
                  <span>{page.phone}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Assigned to section */}
        {accountUsers && accountUsers.length > 0 && (
          <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Assigned to</h3>
            <div className="flex items-center gap-3">
              <select
                value={page.assigned_to || ''}
                onChange={(e) => handleAssigneeChange(e.target.value || null)}
                disabled={assigneeLoading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 disabled:opacity-50"
                aria-label="Assign team member"
              >
                <option value="">No one assigned</option>
                {accountUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                  </option>
                ))}
              </select>
              {assigneeLoading && (
                <Icon name="FaSpinner" size={14} className="animate-spin text-gray-500" />
              )}
            </div>
            {currentAssignee && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Icon name="FaUser" size={12} className="text-gray-500" />
                <span>
                  {[currentAssignee.first_name, currentAssignee.last_name].filter(Boolean).join(' ') || currentAssignee.email}
                </span>
              </div>
            )}
          </section>
        )}

        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Prompt Page
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={
                page.is_universal
                  ? "/dashboard/edit-prompt-page/universal"
                  : `/dashboard/edit-prompt-page/${page.slug}`
              }
              className="inline-flex items-center gap-1 text-slate-blue hover:text-slate-blue/80 underline"
            >
              <Icon name="FaEdit" size={12} />
              Edit page
            </Link>
            <Link
              href={`/r/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-blue hover:text-slate-blue/80 underline"
            >
              <Icon name="FaLink" size={12} />
              View live
            </Link>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-slate-blue hover:text-slate-blue/80 underline"
            >
              <Icon name={copySuccess ? "FaCheck" : "FaCopy"} size={12} className="flex-shrink-0" />
              {copySuccess ? "Link copied" : "Copy link"}
            </button>
          </div>
          {hasContactInfo && (
            <div className="flex flex-wrap gap-3">
              <CommunicationButtons
                contact={contactForShare}
                promptPage={promptPageShareContext}
                singleButton={true}
                buttonText="Send email or text"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 text-sm font-medium shadow whitespace-nowrap"
                onStatusUpdated={(newStatus) => {
                  onLocalStatusUpdate?.(page.id, newStatus as PromptPage["status"]);
                }}
                onContactLogged={(timestamp, newStatus) => {
                  onLocalStatusUpdate?.(page.id, newStatus as PromptPage["status"], timestamp);
                }}
              />
            </div>
          )}
        </section>

        <section className="p-5 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Activity</h3>
          {page.account_id && (
            <ActivityTimeline
              promptPageId={page.id}
              accountId={page.account_id}
              contactId={page.contact_id}
            />
          )}
        </section>
      </div>
    </div>
  );
}
