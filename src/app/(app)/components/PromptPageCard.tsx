import React, { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { PromptPage } from "./PromptPagesTable";
import CommunicationButtons from "./communication/CommunicationButtons";

interface PromptPageCardProps {
  page: PromptPage;
  business: any;
  isDragging?: boolean;
}

export default function PromptPageCard({
  page,
  business,
  isDragging = false,
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
        bg-white/10 backdrop-blur-lg border border-white/30 rounded-lg shadow-lg
        transition-all duration-200 mb-3 cursor-pointer
        ${isDragging ? "shadow-2xl rotate-2 scale-105" : "hover:shadow-xl hover:bg-white/20"}
        ${isExpanded ? "p-4" : "p-3"}
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Collapsed State - Always Visible */}
      <div className="space-y-2">
        {/* Contact Name */}
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-gray-900 truncate flex-1">
            {page.first_name || page.last_name
              ? `${page.first_name || ""} ${page.last_name || ""}`.trim()
              : "Unnamed Contact"}
          </h3>
          <Link
            href={
              page.is_universal
                ? "/dashboard/edit-prompt-page/universal"
                : `/dashboard/edit-prompt-page/${page.slug}`
            }
            onClick={(e) => e.stopPropagation()}
            className="text-slate-blue hover:text-slate-blue/80 text-xs underline ml-2 flex-shrink-0"
          >
            Edit
          </Link>
        </div>

        {/* Review Type Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-800 border border-blue-300/30">
            {reviewTypeDisplay}
          </span>
          <span className="text-xs text-gray-600">
            {new Date(page.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Contact Methods */}
        <div className="flex items-center gap-2 text-gray-700">
          {page.email && (
            <Icon name="MdEmail" size={16} className="text-gray-600" />
          )}
          {page.phone && (
            <Icon name="MdPhone" size={16} className="text-gray-600" />
          )}
          {!page.email && !page.phone && (
            <span className="text-xs text-gray-400">No contact info</span>
          )}
        </div>
      </div>

      {/* Expanded State - Additional Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
          {/* Contact Details */}
          {(page.email || page.phone) && (
            <div className="space-y-1 text-sm">
              {page.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Icon name="MdEmail" size={14} />
                  <span className="truncate">{page.email}</span>
                </div>
              )}
              {page.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Icon name="MdPhone" size={14} />
                  <span>{page.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Communication Buttons */}
          {(page.phone || page.email) && (
            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              <CommunicationButtons
                contact={{
                  id: page.contact_id || page.id,
                  first_name: page.first_name || page.contacts?.first_name || "",
                  last_name: page.last_name || page.contacts?.last_name || "",
                  email: page.email || page.contacts?.email,
                  phone: page.phone || page.contacts?.phone,
                }}
                promptPage={{
                  id: page.id,
                  slug: page.slug,
                  status: page.status,
                  client_name: `${page.first_name || ""} ${
                    page.last_name || ""
                  }`.trim(),
                  location: business?.name,
                }}
                className="flex gap-2"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-purple-500/20 backdrop-blur-sm text-purple-800 rounded hover:bg-purple-500/30 text-sm font-medium shadow border border-white/30"
            >
              <Icon name={copyLinkSuccess ? "MdCheck" : "FaLink"} size={14} />
              {copyLinkSuccess ? "Copied!" : "Copy Link"}
            </button>
            <Link
              href={`/r/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-amber-500/20 backdrop-blur-sm text-amber-800 rounded hover:bg-amber-500/30 text-sm font-medium shadow border border-white/30"
            >
              <Icon name="MdOpenInNew" size={14} />
              View Page
            </Link>
          </div>

          {/* Contact Link */}
          {(page.contacts || page.contact_id) && (
            <Link
              href="/dashboard/contacts"
              onClick={(e) => e.stopPropagation()}
              className="block text-center text-xs text-slate-blue hover:text-slate-blue/80 underline"
            >
              View in Contacts
            </Link>
          )}
        </div>
      )}

      {/* Expand/Collapse Indicator */}
      <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-center">
        <Icon
          name={isExpanded ? "MdExpandLess" : "MdExpandMore"}
          size={20}
          className="text-gray-600"
        />
      </div>
    </div>
  );
}
