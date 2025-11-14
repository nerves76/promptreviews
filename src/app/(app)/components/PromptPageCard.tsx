import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Icon from "@/components/Icon";
import { PromptPage } from "./PromptPagesTable";

interface PromptPageCardProps {
  page: PromptPage;
  business: any;
  isDragging?: boolean;
  onOpen?: (page: PromptPage) => void;
}

export default function PromptPageCard({
  page,
  business,
  isDragging = false,
  onOpen,
}: PromptPageCardProps) {
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

  const handleOpen = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onOpen?.(page);
  };

  const lastContactText = page.last_contact_at
    ? formatDistanceToNow(new Date(page.last_contact_at), { addSuffix: true })
    : null;

  return (
    <div
      className={`
        group relative bg-white/95 backdrop-blur-lg border border-gray-200 rounded-lg shadow-lg
        transition-all duration-200 mb-3
        ${isDragging ? "shadow-2xl rotate-2 scale-105" : "hover:shadow-xl hover:bg-white"}
        p-4 cursor-grab
      `}
    >
      <button
        type="button"
        onClick={handleOpen}
        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-white/80 text-slate-blue rounded shadow opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
      >
        <Icon name="FaArrowRight" size={10} />
        Open
      </button>

      <div className="space-y-2 pr-12">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {page.first_name || page.last_name
              ? `${page.first_name || ""} ${page.last_name || ""}`.trim()
              : "Unnamed Contact"}
          </h3>
          {page.contacts?.business_name ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 truncate">
              <Icon name="FaStore" size={10} />
              {page.contacts.business_name}
            </span>
          ) : (
            page.business_name && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 truncate">
                <Icon name="FaStore" size={10} />
                {page.business_name}
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`/r/${page.slug}`, "_blank", "noopener,noreferrer");
          }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium transition hover:bg-blue-100 group/card-link"
        >
          <Icon name="FaFileAlt" size={10} />
          <span className="truncate group-hover/card-link:hidden">{reviewTypeDisplay}</span>
          <span className="truncate hidden group-hover/card-link:inline">Visit prompt page</span>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <div className="inline-flex items-center gap-1 text-gray-500 truncate">
          <Icon name="FaClock" size={10} />
          <span className="truncate">
            {lastContactText ? `Last contact ${lastContactText}` : "Last contact: Not yet"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1 text-slate-blue hover:text-slate-blue/80 text-xs font-semibold md:hidden"
        >
          <Icon name="FaArrowRight" size={10} />
          Open
        </button>
      </div>
    </div>
  );
}
