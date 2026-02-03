"use client";

import Icon from "@/components/Icon";
import { Tooltip } from "@/app/(app)/components/ui/Tooltip";
import HelpBubble from "@/components/ui/HelpBubble";
import type { HeroSection as HeroSectionType } from "../../types";

interface HeroSectionProps {
  data: HeroSectionType;
}

export default function HeroSection({ data }: HeroSectionProps) {
  return (
    <div
      className="relative px-8 sm:px-12 py-16 sm:py-20 text-center overflow-hidden min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex items-center justify-center border-b border-white/30"
    >
      {/* Decorative nav bar */}
      <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 sm:px-12 py-5">
        <Icon name="FaStar" size={18} className="text-white/90" />
        <div className="flex items-center gap-6 sm:gap-8">
          {["About", "Services", "Blog", "Contact"].map((item) => (
            <span
              key={item}
              className="text-white/70 text-sm font-medium cursor-default hover:text-white/90 transition-colors"
            >
              {item}
            </span>
          ))}
        </div>
      </nav>

      <div className="relative z-10 max-w-[620px] mx-auto">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <Tooltip content="It's usually best for your H1 to contain your primary keyword and clearly describe the page topic. Search engines tend to use this as a strong ranking signal.">
            <span className="text-xs font-mono text-white/80 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/20">
              H1
            </span>
          </Tooltip>
          <HelpBubble
            tooltip="It's usually best for your H1 to contain your primary keyword and clearly describe the page topic. Search engines tend to use this as a strong ranking signal."
            label="Learn about H1 tags"
            size="sm"
            className="opacity-80"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white mb-4 leading-tight">
          {data.h1}
        </h1>
        <p className="text-white/90 text-lg sm:text-xl leading-relaxed">
          {data.subCopy}
        </p>
      </div>
    </div>
  );
}
