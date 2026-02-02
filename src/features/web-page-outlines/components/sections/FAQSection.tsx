"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import HelpBubble from "@/components/ui/HelpBubble";
import type { FAQItem } from "../../types";

interface FAQSectionProps {
  data: FAQItem[];
}

export default function FAQSection({ data }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="py-6">
      <div className="flex items-center gap-1.5 mb-5">
        <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
          Frequently asked questions
        </span>
        <HelpBubble
          tooltip="FAQ sections can trigger rich snippets in Google search results, increasing visibility and click-through rates."
          label="Learn about FAQ rich snippets"
          size="sm"
        />
      </div>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden bg-white/70 backdrop-blur-sm border border-white/40 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/40 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              aria-expanded={openIndex === i}
            >
              <span className="font-medium text-gray-900 pr-4 text-[15px]">
                {item.question}
              </span>
              <Icon
                name={openIndex === i ? "FaChevronUp" : "FaChevronDown"}
                size={12}
                className="text-gray-400 flex-shrink-0"
              />
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100/60 pt-3">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
