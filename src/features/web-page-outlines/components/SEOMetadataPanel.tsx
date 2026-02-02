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

  const metaLen = seo.metaDescription?.length || 0;
  const metaColor =
    metaLen >= 150 && metaLen <= 160
      ? "text-green-600"
      : metaLen > 160
        ? "text-red-600"
        : "text-amber-500";

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-white/40 rounded-lg p-4 space-y-4 shadow-sm">
      <h3 className="font-semibold text-gray-900">SEO metadata</h3>

      {/* Page title */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <label className="text-sm font-medium text-gray-700">
            Page title
          </label>
          <HelpBubble
            tooltip="Page titles use dashes as separators (not bars) for a cleaner look. Keep under 60 characters."
            label="Learn about page titles"
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600 flex-1">{seo.pageTitle}</p>
          <button
            type="button"
            onClick={() => copyText(seo.pageTitle, setTitleCopied)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Copy page title"
          >
            <Icon name={titleCopied ? "FaCheck" : "FaCopy"} size={12} />
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {seo.pageTitle?.length || 0}/60 characters
        </span>
      </div>

      {/* Meta description */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <label className="text-sm font-medium text-gray-700">
            Meta description
          </label>
          <HelpBubble
            tooltip="Meta descriptions should be 150-160 characters and include your keyword. This appears in search results."
            label="Learn about meta descriptions"
            size="sm"
          />
        </div>
        <div className="flex items-start gap-2">
          <p className="text-sm text-gray-600 flex-1">{seo.metaDescription}</p>
          <button
            type="button"
            onClick={() => copyText(seo.metaDescription, setDescCopied)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Copy meta description"
          >
            <Icon name={descCopied ? "FaCheck" : "FaCopy"} size={12} />
          </button>
        </div>
        <span className={`text-xs ${metaColor}`}>
          {metaLen}/160 characters
          {metaLen < 150 && " (too short)"}
          {metaLen > 160 && " (too long)"}
        </span>
      </div>
    </div>
  );
}
