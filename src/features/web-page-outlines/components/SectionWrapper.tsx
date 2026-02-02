"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import HelpBubble from "@/components/ui/HelpBubble";
import { Tooltip } from "@/app/(app)/components/ui/Tooltip";
import { copySectionText } from "../utils/clipboard";
import { SECTION_REGEN_COST } from "../services/credits";
import type { SectionKey, PageOutline } from "../types";

interface SectionWrapperProps {
  sectionKey: SectionKey;
  label: string;
  seoAnnotation?: string;
  helpTooltip?: string;
  helpLabel?: string;
  showLabel?: boolean;
  children: React.ReactNode;
  outline: PageOutline;
  outlineId: string;
  onRegenerate: (sectionKey: SectionKey) => Promise<void>;
  isRegenerating?: boolean;
}

export default function SectionWrapper({
  sectionKey,
  label,
  seoAnnotation,
  helpTooltip,
  helpLabel,
  showLabel = true,
  children,
  outline,
  onRegenerate,
  isRegenerating,
}: SectionWrapperProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = copySectionText(sectionKey, outline);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group pt-6">
      {/* Section header + action bar */}
      <div className="flex items-center justify-between pb-3 z-10">
        {/* Left: section label */}
        {showLabel ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
              {label}
            </span>
            {helpTooltip && (
              <HelpBubble
                tooltip={helpTooltip}
                label={helpLabel || `Learn about ${label}`}
                size="sm"
              />
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Right: action buttons */}
        <div className="flex items-center gap-1">
          {seoAnnotation && (
            <Tooltip content={seoAnnotation}>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/70 text-gray-700 backdrop-blur-sm border border-white/40 whitespace-nowrap cursor-help">
                <Icon name="FaLightbulb" size={10} />
                SEO tip
              </span>
            </Tooltip>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-white/90 border border-white/60 text-gray-700 hover:bg-white/90 hover:shadow-sm transition-all whitespace-nowrap"
            aria-label={`Copy ${label} section`}
          >
            <Icon name={copied ? "FaCheck" : "FaCopy"} size={10} />
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            type="button"
            onClick={() => onRegenerate(sectionKey)}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-white/90 border border-white/60 text-gray-700 hover:bg-white/90 hover:shadow-sm disabled:opacity-50 transition-all whitespace-nowrap"
            aria-label={`Regenerate ${label} section (${SECTION_REGEN_COST} credit)`}
          >
            <Icon
              name={isRegenerating ? "FaSpinner" : "FaRedo"}
              size={10}
              className={isRegenerating ? "animate-spin" : ""}
            />
            <span className="whitespace-nowrap">
              {isRegenerating ? "Regenerating..." : `Regenerate (${SECTION_REGEN_COST} cr)`}
            </span>
          </button>
        </div>
      </div>

      {/* Section content */}
      {children}
    </div>
  );
}
