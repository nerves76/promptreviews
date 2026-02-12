"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import HelpBubble from "@/components/ui/HelpBubble";
import type { SEOMetadata } from "../types";

interface SEOMetadataPanelProps {
  seo: SEOMetadata;
}

export default function SEOMetadataPanel({ seo }: SEOMetadataPanelProps) {
  const [titleCopied, setTitleCopied] = useState(false);
  const [descCopied, setDescCopied] = useState(false);

  const copyText = async (
    text: string,
    setter: (v: boolean) => void
  ) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const titleLen = seo.pageTitle?.length || 0;
  const titleColor =
    titleLen <= 60 ? "text-green-600" : "text-red-600";

  const metaLen = seo.metaDescription?.length || 0;
  const metaColor =
    metaLen >= 150 && metaLen <= 160
      ? "text-green-600"
      : metaLen > 160
        ? "text-red-600"
        : "text-amber-500";

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-white/40 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <Icon name="FaSearch" size={14} className="text-slate-blue" />
        <h3 className="font-semibold text-gray-900">SEO metadata</h3>
        <HelpBubble
          tooltip="These are the title and description that appear in search engine results. Copy them into your CMS or page builder."
          label="Learn about SEO metadata"
          size="sm"
        />
      </div>

      {/* Content — side by side on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Page title */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-1 mb-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Page title
            </label>
            <HelpBubble
              tooltip="Page titles use dashes as separators (not bars) for a cleaner look. Keep under 60 characters."
              label="Learn about page titles"
              size="sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
            <p className="text-sm text-gray-900 flex-1">{seo.pageTitle}</p>
            <button
              type="button"
              onClick={() => copyText(seo.pageTitle, setTitleCopied)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-slate-blue transition-colors"
              aria-label="Copy page title"
            >
              <Icon name={titleCopied ? "FaCheck" : "FaCopy"} size={12} />
            </button>
          </div>
          <span className={`text-xs mt-1.5 inline-block ${titleColor}`}>
            {titleLen}/60 characters
            {titleLen > 60 && " (too long)"}
          </span>
        </div>

        {/* Meta description */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-1 mb-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Meta description
            </label>
            <HelpBubble
              tooltip="Meta descriptions should be 150-160 characters and include your keyword. This appears in search results."
              label="Learn about meta descriptions"
              size="sm"
            />
          </div>
          <div className="flex items-start gap-2 bg-gray-50 rounded-md px-3 py-2">
            <p className="text-sm text-gray-900 flex-1">{seo.metaDescription}</p>
            <button
              type="button"
              onClick={() => copyText(seo.metaDescription, setDescCopied)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-slate-blue transition-colors"
              aria-label="Copy meta description"
            >
              <Icon name={descCopied ? "FaCheck" : "FaCopy"} size={12} />
            </button>
          </div>
          <span className={`text-xs mt-1.5 inline-block ${metaColor}`}>
            {metaLen}/160 characters
            {metaLen < 150 && " (too short)"}
            {metaLen > 160 && " (too long)"}
          </span>
        </div>
      </div>
    </div>
  );
}
