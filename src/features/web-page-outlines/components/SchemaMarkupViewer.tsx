"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import HelpBubble from "@/components/ui/HelpBubble";
import type { SEOMetadata } from "../types";

interface SchemaMarkupViewerProps {
  seo: SEOMetadata;
}

export default function SchemaMarkupViewer({ seo }: SchemaMarkupViewerProps) {
  const [showLocal, setShowLocal] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [localCopied, setLocalCopied] = useState(false);
  const [faqCopied, setFaqCopied] = useState(false);

  const copyJson = async (
    data: Record<string, unknown>,
    setter: (v: boolean) => void
  ) => {
    const wrapped = {
      "@context": "https://schema.org",
      ...data,
    };
    await navigator.clipboard.writeText(JSON.stringify(wrapped, null, 2));
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-white/40 rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-1">
        <h3 className="font-semibold text-gray-900">Schema markup (JSON-LD)</h3>
        <HelpBubble
          tooltip="Structured data helps search engines understand your content and can generate rich results like FAQ dropdowns."
          label="Learn about structured data"
          size="sm"
        />
      </div>

      {/* LocalBusiness */}
      <div className="border border-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setShowLocal(!showLocal)}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
          aria-expanded={showLocal}
        >
          <span className="text-sm font-medium text-gray-700">
            LocalBusiness
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyJson(seo.localBusinessSchema, setLocalCopied);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
              aria-label="Copy LocalBusiness schema"
            >
              <Icon name={localCopied ? "FaCheck" : "FaCopy"} size={11} />
            </button>
            <Icon
              name={showLocal ? "FaChevronUp" : "FaChevronDown"}
              size={10}
              className="text-gray-400"
            />
          </div>
        </button>
        {showLocal && (
          <pre className="px-3 pb-3 text-xs text-gray-600 overflow-x-auto bg-gray-50 rounded-b-lg">
            {JSON.stringify(seo.localBusinessSchema, null, 2)}
          </pre>
        )}
      </div>

      {/* FAQPage */}
      <div className="border border-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setShowFaq(!showFaq)}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
          aria-expanded={showFaq}
        >
          <span className="text-sm font-medium text-gray-700">FAQPage</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyJson(seo.faqPageSchema, setFaqCopied);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
              aria-label="Copy FAQPage schema"
            >
              <Icon name={faqCopied ? "FaCheck" : "FaCopy"} size={11} />
            </button>
            <Icon
              name={showFaq ? "FaChevronUp" : "FaChevronDown"}
              size={10}
              className="text-gray-400"
            />
          </div>
        </button>
        {showFaq && (
          <pre className="px-3 pb-3 text-xs text-gray-600 overflow-x-auto bg-gray-50 rounded-b-lg">
            {JSON.stringify(seo.faqPageSchema, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
