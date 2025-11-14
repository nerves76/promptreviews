import React, { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import CommunicationButtons from "./communication/CommunicationButtons";
import ActivityTimeline from "./ActivityTimeline";
import type { PromptPage } from "./PromptPagesTable";

interface PromptPageDetailsPanelProps {
  page: PromptPage;
  business?: any;
  onClose?: () => void;
  onLocalStatusUpdate?: (pageId: string, newStatus: PromptPage["status"], lastContactAt?: string | null) => void;
}

export default function PromptPageDetailsPanel({
  page,
  business,
  onClose,
  onLocalStatusUpdate,
}: PromptPageDetailsPanelProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const contactForShare = {
    id: page.contact_id || page.id,
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
    client_name: `${page.first_name || ""} ${page.last_name || ""}`.trim() || page.client_name,
    location: page.location || business?.name,
  };

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
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <p className="text-xs uppercase text-gray-500">Prompt Page</p>
          <h2 className="text-xl font-semibold text-gray-900">
            {page.first_name || page.last_name
              ? `${page.first_name || ""} ${page.last_name || ""}`.trim()
              : "Unnamed Contact"}
          </h2>
          {(page.contacts?.business_name || page.business_name) && (
            <p className="text-sm text-gray-600">
              {page.contacts?.business_name || page.business_name}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition"
            aria-label="Close details"
          >
            <Icon name="FaTimes" size={18} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Icon name="FaRegListAlt" size={12} />
          {reviewTypeDisplay}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 capitalize">
          <Icon name="FaRegClock" size={12} />
          {page.status.replace("_", " ")}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white text-gray-700 border border-gray-200">
          <Icon name="FaCalendarAlt" size={12} />
          Created {new Date(page.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {(page.phone || page.email || page.contacts || page.contact_id) && (
          <section className="space-y-3">
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
            {(page.contacts || page.contact_id) && (
              <Link
                href="/dashboard/contacts"
                className="inline-flex items-center gap-1 text-xs text-slate-blue hover:text-slate-blue/80 underline"
              >
                <Icon name="FaExternalLinkAlt" size={10} />
                View in Contacts
              </Link>
            )}
          </section>
        )}

        <section className="space-y-3">
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
              <Icon name="FaPen" size={12} />
              Edit page
            </Link>
            <Link
              href={`/r/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-blue hover:text-slate-blue/80 underline"
            >
              <Icon name="FaExternalLinkAlt" size={12} />
              View live
            </Link>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-medium"
            >
              <Icon name={copySuccess ? "FaCheck" : "FaLink"} size={12} />
              {copySuccess ? "Link copied" : "Copy link"}
            </button>
          </div>
          {hasContactInfo && (
            <div className="flex flex-wrap gap-3">
              <CommunicationButtons
                contact={contactForShare}
                promptPage={promptPageShareContext}
                singleButton={true}
                buttonText="Share"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 text-sm font-medium shadow"
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

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Activity</h3>
          <ActivityTimeline
            promptPageId={page.id}
            accountId={page.account_id}
            contactId={page.contact_id}
          />
        </section>
      </div>
    </div>
  );
}
