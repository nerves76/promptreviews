import React, { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { PromptPage } from "./PromptPagesTable";
import CommunicationButtons from "./communication/CommunicationButtons";
import ActivityTimeline from "./ActivityTimeline";

interface PromptPageCardProps {
  page: PromptPage;
  business: any;
  isDragging?: boolean;
  onLocalStatusUpdate?: (pageId: string, newStatus: PromptPage["status"]) => void;
}

export default function PromptPageCard({
  page,
  business,
  isDragging = false,
  onLocalStatusUpdate,
}: PromptPageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/r/${page.slug}`
      );
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2000);
    } catch (err) {
      alert("Could not copy to clipboard. Please copy manually.");
    }
  };

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
    client_name: `${page.first_name || ""} ${page.last_name || ""}`.trim() || page.client_name,
    location: page.location || business?.name,
    account_id: page.account_id,
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

  return (
    <div
      className={`
        bg-white/95 backdrop-blur-lg border border-gray-200 rounded-lg shadow-lg
        transition-all duration-200 mb-3 cursor-pointer
        ${isDragging ? "shadow-2xl rotate-2 scale-105" : "hover:shadow-xl hover:bg-white"}
        ${isExpanded ? "p-4" : "p-3"}
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Collapsed State - Always Visible */}
      <div className="space-y-2">
        {/* Contact Name and Business */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {page.first_name || page.last_name
                ? `${page.first_name || ""} ${page.last_name || ""}`.trim()
                : "Unnamed Contact"}
            </h3>
            {(page.contacts?.business_name || page.business_name) && (
              <p className="text-xs text-gray-600 truncate mt-0.5">
                {page.contacts?.business_name || page.business_name}
              </p>
            )}
          </div>
        </div>

        {/* Review Type Badge and Date */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-800 border border-blue-300/30">
            {reviewTypeDisplay}
          </span>
          <span className="text-xs text-gray-600">
            Created: {new Date(page.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Expanded State - Organized Sections */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/20 space-y-4">
          {/* Contact Section */}
          {(page.phone || page.email || page.contacts || page.contact_id) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Contact
              </h4>
              <div className="pl-5 space-y-2">
                {/* Contact Details */}
                <div className="space-y-1 text-xs text-gray-700">
                  {(page.contacts?.business_name || page.business_name) && (
                    <div className="flex items-center gap-2">
                      <Icon name="FaBuilding" size={10} className="text-gray-500" />
                      <span className="truncate">{page.contacts?.business_name || page.business_name}</span>
                    </div>
                  )}
                  {page.email && (
                    <div className="flex items-center gap-2">
                      <Icon name="FaEnvelope" size={10} className="text-gray-500" />
                      <span className="truncate">{page.email}</span>
                    </div>
                  )}
                  {page.phone && (
                    <div className="flex items-center gap-2">
                      <Icon name="FaPhone" size={10} className="text-gray-500" />
                      <span>{page.phone}</span>
                    </div>
                  )}
                </div>

                {/* Contact Link */}
                {(page.contacts || page.contact_id) && (
                  <Link
                    href="/dashboard/contacts"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-slate-blue hover:text-slate-blue/80 underline"
                  >
                    <Icon name="FaExternalLinkAlt" size={10} />
                    View in Contacts
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Prompt Page Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Prompt Page
            </h4>
            <div className="pl-5 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <Link
                  href={
                    page.is_universal
                      ? "/dashboard/edit-prompt-page/universal"
                      : `/dashboard/edit-prompt-page/${page.slug}`
                  }
                  className="text-slate-blue hover:text-slate-blue/80 underline"
                >
                  Edit
                </Link>
                <span className="text-gray-400">/</span>
                <Link
                  href={`/r/${page.slug}`}
                  target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-blue hover:text-slate-blue/80 underline"
                >
                  View
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasContactInfo && (
                  <CommunicationButtons
                    contact={contactForShare}
                    promptPage={promptPageShareContext}
                    singleButton={true}
                    buttonText="Share"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 text-xs font-semibold shadow"
                    onStatusUpdated={(newStatus) => {
                      onLocalStatusUpdate?.(page.id, newStatus as PromptPage["status"]);
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCopyLink();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-xs font-semibold shadow"
                >
                  <Icon name={copyLinkSuccess ? "FaCheck" : "FaLink"} size={12} />
                  {copyLinkSuccess ? "Link copied!" : "Copy link"}
                </button>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Activity
            </h4>
            <div className="pl-5" onClick={(e) => e.stopPropagation()}>
              <ActivityTimeline
                promptPageId={page.id}
                accountId={page.account_id}
                contactId={page.contact_id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Expand/Collapse Indicator */}
      <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-center">
        <Icon
          name={isExpanded ? "FaChevronUp" : "FaChevronDown"}
          size={16}
          className="text-gray-600"
        />
      </div>
    </div>
  );
}
